from rest_framework import serializers

from .models import DashboardWidget, CheckInEmailConfig


class DashboardWidgetSerializer(serializers.ModelSerializer):
    class Meta:
        model = DashboardWidget
        fields = ("id", "user", "title", "widget_type", "position", "config", "created_at")
        read_only_fields = ("id", "created_at")


class CheckInEmailConfigSerializer(serializers.ModelSerializer):
    class Meta:
        model = CheckInEmailConfig
        fields = (
            "id",
            "checkin_email",
            "checkin_password",
            "checkin_password_enabled",
            "private_email_username",
            "private_email_address_saved",
            "private_email_password",
            "private_email_password_saved",
            "updated_at",
            "created_at",
        )
        read_only_fields = ("id", "created_at", "updated_at")
