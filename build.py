#!/usr/bin/env python3
"""Builds the standalone (no-Claude) Between Us app into ./www from the shared source in ../between-us.
Usage: python3 build.py [path-to-node_modules-with-peerjs-and-fontsource]"""
import os, re, shutil, sys, json, hashlib
HERE = os.path.dirname(os.path.abspath(__file__))
SRC = os.path.join(HERE, 'src') if os.path.isdir(os.path.join(HERE, 'src')) else os.path.join(HERE, '..', 'between-us')
NM = sys.argv[1] if len(sys.argv) > 1 else os.path.join(HERE, 'node_modules')
WWW = os.path.join(HERE, 'www')
JS = ['cards.js', 'core.js', 'screens.js', 'pet.js', 'answers.js', 'gate.js', 'gen.js', 'love.js', 'game.js']

os.makedirs(os.path.join(WWW, 'fonts'), exist_ok=True)
for f in JS + ['p2p.js']:
    shutil.copy(os.path.join(SRC, f), os.path.join(WWW, f))
shutil.copy(os.path.join(NM, 'peerjs', 'dist', 'peerjs.min.js'), os.path.join(WWW, 'peerjs.min.js'))
qr = os.path.join(NM, 'qrcodejs', 'qrcode.min.js')
if os.path.exists(qr): shutil.copy(qr, os.path.join(WWW, 'qrcode.min.js'))

faces = []
for fam, name in (('rubik', 'Rubik'), ('fredoka', 'Fredoka')):
    for w in (400, 500, 600, 700):
        for sub, rng in (('hebrew', 'U+0307-0308,U+0590-05FF,U+200C-2010,U+20AA,U+25CC,U+FB1D-FB4F'), ('latin', 'U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+2000-206F,U+2074,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD')):
            fn = f'{fam}-{sub}-{w}-normal.woff2'
            p = os.path.join(NM, '@fontsource', fam, 'files', fn)
            if os.path.exists(p):
                shutil.copy(p, os.path.join(WWW, 'fonts', fn))
                faces.append(f"@font-face{{font-family:{name};font-style:normal;font-display:swap;font-weight:{w};src:url(fonts/{fn}) format('woff2');unicode-range:{rng}}}")

html = open(os.path.join(SRC, 'index.html'), encoding='utf-8').read()
html = re.sub(r'<link rel="preconnect"[^>]*>\s*', '', html)
html = re.sub(r'<link href="https://fonts.googleapis.com[^>]*>\s*', '', html)
html = html.replace('<style>', '<style>\n' + '\n'.join(faces) + '\n', 1)
head_extra = '''<link rel="manifest" href="manifest.webmanifest">
<link rel="icon" href="icons/icon-192.png">
<link rel="apple-touch-icon" href="icons/icon-180.png">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
<meta name="apple-mobile-web-app-title" content="Between Us">
'''
html = html.replace('<title>Between Us</title>', '<title>Between Us</title>\n' + head_extra, 1)
html = html.replace('<script src="https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js"></script>',
                    '<script src="peerjs.min.js"></script>\n<script src="p2p.js"></script>\n<script src="qrcode.min.js"></script>', 1)
html = html.replace('</body>', '''<script>
if ('serviceWorker' in navigator && location.protocol === 'https:' && !window.Capacitor) navigator.serviceWorker.register('sw.js').catch(() => {});
</script>
</body>''', 1)
open(os.path.join(WWW, 'index.html'), 'w', encoding='utf-8').write(html)

# service worker: cache everything for offline use; network-first for html so updates arrive
files = []
for root, _, fs in os.walk(WWW):
    for f in fs:
        rel = os.path.relpath(os.path.join(root, f), WWW).replace(os.sep, '/')
        if rel != 'sw.js': files.append(rel)
ver = hashlib.sha1(''.join(hashlib.sha1(open(os.path.join(WWW, f), 'rb').read()).hexdigest() + f for f in sorted(files) if f.endswith(('.js', '.html'))).encode()).hexdigest()[:10]
sw = '''const V = 'bu-%s'; const FILES = %s;
self.addEventListener('install', e => { e.waitUntil(caches.open(V).then(c => c.addAll(['./'].concat(FILES))).then(() => self.skipWaiting())); });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== V).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener('fetch', e => {
  const u = new URL(e.request.url); if (e.request.method !== 'GET' || u.origin !== location.origin) return;
  if (e.request.mode === 'navigate') { e.respondWith(fetch(e.request).then(r => { const c = r.clone(); caches.open(V).then(x => x.put('./', c)); return r; }).catch(() => caches.match('./'))); return; }
  e.respondWith(caches.match(e.request).then(r => r || fetch(e.request)));
});
''' % (ver, json.dumps(files))
open(os.path.join(WWW, 'sw.js'), 'w').write(sw)
print('built www', ver, len(files), 'files')
