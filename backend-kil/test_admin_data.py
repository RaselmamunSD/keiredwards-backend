import os
import django

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")
django.setup()

from apps.dashboard.admin_views import _build_admin_data

try:
    data = _build_admin_data()
    print("Success")
except Exception as e:
    import traceback
    traceback.print_exc()
