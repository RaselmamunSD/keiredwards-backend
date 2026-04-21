from rest_framework import serializers

from .models import DashboardWidget


class DashboardWidgetSerializer(serializers.ModelSerializer):
    class Meta:
        model = DashboardWidget
        fields = ("id", "user", "title", "widget_type", "position", "config", "created_at")
        read_only_fields = ("id", "created_at")
