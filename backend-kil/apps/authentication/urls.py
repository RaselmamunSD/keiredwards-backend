from django.urls import include, path

from .views import AuthActivityListView, AuthenticationHealthView

urlpatterns = [
    path("health/", AuthenticationHealthView.as_view(), name="authentication-health"),
    path("activity/", AuthActivityListView.as_view(), name="authentication-activity"),
    path("", include("apps.accounts.urls")),
]
