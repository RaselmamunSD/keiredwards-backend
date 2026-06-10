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
