"""
Properly builds a Django-compatible admin template from the standalone bundler HTML.

Structure of the source file:
  <head>
    <script src="UUID_runtime"></script>  -- the DC runtime engine (React + framework)
  </head>
  <body>
    <x-dc>
      <helmet>  -- CSS, font-faces, SVG defs
      </helmet>
      <-- HTML component template -->
      <script type="text/x-dc" data-dc-script>  -- ALL data vars + logic
        const DASHBOARD_DETAILS = {...};
        const ACCOUNTING_ORDERS = [...];
        class Component extends DCLogic { ... }
      </script>
    </x-dc>
  </body>

Strategy:
  1. Extract x-dc content
  2. Inline font/image assets as base64 data URIs in x-dc  
  3. Wrap the x-dc data script in {% verbatim %}...{% endverbatim %}
  4. Replace data vars in the verbatim-wrapped script with Django template vars
     (BEFORE wrapping in verbatim)
  5. Put runtime JS AFTER the <x-dc> section so DCLogic finds the DOM x-dc tag
"""
import json, base64, zlib, re

SOURCE = 'c:/Rasel/keiredwards/backend-kil/apps/dashboard/Admin Dashboard - Standalone.html'
OUTPUT = 'c:/Rasel/keiredwards/backend-kil/apps/dashboard/templates/dashboard/custom_admin.html'

with open(SOURCE, 'r', encoding='utf-8') as f:
    content = f.read()

# ── Extract bundler sections ──────────────────────────────────────────────────
match_tpl = re.search(r'<script type="__bundler/template">(.*?)</script>', content, re.DOTALL)
template_html = json.loads(match_tpl.group(1).strip())

match_mfst = re.search(r'<script type="__bundler/manifest">(.*?)</script>', content, re.DOTALL)
manifest = json.loads(match_mfst.group(1))

match_ext = re.search(r'<script type="__bundler/ext_resources">(.*?)</script>', content, re.DOTALL)
ext_resources = json.loads(match_ext.group(1)) if match_ext else []

# ── Decode all manifest assets ─────────────────────────────────────────────────
decoded_assets = {}
for uuid, entry in manifest.items():
    mime = entry.get('mime', '')
    data = entry.get('data', '')
    compressed = entry.get('compressed', False)
    raw = base64.b64decode(data)
    if compressed:
        raw = zlib.decompress(raw, zlib.MAX_WBITS | 16)
    decoded_assets[uuid] = {'mime': mime, 'raw': raw}

# ── Build external script tags (React etc.) ────────────────────────────────────
ext_script_tags = ''
for ext in ext_resources:
    url = ext.get('id', '')
    ext_script_tags += f'<script src="{url}"></script>\n'

# ── Find runtime JS UUID (in <head> before x-dc) ──────────────────────────────
idx_xdc = template_html.find('<x-dc')
pre_xdc = template_html[:idx_xdc]
runtime_js_uuid = None
for uuid in decoded_assets:
    if uuid in pre_xdc and 'javascript' in decoded_assets[uuid]['mime']:
        runtime_js_uuid = uuid
        break
print(f"Runtime JS UUID: {runtime_js_uuid[:8] if runtime_js_uuid else 'NONE'}")

# ── Get x-dc section ──────────────────────────────────────────────────────────
idx_end = template_html.rfind('</x-dc>') + len('</x-dc>')
xdc_section = template_html[idx_xdc:idx_end]

# The dc-script tag (with data + logic) is AFTER the </x-dc> closing tag
dc_script_match = re.search(r'(<script type="text/x-dc"[^>]*data-dc-script[^>]*>)(.*?)(</script>)', template_html[idx_end:], re.DOTALL)
if not dc_script_match:
    print("ERROR: Could not find the data-dc-script tag after </x-dc>!")
    exit(1)

dc_script_open = dc_script_match.group(1)
dc_script_body = dc_script_match.group(2)
dc_script_close = dc_script_match.group(3)
print(f"Found data-dc-script after </x-dc>, length: {len(dc_script_body)}")

# ── Inline font and image assets in x-dc ───────────────────────────────────────
for uuid, asset in decoded_assets.items():
    mime = asset['mime']
    if 'font' in mime or 'image' in mime:
        data_uri = f"data:{mime};base64,{base64.b64encode(asset['raw']).decode()}"
        xdc_section = xdc_section.replace(uuid, data_uri)
        print(f"Inlined {mime} asset {uuid[:8]}")



