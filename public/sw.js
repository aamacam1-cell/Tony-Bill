// Self-unregistering service worker to unblock dev preview and clear stale cache
self.addEventListener('install', function (e) {
  self.skipWaiting();
});

self.addEventListener('activate', function (e) {
  e.waitUntil(
    caches.keys().then(function (names) {
      return Promise.all(names.map(function (n) { return caches.delete(n); }));
    }).then(function () {
      return self.registration.unregister();
    }).then(function () {
      return self.clients.claim();
    }).then(function () {
      return self.clients.matchAll({ type: 'window' });
    }).then(function (clients) {
      clients.forEach(function (c) {
        if (c && typeof c.navigate === 'function') {
          c.navigate(c.url);
        }
      });
    })
  );
});

self.addEventListener('fetch', function (e) {
  e.respondWith(fetch(e.request));
});
