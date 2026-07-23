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
        
        # Trigger welcome email asynchronously using Celery
        try:
            from celery_app.tasks import send_welcome_email
            send_welcome_email.delay(user.id)
        except Exception as e:
            pass

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
                if "@" in username:
                    user = User.objects.filter(email=username).first()
                else:
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
            # ── Check if user has completed payment ──
            has_paid = user.payments.filter(status="completed").exists()
            if not has_paid:
                from rest_framework.exceptions import AuthenticationFailed
                raise AuthenticationFailed("Payment is required before accessing the account.")
                
            # ── Check if 2FA is enabled for this user ──
            try:
                from apps.dashboard.models import SetupAccountingConfig
                config = SetupAccountingConfig.objects.filter(user=user).first()
                if config and config.two_fa_enabled and config.two_fa_email:
                    # Generate 6-digit code and send via email
                    import random
                    from datetime import timedelta
                    from django.utils import timezone
                    from .models import TwoFactorCode
                    from django.core.mail import send_mail
                    from django.conf import settings

                    code = str(random.randint(100000, 999999))
                    expires_at = timezone.now() + timedelta(minutes=5)

                    # Invalidate any previous unused codes
                    TwoFactorCode.objects.filter(user=user, is_used=False).update(is_used=True)

                    # Create new code
                    tfa = TwoFactorCode.objects.create(
                        user=user,
                        code=code,
                        expires_at=expires_at,
                    )

                    # Send email with the code
                    try:
                        send_mail(
                            subject="Your Login Verification Code",
                            message=(
                                f"Your 2FA verification code is: {code}\n\n"
                                f"This code will expire in 5 minutes.\n\n"
                                f"If you did not request this code, please ignore this email."
                            ),
                            from_email=settings.DEFAULT_FROM_EMAIL,
                            recipient_list=[config.two_fa_email],
                            fail_silently=False,
                        )
                    except Exception as exc:
                        import logging
                        logger = logging.getLogger(__name__)
                        logger.error(f"Failed to send 2FA email: {exc}")
                        from rest_framework.exceptions import ValidationError
                        if "SPAM" in str(exc) or "550" in str(exc):
                            raise ValidationError("Your email server blocked the OTP email as SPAM. Please check your SMTP configuration.")
                        if "Authentication" in str(exc) or "530" in str(exc):
                            raise ValidationError("Email authentication failed. Please check your SMTP username and password.")
                        raise ValidationError("We couldn't send the OTP email due to an email server issue. Please try again later or contact support.")

                    # Log the attempt but don't create full login audit yet
                    AuthAuditLog.objects.create(
                        user=user,
                        action="2fa_code_sent",
                        method=request.method,
                        endpoint=request.path,
                        was_successful=True,
                        ip_address=request.META.get("REMOTE_ADDR"),
                        user_agent=request.META.get("HTTP_USER_AGENT", "")[:255],
                    )

                    # Return temp_token instead of JWT tokens
                    # Mask email: show first 2 chars + *** + domain
                    email = config.two_fa_email
                    at_idx = email.index("@")
                    masked = email[:2] + "***" + email[at_idx:]

                    return success_response(
                        "2FA verification required.",
                        {
                            "requires_2fa": True,
                            "temp_token": str(tfa.temp_token),
                            "masked_email": masked,
                        },
                        status.HTTP_200_OK,
                    )
            except Exception:
                # If 2FA check fails for any reason, fall through to normal login
                pass

            # ── Normal login (no 2FA) ──
            AuthAuditLog.objects.create(
                user=user,
                action="login",
                method=request.method,
                endpoint=request.path,
                was_successful=True,
                ip_address=request.META.get("REMOTE_ADDR"),
                user_agent=request.META.get("HTTP_USER_AGENT", "")[:255],
            )
            try:
                from apps.dashboard.models import CheckInHistoryRecord
                from django.utils import timezone
                now = timezone.now()
                
                ua = request.META.get("HTTP_USER_AGENT", "").lower()
                if "windows" in ua:
                    device_os = "Windows"
                elif "macintosh" in ua or "mac os" in ua:
                    device_os = "macOS"
                elif "iphone" in ua or "ipad" in ua:
                    device_os = "iOS"
                elif "android" in ua:
                    device_os = "Android"
                elif "linux" in ua:
                    device_os = "Linux"
                else:
                    device_os = "Unknown"
                
                CheckInHistoryRecord.objects.create(
                    user=user,
                    date=now.strftime("%m/%d/%Y"),
                    time=now.strftime("%I:%M %p"),
                    ip=request.META.get("REMOTE_ADDR") or "127.0.0.1",
                    login_name=user.email or user.username,
                    device_os=device_os
                )
            except Exception:
                pass

        return success_response(
            "Login successful.",
            {"refresh": refresh_token, "access": access_token},
            status.HTTP_200_OK,
        )


