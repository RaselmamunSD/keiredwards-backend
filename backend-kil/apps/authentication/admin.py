from django.contrib import admin

from .models import AuthAuditLog


@admin.register(AuthAuditLog)
class AuthAuditLogAdmin(admin.ModelAdmin):
    list_display = ("id", "user", "action", "method", "endpoint", "was_successful", "ip_address", "created_at")
    list_filter = ("action", "method", "was_successful", "created_at")
    search_fields = ("user__username", "action", "endpoint", "ip_address")
