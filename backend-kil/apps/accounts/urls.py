from django.urls import path

from .views import (
    DeleteAccountView,
    LoginView,
    LogoutView,
    PasswordChangeView,
    PasswordResetConfirmView,
    PasswordResetView,
    ProfileUpdateView,
    ProfileView,
    RefreshTokenView,
    RegisterView,
    Verify2FAView,
    VerifyTokenView,
)

urlpatterns = [
    path("register/", RegisterView.as_view(), name="auth-register"),
    path("login/", LoginView.as_view(), name="auth-login"),
    path("2fa/verify/", Verify2FAView.as_view(), name="auth-2fa-verify"),
    path("logout/", LogoutView.as_view(), name="auth-logout"),
    path("token/refresh/", RefreshTokenView.as_view(), name="token-refresh"),
    path("token/verify/", VerifyTokenView.as_view(), name="token-verify"),
    path("password/change/", PasswordChangeView.as_view(), name="password-change"),
    path("password/reset/", PasswordResetView.as_view(), name="password-reset"),
    path("password/reset/confirm/", PasswordResetConfirmView.as_view(), name="password-reset-confirm"),
    path("profile/", ProfileView.as_view(), name="auth-profile"),
    path("profile/update/", ProfileUpdateView.as_view(), name="profile-update"),
    path("delete-account/", DeleteAccountView.as_view(), name="delete-account"),
]

