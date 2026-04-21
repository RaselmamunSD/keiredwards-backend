from rest_framework import serializers

from .models import Payment


class PaymentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Payment
        fields = (
            "id",
            "user",
            "amount",
            "currency",
            "transaction_id",
            "gateway",
            "gateway_reference",
            "status",
            "metadata",
            "created_at",
            "updated_at",
        )
        read_only_fields = ("id", "created_at", "updated_at", "status", "gateway", "gateway_reference")


class PaymentCreateSerializer(serializers.Serializer):
    amount = serializers.DecimalField(max_digits=10, decimal_places=2)
    currency = serializers.CharField(max_length=10, default="USD")
    metadata = serializers.JSONField(required=False, default=dict)


class PaymentVerifySerializer(serializers.Serializer):
    reference = serializers.CharField(max_length=150)
