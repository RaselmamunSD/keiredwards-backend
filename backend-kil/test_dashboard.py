import os
import django

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")
django.setup()

from django.test import RequestFactory
from apps.dashboard.admin_views import CustomAdminDashboardView
from apps.accounts.models import User

# Get a staff user
user = User.objects.filter(is_staff=True).first()
if not user:
    print("No staff user found.")
    exit(1)

print(f"Testing view as user: {user.email}")

request = RequestFactory().get('/admin/')
request.user = user

view = CustomAdminDashboardView.as_view()

try:
    response = view(request)
    print("STATUS:", response.status_code)
    if hasattr(response, 'render'):
        response.render()
    print("RENDER SUCCESS")
except Exception as e:
    import traceback
    traceback.print_exc()
