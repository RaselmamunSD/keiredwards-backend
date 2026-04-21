import uuid

from rest_framework import permissions, status
from rest_framework.generics import ListAPIView
from rest_framework.views import APIView

from apps.core.responses import success_response

from .gateway import PapylGatewayClient, PapylGatewayError
from .models import Payment
from .serializers import PaymentCreateSerializer, PaymentSerializer, PaymentVerifySerializer


class PaymentListView(ListAPIView):
    serializer_class = PaymentSerializer
    permission_classes = [permissions.IsAuthenticated]
    search_fields = ("transaction_id",)
    ordering_fields = ("created_at", "amount")
    filterset_fields = ("status", "currency")

    def get_queryset(self):
        return Payment.objects.filter(user=self.request.user)

    def list(self, request, *args, **kwargs):
        queryset = self.filter_queryset(self.get_queryset())
        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return success_response(
                "Payments fetched successfully.",
                {
                    "count": self.paginator.page.paginator.count,
                    "next": self.paginator.get_next_link(),
                    "previous": self.paginator.get_previous_link(),
                    "results": serializer.data,
                },
                status.HTTP_200_OK,
            )
        serializer = self.get_serializer(queryset, many=True)
        return success_response("Payments fetched successfully.", serializer.data, status.HTTP_200_OK)


class PaymentCreateView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        serializer = PaymentCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        validated = serializer.validated_data

        transaction_id = f"txn_{uuid.uuid4().hex[:16]}"
        callback_url = f"{request.scheme}://{request.get_host()}/api/v1/payments/verify/"

        gateway_client = PapylGatewayClient()
        try:
            gateway_payload = gateway_client.create_payment(
                amount=validated["amount"],
                currency=validated["currency"],
                transaction_id=transaction_id,
                callback_url=callback_url,
            )
        except PapylGatewayError as exc:
            return success_response(
                "Payment initiation failed.",
                {"error": str(exc)},
                status.HTTP_502_BAD_GATEWAY,
            )

        payment = Payment.objects.create(
            user=request.user,
            amount=validated["amount"],
            currency=validated["currency"],
            transaction_id=transaction_id,
            gateway="papyl",
            gateway_reference=gateway_payload["reference"],
            status=gateway_payload["status"],
            metadata={**validated.get("metadata", {}), "gateway_raw": gateway_payload["raw"]},
        )
        return success_response(
            "Payment initiated successfully.",
            {
                "payment": PaymentSerializer(payment).data,
                "checkout_url": gateway_payload["checkout_url"],
            },
            status.HTTP_201_CREATED,
        )


class PaymentVerifyView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        serializer = PaymentVerifySerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        reference = serializer.validated_data["reference"]
        payment = Payment.objects.filter(user=request.user, gateway_reference=reference).first()
        if not payment:
            return success_response("Payment not found for verification.", {}, status.HTTP_404_NOT_FOUND)

        gateway_client = PapylGatewayClient()
        try:
            result = gateway_client.verify_payment(reference)
        except PapylGatewayError as exc:
            return success_response("Payment verification failed.", {"error": str(exc)}, status.HTTP_502_BAD_GATEWAY)

        status_map = {
            "completed": Payment.PaymentStatus.COMPLETED,
            "failed": Payment.PaymentStatus.FAILED,
            "cancelled": Payment.PaymentStatus.CANCELLED,
        }
        payment.status = status_map.get(result["status"], Payment.PaymentStatus.PENDING)
        payment.metadata = {**payment.metadata, "verification": result["raw"]}
        payment.save(update_fields=["status", "metadata", "updated_at"])

        return success_response(
            "Payment verified successfully.",
            {"payment": PaymentSerializer(payment).data},
            status.HTTP_200_OK,
        )
