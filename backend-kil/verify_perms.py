import re

with open('c:/Rasel/keiredwards/backend-kil/apps/dashboard/templates/dashboard/custom_admin.html', 'r', encoding='utf-8') as f:
    content = f.read()

dc_start = content.find('<script type="text/x-dc"')
dc_end = content.find('</script>', dc_start) + len('</script>')
dc_script = content[dc_start:dc_end]

idx = dc_script.find('DEFAULT_PERMISSIONS')
if idx != -1:
    print(dc_script[idx:idx+800])

