from django.db import models


class AuthAuditLog(models.Model):
    user = models.ForeignKey("accounts.User", on_delete=models.CASCADE, related_name="auth_audit_logs")
    action = models.CharField(max_length=100)
    method = models.CharField(max_length=10, blank=True)
    endpoint = models.CharField(max_length=255, blank=True)
    was_successful = models.BooleanField(default=True)
    ip_address = models.GenericIPAddressField(blank=True, null=True)
    user_agent = models.CharField(max_length=255, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ("-created_at",)

    def __str__(self):
        return f"{self.user_id} - {self.action}"