# ── Replace data variable declarations with Django template vars ──────────────
# NOTE: The dc-script uses camelCase (statCards, expiryCards) not UPPER_CASE.
# We replace both the old-style array/object declarations AND the inline function bodies.
data_replacements = [
    # ── genUsers() function — replaces the entire fake user generator ─────────
    # The dc-script has: function genUsers() { ... fake users with @example.com ... }
    # We replace it with a function that returns real users from Django context.
    (
        r'function genUsers\(\)\s*\{.*?\}(?=\s*\nfunction clone)',
        r'function genUsers() { return {{ users_json|safe }}; }'
    ),
    # NAMES array
    (r'const NAMES\s*=\s*\[.*?\];', 'const NAMES = {{ names_json|safe }};'),
    # Accounting orders
    (r'const ACCOUNTING_ORDERS\s*=\s*\[.*?\];', 'const ACCOUNTING_ORDERS = {{ accounting_orders_json|safe }};'),
    # Stat cards (camelCase in dc-script: "const statCards = [...]")
    (r'const statCards\s*=\s*\[.*?\];', 'const statCards = {{ stat_cards_json|safe }};'),
    # Expiry cards (camelCase: "const expiryCards = [...]")
    (r'const expiryCards\s*=\s*\[.*?\];', 'const expiryCards = {{ expiry_cards_json|safe }};'),
    # UPPER_CASE fallbacks (in case they exist)
    (r'const STAT_CARDS\s*=\s*\[.*?\];', 'const STAT_CARDS = {{ stat_cards_json|safe }};'),
    (r'const EXPIRY_CARDS\s*=\s*\[.*?\];', 'const EXPIRY_CARDS = {{ expiry_cards_json|safe }};'),
    # Pricing, Add-ons, Press
    (r'const PRICING\s*=\s*\[.*?\];', 'const PRICING = {{ pricing_json|safe }};'),
    (r'const ADDON\s*=\s*\[.*?\];', 'const ADDON = {{ addon_json|safe }};'),
    (r'const PRESS\s*=\s*\[.*?\];', 'const PRESS = {{ press_json|safe }};'),
    # Messages, servers, email, 2fa, admin users
    (r'const OUTBOUND_MESSAGES\s*=\s*\[.*?\];', 'const OUTBOUND_MESSAGES = {{ outbound_messages_json|safe }};'),
    (r'const SERVERS\s*=\s*\[.*?\];', 'const SERVERS = {{ servers_json|safe }};'),
    (r'const PRIVATE_EMAIL\s*=\s*\[.*?\];', 'const PRIVATE_EMAIL = {{ private_email_json|safe }};'),
    (r'const TWO_FACTOR\s*=\s*\[.*?\];', 'const TWO_FACTOR = {{ two_factor_json|safe }};'),
    (r'const ADMIN_USERS\s*=\s*\[.*?\];', 'const ADMIN_USERS = {{ admin_users_json|safe }};'),
    (r'const EMAIL_SENDING\s*=\s*\[.*?\];', 'const EMAIL_SENDING = {{ email_sending_json|safe }};'),
    (r'const DEFAULT_PERMISSIONS\s*=\s*\{.*?\};', 'const DEFAULT_PERMISSIONS = {{ permissions_json|safe }};'),
    # Dashboard details (object not array)
    (r'const DASHBOARD_DETAILS\s*=\s*\{.*?\};', 'const DASHBOARD_DETAILS = {{ dashboard_details_json|safe }};'),
    
    # ── saveTable() function — intercepts saving to send API requests ─────────
    (
        r'saveTable\s*=\s*\(key\)\s*=>\s*\{\s*this\.setState\(s\s*=>\s*\(\{\s*tables:\s*\{\s*\.\.\.s\.tables,\s*\[key\]:\s*\{\s*rows:\s*this\.getTable\(s,\s*key\)\.rows,\s*saved:\s*clone\(this\.getTable\(s,\s*key\)\.rows\)\s*\}\s*\}\s*\}\)\);\s*\};',
        r'''saveTable = (key) => {
    const rows = this.getTable(this.state, key).rows;
    if (['pricing', 'addon', 'press', 'servers', 'privateEmail', 'twoFactor', 'emailSending', 'adminUsers'].includes(key)) {
        fetch('/admin/data/save/', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ key: key, data: rows })
        }).then(res => {
            if(res.ok) {
                this.setState(s => ({ tables: { ...s.tables, [key]: { rows: this.getTable(s, key).rows, saved: clone(this.getTable(s, key).rows) } } }));
            } else {
                alert('Failed to save ' + key);
            }
        }).catch(err => alert('Network error: ' + err));
    } else {
        this.setState(s => ({ tables: { ...s.tables, [key]: { rows: this.getTable(s, key).rows, saved: clone(this.getTable(s, key).rows) } } }));
    }
  };'''
    ),
    # ── savePermissions() function interceptor ─────────
    (
        r'savePermissions\s*=\s*\(\)\s*=>\s*this\.setState\(s\s*=>\s*\(\{\s*permissionsSaved:\s*clone\(s\.permissions\)\s*\}\)\);',
        r'''savePermissions = () => {
    fetch('/admin/data/save/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: 'permissions', data: this.state.permissions })
    }).then(res => {
        if(res.ok) {
            this.setState(s => ({ permissionsSaved: clone(s.permissions) }));
        } else {
            alert('Failed to save permissions');
        }
    }).catch(err => alert('Network error: ' + err));
  };'''
    ),
]

