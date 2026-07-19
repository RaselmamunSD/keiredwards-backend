import os
import django

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")
django.setup()

from apps.accounts.models import User
from django.contrib.auth.hashers import make_password

try:
    email = "newadmin@example.com"
    role = "Support"
    name = "New Admin"
    is_active = True
    
    User.objects.create(
        username=email,
        email=email,
        admin_role=role,
        is_superuser=(role == "Super Admin"),
        is_staff=True,
        is_active=is_active,
        first_name=name,
        password=make_password("TempPass123!")
    )
    print("Created successfully")
except Exception as e:
    import traceback
    traceback.print_exc()
