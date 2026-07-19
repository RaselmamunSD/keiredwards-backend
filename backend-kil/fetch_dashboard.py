import os, django

# Use locmem cache for local testing instead of redis
os.environ["DJANGO_SETTINGS_MODULE"] = "config.settings"
os.environ["REDIS_URL"] = ""

django.setup()

# Override CACHES setting to use locmem dynamically
from django.conf import settings
settings.CACHES = {
    "default": {
        "BACKEND": "django.core.cache.backends.locmem.LocMemCache",
    }
}
settings.SESSION_ENGINE = "django.contrib.sessions.backends.db"
settings.ALLOWED_HOSTS = ["testserver", "127.0.0.1", "localhost"]

from django.test import Client
from apps.accounts.models import User

user = User.objects.filter(is_staff=True).first()
if not user:
    print("No staff user found!")
    exit(1)

client = Client()
client.force_login(user)

try:
    response = client.get('/admin/')
    print("STATUS:", response.status_code)
    with open('c:/Rasel/keiredwards/backend-kil/out.html', 'wb') as f:
        f.write(response.content)
    print("Saved out.html")
except Exception as e:
    import traceback
    traceback.print_exc()
