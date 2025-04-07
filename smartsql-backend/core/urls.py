# core/urls.py
from django.urls import path
from . import views

urlpatterns = [
    path('', views.home, name='home'),
    path('test1/', views.test1, name='test1'),
    path('test2/', views.test2, name='test2'),
    # core/urls.py
    path("dashboard/", views.dashboard_view, name="dashboard"),
    path('login/', views.login_view, name='login'),

]