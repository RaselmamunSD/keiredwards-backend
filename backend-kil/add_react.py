import os

html_file = 'C:/Rasel/keiredwards/backend-kil/apps/dashboard/templates/dashboard/custom_admin.html'
with open(html_file, 'r', encoding='utf-8') as f:
    content = f.read()

# Add React scripts before DCLogic script
react_scripts = """<script src="https://unpkg.com/react@18.3.1/umd/react.production.min.js"></script>
<script src="https://unpkg.com/react-dom@18.3.1/umd/react-dom.production.min.js"></script>
"""

# Find the dclogic script tag
dc_script_str = "<script src=\"{% static 'dashboard/vendor_3c2ad152-4a9e-4111-9031-e3df8f3573a4.js' %}\"></script>"

if react_scripts not in content:
    content = content.replace(dc_script_str, react_scripts + dc_script_str)
    with open(html_file, 'w', encoding='utf-8') as f:
        f.write(content)
    print("Added React scripts!")
else:
    print("Already added.")
