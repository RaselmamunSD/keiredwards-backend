import re

with open('c:/Rasel/keiredwards/backend-kil/apps/dashboard/templates/dashboard/custom_admin.html', 'r', encoding='utf-8') as f:
    content = f.read()

dc_start = content.find('<script type="text/x-dc"')
dc_end = content.find('</script>', dc_start) + len('</script>')
dc_script = content[dc_start:dc_end]

# Extract all function declarations inside Component class
methods = re.findall(r'^\s*([a-zA-Z0-9_]+)\s*(?:=\s*(?:async\s*)?\([^)]*\)\s*=>|\([^)]*\)\s*\{)', dc_script, re.MULTILINE)
print("Component methods:")
for m in methods:
    print(m)

# Let's search for "Save" or "Cancel" in the x-dc HTML template
xdc_start = content.find('<x-dc>')
xdc_end = content.find('</x-dc>', xdc_start)
xdc_html = content[xdc_start:xdc_end]

matches = re.finditer(r'<button[^>]*>.*?Save.*?</button>', xdc_html, re.IGNORECASE)
for m in matches:
    print("\nFound Save button:")
    print(m.group(0))