class Verify2FAView(APIView):
    """Verify 2FA code and return JWT tokens."""
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        temp_token = request.data.get("temp_token")
        code = request.data.get("code")

        if not temp_token or not code:
            raise AuthenticationFailed("Verification code and token are required.")

        from .models import TwoFactorCode
        try:
            tfa = TwoFactorCode.objects.get(temp_token=temp_token)
        except TwoFactorCode.DoesNotExist:
            raise AuthenticationFailed("Invalid verification session.")

        if tfa.is_used:
            raise AuthenticationFailed("This verification code has already been used.")

        if tfa.is_expired:
            raise AuthenticationFailed("Verification code has expired. Please login again.")

        if tfa.code != code:
            raise AuthenticationFailed("Invalid verification code.")

        # Mark code as used
        tfa.is_used = True
        tfa.save(update_fields=["is_used"])

        # Generate JWT tokens for the user
        user = tfa.user
        from rest_framework_simplejwt.tokens import RefreshToken
        refresh = RefreshToken.for_user(user)

        # Create audit log and check-in history
        AuthAuditLog.objects.create(
            user=user,
            action="login",
            method=request.method,
            endpoint=request.path,
            was_successful=True,
            ip_address=request.META.get("REMOTE_ADDR"),
            user_agent=request.META.get("HTTP_USER_AGENT", "")[:255],
        )
        try:
            from apps.dashboard.models import CheckInHistoryRecord
            from django.utils import timezone
            now = timezone.now()

            ua = request.META.get("HTTP_USER_AGENT", "").lower()
            if "windows" in ua:
                device_os = "Windows"
            elif "macintosh" in ua or "mac os" in ua:
                device_os = "macOS"
            elif "iphone" in ua or "ipad" in ua:
                device_os = "iOS"
            elif "android" in ua:
                device_os = "Android"
            elif "linux" in ua:
                device_os = "Linux"
            else:
                device_os = "Unknown"

            CheckInHistoryRecord.objects.create(
                user=user,
                date=now.strftime("%m/%d/%Y"),
                time=now.strftime("%I:%M %p"),
                ip=request.META.get("REMOTE_ADDR") or "127.0.0.1",
                login_name=user.email or user.username,
                device_os=device_os,
            )
        except Exception:
            pass

        return success_response(
            "Login successful.",
            {"refresh": str(refresh), "access": str(refresh.access_token)},
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


class DeleteAccountView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        email = request.data.get("email", "").strip()
        password = request.data.get("password", "")

        user = request.user

        # Verify the provided email matches the account email
        if user.email.lower() != email.lower():
            from rest_framework.exceptions import ValidationError
            raise ValidationError({"email": "The email address does not match your account."})

        # Verify the password is correct
        if not user.check_password(password):
            from rest_framework.exceptions import ValidationError
            raise ValidationError({"password": "Incorrect password. Please try again."})

        # Delete the user account (CASCADE will clean up related records)
        user.delete()

        return success_response("Account permanently deleted.", {}, status.HTTP_200_OK)

