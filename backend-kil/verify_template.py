import re

with open('c:/Rasel/keiredwards/backend-kil/apps/dashboard/templates/dashboard/custom_admin.html', 'r', encoding='utf-8') as f:
    content = f.read()

dc_start = content.find('<script type="text/x-dc"')
dc_end = content.find('</script>', dc_start) + len('</script>')
dc_script = content[dc_start:dc_end]

# Find genUsers function
idx = dc_script.find('genUsers')
if idx != -1:
    print(f"genUsers found at {idx}")
    print("--- Context ---")
    print(dc_script[max(0,idx-200):idx+800])
else:
    print("genUsers NOT found")

# Also check for any USERS or users related arrays
for pat in ['const USERS', 'var USERS', 'SAMPLE_USERS', 'fakeUsers', 'sampleUsers', 'email.*example.com']:
    m = re.search(pat, dc_script, re.IGNORECASE)
    if m:
        print(f"\n'{pat}' found at {m.start()}:")
        print(dc_script[m.start():m.start()+300])
