import re
with open('c:/Rasel/keiredwards/backend-kil/apps/dashboard/templates/dashboard/custom_admin.html', 'r', encoding='utf-8') as f:
    content = f.read()

# Replace any occurrence of '<x-dc' inside Javascript strings
# We can just replace the specific string: "has no <x-dc> block"
content = content.replace('"has no <x-dc> block', '"has no <" + "x-dc> block')
# And the closing tag search: src.lastIndexOf("</x-dc>")
content = content.replace('src.lastIndexOf("</x-dc>")', 'src.lastIndexOf("</" + "x-dc>")')
# And the regex! /<x-dc(?:\s[^>]*)?>/
content = content.replace('/<x-dc(?:\\s[^>]*)?>/', 'new RegExp("<x-dc(?:\\\\s[^>]*)?>")')

with open('c:/Rasel/keiredwards/backend-kil/apps/dashboard/templates/dashboard/custom_admin.html', 'w', encoding='utf-8') as f:
    f.write(content)
print("Successfully patched custom_admin.html!")
