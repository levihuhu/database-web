from datetime import timezone
from django.shortcuts import render
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework.decorators import api_view, permission_classes, authentication_classes
from core.models import Student_Exercise, Users, Student, Instructor
from core.authentication import CustomJWTAuthentication
from rest_framework.response import Response
from rest_framework import status
from config import messages as msg
from django.db.models import Q
from django.db import connection, transaction
from rest_framework.response import Response
from rest_framework import status
import json

# Create your views here.
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
        student_id = request.user.user_id

        with connection.cursor() as cursor:
            # 添加 instructor_id 和 instructor_name 到查询中
            cursor.execute("""
                SELECT 
                    c.course_id,
                    c.course_name,
                    c.course_code,
                    c.course_description,
                    c.year,
                    c.term,
                    c.state,
                    i.user_id as instructor_id, -- 获取 instructor 的 user_id
                    CONCAT(i.first_name, ' ', i.last_name) as instructor_name, -- 获取 instructor 的全名
                    (SELECT COUNT(*) 
                     FROM Module m 
                     WHERE m.course_id = c.course_id) AS total_modules,
                    (SELECT COUNT(*) 
                     FROM Module_Exercise me
                     JOIN Module m ON me.module_id = m.module_id
                     WHERE m.course_id = c.course_id) AS total_exercises
                FROM Course c
                JOIN Enrollment e ON c.course_id = e.course_id
                JOIN Users i ON c.instructor_id = i.user_id -- JOIN Users 表获取 instructor 信息
                WHERE e.student_id = %s AND e.status = 'enrolled'
                ORDER BY c.year DESC, c.term DESC
            """, [student_id])

            columns = [col[0] for col in cursor.description]
            results = [dict(zip(columns, row)) for row in cursor.fetchall()]

        return Response({
            "status": "success",
            "data": results
        }, status=status.HTTP_200_OK)

    except Exception as e:
        print("❌ 查询学生课程列表出错：", str(e))
        return Response({
            "status": "error",
            "message": "获取课程列表失败"
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['GET'])
@authentication_classes([CustomJWTAuthentication])
@permission_classes([IsAuthenticated])
def course_modules_api(request, course_id):
    try:
        student_id = request.user.user_id  # 统一使用标准的user.id字段
        print("✅ 当前用户 ID", student_id)
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
                    c.state
                FROM Course c
                LEFT JOIN Score s ON c.course_id = s.course_id AND s.student_id = %s
                WHERE c.course_id = %s
            """, [student_id, course_id])
            
            

            course_row = cursor.fetchone()
            if not course_row:
                return Response({'status':'error', 'message':'课程不存在'}, status=status.HTTP_404_NOT_FOUND)
            course_columns = [col[0] for col in cursor.description]
            course = dict(zip(course_columns, course_row))
            
            # 获取模块信息
            cursor.execute("""
                SELECT 
                    m.module_id,
                    m.module_name,
                    m.module_description,
                    COUNT(DISTINCT me.exercise_id) as total_exercises,
                    COUNT(DISTINCT CASE WHEN se.is_correct = TRUE THEN me.exercise_id END) as completed_exercises,
                    CASE 
                        WHEN m.module_id = (SELECT MIN(module_id) FROM Module WHERE course_id = m.course_id) THEN 0
                        WHEN EXISTS (
                            SELECT 1 
                            FROM Module prev_m
                            JOIN Module_Exercise prev_me ON prev_m.module_id = prev_me.module_id
                            LEFT JOIN Student_Exercise prev_se ON prev_me.exercise_id = prev_se.exercise_id 
                                AND prev_se.student_id = %s AND prev_se.is_correct = TRUE
                            WHERE prev_m.course_id = m.course_id 
                              AND prev_m.module_id < m.module_id
                              AND prev_se.id IS NULL
                        ) THEN 1
                        ELSE 0
                    END as locked
                FROM Module m
                LEFT JOIN Module_Exercise me ON m.module_id = me.module_id
                LEFT JOIN Student_Exercise se ON me.exercise_id = se.exercise_id 
                    AND se.student_id = %s
                WHERE m.course_id = %s
                GROUP BY m.module_id, m.module_name, m.module_description
                ORDER BY m.module_id
            """, [student_id, student_id, course_id])
            
            module_columns = [col[0] for col in cursor.description]
            modules = [dict(zip(module_columns, row)) for row in cursor.fetchall()]
            
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
        student_id = request.user.user_id
        print("✅ 当前用户 ID", student_id)
        # 验证学生是否注册了该课程
        with connection.cursor() as cursor:
            cursor.execute("""
                SELECT COUNT(*) 
                FROM Enrollment 
                WHERE student_id = %s AND course_id = %s AND status = 'enrolled'
            """, [student_id, course_id])
            if cursor.fetchone()[0] == 0:
                return Response({'error': '未注册该课程'}, status=status.HTTP_403_FORBIDDEN)

        # 获取模块和课程信息
        with connection.cursor() as cursor:
            cursor.execute("""
                SELECT m.module_id, m.module_name, m.module_description,
                       c.course_name, c.course_code
                FROM Module m
                JOIN Course c ON m.course_id = c.course_id
                WHERE m.module_id = %s AND m.course_id = %s
            """, [module_id, course_id])
            
            module_info = cursor.fetchone()
            if not module_info:
                return Response({'error': '模块未找到'}, status=status.HTTP_404_NOT_FOUND)
            
            module = {
                'module_id': module_info[0],
                'module_name': module_info[1],
                'module_description': module_info[2],
                'course_name': module_info[3],
                'course_code': module_info[4]
            }

        # 获取练习列表和完成状态
        with connection.cursor() as cursor:
            cursor.execute("""
                SELECT 
                    e.exercise_id, 
                    e.title, 
                    e.description, 
                    e.hint,
                    e.difficulty, 
                    e.table_schema, 
                    e.expected_answer,
                    CASE WHEN se.exercise_id IS NOT NULL THEN 1 ELSE 0 END AS completed
                FROM Exercise e
                JOIN Module_Exercise me ON e.exercise_id = me.exercise_id
                LEFT JOIN (
                    SELECT exercise_id 
                    FROM Student_Exercise 
                    WHERE student_id = %s
                    GROUP BY exercise_id
                ) se ON e.exercise_id = se.exercise_id
                WHERE me.module_id = %s
                ORDER BY me.display_order

            """, [student_id, module_id])
            
            columns = [col[0] for col in cursor.description]
            exercises = [dict(zip(columns, row)) for row in cursor.fetchall()]
            
            # 处理 table_schema
            for exercise in exercises:
                if exercise['table_schema']:
                    try:
                        exercise['table_schema'] = json.loads(exercise['table_schema'])
                    except json.JSONDecodeError:
                        exercise['table_schema'] = []
                else:
                    exercise['table_schema'] = []

        return Response({
            'status': 'success',
            'data': {
                'module': module,
                'exercises': exercises
            }
        })

    except Exception as e:
        return Response({
            'error': '获取练习失败',
            'details': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['POST'])
@authentication_classes([CustomJWTAuthentication])
@permission_classes([IsAuthenticated])
def submit_exercise_api(request, exercise_id):
    try:
        student_id = request.user.user_id
        answer = request.data.get('answer')
        
        if not answer:
            return Response({'status': 'error', 'message': '请提供答案'}, status=status.HTTP_400_BAD_REQUEST)

        # 获取练习信息并验证权限
        with connection.cursor() as cursor:
            # 获取练习的正确答案和关联的课程ID
            cursor.execute("""
                SELECT e.expected_answer, m.course_id 
                FROM Exercise e
                LEFT JOIN Module_Exercise me ON e.exercise_id = me.exercise_id
                LEFT JOIN Module m ON me.module_id = m.module_id
                WHERE e.exercise_id = %s
            """, [exercise_id])
            result = cursor.fetchone()
            if not result:
                return Response({'status': 'error', 'message': '练习未找到'}, status=status.HTTP_404_NOT_FOUND)
            
            expected_answer = result[0]
            course_id_associated_with_exercise = result[1]

            # --- Permission Check --- 
            if course_id_associated_with_exercise:
                cursor.execute("""
                    SELECT COUNT(*) FROM Enrollment
                    WHERE student_id = %s AND course_id = %s AND status = 'enrolled'
                """, [student_id, course_id_associated_with_exercise])
                if cursor.fetchone()[0] == 0:
                    # 如果练习有关联课程，但学生未注册，则拒绝提交
                    return Response({
                        'status': 'error',
                        'message': '您未注册包含此练习的课程，无法提交答案'
                    }, status=status.HTTP_403_FORBIDDEN)
            # else:
                # 如果练习没有关联课程，假设允许所有登录学生提交 (或根据您的业务逻辑调整)
                # pass

            # 检查答案是否正确
            # 建议使用更健壮的SQL比较方式
            is_correct = answer.strip().lower() == expected_answer.strip().lower()
            score = 100.0 if is_correct else 0.0

            with transaction.atomic():
                cursor.execute("""
                    INSERT INTO Student_Exercise (student_id, exercise_id, submitted_answer, is_correct, completed_at)
                    VALUES (%s, %s, %s, %s, NOW())
                    ON DUPLICATE KEY UPDATE 
                        submitted_answer = VALUES(submitted_answer),
                        is_correct = VALUES(is_correct),
                        completed_at = NOW()
                """, [student_id, exercise_id, answer, is_correct])
        # 返回成功响应
        return Response({
            'status': 'success',
            'data': {
                'is_correct': is_correct,
                'score': score,
                'message': '答案已提交'
            }
        }, status=status.HTTP_200_OK)

    except Exception as e:
        print(f"❌ 提交答案失败 (Exercise ID: {exercise_id}): {str(e)}")
        return Response({
            'status': 'error',
            'message': '提交答案失败',
            'details': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['GET'])
@authentication_classes([CustomJWTAuthentication])
@permission_classes([IsAuthenticated])
def get_student_course_progress(request, course_id):
    try:
        student_id = request.user.id
        
        # 获取课程进度
        student_course = Student_Course.objects.get(
            student_id=student_id,
            course_id=course_id
        )
        
        # 获取课程模块信息
        modules = Module.objects.filter(course_id=course_id)
        module_progress = []
        
        for module in modules:
            student_module = Student_Module.objects.filter(
                student_id=student_id,
                module_id=module.module_id
            ).first()
            
            if student_module:
                module_progress.append({
                    'module_id': module.module_id,
                    'title': module.title,
                    'progress': student_module.progress,
                    'is_completed': student_module.is_completed,
                    'completed_at': student_module.completed_at
                })
            else:
                module_progress.append({
                    'module_id': module.module_id,
                    'title': module.title,
                    'progress': 0,
                    'is_completed': False,
                    'completed_at': None
                })
        
        return Response({
            'course_id': course_id,
            'progress': student_course.progress,
            'is_completed': student_course.is_completed,
            'completed_at': student_course.completed_at,
            'modules': module_progress
        })
        
    except Student_Course.DoesNotExist:
        return Response({'error': '未找到课程进度信息'}, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['GET'])
@authentication_classes([CustomJWTAuthentication])
@permission_classes([IsAuthenticated])
def get_student_module_progress(request, course_id, module_id):
    try:
        student_id = request.user.id
        
        # 获取模块中的所有练习
        cursor = connection.cursor()
        cursor.execute("""
            SELECT e.exercise_id, e.title, e.description,
                   COALESCE(se.score, 0) as score,
                   COALESCE(se.is_completed, FALSE) as is_completed,
                   se.completed_at,
                   COALESCE(se.submission_count, 0) as submission_count
            FROM Exercise e
            LEFT JOIN Student_Exercise se ON e.exercise_id = se.exercise_id 
                AND se.student_id = %s
            WHERE e.module_id = %s
            ORDER BY e.exercise_id
            """, [student_id, module_id])
        
        exercises = []
        total_exercises = 0
        completed_exercises = 0
        
        for row in cursor.fetchall():
            exercise_id, title, description, score, is_completed, completed_at, submission_count = row
            total_exercises += 1
            if is_completed:
                completed_exercises += 1
                
            exercises.append({
                'exercise_id': exercise_id,
                'title': title,
                'description': description,
                'score': score,
                'is_completed': is_completed,
                'completed_at': completed_at,
                'submission_count': submission_count
            })
        
        # 计算模块进度
        progress = (completed_exercises / total_exercises * 100) if total_exercises > 0 else 0
        is_completed = completed_exercises == total_exercises
        
        # 更新模块状态
        student_module, created = Student_Module.objects.get_or_create(
            student_id=student_id,
            module_id=module_id,
            defaults={
                'progress': progress,
                'is_completed': is_completed
            }
        )
        
        if not created and (student_module.progress != progress or student_module.is_completed != is_completed):
            student_module.progress = progress
            student_module.is_completed = is_completed
            if is_completed and not student_module.completed_at:
                student_module.completed_at = timezone.now()
            student_module.save()
        
        return Response({
            'module_id': module_id,
            'progress': progress,
            'is_completed': is_completed,
            'completed_at': student_module.completed_at,
            'total_exercises': total_exercises,
            'completed_exercises': completed_exercises,
            'exercises': exercises
        })
        
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['GET'])
@authentication_classes([CustomJWTAuthentication])
@permission_classes([IsAuthenticated])
def get_student_exercise_status(request, course_id, module_id, exercise_id):
    try:
        student_id = request.user.id
        
        # 获取练习状态
        student_exercise = Student_Exercise.objects.get(
            student_id=student_id,
            exercise_id=exercise_id
        )
        
        return Response({
            'exercise_id': exercise_id,
            'score': student_exercise.score,
            'is_completed': student_exercise.is_completed,
            'completed_at': student_exercise.completed_at,
            'submission_count': student_exercise.submission_count,
            'last_submission': student_exercise.last_submission
        })
        
    except Student_Exercise.DoesNotExist:
        return Response({'error': '未找到练习状态信息'}, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['GET'])
@authentication_classes([CustomJWTAuthentication])
@permission_classes([IsAuthenticated])
def get_exercise_detail(request, exercise_id):
    try:
        student_id = request.user.user_id
        
        # 获取练习详细信息，同时获取关联的课程和模块信息
        with connection.cursor() as cursor:
            cursor.execute("""
                SELECT 
                    e.exercise_id, e.title, e.description, e.hint, 
                    e.difficulty, e.table_schema, e.expected_answer,
                    m.module_id, m.module_name, 
                    c.course_id, c.course_name,
                    CASE WHEN se.student_id IS NOT NULL THEN 1 ELSE 0 END as completed
                FROM Exercise e
                LEFT JOIN Module_Exercise me ON e.exercise_id = me.exercise_id
                LEFT JOIN Module m ON me.module_id = m.module_id
                LEFT JOIN Course c ON m.course_id = c.course_id
                LEFT JOIN Student_Exercise se ON e.exercise_id = se.exercise_id AND se.student_id = %s
                WHERE e.exercise_id = %s
            """, [student_id, exercise_id])
            
            columns = [col[0] for col in cursor.description]
            result = cursor.fetchone()
            
            if not result:
                return Response({'status': 'error', 'message': '练习未找到'}, status=status.HTTP_404_NOT_FOUND)
            
            exercise = dict(zip(columns, result))
            associated_course_id = exercise.get('course_id')

            # --- Permission Check --- 
            if associated_course_id:
                cursor.execute("""
                    SELECT COUNT(*) FROM Enrollment
                    WHERE student_id = %s AND course_id = %s AND status = 'enrolled'
                """, [student_id, associated_course_id])
                if cursor.fetchone()[0] == 0:
                    # 如果练习有关联课程，但学生未注册，则拒绝访问
                    return Response({
                        'status': 'error', 
                        'message': '您未注册包含此练习的课程，无法访问'
                    }, status=status.HTTP_403_FORBIDDEN)
            # else: 
                # 如果练习没有关联课程，假设允许所有登录学生访问 (或根据您的业务逻辑调整)
                # pass
             
            # 处理 table_schema
            if exercise['table_schema']:
                try:
                    exercise['table_schema'] = json.loads(exercise['table_schema'])
                except json.JSONDecodeError:
                    exercise['table_schema'] = []
            else:
                exercise['table_schema'] = []

        return Response({
            'status': 'success',
            'data': exercise
        }, status=status.HTTP_200_OK)

    except Exception as e:
        print(f"❌ 获取练习详情失败 (Exercise ID: {exercise_id}): {str(e)}")
        return Response({
            'status': 'error',
            'message': '获取练习详情失败',
            'details': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['GET'])
@authentication_classes([CustomJWTAuthentication])
@permission_classes([IsAuthenticated])
def student_dashboard_api(request):
    try:
        # 获取当前登录用户的 student_id
        student_id = request.user.user_id
        
        # 获取学生的个人信息
        with connection.cursor() as cursor:
            cursor.execute("""
                SELECT 
                    u.first_name,
                    u.last_name,
                    u.username,
                    u.email,
                    u.profile_info
                FROM Users u
                WHERE u.user_id = %s
            """, [student_id])
            user_info = cursor.fetchone()
            if not user_info:
                return Response({'status': 'error', 'message': '用户信息不存在'}, status=status.HTTP_404_NOT_FOUND)
            
            user_data = {
                'first_name': user_info[0],
                'last_name': user_info[1],
                'username': user_info[2],
                'email': user_info[3],
                'profile_info': user_info[4]
            }
            
            # 获取学生的课程总览数据
            cursor.execute("""
                SELECT 
                    COUNT(DISTINCT e.course_id) as total_courses,
                    COUNT(DISTINCT CASE WHEN c.state = 'active' THEN c.course_id END) as active_courses,
                    COUNT(DISTINCT CASE WHEN c.state = 'complete' THEN c.course_id END) as completed_courses
                FROM Enrollment e
                JOIN Course c ON e.course_id = c.course_id
                WHERE e.student_id = %s AND e.status = 'enrolled'
            """, [student_id])
            
            course_stats = cursor.fetchone()
            course_data = {
                'total_courses': course_stats[0],
                'active_courses': course_stats[1],
                'completed_courses': course_stats[2]
            }
            
            # 获取练习完成情况
            cursor.execute("""
                SELECT 
                    COUNT(DISTINCT e.exercise_id) as total_exercises,
                    COUNT(DISTINCT CASE WHEN se.is_correct = TRUE THEN se.exercise_id END) as correct_exercises,
                    COUNT(DISTINCT CASE WHEN se.id IS NOT NULL THEN se.exercise_id END) as attempted_exercises
                FROM Exercise e
                JOIN Module_Exercise me ON e.exercise_id = me.exercise_id
                JOIN Module m ON me.module_id = m.module_id
                JOIN Course c ON m.course_id = c.course_id
                JOIN Enrollment en ON c.course_id = en.course_id AND en.student_id = %s
                LEFT JOIN Student_Exercise se ON e.exercise_id = se.exercise_id AND se.student_id = %s
                WHERE en.status = 'enrolled'
            """, [student_id, student_id])
            
            exercise_stats = cursor.fetchone()
            exercise_data = {
                'total_exercises': exercise_stats[0],
                'correct_exercises': exercise_stats[1],
                'attempted_exercises': exercise_stats[2],
                'completion_rate': round((exercise_stats[2] / exercise_stats[0]) * 100, 2) if exercise_stats[0] > 0 else 0,
                'accuracy_rate': round((exercise_stats[1] / exercise_stats[2]) * 100, 2) if exercise_stats[2] > 0 else 0
            }
            
            # 获取学生最近的课程
            cursor.execute("""
                SELECT 
                    c.course_id,
                    c.course_name,
                    c.course_code,
                    c.year,
                    c.term,
                    c.state,
                    (SELECT COUNT(*) FROM Module m WHERE m.course_id = c.course_id) as module_count,
                    (SELECT COUNT(DISTINCT me.exercise_id) 
                     FROM Module m JOIN Module_Exercise me ON m.module_id = me.module_id 
                     WHERE m.course_id = c.course_id) as exercise_count,
                    (SELECT COUNT(DISTINCT se.exercise_id) 
                     FROM Student_Exercise se
                     JOIN Module_Exercise me ON se.exercise_id = me.exercise_id
                     JOIN Module m ON me.module_id = m.module_id
                     WHERE m.course_id = c.course_id AND se.student_id = %s AND se.is_correct = TRUE) as completed_exercises
                FROM Course c
                JOIN Enrollment e ON c.course_id = e.course_id
                WHERE e.student_id = %s AND e.status = 'enrolled'
                ORDER BY c.year DESC, c.term DESC
                LIMIT 5
            """, [student_id, student_id])
            
            recent_courses = []
            columns = [col[0] for col in cursor.description]
            for row in cursor.fetchall():
                course_dict = dict(zip(columns, row))
                if course_dict['exercise_count'] > 0:
                    course_dict['progress'] = round((course_dict['completed_exercises'] / course_dict['exercise_count']) * 100, 2)
                else:
                    course_dict['progress'] = 0
                # 添加额外的课程信息（示例）
                course_dict['instructor_name'] = "Example Instructor" # Placeholder
                course_dict['next_deadline'] = "2024-08-01" # Placeholder
                recent_courses.append(course_dict)
            print("到达这里了吗？")
            # Fetch recent exercises (last 5 attempts)
            cursor.execute("""
                SELECT 
                    se.id AS student_exercise_id,
                    e.exercise_id,
                    e.title, 
                    e.difficulty, 
                    se.is_correct, 
                    se.completed_at, 
                    c.course_name, 
                    m.module_name,
                    c.course_id,
                    m.module_id
                FROM Student_Exercise se
                JOIN Exercise e ON se.exercise_id = e.exercise_id
                LEFT JOIN (
                    SELECT DISTINCT exercise_id, MIN(module_id) AS module_id
                    FROM Module_Exercise
                    GROUP BY exercise_id
                ) me ON e.exercise_id = me.exercise_id
                LEFT JOIN Module m ON me.module_id = m.module_id
                LEFT JOIN Course c ON m.course_id = c.course_id
                WHERE se.student_id = %s AND se.completed_at IS NOT NULL
                ORDER BY se.completed_at DESC
                LIMIT 5

            """, [student_id])
            
            recent_exercises = []
            columns = [col[0] for col in cursor.description]
            for row in cursor.fetchall():
                exercise_dict = dict(zip(columns, row))
                # 添加练习相关信息（示例）
                exercise_dict['average_time'] = "5 min" # Placeholder
                exercise_dict['tags'] = ["SQL", "SELECT"] # Placeholder
                recent_exercises.append(exercise_dict)
                
        return Response({
            'status': 'success',
            'data': {
                'user': user_data,
                'course_stats': course_data,
                'exercise_stats': exercise_data,
                'recent_courses': recent_courses,
                'recent_exercises': recent_exercises
            }
        }, status=status.HTTP_200_OK)
            
    except Exception as e:
        print("❌ 获取学生仪表盘数据出错：", str(e))
        return Response({
            "status": "error",
            "message": str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['GET'])
@authentication_classes([CustomJWTAuthentication])
@permission_classes([IsAuthenticated])
def browse_all_courses_api(request):
    try:
        # 获取当前登录用户的 student_id
        student_id = request.user.user_id
        
        # 查询所有可用(active)的课程，包含该学生是否已注册的信息
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
                    CASE WHEN e.student_id IS NOT NULL THEN TRUE ELSE FALSE END as is_enrolled,
                    (SELECT COUNT(*) 
                     FROM Module m 
                     WHERE m.course_id = c.course_id) AS total_modules,
                    (SELECT COUNT(*) 
                     FROM Module_Exercise me
                     JOIN Module m ON me.module_id = m.module_id
                     WHERE m.course_id = c.course_id) AS total_exercises
                FROM Course c
                LEFT JOIN Enrollment e ON c.course_id = e.course_id AND e.student_id = %s AND e.status = 'enrolled'
                WHERE c.state = 'active'
                ORDER BY c.year DESC, c.term DESC
            """, [student_id])

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

