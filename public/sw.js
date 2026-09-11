// Service Worker for TK Invoice PWA
// Provides offline capability by caching static assets (HTML, CSS, JS, fonts)

const CACHE_NAME = 'tk-invoice-cache-v1';

// Essential static resources to precache during service worker installation
const PRECACHE_ASSETS = [
  '/',
  '/index.html',
  '/favicon.ico',
];

// 1. Install Event: Precache core assets & activate immediately
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      // Precache initial shell assets
      return cache.addAll(PRECACHE_ASSETS).catch((err) => {
        console.warn('[SW] Precache asset error (non-fatal):', err);
      });
    }).then(() => {
      // Force activation without waiting
      return self.skipWaiting();
    })
  );
});

// 2. Activate Event: Clean up outdated caches & take control of clients immediately
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((name) => {
          if (name !== CACHE_NAME) {
            console.log('[SW] Deleting old cache:', name);
            return caches.delete(name);
          }
        })
      );
    }).then(() => {
      return self.clients.claim();
    })
  );
});

// 3. Fetch Event: Network-first for navigation, Cache-first/Stale-while-revalidate for static assets
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests or chrome-extension URLs
  if (request.method !== 'GET' || !url.protocol.startsWith('http')) {
    return;
  }

  // Do NOT cache /api/ calls (handled by offline sync & IndexedDB)
  if (url.pathname.startsWith('/api/')) {
    return;
  }

  // For HTML navigation requests: Network first with Cache fallback
  if (request.mode === 'navigate' || request.headers.get('accept')?.includes('text/html')) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response && response.status === 200) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          }
          return response;
        })
        .catch(async () => {
          // Offline fallback to cached index.html or root
          const cached = await caches.match(request);
          if (cached) return cached;
          const fallback = await caches.match('/index.html') || await caches.match('/');
          if (fallback) return fallback;
          return new Response('<h1>ออฟไลน์ - ไม่สามารถโหลดหน้าเว็บได้</h1><p>กรุณาตรวจสอบการเชื่อมต่ออินเทอร์เน็ต</p>', {
            headers: { 'Content-Type': 'text/html; charset=utf-8' },
          });
        })
    );
    return;
  }

  // For static assets (JS, CSS, fonts, images, Vite modules): Cache-First / Stale-While-Revalidate
  event.respondWith(
    caches.match(request).then((cachedResponse) => {
      if (cachedResponse) {
        // Fetch fresh copy in background to keep cache up-to-date
        fetch(request)
          .then((networkResponse) => {
            if (networkResponse && networkResponse.status === 200) {
              caches.open(CACHE_NAME).then((cache) => cache.put(request, networkResponse));
            }
          })
          .catch(() => {
            // Background update failed because offline, which is fine
          });
        return cachedResponse;
      }

      // If not in cache, fetch from network and store in cache
      return fetch(request).then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200) {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, responseToCache);
          });
        }
        return networkResponse;
      }).catch((err) => {
        console.warn('[SW] Fetch failed offline for:', request.url);
        // Throw or return empty fallback
        throw err;
      });
    })
  );
});