replaced_count = 0
for pattern, replacement in data_replacements:
    new_body, count = re.subn(pattern, replacement, dc_script_body, flags=re.DOTALL)
    if count:
        print(f"  Replaced {count}x: {pattern[:50]}...")
        dc_script_body = new_body
        replaced_count += count

print(f"\nTotal data replacements: {replaced_count}")

# The dc-script contains Django template vars ({{ ... |safe }}) that Django MUST process.
# Do NOT wrap in verbatim — Django needs to replace those vars with real JSON data.
# The JavaScript in dc-script uses single { } braces which Django ignores.
new_dc_script = f'{dc_script_open}\n{dc_script_body}\n{dc_script_close}'

# ── Build runtime JS ──────────────────────────────────────────────────────────
runtime_js_text = ''
if runtime_js_uuid:
    runtime_js_text = decoded_assets[runtime_js_uuid]['raw'].decode('utf-8')

# ── Assemble the final HTML ───────────────────────────────────────────────────
# KEY: x-dc comes first in body, then the runtime JS loads and finds x-dc in DOM
final_html = f'''<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Admin Dashboard</title>
</head>
<body>

{{% verbatim %}}
{xdc_section}
{{% endverbatim %}}

{new_dc_script}

{ext_script_tags}
<script>
{{% verbatim %}}
{runtime_js_text}
{{% endverbatim %}}
</script>

<!-- ── Real-time data polling + Logout (Fixed UI) ─────────────────── -->
<script>
(function() {{
  var POLL_INTERVAL = 30000; // 30 seconds
  var _pollTimer = null;

  // ── Logout handler ───────────────────────────────────────────────
  function doLogout() {{
    fetch('/admin/logout/', {{
      method: 'GET',
      credentials: 'same-origin'
    }}).then(function() {{
      window.location.href = '/admin/login/';
    }}).catch(function() {{
      window.location.href = '/admin/login/';
    }});
  }}

  // ── Find the sidebar element ──────────────────────────────────────
  function getSidebar() {{
    // The DCLogic sidebar is usually the first child of body or a fixed/flex left panel
    var all = document.querySelectorAll('*');
    for (var i = 0; i < all.length; i++) {{
      var el = all[i];
      var style = window.getComputedStyle(el);
      var rect = el.getBoundingClientRect();
      // Sidebar: narrow (< 200px wide), taller than 300px, fixed or absolute left
      if (rect.width > 80 && rect.width < 200 && rect.height > 300 && rect.left < 20) {{
        return el;
      }}
    }}
    return null;
  }}

  // ── Find admin avatar / user-info element at bottom of sidebar ────
  function getAdminAvatarEl(sidebar) {{
    if (!sidebar) return null;
    var children = sidebar.querySelectorAll('*');
    for (var i = children.length - 1; i >= 0; i--) {{
      var el = children[i];
      var txt = el.textContent ? el.textContent.trim() : '';
      // Find the bottom user info: has an img or has text with @ (email)
      var hasEmail = txt.indexOf('@') !== -1;
      var hasImg = el.querySelector('img') !== null;
      var isSmall = el.getBoundingClientRect().height < 80;
      if ((hasEmail || hasImg) && isSmall) {{
        return el;
      }}
    }}
    return null;
  }}

  // ── Inject logout button ABOVE the admin avatar ───────────────────
  function injectLogoutBtn() {{
    if (document.getElementById('admin-logout-btn')) return;

    var btn = document.createElement('div');
    btn.id = 'admin-logout-btn';
    btn.innerHTML = '<span style="font-size:15px;margin-right:6px;">&#x2192;</span> Logout';
    btn.title = 'Sign out of admin panel (Ctrl+Shift+L)';
    btn.style.cssText = [
      'cursor:pointer',
      'color:#c0392b',
      'font-size:12px',
      'font-weight:700',
      'padding:7px 14px',
      'letter-spacing:0.05em',
      'display:flex',
      'align-items:center',
      'width:100%',
      'box-sizing:border-box',
      'transition:background 0.18s',
      'border-radius:0',
      'user-select:none',
      'border-top:1px solid rgba(0,0,0,0.08)'
    ].join(';');
    btn.onmouseenter = function() {{ this.style.background = 'rgba(192,57,43,0.1)'; }};
    btn.onmouseleave = function() {{ this.style.background = 'transparent'; }};
    btn.onclick = function(e) {{
      e.preventDefault(); e.stopPropagation();
      if (confirm('Are you sure you want to logout?')) doLogout();
    }};

    // Try to insert BEFORE the avatar element
    var sidebar = getSidebar();
    var avatarEl = getAdminAvatarEl(sidebar);
    if (avatarEl && avatarEl.parentElement) {{
      avatarEl.parentElement.insertBefore(btn, avatarEl);
    }} else if (sidebar) {{
      sidebar.appendChild(btn);
    }} else {{
      // Last resort: fixed bottom-left above avatar area
      btn.style.cssText += ';position:fixed;bottom:70px;left:0;right:0;width:130px;z-index:9999;background:rgba(255,255,255,0.97);box-shadow:0 -1px 6px rgba(0,0,0,0.1);';
      document.body.appendChild(btn);
    }}
  }}

  // ── Inject live badge INSIDE the sidebar (top area) ───────────────
  function injectLiveBadge() {{
    if (document.getElementById('admin-live-badge')) return;
    var badge = document.createElement('div');
    badge.id = 'admin-live-badge';
    badge.textContent = '\u25cf Live';
    // Place it inside the sidebar top, below the logo
    var sidebar = getSidebar();
    if (sidebar) {{
      badge.style.cssText = [
        'display:block',
        'font-size:10px',
        'font-weight:700',
        'color:#27ae60',
        'background:rgba(39,174,96,0.1)',
        'border:1px solid rgba(39,174,96,0.25)',
        'border-radius:12px',
        'padding:2px 8px',
        'margin:4px 12px 8px 12px',
        'letter-spacing:0.06em',
        'width:fit-content',
        'pointer-events:none'
      ].join(';');
      // Insert after the logo (first child)
      var firstChild = sidebar.firstElementChild;
      if (firstChild && firstChild.nextSibling) {{
        sidebar.insertBefore(badge, firstChild.nextSibling);
      }} else {{
        sidebar.insertBefore(badge, sidebar.firstChild);
      }}
    }} else {{
      // Fallback: bottom-right, far from browser chrome
      badge.style.cssText = [
        'position:fixed',
        'bottom:16px',
        'right:16px',
        'z-index:9999',
        'font-size:10px',
        'font-weight:700',
        'color:#27ae60',
        'background:rgba(39,174,96,0.12)',
        'border:1px solid rgba(39,174,96,0.3)',
        'border-radius:20px',
        'padding:3px 10px',
        'pointer-events:none'
      ].join(';');
      document.body.appendChild(badge);
    }}
  }}

  // ── Real-time data refresh ────────────────────────────────────────
  function refreshData() {{
    fetch('/admin/data/', {{
      method: 'GET',
      credentials: 'same-origin',
      headers: {{ 'Accept': 'application/json' }}
    }})
    .then(function(r) {{
      if (r.status === 401) {{ clearInterval(_pollTimer); return null; }}
      return r.json();
    }})
    .then(function(data) {{
      if (!data) return;
      try {{
        var d = new Date(data.timestamp);
        var timeStr = d.toLocaleTimeString([], {{hour:'2-digit', minute:'2-digit'}});
        var badge = document.getElementById('admin-live-badge');
        if (badge) badge.textContent = '\u25cf Live \u2022 ' + timeStr;
      }} catch(e) {{}}
    }})
    .catch(function() {{}});
  }}

  // ── Keyboard shortcut: Ctrl+Shift+L = Logout ──────────────────────
  document.addEventListener('keydown', function(e) {{
    if (e.ctrlKey && e.shiftKey && e.key === 'L') doLogout();
  }});

  // ── Init ─────────────────────────────────────────────────────────
  function init() {{
    injectLogoutBtn();
    injectLiveBadge();
    _pollTimer = setInterval(refreshData, POLL_INTERVAL);
    document.addEventListener('visibilitychange', function() {{
      if (!document.hidden) refreshData();
    }});
  }}

  if (document.readyState === 'loading') {{
    document.addEventListener('DOMContentLoaded', init);
  }} else {{
    setTimeout(init, 1000);
  }}
}})();
</script>

</body>
</html>'''

# ── Verify the Django template vars are present ────────────────────────────────
if 'dashboard_details_json' in final_html:
    print("\ndashboard_details_json: OK")
else:
    print("\nWARNING: dashboard_details_json not found in output!")

with open(OUTPUT, 'w', encoding='utf-8') as f:
    f.write(final_html)

print(f"Done! Written {len(final_html):,} bytes to {OUTPUT}")
