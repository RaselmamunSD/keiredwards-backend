from django.contrib import admin
from django.contrib.auth.admin import UserAdmin

from .models import User


@admin.register(User)
class CustomUserAdmin(UserAdmin):
    list_display = ("id", "username", "email", "first_name", "last_name", "is_active", "is_verified", "is_staff", "date_joined")
    list_filter = ("is_active", "is_staff", "is_superuser", "is_verified", "date_joined")
    search_fields = ("username", "email", "phone", "first_name", "last_name")
    date_hierarchy = "date_joined"
    readonly_fields = ("id", "date_joined", "last_login")
    fieldsets = (
        ("Account Info", {"fields": ("id", "username", "email", "password")}),
        ("Personal Info", {"fields": ("first_name", "last_name", "phone", "bio", "avatar")}),
        ("Permissions", {"fields": ("is_active", "is_staff", "is_superuser", "groups", "user_permissions")}),
        ("Verification", {"fields": ("is_verified",)}),
        ("Important Dates", {"fields": ("last_login", "date_joined")}),
    )


admin.site.site_header = "I WAS KILLED Admin Dashboard"
admin.site.site_title = "I WAS KILLED Admin Dashboard"
admin.site.index_title = "Admin Dashboard"

