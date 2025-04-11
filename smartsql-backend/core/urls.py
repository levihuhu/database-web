# core/urls.py
from django.urls import path
from . import views

urlpatterns = [
    path('api/login/', views.login_api),
    path('api/users/profile/', views.profile_api),
    path('api/users/profile/update/', views.update_profile_api),
    path('api/messages/', views.messages_api),
    path('api/dynamic-sql/', views.dynamic_sql_query_api),
    path('api/student/courses/', views.student_courses_api),
    path('api/student/courses/<int:course_id>/modules/', views.course_modules_api),
    path('api/student/courses/<int:course_id>/modules/<int:module_id>/exercises/', views.module_exercises_api),
    path('api/student/courses/<int:course_id>/modules/<int:module_id>/exercises/<int:exercise_id>/submit/', views.submit_exercise_api),
    path('api/student/courses/accept-all/', views.accept_all_courses_api),
]