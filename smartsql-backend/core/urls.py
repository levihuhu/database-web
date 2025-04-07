# core/urls.py
from django.urls import path
from . import views

urlpatterns = [
    path('api/login/', views.login_api),

]