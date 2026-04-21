from django.contrib import admin
from django.contrib.auth.admin import UserAdmin

from .models import User


@admin.register(User)
class CustomUserAdmin(UserAdmin):
    list_display = ("id", "username", "email", "is_staff", "is_verified", "date_joined")
    list_filter = ("is_staff", "is_superuser", "is_active", "is_verified")
    search_fields = ("username", "email", "phone")
    fieldsets = UserAdmin.fieldsets + (
        ("Additional Info", {"fields": ("phone", "avatar", "bio", "is_verified")}),
    )


admin.site.site_header = "Fontaine Administration"
admin.site.site_title = "Fontaine Admin Portal"
admin.site.index_title = "Welcome to Fontaine Backend Admin"
