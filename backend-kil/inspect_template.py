import json, base64, zlib, re

with open('c:/Rasel/keiredwards/backend-kil/apps/dashboard/Admin Dashboard - Standalone.html', 'r', encoding='utf-8') as f:
    content = f.read()

match_tpl = re.search(r'<script type="__bundler/template">(.*?)</script>', content, re.DOTALL)
template_html = json.loads(match_tpl.group(1).strip())

# Print the script at 82041
print(template_html[82000:82300])
