import os
import json
import re
from openai import OpenAI  # ✅ 保留新 SDK
from rest_framework.decorators import api_view, permission_classes, authentication_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from core.authentication import CustomJWTAuthentication
from django.conf import settings
from core.models import Users, Student
from django.db import connection
from rest_framework.views import APIView

# ✅ 初始化 OpenAI client

print(f"OPENAI_API_KEY: {settings.OPENAI_API_KEY}")
client = OpenAI(api_key=settings.OPENAI_API_KEY)

DB_SCHEMA_DESC = settings.DB_SCHEMA_DESCRIPTION


def get_user_info_from_db(user_id):
    """
    Fetch user information from the database based on the user_id.
    This will collect relevant information from various tables to build a comprehensive
    user profile for the AI assistant.
    """
    user_info = {}
    
    # Fetch basic user information
    try:
        user = Users.objects.get(user_id=user_id)
        user_info['user_id'] = user.user_id
        user_info['name'] = f"{user.first_name} {user.last_name}"
        user_info['username'] = user.username
        user_info['email'] = user.email
        user_info['user_type'] = user.user_type
        user_info['profile_info'] = user.profile_info
        
        # If the user is a student, fetch additional student-specific information
        if user.user_type == 'Student':
            # Get student progress data
            progress_records = Student_Progress.objects.filter(student_id=user_id)
            if progress_records.exists():
                user_info['progress'] = []
                for record in progress_records:
                    progress_data = {
                        'course_id': record.course_id,
                        'completed_questions': record.completed_questions,
                        'accuracy_rate': record.accuracy_rate,
                        'learning_goals': record.learning_goals
                    }
                    user_info['progress'].append(progress_data)
            
            # Get knowledge graph data
            knowledge_records = Knowledge_Graph.objects.filter(student_id=user_id)
            if knowledge_records.exists():
                user_info['knowledge_graph'] = []
                for record in knowledge_records:
                    knowledge_data = {
                        'weak_areas': record.weak_areas,
                        'suggestions': record.suggestions
                    }
                    user_info['knowledge_graph'].append(knowledge_data)
            
            # Get error log data
            error_records = Error_Log.objects.filter(student_id=user_id)
            if error_records.exists():
                user_info['error_logs'] = []
                for record in error_records:
                    error_data = {
                        'question_id': record.question_id,
                        'error_type': record.error_type,
                        'feedback': record.feedback
                    }
                    user_info['error_logs'].append(error_data)
            
            # Get enrollment and course information using raw SQL
            with connection.cursor() as cursor:
                cursor.execute("""
                    SELECT c.course_id, c.course_name, c.course_code, e.status, s.total_score, s.rank
                    FROM Course c
                    JOIN Enrollment e ON c.course_id = e.course_id
                    LEFT JOIN Score s ON c.course_id = s.course_id AND s.student_id = %s
                    WHERE e.student_id = %s
                """, [user_id, user_id])
                columns = [col[0] for col in cursor.description]
                courses = [dict(zip(columns, row)) for row in cursor.fetchall()]
                if courses:
                    user_info['courses'] = courses
                    
    except Users.DoesNotExist:
        user_info['error'] = f"User with ID {user_id} not found"
    except Exception as e:
        user_info['error'] = f"Error fetching user information: {str(e)}"
        
    return user_info

def clean_generated_sql(generated_sql: str) -> str:
    """Removes markdown code fences and leading/trailing whitespace."""
    cleaned = generated_sql.strip()
    # 1) 去除开头的 ```sql 或 ``` (可带换行)
    cleaned = re.sub(r'^```[a-zA-Z]*\n?', '', cleaned, flags=re.IGNORECASE)
    # 2) 去除结尾的 ```
    cleaned = re.sub(r'```$', '', cleaned, flags=re.IGNORECASE)
    return cleaned.strip()

