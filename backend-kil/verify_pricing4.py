import re

with open('c:/Rasel/keiredwards/backend-kil/apps/dashboard/templates/dashboard/custom_admin.html', 'r', encoding='utf-8') as f:
    content = f.read()

dc_start = content.find('<script type="text/x-dc"')
dc_end = content.find('</script>', dc_start) + len('</script>')
dc_script = content[dc_start:dc_end]

for func in ['savePricing', 'saveAddon', 'savePress']:
    idx = dc_script.find(func)
    if idx != -1:
        print(f"\n{func} found:")
        print(dc_script[idx:idx+400])

