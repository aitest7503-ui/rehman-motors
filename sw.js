const C='rm-v3';const F=['./','./index.html','./manifest.webmanifest','./icon.svg','./firebase-config.js','./cloud.js','./vendor/firebase-app.js','./vendor/firebase-auth.js','./vendor/firebase-firestore.js'];
self.addEventListener('install',e=>{e.waitUntil(caches.open(C).then(c=>c.addAll(F)));self.skipWaiting()});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(k=>Promise.all(k.filter(x=>x!==C).map(x=>caches.delete(x)))));self.clients.claim()});
self.addEventListener('fetch',e=>{const u=new URL(e.request.url);if(e.request.method!=='GET')return;
 // Firebase/Google network calls (login, database) kabhi cache nahi karne
 if(u.origin!==location.origin){if(u.hostname==='www.gstatic.com'&&u.pathname.startsWith('/firebasejs/'))e.respondWith(caches.match(e.request).then(r=>r||fetch(e.request).then(n=>{const cp=n.clone();caches.open(C).then(c=>c.put(e.request,cp));return n})));return}
 if(u.pathname.includes('/__/'))return;
 // config + app file: pehle network (naya config turant mile), offline ho to cache
 if(/firebase-config\.js$|index\.html$|\/$/.test(u.pathname)){e.respondWith(fetch(e.request).then(n=>{const cp=n.clone();caches.open(C).then(c=>c.put(e.request,cp));return n}).catch(()=>caches.match(e.request).then(r=>r||caches.match('./index.html'))));return}
 e.respondWith(caches.match(e.request).then(r=>r||fetch(e.request).then(n=>{const cp=n.clone();caches.open(C).then(c=>c.put(e.request,cp));return n}).catch(()=>caches.match('./index.html'))))});
