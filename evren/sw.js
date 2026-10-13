/* Film Evreni Ağı servis çalışanı: uygulama kabuğunu ve verileri önbelleğe alır, çevrim dışı açılmayı sağlar.
   Yeni sürüm yayınladığınızda SURUM değerini artırın. */
const SURUM = "fea-v3";
const KABUK = ["./", "index.html", "assets/app.css", "assets/app.js", "manifest.webmanifest", "assets/icons/icon.svg", "assets/icons/icon-192.png", "data/universes.json", "data/site.json", "data/pages.json"];
const GORSEL = "fea-gorsel";
const GORSEL_SINIR = 500;

self.addEventListener("install", (e) => {
  e.waitUntil((async () => {
    const c = await caches.open(SURUM);
    await c.addAll(KABUK);
    try {
      const unis = await (await fetch("data/universes.json", { cache: "no-cache" })).json();
      await c.addAll(unis.map((u) => `data/u/${u.id}.json`));
    } catch {}
    await self.skipWaiting();
  })());
});

self.addEventListener("activate", (e) => {
  e.waitUntil((async () => {
    for (const k of await caches.keys()) if (k !== SURUM && k !== GORSEL) await caches.delete(k);
    await self.clients.claim();
  })());
});

async function kirp(cache) {
  const keys = await cache.keys();
  for (let i = 0; i < keys.length - GORSEL_SINIR; i++) await cache.delete(keys[i]);
}
async function bayatlarkenYenile(req, adi) {
  const c = await caches.open(adi);
  const eski = await c.match(req, { ignoreSearch: false });
  const yeni = fetch(req).then((r) => { if (r && (r.ok || r.type === "opaque")) c.put(req, r.clone()); return r; }).catch(() => null);
  return eski || (await yeni) || new Response("", { status: 504 });
}

self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  // Yönetim API'si her zaman ağdan
  if (url.origin === location.origin && url.pathname.includes("/api/")) return;
  // Sayfa gezinmesi: önce ağ, olmazsa önbellekteki kabuk
  if (req.mode === "navigate") {
    e.respondWith(fetch(req).then((r) => { caches.open(SURUM).then((c) => c.put("index.html", r.clone())); return r; }).catch(async () => (await caches.match("index.html")) || (await caches.match("./"))));
    return;
  }
  // Afiş ve kapak görselleri: önce önbellek
  if (/image\.tmdb\.org|covers\.openlibrary\.org/.test(url.host)) {
    e.respondWith((async () => {
      const c = await caches.open(GORSEL);
      const hit = await c.match(req);
      if (hit) return hit;
      try { const r = await fetch(req); if (r && (r.ok || r.type === "opaque")) { c.put(req, r.clone()); kirp(c); } return r; }
      catch { return new Response("", { status: 504 }); }
    })());
    return;
  }
  // Yazı tipleri ve kütüphaneler
  if (/fonts\.googleapis\.com|fonts\.gstatic\.com|cdnjs\.cloudflare\.com/.test(url.host)) { e.respondWith(bayatlarkenYenile(req, SURUM)); return; }
  // Kendi dosyalarımız: önbellekten hemen, arkada güncelle
  if (url.origin === location.origin) e.respondWith(bayatlarkenYenile(req, SURUM));
});
