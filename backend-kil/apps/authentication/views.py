from rest_framework import permissions, status
from rest_framework.generics import ListAPIView
from rest_framework.views import APIView

from apps.core.responses import success_response

from .models import AuthAuditLog
from .serializers import AuthAuditLogSerializer


class AuthenticationHealthView(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        return success_response(
            "Authentication service is running.",
            {"service": "authentication", "status": "ok"},
            status.HTTP_200_OK,
        )


class AuthActivityListView(ListAPIView):
    serializer_class = AuthAuditLogSerializer
    permission_classes = [permissions.IsAuthenticated]
    ordering = ("-created_at",)

    def get_queryset(self):
        return AuthAuditLog.objects.filter(user=self.request.user).order_by("-created_at")

    def list(self, request, *args, **kwargs):
        queryset = self.filter_queryset(self.get_queryset())
        serializer = self.get_serializer(queryset[:100], many=True)
        return success_response(
            "Authentication activity fetched successfully.",
            serializer.data,
            status.HTTP_200_OK,
        )
