from django.urls import path

from .views import (
    DashboardAnalyticsView,
    DashboardSummaryView,
    CheckInEmailConfigView,
    CheckInScheduleConfigView,
    TrustedRecipientsView,
    EmailTemplateConfigView,
    PressReleaseConfigView,
    UserVaultFilesView,
    SetupAccountingConfigView,
    ContactMessageCreateView,
)

urlpatterns = [
    path("summary/", DashboardSummaryView.as_view(), name="dashboard-summary"),
    path("analytics/", DashboardAnalyticsView.as_view(), name="dashboard-analytics"),
    path("checkin-email/", CheckInEmailConfigView.as_view(), name="dashboard-checkin-email"),
    path("checkin-schedule/", CheckInScheduleConfigView.as_view(), name="dashboard-checkin-schedule"),
    path("trusted-recipients/", TrustedRecipientsView.as_view(), name="dashboard-trusted-recipients"),
    path("email-template/", EmailTemplateConfigView.as_view(), name="dashboard-email-template"),
    path("press-release/", PressReleaseConfigView.as_view(), name="dashboard-press-release"),
    path("vault-files/", UserVaultFilesView.as_view(), name="dashboard-vault-files"),
    path("setup-accounting/", SetupAccountingConfigView.as_view(), name="dashboard-setup-accounting"),
    path("contact/", ContactMessageCreateView.as_view(), name="dashboard-contact"),
]

