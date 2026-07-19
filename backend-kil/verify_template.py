import re

with open('c:/Rasel/keiredwards/backend-kil/apps/dashboard/templates/dashboard/custom_admin.html', 'r', encoding='utf-8') as f:
    content = f.read()

verbatim_positions = [m.start() for m in re.finditer(r'\{%\s*verbatim\s*%\}', content)]
endverbatim_positions = [m.start() for m in re.finditer(r'\{%\s*endverbatim\s*%\}', content)]
print(f"verbatim blocks: {len(verbatim_positions)}")
print(f"endverbatim blocks: {len(endverbatim_positions)}")

idx_goD = content.find('goDashboard')
print(f"\ngoDashboard found at: {idx_goD}")

found = False
for i, (vstart, vend) in enumerate(zip(verbatim_positions, endverbatim_positions)):
    if vstart < idx_goD < vend:
        print(f"  -> Inside verbatim block #{i+1} ({vstart} to {vend}) OK")
        found = True
        break
if not found:
    print("  -> NOT inside any verbatim block! BAD")

idx_dd = content.find('dashboard_details_json')
print(f"\ndashboard_details_json found at: {idx_dd}")
found2 = False
for i, (vstart, vend) in enumerate(zip(verbatim_positions, endverbatim_positions)):
    if vstart < idx_dd < vend:
        print(f"  -> Inside verbatim block #{i+1} - DJANGO WON'T REPLACE IT! BAD")
        found2 = True
        break
if not found2:
    print("  -> NOT inside verbatim - Django will process it OK")

print("\nVerbatim block ranges:")
for i, (vstart, vend) in enumerate(zip(verbatim_positions, endverbatim_positions)):
    print(f"  Block #{i+1}: {vstart} to {vend} (length: {vend-vstart})")
