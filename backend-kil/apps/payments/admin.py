from django.contrib import admin

from .models import Payment


@admin.register(Payment)
class PaymentAdmin(admin.ModelAdmin):
    list_display = ("id", "user", "amount", "currency", "transaction_id", "status", "created_at")
    list_filter = ("status", "currency", "created_at")
    search_fields = ("transaction_id", "user__username", "user__email")
