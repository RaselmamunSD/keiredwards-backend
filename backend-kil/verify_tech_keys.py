import re

with open('c:/Rasel/keiredwards/backend-kil/apps/dashboard/templates/dashboard/custom_admin.html', 'r', encoding='utf-8') as f:
    content = f.read()

dc_start = content.find('<script type="text/x-dc"')
dc_end = content.find('</script>', dc_start) + len('</script>')
dc_script = content[dc_start:dc_end]

for table_key in ['servers', 'privateEmail', 'twoFactor', 'emailSending']:
    # Try to find default objects pushed to these tables
    # like addServer, addPrivateEmail
    idx = dc_script.find(f"add{table_key.capitalize()}")
    if idx == -1:
        # maybe uppercase
        idx = dc_script.find(f"add{table_key[:1].upper()}{table_key[1:]}")
        
    if idx != -1:
        print(f"--- {table_key} add function ---")
        print(dc_script[idx:idx+200])

