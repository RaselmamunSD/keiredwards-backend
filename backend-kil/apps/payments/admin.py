from django.contrib import admin
from unfold.admin import ModelAdmin, StackedInline, TabularInline
from django.utils.html import format_html

from .models import Payment, CheckInOption, AddOnOption, SiteSetting


@admin.register(CheckInOption)
class CheckInOptionAdmin(ModelAdmin):
    list_display = ("key", "label", "price_per_month", "price_1_year", "price_2_years", "price_3_years")
    search_fields = ("key", "label")


@admin.register(AddOnOption)
class AddOnOptionAdmin(ModelAdmin):
    list_display = ("key", "label", "price")
    search_fields = ("key", "label")


@admin.register(SiteSetting)
class SiteSettingAdmin(ModelAdmin):
    list_display = ("__str__", "discount_2_years_pct", "discount_3_years_pct")

    def has_add_permission(self, request):
        # We only want one instance of site settings
        return False if self.model.objects.count() > 0 else super().has_add_permission(request)


@admin.register(Payment)
class PaymentAdmin(ModelAdmin):
    list_display = ("id", "user", "amount_with_currency", "transaction_id", "gateway", "status_badge", "created_at", "updated_at")
    list_filter = ("status", "gateway", "currency", "created_at")
    search_fields = ("transaction_id", "gateway_reference", "user__username", "user__email")
    date_hierarchy = "created_at"
    readonly_fields = ("id", "transaction_id", "created_at", "updated_at", "metadata_display")
    fieldsets = (
        ("Payment Info", {"fields": ("id", "user", "amount", "currency", "transaction_id")}),
        ("Gateway Details", {"fields": ("gateway", "gateway_reference")}),
        ("Status", {"fields": ("status",)}),
        ("Metadata", {"fields": ("metadata_display",)}),
        ("Timestamps", {"fields": ("created_at", "updated_at")}),
    )
    list_per_page = 50

    def amount_with_currency(self, obj):
        return f"${obj.amount} {obj.currency}"
    amount_with_currency.short_description = "Amount"

    def status_badge(self, obj):
        colors = {
            "pending": "orange",
            "completed": "green",
            "failed": "red",
            "cancelled": "gray",
        }
        color = colors.get(obj.status, "blue")
        return format_html(
            '<span style="color: {}; font-weight: bold;\">{}</span>',
            color,
            obj.get_status_display().upper(),
        )
    status_badge.short_description = "Status"

    def metadata_display(self, obj):
        if obj.metadata:
            return str(obj.metadata)
        return "N/A"
    metadata_display.short_description = "Metadata"
