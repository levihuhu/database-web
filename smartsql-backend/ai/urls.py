from django.urls import path
from . import views

urlpatterns = [
    path('api/ai/chat/', views.chat_api, name='ai_chat'),
] 