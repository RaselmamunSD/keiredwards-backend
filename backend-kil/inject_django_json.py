import re, json

with open('c:/Rasel/keiredwards/backend-kil/apps/dashboard/Admin Dashboard - Standalone.html', 'r', encoding='utf-8') as f:
    content = f.read()

match = re.search(r'<script type="__bundler/template">(.*?)</script>', content, re.DOTALL)
if match:
    template_str = match.group(1).strip()
    try:
        decoded = json.loads(template_str)
        # decoded is the raw HTML of the unbundled template
        replacements = {
            r'const USERS = \[.*?\];': 'const USERS = {{ users_json|safe }};',
            r'const ACCOUNTING_ORDERS = \[.*?\];': 'const ACCOUNTING_ORDERS = {{ accounting_orders_json|safe }};',
            r'const STAT_CARDS = \[.*?\];': 'const STAT_CARDS = {{ stat_cards_json|safe }};',
            r'const EXPIRY_CARDS = \[.*?\];': 'const EXPIRY_CARDS = {{ expiry_cards_json|safe }};',
            r'const PRICING = \[.*?\];': 'const PRICING = {{ pricing_json|safe }};',
            r'const ADDON = \[.*?\];': 'const ADDON = {{ addon_json|safe }};',
            r'const PRESS = \[.*?\];': 'const PRESS = {{ press_json|safe }};',
            r'const OUTBOUND_MESSAGES = \[.*?\];': 'const OUTBOUND_MESSAGES = {{ outbound_messages_json|safe }};',
            r'const SERVERS = \[.*?\];': 'const SERVERS = {{ servers_json|safe }};',
            r'const PRIVATE_EMAIL = \[.*?\];': 'const PRIVATE_EMAIL = {{ private_email_json|safe }};',
            r'const TWO_FACTOR = \[.*?\];': 'const TWO_FACTOR = {{ two_factor_json|safe }};',
            r'const ADMIN_USERS = \[.*?\];': 'const ADMIN_USERS = {{ admin_users_json|safe }};',
            r'const EMAIL_SENDING = \[.*?\];': 'const EMAIL_SENDING = {{ email_sending_json|safe }};',
            r'const DASHBOARD_DETAILS = \{.*?\};': 'const DASHBOARD_DETAILS = {{ dashboard_details_json|safe }};',
        }
        for pattern, repl in replacements.items():
            decoded = re.sub(pattern, repl, decoded, flags=re.DOTALL)
            
        with open('c:/Rasel/keiredwards/backend-kil/apps/dashboard/templates/dashboard/custom_admin.html', 'w', encoding='utf-8') as out:
            # We must output the complete original file, but with the modified template string!
            new_template_str = json.dumps(decoded)
            new_content = content[:match.start(1)] + new_template_str + content[match.end(1):]
            out.write(new_content)
        print("Successfully updated custom_admin.html with the original bundled content and injected Django tags!")
    except Exception as e:
        print('Error:', e)
