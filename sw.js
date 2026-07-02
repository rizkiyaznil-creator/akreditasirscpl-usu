/* Service worker — Handbook Akreditasi RS
   Strategi:
   - content.json: network-first (agar update konten cepat terlihat), fallback cache saat offline.
   - Aset shell lain: cache-first dengan pembaruan latar (stale-while-revalidate ringan).
   Naikkan CACHE_VERSION saat mengubah aset agar cache lama tergantikan. */
var CACHE_VERSION = 'handbook-rs-v5';
var SHELL = [
  './',
  './index.html',
  './assets/styles.css',
  './assets/app.js',
  './manifest.webmanifest',
  './assets/icon-192.png',
  './assets/icon-512.png'
];

self.addEventListener('install', function (e) {
  e.waitUntil(
    caches.open(CACHE_VERSION).then(function (c) { return c.addAll(SHELL); })
      .then(function () { return self.skipWaiting(); })
  );
});

self.addEventListener('activate', function (e) {
  e.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(keys.map(function (k) {
        if (k !== CACHE_VERSION) return caches.delete(k);
      }));
    }).then(function () { return self.clients.claim(); })
  );
});

self.addEventListener('fetch', function (e) {
  var req = e.request;
  if (req.method !== 'GET') return;
  var url = new URL(req.url);
  if (url.origin !== self.location.origin) return; // hanya same-origin

  // content.json → network-first
  if (url.pathname.endsWith('/content.json') || url.pathname.endsWith('content.json')) {
    e.respondWith(
      fetch(req).then(function (res) {
        var copy = res.clone();
        caches.open(CACHE_VERSION).then(function (c) { c.put(req, copy); });
        return res;
      }).catch(function () { return caches.match(req); })
    );
    return;
  }

  // aset lain → cache-first + revalidate latar
  e.respondWith(
    caches.match(req).then(function (cached) {
      var network = fetch(req).then(function (res) {
        if (res && res.status === 200) {
          var copy = res.clone();
          caches.open(CACHE_VERSION).then(function (c) { c.put(req, copy); });
        }
        return res;
      }).catch(function () { return cached; });
      return cached || network;
    })
  );
});
