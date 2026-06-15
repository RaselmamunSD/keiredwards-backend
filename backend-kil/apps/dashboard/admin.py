from django.contrib import admin

from .models import (
    DashboardWidget,
    CheckInEmailConfig,
    CheckInScheduleConfig,
    TrustedRecipient,
    EmailTemplateConfig,
    PressReleaseConfig,
    StorageConfig,
    UserVaultFile,
    SetupAccountingConfig,
    ActiveService,
    BillingRecord,
    CheckInHistoryRecord,
    ContactMessage,
    StoragePlan,
)


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


@admin.register(CheckInScheduleConfig)
class CheckInScheduleConfigAdmin(admin.ModelAdmin):
    list_display = ("id", "user", "day_of_week", "grace_period", "paused", "purchased_plan", "renewal_date", "updated_at")
    list_filter = ("day_of_week", "grace_period", "paused", "purchased_plan")
    search_fields = ("user__username", "user__email")
    readonly_fields = ("id", "created_at", "updated_at")


@admin.register(TrustedRecipient)
class TrustedRecipientAdmin(admin.ModelAdmin):
    list_display = ("id", "user", "first_name", "email", "is_owner", "created_at")
    list_filter = ("is_owner", "created_at")
    search_fields = ("user__username", "user__email", "first_name", "email")


@admin.register(EmailTemplateConfig)
class EmailTemplateConfigAdmin(admin.ModelAdmin):
    list_display = ("id", "user", "updated_at")
    search_fields = ("user__username", "user__email")
    readonly_fields = ("id", "updated_at")


@admin.register(PressReleaseConfig)
class PressReleaseConfigAdmin(admin.ModelAdmin):
    list_display = ("id", "user", "is_active", "current_tier", "updated_at")
    list_filter = ("is_active", "current_tier")
    search_fields = ("user__username", "user__email")
    readonly_fields = ("id", "updated_at")


@admin.register(StorageConfig)
class StorageConfigAdmin(admin.ModelAdmin):
    list_display = ("id", "user", "total_storage_gb", "updated_at")
    list_filter = ("total_storage_gb",)
    search_fields = ("user__username", "user__email")
    readonly_fields = ("id", "updated_at")


@admin.register(UserVaultFile)
class UserVaultFileAdmin(admin.ModelAdmin):
    list_display = ("id", "user", "file_name", "file_size_mb", "uploaded_at")
    search_fields = ("user__username", "user__email", "file_name")
    readonly_fields = ("id", "uploaded_at")


@admin.register(SetupAccountingConfig)
class SetupAccountingConfigAdmin(admin.ModelAdmin):
    list_display = ("id", "user", "two_fa_enabled", "two_fa_email", "has_two_fa")
    list_filter = ("two_fa_enabled", "has_two_fa")
    search_fields = ("user__username", "user__email", "two_fa_email")
    readonly_fields = ("id",)


@admin.register(ActiveService)
class ActiveServiceAdmin(admin.ModelAdmin):
    list_display = ("id", "user", "name", "additional_info", "active_until", "is_purchased")
    list_filter = ("is_purchased", "name")
    search_fields = ("user__username", "user__email", "name")


@admin.register(BillingRecord)
class BillingRecordAdmin(admin.ModelAdmin):
    list_display = ("id", "user", "date", "description", "amount", "is_included")
    list_filter = ("is_included", "date")
    search_fields = ("user__username", "user__email", "description")


@admin.register(CheckInHistoryRecord)
class CheckInHistoryRecordAdmin(admin.ModelAdmin):
    list_display = ("id", "user", "date", "time", "ip", "login_name", "device_os")
    list_filter = ("date", "device_os")
    search_fields = ("user__username", "user__email", "login_name", "ip")


@admin.register(ContactMessage)
class ContactMessageAdmin(admin.ModelAdmin):
    list_display = ("full_name", "email", "subject", "is_customer", "created_at")
    list_filter = ("is_customer", "created_at")
    search_fields = ("full_name", "email", "subject", "message")
    readonly_fields = ("full_name", "email", "subject", "is_customer", "message", "created_at")
    date_hierarchy = "created_at"


@admin.register(StoragePlan)
class StoragePlanAdmin(admin.ModelAdmin):
    list_display = ("id", "gb", "price", "description", "created_at", "updated_at")
    list_filter = ("gb", "price")
    search_fields = ("gb", "price", "description")
    readonly_fields = ("id", "created_at", "updated_at")


