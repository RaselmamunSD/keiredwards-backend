import re
with open('c:/Rasel/keiredwards/backend-kil/apps/dashboard/templates/dashboard/custom_admin.html', 'r', encoding='utf-8') as f:
    content = f.read()

matches = re.finditer(r'document\.querySelector\(.*?\)', content)
for m in matches:
    idx = m.start()
    print(content[idx-100:idx+200])
