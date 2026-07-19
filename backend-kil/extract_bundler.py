import json, re, os, base64

os.makedirs('c:/Rasel/keiredwards/backend-kil/apps/dashboard/static/dashboard/', exist_ok=True)

with open('c:/Rasel/keiredwards/backend-kil/apps/dashboard/Admin Dashboard - Standalone.html', 'r', encoding='utf-8') as f:
    content = f.read()

manifest_match = re.search(r'<script type="__bundler/manifest">(.*?)</script>', content, re.DOTALL)
if manifest_match:
    manifest = json.loads(manifest_match.group(1))
    
    if isinstance(manifest, dict):
        for uuid, f in manifest.items():
            mime = f.get('mime', '')
            data = f.get('data', '')
            
            ext = 'js'
            if 'css' in mime:
                ext = 'css'
            elif 'png' in mime:
                ext = 'png'
            elif 'html' in mime:
                ext = 'html'
                
            try:
                decoded = base64.b64decode(data)
                
                # Write binary for images, else decode to utf-8
                out_name = f"vendor_{uuid}.{ext}"
                path = f"c:/Rasel/keiredwards/backend-kil/apps/dashboard/static/dashboard/{out_name}"
                
                if ext in ['png', 'jpg', 'jpeg', 'gif', 'svg']:
                    with open(path, "wb") as out:
                        out.write(decoded)
                else:
                    with open(path, "w", encoding="utf-8") as out:
                        out.write(decoded.decode('utf-8', errors='replace'))
                        
                print(f"Extracted {mime} -> {out_name}")
            except Exception as e:
                print(f"Failed to extract {uuid}: {e}")
