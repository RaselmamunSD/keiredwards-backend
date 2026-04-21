from django.contrib import admin

from .models import DashboardWidget


@admin.register(DashboardWidget)
class DashboardWidgetAdmin(admin.ModelAdmin):
    list_display = ("id", "user", "title", "widget_type", "position", "created_at")
    search_fields = ("user__username", "title", "widget_type")
