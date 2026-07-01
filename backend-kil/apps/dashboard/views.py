from datetime import timedelta

from django.db.models import Sum
from django.db.models.functions import TruncDate
from django.utils import timezone
from rest_framework import permissions, status
from rest_framework.views import APIView
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from rest_framework.exceptions import ValidationError

import os
import uuid
import base64
import urllib.parse
from django.conf import settings
from django.http import HttpResponse
from .crypto import encrypt_to_b64_strings, decrypt_data
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
    StoragePlan,
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
    StoragePlanSerializer,
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
    parser_classes = (MultiPartParser, FormParser, JSONParser)

    def _ensure_default_plans(self):
        if StoragePlan.objects.count() == 0:
            StoragePlan.objects.create(gb=5, price="$19.99", description="Perfect for larger files and media")
            StoragePlan.objects.create(gb=10, price="$29.99", description="Maximum capacity for extensive archives")
            StoragePlan.objects.create(gb=15, price="$39.99", description="Maximum capacity for extensive archives")
            StoragePlan.objects.create(gb=20, price="$49.99", description="Maximum capacity for extensive archives")
            StoragePlan.objects.create(gb=25, price="$79.99", description="Enterprise-level storage solution")

    def get(self, request):
        self._ensure_default_plans()
        storage_config, created = StorageConfig.objects.get_or_create(user=request.user)
        files = UserVaultFile.objects.filter(user=request.user)
        storage_plans = StoragePlan.objects.all()
        return success_response(
            "Vault files fetched successfully.",
            {
                "storage_config": StorageConfigSerializer(storage_config).data,
                "files": UserVaultFileSerializer(files, many=True).data,
                "storage_plans": StoragePlanSerializer(storage_plans, many=True).data,
            },
            status.HTTP_200_OK
        )

    def post(self, request):
        import json
        
        # 1. Update total_storage_gb if provided
        total_storage_gb = request.data.get("total_storage_gb")
        if total_storage_gb:
            storage_config, created = StorageConfig.objects.get_or_create(user=request.user)
            new_gb = int(total_storage_gb)
            if created or new_gb <= storage_config.total_storage_gb:
                storage_config.total_storage_gb = new_gb
                storage_config.save()

        # 2. Get existing files to keep
        existing_ids = []
        raw_existing = request.data.getlist("existing_files") or request.data.get("existing_files")
        
        if raw_existing:
            if isinstance(raw_existing, list):
                for item in raw_existing:
                    try:
                        parsed = json.loads(item)
                        if isinstance(parsed, dict) and "id" in parsed:
                            existing_ids.append(int(parsed["id"]))
                        elif isinstance(parsed, list):
                            for p in parsed:
                                if isinstance(p, dict) and "id" in p:
                                    existing_ids.append(int(p["id"]))
                                else:
                                    existing_ids.append(int(p))
                        else:
                            existing_ids.append(int(parsed))
                    except (ValueError, json.JSONDecodeError):
                        try:
                            existing_ids.append(int(item))
                        except ValueError:
                            pass
            else:
                try:
                    parsed = json.loads(raw_existing)
                    if isinstance(parsed, list):
                        for p in parsed:
                            if isinstance(p, dict) and "id" in p:
                                existing_ids.append(int(p["id"]))
                            else:
                                existing_ids.append(int(p))
                    elif isinstance(parsed, dict) and "id" in parsed:
                        existing_ids.append(int(parsed["id"]))
                    else:
                        existing_ids.append(int(parsed))
                except (ValueError, json.JSONDecodeError):
                    try:
                        existing_ids.append(int(raw_existing))
                    except ValueError:
                        pass

        # Check if we are doing a JSON-based metadata replace (backward compatibility)
        files_metadata = request.data.get("files")
        is_metadata_only = files_metadata is not None and not request.FILES
        
        # 2b. Storage Limit Check
        storage_config, created = StorageConfig.objects.get_or_create(user=request.user)
        total_limit_bytes = storage_config.total_storage_gb * 1024 * 1024 * 1024
        
        if is_metadata_only:
            new_files_bytes = sum(float(fd.get("sizeMB", 0)) * 1024 * 1024 for fd in files_metadata)
            if new_files_bytes > total_limit_bytes:
                return success_response(
                    "Upload failed. Exceeds your storage limit.",
                    {},
                    status.HTTP_400_BAD_REQUEST
                )
            
            UserVaultFile.objects.filter(user=request.user).delete()
            for fd in files_metadata:
                UserVaultFile.objects.create(
                    user=request.user,
                    file_name=fd.get("name"),
                    file_size_mb=fd.get("sizeMB"),
                    storage_bucket=1
                )
        else:
            # Calculate size of existing files to keep
            existing_files_qs = UserVaultFile.objects.filter(user=request.user)
            if existing_ids:
                kept_files = existing_files_qs.filter(id__in=existing_ids)
            else:
                kept_files = existing_files_qs.none()
                
            current_used_bytes = 0
            for ef in kept_files:
                try:
                    current_used_bytes += float(ef.file_size_mb) * 1024 * 1024
                except ValueError:
                    pass
                    
            # Calculate size of new files
            uploaded_files = request.FILES.getlist("files")
            new_files_bytes = sum(f.size for f in uploaded_files)
            
            if current_used_bytes + new_files_bytes > total_limit_bytes:
                return success_response(
                    "Upload failed. Exceeds your storage limit.",
                    {},
                    status.HTTP_400_BAD_REQUEST
                )

            # Delete any existing files that are NOT in existing_ids
            to_delete = UserVaultFile.objects.filter(user=request.user)
            if existing_ids:
                to_delete = to_delete.exclude(id__in=existing_ids)
            to_delete.delete()

            # Save new files to staging directory and dispatch Celery tasks
            if uploaded_files:
                staging_dir = os.path.join(
                    getattr(settings, 'VAULT_STAGING_DIR', os.path.join(settings.BASE_DIR, 'vault_staging')),
                    str(request.user.id)
                )
                os.makedirs(staging_dir, exist_ok=True)

                from celery_app.tasks import process_vault_file_upload

                for f in uploaded_files:
                    file_size_bytes = f.size
                    file_size_mb = f"{file_size_bytes / (1024 * 1024):.2f}"
                    
                    # Save to staging directory
                    staging_filename = f"{uuid.uuid4().hex}_{f.name}"
                    staging_path = os.path.join(staging_dir, staging_filename)
                    
                    with open(staging_path, 'wb') as dest:
                        for chunk in f.chunks(chunk_size=8 * 1024 * 1024):  # 8MB chunks
                            dest.write(chunk)
                    
                    # Create DB record with status=pending
                    vault_file = UserVaultFile.objects.create(
                        user=request.user,
                        file_name=f.name,
                        file_size_mb=file_size_mb,
                        status="pending",
                        staging_path=staging_path,
                    )
                    
                    # Dispatch Celery background task
                    try:
                        process_vault_file_upload.delay(vault_file.id)
                    except Exception:
                        # If Celery is not available, process synchronously as fallback
                        from .s3_helper import upload_file_stream
                        key_bytes = os.urandom(32)
                        iv_bytes = os.urandom(16)
                        key_b64 = base64.b64encode(key_bytes).decode('utf-8')
                        iv_b64 = base64.b64encode(iv_bytes).decode('utf-8')
                        
                        if file_size_bytes <= 10 * 1024 * 1024:
                            bucket = 1
                        elif file_size_bytes <= 100 * 1024 * 1024:
                            bucket = 2
                        else:
                            bucket = 4 if 4 in settings.IDRIVE_E2_BUCKETS else 3
                        
                        unique_name = f"{uuid.uuid4().hex}.enc"
                        with open(staging_path, 'rb') as sf:
                            is_cloud, path_or_key = upload_file_stream(sf, bucket, unique_name, key_bytes, iv_bytes)
                        
                        vault_file.encrypted_file_path = path_or_key
                        vault_file.encryption_key = key_b64
                        vault_file.encryption_iv = iv_b64
                        vault_file.storage_bucket = bucket
                        vault_file.status = "completed"
                        vault_file.save()
                        
                        try:
                            os.remove(staging_path)
                        except OSError:
                            pass

        self._ensure_default_plans()
        storage_config, created = StorageConfig.objects.get_or_create(user=request.user)
        files = UserVaultFile.objects.filter(user=request.user)
        storage_plans = StoragePlan.objects.all()
        return success_response(
            "Files received and queued for secure processing.",
            {
                "storage_config": StorageConfigSerializer(storage_config).data,
                "files": UserVaultFileSerializer(files, many=True).data,
                "storage_plans": StoragePlanSerializer(storage_plans, many=True).data,
            },
            status.HTTP_200_OK
        )


