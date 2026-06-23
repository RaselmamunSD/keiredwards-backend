from rest_framework import serializers

from .models import (
    DashboardWidget,
    CheckInEmailConfig,
    CheckInScheduleConfig,
    TrustedRecipient,
    EmailTemplateConfig,
    PressReleaseConfig,
    PressReleaseTier,
    StorageConfig,
    UserVaultFile,
    SetupAccountingConfig,
    ActiveService,
    BillingRecord,
    CheckInHistoryRecord,
    ContactMessage,
    StoragePlan,
)


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


class CheckInScheduleConfigSerializer(serializers.ModelSerializer):
    class Meta:
        model = CheckInScheduleConfig
        fields = ("id", "day_of_week", "grace_period", "paused", "purchased_plan", "renewal_date", "updated_at", "created_at")
        read_only_fields = ("id", "created_at", "updated_at")


class TrustedRecipientSerializer(serializers.ModelSerializer):
    class Meta:
        model = TrustedRecipient
        fields = ("id", "first_name", "email", "is_owner", "created_at")
        read_only_fields = ("id", "created_at")


class EmailTemplateConfigSerializer(serializers.ModelSerializer):
    class Meta:
        model = EmailTemplateConfig
        fields = ("id", "template", "updated_at")
        read_only_fields = ("id", "updated_at")


class PressReleaseTierSerializer(serializers.ModelSerializer):
    price = serializers.SerializerMethodField()

    class Meta:
        model = PressReleaseTier
        fields = ("tier_index", "count", "label", "price")

    def get_price(self, obj):
        if obj.price is None or obj.price == 0:
            return None
        if obj.price % 1 == 0:
            return f"${int(obj.price)}"
        return f"${obj.price:.2f}"


class PressReleaseConfigSerializer(serializers.ModelSerializer):
    tiers = serializers.SerializerMethodField()

    class Meta:
        model = PressReleaseConfig
        fields = ("id", "is_active", "template", "current_tier", "category", "tiers", "updated_at")
        read_only_fields = ("id", "updated_at")

    def get_tiers(self, obj):
        tiers = PressReleaseTier.objects.all().order_by("tier_index")
        if not tiers.exists():
            PressReleaseTier.objects.create(tier_index=0, count="250", label="Media Outlets", price=None)
            PressReleaseTier.objects.create(tier_index=1, count="500", label="Media Outlets", price=495.00)
            PressReleaseTier.objects.create(tier_index=2, count="1,000+", label="Media Outlets", price=695.00)
            tiers = PressReleaseTier.objects.all().order_by("tier_index")
        return PressReleaseTierSerializer(tiers, many=True).data


class StorageConfigSerializer(serializers.ModelSerializer):
    class Meta:
        model = StorageConfig
        fields = ("id", "total_storage_gb", "updated_at")
        read_only_fields = ("id", "updated_at")


class UserVaultFileSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserVaultFile
        fields = ("id", "file_name", "file_size_mb", "uploaded_at")
        read_only_fields = ("id", "uploaded_at")


class SetupAccountingConfigSerializer(serializers.ModelSerializer):
    class Meta:
        model = SetupAccountingConfig
        fields = ("id", "two_fa_enabled", "two_fa_email", "has_two_fa")
        read_only_fields = ("id",)


class ActiveServiceSerializer(serializers.ModelSerializer):
    class Meta:
        model = ActiveService
        fields = ("id", "name", "additional_info", "active_until", "is_purchased")
        read_only_fields = ("id",)


class BillingRecordSerializer(serializers.ModelSerializer):
    class Meta:
        model = BillingRecord
        fields = ("id", "date", "description", "amount", "is_included")
        read_only_fields = ("id",)


class CheckInHistoryRecordSerializer(serializers.ModelSerializer):
    class Meta:
        model = CheckInHistoryRecord
        fields = ("id", "date", "time", "ip", "login_name", "device_os")
        read_only_fields = ("id",)


class ContactMessageSerializer(serializers.ModelSerializer):
    class Meta:
        model = ContactMessage
        fields = ("id", "full_name", "email", "subject", "is_customer", "message", "created_at")
        read_only_fields = ("id", "created_at")


class StoragePlanSerializer(serializers.ModelSerializer):
    class Meta:
        model = StoragePlan
        fields = ("id", "gb", "price", "description")
        read_only_fields = ("id",)


