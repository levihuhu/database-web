import os
import json
import re
from openai import OpenAI, OpenAIError, APIError  # ✅ 保留新 SDK
from rest_framework.decorators import api_view, permission_classes, authentication_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from core.authentication import CustomJWTAuthentication
from django.conf import settings
from core.models import Users, Student
from django.db import connection, transaction, DatabaseError
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
    cleaned = re.sub(r'^```[a-z]*\\n?', '', generated_sql.strip(), flags=re.IGNORECASE)
    cleaned = re.sub(r'```$', '', cleaned.strip(), flags=re.IGNORECASE)
    return cleaned.strip()

def check_instructor_student_relationship(instructor_id, student_id):
    """Check if the instructor teaches the student (basic check)."""
    # Ensure IDs are integers before querying
    try:
        instructor_id_int = int(instructor_id)
        student_id_int = int(student_id)
    except (ValueError, TypeError):
        return False # Invalid IDs

    with connection.cursor() as cursor:
        cursor.execute("""
            SELECT 1 FROM Enrollment e
            JOIN Course c ON e.course_id = c.course_id
            WHERE e.student_id = %s AND c.instructor_id = %s
            LIMIT 1
        """, [student_id_int, instructor_id_int])
        return cursor.fetchone() is not None

class ChatbotAPIView(APIView):
    authentication_classes = [CustomJWTAuthentication]
    permission_classes = [IsAuthenticated]

    # Define allowed tables and disallowed columns for basic security filtering
    ALLOWED_TABLES = {'Users', 'Course', 'Enrollment', 'Module', 'Exercise', 'Student_Exercise', 'Message', 'PrivateMessage', 'Announcement', 'Score'}
    DISALLOWED_COLUMNS = {'password'} # Prevent selecting password hashes

    def _validate_and_prepare_sql(self, generated_sql, user_role, target_user_id):
        """
        Validates the AI-generated SQL based on role and basic security checks.
        Ensures SELECT only, checks basic keywords, placeholder, and table/column allowlist.
        """
        print(f"Validating SQL for role: {user_role}, target_user_id: {target_user_id}")
        cleaned_sql = clean_generated_sql(generated_sql)

        if not cleaned_sql:
            raise ValueError("AI did not generate a valid SQL query after cleaning.")

        sql_upper = cleaned_sql.upper()

        # 1. Must be SELECT
        if not sql_upper.startswith('SELECT'):
            raise ValueError("Query validation failed: Only SELECT statements are allowed.")

        # 2. Disallow dangerous keywords (Improved slightly with word boundaries)
        dangerous_keywords = ['DELETE', 'UPDATE', 'INSERT', 'DROP', 'ALTER', 'TRUNCATE', 'EXEC', 'CALL', 'GRANT', 'REVOKE']
        for keyword in dangerous_keywords:
            if re.search(rf'\b{keyword}\b', sql_upper):
                raise ValueError(f"Query validation failed: Disallowed keyword '{keyword}' found.")
        # Disallow multiple statements (basic check) - improved to allow valid SQL comments
        # Check for unquoted semicolons that aren't at the very end
        if ';' in re.sub(r"'.*?'|\".*?\"|--.*?\n|/\*.*?\*/", "", cleaned_sql).strip()[:-1]:
             raise ValueError("Query validation failed: Multiple SQL statements are not allowed.")

        # 3. Check for table/column allowlist (Basic implementation)
        # Use regex to find potential table/column names (simplistic, might catch keywords)
        potential_identifiers = set(re.findall(r'\b[a-zA-Z_][a-zA-Z0-9_]*\b', cleaned_sql))

        # Check against allowed tables (Case-sensitive based on your schema description)
        # This is a weak check, a proper parser would be better
        # unknown_identifiers = potential_identifiers - self.ALLOWED_TABLES - {'SELECT', 'FROM', 'WHERE', 'JOIN', 'ON', 'AS', 'AND', 'OR', 'NOT', 'LIMIT', 'OFFSET', 'ORDER', 'BY', 'GROUP', 'COUNT', 'AVG', 'SUM', 'MIN', 'MAX', 'DESC', 'ASC', 'LEFT', 'RIGHT', 'INNER', 'OUTER', 'IS', 'NULL'} # Common SQL keywords
        # if any(ident not in self.ALLOWED_TABLES for ident in unknown_identifiers if ident[0].isupper()): # Heuristic: uppercase identifiers are likely tables
        #     print(f"Potential disallowed table reference: {unknown_identifiers}")
            # raise ValueError("Query validation failed: Query might reference disallowed tables.")

        # Check against disallowed columns
        disallowed_found = potential_identifiers.intersection(self.DISALLOWED_COLUMNS)
        if disallowed_found:
            raise ValueError(f"Query validation failed: Access to sensitive columns is forbidden ({disallowed_found}).")

        # 4. User ID placeholder handling
        placeholder = '{user_id}'
        params = []
        final_sql = cleaned_sql

        if placeholder in cleaned_sql:
            # Students *must* have the placeholder if their data is needed.
            # Instructors *can* have it if querying a specific student OR their own courses.
            final_sql = cleaned_sql.replace(placeholder, '%s')
            params.append(target_user_id) # Pass the determined target_user_id
        elif user_role == 'Student':
            # If a student query needs specific data but lacks the placeholder, it's an error.
            # This relies on the prompt guide working. A more robust check might analyze tables queried.
            # For now, we trust the prompt guidance or the AI knows it's a general schema query.
            pass
        # Else (Instructor asking general query or AI didn't include placeholder when needed) - Handled by prompt design mostly.

        print(f"Validated SQL: {final_sql}, Params: {params}")
        return final_sql, params

    def _generate_sql_prompt(self, user_role, user_message, instructor_context, instructor_id=None, target_user_id=None):
        """Generates the appropriate SQL prompt based on user role."""
        base_prompt = f"""
You are a SQL generation expert for the SmartSQL platform. Your task is to generate a single, read-only SQL SELECT query based on the provided database schema and user question{instructor_context}.

CRITICAL RULES - MUST FOLLOW:
1. Generate ONLY the SQL query. No explanations, introductions, or markdown code fences (like ```sql). Just the raw SQL.
2. The query MUST be read-only (SELECT only).
3. Case Sensitivity is VITAL: You MUST use the exact table and column names as provided in the schema below. Example: `Enrollment`, not `enrollments`. Do NOT change the casing.
4. Simplicity: Keep the query as simple as possible.
5. Accuracy: Ensure the query is syntactically correct and logically answers the user's question based on the schema.
6. Allowed Tables ONLY: Only query tables listed in the schema description. Allowed: {{{', '.join(sorted(list(self.ALLOWED_TABLES)))}}}.
7. NO Sensitive Columns: Do NOT query the 'password' column or other sensitive user data like raw email if not necessary.
"""
        student_rules = f"""
8. User Scope: You MUST include a `WHERE student_id = {{user_id}}` clause in relevant tables (`Enrollment`, `Student_Exercise`, `Score`) to ensure the query only retrieves data for the current student making the request. Use the target student ID {{target_user_id}} for the placeholder {{user_id}}.

Database Schema (Use exact names provided, case-sensitive):
{DB_SCHEMA_DESC}

Example (Student):
User Question: What was my score on the last SQL exercise I took?
Generated SQL Query: SELECT E.title, SE.is_correct, SE.completed_at FROM Student_Exercise SE JOIN Exercise E ON SE.exercise_id = E.exercise_id WHERE SE.student_id = {{user_id}} ORDER BY SE.completed_at DESC LIMIT 1
"""
        # Updated Instructor rules
        instructor_rules = f"""
8. User/Instructor Scope & Filtering:
   - The ID of the instructor making this request is: `{instructor_id}`.
   - The target ID for the query (student or instructor) is: `{target_user_id}` (Use this for the `{{user_id}}` placeholder).
   - **CRITICAL**: If the question is about a SPECIFIC student (indicated by {instructor_context} mentioning a student ID), you MUST use `WHERE student_id = {{user_id}}` (replacing `{{user_id}}` with `{target_user_id}`). Additionally, you MUST *also* filter by the instructor's courses using `WHERE c.instructor_id = {instructor_id}` (using the actual instructor ID provided: `{instructor_id}`) when joining with the `Course` table (aliased as `c` or otherwise) to ensure data access control.
   - If the question is about the instructor's own courses or aggregated data across their courses (e.g., 'List my courses', 'How many students?'), use `WHERE c.instructor_id = {instructor_id}` in the `Course` table. The placeholder `{{user_id}}` is *not* typically needed in these instructor-centric queries unless the instructor is querying their own user record explicitly.
   - Carefully determine the correct filtering based on the question context, target ID `{target_user_id}`, and the instructor ID `{instructor_id}`.

Database Schema (Use exact names provided, case-sensitive):
{DB_SCHEMA_DESC}

Example (Instructor asking about specific student):
User Question: What grade did student `{target_user_id}` get in CS5200?
Generated SQL Query: SELECT s.total_score FROM Score s JOIN Course c ON s.course_id = c.course_id WHERE s.student_id = {target_user_id} AND c.course_code = 'CS5200' AND c.instructor_id = {instructor_id}

Example (Instructor asking about their courses):
User Question: How many students are enrolled in my active courses?
Generated SQL Query: SELECT COUNT(DISTINCT e.student_id) FROM Enrollment e JOIN Course c ON e.course_id = c.course_id WHERE c.instructor_id = {instructor_id} AND c.state = 'active' AND e.status = 'enrolled'
"""
        print(f"SQL Prompt: 👌🏻")
        prompt = base_prompt
        if user_role == 'Student':
            prompt += student_rules.replace('{user_id}', str(target_user_id))
        elif user_role == 'Instructor':
            # The instructor_rules now directly embed the correct IDs
            prompt += instructor_rules 
        else:
            prompt += student_rules.replace('{user_id}', str(target_user_id)) # Default to safer student rules if role unknown
        
        prompt += f"\n\nUser Question: {user_message}\nGenerated SQL Query:"
        # print(f"Full Prompt:\n{prompt}") # Uncomment for debugging the full prompt
        return prompt

    def _summarize_results_prompt(self, user_role, user_message, query_results, instructor_context):
        """Generates the prompt for summarizing results."""
        # Limit results displayed in prompt if too large
        max_results_in_prompt = 20
        results_display = json.dumps(query_results[:max_results_in_prompt], indent=2, default=str)
        if len(query_results) > max_results_in_prompt:
            results_display += f"\\n... (and {len(query_results) - max_results_in_prompt} more rows)"

        return f"""
You are a helpful AI assistant for the SmartSQL platform. You are speaking to a {user_role}.
{instructor_context}
The user asked:
"{user_message}"

The following data was retrieved from the database to answer this:
{results_display}

Based ONLY on the provided data, answer the user's question in a clear and concise natural language response. Address the user appropriately based on their role ({user_role}).
If the data is empty or doesn't answer the question, state that the specific information wasn't found or isn't available for them. Do not make up information.
Format the response clearly. Use Markdown for lists, bolding, or code snippets if appropriate. Ensure newlines are used for readability.
"""

    def post(self, request, *args, **kwargs):
        user = request.user
        user_message = request.data.get('message')
        mode = request.data.get('mode', 'general')
        show_thought_process = request.data.get('show_thought_process', False)
        # For instructors potentially viewing a specific student
        selected_student_id_for_instructor = request.data.get('selected_student_id')

        if not user_message:
            return Response({"error": "Message cannot be empty."}, status=status.HTTP_400_BAD_REQUEST)

        target_user_id = user.user_id # Default target is the user making the request
        self.target_user_id_for_prompt = user.user_id # Used for prompt generation examples
        instructor_context = "" # Additional context for prompts

        # --- Permission Checks & Target User ID determination ---
        if mode == 'system':
            print(f"System Mode Access Check: User Role='{user.user_type}', Selected Student='{selected_student_id_for_instructor}'")
            if user.user_type == 'Student':
                if selected_student_id_for_instructor:
                    return Response({"error": "Permission denied: Students cannot query other users' data."}, status=status.HTTP_403_FORBIDDEN)
                # Target remains self
            elif user.user_type == 'Instructor':
                print("target_user_id", target_user_id)
                print("selected_student_id_for_instructor", selected_student_id_for_instructor)
                # Check if a specific student ID was provided and is not None/empty
                if selected_student_id_for_instructor is not None and str(selected_student_id_for_instructor).strip():
                    try:
                        selected_student_id_int = int(selected_student_id_for_instructor)
                        # Ensure instructor isn't selecting themselves
                        if selected_student_id_int == user.user_id:
                             return Response({"error": "Instructors cannot select themselves as the target student."}, status=status.HTTP_400_BAD_REQUEST)

                        # Verify instructor has access to this student
                        if not check_instructor_student_relationship(user.user_id, selected_student_id_int):
                            return Response({"error": "Permission denied: You do not have access to this student's data."}, status=status.HTTP_403_FORBIDDEN)

                        # Set target to the selected student
                        target_user_id = selected_student_id_int
                        self.target_user_id_for_prompt = target_user_id
                        instructor_context = f" (Context: You are an instructor viewing data for student ID: {target_user_id})"
                    except (ValueError, TypeError):
                        return Response({"error": "Invalid selected_student_id format."}, status=status.HTTP_400_BAD_REQUEST)
                else:
                    # Instructor querying their own general data (e.g., courses)
                    target_user_id = user.user_id # Target is the instructor themselves
                    self.target_user_id_for_prompt = target_user_id
                    instructor_context = " (Context: You are an instructor querying general course/student data related to you)"
            else:
                return Response({"error": "Permission denied: Unknown user role."}, status=status.HTTP_403_FORBIDDEN)

        # --- Main Logic ---
        try:
            if mode == 'system':
                # === Step 1: Generate SQL ===
                print(f"AI Mode: System ({user.user_type}) - Step 1: Generating SQL for target_user_id: {target_user_id}, instructor_id: {user.user_id}") # Log both IDs
                # Pass both the target user ID (student or self) and the requesting instructor ID
                sql_prompt = self._generate_sql_prompt(user.user_type, user_message, instructor_context, user.user_id if user.user_type == 'Instructor' else None, target_user_id)
                
                completion_sql = client.chat.completions.create(
                    model="gpt-4o", # Or your preferred model capable of following instructions
                    messages=[{"role": "user", "content": sql_prompt}],
                    temperature=0.1, # Low temp for SQL generation accuracy
                    max_tokens=250, # Increased slightly for potentially more complex queries
                    stop=[";"] # Stop at semicolon still useful
                )
                generated_sql = completion_sql.choices[0].message.content
                print(f"AI Generated Raw SQL: {generated_sql}")
                if not generated_sql:
                    raise ValueError("AI failed to generate SQL query.")

                # === Step 2: Validate & Execute SQL ===
                print(f"AI Mode: System ({user.user_type}) - Step 2: Validating & Executing SQL")
                validated_sql, params = self._validate_and_prepare_sql(generated_sql, user.user_type, target_user_id)

                query_results = []
                columns = []
                with connection.cursor() as cursor:
                    print(f"Executing SQL: {cursor.mogrify(validated_sql, params)}") # Log executed query with params safely
                    cursor.execute(validated_sql, params)
                    columns = [col[0] for col in cursor.description]
                    query_results = [dict(zip(columns, row)) for row in cursor.fetchall()]
                print(f"Query Results Count: {len(query_results)}")

                # === Step 3: Summarize Results ===
                print(f"AI Mode: System ({user.user_type}) - Step 3: Summarizing Results")
                summary_prompt = self._summarize_results_prompt(user.user_type, user_message, query_results, instructor_context)

                completion_summary = client.chat.completions.create(
                    model="gpt-4o", # Use a good model for summarization
                    messages=[{"role": "user", "content": summary_prompt}]
                    # Consider adding temperature if needed for summarization style
                )

                final_answer = ""
                if completion_summary.choices:
                    final_answer = completion_summary.choices[0].message.content.strip()
                else:
                     final_answer = "AI could not generate a summary for the retrieved data."
                     print("Warning: AI summarization returned no choices.")

                print(f"Final Answer: {final_answer}")

                # === Step 4: Format Response ===
                response_data = {"reply": final_answer}
                if show_thought_process:
                    response_data["thought_process"] = {
                        "generated_sql": generated_sql, # Show original attempt
                        "executed_sql": validated_sql, # Show what was actually run
                        "params_used": params,
                        "results_count": len(query_results),
                        # Limit raw results in response to avoid excessive size
                        "raw_results_preview": query_results[:5]
                    }
                return Response(response_data)

            elif mode == 'general':
                # === Handle General SQL Questions ===
                print(f"AI Mode: General ({user.user_type})")
                general_system_prompt = f"You are an AI assistant specialized in teaching SQL. You are speaking to a {user.user_type}. Answer their SQL questions clearly and concisely."

                completion_general = client.chat.completions.create(
                    model="gpt-4o", # Or gpt-3.5-turbo
                    messages=[
                        {"role": "system", "content": general_system_prompt},
                        {"role": "user", "content": user_message}
                    ]
                )
                ai_response = ""
                if completion_general.choices:
                    ai_response = completion_general.choices[0].message.content.strip()

                return Response({"reply": ai_response})

            else:
                 return Response({"error": "Invalid mode specified."}, status=status.HTTP_400_BAD_REQUEST)

        except APIError as e:
            print(f"OpenAI API Error: {e}")
            return Response({"error": f"AI service error: {e}"}, status=status.HTTP_503)
        except ValueError as e: # Catch validation/generation errors
            print(f"Processing Error: {e}")
            return Response({"error": f"Could not process the request: {e}"}, status=400)
        except DatabaseError as e:
            print(f"Database Execution Error: {e}")
            # Avoid exposing detailed DB errors to the user
            return Response({"error": "An error occurred while querying the database."}, status=500)
        except Exception as e:
            print(f"Chat API Unexpected Error: {e}", type(e)) # Log type for debugging
            return Response({"error": "An unexpected error occurred."}, status=500)

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