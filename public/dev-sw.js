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
    })
  );
});