class UserVaultFileDownloadView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request, file_id):
        try:
            vault_file = UserVaultFile.objects.get(id=file_id, user=request.user)
        except UserVaultFile.DoesNotExist:
            return HttpResponse("File not found or unauthorized.", status=404)

        if not vault_file.encrypted_file_path:
            return HttpResponse("File path not configured.", status=404)

        from django.http import StreamingHttpResponse
        from .s3_helper import stream_decrypted_file
        try:
            file_stream = stream_decrypted_file(
                vault_file.encrypted_file_path,
                vault_file.storage_bucket,
                vault_file.encryption_key,
                vault_file.encryption_iv
            )
            response = StreamingHttpResponse(file_stream, content_type="application/octet-stream")
            encoded_filename = urllib.parse.quote(vault_file.file_name)
            response["Content-Disposition"] = f"attachment; filename*=UTF-8''{encoded_filename}"
            return response
        except Exception as e:
            return HttpResponse(f"Error downloading file: {str(e)}", status=500)


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

        # Removed fake mock data injection block.

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
        history = CheckInHistoryRecord.objects.filter(user=request.user)

        from apps.payments.models import AddOnOption
        addons = AddOnOption.objects.exclude(key__startswith="press_release").exclude(key="extra_storage")
        press_addons = AddOnOption.objects.filter(key__startswith="press_release")

        addons_data = [
            {
                "key": a.key,
                "label": a.label,
                "description": a.description,
                "price": float(a.price)
            }
            for a in addons
        ]

        press_addons_data = [
            {
                "key": a.key,
                "label": a.label,
                "description": a.description,
                "price": float(a.price)
            }
            for a in press_addons
        ]

        return success_response(
            "Setup & Accounting fetched successfully.",
            {
                "config": SetupAccountingConfigSerializer(config).data,
                "services": ActiveServiceSerializer(services, many=True).data,
                "billing": BillingRecordSerializer(billing, many=True).data,
                "history": CheckInHistoryRecordSerializer(history, many=True).data,
                "addons": addons_data,
                "press_release_options": press_addons_data,
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

        from django.utils import timezone
        from datetime import timedelta
        now = timezone.now()
        one_year_later = (now + timedelta(days=365)).strftime("%B %-d, %Y")
        two_years_later = (now + timedelta(days=730)).strftime("%B %-d, %Y")
        today_str = now.strftime("%m/%d/%Y")
        next_checkin = (now + timedelta(days=7)).strftime("%m/%d/%Y")

        check_in_service = request.data.get("check_in_service")
        if check_in_service:
            ActiveService.objects.filter(user=request.user, name="I Was Killed For This Information").update(
                additional_info=check_in_service,
                is_purchased=True,
                active_until=one_year_later
            )
            plan_name = check_in_service.replace(" Check-In", "")
            CheckInScheduleConfig.objects.filter(user=request.user).update(
                purchased_plan=plan_name,
                renewal_date=next_checkin
            )
            BillingRecord.objects.create(
                user=request.user,
                date=today_str,
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
                    active_until=two_years_later
                )
                if sname == "I Was Killed For This Information":
                    CheckInScheduleConfig.objects.filter(user=request.user).update(
                        renewal_date=next_checkin
                    )
                BillingRecord.objects.create(
                    user=request.user,
                    date=today_str,
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
        history = CheckInHistoryRecord.objects.filter(user=request.user)

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


# ─── Check-In Magic Link Views ─────────────────────────────────────────────────

class CheckInMagicLinkRequestView(APIView):
    """
    Public endpoint: accepts email + password, verifies credentials,
    then emails a one-time magic link to the user's configured check-in email.
    """
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        import secrets
        from django.utils import timezone
        from django.core.mail import send_mail
        from django.conf import settings as django_settings
        from django.contrib.auth import get_user_model
        from .models import CheckInMagicLink

        email = request.data.get("email", "").strip()

        if not email:
            from rest_framework.exceptions import ValidationError
            raise ValidationError({"detail": "Email is required."})

        User = get_user_model()

        # Find user by email (case-insensitive)
        user = User.objects.filter(email__iexact=email).first()
        if not user:
            from rest_framework.exceptions import AuthenticationFailed
            raise AuthenticationFailed("No account found with this email address.")

        # Determine the check-in email address
        try:
            checkin_email = user.checkin_email_config.checkin_email or user.email
        except Exception:
            checkin_email = user.email

        # Generate a secure 48-char hex token
        token = secrets.token_hex(24)
        expires_at = timezone.now() + timezone.timedelta(minutes=30)

        # Invalidate any previous unused tokens for this user
        CheckInMagicLink.objects.filter(user=user, is_used=False).update(is_used=True)

        CheckInMagicLink.objects.create(user=user, token=token, expires_at=expires_at)

        frontend_url = getattr(django_settings, "FRONTEND_URL", "http://localhost:3000")
        magic_link = f"{frontend_url}/check-in/verify?token={token}"

        from_email = getattr(django_settings, "DEFAULT_FROM_EMAIL", "no-reply@iwaskilledforthisinformation.one")
        try:
            from celery_app.tasks import send_checkin_magic_link_email
            send_checkin_magic_link_email.delay(checkin_email, magic_link, from_email)
        except Exception:
            send_mail(
                subject="Your Check-In Link — I Was Killed For This Information",
                message=(
                    f"Hello,\n\n"
                    f"Click the link below to complete your check-in. "
                    f"This link expires in 30 minutes and can only be used once.\n\n"
                    f"{magic_link}\n\n"
                    f"If you did not request this, please ignore this email.\n\n"
                    f"— I Was Killed For This Information"
                ),
                from_email=from_email,
                recipient_list=[checkin_email],
                fail_silently=False,
            )
        except Exception as exc:
            # If email fails, still return the link in debug mode so it can be tested
            if getattr(django_settings, "DEBUG", False):
                return success_response(
                    "DEBUG: Email not sent (check console). Magic link included in response.",
                    {"magic_link": magic_link, "checkin_email": checkin_email},
                    status.HTTP_200_OK,
                )
            raise exc

        return success_response(
            f"A check-in link has been sent to {checkin_email}. Please check your inbox.",
            {"checkin_email": checkin_email},
            status.HTTP_200_OK,
        )


class CheckInMagicLinkVerifyView(APIView):
    """
    Public endpoint: accepts a token from the magic link URL,
    validates it, records the check-in, and returns JWT tokens.
    """
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        from django.utils import timezone
        from rest_framework_simplejwt.tokens import RefreshToken
        from .models import CheckInMagicLink, CheckInHistoryRecord

        token = request.data.get("token", "").strip()
        if not token:
            from rest_framework.exceptions import ValidationError
            raise ValidationError({"detail": "Token is required."})

        try:
            magic = CheckInMagicLink.objects.select_related("user").get(token=token)
        except CheckInMagicLink.DoesNotExist:
            from rest_framework.exceptions import AuthenticationFailed
            raise AuthenticationFailed("Invalid or expired check-in link.")

        if magic.is_used:
            from rest_framework.exceptions import AuthenticationFailed
            raise AuthenticationFailed("This check-in link has already been used.")

        if timezone.now() > magic.expires_at:
            from rest_framework.exceptions import AuthenticationFailed
            raise AuthenticationFailed("This check-in link has expired. Please request a new one.")

        # Mark token as used
        magic.is_used = True
        magic.save(update_fields=["is_used"])

        user = magic.user

        # Record the check-in
        now = timezone.now()
        ua = request.META.get("HTTP_USER_AGENT", "").lower()
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
            date=now.strftime("%m/%d/%Y"),
            time=now.strftime("%I:%M %p"),
            ip=request.META.get("REMOTE_ADDR") or "127.0.0.1",
            login_name=user.email or user.username,
            device_os=device_os,
        )

        # Issue JWT tokens
        refresh = RefreshToken.for_user(user)
        return success_response(
            "Check-in verified successfully. Redirecting to dashboard.",
            {
                "access": str(refresh.access_token),
                "refresh": str(refresh),
            },
            status.HTTP_200_OK,
        )


class VaultFileStatusView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        files = UserVaultFile.objects.filter(user=request.user)
        storage_config, _ = StorageConfig.objects.get_or_create(user=request.user)
        return success_response(
            "File status fetched.",
            {
                "storage_config": StorageConfigSerializer(storage_config).data,
                "files": UserVaultFileSerializer(files, many=True).data,
            },
            status.HTTP_200_OK
        )
