// Go Crispy Training Hub — offline service worker
// Bump this version string any time index.html changes, so returning
// visitors pick up the update instead of a stale cache.
const CACHE_NAME = 'gocrispy-hub-v2';

// Fonts and icons are embedded directly inside index.html as base64,
// so there is nothing else to list here — caching index.html covers them.
const PRECACHE_URLS = [
  './',
  './index.html',
  './manifest.json'
];

// Install: download and cache everything the app needs up front,
// so it works the very first time someone opens it with no internet
// right after a visit that had internet.
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(PRECACHE_URLS))
      .then(() => self.skipWaiting())
  );
});

// Activate: clear out any old cache versions.
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

// Fetch: cache-first, fall back to network, and cache whatever the
// network returns so it's available next time too. If totally offline
// and the browser is asking for a page, serve the cached index.html
// so the app still opens instead of showing an error.
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  event.respondWith(
    caches.match(event.request).then((cached) => {
      if (cached) return cached;

      return fetch(event.request)
        .then((response) => {
          if (response && response.status === 200) {
            const copy = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
          }
          return response;
        })
        .catch(() => {
          if (event.request.mode === 'navigate') {
            return caches.match('./index.html');
          }
        });
    })
  );
});
