from django.core.mail import send_mail
from django.conf import settings

try:
    send_mail(
        subject="Test Email from Django",
        message="This is a test email to verify SMTP configuration.",
        from_email=settings.DEFAULT_FROM_EMAIL,
        recipient_list=[settings.DEFAULT_FROM_EMAIL],  # Sending to itself
        fail_silently=False,
    )
    print("SUCCESS: Test email sent successfully!")
except Exception as e:
    print(f"ERROR: Failed to send email. Details: {str(e)}")
