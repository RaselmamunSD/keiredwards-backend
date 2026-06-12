from django.db import models


class Payment(models.Model):
    class PaymentStatus(models.TextChoices):
        PENDING = "pending", "Pending"
        COMPLETED = "completed", "Completed"
        FAILED = "failed", "Failed"
        CANCELLED = "cancelled", "Cancelled"

    user = models.ForeignKey("accounts.User", on_delete=models.CASCADE, related_name="payments")
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    currency = models.CharField(max_length=10, default="USD")
    transaction_id = models.CharField(max_length=150, unique=True)
    gateway = models.CharField(max_length=30, default="papyl")
    gateway_reference = models.CharField(max_length=150, blank=True)
    status = models.CharField(max_length=20, choices=PaymentStatus.choices, default=PaymentStatus.PENDING)
    metadata = models.JSONField(default=dict, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ("-created_at",)

    def __str__(self):
        return f"{self.transaction_id} - {self.status}"


class CheckInOption(models.Model):
    key = models.CharField(max_length=50, unique=True, help_text="e.g. daily, weekly, monthly, quarterly, yearly")
    label = models.CharField(max_length=100, help_text="e.g. Daily Check-In")
    display_label = models.CharField(max_length=50, help_text="e.g. Daily")
    price_per_month = models.DecimalField(max_digits=10, decimal_places=2, help_text="Used in pricing calculator page")
    price_1_year = models.DecimalField(max_digits=10, decimal_places=2, help_text="Used in registration flow step 4 (1 Year)")
    price_2_years = models.DecimalField(max_digits=10, decimal_places=2, help_text="Used in registration flow step 4 (2 Years)")
    price_3_years = models.DecimalField(max_digits=10, decimal_places=2, help_text="Used in registration flow step 4 (3 Years)")

    def __str__(self):
        return f"{self.label} (${self.price_per_month}/mo)"

    class Meta:
        verbose_name = "Check-In Option"
        verbose_name_plural = "Check-In Options"


class AddOnOption(models.Model):
    key = models.CharField(max_length=50, unique=True, help_text="e.g. private_email, 2fa, extra_storage, press_release, press_release_250, etc.")
    label = models.CharField(max_length=100, help_text="e.g. Private Check-In Email Address")
    description = models.TextField(blank=True, help_text="Optional description for the add-on")
    price = models.DecimalField(max_digits=10, decimal_places=2, help_text="Price for this add-on option")

    def __str__(self):
        return f"{self.label} (${self.price})"

    class Meta:
        verbose_name = "Add-On Option"
        verbose_name_plural = "Add-On Options"

