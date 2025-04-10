from django.db import connection, transaction
from rest_framework.decorators import api_view, permission_classes, authentication_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from core.authentication import CustomJWTAuthentication

@api_view(['GET'])
@authentication_classes([CustomJWTAuthentication])
@permission_classes([IsAuthenticated])
def instructor_courses(request):
    user = request.user
    try:
        instructor_id = user.user_id

        with connection.cursor() as cursor:
            cursor.execute("""
                SELECT 
                    c.course_id, 
                    c.course_name, 
                    c.course_code, 
                    c.instructor_id, 
                    c.course_description, 
                    c.year, 
                    c.term, 
                    c.state,
                    COUNT(e.student_id) as enrolled_students
                FROM Course c
                LEFT JOIN Enrollment e ON c.course_id = e.course_id AND e.status = 'enrolled'
                WHERE c.instructor_id = %s
                GROUP BY c.course_id, c.course_name, c.course_code, c.instructor_id, c.course_description, c.year, c.term, c.state
                ORDER BY c.year DESC, c.term DESC, c.course_name
            """, [instructor_id])
            
            columns = [col[0] for col in cursor.description]
            courses = [dict(zip(columns, row)) for row in cursor.fetchall()]

        term_map = {1: 'Spring', 2: 'Summer', 3: 'Fall'}
        for course in courses:
            course['term'] = term_map.get(course['term'], 'Unknown')

        return Response({'courses': courses})

    except Exception as e:
        return Response({'error': f'获取课程失败: {str(e)}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@authentication_classes([CustomJWTAuthentication])
@permission_classes([IsAuthenticated])
def instructor_course_insert(request):
    user = request.user
    instructor_id = user.user_id
    data = request.data

    course_name = data.get('course_name')
    course_code = data.get('course_code')
    year = data.get('year')
    term_str = data.get('term')
    state = data.get('state', 'active')
    course_description = data.get('course_description', '')

    if not all([course_name, course_code, year, term_str]):
        return Response({'error': '缺少必要的课程信息 (名称, 代码, 年份, 学期)'}, status=status.HTTP_400_BAD_REQUEST)

    term_map_rev = {'Spring': 1, 'Summer': 2, 'Fall': 3}
    term = term_map_rev.get(term_str)
    if term is None:
         return Response({'error': f'无效的学期: {term_str}'}, status=status.HTTP_400_BAD_REQUEST)

    try:
        with connection.cursor() as cursor:
            cursor.execute("""
                INSERT INTO Course (course_name, course_code, instructor_id, course_description, year, term, state)
                VALUES (%s, %s, %s, %s, %s, %s, %s)
            """, [course_name, course_code, instructor_id, course_description, year, term, state])
            
        return Response({'message': '课程添加成功'}, status=status.HTTP_201_CREATED)

    except Exception as e:
        return Response({'error': f'添加课程失败: {str(e)}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['PUT'])
@authentication_classes([CustomJWTAuthentication])
@permission_classes([IsAuthenticated])
def instructor_course_update(request):
    user = request.user
    instructor_id = user.user_id
    data = request.data

    # 从查询参数获取 course_id
    course_id = request.query_params.get('course_id')
    if not course_id:
        return Response({'error': '缺少 course_id 查询参数'}, status=status.HTTP_400_BAD_REQUEST)
        
    try:
        course_id = int(course_id) # 尝试转换为整数
    except ValueError:
        return Response({'error': '无效的 course_id'}, status=status.HTTP_400_BAD_REQUEST)

    # 获取并验证数据 (与之前相同)
    course_name = data.get('course_name')
    course_code = data.get('course_code')
    year = data.get('year')
    term_str = data.get('term')
    state = data.get('state')
    course_description = data.get('course_description')

    update_fields = {}
    if course_name: update_fields['course_name'] = course_name
    if course_code: update_fields['course_code'] = course_code
    if year: update_fields['year'] = year
    if state: update_fields['state'] = state
    if course_description is not None: update_fields['course_description'] = course_description
    if term_str:
        term_map_rev = {'Spring': 1, 'Summer': 2, 'Fall': 3}
        term = term_map_rev.get(term_str)
        if term is None:
            return Response({'error': f'无效的学期: {term_str}'}, status=status.HTTP_400_BAD_REQUEST)
        update_fields['term'] = term

    if not update_fields:
         return Response({'error': '没有提供需要更新的字段'}, status=status.HTTP_400_BAD_REQUEST)

    try:
        with connection.cursor() as cursor:
            # 验证课程是否存在且属于该讲师 (与之前相同)
            cursor.execute("SELECT instructor_id FROM Course WHERE course_id = %s", [course_id])
            course = cursor.fetchone()
            if not course:
                return Response({'error': '课程未找到'}, status=status.HTTP_404_NOT_FOUND)
            if course[0] != instructor_id:
                 return Response({'error': '无权修改此课程'}, status=status.HTTP_403_FORBIDDEN)

            # 构建 SQL 更新语句 (与之前相同)
            set_clause = ", ".join([f"{key} = %s" for key in update_fields])
            values = list(update_fields.values()) + [course_id]
            
            cursor.execute(f"UPDATE Course SET {set_clause} WHERE course_id = %s", values)

        return Response({'message': '课程更新成功'})

    except Exception as e:
        return Response({'error': f'更新课程失败: {str(e)}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['DELETE'])
@authentication_classes([CustomJWTAuthentication])
@permission_classes([IsAuthenticated])
def instructor_course_delete(request):
    user = request.user
    instructor_id = user.user_id

    # 从查询参数获取 course_id
    course_id = request.query_params.get('course_id')
    if not course_id:
        return Response({'error': '缺少 course_id 查询参数'}, status=status.HTTP_400_BAD_REQUEST)
        
    try:
        course_id = int(course_id) # 尝试转换为整数
    except ValueError:
        return Response({'error': '无效的 course_id'}, status=status.HTTP_400_BAD_REQUEST)

    try:
        with connection.cursor() as cursor:
            # 验证课程是否存在且属于该讲师 (与之前相同)
            cursor.execute("SELECT instructor_id FROM Course WHERE course_id = %s", [course_id])
            course = cursor.fetchone()
            if not course:
                return Response({'error': '课程未找到'}, status=status.HTTP_404_NOT_FOUND)
            if course[0] != instructor_id:
                 return Response({'error': '无权删除此课程'}, status=status.HTTP_403_FORBIDDEN)

            # 检查是否有学生注册 (与之前相同)
            cursor.execute("SELECT COUNT(*) FROM Enrollment WHERE course_id = %s AND status = 'enrolled'", [course_id])
            enrolled_count = cursor.fetchone()[0]
            if enrolled_count > 0:
                return Response({'error': f'无法删除: 有 {enrolled_count} 名学生已注册此课程'}, status=status.HTTP_400_BAD_REQUEST)
                
            # 执行删除 (与之前相同)
            cursor.execute("DELETE FROM Course WHERE course_id = %s", [course_id])
            
            # 检查是否真的删除了 (可选，与之前相同)
            if cursor.rowcount == 0:
                 return Response({'error': '课程未找到或已被删除'}, status=status.HTTP_404_NOT_FOUND)

        return Response(status=status.HTTP_204_NO_CONTENT)

    except Exception as e:
        return Response({'error': f'删除课程失败: {str(e)}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
@authentication_classes([CustomJWTAuthentication])
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
@authentication_classes([CustomJWTAuthentication])
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