import uuid

from rest_framework import permissions, status
from rest_framework.generics import ListAPIView
from rest_framework.views import APIView

from apps.core.responses import success_response

from .gateway import PapylGatewayClient, PapylGatewayError
from .models import Payment, CheckInOption, AddOnOption
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
        old_status = payment.status
        payment.status = status_map.get(result["status"], Payment.PaymentStatus.PENDING)
        payment.metadata = {**payment.metadata, "verification": result["raw"]}
        payment.save(update_fields=["status", "metadata", "updated_at"])

        if payment.status == Payment.PaymentStatus.COMPLETED and old_status != Payment.PaymentStatus.COMPLETED:
            metadata = payment.metadata or {}
            if metadata.get("type") == "storage_upgrade":
                gb_val = metadata.get("gb")
                if gb_val:
                    try:
                        gb_int = int(gb_val)
                        from apps.dashboard.models import StorageConfig
                        storage_config, created = StorageConfig.objects.get_or_create(user=payment.user)
                        storage_config.total_storage_gb = gb_int
                        storage_config.save()
                    except Exception as e:
                        import logging
                        logger = logging.getLogger(__name__)
                        logger.error(f"Error upgrading storage for user {payment.user.id}: {e}")
            elif metadata.get("type") == "press_release_upgrade":
                tier_val = metadata.get("tier")
                if tier_val is not None:
                    try:
                        tier_int = int(tier_val)
                        from apps.dashboard.models import PressReleaseConfig, ActiveService, BillingRecord
                        press_config, created = PressReleaseConfig.objects.get_or_create(
                            user=payment.user,
                            defaults={
                                "template": (
                                    "URGENT: Critical Information Released by [Your Name]\n\n"
                                    "This press release is being distributed in accordance with a pre-arranged security protocol. "
                                    "The account holder has missed their scheduled check-in, triggering this automatic distribution.\n\n"
                                    "The following information has been secured and is now available to designated recipients and the public:\n\n"
                                    "[Brief description of what the information contains]\n\n"
                                    "This release was configured in advance as a protective measure. All materials have been encrypted and verified for authenticity.\n\n"
                                    "For access to the complete documentation, please visit the secure link provided to verified recipients.\n\n"
                                    "Contact Information:\n"
                                    "Distributed via: I Was Killed For This Information\n"
                                    "Date: [Auto-generated]\n"
                                    "Reference ID: [Auto-generated]"
                                )
                            }
                        )
                        press_config.current_tier = tier_int
                        press_config.save()

                        ActiveService.objects.filter(user=payment.user, name="Press Release").update(
                            is_purchased=True,
                            active_until="March 7, 2027"
                        )

                        # Add a billing record
                        price_str = f"${payment.amount}"
                        BillingRecord.objects.get_or_create(
                            user=payment.user,
                            description=f"Press Release Upgrade (Tier {tier_int})",
                            defaults={"date": "06/27/2026", "amount": price_str}
                        )
                    except Exception as e:
                        import logging
                        logger = logging.getLogger(__name__)
                        logger.error(f"Error upgrading press release tier for user {payment.user.id}: {e}")
            elif metadata.get("type") == "setup_accounting_purchase":
                try:
                    purchase_services = metadata.get("purchase_services", [])
                    extra_storage_gb = metadata.get("extra_storage_gb")
                    check_in_service = metadata.get("check_in_service")
                    press_option = metadata.get("press_option")

                    from apps.dashboard.models import SetupAccountingConfig, ActiveService, BillingRecord, StorageConfig, CheckInScheduleConfig, PressReleaseConfig

                    # 1. Fetch or create SetupAccountingConfig for user
                    config, created = SetupAccountingConfig.objects.get_or_create(
                        user=payment.user,
                        defaults={"two_fa_email": payment.user.email, "has_two_fa": False}
                    )

                    # 2. Process purchase_services (like Private Email, Two-Factor Authentication)
                    if purchase_services:
                        for sname in purchase_services:
                            ActiveService.objects.filter(user=payment.user, name=sname).update(
                                is_purchased=True,
                                active_until="March 7, 2027"
                            )
                            if sname == "Two-Factor Authentication":
                                config.has_two_fa = True
                                config.save()
                            
                            price_str = "$39.00"
                            if sname == "Private Email":
                                price_str = "$39.00"
                            elif sname == "Two-Factor Authentication":
                                price_str = "$39.00"
                            elif sname == "Press Release":
                                price_str = "$250.00"
                                if press_option == "press_release_500":
                                    price_str = "$495.00"
                                elif press_option == "press_release_1000":
                                    price_str = "$695.00"
                            
                            BillingRecord.objects.get_or_create(
                                user=payment.user,
                                description=f"Purchase: {sname}",
                                defaults={"date": "06/11/2026", "amount": price_str}
                            )

                    # 3. Process extra storage
                    if extra_storage_gb:
                        try:
                            gb = int(extra_storage_gb)
                            if gb > 0:
                                storage_config, created = StorageConfig.objects.get_or_create(user=payment.user)
                                storage_config.total_storage_gb = 5 + gb
                                storage_config.save()

                                ActiveService.objects.filter(user=payment.user, name="Additional Storage").update(
                                    additional_info=f"{5 + gb} GB",
                                    is_purchased=True,
                                    active_until="March 7, 2027"
                                )
                                BillingRecord.objects.get_or_create(
                                    user=payment.user,
                                    description=f"Storage: {gb} GB Extra",
                                    defaults={"date": "06/11/2026", "amount": f"${gb * 15}.00"}
                                )
                        except Exception as e:
                            pass

                    # 4. Process check-in service
                    if check_in_service:
                        ActiveService.objects.filter(user=payment.user, name="I Was Killed For This Information").update(
                            additional_info=check_in_service,
                            is_purchased=True,
                            active_until="March 7, 2027"
                        )
                        plan_name = check_in_service.replace(" Check-In", "")
                        CheckInScheduleConfig.objects.filter(user=payment.user).update(
                            purchased_plan=plan_name,
                            renewal_date="March 7, 2027"
                        )
                        BillingRecord.objects.get_or_create(
                            user=payment.user,
                            description=f"Main Service: {check_in_service}",
                            defaults={"date": "06/11/2026", "amount": "$91.00"}
                        )

                    # 5. Process press option
                    if press_option:
                        ActiveService.objects.filter(user=payment.user, name="Press Release").update(
                            is_purchased=True,
                            active_until="March 7, 2027"
                        )
                        tier_map = {
                            "press_release": 0,
                            "press_release_250": 0,
                            "press_release_500": 1,
                            "press_release_1000": 2
                        }
                        tier_index = tier_map.get(press_option, 0)
                        press_config, created = PressReleaseConfig.objects.get_or_create(user=payment.user)
                        press_config.current_tier = tier_index
                        press_config.save()

                except Exception as e:
                    import logging
                    logger = logging.getLogger(__name__)
                    logger.error(f"Error executing setup_accounting_purchase for user {payment.user.id}: {e}")

        return success_response(
            "Payment verified successfully.",
            {"payment": PaymentSerializer(payment).data},
            status.HTTP_200_OK,
        )


class PricingConfigView(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        check_in_options = CheckInOption.objects.all().order_by("price_per_month")
        add_ons = AddOnOption.objects.all()

        formatted_check_in = [
            {
                "key": opt.key,
                "label": opt.label,
                "display_label": opt.display_label,
                "price_per_month": float(opt.price_per_month),
                "price_1_year": float(opt.price_1_year),
                "price_2_years": float(opt.price_2_years),
                "price_3_years": float(opt.price_3_years),
            }
            for opt in check_in_options
        ]

        formatted_addons = [
            {
                "key": addon.key,
                "label": addon.label,
                "description": addon.description,
                "price": float(addon.price),
            }
            for addon in add_ons
        ]

        return success_response(
            "Pricing configurations fetched successfully.",
            {
                "check_in_options": formatted_check_in,
                "add_ons": formatted_addons,
            },
            status.HTTP_200_OK,
        )

