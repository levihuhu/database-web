from django.urls import path
from . import views

urlpatterns = [
    # path('api/ai/chat/', views.ChatbotAPIView.as_view()),
    path('api/ai/chat/', views.ChatbotAPIView.as_view()),
] 