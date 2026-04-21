from celery import shared_task
from django.contrib.auth import get_user_model
from django.core.mail import send_mail
from django.utils import timezone
from rest_framework_simplejwt.token_blacklist.models import OutstandingToken

User = get_user_model()


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
