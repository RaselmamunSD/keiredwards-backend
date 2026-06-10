from django.urls import path

from .views import DashboardAnalyticsView, DashboardSummaryView, CheckInEmailConfigView

urlpatterns = [
    path("summary/", DashboardSummaryView.as_view(), name="dashboard-summary"),
    path("analytics/", DashboardAnalyticsView.as_view(), name="dashboard-analytics"),
    path("checkin-email/", CheckInEmailConfigView.as_view(), name="dashboard-checkin-email"),
]
