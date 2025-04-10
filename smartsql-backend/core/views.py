from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework.decorators import api_view, permission_classes, authentication_classes
from core.models import Users, Student, Instructor
from core.authentication import CustomJWTAuthentication
from rest_framework.response import Response
from rest_framework import status
from config import messages as msg
from django.db.models import Q
from django.db import connection, transaction



@api_view(['POST'])
@permission_classes([AllowAny])
def login_api(request):
    try:
        identifier = request.data.get('identifier')
        password = request.data.get('password')
        role = request.data.get('role')


        if not identifier or not password or not role:
            return Response({'error': msg.MISSING_FIELD}, status=status.HTTP_400_BAD_REQUEST)

        # if '@' in identifier:
        #     user = authenticate(request, email=identifier, password=password)
        # else:
        #     user = authenticate(request, username=identifier, password=password)

        try:
            user = Users.objects.get(
                Q(username=identifier) | Q(email=identifier),
                password=password,
                user_type=role
            )
        except Users.DoesNotExist:
            return Response({'status': 'error', 'message': msg.LOGIN_WRONG_PASSWORD},
                            status=status.HTTP_401_UNAUTHORIZED)

        refresh = RefreshToken.for_user(user)
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


@api_view(['GET'])
@authentication_classes([CustomJWTAuthentication])
@permission_classes([IsAuthenticated])
def profile_api(request):
    try:
        # 从请求体获取 user_id，如果没有则使用当前用户的 ID
        user_id = request.query_params.get('user_id')


        # 如果没有提供 user_id，使用当前登录用户的 ID
        target_id = user_id if user_id else request.user.user_id
        
        # 获取用户信息
        user = Users.objects.get(user_id=target_id)
        
        # 判断是否是查看自己的资料
        is_own_profile = str(request.user.user_id) == str(target_id)
        
        # 构建响应数据
        user_data = {
            'first_name': user.first_name,
            'last_name': user.last_name,
            'user_id': user.user_id,
            'username': user.username,
            'email': user.email,
            'user_type': user.user_type,
            'profile_info': user.profile_info
        }
        
        return Response({
            'status': 'success',
            'data': user_data,
            'is_own_profile': is_own_profile
        })
    except Users.DoesNotExist:
        return Response({
            'status': 'error', 
            'message': '用户不存在'
        }, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        return Response({
            'status': 'error', 
            'message': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['PUT'])
@authentication_classes([CustomJWTAuthentication])
@permission_classes([IsAuthenticated])
def update_profile_api(request):
    try:
        # 当前登录用户
        user = request.user

        # 只获取个人简介
        profile_info = request.data.get('profile_info')

        user.profile_info = profile_info
        user.save()

        return Response({
            'status': 'success',
            'message': 'Profile updated successfully'
        }, status=status.HTTP_200_OK)

    except Users.DoesNotExist:
        return Response({
            'status': 'error',
            'message': 'User not found'
        }, status=status.HTTP_404_NOT_FOUND)

    except Exception as e:
        return Response({
            'status': 'error',
            'message': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['POST'])
@authentication_classes([CustomJWTAuthentication])
@permission_classes([IsAuthenticated])
def messages_api(request):
    try:
        # 当前登录用户
        user = request.user

        # 获取请求体中的数据
        receiver_id = request.data.get('receiver_id')
        content = request.data.get('content')
        
        # 验证数据
        if not receiver_id or not content:
            return Response({
                'status': 'error',
                'message': '接收者ID和消息内容不能为空'
            }, status=status.HTTP_400_BAD_REQUEST)
            
        # 验证接收者是否存在
        with connection.cursor() as cursor:
            cursor.execute("SELECT user_id FROM Users WHERE user_id = %s", [receiver_id])
            receiver = cursor.fetchone()
            
            if not receiver:
                return Response({
                    'status': 'error',
                    'message': '接收者不存在'
                }, status=status.HTTP_404_NOT_FOUND)
  

            with transaction.atomic():
                
                cursor.execute("""
                    INSERT INTO Message (sender_id, message_type, message_content, timestamp)
                    VALUES (%s, 'private', %s, NOW())
                """, [user.user_id, content])

                message_id = cursor.lastrowid

                cursor.execute("""
                    INSERT INTO PrivateMessage (message_id, receiver_id)
                    VALUES (%s, %s)
                """, [message_id, receiver_id])

            
        return Response({
            'status': 'success',
            'message': '消息发送成功',
            'data': {
                'message_id': message_id,
                'sender_id': user.user_id,
                'receiver_id': receiver_id,
                'content': content
            }
        }, status=status.HTTP_201_CREATED)
            
    except Exception as e:
        return Response({
            'status': 'error',
            'message': str(e)
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


