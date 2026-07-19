import re

with open('c:/Rasel/keiredwards/backend-kil/apps/dashboard/templates/dashboard/custom_admin.html', 'r', encoding='utf-8') as f:
    content = f.read()

dc_start = content.find('<script type="text/x-dc"')
dc_end = content.find('</script>', dc_start) + len('</script>')
dc_script = content[dc_start:dc_end]

# Find save handlers or pricing logic
for pat in ['save', 'pricing', 'addon', 'press']:
    matches = [(m.start(), m.group()) for m in re.finditer(pat, dc_script, re.IGNORECASE)]
    if matches:
        print(f"\n'{pat}' found {len(matches)} times in dc-script:")
        # Just show a few interesting ones
        for pos, m in matches[:5]:
            snippet = dc_script[max(0,pos-100):pos+300]
            print(f"  ---\n  {repr(snippet)}")
