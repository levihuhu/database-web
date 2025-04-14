from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework.decorators import api_view, permission_classes, authentication_classes
from core.models import Users, Student, Instructor
from core.authentication import CustomJWTAuthentication
from rest_framework.response import Response
from rest_framework import status
from config import messages as msg
from django.db.models import Q
from django.db import connection, transaction
import re
from django.contrib.auth.hashers import make_password
from django.db import IntegrityError



@api_view(['POST'])
@permission_classes([AllowAny]) # Allow anyone to access the signup API
def signup_api(request):
    data = request.data
    username = data.get('username')
    email = data.get('email')
    password = data.get('password') # Storing plain text as per previous request
    first_name = data.get('first_name')
    last_name = data.get('last_name')
    user_type = 'Student' # Hardcoded as per requirement
    profile_info = data.get('profile_info', None) # Get profile_info, default to None if not provided

    # --- Input Validation (remains the same) ---
    errors = {}
    if not username or len(username) < 8 or not re.match(r'^[a-zA-Z0-9_-]+$', username):
        errors['username'] = '用户名必须至少8位，且只能包含字母、数字、下划线或连字符。'
    if not email or '@' not in email:
        errors['email'] = '请输入有效的邮箱地址。'
    if not password or len(password) < 8:
        errors['password'] = '密码必须至少8位。'
    if not first_name:
        errors['first_name'] = '名字不能为空。'
    if not last_name:
        errors['last_name'] = '姓氏不能为空。'

    if errors:
        return Response({'status': 'error', 'errors': errors}, status=status.HTTP_400_BAD_REQUEST)
    print("👌🏻")
    # --- Uniqueness Check (using raw SQL) ---
    try:
        with connection.cursor() as cursor:
            cursor.execute("SELECT EXISTS(SELECT 1 FROM Users WHERE username = %s)", [username])
            if cursor.fetchone()[0]:
                errors['username'] = '用户名已被注册。'
                
            cursor.execute("SELECT EXISTS(SELECT 1 FROM Users WHERE email = %s)", [email])
            if cursor.fetchone()[0]:
                errors['email'] = '邮箱已被注册。'
        
        if errors:
             return Response({'status': 'error', 'errors': errors}, status=status.HTTP_400_BAD_REQUEST)

        # --- Create User and Student Record (using raw SQL) --- 
        with transaction.atomic(): # Keep transaction for atomicity
            with connection.cursor() as cursor:
                # Insert into Users table
                cursor.execute("""
                    INSERT INTO Users (username, email, password, first_name, last_name, user_type, profile_info)
                    VALUES (%s, %s, %s, %s, %s, %s, %s)
                """, [username, email, password, first_name, last_name, user_type, profile_info])
                
                # Get the user_id of the newly inserted user
                # Note: cursor.lastrowid is specific to some backends like MySQL for AUTO_INCREMENT
                new_user_id = cursor.lastrowid 
                if not new_user_id:
                    # Fallback or error handling if lastrowid isn't supported/returned
                    # Could query based on username/email if needed, but less reliable
                     raise Exception("无法获取新用户的 ID。")

                # Insert into Student table
                cursor.execute("""
                    INSERT INTO Student (student_id)
                    VALUES (%s)
                """, [new_user_id])

        return Response({
            'status': 'success',
            'message': '注册成功！现在您可以登录了。',
            'user_id': new_user_id 
        }, status=status.HTTP_201_CREATED)

    except IntegrityError as e:
        # Handles potential DB constraint violations (e.g., unique key)
        print(f"Integrity Error during signup: {e}")
        # Check the error message to be more specific if possible
        err_msg = str(e).lower()
        if 'username' in err_msg:
             errors['username'] = '用户名已被注册 (database constraint)。'
        elif 'email' in err_msg:
            errors['email'] = '邮箱已被注册 (database constraint)。'
        else: 
             errors['database'] = '注册失败，数据约束冲突。'
        return Response({'status': 'error', 'errors': errors}, status=status.HTTP_400_BAD_REQUEST)
    except Exception as e:
        print(f"Error during signup: {e}")
        return Response({'status': 'error', 'message': f'注册过程中发生错误: {e}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@permission_classes([AllowAny])
def login_api(request):
    try:
        identifier = request.data.get('identifier')
        password = request.data.get('password')
        role = request.data.get('role')


        if not identifier or not password or not role:
            return Response({'error': msg.MISSING_FIELD}, status=status.HTTP_400_BAD_REQUEST)

        # if '@' in identifier:
        #     user = authenticate(request, email=identifier, password=password)
        # else:
        #     user = authenticate(request, username=identifier, password=password)

        try:
            user = Users.objects.get(
                Q(username=identifier) | Q(email=identifier),
                password=password,
                user_type=role
            )
        except Users.DoesNotExist:
            return Response({'status': 'error', 'message': msg.LOGIN_WRONG_PASSWORD},
                            status=status.HTTP_401_UNAUTHORIZED)

        refresh = RefreshToken.for_user(user)
        refresh["user_id"] = user.user_id
        refresh["username"] = user.username
        refresh["role"] = user.user_type

        return Response({
            'status': 'success',
            'message': 'Login successful',
            'data': {
                'access': str(refresh.access_token),
                'refresh': str(refresh),
                'user_id': user.user_id,
                'username': user.username,
                'role': role
            }
        }, status=status.HTTP_200_OK)

    except Exception as e:
        # logger.error(f"Login failed: {str(e)}")
        return Response({'status': 'error', 'message': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@authentication_classes([CustomJWTAuthentication])
@permission_classes([IsAuthenticated])
def profile_api(request):
    try:
        requester = request.user
        user_id_param = request.query_params.get('user_id')

        target_id = user_id_param if user_id_param else requester.user_id

        # Fetch basic user info
        user = Users.objects.get(user_id=target_id)
        is_own_profile = str(requester.user_id) == str(target_id)

        user_data = {
            'user_id': user.user_id,
            'first_name': user.first_name,
            'last_name': user.last_name,
            'username': user.username,
            'email': user.email,
            'user_type': user.user_type,
            'profile_info': user.profile_info,
            # Add avatar_url if you have it in Users model or fetch separately
            'avatar_url': getattr(user, 'avatar_url', None)
        }

        # If instructor is viewing a student's profile, add course/grade info
        enrollments_data = None
        if requester.user_type == 'Instructor' and user.user_type == 'Student' and not is_own_profile:
            try:
                with connection.cursor() as cursor:
                    # Join Enrollment with Course AND Score
                    cursor.execute("""
                        SELECT
                            c.course_id, c.course_name, c.course_code, c.year, c.term,
                            e.status,
                            s.total_score as grade -- Get grade from Score table
                        FROM Enrollment e
                        JOIN Course c ON e.course_id = c.course_id
                        LEFT JOIN Score s ON e.student_id = s.student_id AND e.course_id = s.course_id -- Join Score
                        WHERE e.student_id = %s AND c.instructor_id = %s
                        ORDER BY c.year DESC, c.term DESC
                    """, [target_id, requester.user_id])
                    columns = [col[0] for col in cursor.description]
                    enrollments = [dict(zip(columns, row)) for row in cursor.fetchall()]

                    term_map = {1: 'Spring', 2: 'Summer', 3: 'Fall'}
                    for enr in enrollments:
                         enr['term'] = term_map.get(enr['term'], 'Unknown')
                         # Ensure grade key exists, even if null
                         if 'grade' not in enr:
                             enr['grade'] = None
                    enrollments_data = enrollments

            except Exception as e_inner:
                 print(f"Error fetching enrollment/score details for student {target_id}: {e_inner}")
                 # Don't fail the whole request, just skip enrollments/scores

        return Response({
            'status': 'success',
            'data': user_data,
            'is_own_profile': is_own_profile,
            'enrollments': enrollments_data # Will be null if not applicable or error
        })
    except Users.DoesNotExist:
        return Response({'status': 'error', 'message': '用户不存在'}, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        return Response({'status': 'error', 'message': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['PUT'])
@authentication_classes([CustomJWTAuthentication])
@permission_classes([IsAuthenticated])
def update_profile_api(request):
    try:
        # 当前登录用户
        user = request.user

        # 只获取个人简介
        profile_info = request.data.get('profile_info')

        user.profile_info = profile_info
        user.save()

        return Response({
            'status': 'success',
            'message': 'Profile updated successfully'
        }, status=status.HTTP_200_OK)

    except Users.DoesNotExist:
        return Response({
            'status': 'error',
            'message': 'User not found'
        }, status=status.HTTP_404_NOT_FOUND)

    except Exception as e:
        return Response({
            'status': 'error',
            'message': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@authentication_classes([CustomJWTAuthentication])
@permission_classes([IsAuthenticated])
def messages_api(request):
    try:
        # 当前登录用户
        user = request.user

        # 获取请求体中的数据
        receiver_id = request.data.get('receiver_id')
        content = request.data.get('content')
        
        # 验证数据
        if not receiver_id or not content:
            return Response({
                'status': 'error',
                'message': '接收者ID和消息内容不能为空'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # 验证接收者是否存在
        with connection.cursor() as cursor:
            cursor.execute("SELECT user_id FROM Users WHERE user_id = %s", [receiver_id])
            receiver = cursor.fetchone()
            if not receiver:
                return Response({
                    'status': 'error',
                    'message': '接收者不存在'
                }, status=status.HTTP_404_NOT_FOUND)
  
            print("❎")
            with transaction.atomic():
                
                cursor.execute("""
                    INSERT INTO Message (sender_id, message_type, message_content, timestamp)
                    VALUES (%s, 'private', %s, NOW())
                """, [user.user_id, content])

                message_id = cursor.lastrowid

                cursor.execute("""
                    INSERT INTO PrivateMessage (message_id, receiver_id)
                    VALUES (%s, %s)
                """, [message_id, receiver_id])

            
        return Response({
            'status': 'success',
            'message': '消息发送成功',
            'data': {
                'message_id': message_id,
                'sender_id': user.user_id,
                'receiver_id': receiver_id,
                'content': content
            }
        }, status=status.HTTP_201_CREATED)
            
    except Exception as e:
        return Response({
            'status': 'error',
            'message': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


