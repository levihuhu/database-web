from django.db import connection, transaction
from rest_framework.decorators import api_view, permission_classes, authentication_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from core.authentication import CustomJWTAuthentication
import json
from functools import wraps
import decimal

# === Helper Functions (Assuming these are defined above or imported) ===
TERM_MAP = {1: 'Spring', 2: 'Summer', 3: 'Fall'}
TERM_MAP_REV = {v: k for k, v in TERM_MAP.items()}

def dictfetchall(cursor):
    """Return all rows from a cursor as a list of dicts"""
    columns = [col[0] for col in cursor.description]
    return [dict(zip(columns, row)) for row in cursor.fetchall()]

def dictfetchone(cursor):
    """Return one row from a cursor as a dict"""
    columns = [col[0] for col in cursor.description]
    row = cursor.fetchone()
    return dict(zip(columns, row)) if row else None

def safe_api_view(func):
    """Decorator to catch general exceptions in API views."""
    @wraps(func)
    def wrapper(*args, **kwargs):
        try:
            return func(*args, **kwargs)
        # Catch specific DB errors if needed, otherwise catch general Exception
        except Exception as e:
            # Log the error in a real application
            print(f"API Error in {func.__name__}: {e}") # Basic logging
            return Response({'error': f'服务器内部错误: {str(e)}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    return wrapper

def get_term_number(term_str):
    """Convert term string (Spring, Summer, Fall) to number."""
    return TERM_MAP_REV.get(term_str)

def map_term_to_str(term_num):
    """Convert term number to string."""
    return TERM_MAP.get(term_num, 'Unknown')

def check_instructor_ownership(instructor_id, course_id=None, module_id=None, exercise_id=None):
    """Checks resource ownership and returns (bool, Response or None)."""
    with connection.cursor() as cursor:
        if course_id:
            cursor.execute("SELECT instructor_id FROM Course WHERE course_id = %s", [course_id])
            row = cursor.fetchone()
            if not row or row[0] != instructor_id:
                return False, Response({'error': '无权访问此课程'}, status=status.HTTP_403_FORBIDDEN)
        if module_id:
            cursor.execute("""
                SELECT c.instructor_id FROM Module m JOIN Course c ON m.course_id = c.course_id
                WHERE m.module_id = %s """, [module_id])
            row = cursor.fetchone()
            if not row or row[0] != instructor_id:
                 return False, Response({'error': '无权访问此模块'}, status=status.HTTP_403_FORBIDDEN)
        if exercise_id:
             cursor.execute("""
                 SELECT c.instructor_id FROM Exercise e JOIN Module_Exercise me ON e.exercise_id = me.exercise_id
                 JOIN Module m ON me.module_id = m.module_id JOIN Course c ON m.course_id = c.course_id
                 WHERE e.exercise_id = %s LIMIT 1 """, [exercise_id])
             row = cursor.fetchone()
             if not row or row[0] != instructor_id:
                  return False, Response({'error': '无权访问此练习'}, status=status.HTTP_403_FORBIDDEN)
    return True, None

# === Course Views ===

@api_view(['GET'])
@authentication_classes([CustomJWTAuthentication])
@permission_classes([IsAuthenticated])
@safe_api_view
def instructor_courses(request):
    """GET: List courses for the instructor, with filtering."""
    user = request.user
    instructor_id = user.user_id

    search_term = request.query_params.get('search', '')
    term_filter = request.query_params.get('term', '')
    state_filter = request.query_params.get('state', '')

    with connection.cursor() as cursor:
        query = """
            SELECT c.course_id, c.course_name, c.course_code, c.instructor_id,
                   c.course_description, c.year, c.term, c.state,
                   COUNT(e.student_id) as enrolled_students
            FROM Course c
            LEFT JOIN Enrollment e ON c.course_id = e.course_id AND e.status = 'enrolled'
            WHERE c.instructor_id = %s """
        params = [instructor_id]

        if search_term:
            query += " AND (c.course_name LIKE %s OR c.course_code LIKE %s OR c.course_description LIKE %s) "
            like = f"%{search_term}%"
            params.extend([like, like, like])
        if term_filter:
            term_num = get_term_number(term_filter)
            if term_num:
                query += " AND c.term = %s "
                params.append(term_num)
        if state_filter:
            query += " AND c.state = %s "
            params.append(state_filter)

        query += """
            GROUP BY c.course_id, c.course_name, c.course_code, c.instructor_id,
                     c.course_description, c.year, c.term, c.state
            ORDER BY c.year DESC, c.term DESC, c.course_name """
        cursor.execute(query, params)
        courses = dictfetchall(cursor)

    for c in courses:
        c['term'] = map_term_to_str(c['term'])

    return Response({'courses': courses})

@api_view(['POST'])
@authentication_classes([CustomJWTAuthentication])
@permission_classes([IsAuthenticated])
@safe_api_view
def instructor_course_insert(request):
    """POST: Create a new course."""
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

    term = get_term_number(term_str)
    if term is None:
         return Response({'error': f'无效的学期: {term_str}'}, status=status.HTTP_400_BAD_REQUEST)

    with connection.cursor() as cursor:
        cursor.execute("""
            INSERT INTO Course (course_name, course_code, instructor_id, course_description, year, term, state)
            VALUES (%s, %s, %s, %s, %s, %s, %s)
        """, [course_name, course_code, instructor_id, course_description, year, term, state])

    return Response({'message': '课程添加成功'}, status=status.HTTP_201_CREATED)


@api_view(['PUT'])
@authentication_classes([CustomJWTAuthentication])
@permission_classes([IsAuthenticated])
@safe_api_view
def instructor_course_update(request):
    """PUT: Update a course using course_id from query params."""
    user = request.user
    instructor_id = user.user_id
    data = request.data

    course_id = request.query_params.get('course_id')
    if not course_id: return Response({'error': '缺少 course_id 查询参数'}, status=status.HTTP_400_BAD_REQUEST)
    try: course_id = int(course_id)
    except ValueError: return Response({'error': '无效的 course_id'}, status=status.HTTP_400_BAD_REQUEST)

    is_owner, error_response = check_instructor_ownership(instructor_id, course_id=course_id)
    if not is_owner: return error_response

    update_fields = {}
    if 'course_name' in data: update_fields['course_name'] = data['course_name']
    if 'course_code' in data: update_fields['course_code'] = data['course_code']
    if 'year' in data: update_fields['year'] = data['year']
    if 'state' in data: update_fields['state'] = data['state']
    if 'course_description' in data: update_fields['course_description'] = data['course_description']
    if 'term' in data:
        term = get_term_number(data['term'])
        if term is None: return Response({'error': f'无效的学期: {data["term"]}'}, status=status.HTTP_400_BAD_REQUEST)
        update_fields['term'] = term

    if not update_fields: return Response({'error': '没有提供需要更新的字段'}, status=status.HTTP_400_BAD_REQUEST)

    set_clause = ", ".join([f"{key} = %s" for key in update_fields])
    values = list(update_fields.values()) + [course_id]

    with connection.cursor() as cursor:
        cursor.execute(f"UPDATE Course SET {set_clause} WHERE course_id = %s", values)

    return Response({'message': '课程更新成功'})


@api_view(['DELETE'])
@authentication_classes([CustomJWTAuthentication])
@permission_classes([IsAuthenticated])
@safe_api_view
def instructor_course_delete(request):
    """DELETE: Delete a course using course_id from query params."""
    user = request.user
    instructor_id = user.user_id

    course_id = request.query_params.get('course_id')
    if not course_id: return Response({'error': '缺少 course_id 查询参数'}, status=status.HTTP_400_BAD_REQUEST)
    try: course_id = int(course_id)
    except ValueError: return Response({'error': '无效的 course_id'}, status=status.HTTP_400_BAD_REQUEST)

    is_owner, error_response = check_instructor_ownership(instructor_id, course_id=course_id)
    if not is_owner: return error_response

    with connection.cursor() as cursor:
        # Check enrollments first
        cursor.execute("SELECT COUNT(*) FROM Enrollment WHERE course_id = %s AND status = 'enrolled'", [course_id])
        enrolled_count = cursor.fetchone()[0]
        if enrolled_count > 0:
            return Response({'error': f'无法删除: 有 {enrolled_count} 名学生已注册此课程'}, status=status.HTTP_400_BAD_REQUEST)

        # Perform delete (ON DELETE CASCADE should handle related module/enrollment etc. based on DDL)
        cursor.execute("DELETE FROM Course WHERE course_id = %s", [course_id])
        if cursor.rowcount == 0:
            return Response({'error': '课程未找到或已被删除'}, status=status.HTTP_404_NOT_FOUND)

    return Response(status=status.HTTP_204_NO_CONTENT)


@api_view(['GET'])
@authentication_classes([CustomJWTAuthentication])
@permission_classes([IsAuthenticated])
@safe_api_view
def instructor_course_detail(request, course_id):
    """GET: Details for a single course."""
    user = request.user
    instructor_id = user.user_id

    is_owner, error_response = check_instructor_ownership(instructor_id, course_id=course_id)
    if not is_owner: return error_response

    with connection.cursor() as cursor:
        cursor.execute("""
            SELECT course_id, course_name, course_code, course_description, year, term, state
            FROM Course WHERE course_id = %s AND instructor_id = %s
        """, [course_id, instructor_id])
        course_data = dictfetchone(cursor)

        if not course_data: return Response({'error': '课程未找到'}, status=status.HTTP_404_NOT_FOUND)
        course_data['term'] = map_term_to_str(course_data.get('term'))

    return Response(course_data)

# === Module Views ===

@api_view(['GET'])
@authentication_classes([CustomJWTAuthentication])
@permission_classes([IsAuthenticated])
@safe_api_view
def instructor_modules_by_course(request, course_id):
    """GET: Modules for a specific course."""
    user = request.user
    instructor_id = user.user_id

    is_owner, error_response = check_instructor_ownership(instructor_id, course_id=course_id)
    if not is_owner: return error_response

    with connection.cursor() as cursor:
        cursor.execute("""
            SELECT m.module_id, m.module_name, m.module_description, COUNT(me.exercise_id) as exercise_count
            FROM Module m LEFT JOIN Module_Exercise me ON m.module_id = me.module_id
            WHERE m.course_id = %s GROUP BY m.module_id, m.module_name, m.module_description
            ORDER BY m.module_name """, [course_id])
        modules = dictfetchall(cursor)
    return Response({'modules': modules})

@api_view(['GET', 'POST'])
@authentication_classes([CustomJWTAuthentication])
@permission_classes([IsAuthenticated])
@safe_api_view
def instructor_modules(request):
    """GET: All modules, filterable. POST: Creates a module."""
    user = request.user
    instructor_id = user.user_id

    if request.method == 'GET':
        course_id_filter = request.query_params.get('course_id')
        search_term = request.query_params.get('search', '')

        with connection.cursor() as cursor:
            query = """
                SELECT m.module_id, m.module_name, m.module_description, m.course_id,
                       c.course_name, COUNT(me.exercise_id) as exercise_count
                FROM Module m JOIN Course c ON m.course_id = c.course_id
                LEFT JOIN Module_Exercise me ON m.module_id = me.module_id
                WHERE c.instructor_id = %s """
            params = [instructor_id]
            if course_id_filter:
                query += " AND m.course_id = %s "
                params.append(course_id_filter)
            if search_term:
                query += " AND (m.module_name LIKE %s OR m.module_description LIKE %s OR c.course_name LIKE %s) "
                like = f"%{search_term}%"
                params.extend([like, like, like])
            query += " GROUP BY m.module_id, m.module_name, m.module_description, m.course_id, c.course_name ORDER BY c.course_name, m.module_name"
            cursor.execute(query, params)
            modules_result = dictfetchall(cursor)
        return Response({'modules': modules_result})

    elif request.method == 'POST':
        data = request.data
        module_name = data.get('module_name')
        module_description = data.get('module_description', '')
        course_id = data.get('course_id')

        if not module_name or not course_id:
            return Response({'error': '模块名称和课程ID不能为空'}, status=status.HTTP_400_BAD_REQUEST)

        is_owner, error_response = check_instructor_ownership(instructor_id, course_id=course_id)
        if not is_owner: return error_response

        with connection.cursor() as cursor:
            cursor.execute(""" INSERT INTO Module (module_name, module_description, course_id)
                              VALUES (%s, %s, %s) """, [module_name, module_description, course_id])
        return Response({'message': '模块添加成功'}, status=status.HTTP_201_CREATED)


@api_view(['GET', 'PUT', 'DELETE'])
@authentication_classes([CustomJWTAuthentication])
@permission_classes([IsAuthenticated])
@safe_api_view
def instructor_module_detail(request, module_id):
    """GET/PUT/DELETE for a specific module."""
    user = request.user
    instructor_id = user.user_id

    is_owner, error_response = check_instructor_ownership(instructor_id, module_id=module_id)
    if not is_owner: return error_response

    if request.method == 'GET':
        with connection.cursor() as cursor:
            cursor.execute(""" SELECT m.module_id, m.module_name, m.module_description, m.course_id, c.course_name
                             FROM Module m JOIN Course c ON m.course_id = c.course_id
                             WHERE m.module_id = %s """, [module_id])
            module_data = dictfetchone(cursor)
            if not module_data: return Response({'error': '模块未找到'}, status=status.HTTP_404_NOT_FOUND)
        return Response(module_data)

    elif request.method == 'PUT':
        data = request.data
        update_fields = {}
        if 'module_name' in data: update_fields['module_name'] = data['module_name']
        if 'module_description' in data: update_fields['module_description'] = data['module_description']
        # Potentially update course_id, requires re-checking ownership
        if 'course_id' in data:
            new_course_id = data['course_id']
            is_owner_new, error_response_new = check_instructor_ownership(instructor_id, course_id=new_course_id)
            if not is_owner_new: return error_response_new
            update_fields['course_id'] = new_course_id

        if not update_fields: return Response({'error': '没有提供需要更新的字段'}, status=status.HTTP_400_BAD_REQUEST)

        set_clause = ", ".join([f"{key} = %s" for key in update_fields])
        values = list(update_fields.values()) + [module_id]

        with connection.cursor() as cursor:
             cursor.execute(f"UPDATE Module SET {set_clause} WHERE module_id = %s", values)
        return Response({'message': '模块更新成功'})

    elif request.method == 'DELETE':
        with connection.cursor() as cursor:
             cursor.execute("SELECT COUNT(*) FROM Module_Exercise WHERE module_id = %s", [module_id])
             if cursor.fetchone()[0] > 0:
                 return Response({'error': '无法删除: 该模块下关联了练习'}, status=status.HTTP_400_BAD_REQUEST)
             cursor.execute("DELETE FROM Module WHERE module_id = %s", [module_id])
             if cursor.rowcount == 0: return Response({'error': '模块未找到或已被删除'}, status=status.HTTP_404_NOT_FOUND)
        return Response(status=status.HTTP_204_NO_CONTENT)


# === Exercise Views ===

@api_view(['GET'])
@authentication_classes([CustomJWTAuthentication])
@permission_classes([IsAuthenticated])
@safe_api_view
def instructor_exercises_by_module(request, module_id):
    """GET: Exercises for a specific module."""
    user = request.user
    instructor_id = user.user_id

    is_owner, error_response = check_instructor_ownership(instructor_id, module_id=module_id)
    if not is_owner: return error_response

    with connection.cursor() as cursor:
        cursor.execute(""" SELECT * FROM Exercise
                                WHERE exercise_id IN (
                                    SELECT DISTINCT exercise_id
                                    FROM Module_Exercise
                                    WHERE module_id = %s
                                )
                                ORDER BY title
                                """, [module_id])
        exercises = dictfetchall(cursor)

    result = [{
            'id': ex['exercise_id'], 'title': ex['title'], 'description': ex['description'],
            'hint': ex['hint'], 'expectedAnswer': ex['expected_answer'], 'difficulty': ex['difficulty'],
            'tableSchema': ex.get('table_schema'), 'moduleId': module_id
        } for ex in exercises]
    return Response({'exercises': result})

@api_view(['GET', 'POST'])
@authentication_classes([CustomJWTAuthentication])
@permission_classes([IsAuthenticated])
@safe_api_view
def instructor_exercises(request):
    """GET: All exercises, filterable, sorted. POST: Creates exercise & links to module."""
    user = request.user
    instructor_id = user.user_id

    if request.method == 'GET':
        module_id_filter = request.query_params.get('module_id')
        course_id_filter = request.query_params.get('course_id')
        search_term = request.query_params.get('search', '')
        difficulty_filter = request.query_params.get('difficulty', '')
        sort_by = request.query_params.get('sort', 'id_asc')

        with connection.cursor() as cursor:
             query = """
                 SELECT DISTINCT e.exercise_id, e.title, e.description, e.hint, e.expected_answer, e.difficulty, e.table_schema,
                        m.module_id, m.module_name, c.course_name, c.course_id
                 FROM Exercise e LEFT JOIN Module_Exercise me ON e.exercise_id = me.exercise_id
                 LEFT JOIN Module m ON me.module_id = m.module_id
                 LEFT JOIN Course c ON m.course_id = c.course_id
                 WHERE e.created_by = %s OR c.instructor_id = %s """
             params = [instructor_id, instructor_id]
             if module_id_filter: query += " AND m.module_id = %s "; params.append(module_id_filter)
             if course_id_filter: query += " AND c.course_id = %s "; params.append(course_id_filter)
             if search_term: query += " AND (e.title LIKE %s OR e.description LIKE %s) "; like = f"%{search_term}%"; params.extend([like, like])
             if difficulty_filter: query += " AND e.difficulty = %s "; params.append(difficulty_filter)

             if sort_by == 'id_asc': order_clause = " ORDER BY e.exercise_id ASC"
             elif sort_by == 'id_desc': order_clause = " ORDER BY e.exercise_id DESC"
             elif sort_by == 'title_asc': order_clause = " ORDER BY e.title ASC"
             elif sort_by == 'title_desc': order_clause = " ORDER BY e.title DESC"
             else: order_clause = " ORDER BY e.exercise_id ASC"

             cursor.execute(query + order_clause, params)
             exercises_raw = dictfetchall(cursor)

             result = [{
                'id': ex['exercise_id'], 'title': ex['title'], 'description': ex['description'],
                'hint': ex['hint'], 'expectedAnswer': ex['expected_answer'], 'difficulty': ex['difficulty'],
                'tableSchema': ex.get('table_schema'), 'moduleId': ex.get('module_id'),
                'module': ex.get('module_name'), 'course': ex.get('course_name'), 'courseId': ex.get('course_id')
             } for ex in exercises_raw]
        return Response({'exercises': result})

    elif request.method == 'POST':
         data = request.data
         module_id = data.get('moduleId')
         title = data.get('title')
         description = data.get('description')
         hint = data.get('hint', '')
         expected_answer = data.get('expectedAnswer')
         difficulty = data.get('difficulty')
         table_schema = data.get('tableSchema')

         if not all([module_id, title, description, expected_answer, difficulty]): # Schema can be optional? Check DDL/reqs
             return Response({'error': '缺少必要的练习信息 (包括关联模块ID)'}, status=status.HTTP_400_BAD_REQUEST)

         is_owner, error_response = check_instructor_ownership(instructor_id, module_id=module_id)
         if not is_owner: return error_response

         table_schema_str = None
         if table_schema: # Handle if schema is optional
            try:
                 if isinstance(table_schema, (dict, list)): table_schema_str = json.dumps(table_schema)
                 elif isinstance(table_schema, str): json.loads(table_schema); table_schema_str = table_schema
                 else: raise ValueError("Invalid format")
            except (json.JSONDecodeError, ValueError):
                 return Response({'error': 'Table Schema 格式无效或不是有效的 JSON'}, status=status.HTTP_400_BAD_REQUEST)

         with transaction.atomic():
             with connection.cursor() as cursor:
                 cursor.execute(""" INSERT INTO Exercise (created_by, title, description, hint, expected_answer, difficulty, table_schema)
                                   VALUES (%s, %s, %s, %s, %s, %s, %s) """,
                                [instructor_id, title, description, hint, expected_answer, difficulty, table_schema_str])
                 exercise_id = cursor.lastrowid
                 cursor.execute(""" INSERT INTO Module_Exercise (module_id, exercise_id) VALUES (%s, %s) """,
                                [module_id, exercise_id])
         return Response({'message': '练习添加并关联成功', 'exercise_id': exercise_id}, status=status.HTTP_201_CREATED)


@api_view(['GET', 'PUT', 'DELETE'])
@authentication_classes([CustomJWTAuthentication])
@permission_classes([IsAuthenticated])
@safe_api_view
def instructor_exercise_detail(request, exercise_id):
    """GET/PUT/DELETE for a specific exercise."""
    user = request.user
    instructor_id = user.user_id

    is_owner, error_response = check_instructor_ownership(instructor_id, exercise_id=exercise_id)
    if not is_owner: return error_response

    if request.method == 'GET':
        with connection.cursor() as cursor:
             cursor.execute(""" SELECT e.*, m.module_id, m.module_name, c.course_name, c.course_id
                              FROM Exercise e LEFT JOIN Module_Exercise me ON e.exercise_id = me.exercise_id
                              LEFT JOIN Module m ON me.module_id = m.module_id LEFT JOIN Course c ON m.course_id = c.course_id
                              WHERE e.exercise_id = %s """, [exercise_id])
             exercise_raw = dictfetchone(cursor)
             if not exercise_raw: return Response({'error': '练习未找到'}, status=status.HTTP_404_NOT_FOUND)

             exercise_data = {
                'id': exercise_raw['exercise_id'], 'title': exercise_raw['title'], 'description': exercise_raw['description'],
                'hint': exercise_raw['hint'], 'expectedAnswer': exercise_raw['expected_answer'], 'difficulty': exercise_raw['difficulty'],
                'tableSchema': exercise_raw.get('table_schema'), 'moduleId': exercise_raw.get('module_id'),
                'module': exercise_raw.get('module_name'), 'course': exercise_raw.get('course_name'), 'courseId': exercise_raw.get('course_id')
             }
        return Response(exercise_data)

    elif request.method == 'PUT':
        data = request.data
        update_fields = {}
        new_module_id = None

        # Populate update_fields for Exercise table
        if 'title' in data: update_fields['title'] = data['title']
        if 'description' in data: update_fields['description'] = data['description']
        if 'hint' in data: update_fields['hint'] = data['hint']
        if 'expectedAnswer' in data: update_fields['expected_answer'] = data['expectedAnswer']
        if 'difficulty' in data: update_fields['difficulty'] = data['difficulty']
        if 'tableSchema' in data:
            table_schema = data['tableSchema']
            table_schema_str = None
            if table_schema: # Handle optional schema
                try:
                     if isinstance(table_schema, (dict, list)): table_schema_str = json.dumps(table_schema)
                     elif isinstance(table_schema, str): json.loads(table_schema); table_schema_str = table_schema
                     else: raise ValueError()
                except: return Response({'error': 'Table Schema 格式无效或不是有效的 JSON'}, status=status.HTTP_400_BAD_REQUEST)
            update_fields['table_schema'] = table_schema_str # Store null if empty/invalid input

        if 'moduleId' in data: new_module_id = data['moduleId']

        if not update_fields and new_module_id is None:
            return Response({'error': '没有提供需要更新的字段'}, status=status.HTTP_400_BAD_REQUEST)

        with transaction.atomic():
            with connection.cursor() as cursor:
                if update_fields:
                    set_clause = ", ".join([f"{key} = %s" for key in update_fields])
                    values = list(update_fields.values()) + [exercise_id]
                    cursor.execute(f"UPDATE Exercise SET {set_clause} WHERE exercise_id = %s", values)

                if new_module_id is not None:
                     is_new_owner, error_response_new = check_instructor_ownership(instructor_id, module_id=new_module_id)
                     if not is_new_owner: raise Exception(error_response_new.data['error']) # Use Exception to trigger rollback
                     cursor.execute("DELETE FROM Module_Exercise WHERE exercise_id = %s", [exercise_id])
                     cursor.execute("INSERT INTO Module_Exercise (module_id, exercise_id) VALUES (%s, %s)",
                                    [new_module_id, exercise_id])
        return Response({'message': '练习更新成功'})

    elif request.method == 'DELETE':
        with connection.cursor() as cursor:
            # Delete from Exercise first (CASCADE should handle Module_Exercise)
            cursor.execute("DELETE FROM Exercise WHERE exercise_id = %s", [exercise_id])
            if cursor.rowcount == 0: return Response({'error': '练习未找到或已被删除'}, status=status.HTTP_404_NOT_FOUND)
        return Response(status=status.HTTP_204_NO_CONTENT)


# === Student Views ===
@api_view(['GET'])
@authentication_classes([CustomJWTAuthentication])
@permission_classes([IsAuthenticated])
@safe_api_view
def instructor_students(request):
    """GET: Students enrolled in instructor's courses, filterable, including their enrollments."""
    user = request.user
    instructor_id = user.user_id

    course_id_filter = request.query_params.get('course_id')
    status_filter = request.query_params.get('status') # Get status filter
    search_term = request.query_params.get('search', '')

    students_data = {}
    try:
        with connection.cursor() as cursor:
            # Step 1: Find distinct students matching criteria based on at least one enrollment
            # We select students first, then fetch their enrollments separately.
            student_query = """
                SELECT DISTINCT u.user_id, u.username, u.first_name, u.last_name, u.email
                FROM Users u
                JOIN Enrollment e ON u.user_id = e.student_id
                JOIN Course c ON e.course_id = c.course_id
                WHERE c.instructor_id = %s AND u.user_type = 'Student'
            """
            params = [instructor_id]

            # Apply filters to the student query
            if course_id_filter:
                student_query += " AND e.course_id = %s "
                params.append(course_id_filter)
            if status_filter:
                student_query += " AND e.status = %s "
                params.append(status_filter)
            if search_term:
                 student_query += " AND (u.username LIKE %s OR u.first_name LIKE %s OR u.last_name LIKE %s OR u.email LIKE %s) "
                 like = f"%{search_term}%"; params.extend([like, like, like, like])

            student_query += " ORDER BY u.last_name, u.first_name "

            cursor.execute(student_query, params)
            students = dictfetchall(cursor)

            student_ids = [s['user_id'] for s in students]

            # Initialize students_data with basic info and empty enrollments
            for student in students:
                students_data[student['user_id']] = {
                     **student, # Spread basic student info
                    'enrollments': [] # Initialize empty enrollments list
                }

            # Step 2: Fetch all relevant enrollments for these students in instructor's courses
            if student_ids: # Only query if there are students found
                enrollment_query = """
                    SELECT
                        e.enrollment_id, e.student_id, e.status,
                        c.course_id, c.course_name, c.course_code, c.year, c.term, c.state as course_state,
                        s.total_score as grade
                    FROM Enrollment e
                    JOIN Course c ON e.course_id = c.course_id
                    LEFT JOIN Score s ON e.student_id = s.student_id AND e.course_id = s.course_id
                    WHERE c.instructor_id = %s AND e.student_id IN %s
                    ORDER BY c.year DESC, c.term DESC
                """
                # Ensure student_ids is a tuple for the IN clause
                cursor.execute(enrollment_query, [instructor_id, tuple(student_ids)])
                all_enrollments = dictfetchall(cursor)

                # Step 3: Populate the enrollments list for each student
                for enrollment in all_enrollments:
                    student_id = enrollment['student_id']
                    if student_id in students_data:
                         enrollment['term'] = map_term_to_str(enrollment['term']) # Map term number to string
                         students_data[student_id]['enrollments'].append(enrollment)

    except Exception as e:
        print(f"Error fetching student enrollments: {e}")
        # Depending on desired behavior, you might return partial data or an error
        # For now, just log and return what we have (might be empty)

    # Filter out students who ended up with no enrollments after potential filtering mismatches
    # (though the initial query should prevent this unless status filter is complex)
    # final_student_list = [s for s in students_data.values() if s['enrollments']]


    return Response({'students': list(students_data.values())}) # Return the populated dictionary values as a list

@api_view(['GET'])
@authentication_classes([CustomJWTAuthentication])
@permission_classes([IsAuthenticated])
@safe_api_view
def instructor_get_my_students(request):
    """GET: A simple list of students (id, name) enrolled in the instructor's courses."""
    user = request.user
    instructor_id = user.user_id

    if user.user_type != 'Instructor':
        return Response({"error": "Permission Denied"}, status=status.HTTP_403_FORBIDDEN)

    with connection.cursor() as cursor:
        cursor.execute("""
            SELECT DISTINCT u.user_id, u.username, u.first_name, u.last_name
            FROM Users u
            JOIN Enrollment e ON u.user_id = e.student_id
            JOIN Course c ON e.course_id = c.course_id
            WHERE c.instructor_id = %s AND e.status = 'enrolled' AND u.user_type = 'Student'
            ORDER BY u.last_name, u.first_name
        """, [instructor_id])
        students = dictfetchall(cursor)
        # Format for frontend select
        student_list = [
            {
                "value": s['user_id'],
                "label": f"{s['first_name']} {s['last_name']} ({s['username']})"
            }
            for s in students
        ]

    return Response({'students': student_list})

# === Dashboard View ===
@api_view(['GET'])
@authentication_classes([CustomJWTAuthentication])
@permission_classes([IsAuthenticated])
@safe_api_view
def instructor_dashboard_data(request):
    """GET: Data for the instructor dashboard."""
    user = request.user
    instructor_id = user.user_id

    with connection.cursor() as cursor:
        # Count active courses
        cursor.execute("SELECT COUNT(*) FROM Course WHERE instructor_id = %s AND state = 'active'", [instructor_id])
        active_courses_count = cursor.fetchone()[0]

        # Count unique enrolled students in active courses
        cursor.execute(""" SELECT COUNT(DISTINCT e.student_id) FROM Enrollment e
                         JOIN Course c ON e.course_id = c.course_id
                         WHERE c.instructor_id = %s AND c.state = 'active' AND e.status = 'enrolled' """, [instructor_id])
        total_enrolled_students = cursor.fetchone()[0]

        # Summary for top 5 active courses by enrollment - ADD year, term, state
        cursor.execute("""
            SELECT
                c.course_id, c.course_name, c.course_code, c.year, c.term, c.state,
                COUNT(e.student_id) as enrolled_count
            FROM Course c
            LEFT JOIN Enrollment e ON c.course_id = e.course_id AND e.status = 'enrolled'
            WHERE c.instructor_id = %s AND c.state = 'active'
            GROUP BY c.course_id, c.course_name, c.course_code, c.year, c.term, c.state
            ORDER BY enrolled_count DESC
            LIMIT 5
        """, [instructor_id])
        top_courses = dictfetchall(cursor)
        # Map term number to string for display
        for course in top_courses:
            course['term'] = map_term_to_str(course['term'])

        # Example: Get overall average grade across all scores for the instructor's courses
        # We join Course and Score tables directly.
        cursor.execute(""" SELECT AVG(s.total_score) FROM Score s
                          JOIN Course c ON s.course_id = c.course_id
                          WHERE c.instructor_id = %s AND s.total_score IS NOT NULL """, [instructor_id])
        avg_grade_result = cursor.fetchone()
        average_grade = float(avg_grade_result[0]) if avg_grade_result and avg_grade_result[0] is not None else None


    dashboard_data = {
        'active_courses_count': active_courses_count,
        'total_enrolled_students': total_enrolled_students,
        'top_courses_summary': top_courses,
        # Rename the key for clarity if needed, e.g., 'average_score_all_courses'
        'average_grade_completed': round(average_grade, 2) if average_grade is not None else None,
        # Add more data points: recently graded exercises, pending tasks, etc.
    }
    return Response(dashboard_data)

# === Messaging Views ===

@api_view(['GET', 'POST'])
@authentication_classes([CustomJWTAuthentication])
@permission_classes([IsAuthenticated])
@safe_api_view
def instructor_messages_api(request):
    """GET: Fetch messages involving the instructor (sent or received). POST: Send a new message."""
    instructor_id = request.user.user_id

    if request.method == 'GET':
        search_term = request.query_params.get('search', '')

        with connection.cursor() as cursor:
            # Fetch private messages involving this instructor (sent OR received)
            # and announcements sent by this instructor
            query = """
                -- Private Messages (Sent OR Received)
                SELECT
                    m.message_id,
                    m.sender_id,
                    u_sender.first_name as sender_first_name,
                    u_sender.last_name as sender_last_name,
                    u_sender.username as sender_username,
                    pm.receiver_id, -- Added receiver_id
                    u_receiver.first_name as receiver_first_name, -- Added receiver name
                    u_receiver.last_name as receiver_last_name,   -- Added receiver name
                    u_receiver.username as receiver_username,   -- Added receiver username
                    m.message_content,
                    m.timestamp,
                    'private' as message_type_val,
                    NULL as course_context_id,
                    NULL as course_context_name
                FROM Message m
                JOIN PrivateMessage pm ON m.message_id = pm.message_id
                JOIN Users u_sender ON m.sender_id = u_sender.user_id
                JOIN Users u_receiver ON pm.receiver_id = u_receiver.user_id -- Join to get receiver details
                WHERE m.sender_id = %s OR pm.receiver_id = %s -- Fetch if instructor is sender OR receiver

                UNION ALL

                -- Sent Announcements (linked to courses taught by instructor)
                SELECT
                    m.message_id,
                    m.sender_id, -- Sender is the instructor
                    u_sender.first_name as sender_first_name,
                    u_sender.last_name as sender_last_name,
                    u_sender.username as sender_username,
                    NULL as receiver_id, -- No specific receiver for announcement
                    NULL as receiver_first_name,
                    NULL as receiver_last_name,
                    NULL as receiver_username,
                    m.message_content,
                    m.timestamp,
                    'announcement' as message_type_val,
                    a.course_id as course_context_id,
                    c.course_name as course_context_name
                FROM Message m
                JOIN Announcement a ON m.message_id = a.message_id
                JOIN Course c ON a.course_id = c.course_id
                JOIN Users u_sender ON m.sender_id = u_sender.user_id
                WHERE m.sender_id = %s -- Only announcements sent by this instructor
            """
            # Parameters updated for the OR condition and the second sender_id check
            params = [instructor_id, instructor_id, instructor_id]

            # Add search filter if provided - updated to search sender/receiver/content/course
            if search_term:
                 query += """ AND (
                     m.message_content LIKE %s OR
                     u_sender.username LIKE %s OR
                     u_sender.first_name LIKE %s OR
                     u_sender.last_name LIKE %s OR
                     u_receiver.username LIKE %s OR  -- Search receiver username
                     u_receiver.first_name LIKE %s OR -- Search receiver first name
                     u_receiver.last_name LIKE %s OR  -- Search receiver last name
                     c.course_name LIKE %s
                 ) """
                 like = f"%{search_term}%"; params.extend([like] * 8) # Increased param count

            query += " ORDER BY timestamp DESC"

            cursor.execute(query, params)
            messages = dictfetchall(cursor)

        # Process messages to add context for display (e.g., 'To: username' or 'From: username')
        processed_messages = []
        for msg in messages:
            msg['is_sent_by_instructor'] = (msg['sender_id'] == instructor_id)
            processed_messages.append(msg)

        return Response({'messages': processed_messages}) # Return processed messages

    elif request.method == 'POST':
        data = request.data
        message_type = data.get('message_type') # 'private' or 'announcement'
        content = data.get('content')
        
        if not content:
            return Response({'error': 'Message content cannot be empty.'}, status=status.HTTP_400_BAD_REQUEST)

        with transaction.atomic():
            with connection.cursor() as cursor:
                # Insert into Message table first
                cursor.execute("""
                    INSERT INTO Message (sender_id, message_type, message_content, timestamp)
                    VALUES (%s, %s, %s, NOW())
                """, [instructor_id, message_type, content])
                message_id = cursor.lastrowid

                if message_type == 'private':
                    receiver_id = data.get('receiver_id')
                    if not receiver_id:
                        raise ValueError("Receiver ID is required for private messages.") # Raise error to rollback transaction
                    try: receiver_id = int(receiver_id)
                    except ValueError: raise ValueError("Invalid Receiver ID.")

                    # Check if receiver exists (optional but recommended)
                    cursor.execute("SELECT 1 FROM Users WHERE user_id = %s", [receiver_id])
                    if not cursor.fetchone():
                        raise ValueError("Receiver user does not exist.")
                        
                    cursor.execute("""
                        INSERT INTO PrivateMessage (message_id, receiver_id)
                        VALUES (%s, %s)
                    """, [message_id, receiver_id])
                    msg_text = 'Private message sent successfully.'

                elif message_type == 'announcement':
                    course_id = data.get('course_id') # Can be null/empty for 'all'
                    if not course_id:
                        # Send to all students in all courses taught by this instructor
                        cursor.execute("""
                            INSERT INTO Announcement (message_id, course_id) VALUES (%s, NULL)
                        """, [message_id]) # Use NULL for course_id to signify global
                        msg_text = 'Announcement sent to all students in your courses.'
                    else:
                        # Send to specific course
                        try: course_id = int(course_id)
                        except ValueError: raise ValueError("Invalid Course ID.")
                        
                        # Verify instructor owns the course
                        is_owner, error_response = check_instructor_ownership(instructor_id, course_id=course_id)
                        if not is_owner: raise PermissionError("Instructor does not own this course.")
                        
                        cursor.execute("""
                            INSERT INTO Announcement (message_id, course_id)
                            VALUES (%s, %s)
                        """, [message_id, course_id])
                        msg_text = 'Announcement sent successfully to the selected course.'
                else:
                    raise ValueError("Invalid message type.")

        return Response({'message': msg_text}, status=status.HTTP_201_CREATED)


@api_view(['GET'])
@authentication_classes([CustomJWTAuthentication])
@permission_classes([IsAuthenticated])
@safe_api_view
def instructor_recipient_list_api(request):
    """GET: Fetches potential recipients (students in instructor's courses) and courses for announcements."""
    instructor_id = request.user.user_id
    recipients = {'students': [], 'courses': []}

    with connection.cursor() as cursor:
        # Get distinct students enrolled in any course taught by the instructor
        cursor.execute("""
            SELECT DISTINCT u.user_id, u.username, u.first_name, u.last_name
            FROM Users u
            JOIN Enrollment e ON u.user_id = e.student_id
            JOIN Course c ON e.course_id = c.course_id
            WHERE c.instructor_id = %s AND e.status = 'enrolled' AND u.user_type = 'Student'
            ORDER BY u.last_name, u.first_name
        """, [instructor_id])
        recipients['students'] = dictfetchall(cursor)

        # Get courses taught by the instructor
        cursor.execute("""
            SELECT course_id, course_name, course_code, year, term
            FROM Course 
            WHERE instructor_id = %s
            ORDER BY year DESC, term DESC, course_name
        """, [instructor_id])
        courses = dictfetchall(cursor)
        for c in courses:
            c['term'] = map_term_to_str(c['term'])
        recipients['courses'] = courses

    return Response(recipients)

# === Score Update View ===
@api_view(['PUT'])
@authentication_classes([CustomJWTAuthentication])
@permission_classes([IsAuthenticated])
@safe_api_view
def instructor_update_score(request):
    """PUT: Update or insert a student's score for a specific course."""
    user = request.user
    instructor_id = user.user_id
    data = request.data

    student_id = data.get('student_id')
    course_id = data.get('course_id')
    grade = data.get('grade') # Expecting the new score value

    if student_id is None or course_id is None or grade is None:
        return Response({'error': 'Missing student_id, course_id, or grade'}, status=status.HTTP_400_BAD_REQUEST)

    try:
        grade_decimal = decimal.Decimal(grade) # Validate and convert grade
    except (decimal.InvalidOperation, ValueError):
         return Response({'error': 'Invalid grade format. Must be a number.'}, status=status.HTTP_400_BAD_REQUEST)

    # --- Ownership Check ---
    # Verify the instructor teaches the course for which the grade is being submitted
    with connection.cursor() as cursor:
        cursor.execute("SELECT instructor_id FROM Course WHERE course_id = %s", [course_id])
        course_owner = cursor.fetchone()
        if not course_owner or course_owner[0] != instructor_id:
            return Response({'error': '无权修改此课程的分数'}, status=status.HTTP_403_FORBIDDEN)
        # Optional: Verify student is enrolled in the course?
        cursor.execute("SELECT 1 FROM Enrollment WHERE student_id = %s AND course_id = %s", [student_id, course_id])
        if not cursor.fetchone():
             return Response({'error': '学生未注册此课程'}, status=status.HTTP_400_BAD_REQUEST)


    # --- Update or Insert Score ---
    try:
        with transaction.atomic(): # Use transaction for atomicity
            with connection.cursor() as cursor:
                # Try to update first
                cursor.execute("""
                    UPDATE Score SET total_score = %s
                    WHERE student_id = %s AND course_id = %s
                """, [grade_decimal, student_id, course_id])

                # If no row was updated, insert a new score record
                if cursor.rowcount == 0:
                    cursor.execute("""
                        INSERT INTO Score (student_id, course_id, total_score)
                        VALUES (%s, %s, %s)
                    """, [student_id, course_id, grade_decimal])
        return Response({'message': '成绩更新成功'}, status=status.HTTP_200_OK)
    except Exception as e:
        # Log the error in a real application
        print(f"Error updating/inserting score: {e}")
        return Response({'error': f'更新成绩时出错: {str(e)}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