@api_view(['POST'])
@authentication_classes([CustomJWTAuthentication])
@permission_classes([IsAuthenticated])
def enroll_course_api(request, course_id):
    try:
        # 获取当前登录用户的 student_id
        student_id = request.user.user_id
        
        # 检查课程是否存在且状态为active
        with connection.cursor() as cursor:
            cursor.execute("""
                SELECT course_id 
                FROM Course 
                WHERE course_id = %s AND state = 'active'
            """, [course_id])
            
            if not cursor.fetchone():
                return Response({
                    "status": "error",
                    "message": "课程不存在或已结束"
                }, status=status.HTTP_400_BAD_REQUEST)
                
            # 检查学生是否已经注册该课程
            cursor.execute("""
                SELECT enrollment_id 
                FROM Enrollment 
                WHERE student_id = %s AND course_id = %s
            """, [student_id, course_id])
            
            if cursor.fetchone():
                return Response({
                    "status": "error",
                    "message": "您已经注册了此课程"
                }, status=status.HTTP_400_BAD_REQUEST)
                
            # 注册课程
            cursor.execute("""
                INSERT INTO Enrollment (student_id, course_id, status)
                VALUES (%s, %s, 'enrolled')
            """, [student_id, course_id])

        return Response({
            "status": "success",
            "message": "课程注册成功"
        }, status=status.HTTP_200_OK)

    except Exception as e:
        print("❌ 注册课程出错：", str(e))
        return Response({
            "status": "error",
            "message": str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['GET'])
@authentication_classes([CustomJWTAuthentication])
@permission_classes([IsAuthenticated])
def student_all_exercises_api(request):
    try:
        student_id = request.user.user_id
        difficulty = request.query_params.get('difficulty')
        
        # 构建基础查询
        query = """
            SELECT 
                e.exercise_id,
                e.title,
                e.description,
                e.hint,
                e.difficulty,
                e.table_schema,
                c.course_id,
                c.course_name,
                c.course_code,
                m.module_id,
                m.module_name,
                CASE WHEN se.student_id IS NOT NULL THEN 1 ELSE 0 END as completed,
                CASE WHEN se.is_correct = TRUE THEN 1 ELSE 0 END as is_correct
            FROM Exercise e
            JOIN Module_Exercise me ON e.exercise_id = me.exercise_id
            JOIN Module m ON me.module_id = m.module_id
            JOIN Course c ON m.course_id = c.course_id
            JOIN Enrollment en ON c.course_id = en.course_id AND en.student_id = %s
            LEFT JOIN Student_Exercise se ON e.exercise_id = se.exercise_id AND se.student_id = %s
            WHERE en.status = 'enrolled'
        """
        
        params = [student_id, student_id]
        
        # 添加难度过滤
        if difficulty and difficulty in ['Easy', 'Medium', 'Hard']:
            query += " AND e.difficulty = %s"
            params.append(difficulty)
            
        # 添加排序
        query += " ORDER BY c.course_name, m.module_name, me.display_order"
        
        with connection.cursor() as cursor:
            cursor.execute(query, params)
            columns = [col[0] for col in cursor.description]
            exercises_raw = [dict(zip(columns, row)) for row in cursor.fetchall()]
            
            # 处理 table_schema 并去重
            processed_exercises = {}
            for exercise in exercises_raw:
                # 转换table_schema为JSON
                if exercise['table_schema']:
                    try:
                        exercise['table_schema'] = json.loads(exercise['table_schema'])
                    except json.JSONDecodeError:
                        exercise['table_schema'] = []
                else:
                    exercise['table_schema'] = []
                
                # 使用 exercise_id 作为 key 进行去重，保留第一次出现的记录
                if exercise['exercise_id'] not in processed_exercises:
                    processed_exercises[exercise['exercise_id']] = exercise
            
            # 将去重后的结果转换为列表
            exercises = list(processed_exercises.values())
            
        return Response({
            'status': 'success',
            'data': exercises
        }, status=status.HTTP_200_OK)
            
    except Exception as e:
        print("❌ 获取练习列表出错：", str(e))
        return Response({
            "status": "error",
            "message": str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['GET'])
@authentication_classes([CustomJWTAuthentication])
@permission_classes([IsAuthenticated])
def student_messages_api(request):
    try:
        student_id = request.user.user_id
        
        with connection.cursor() as cursor:
            # 获取该学生收到或发送的所有私人消息以及收到的课程公告
            cursor.execute("""
                -- Received Private Messages
                SELECT 
                    m.message_id,
                    m.sender_id,
                    u_sender.first_name as sender_first_name,
                    u_sender.last_name as sender_last_name,
                    u_sender.username as sender_username,
                    pm.receiver_id,
                    u_receiver.first_name as receiver_first_name, 
                    u_receiver.last_name as receiver_last_name,
                    u_receiver.username as receiver_username,
                    m.message_content,
                    m.timestamp,
                    'private' as message_type,
                    CASE WHEN m.sender_id = %s THEN TRUE ELSE FALSE END as is_sent_by_me
                FROM Message m
                JOIN PrivateMessage pm ON m.message_id = pm.message_id
                JOIN Users u_sender ON m.sender_id = u_sender.user_id
                LEFT JOIN Users u_receiver ON pm.receiver_id = u_receiver.user_id
                WHERE pm.receiver_id = %s OR m.sender_id = %s
                
                UNION ALL
                
                -- Received Course Announcements
                SELECT 
                    m.message_id,
                    m.sender_id,
                    u_sender.first_name as sender_first_name,
                    u_sender.last_name as sender_last_name,
                    u_sender.username as sender_username,
                    NULL as receiver_id, -- Announcements don't have a specific receiver ID in this context
                    NULL as receiver_first_name,
                    NULL as receiver_last_name,
                    NULL as receiver_username,
                    m.message_content,
                    m.timestamp,
                    'announcement' as message_type,
                    FALSE as is_sent_by_me -- Student cannot send announcements
                FROM Message m
                JOIN Announcement a ON m.message_id = a.message_id
                JOIN Course c ON a.course_id = c.course_id
                JOIN Enrollment e ON c.course_id = e.course_id
                JOIN Users u_sender ON m.sender_id = u_sender.user_id
                WHERE e.student_id = %s AND e.status = 'enrolled'
                
                ORDER BY timestamp DESC
            """, [student_id, student_id, student_id, student_id]) # Pass student_id four times
            
            columns = [col[0] for col in cursor.description]
            messages = [dict(zip(columns, row)) for row in cursor.fetchall()]
            
        return Response({
            'status': 'success',
            'data': messages
        }, status=status.HTTP_200_OK)
            
    except Exception as e:
        print("❌ 获取学生消息列表出错：", str(e)) # Update error message
        return Response({
            "status": "error",
            "message": "获取消息列表失败"
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

