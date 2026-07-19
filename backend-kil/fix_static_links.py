import os, re

html_file = 'C:/Rasel/keiredwards/backend-kil/apps/dashboard/templates/dashboard/custom_admin.html'
with open(html_file, 'r', encoding='utf-8') as f:
    content = f.read()

# Make sure we load the static tag at the top of the file
if '{% load static %}' not in content:
    content = content.replace('<!DOCTYPE html>', '{% load static %}\n<!DOCTYPE html>')

static_dir = 'C:/Rasel/keiredwards/backend-kil/apps/dashboard/static/dashboard'
for filename in os.listdir(static_dir):
    if filename.startswith('vendor_'):
        # filename is like vendor_3c2ad152-4a9e-4111-9031-e3df8f3573a4.js
        # extract uuid
        uuid = filename.replace('vendor_', '').split('.')[0]
        ext = filename.split('.')[-1]
        
        # Replace occurrences of uuid with {% static 'dashboard/filename' %}
        # Only replace if it looks like a URL or src/href, to be safe?
        # Actually, the UUIDs are globally unique, so we can just string replace!
        content = content.replace(uuid, f"{{% static 'dashboard/{filename}' %}}")

with open(html_file, 'w', encoding='utf-8') as f:
    f.write(content)
print('Updated custom_admin.html with Django static tags!')
