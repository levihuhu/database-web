from rest_framework.permissions import AllowAny
from rest_framework_simplejwt.tokens import RefreshToken

from core.models import Users, Student, Instructor
from django.contrib.auth import authenticate, login
from rest_framework.decorators import api_view,permission_classes

from rest_framework.response import Response
from rest_framework import status
from config import messages as msg
from django.db.models import Q

import json


@api_view(['POST'])
@permission_classes([AllowAny])
def login_api(request):
    try:
        identifier = request.data.get('identifier')
        password = request.data.get('password')
        role = request.data.get('role')

        if not identifier or not password or not role:
            return Response({'error': msg.MISSING_FIELD}, status=status.HTTP_400_BAD_REQUEST)

        # 验证密码（这里假设 password 是明文，实际应加密）
        # if not check_password(password, user.password):
        if password != user.password:
            messages.error(request, msg.LOGIN_WRONG_PASSWORD)
            return redirect('test2')
        # if '@' in identifier:
        #     user = authenticate(request, email=identifier, password=password)
        # else:
        #     user = authenticate(request, username=identifier, password=password)

        user = Users.objects.get(
            Q(username=identifier) | Q(email=identifier),
            password=password,
            user_type=role  # 角色必须一致
        )

        if not user:
            return Response({'status': 'error', 'message': msg.LOGIN_WRONG_PASSWORD},
                            status=status.HTTP_401_UNAUTHORIZED)

        refresh = RefreshToken.for_user(user)  # user 只是占位，不验证 Django 的权限
        refresh["user_id"] = user.user_id
        refresh["username"] = user.username
        refresh["role"] = user.user_type

        return Response({
            'status': 'success',
            'message': 'Login successful',
            'data': {
                'access': str(refresh.access_token),
                'refresh': str(refresh),
                'user_id': user.user_id,
                'username': user.username,
                'role': role
            }
        }, status=status.HTTP_200_OK)

    except Exception as e:
        # logger.error(f"Login failed: {str(e)}")
        return Response({'status': 'error', 'message': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)



# def dashboard_view(request):
#     return render(request, 'core/dashboard.html')