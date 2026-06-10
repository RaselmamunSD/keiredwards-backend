from django.db import models


class DashboardWidget(models.Model):
    user = models.ForeignKey("accounts.User", on_delete=models.CASCADE, related_name="dashboard_widgets")
    title = models.CharField(max_length=120)
    widget_type = models.CharField(max_length=50)
    position = models.PositiveIntegerField(default=0)
    config = models.JSONField(default=dict, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ("position", "id")

    def __str__(self):
        return f"{self.user.username} - {self.title}"


class CheckInEmailConfig(models.Model):
    user = models.OneToOneField(
        "accounts.User",
        on_delete=models.CASCADE,
        related_name="checkin_email_config",
        verbose_name="User",
    )
    checkin_email = models.EmailField("Check-In Email Address", max_length=254, blank=True, null=True)
    checkin_password = models.CharField("Check-In Password", max_length=128, blank=True, null=True)
    checkin_password_enabled = models.BooleanField("Check-In Password Enabled", default=True)

    private_email_username = models.CharField("Private Email Username", max_length=150, blank=True, null=True)
    private_email_address_saved = models.BooleanField("Private Email Address Saved", default=False)
    private_email_password = models.CharField("Private Email Password", max_length=128, blank=True, null=True)
    private_email_password_saved = models.BooleanField("Private Email Password Saved", default=False)

    updated_at = models.DateTimeField(auto_now=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "Check-In Email Config"
        verbose_name_plural = "Check-In Email Configs"

    def __str__(self):
        return f"{self.user.username}'s Check-In Email Config"


class CheckInScheduleConfig(models.Model):
    user = models.OneToOneField("accounts.User", on_delete=models.CASCADE, related_name="checkin_schedule_config")
    day_of_week = models.CharField(max_length=50, default="Randomize")
    grace_period = models.CharField(max_length=50, default="NONE")
    paused = models.BooleanField(default=False)
    purchased_plan = models.CharField(max_length=100, default="Weekly")
    renewal_date = models.CharField(max_length=100, default="03/23/2026")
    updated_at = models.DateTimeField(auto_now=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.user.username}'s Check-In Schedule"


class TrustedRecipient(models.Model):
    user = models.ForeignKey("accounts.User", on_delete=models.CASCADE, related_name="trusted_recipients")
    first_name = models.CharField(max_length=150)
    email = models.EmailField(max_length=254)
    is_owner = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.user.username} -> {self.first_name} ({self.email})"


class EmailTemplateConfig(models.Model):
    user = models.OneToOneField("accounts.User", on_delete=models.CASCADE, related_name="email_template_config")
    template = models.TextField()
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.user.username}'s Email Template"


class PressReleaseConfig(models.Model):
    user = models.OneToOneField("accounts.User", on_delete=models.CASCADE, related_name="press_release_config")
    is_active = models.BooleanField(default=True)
    template = models.TextField()
    current_tier = models.IntegerField(default=0)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.user.username}'s Press Release Config"


class StorageConfig(models.Model):
    user = models.OneToOneField("accounts.User", on_delete=models.CASCADE, related_name="storage_config")
    total_storage_gb = models.IntegerField(default=5)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.user.username}'s Storage Config ({self.total_storage_gb} GB)"


class UserVaultFile(models.Model):
    user = models.ForeignKey("accounts.User", on_delete=models.CASCADE, related_name="vault_files")
    file_name = models.CharField(max_length=255)
    file_size_mb = models.CharField(max_length=20)
    uploaded_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.user.username} file: {self.file_name} ({self.file_size_mb} MB)"


class SetupAccountingConfig(models.Model):
    user = models.OneToOneField("accounts.User", on_delete=models.CASCADE, related_name="setup_accounting_config")
    two_fa_enabled = models.BooleanField(default=True)
    two_fa_email = models.EmailField(max_length=254, blank=True, null=True)
    has_two_fa = models.BooleanField(default=True)

    def __str__(self):
        return f"{self.user.username}'s Setup & 2FA Config"


class ActiveService(models.Model):
    user = models.ForeignKey("accounts.User", on_delete=models.CASCADE, related_name="active_services")
    name = models.CharField(max_length=255)
    additional_info = models.CharField(max_length=255)
    active_until = models.CharField(max_length=100)
    is_purchased = models.BooleanField(default=True)

    def __str__(self):
        return f"{self.user.username} service: {self.name}"


class BillingRecord(models.Model):
    user = models.ForeignKey("accounts.User", on_delete=models.CASCADE, related_name="billing_records")
    date = models.CharField(max_length=50)
    description = models.CharField(max_length=255)
    amount = models.CharField(max_length=50)
    is_included = models.BooleanField(default=False)

    def __str__(self):
        return f"{self.user.username} bill: {self.description} ({self.amount})"


class CheckInHistoryRecord(models.Model):
    user = models.ForeignKey("accounts.User", on_delete=models.CASCADE, related_name="checkin_history_records")
    date = models.CharField(max_length=50)
    time = models.CharField(max_length=50)
    ip = models.CharField(max_length=50)
    login_name = models.CharField(max_length=150)
    device_os = models.CharField(max_length=100)

    def __str__(self):
        return f"{self.user.username} check-in on {self.date} at {self.time}"
