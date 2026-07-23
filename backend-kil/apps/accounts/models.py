from django.contrib.auth.models import AbstractUser
from django.db import models
from django.utils import timezone
import uuid


class User(AbstractUser):
    phone = models.CharField(max_length=20, blank=True)
    avatar = models.ImageField(upload_to="avatars/", blank=True, null=True)
    bio = models.TextField(blank=True)
    is_verified = models.BooleanField(default=False)
    admin_role = models.CharField(max_length=50, blank=True, default="")

    class Meta:
        ordering = ("-date_joined",)

    def __str__(self):
        return self.username


class TwoFactorCode(models.Model):
    """Stores 6-digit OTP codes for 2FA login verification."""
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="two_factor_codes")
    code = models.CharField(max_length=6)
    temp_token = models.UUIDField(default=uuid.uuid4, unique=True, db_index=True)
    created_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField()
    is_used = models.BooleanField(default=False)

    class Meta:
        ordering = ("-created_at",)

    def __str__(self):
        return f"2FA code for {self.user.username} ({self.code})"

    @property
    def is_expired(self):
        return timezone.now() > self.expires_at

    @property
    def is_valid(self):
        return not self.is_used and not self.is_expired
