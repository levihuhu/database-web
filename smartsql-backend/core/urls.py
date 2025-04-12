# core/urls.py
from django.urls import path
from . import views

urlpatterns = [
    path('api/login/', views.login_api),
    path('api/users/profile/', views.profile_api),
    path('api/users/profile/update/', views.update_profile_api),
    path('api/messages/', views.messages_api),
    path('api/dynamic-sql/', views.dynamic_sql_query_api),
]