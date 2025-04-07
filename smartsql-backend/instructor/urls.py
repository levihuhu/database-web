# core/urls.py
from django.urls import path
from . import views

urlpatterns = [
    path('api/instructor/courses/', views.instructor_courses),
    path('api/instructor/modules/', views.instructor_modules),
    path('api/instructor/exercises/', views.instructor_exercises),

]