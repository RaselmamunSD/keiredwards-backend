from datetime import timedelta

from django.db.models import Sum
from django.db.models.functions import TruncDate
from django.utils import timezone
from rest_framework import permissions, status
from rest_framework.views import APIView

from apps.core.responses import success_response
from apps.payments.models import Payment

from .models import DashboardWidget
from .serializers import DashboardWidgetSerializer


class DashboardSummaryView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        user_payments = Payment.objects.filter(user=request.user)
        total_payments = user_payments.count()
        total_amount = user_payments.filter(status=Payment.PaymentStatus.COMPLETED).aggregate(
            total=Sum("amount")
        )["total"] or 0
        widgets = DashboardWidget.objects.filter(user=request.user)

        return success_response(
            "Dashboard summary fetched successfully.",
            {
                "total_payments": total_payments,
                "completed_payment_amount": total_amount,
                "pending_payments": user_payments.filter(status=Payment.PaymentStatus.PENDING).count(),
                "failed_payments": user_payments.filter(status=Payment.PaymentStatus.FAILED).count(),
                "widgets": DashboardWidgetSerializer(widgets, many=True).data,
            },
            status.HTTP_200_OK,
        )


class DashboardAnalyticsView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        days = int(request.query_params.get("days", 30))
        days = min(max(days, 7), 365)
        start_date = timezone.now() - timedelta(days=days)

        payments = Payment.objects.filter(user=request.user, created_at__gte=start_date)

        trend = (
            payments.filter(status=Payment.PaymentStatus.COMPLETED)
            .annotate(day=TruncDate("created_at"))
            .values("day")
            .annotate(amount=Sum("amount"))
            .order_by("day")
        )
        status_breakdown = {
            "pending": payments.filter(status=Payment.PaymentStatus.PENDING).count(),
            "completed": payments.filter(status=Payment.PaymentStatus.COMPLETED).count(),
            "failed": payments.filter(status=Payment.PaymentStatus.FAILED).count(),
            "cancelled": payments.filter(status=Payment.PaymentStatus.CANCELLED).count(),
        }
        recent_payments = payments.order_by("-created_at")[:5]

        return success_response(
            "Dashboard analytics fetched successfully.",
            {
                "period_days": days,
                "status_breakdown": status_breakdown,
                "daily_completed_amount": list(trend),
                "recent_payments": [
                    {
                        "transaction_id": p.transaction_id,
                        "amount": str(p.amount),
                        "currency": p.currency,
                        "status": p.status,
                        "created_at": p.created_at,
                    }
                    for p in recent_payments
                ],
            },
            status.HTTP_200_OK,
        )
