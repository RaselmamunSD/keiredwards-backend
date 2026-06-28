import os
import uuid
import base64
import logging

from celery import shared_task
from django.contrib.auth import get_user_model
from django.core.mail import send_mail
from django.utils import timezone
from django.conf import settings
from rest_framework_simplejwt.token_blacklist.models import OutstandingToken

User = get_user_model()
logger = logging.getLogger(__name__)


@shared_task
def send_welcome_email(user_id):
    user = User.objects.filter(id=user_id).first()
    if not user:
        return "User not found."

    send_mail(
        subject="Welcome to Fontaine Project",
        message=f"Hi {user.first_name or user.username}, welcome to Fontaine!",
        from_email="no-reply@fontaine.local",
        recipient_list=[user.email],
        fail_silently=False,
    )
    return "Welcome email sent."


@shared_task
def send_notification(user_id, message):
    user = User.objects.filter(id=user_id).first()
    if not user:
        return "User not found."
    return f"Notification sent to {user.username}: {message}"


@shared_task
def generate_report(report_id):
    return f"Report {report_id} generated successfully."


@shared_task
def process_image(image_path):
    return f"Image processed successfully: {image_path}"


@shared_task
def cleanup_expired_tokens():
    deleted, _ = OutstandingToken.objects.filter(expires_at__lt=timezone.now()).delete()
    return f"Expired outstanding tokens deleted: {deleted}"


@shared_task
def send_checkin_magic_link_email(checkin_email, magic_link, default_from_email):
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
        from_email=default_from_email,
        recipient_list=[checkin_email],
        fail_silently=False,
    )
    return f"Magic link sent to {checkin_email}."


@shared_task
def send_password_reset_email(email, username, reset_url, default_from_email):
    send_mail(
        subject="Password Reset Request",
        message=f"Use this link to reset your password for user account '{username}': {reset_url}",
        from_email=default_from_email,
        recipient_list=[email],
        fail_silently=False,
    )
    return f"Password reset email sent to {email}."


@shared_task(bind=True, max_retries=3, default_retry_delay=120)
def process_vault_file_upload(self, vault_file_id):
    """
    Background task: reads file from staging → encrypts → uploads to S3 → updates DB.
    Runs in Celery worker so the user can close their browser after the initial upload.
    """
    from apps.dashboard.models import UserVaultFile
    from apps.dashboard.s3_helper import upload_file_stream

    try:
        vault_file = UserVaultFile.objects.get(id=vault_file_id)
    except UserVaultFile.DoesNotExist:
        logger.error(f"VaultFile {vault_file_id} not found.")
        return f"VaultFile {vault_file_id} not found."

    if vault_file.status == "completed":
        return f"VaultFile {vault_file_id} already completed."

    staging_path = vault_file.staging_path
    if not staging_path or not os.path.exists(staging_path):
        vault_file.status = "failed"
        vault_file.error_message = "Staging file not found on disk."
        vault_file.save(update_fields=["status", "error_message"])
        return f"Staging file missing for VaultFile {vault_file_id}."

    try:
        # Mark as processing
        vault_file.status = "processing"
        vault_file.save(update_fields=["status"])

        file_size_bytes = os.path.getsize(staging_path)

        # Generate AES-256-CTR key and IV
        key_bytes = os.urandom(32)
        iv_bytes = os.urandom(16)
        key_b64 = base64.b64encode(key_bytes).decode("utf-8")
        iv_b64 = base64.b64encode(iv_bytes).decode("utf-8")

        # Determine S3 bucket based on file size
        if file_size_bytes <= 10 * 1024 * 1024:          # ≤ 10 MB
            bucket = 1
        elif file_size_bytes <= 100 * 1024 * 1024:       # ≤ 100 MB
            bucket = 2
        else:                                             # > 100 MB
            bucket = 4 if 4 in settings.IDRIVE_E2_BUCKETS else 3

        unique_name = f"{uuid.uuid4().hex}.enc"

        # Open staging file and stream-encrypt + upload to S3
        with open(staging_path, "rb") as f:
            is_cloud, path_or_key = upload_file_stream(f, bucket, unique_name, key_bytes, iv_bytes)

        # Update database record
        vault_file.encrypted_file_path = path_or_key
        vault_file.encryption_key = key_b64
        vault_file.encryption_iv = iv_b64
        vault_file.storage_bucket = bucket
        vault_file.status = "completed"
        vault_file.error_message = None
        vault_file.save(update_fields=[
            "encrypted_file_path", "encryption_key", "encryption_iv",
            "storage_bucket", "status", "error_message",
        ])

        # Clean up staging file
        try:
            os.remove(staging_path)
            vault_file.staging_path = None
            vault_file.save(update_fields=["staging_path"])
        except OSError:
            pass

        logger.info(f"VaultFile {vault_file_id} ({vault_file.file_name}) processed successfully.")
        return f"VaultFile {vault_file_id} processed successfully."

    except Exception as exc:
        logger.error(f"VaultFile {vault_file_id} processing failed: {exc}")
        vault_file.status = "failed"
        vault_file.error_message = str(exc)[:500]
        vault_file.save(update_fields=["status", "error_message"])
        # Retry up to 3 times
        raise self.retry(exc=exc)
