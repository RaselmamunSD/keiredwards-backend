import os
import django

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")
django.setup()

from apps.accounts.models import User

for u in User.objects.filter(is_superuser=True):
    if not u.is_staff:
        print(f"Restoring staff status for superuser: {u.username}")
        u.is_staff = True
        u.save()
        
# Also ensure Rasel is a superuser
rasel = User.objects.filter(username__icontains="rasel").first()
if rasel:
    rasel.is_staff = True
    rasel.is_superuser = True
    rasel.save()
    print(f"Restored Rasel: {rasel.username}")
