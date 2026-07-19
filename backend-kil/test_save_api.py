import os
import django
import json

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "config.settings")
django.setup()

from django.test import RequestFactory
from apps.dashboard.admin_views import AdminSaveDataApiView
from apps.accounts.models import User

factory = RequestFactory()

# Mock user for authentication
user = User.objects.filter(is_superuser=True).first()
if not user:
    user = User(username="testadmin", is_superuser=True, is_staff=True, is_active=True)
    user.save()

payload = {
    "key": "adminUsers",
    "data": [
        {"name": "admin_test", "email": "admin@example.com", "role": "Admin", "lastLogin": "07/18/2026 13:02", "active": True},
        {"name": "IwasKilled", "email": "storage@iwaskilledforthisinformation.com", "role": "Super Admin", "lastLogin": "07/19/2026 13:07", "active": True},
        {"name": "Rasel", "email": "rasel.mamun314@gmail.com", "role": "Super Admin", "lastLogin": "Never", "active": True},
        {"name": "New Guy", "email": "newguy@example.com", "role": "Support", "lastLogin": "Never", "active": True}
    ]
}

request = factory.post('/admin/data/save/', json.dumps(payload), content_type='application/json')
request.user = user

view = AdminSaveDataApiView.as_view()
response = view(request)

print("Status:", response.status_code)
if response.status_code != 200:
    print("Content:", response.content)
