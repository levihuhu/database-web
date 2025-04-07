from django.shortcuts import render,redirect
from django.contrib import messages
from django.contrib.auth.hashers import check_password
from core.models import Users, Student, Instructor
from config import messages as msg
# Create your views here.
def home(request):
    return render(request, 'core/home.html')

def test1(request):
    return render(request, 'core/test1.html')

def test2(request):
    return render(request, 'core/test2.html')

def login_view(request):
    if request.method == 'POST':
        identifier = request.POST.get('identifier')
        password = request.POST.get('password')

        try:
            if '@' in identifier:
                user = Users.objects.get(email=identifier)
            else:
                user = Users.objects.get(username=identifier)
        except Users.DoesNotExist:
            messages.error(request, msg.LOGIN_USER_NOT_FOUND)
            return redirect('test1')

        # 验证密码（这里假设 password 是明文，实际应加密）
        # if not check_password(password, user.password):
        if password != user.password:
            messages.error(request, msg.LOGIN_WRONG_PASSWORD)
            return redirect('test2')

        # 根据 user_type 判断
        if user.user_type == 'Student':
            student_info = Student.objects.get(student=user)
        elif user.user_type == 'Instructor':
            instructor_info = Instructor.objects.get(instructor=user)

        # 登录成功：设置 session 或跳转
        request.session['user_id'] = user.user_id
        request.session['user_type'] = user.user_type
        return redirect('/dashboard/')  # 你定义的首页或 dashboard

    return redirect('home')

def dashboard_view(request):
    return render(request, 'core/dashboard.html')