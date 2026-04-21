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
