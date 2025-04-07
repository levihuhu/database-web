from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework_simplejwt.exceptions import InvalidToken
from .models import Users

class CustomJWTAuthentication(JWTAuthentication):
    def get_user(self, validated_token):
        user_id = validated_token.get("user_id")

        try:
            user = Users.objects.get(user_id=user_id)
        except Users.DoesNotExist:
            raise InvalidToken("User not found")

        return user