class ChatbotAPIView(APIView):
    authentication_classes = [CustomJWTAuthentication]
    permission_classes = [IsAuthenticated]

    def _validate_and_prepare_sql(self, generated_sql, user_id):
        """
        Validates the AI-generated SQL and prepares it for execution.
        Includes cleaning of markdown fences.
        """
        # Clean the raw output from AI first
        cleaned_sql_text = clean_generated_sql(generated_sql)
        
        # Perform validation on the cleaned SQL
        cleaned_sql_upper = cleaned_sql_text.upper()
        
        # 1. Basic Keyword Check (Allow only SELECT)
        if not cleaned_sql_upper.startswith('SELECT'):
            print(f"Validation Failed: SQL does not start with SELECT. Original: '{generated_sql}', Cleaned: '{cleaned_sql_text}'")
            raise ValueError("Query generation failed: Only SELECT statements are allowed.")

        # 2. Disallow known dangerous keywords/patterns (Incomplete list!)
        dangerous_keywords = ['DELETE', 'UPDATE', 'INSERT', 'DROP', 'ALTER', 'TRUNCATE', ';', '--']
        # Check against the cleaned, upper-cased version for simplicity
        sql_tokens = re.split(r'\s+|\(|\)|\,|\'', cleaned_sql_upper) # Basic tokenization
        for keyword in dangerous_keywords:
            if keyword in sql_tokens:
                print(f"Validation Failed: Disallowed keyword '{keyword}' found.")
                raise ValueError(f"Query generation failed: Disallowed keyword '{keyword}' found.")

        # 3. Inject user_id constraint (Using placeholder replacement)
        if '{user_id}' not in cleaned_sql_text: # Check in the cleaned text
             # Corrected f-string syntax
             print(f"Validation Failed: Placeholder {{user_id}} not found in cleaned SQL: '{cleaned_sql_text}'") # <-- Correct syntax here
             raise ValueError("Query generation failed: Could not safely apply user scope. Ensure the AI includes '{user_id}'.")


        # Replace placeholder with actual user_id using parameterization
        # Perform replacement on the cleaned_sql_text, not the upper-cased version
        final_sql = cleaned_sql_text.replace('{user_id}', '%s')
        params = [user_id]

        print(f"Validated SQL: {final_sql}, Params: {params}")
        return final_sql, params

    def get_user_context(self, student_id):
        """获取与学生相关的上下文信息"""
        context_data = {}
        try:
            with connection.cursor() as cursor:
                # 获取最近课程 (简化版，可复用 dashboard 逻辑)
                cursor.execute("""
                    SELECT c.course_name, c.course_code
                    FROM Course c JOIN Enrollment e ON c.course_id = e.course_id
                    WHERE e.student_id = %s AND e.status = 'enrolled'
                    ORDER BY c.year DESC, c.term DESC LIMIT 3
                """, [student_id])
                courses = cursor.fetchall()
                if courses:
                    context_data['recent_courses'] = [{'name': row[0], 'code': row[1]} for row in courses]

                # 获取最近练习记录 (简化版)
                cursor.execute("""
                    SELECT e.title, se.is_correct, se.completed_at
                    FROM Student_Exercise se JOIN Exercise e ON se.exercise_id = e.exercise_id
                    WHERE se.student_id = %s
                    ORDER BY se.completed_at DESC LIMIT 3
                """, [student_id])
                exercises = cursor.fetchall()
                if exercises:
                    context_data['recent_exercises'] = [{'title': row[0], 'correct': row[1], 'time': row[2].strftime('%Y-%m-%d %H:%M')} for row in exercises]

        except Exception as e:
            print(f"获取用户 AI 上下文出错: {e}") # Log the error
        return context_data

    def post(self, request, *args, **kwargs):
        user_message = request.data.get('message')
        mode = request.data.get('mode', 'general')
        history = request.data.get('history', []) # Get chat history if provided
        user_id = request.user.user_id
        # Instructor context (if applicable, get selected student ID from frontend)
        selected_student_id_for_instructor = request.data.get('selected_student_id')

        target_user_id = user_id # Default to the logged-in user
        instructor_context = ""
        if request.user.user_type == 'Instructor' and selected_student_id_for_instructor:
             target_user_id = selected_student_id_for_instructor
             # You might want to fetch student details to add context
             instructor_context = f" (You are an instructor answering about student ID: {target_user_id})"

        if not user_message:
            return Response({"error": "Message cannot be empty."}, status=400)

        try:
            if mode == 'system':
                # === Step 1: Generate SQL Query ===
                print("AI Mode: System - Step 1: Generating SQL")
                sql_generation_prompt = f"""
                You are a SQL generation expert for the SmartSQL platform. Your task is to generate a **single, read-only SQL SELECT query** based on the provided database schema and user question{instructor_context}.

                **CRITICAL RULES - MUST FOLLOW:**
                0. Only use the exact table and column names that appear in the provided schema. 
                1. Generate ONLY the SQL query. No explanations, introductions, or markdown code fences (like ```sql). Just the raw SQL.
                2. The query MUST be read-only (SELECT only).
                3. **Case Sensitivity is VITAL**: You MUST use the exact table and column names as provided in the schema below. For example, use `Enrollment`, not `enrollments`. Do NOT change the casing.
                4. **User Scope**: If the question requires data specific to a user, you MUST include a `WHERE student_id = {{user_id}}` clause. Use the exact placeholder `{{user_id}}`. Check the schema to see which tables have `student_id`.
                5. Simplicity: Keep the query as simple as possible while still answering the question.
                6. Accuracy: Ensure the generated query is syntactically correct and logically answers the user's question based on the schema.

                **Database Schema (Use exact names provided, case-sensitive):**
                {DB_SCHEMA_DESC}

                **Example:**
                User Question: How many courses am I enrolled in?
                Generated SQL Query: SELECT COUNT(*) FROM Enrollment WHERE student_id = {{user_id}}

                **User's Question:**
                {user_message}

                **Generated SQL Query (Remember: exact names, case-sensitive, raw SQL only):**
                """

                completion_sql = client.chat.completions.create(
                    model="gpt-4o", # Or your preferred model
                    messages=[{"role": "user", "content": sql_generation_prompt}],
                    temperature=0.2, # Lower temperature for more deterministic SQL
                    max_tokens=150, # Limit output size
                    stop=["--", ";"] # Stop generation if it tries to add comments or multiple statements
                )
                generated_sql = completion_sql.choices[0].message.content.strip()
                print(f"AI Generated Raw SQL: {generated_sql}")

                if not generated_sql:
                    raise ValueError("AI did not generate an SQL query.")

                # === Step 2: Validate and Execute SQL ===
                print("AI Mode: System - Step 2: Validating and Executing SQL")
                validated_sql, params = self._validate_and_prepare_sql(generated_sql, target_user_id)

                query_results = []
                columns = []
                with connection.cursor() as cursor:
                    cursor.execute(validated_sql, params)
                    columns = [col[0] for col in cursor.description]
                    query_results = [dict(zip(columns, row)) for row in cursor.fetchall()]

                print(f"Query Results Count: {len(query_results)}")

                # === Step 3: Summarize Results ===
                print("AI Mode: System - Step 3: Summarizing Results")
                summarization_prompt = f"""
                You are a helpful AI assistant for the SmartSQL platform.
                The user asked the following question{instructor_context}:
                "{user_message}"

                To answer this, the following data was retrieved from the database:
                {json.dumps(query_results, indent=2, default=str)}

                Based **only** on the provided data, answer the user's question in a clear and concise natural language response.
                If the data is empty, state that the information wasn't found or isn't available. Do not make up information.
                """
                print(f"--- Summarization Prompt Start ---")
                print(summarization_prompt)
                print(f"--- Summarization Prompt End ---")

                # Include chat history for better conversational context in summarization
                messages_for_summary = [{"role": "system", "content": "You are summarizing database results to answer a user's question."}]
                # Add previous history if available
                # for msg in history: messages_for_summary.append(msg)
                messages_for_summary.append({"role": "user", "content": summarization_prompt})

                try:
                    completion_summary = client.chat.completions.create(
                        model="gpt-4o", # Use a more capable model for summarization if possible
                        messages=messages_for_summary
                    )
                    print(f"--- AI Summarization Raw Response Start ---")
                    print(completion_summary)
                    print(f"--- AI Summarization Raw Response End ---")
                    
                    if completion_summary.choices:
                        final_answer = completion_summary.choices[0].message.content
                    else:
                        final_answer = "AI could not generate a summary based on the data."
                        print("Warning: AI summarization returned no choices.")
                        
                except Exception as summary_e:
                    print(f"Error during AI Summarization call: {summary_e}")
                    # Return a specific error message if summarization fails
                    return Response({"error": "Failed to summarize the results from the database."}, status=500)

                print(f"--- Final Answer for Frontend Start ---")
                print(final_answer)
                print(f"--- Final Answer for Frontend End ---")
                return Response({"reply": final_answer})

            elif mode == 'general':
                # === Handle General SQL Questions ===
                print("AI Mode: General")
                general_prompt = "You are an AI assistant specialized in teaching SQL. Provide clear, concise answers to SQL questions."
                messages_for_general = [{"role": "system", "content": general_prompt}]
                # Add history
                # for msg in history: messages_for_general.append(msg)
                messages_for_general.append({"role": "user", "content": user_message})

                completion_general = client.chat.completions.create(
                    model="gpt-4o",
                    messages=messages_for_general
                )
                ai_response = completion_general.choices[0].message.content
                return Response({"reply": ai_response})

            else:
                 return Response({"error": "Invalid mode specified."}, status=400)

        except OpenAIError as e:
             print(f"OpenAI API Error: {e}")
             return Response({"error": f"AI service error: {e}"}, status=503)
        except ValueError as e: # Catch validation/generation errors
             print(f"Processing Error: {e}")
             return Response({"error": f"Could not process the request: {e}"}, status=400)
        except Exception as e:
            print(f"Chat API Error: {e}") # Log the full error
            # Provide a more generic error to the user
            return Response({"error": "An unexpected error occurred processing your request."}, status=500)

