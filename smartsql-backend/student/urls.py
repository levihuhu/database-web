# student/urls.py
from django.urls import path
from . import views

urlpatterns = [
    path('api/student/dynamic-sql-query/', views.dynamic_sql_query_api, name='dynamic_sql_query'),
    path('api/student/courses/', views.student_courses_api, name='student_courses'),
    path('api/student/courses/<int:course_id>/modules/', views.course_modules_api, name='course_modules'),
    path('api/student/courses/<int:course_id>/modules/<int:module_id>/exercises/', views.module_exercises_api, name='module_exercises'),
    path('api/student/exercises/<int:exercise_id>/submit/', views.submit_exercise_api, name='submit_exercise'),
    path('api/student/exercises/<int:exercise_id>/', views.get_exercise_detail, name='get_exercise_detail'),
    
    # 新增的API路由
    path('api/student/dashboard/', views.student_dashboard_api, name='student_dashboard'),
    path('api/student/browse-courses/', views.browse_all_courses_api, name='browse_all_courses'),
    path('api/student/courses/<int:course_id>/enroll/', views.enroll_course_api, name='enroll_course'),
    path('api/student/exercises/', views.student_all_exercises_api, name='student_all_exercises'),
    path('api/student/messages/', views.student_messages_api, name='student_messages'),
]