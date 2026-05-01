/* Growth Codex — Service Worker v10-3-3
   Cache-first strategy with network fallback.
   Caches the main HTML file and all same-origin requests.
   On offline, returns a minimal inline fallback page.
*/
const CACHE_NAME = 'codex-v7';

/* Files to pre-cache on install */
const PRECACHE = [
  './',
  './growth_codex_v10-3-3.html',
  './manifest.webmanifest',
  './icons/apple-touch-icon-180.png',
  './startup/ios-startup.png'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(PRECACHE))
      .then(() => self.skipWaiting())
      .catch(() => self.skipWaiting()) /* non-fatal: partial cache still useful */
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))
      ))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;
  event.respondWith(
    caches.match(event.request).then(cached => {
      if (cached) return cached;
      return fetch(event.request).then(response => {
        if (response.ok) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
        }
        return response;
      }).catch(() => new Response(
        `<!DOCTYPE html><html><head><meta charset="utf-8">
         <meta name="viewport" content="width=device-width,initial-scale=1">
         <title>Growth Codex — Offline</title>
         <style>body{background:#06040c;color:#d4a843;font-family:sans-serif;display:flex;
         align-items:center;justify-content:center;height:100vh;margin:0;text-align:center}
         h1{font-size:2rem;margin-bottom:.5rem}p{color:#c9b89a;font-size:.9rem}</style>
         </head><body><div><h1>⚜ Growth Codex</h1>
         <p>You are offline.<br>Launch from your Home Screen icon to load from cache.</p>
         </div></body></html>`,
        { headers: { 'Content-Type': 'text/html; charset=utf-8' } }
      ));
    })
  );
});
