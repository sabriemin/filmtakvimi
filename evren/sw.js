// sw.js
const APP_CACHE = 'app-shell-v1';
const IMG_CACHE = 'img-cache-v1';

const APP_SHELL = [
  '/',              // Alt klasörden servis ediyorsan bunu kaldır veya düzelt
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
    try { await cache.addAll(APP_SHELL); } catch (e) { /* offline kurulumda hata normal */ }
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
  const isImage = req.destination === 'image' || url.pathname.startsWith('/images/') || /\.(png|jpe?g|webp|gif|svg)$/i.test(url.pathname);
  if (isImage) {
    event.respondWith(cacheFirstImages(req));
  } else {
    event.respondWith(networkFirst(req));
  }
});

async function cacheFirstImages(request) {
  const cache = await caches.open(IMG_CACHE);
  const cached = await cache.match(request, { ignoreSearch: true });
  if (cached) {
    fetch(request).then(res => { if (res.ok) cache.put(request, res.clone()); }).catch(()=>{});
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
  try {
    const res = await fetch(request);
    const cache = await caches.open(APP_CACHE);
    cache.put(request, res.clone());
    return res;
  } catch (e) {
    const cached = await caches.match(request, { ignoreSearch: true });
    return cached || new Response('', { status: 504, statusText: 'Offline' });
  }
}
