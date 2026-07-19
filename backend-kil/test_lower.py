import os
import django
import json

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")
django.setup()

from apps.accounts.models import User

submitted_emails = ["admin@example.com"]
for u in User.objects.filter(is_staff=True):
    try:
        if u.email.lower() not in submitted_emails:
            print(f"Removing {u.username}")
    except Exception as e:
        print(f"Error on user {u.username}, email {u.email}: {e}")
