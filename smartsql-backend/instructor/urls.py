# core/urls.py
from django.urls import path
from . import views

urlpatterns = [
    # --- Course Management ---
    path('api/instructor/courses/', views.instructor_courses, name='instructor_courses_list'),
    path('api/instructor/courses/insert/', views.instructor_course_insert, name='instructor_course_insert'),
    path('api/instructor/courses/update/', views.instructor_course_update, name='instructor_course_update'), # Uses ?course_id=
    path('api/instructor/courses/delete/', views.instructor_course_delete, name='instructor_course_delete'), # Uses ?course_id=
    path('api/instructor/courses/<int:course_id>/', views.instructor_course_detail, name='instructor_course_detail'),

    # --- Module Management ---
    path('api/instructor/modules/', views.instructor_modules, name='instructor_modules_list'), # GET (all or filtered), POST
    path('api/instructor/modules/<int:module_id>/', views.instructor_module_detail, name='instructor_module_detail'), # GET (detail), PUT, DELETE

    # --- Exercise Management ---
    path('api/instructor/exercises/', views.instructor_exercises, name='instructor_exercises_list'), # GET (all or filtered), POST
    path('api/instructor/exercises/<int:exercise_id>/', views.instructor_exercise_detail, name='instructor_exercise_detail'), # GET (detail), PUT, DELETE

    # --- View specific lists ---
    path('api/instructor/courses/<int:course_id>/modules/', views.instructor_modules_by_course, name='instructor_modules_by_course'), # GET modules for a specific course
    path('api/instructor/modules/<int:module_id>/exercises/', views.instructor_exercises_by_module, name='instructor_exercises_by_module'), # GET exercises for a specific module

    # --- Student Management (New Endpoints) ---
    path('api/instructor/students/', views.instructor_students, name='instructor_students_list'), # GET students enrolled in instructor's courses
    path('api/instructor/my-students/', views.instructor_get_my_students, name='instructor_get_my_students'), # New route for student list
    path('api/instructor/dashboard/', views.instructor_dashboard_data, name='instructor_dashboard_data'),

    # --- Add URL for score update ---
    path('api/instructor/scores/update/', views.instructor_update_score, name='instructor_update_score'),

    # --- Messaging ---
    path('api/instructor/messages/', views.instructor_messages_api, name='instructor_messages'), # GET received messages, POST new message/announcement
    path('api/instructor/recipients/', views.instructor_recipient_list_api, name='instructor_recipient_list'), # GET students and courses for sending messages
]