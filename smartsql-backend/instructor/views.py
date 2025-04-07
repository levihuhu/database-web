from django.db import connection
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def instructor_courses(request):
    user = request.user
    try:
        instructor_id = user.user_id

        with connection.cursor() as cursor:
            cursor.execute("""
                SELECT *
                FROM Course
                WHERE instructor_id = %s
            """, [instructor_id])
            courses = cursor.fetchall()

        term_idx = ['Spring', 'Summer', 'Fall']
        result = []

        for course in courses:
            course_id = course[0]

            with connection.cursor() as cursor:
                cursor.execute("""
                    SELECT COUNT(*)
                    FROM Enrollment
                    WHERE course_id = %s AND status = 'enrolled'
                """, [course_id])
                enrolled_count = cursor.fetchone()[0]

            result.append({
                'course_id': course[0],
                'course_name': course[1],
                'course_code': course[2],
                'instructor': course[3],
                'course_description': course[4],
                'year': course[5],
                'term': term_idx[course[6] - 1],
                'state': course[7],
                'enrolled_students': enrolled_count
            })

        return Response({'courses': result})

    except Exception as e:
        return Response({'error': str(e)}, status=500)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def instructor_modules(request):
    user = request.user

    try:
        instructor_id = user.user_id

        with connection.cursor() as cursor:
            # Step 1: 查询讲师教授的课程
            cursor.execute("""
                SELECT course_id, course_name
                FROM Course
                WHERE instructor_id = %s
            """, [instructor_id])
            courses = cursor.fetchall()

        course_map = {course_id: course_name for course_id, course_name in courses}

        modules_result = []

        for course_id, course_name in courses:
            with connection.cursor() as cursor:
                # Step 2: 查询该课程下的模块
                cursor.execute("""
                    SELECT module_id, module_name, module_description
                    FROM Module
                    WHERE course_id = %s
                """, [course_id])
                modules = cursor.fetchall()

            for module in modules:
                module_id, module_name, module_description = module

                # Step 3: 查询模块下练习数量（如有 Exercise 表可用）
                with connection.cursor() as cursor:
                    cursor.execute("""
                        SELECT COUNT(*)
                        FROM Exercise
                        WHERE module_id = %s
                    """, [module_id])
                    exercise_count = cursor.fetchone()[0]

                modules_result.append({
                    'module_id': module_id,
                    'module_name': module_name,
                    'module_description': module_description,
                    'course_id': course_id,
                    'course_name': course_name,
                    'exercise_count': exercise_count
                })

        return Response({'modules': modules_result}, status=200)

    except Exception as e:
        return Response({'error': str(e)}, status=500)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def instructor_exercises(request):
    user = request.user

    try:
        instructor_id = user.user_id
        result = []

        with connection.cursor() as cursor:

            cursor.execute("""
                SELECT m.module_id, m.module_name, m.course_id, c.course_name
                FROM Module m
                JOIN Course c ON m.course_id = c.course_id
                WHERE c.instructor_id = %s
            """, [instructor_id])
            modules = cursor.fetchall()

        for module in modules:
            module_id, module_name, course_id, course_name = module

            with connection.cursor() as cursor:
                cursor.execute("""
                    SELECT exercise_id, 
                           title, 
                           description, 
                           hint, 
                           expected_answer, 
                           difficulty, 
                           table_schema,
                           module_id
                    FROM Exercise
                    WHERE module_id = %s
                """, [module_id])
                exercises = cursor.fetchall()

            for exercise in exercises:
                (
                    exercise_id,
                    title,
                    description,
                    hint,
                    expected_answer,
                    difficulty,
                    table_schema,
                    module_id_val
                ) = exercise

                result.append({
                    'id': exercise_id,
                    'title': title,
                    'description': description,
                    'hint': hint,
                    'expectedAnswer': expected_answer,
                    'difficulty': difficulty,
                    'tableSchema': table_schema,
                    'moduleId': module_id_val,
                    'module': module_name,
                    'course': course_name
                })

        return Response({'exercises': result}, status=200)

    except Exception as e:
        return Response({'error': str(e)}, status=500)