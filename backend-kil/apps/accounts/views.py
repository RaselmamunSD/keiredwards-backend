from rest_framework import permissions, status
from rest_framework.parsers import FormParser, MultiPartParser
from rest_framework.exceptions import AuthenticationFailed
from rest_framework_simplejwt.views import TokenRefreshView, TokenVerifyView
from rest_framework.views import APIView

from apps.authentication.models import AuthAuditLog
from apps.core.responses import success_response

from .serializers import (
    CustomTokenObtainPairSerializer,
    LogoutSerializer,
    PasswordChangeSerializer,
    PasswordResetConfirmSerializer,
    PasswordResetSerializer,
    RegisterSerializer,
    UserProfileSerializer,
)


class RegisterView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = RegisterSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        token_serializer = CustomTokenObtainPairSerializer(data={"username": user.username, "password": request.data["password"]})
        token_serializer.is_valid(raise_exception=True)
        return success_response(
            "Registration successful.",
            {
                "user": UserProfileSerializer(user).data,
                "tokens": token_serializer.validated_data,
            },
            status.HTTP_201_CREATED,
        )


class LoginView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = CustomTokenObtainPairSerializer(data=request.data)
        try:
            serializer.is_valid(raise_exception=True)
        except AuthenticationFailed as exc:
            username = request.data.get("username")
            user = None
            if username:
                from django.contrib.auth import get_user_model

                User = get_user_model()
                user = User.objects.filter(username=username).first()

            if user:
                AuthAuditLog.objects.create(
                    user=user,
                    action="login",
                    method=request.method,
                    endpoint=request.path,
                    was_successful=False,
                    ip_address=request.META.get("REMOTE_ADDR"),
                    user_agent=request.META.get("HTTP_USER_AGENT", "")[:255],
                )
            raise exc

        validated_data = serializer.validated_data
        refresh_token = validated_data.get("refresh")
        access_token = validated_data.get("access")
        from rest_framework_simplejwt.tokens import AccessToken
        token = AccessToken(access_token)
        user_id = token["user_id"]

        from django.contrib.auth import get_user_model

        User = get_user_model()
        user = User.objects.filter(id=user_id).first()
        if user:
            AuthAuditLog.objects.create(
                user=user,
                action="login",
                method=request.method,
                endpoint=request.path,
                was_successful=True,
                ip_address=request.META.get("REMOTE_ADDR"),
                user_agent=request.META.get("HTTP_USER_AGENT", "")[:255],
            )

        return success_response(
            "Login successful.",
            {"refresh": refresh_token, "access": access_token},
            status.HTTP_200_OK,
        )


class LogoutView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        serializer = LogoutSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return success_response("Logout successful.", {}, status.HTTP_200_OK)


class RefreshTokenView(TokenRefreshView):
    permission_classes = [permissions.AllowAny]

    def post(self, request, *args, **kwargs):
        response = super().post(request, *args, **kwargs)
        return success_response("Token refresh successful.", response.data, response.status_code)


class VerifyTokenView(TokenVerifyView):
    permission_classes = [permissions.AllowAny]

    def post(self, request, *args, **kwargs):
        response = super().post(request, *args, **kwargs)
        return success_response("Token is valid.", response.data, response.status_code)


class PasswordChangeView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        serializer = PasswordChangeSerializer(data=request.data, context={"request": request})
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return success_response("Password updated successfully.", {}, status.HTTP_200_OK)


class PasswordResetView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = PasswordResetSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        payload = serializer.save()
        return success_response("Password reset email sent successfully.", payload, status.HTTP_200_OK)


class PasswordResetConfirmView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = PasswordResetConfirmSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return success_response("Password reset successful.", {}, status.HTTP_200_OK)


class ProfileView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        serializer = UserProfileSerializer(request.user)
        return success_response("Profile fetched successfully.", serializer.data, status.HTTP_200_OK)


class ProfileUpdateView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]

    def put(self, request):
        serializer = UserProfileSerializer(request.user, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return success_response("Profile updated successfully.", serializer.data, status.HTTP_200_OK)
