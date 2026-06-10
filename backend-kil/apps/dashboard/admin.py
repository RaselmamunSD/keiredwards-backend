from django.contrib import admin

from .models import DashboardWidget, CheckInEmailConfig


@admin.register(DashboardWidget)
class DashboardWidgetAdmin(admin.ModelAdmin):
    list_display = ("id", "user", "title", "widget_type", "position", "created_at", "config_summary")
    list_filter = ("widget_type", "created_at", "user")
    search_fields = ("user__username", "user__email", "title", "widget_type")
    date_hierarchy = "created_at"
    readonly_fields = ("id", "created_at", "config_display")
    fieldsets = (
        ("Widget Info", {"fields": ("id", "user", "title", "widget_type", "position")}),
        ("Configuration", {"fields": ("config_display",)}),
        ("Timestamp", {"fields": ("created_at",)}),
    )
    list_editable = ("position",)
    list_per_page = 50

    def config_summary(self, obj):
        if obj.config:
            config_str = str(obj.config)
            return config_str[:50] + "..." if len(config_str) > 50 else config_str
        return "No config"
    config_summary.short_description = "Config"

    def config_display(self, obj):
        if obj.config:
            import json
            return json.dumps(obj.config, indent=2)
        return "No configuration"
    config_display.short_description = "Configuration"


@admin.register(CheckInEmailConfig)
class CheckInEmailConfigAdmin(admin.ModelAdmin):
    list_display = (
        "id",
        "user",
        "checkin_email",
        "checkin_password_enabled",
        "private_email_username",
        "private_email_address_saved",
        "private_email_password_saved",
        "updated_at",
    )
    list_filter = ("checkin_password_enabled", "private_email_address_saved", "private_email_password_saved", "updated_at")
    search_fields = ("user__username", "user__email", "checkin_email", "private_email_username")
    readonly_fields = ("id", "created_at", "updated_at")
    fieldsets = (
        ("User Association", {"fields": ("id", "user")}),
        ("Check-In Email Config", {"fields": ("checkin_email", "checkin_password", "checkin_password_enabled")}),
        ("Private Email Config", {"fields": ("private_email_username", "private_email_address_saved", "private_email_password", "private_email_password_saved")}),
        ("Timestamps", {"fields": ("created_at", "updated_at")}),
    )
