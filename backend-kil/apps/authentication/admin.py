from django.contrib import admin
from django.utils.html import format_html

from .models import AuthAuditLog


@admin.register(AuthAuditLog)
class AuthAuditLogAdmin(admin.ModelAdmin):
    list_display = ("id", "user", "action", "method", "endpoint", "status_badge", "ip_address", "user_agent_short", "created_at")
    list_filter = ("action", "method", "was_successful", "created_at")
    search_fields = ("user__username", "user__email", "action", "endpoint", "ip_address")
    date_hierarchy = "created_at"
    readonly_fields = ("id", "user", "action", "method", "endpoint", "was_successful", "ip_address", "user_agent", "created_at")
    fieldsets = (
        ("Login Info", {"fields": ("id", "user", "created_at")}),
        ("Request Details", {"fields": ("action", "method", "endpoint", "ip_address", "user_agent")}),
        ("Status", {"fields": ("was_successful",)}),
    )

    def status_badge(self, obj):
        if obj.was_successful:
            return format_html('<span style="color: green; font-weight: bold;">✓ SUCCESS</span>')
        return format_html('<span style="color: red; font-weight: bold;">✗ FAILED</span>')
    status_badge.short_description = "Status"

    def user_agent_short(self, obj):
        if obj.user_agent:
            return obj.user_agent[:50] + "..." if len(obj.user_agent) > 50 else obj.user_agent
        return "N/A"
    user_agent_short.short_description = "User Agent"
