from rest_framework import serializers

from .models import AuthAuditLog


class AuthAuditLogSerializer(serializers.ModelSerializer):
    class Meta:
        model = AuthAuditLog
        fields = (
            "id",
            "user",
            "action",
            "method",
            "endpoint",
            "was_successful",
            "ip_address",
            "user_agent",
            "created_at",
        )
        read_only_fields = ("id", "created_at")
