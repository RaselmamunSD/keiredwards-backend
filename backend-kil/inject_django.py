import re
with open('c:/Rasel/keiredwards/backend-kil/apps/dashboard/Admin Dashboard - Standalone.html', 'r', encoding='utf-8') as f:
    content = f.read()

# Replace the static JS arrays with Django template variables
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

for pattern, replacement in replacements.items():
    # Use re.DOTALL to match across newlines if necessary, but these might be minified in one line or not.
    # The arrays might not be single lines. Let's find them properly.
    # Since they are defined in a JS block, they end with a semicolon or we can just match the block.
    # Actually, in the original file, we saw they were in one long string!
    # "const USERS = [\n  {\n    \"email\": ...\n  }\n];"
    content = re.sub(pattern, replacement, content, flags=re.DOTALL)

with open('c:/Rasel/keiredwards/backend-kil/apps/dashboard/templates/dashboard/custom_admin.html', 'w', encoding='utf-8') as f:
    f.write(content)
print("Updated custom_admin.html from original Standalone file.")
