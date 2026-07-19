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
data_replacements = [
    (r'const USERS\s*=\s*\[.*?\];', 'const USERS = {{ users_json|safe }};'),
    (r'const ACCOUNTING_ORDERS\s*=\s*\[.*?\];', 'const ACCOUNTING_ORDERS = {{ accounting_orders_json|safe }};'),
    (r'const STAT_CARDS\s*=\s*\[.*?\];', 'const STAT_CARDS = {{ stat_cards_json|safe }};'),
    (r'const EXPIRY_CARDS\s*=\s*\[.*?\];', 'const EXPIRY_CARDS = {{ expiry_cards_json|safe }};'),
    (r'const PRICING\s*=\s*\[.*?\];', 'const PRICING = {{ pricing_json|safe }};'),
    (r'const ADDON\s*=\s*\[.*?\];', 'const ADDON = {{ addon_json|safe }};'),
    (r'const PRESS\s*=\s*\[.*?\];', 'const PRESS = {{ press_json|safe }};'),
    (r'const OUTBOUND_MESSAGES\s*=\s*\[.*?\];', 'const OUTBOUND_MESSAGES = {{ outbound_messages_json|safe }};'),
    (r'const SERVERS\s*=\s*\[.*?\];', 'const SERVERS = {{ servers_json|safe }};'),
    (r'const PRIVATE_EMAIL\s*=\s*\[.*?\];', 'const PRIVATE_EMAIL = {{ private_email_json|safe }};'),
    (r'const TWO_FACTOR\s*=\s*\[.*?\];', 'const TWO_FACTOR = {{ two_factor_json|safe }};'),
    (r'const ADMIN_USERS\s*=\s*\[.*?\];', 'const ADMIN_USERS = {{ admin_users_json|safe }};'),
    (r'const EMAIL_SENDING\s*=\s*\[.*?\];', 'const EMAIL_SENDING = {{ email_sending_json|safe }};'),
    (r'const DASHBOARD_DETAILS\s*=\s*\{.*?\};', 'const DASHBOARD_DETAILS = {{ dashboard_details_json|safe }};'),
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

<!-- ── Real-time data polling + Logout ─────────────────────────────── -->
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

  // ── Inject logout button into the sidebar ────────────────────────
  function injectLogoutBtn() {{
    var sidebar = document.querySelector('[data-sidebar], .sidebar, nav, [class*="sidebar"], [class*="nav-"]');
    // Try to find the admin name element first, then the sidebar
    var nameEls = document.querySelectorAll('*');
    var targetEl = null;
    for (var i = 0; i < nameEls.length; i++) {{
      var el = nameEls[i];
      var txt = el.textContent ? el.textContent.trim() : '';
      if (txt === 'iwasKilled' || txt === 'Admin' || txt === 'admin') {{
        targetEl = el.parentElement || el;
        break;
      }}
    }}

    // Create logout button
    var btn = document.getElementById('admin-logout-btn');
    if (!btn) {{
      btn = document.createElement('div');
      btn.id = 'admin-logout-btn';
      btn.textContent = 'Logout';
      btn.title = 'Sign out of admin panel';
      btn.style.cssText = [
        'cursor:pointer',
        'color:#c0392b',
        'font-size:13px',
        'font-weight:600',
        'padding:8px 14px',
        'margin-top:auto',
        'border-top:1px solid rgba(255,255,255,0.1)',
        'letter-spacing:0.04em',
        'display:flex',
        'align-items:center',
        'gap:6px',
        'transition:background 0.2s',
        'border-radius:4px'
      ].join(';');
      btn.onmouseenter = function() {{ this.style.background = 'rgba(192,57,43,0.15)'; }};
      btn.onmouseleave = function() {{ this.style.background = 'transparent'; }};
      btn.onclick = function(e) {{
        e.preventDefault();
        e.stopPropagation();
        if (confirm('Are you sure you want to logout?')) doLogout();
      }};
      // Prepend "→ " icon
      var icon = document.createElement('span');
      icon.innerHTML = '&#x2192;';
      icon.style.cssText = 'font-size:14px;opacity:0.8;';
      btn.insertBefore(icon, btn.firstChild);

      // Find the sidebar and append
      var sidebarEl = document.querySelector('[class*="sidebar"]') ||
                      document.querySelector('aside') ||
                      document.querySelector('nav');
      if (sidebarEl) {{
        sidebarEl.appendChild(btn);
      }} else if (targetEl) {{
        targetEl.parentElement && targetEl.parentElement.appendChild(btn);
      }} else {{
        // Fallback: fixed position bottom-left
        btn.style.cssText += ';position:fixed;bottom:20px;left:10px;z-index:9999;background:rgba(255,255,255,0.95);box-shadow:0 2px 8px rgba(0,0,0,0.15);border-radius:8px;';
        document.body.appendChild(btn);
      }}
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
      if (r.status === 401) {{
        clearInterval(_pollTimer);
        return null;
      }}
      return r.json();
    }})
    .then(function(data) {{
      if (!data) return;
      // Find the DCLogic component instance and update its state
      try {{
        var rootEl = document.querySelector('x-dc');
        if (rootEl && rootEl._dcInstance) {{
          rootEl._dcInstance.setState(function(prev) {{
            return {{
              _liveData: data,
              _lastUpdated: data.timestamp
            }};
          }});
        }}
        // Update page title with last-updated time
        var d = new Date(data.timestamp);
        var timeStr = d.toLocaleTimeString([], {{hour:'2-digit', minute:'2-digit'}});
        var badge = document.getElementById('admin-live-badge');
        if (badge) badge.textContent = 'Live \u2022 ' + timeStr;
      }} catch(e) {{
        // DCLogic instance not accessible — data will refresh on next page load
      }}
    }})
    .catch(function() {{}});
  }}

  // ── Inject live badge ─────────────────────────────────────────────
  function injectLiveBadge() {{
    if (document.getElementById('admin-live-badge')) return;
    var badge = document.createElement('div');
    badge.id = 'admin-live-badge';
    badge.textContent = 'Live';
    badge.style.cssText = [
      'position:fixed',
      'top:10px',
      'right:14px',
      'z-index:99999',
      'font-size:11px',
      'font-weight:700',
      'color:#27ae60',
      'background:rgba(39,174,96,0.12)',
      'border:1px solid rgba(39,174,96,0.3)',
      'border-radius:20px',
      'padding:3px 10px',
      'letter-spacing:0.05em',
      'pointer-events:none'
    ].join(';');
    document.body.appendChild(badge);
  }}

  // ── Keyboard shortcut: Ctrl+Shift+L = Logout ──────────────────────
  document.addEventListener('keydown', function(e) {{
    if (e.ctrlKey && e.shiftKey && e.key === 'L') doLogout();
  }});

  // ── Init on DOMContentLoaded ──────────────────────────────────────
  function init() {{
    injectLogoutBtn();
    injectLiveBadge();
    // Start polling every 30 seconds
    _pollTimer = setInterval(refreshData, POLL_INTERVAL);
    // Also refresh when the tab becomes visible again
    document.addEventListener('visibilitychange', function() {{
      if (!document.hidden) refreshData();
    }});
  }}

  if (document.readyState === 'loading') {{
    document.addEventListener('DOMContentLoaded', init);
  }} else {{
    // Wait a tick for DCLogic to mount
    setTimeout(init, 800);
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
