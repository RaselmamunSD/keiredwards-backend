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
