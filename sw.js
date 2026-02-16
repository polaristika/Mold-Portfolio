// Service worker for Mold portfolio - basic precache + runtime caching
const CACHE_NAME = 'mold-cache-v1';
const PRECACHE_URLS = [
  '/',
  '/index.html',
  '/logo.gif',
  '/dive.webp',
  '/Dye of Deaf.webp',
  '/fnaf1.webp',
  '/transition/Frame1.png',
  '/transition/Frame10.png',
  '/transition/Frame20.png'
];

self.addEventListener('install', event => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(PRECACHE_URLS))
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => Promise.all(
      keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))
    )).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);
  // Only handle same-origin requests
  if (url.origin !== location.origin) return;

  // Navigation requests: network-first then cache fallback
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request).then(response => {
        const copy = response.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(request, copy));
        return response;
      }).catch(() => caches.match('/index.html'))
    );
    return;
  }

  // Images, styles, scripts, fonts: cache-first
  if (request.destination === 'image' || request.destination === 'style' || request.destination === 'script' || request.destination === 'font') {
    event.respondWith(
      caches.match(request).then(cached => cached || fetch(request).then(response => {
        const copy = response.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(request, copy));
        return response;
      }).catch(() => cached))
    );
    return;
  }

  // Videos: prefer network but cache on success, fallback to cache
  if (request.destination === 'video') {
    event.respondWith(
      fetch(request).then(response => {
        const copy = response.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(request, copy));
        return response;
      }).catch(() => caches.match(request))
    );
    return;
  }

  // Default: try network then cache
  event.respondWith(
    fetch(request).catch(() => caches.match(request))
  );
});

self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') self.skipWaiting();
});
