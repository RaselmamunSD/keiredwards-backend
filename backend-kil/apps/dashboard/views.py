from datetime import timedelta

from django.db.models import Sum
from django.db.models.functions import TruncDate
from django.utils import timezone
from rest_framework import permissions, status
from rest_framework.views import APIView

from rest_framework.exceptions import ValidationError
from apps.core.responses import success_response
from apps.payments.models import Payment

from .models import (
    DashboardWidget,
    CheckInEmailConfig,
    CheckInScheduleConfig,
    TrustedRecipient,
    EmailTemplateConfig,
    PressReleaseConfig,
    StorageConfig,
    UserVaultFile,
    SetupAccountingConfig,
    ActiveService,
    BillingRecord,
    CheckInHistoryRecord,
    ContactMessage,
)
from .serializers import (
    DashboardWidgetSerializer,
    CheckInEmailConfigSerializer,
    CheckInScheduleConfigSerializer,
    TrustedRecipientSerializer,
    EmailTemplateConfigSerializer,
    PressReleaseConfigSerializer,
    StorageConfigSerializer,
    UserVaultFileSerializer,
    SetupAccountingConfigSerializer,
    ActiveServiceSerializer,
    BillingRecordSerializer,
    CheckInHistoryRecordSerializer,
    ContactMessageSerializer,
)


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


