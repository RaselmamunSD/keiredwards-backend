from django.contrib import admin
from unfold.admin import ModelAdmin, StackedInline, TabularInline
from django.contrib.auth.admin import UserAdmin

from .models import User


from apps.dashboard.models import (
    CheckInEmailConfig,
    CheckInScheduleConfig,
    TrustedRecipient,
    EmailTemplateConfig,
    PressReleaseConfig,
    StorageConfig,
    SetupAccountingConfig,
    ActiveService,
)

class CheckInEmailConfigInline(StackedInline):
    model = CheckInEmailConfig
    can_delete = False
    verbose_name_plural = "Check-In Email Configuration"

class CheckInScheduleConfigInline(StackedInline):
    model = CheckInScheduleConfig
    can_delete = False
    verbose_name_plural = "Check-In Schedule Configuration"

class TrustedRecipientInline(TabularInline):
    model = TrustedRecipient
    extra = 0
    verbose_name_plural = "Trusted Recipients"

class EmailTemplateConfigInline(StackedInline):
    model = EmailTemplateConfig
    can_delete = False
    verbose_name_plural = "Email to Recipients Setup"

class PressReleaseConfigInline(StackedInline):
    model = PressReleaseConfig
    can_delete = False
    verbose_name_plural = "Press Release Setup"

class StorageConfigInline(StackedInline):
    model = StorageConfig
    can_delete = False
    verbose_name_plural = "Storage Configuration"

class SetupAccountingConfigInline(StackedInline):
    model = SetupAccountingConfig
    can_delete = False
    verbose_name_plural = "Security (2FA/Private Email)"

class ActiveServiceInline(TabularInline):
    model = ActiveService
    extra = 0
    verbose_name_plural = "Purchased Add-Ons & Services"


@admin.register(User)
class CustomUserAdmin(UserAdmin, ModelAdmin):
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
    inlines = [
        CheckInEmailConfigInline,
        CheckInScheduleConfigInline,
        TrustedRecipientInline,
        EmailTemplateConfigInline,
        PressReleaseConfigInline,
        StorageConfigInline,
        SetupAccountingConfigInline,
        ActiveServiceInline,
    ]

admin.site.site_header = "I WAS KILLED Admin Dashboard"
admin.site.site_title = "I WAS KILLED Admin Dashboard"
admin.site.index_title = "Admin Dashboard"

