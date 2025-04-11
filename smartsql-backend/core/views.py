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


@api_view(['POST'])
@authentication_classes([CustomJWTAuthentication])
@permission_classes([IsAuthenticated])
def dynamic_sql_query_api(request):
    try:
        # 获取请求参数
        table_name = request.data.get('table_name')
        columns = request.data.get('columns', [])
        conditions = request.data.get('conditions', [])
        order_by = request.data.get('order_by', [])
        limit = request.data.get('limit')
        offset = request.data.get('offset')

        # 构建基础SQL查询
        base_query = "SELECT "
        
        # 添加列
        if columns:
            base_query += ", ".join(columns)
        else:
            base_query += "*"
            
        base_query += f" FROM {table_name}"
        
        # 添加条件
        if conditions:
            base_query += " WHERE " + " AND ".join(conditions)
            
        # 添加排序
        if order_by:
            base_query += " ORDER BY " + ", ".join(order_by)
            
        # 添加分页
        if limit is not None:
            base_query += f" LIMIT {limit}"
            if offset is not None:
                base_query += f" OFFSET {offset}"
                
        # 执行查询
        with connection.cursor() as cursor:
            cursor.execute(base_query)
            columns = [col[0] for col in cursor.description]
            results = [dict(zip(columns, row)) for row in cursor.fetchall()]
            
        return Response({
            'status': 'success',
            'data': results,
            'query': base_query
        }, status=status.HTTP_200_OK)
            
    except Exception as e:
        return Response({
            'status': 'error',
            'message': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@authentication_classes([CustomJWTAuthentication])
@permission_classes([IsAuthenticated])
def student_courses_api(request):
    try:
        # ✅ 获取当前登录用户的 student_id
        student_id = request.user.user_id
        print("✅ 当前用户 ID：", student_id)

        # ✅ 查询该学生已enroll的课程，并附带相关信息
        with connection.cursor() as cursor:
            cursor.execute("""
                SELECT 
                    c.course_id,
                    c.course_name,
                    c.course_code,
                    c.course_description,
                    c.year,
                    c.term,
                    c.state,
                    s.total_score,
                    s.rank,
                    (SELECT COUNT(*) 
                     FROM Module m 
                     WHERE m.course_id = c.course_id) AS total_modules,
                    (SELECT COUNT(*) 
                     FROM Module_Exercise me
                     JOIN Module m ON me.module_id = m.module_id
                     WHERE m.course_id = c.course_id) AS total_exercises
                FROM Course c
                JOIN Enrollment e ON c.course_id = e.course_id
                LEFT JOIN Score s ON c.course_id = s.course_id AND s.student_id = %s
                WHERE e.student_id = %s AND e.status = 'enrolled'
                ORDER BY c.year DESC, c.term DESC
            """, [student_id, student_id])

            # 转换为 dict 列表返回
            columns = [col[0] for col in cursor.description]
            results = [dict(zip(columns, row)) for row in cursor.fetchall()]

        return Response({
            "status": "success",
            "data": results
        }, status=status.HTTP_200_OK)

    except Exception as e:
        print("❌ 查询出错：", str(e))
        return Response({
            "status": "error",
            "message": str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['GET'])
@authentication_classes([CustomJWTAuthentication])
@permission_classes([IsAuthenticated])
def course_modules_api(request, course_id):
    try:
        # 获取当前登录的学生ID
        student_id = request.user.user_id
        
        # 验证学生是否注册了该课程
        with connection.cursor() as cursor:
            cursor.execute("""
                SELECT 1 FROM Enrollment 
                WHERE student_id = %s AND course_id = %s AND status = 'enrolled'
            """, [student_id, course_id])
            
            if not cursor.fetchone():
                return Response({
                    'status': 'error',
                    'message': '您未注册此课程'
                }, status=status.HTTP_403_FORBIDDEN)
                
            # 获取课程信息
            cursor.execute("""
                SELECT 
                    c.course_id,
                    c.course_name,
                    c.course_code,
                    c.course_description,
                    c.year,
                    c.term,
                    c.state,
                    s.total_score,
                    s.rank
                FROM Course c
                LEFT JOIN Score s ON c.course_id = s.course_id AND s.student_id = %s
                WHERE c.course_id = %s
            """, [student_id, course_id])
            
            columns = [col[0] for col in cursor.description]
            course = dict(zip(columns, cursor.fetchone()))
            
            # 获取模块信息
            cursor.execute("""
                SELECT 
                    m.module_id,
                    m.module_name,
                    m.module_description,
                    COUNT(me.exercise_id) as total_exercises,
                    (SELECT COUNT(*) 
                     FROM Module_Exercise me2 
                     JOIN Exercise e ON me2.exercise_id = e.exercise_id
                     WHERE me2.module_id = m.module_id) as completed_exercises,
                    CASE 
                        WHEN m.module_id = 1 THEN 0
                        WHEN EXISTS (
                            SELECT 1 
                            FROM Module m2 
                            JOIN Module_Exercise me2 ON m2.module_id = me2.module_id
                            WHERE m2.course_id = m.course_id 
                            AND m2.module_id < m.module_id
                            AND me2.exercise_id NOT IN (
                                SELECT exercise_id 
                                FROM Module_Exercise me3
                                WHERE me3.module_id = m2.module_id
                            )
                        ) THEN 1
                        ELSE 0
                    END as locked
                FROM Module m
                LEFT JOIN Module_Exercise me ON m.module_id = me.module_id
                WHERE m.course_id = %s
                GROUP BY m.module_id, m.module_name, m.module_description
                ORDER BY m.module_id
            """, [course_id])
            
            columns = [col[0] for col in cursor.description]
            modules = [dict(zip(columns, row)) for row in cursor.fetchall()]
            
        return Response({
            'status': 'success',
            'data': {
                'course': course,
                'modules': modules
            }
        }, status=status.HTTP_200_OK)
            
    except Exception as e:
        return Response({
            'status': 'error',
            'message': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['POST'])
@authentication_classes([CustomJWTAuthentication])
@permission_classes([IsAuthenticated])
def accept_all_courses_api(request):
    try:
        # 获取当前登录的学生ID
        student_id = request.user.user_id
        
        # 获取所有可用的课程
        with connection.cursor() as cursor:
            cursor.execute("""
                SELECT c.course_id
                FROM Course c
                WHERE c.state = 'active'
                AND c.course_id NOT IN (
                    SELECT course_id 
                    FROM Enrollment 
                    WHERE student_id = %s AND status = 'enrolled'
                )
            """, [student_id])
            
            available_courses = [row[0] for row in cursor.fetchall()]
            
            # 为每个可用课程创建注册记录
            for course_id in available_courses:
                cursor.execute("""
                    INSERT INTO Enrollment (student_id, course_id, status)
                    VALUES (%s, %s, 'enrolled')
                """, [student_id, course_id])
                
        return Response({
            'status': 'success',
            'message': f'成功注册了 {len(available_courses)} 门课程'
        }, status=status.HTTP_200_OK)
            
    except Exception as e:
        return Response({
            'status': 'error',
            'message': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['GET'])
@authentication_classes([CustomJWTAuthentication])
@permission_classes([IsAuthenticated])
def module_exercises_api(request, course_id, module_id):
    try:
        # 获取当前登录的学生ID
        student_id = request.user.user_id
        
        # 验证学生是否注册了该课程
        with connection.cursor() as cursor:
            cursor.execute("""
                SELECT 1 FROM Enrollment 
                WHERE student_id = %s AND course_id = %s AND status = 'enrolled'
            """, [student_id, course_id])
            
            if not cursor.fetchone():
                return Response({
                    'status': 'error',
                    'message': '您未注册此课程'
                }, status=status.HTTP_403_FORBIDDEN)
                
            # 获取模块信息
            cursor.execute("""
                SELECT 
                    m.module_id,
                    m.module_name,
                    m.module_description,
                    c.course_name,
                    c.course_code
                FROM Module m
                JOIN Course c ON m.course_id = c.course_id
                WHERE m.module_id = %s AND m.course_id = %s
            """, [module_id, course_id])
            
            columns = [col[0] for col in cursor.description]
            module = dict(zip(columns, cursor.fetchone()))
            
            # 获取练习信息
            cursor.execute("""
                SELECT 
                    e.exercise_id,
                    e.title,
                    e.description,
                    e.hint,
                    e.difficulty,
                    e.table_schema,
                    CASE 
                        WHEN se.student_id IS NOT NULL THEN 1
                        ELSE 0
                    END as completed
                FROM Exercise e
                JOIN Module_Exercise me ON e.exercise_id = me.exercise_id
                LEFT JOIN Student_Exercise se ON e.exercise_id = se.exercise_id AND se.student_id = %s
                WHERE me.module_id = %s
                ORDER BY e.exercise_id
            """, [student_id, module_id])
            
            columns = [col[0] for col in cursor.description]
            exercises = [dict(zip(columns, row)) for row in cursor.fetchall()]
            
        return Response({
            'status': 'success',
            'data': {
                'module': module,
                'exercises': exercises
            }
        }, status=status.HTTP_200_OK)
            
    except Exception as e:
        return Response({
            'status': 'error',
            'message': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['POST'])
@authentication_classes([CustomJWTAuthentication])
@permission_classes([IsAuthenticated])
def submit_exercise_api(request, course_id, module_id, exercise_id):
    try:
        # 获取当前登录的学生ID
        student_id = request.user.user_id
        
        # 验证学生是否注册了该课程
        with connection.cursor() as cursor:
            cursor.execute("""
                SELECT 1 FROM Enrollment 
                WHERE student_id = %s AND course_id = %s AND status = 'enrolled'
            """, [student_id, course_id])
            
            if not cursor.fetchone():
                return Response({
                    'status': 'error',
                    'message': '您未注册此课程'
                }, status=status.HTTP_403_FORBIDDEN)
                
            # 验证练习是否属于该模块
            cursor.execute("""
                SELECT 1 FROM Module_Exercise
                WHERE module_id = %s AND exercise_id = %s
            """, [module_id, exercise_id])
            
            if not cursor.fetchone():
                return Response({
                    'status': 'error',
                    'message': '练习不存在或不属于该模块'
                }, status=status.HTTP_404_NOT_FOUND)
                
            # 获取练习的预期答案
            cursor.execute("""
                SELECT expected_answer FROM Exercise
                WHERE exercise_id = %s
            """, [exercise_id])
            
            expected_answer = cursor.fetchone()[0]
            
            # 获取学生提交的答案
            student_answer = request.data.get('answer')
            
            if not student_answer:
                return Response({
                    'status': 'error',
                    'message': '请提交答案'
                }, status=status.HTTP_400_BAD_REQUEST)
                
            # 记录学生练习完成情况
            cursor.execute("""
                INSERT INTO Student_Exercise (student_id, exercise_id)
                VALUES (%s, %s)
                ON DUPLICATE KEY UPDATE completed_at = CURRENT_TIMESTAMP
            """, [student_id, exercise_id])
            
            # 检查答案是否正确
            is_correct = student_answer.strip().lower() == expected_answer.strip().lower()
            
        return Response({
            'status': 'success',
            'data': {
                'is_correct': is_correct,
                'message': '答案已提交'
            }
        }, status=status.HTTP_200_OK)
            
    except Exception as e:
        return Response({
            'status': 'error',
            'message': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


