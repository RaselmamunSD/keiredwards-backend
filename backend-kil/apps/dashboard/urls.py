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
    UserVaultFileDownloadView,
    VaultFileStatusView,
    SetupAccountingConfigView,
    ContactMessageCreateView,
    CheckInMagicLinkRequestView,
    CheckInMagicLinkVerifyView,
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
    path("vault-files/status/", VaultFileStatusView.as_view(), name="dashboard-vault-file-status"),
    path("vault-files/<int:file_id>/download/", UserVaultFileDownloadView.as_view(), name="dashboard-vault-file-download"),
    path("setup-accounting/", SetupAccountingConfigView.as_view(), name="dashboard-setup-accounting"),
    path("contact/", ContactMessageCreateView.as_view(), name="dashboard-contact"),
    path("checkin/request-link/", CheckInMagicLinkRequestView.as_view(), name="checkin-request-link"),
    path("checkin/verify-link/", CheckInMagicLinkVerifyView.as_view(), name="checkin-verify-link"),
]

