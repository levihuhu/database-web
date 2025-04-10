# core/urls.py
from django.urls import path
from . import views

urlpatterns = [
    path('api/instructor/courses/', views.instructor_courses),
    path('api/instructor/modules/', views.instructor_modules),
    path('api/instructor/exercises/', views.instructor_exercises),
    path('api/instructor/courses/insert/', views.instructor_course_insert),
    path('api/instructor/courses/update/', views.instructor_course_update),
    path('api/instructor/courses/delete/', views.instructor_course_delete),
]