@api_view(['POST'])
@authentication_classes([CustomJWTAuthentication])
@permission_classes([IsAuthenticated])
def chat_api(request):
    """
    API endpoint for interacting with OpenAI's GPT model.
    
    Expected request format:
    {
        "messages": [
            {"role": "system", "content": "You are a helpful assistant."},
            {"role": "user", "content": "Hello, how are you?"}
        ]
    }
    """
    try:
        # Get data from request
        data = request.data
        messages = data.get('messages', [])
        
        # Validate the request
        if not messages:
            return Response(
                {"status": "error", "message": "No messages provided"}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Make sure the format is correct
        for msg in messages:
            if 'role' not in msg or 'content' not in msg:
                return Response(
                    {"status": "error", "message": "Invalid message format. Each message must have 'role' and 'content'"}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
        
        # Get current user information from the database
        user_id = request.user.user_id
        user_info = get_user_info_from_db(user_id)
        
        # Add user information to the system message
        system_message_found = False
        for msg in messages:
            if msg['role'] == 'system':
                system_message_found = True
                # Enhance the system message with user information
                msg['content'] = f"{msg['content']}\n\nUser Information: {json.dumps(user_info, indent=2)}"
                break
        
        # If no system message was found, add one with user information
        if not system_message_found:
            system_message = {
                "role": "system",
                "content": f"You are a helpful SQL learning assistant. Here is information about the current user: {json.dumps(user_info, indent=2)}"
            }
            messages.insert(0, system_message)
        
        # Call OpenAI API
        response = client.chat.completions.create(
            model="gpt-4o",  # You can also use "gpt-4" or other models
            messages=messages,
            max_tokens=1500,
            temperature=0.7,
        )
        
        # Extract the assistant's message from the response
        assistant_message = response.choices[0].message
        
        # Return the response
        return Response({
            "role": assistant_message.role,
            "content": assistant_message.content
        })
        
    except Exception as e:
        return Response(
            {"status": "error", "message": str(e)}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        ) 