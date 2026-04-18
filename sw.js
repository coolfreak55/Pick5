const CACHE = 'pick5-v1';
const APP_SHELL = ['/', '/index.html', '/manifest.json', '/icon.svg'];

// Install: cache app shell
self.addEventListener('install', function(e) {
  e.waitUntil(
    caches.open(CACHE).then(function(cache) {
      return cache.addAll(APP_SHELL);
    })
  );
  self.skipWaiting();
});

// Activate: remove old caches
self.addEventListener('activate', function(e) {
  e.waitUntil(
    caches.keys().then(function(keys) {
      return Promise.all(
        keys.filter(function(k) { return k !== CACHE; })
            .map(function(k) { return caches.delete(k); })
      );
    })
  );
  self.clients.claim();
});

// Fetch: cache-first for app shell, network-only for external APIs
self.addEventListener('fetch', function(e) {
  const url = new URL(e.request.url);

  // Always go to network for external requests (Firebase, ESPN, etc.)
  if (url.origin !== self.location.origin) {
    return;
  }

  // Cache-first for app shell files
  e.respondWith(
    caches.match(e.request).then(function(cached) {
      const network = fetch(e.request).then(function(res) {
        if (res.ok) {
          const clone = res.clone();
          caches.open(CACHE).then(function(cache) { cache.put(e.request, clone); });
        }
        return res;
      });
      return cached || network;
    })
  );
});
