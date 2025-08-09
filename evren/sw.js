// sw.js (fixed): avoid caching POST, bypass analytics collect, cache GET only
const APP_CACHE = 'app-shell-v3'; // bump version to force update
const IMG_CACHE = 'img-cache-v3';

// If your site is served from a subpath (e.g., /evren), remove '/' from APP_SHELL or prefix with the subpath.
const APP_SHELL = [
  // '/',
  '/index.html',
  '/images/anasayfa.jpg',
  '/images/avatar.jpg',
  '/images/pandora.jpg',
  '/images/dc.jpg',
  '/images/harrypotter.jpg',
  '/images/marvel.jpg',
  '/images/matrix.jpg',
  '/images/middleearth.jpg',
  '/images/pixar.jpg',
  '/images/starwars.jpg',
];

self.addEventListener('install', (e) => {
  e.waitUntil((async () => {
    const cache = await caches.open(APP_CACHE);
    try { await cache.addAll(APP_SHELL); } catch (e) { /* offline install may fail; ignore */ }
    self.skipWaiting();
  })());
});

self.addEventListener('activate', (e) => {
  e.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter(k => ![APP_CACHE, IMG_CACHE].includes(k)).map(k => caches.delete(k)));
    self.clients.claim();
  })());
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  const url = new URL(req.url);

  // 1) Don't handle non-GET; Cache API can't cache POST/PUT etc.
  if (req.method !== 'GET') return;

  // 2) Never intercept analytics collect (POST) or any workers.dev calls
  if (url.pathname.startsWith('/api/analytics/collect')) return;
  if (url.hostname.endsWith('.workers.dev')) return;

  // 3) Images -> cache-first
  const isImage = req.destination === 'image' || url.pathname.startsWith('/images/') || /\.(png|jpe?g|webp|gif|svg)$/i.test(url.pathname);
  if (isImage) {
    event.respondWith(cacheFirstImages(req));
    return;
  }

  // 4) Everything else (GET) -> network-first
  event.respondWith(networkFirst(req));
});

async function cacheFirstImages(request) {
  const cache = await caches.open(IMG_CACHE);
  const cached = await cache.match(request, { ignoreSearch: true });
  if (cached) {
    // Update in background
    fetch(request).then(res => { if (res && res.ok) cache.put(request, res.clone()); }).catch(()=>{});
    return cached;
  }
  try {
    const res = await fetch(request);
    if (res && res.ok) { cache.put(request, res.clone()); }
    return res;
  } catch (e) {
    return new Response('', { status: 504, statusText: 'Offline' });
  }
}

async function networkFirst(request) {
  const cache = await caches.open(APP_CACHE);
  try {
    const res = await fetch(request);
    // Cache only successful GET responses
    if (res && res.ok) {
      await cache.put(request, res.clone());
    }
    return res;
  } catch (e) {
    const cached = await cache.match(request, { ignoreSearch: true });
    return cached || new Response('', { status: 504, statusText: 'Offline' });
  }
}