class CheckInEmailConfigView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        config, created = CheckInEmailConfig.objects.get_or_create(
            user=request.user,
            defaults={"checkin_email": request.user.email}
        )
        serializer = CheckInEmailConfigSerializer(config)
        return success_response("Check-in email config fetched successfully.", serializer.data, status.HTTP_200_OK)

    def post(self, request):
        config, created = CheckInEmailConfig.objects.get_or_create(
            user=request.user,
            defaults={"checkin_email": request.user.email}
        )
        serializer = CheckInEmailConfigSerializer(config, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return success_response("Check-in email config updated successfully.", serializer.data, status.HTTP_200_OK)



class CheckInScheduleConfigView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        config, created = CheckInScheduleConfig.objects.get_or_create(user=request.user)
        serializer = CheckInScheduleConfigSerializer(config)
        return success_response("Check-in schedule config fetched successfully.", serializer.data, status.HTTP_200_OK)

    def post(self, request):
        config, created = CheckInScheduleConfig.objects.get_or_create(user=request.user)
        serializer = CheckInScheduleConfigSerializer(config, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return success_response("Check-in schedule config updated successfully.", serializer.data, status.HTTP_200_OK)


class TrustedRecipientsView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        owner_recipient, created = TrustedRecipient.objects.get_or_create(
            user=request.user,
            is_owner=True,
            defaults={"first_name": "Self", "email": request.user.email}
        )
        if owner_recipient.email != request.user.email:
            owner_recipient.email = request.user.email
            owner_recipient.save()

        recipients = TrustedRecipient.objects.filter(user=request.user)
        serializer = TrustedRecipientSerializer(recipients, many=True)
        return success_response("Trusted recipients fetched successfully.", serializer.data, status.HTTP_200_OK)

    def post(self, request):
        if TrustedRecipient.objects.filter(user=request.user).count() >= 10:
            raise ValidationError("Maximum limit of 10 trusted recipients reached.")

        serializer = TrustedRecipientSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save(user=request.user)
        return success_response("Recipient added successfully.", serializer.data, status.HTTP_201_CREATED)

    def delete(self, request):
        recipient_id = request.data.get("id") or request.query_params.get("id")
        if not recipient_id:
            raise ValidationError("Recipient ID is required.")
        try:
            recipient = TrustedRecipient.objects.get(id=recipient_id, user=request.user)
            if recipient.is_owner:
                raise ValidationError("Cannot delete the account owner recipient.")
            recipient.delete()
            return success_response("Recipient deleted successfully.", {}, status.HTTP_200_OK)
        except TrustedRecipient.DoesNotExist:
            raise ValidationError("Recipient not found.")


class EmailTemplateConfigView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        DEFAULT_TEMPLATE = (
            "Dear <Name>,\n\n"
            "This is Your Name. If you are receiving this message, it means I have been incapacitated or killed. "
            "I use \"I Was Killed For This Information\" to securely store vital information regarding:\n\n"
            "Included in this email is a secure link granting you access to my files, photos, and supporting evidence. "
            "Inside the link, you will find my instructions, a summary of what I've learned, and the proof I have documented.\n\n"
            "I trust that you will review this information carefully and share it with the appropriate authorities.\n\n"
            "<LINK>\n\n"
            "Thank you,\nYour Name"
        )
        config, created = EmailTemplateConfig.objects.get_or_create(
            user=request.user,
            defaults={"template": DEFAULT_TEMPLATE}
        )
        serializer = EmailTemplateConfigSerializer(config)
        return success_response("Email template fetched successfully.", serializer.data, status.HTTP_200_OK)

    def post(self, request):
        config, created = EmailTemplateConfig.objects.get_or_create(user=request.user)
        serializer = EmailTemplateConfigSerializer(config, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return success_response("Email template updated successfully.", serializer.data, status.HTTP_200_OK)


class PressReleaseConfigView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        DEFAULT_PRESS_TEMPLATE = (
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
        config, created = PressReleaseConfig.objects.get_or_create(
            user=request.user,
            defaults={"template": DEFAULT_PRESS_TEMPLATE}
        )
        serializer = PressReleaseConfigSerializer(config)
        return success_response("Press release template fetched successfully.", serializer.data, status.HTTP_200_OK)

    def post(self, request):
        config, created = PressReleaseConfig.objects.get_or_create(user=request.user)
        serializer = PressReleaseConfigSerializer(config, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return success_response("Press release template updated successfully.", serializer.data, status.HTTP_200_OK)


class UserVaultFilesView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        storage_config, created = StorageConfig.objects.get_or_create(user=request.user)
        files = UserVaultFile.objects.filter(user=request.user)
        return success_response(
            "Vault files fetched successfully.",
            {
                "storage_config": StorageConfigSerializer(storage_config).data,
                "files": UserVaultFileSerializer(files, many=True).data,
            },
            status.HTTP_200_OK
        )

    def post(self, request):
        total_storage_gb = request.data.get("total_storage_gb")
        if total_storage_gb:
            storage_config, created = StorageConfig.objects.get_or_create(user=request.user)
            storage_config.total_storage_gb = total_storage_gb
            storage_config.save()

        files_data = request.data.get("files")
        if files_data is not None:
            UserVaultFile.objects.filter(user=request.user).delete()
            created_files = []
            for fd in files_data:
                f = UserVaultFile.objects.create(
                    user=request.user,
                    file_name=fd.get("name"),
                    file_size_mb=fd.get("sizeMB")
                )
                created_files.append(f)

        storage_config, created = StorageConfig.objects.get_or_create(user=request.user)
        files = UserVaultFile.objects.filter(user=request.user)
        return success_response(
            "Vault files saved successfully.",
            {
                "storage_config": StorageConfigSerializer(storage_config).data,
                "files": UserVaultFileSerializer(files, many=True).data,
            },
            status.HTTP_200_OK
        )


def sync_user_checkin_history(user):
    from apps.authentication.models import AuthAuditLog
    from apps.dashboard.models import CheckInHistoryRecord
    
    # 1. Sync from user.last_login (using UTC date/time)
    if user.last_login:
        utc_time = user.last_login
        date_str = utc_time.strftime("%m/%d/%Y")
        time_str = utc_time.strftime("%I:%M %p")
        
        exists = CheckInHistoryRecord.objects.filter(
            user=user,
            date=date_str,
            time=time_str
        ).exists()
        
        if not exists:
            CheckInHistoryRecord.objects.create(
                user=user,
                date=date_str,
                time=time_str,
                ip="127.0.0.1",
                login_name=user.email or user.username,
                device_os="Unknown"
            )

    # 2. Sync from successful AuthAuditLog logins (using UTC date/time)
    successful_logins = AuthAuditLog.objects.filter(user=user, action="login", was_successful=True)
    for log in successful_logins:
        utc_time = log.created_at
        date_str = utc_time.strftime("%m/%d/%Y")
        time_str = utc_time.strftime("%I:%M %p")
        
        exists = CheckInHistoryRecord.objects.filter(
            user=user,
            date=date_str,
            time=time_str
        ).exists()
        
        if not exists:
            ua = log.user_agent.lower()
            if "windows" in ua:
                device_os = "Windows"
            elif "macintosh" in ua or "mac os" in ua:
                device_os = "macOS"
            elif "iphone" in ua or "ipad" in ua:
                device_os = "iOS"
            elif "android" in ua:
                device_os = "Android"
            elif "linux" in ua:
                device_os = "Linux"
            else:
                device_os = "Unknown"
            
            CheckInHistoryRecord.objects.create(
                user=user,
                date=date_str,
                time=time_str,
                ip=log.ip_address or "127.0.0.1",
                login_name=user.email or user.username,
                device_os=device_os
            )

class SetupAccountingConfigView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        sync_user_checkin_history(request.user)
        config, created = SetupAccountingConfig.objects.get_or_create(
            user=request.user,
            defaults={"two_fa_email": request.user.email, "has_two_fa": False}
        )

        if created:
            ActiveService.objects.create(user=request.user, name="I Was Killed For This Information", additional_info="Daily Check-in", active_until="March 7, 2027", is_purchased=True)
            ActiveService.objects.create(user=request.user, name="Additional Storage", additional_info="5 GB", active_until="March 7, 2027", is_purchased=True)
            ActiveService.objects.create(user=request.user, name="Press Release", additional_info="250 count*", active_until="March 7, 2027", is_purchased=True)
            ActiveService.objects.create(user=request.user, name="Two-Factor Authentication", additional_info="Checkin & Login", active_until="Not Purchased", is_purchased=False)
            ActiveService.objects.create(user=request.user, name="Private Email", additional_info="500 Messages Per year", active_until="March 7, 2027", is_purchased=True)

            BillingRecord.objects.create(user=request.user, date="02/23/2026", description="Professional Plan", amount="$29.99")
            BillingRecord.objects.create(user=request.user, date="02/23/2026", description="Storage: 5 GB (Default)", amount="Included", is_included=True)
            BillingRecord.objects.create(user=request.user, date="01/23/2026", description="Professional Plan", amount="$29.99")
            BillingRecord.objects.create(user=request.user, date="12/23/2025", description="Professional Plan", amount="$29.99")

            CheckInHistoryRecord.objects.create(user=request.user, date="02/24/2026", time="09:15 AM", ip="192.168.1.100", login_name=request.user.email, device_os="Windows 11")
            CheckInHistoryRecord.objects.create(user=request.user, date="02/17/2026", time="02:30 PM", ip="192.168.1.100", login_name=request.user.email, device_os="Windows 11")
            CheckInHistoryRecord.objects.create(user=request.user, date="02/10/2026", time="11:45 AM", ip="192.168.1.100", login_name=request.user.email, device_os="Windows 11")

        # Sync has_two_fa with the active service
        two_fa_service = ActiveService.objects.filter(user=request.user, name="Two-Factor Authentication").first()
        if two_fa_service:
            if config.has_two_fa != two_fa_service.is_purchased:
                config.has_two_fa = two_fa_service.is_purchased
                config.save()
        else:
            if config.has_two_fa:
                config.has_two_fa = False
                config.save()

        services = ActiveService.objects.filter(user=request.user)
        billing = BillingRecord.objects.filter(user=request.user)
        from datetime import datetime
        history = list(CheckInHistoryRecord.objects.filter(user=request.user))
        def parse_dt(record):
            try:
                return datetime.strptime(f"{record.date} {record.time}", "%m/%d/%Y %I:%M %p")
            except Exception:
                return datetime.min
        history.sort(key=parse_dt, reverse=True)

        return success_response(
            "Setup & Accounting fetched successfully.",
            {
                "config": SetupAccountingConfigSerializer(config).data,
                "services": ActiveServiceSerializer(services, many=True).data,
                "billing": BillingRecordSerializer(billing, many=True).data,
                "history": CheckInHistoryRecordSerializer(history, many=True).data,
            },
            status.HTTP_200_OK
        )

    def post(self, request):
        sync_user_checkin_history(request.user)
        config, created = SetupAccountingConfig.objects.get_or_create(user=request.user)

        two_fa_enabled = request.data.get("two_fa_enabled")
        if two_fa_enabled is not None:
            config.two_fa_enabled = two_fa_enabled

        two_fa_email = request.data.get("two_fa_email")
        if two_fa_email is not None:
            config.two_fa_email = two_fa_email

        config.save()

        purchase_service = request.data.get("purchase_service")
        if purchase_service:
            ActiveService.objects.filter(user=request.user, name=purchase_service).update(
                is_purchased=True,
                active_until="March 7, 2027"
            )
            if purchase_service == "Two-Factor Authentication":
                config.has_two_fa = True
                config.save()
            BillingRecord.objects.create(
                user=request.user,
                date="06/11/2026",
                description=f"Purchase: {purchase_service}",
                amount="$39.00"
            )
            import uuid
            Payment.objects.create(
                user=request.user,
                amount=39.00,
                transaction_id=f"TXN-{uuid.uuid4().hex[:12].upper()}",
                status=Payment.PaymentStatus.COMPLETED
            )

        purchase_services = request.data.get("purchase_services")
        if purchase_services:
            for sname in purchase_services:
                ActiveService.objects.filter(user=request.user, name=sname).update(
                    is_purchased=True,
                    active_until="March 7, 2027"
                )
                if sname == "Two-Factor Authentication":
                    config.has_two_fa = True
                    config.save()

                price = "$39.00"
                price_val = 39.00
                if sname == "Press Release":
                    price = "$250.00"
                    price_val = 250.00

                BillingRecord.objects.create(
                    user=request.user,
                    date="06/11/2026",
                    description=f"Purchase: {sname}",
                    amount=price
                )
                import uuid
                Payment.objects.create(
                    user=request.user,
                    amount=price_val,
                    transaction_id=f"TXN-{uuid.uuid4().hex[:12].upper()}",
                    status=Payment.PaymentStatus.COMPLETED
                )

        extra_storage_gb = request.data.get("extra_storage_gb")
        if extra_storage_gb is not None:
            try:
                gb = int(extra_storage_gb)
                total_storage = 5 + gb
                ActiveService.objects.filter(user=request.user, name="Additional Storage").update(
                    additional_info=f"{total_storage} GB",
                    is_purchased=True,
                    active_until="March 7, 2027"
                )
                BillingRecord.objects.create(
                    user=request.user,
                    date="06/11/2026",
                    description=f"Storage: {gb} GB Extra",
                    amount=f"${gb * 15}.00"
                )
                import uuid
                Payment.objects.create(
                    user=request.user,
                    amount=gb * 15,
                    transaction_id=f"TXN-{uuid.uuid4().hex[:12].upper()}",
                    status=Payment.PaymentStatus.COMPLETED
                )
            except ValueError:
                pass

        check_in_service = request.data.get("check_in_service")
        if check_in_service:
            ActiveService.objects.filter(user=request.user, name="I Was Killed For This Information").update(
                additional_info=check_in_service,
                is_purchased=True,
                active_until="March 7, 2027"
            )
            plan_name = check_in_service.replace(" Check-In", "")
            CheckInScheduleConfig.objects.filter(user=request.user).update(
                purchased_plan=plan_name,
                renewal_date="March 7, 2027"
            )
            BillingRecord.objects.create(
                user=request.user,
                date="06/11/2026",
                description=f"Main Service: {check_in_service}",
                amount="$91.00"
            )
            import uuid
            Payment.objects.create(
                user=request.user,
                amount=91.00,
                transaction_id=f"TXN-{uuid.uuid4().hex[:12].upper()}",
                status=Payment.PaymentStatus.COMPLETED
            )

        renew_services = request.data.get("renew_services")
        if renew_services:
            for sname in renew_services:
                ActiveService.objects.filter(user=request.user, name=sname).update(
                    active_until="March 7, 2028"
                )
                if sname == "I Was Killed For This Information":
                    CheckInScheduleConfig.objects.filter(user=request.user).update(
                        renewal_date="March 7, 2028"
                    )
                BillingRecord.objects.create(
                    user=request.user,
                    date="06/11/2026",
                    description=f"Renewal: {sname}",
                    amount="$29.99"
                )
                import uuid
                Payment.objects.create(
                    user=request.user,
                    amount=29.99,
                    transaction_id=f"TXN-{uuid.uuid4().hex[:12].upper()}",
                    status=Payment.PaymentStatus.COMPLETED
                )

        services = ActiveService.objects.filter(user=request.user)
        billing = BillingRecord.objects.filter(user=request.user)
        from datetime import datetime
        history = list(CheckInHistoryRecord.objects.filter(user=request.user))
        def parse_dt(record):
            try:
                return datetime.strptime(f"{record.date} {record.time}", "%m/%d/%Y %I:%M %p")
            except Exception:
                return datetime.min
        history.sort(key=parse_dt, reverse=True)

        return success_response(
            "Setup & Accounting updated successfully.",
            {
                "config": SetupAccountingConfigSerializer(config).data,
                "services": ActiveServiceSerializer(services, many=True).data,
                "billing": BillingRecordSerializer(billing, many=True).data,
                "history": CheckInHistoryRecordSerializer(history, many=True).data,
            },
            status.HTTP_200_OK
        )


class ContactMessageCreateView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = ContactMessageSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return success_response(
            "Message sent successfully. We will get back to you soon.",
            serializer.data,
            status.HTTP_201_CREATED,
        )

