import os
import json
from openai import OpenAI
from rest_framework.decorators import api_view, permission_classes, authentication_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from core.authentication import CustomJWTAuthentication
from django.conf import settings
from core.models import Users, Student
from django.db import connection

# Initialize OpenAI client
client = OpenAI(api_key=settings.OPENAI_API_KEY)
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
            model="gpt-3.5-turbo",  # You can also use "gpt-4" or other models
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