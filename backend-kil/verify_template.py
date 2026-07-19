import re

with open('c:/Rasel/keiredwards/backend-kil/apps/dashboard/templates/dashboard/custom_admin.html', 'r', encoding='utf-8') as f:
    content = f.read()

# Extract dc-script
dc_start = content.find('<script type="text/x-dc"')
dc_end = content.find('</script>', dc_start) + len('</script>')
dc_script = content[dc_start:dc_end]

# Search for statCards in dc-script
for pat in ['statCards', 'STAT_CARDS', 'checkinsToday', 'revenueToday', 'genStatCards', 'stat_cards']:
    matches = [(m.start(), m.group()) for m in re.finditer(pat, dc_script, re.IGNORECASE)]
    if matches:
        print(f"\n'{pat}' found {len(matches)} times in dc-script:")
        for pos, m in matches[:3]:
            snippet = dc_script[max(0,pos-50):pos+200]
            print(f"  ---\n  {repr(snippet[:250])}")

# Also look for where the stat card values come from
print("\n\n=== Searching for 'get statCards' or similar computed properties ===")
for pat in ['get statCards', 'statCards =', 'statCards:', 'statCards(']:
    idx = dc_script.find(pat)
    if idx != -1:
        print(f"\nFound '{pat}' at {idx}:")
        print(repr(dc_script[idx:idx+400]))
