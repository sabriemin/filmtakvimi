// Afiş, arka plan görseli, TMDB puanı ve eksik künye bilgilerini TMDB'den çekip veri dosyalarına yazar.
//
// Kullanım (Node 18+):
//   TMDB_TOKEN=<v4 okuma erişim anahtarı> node tools/tmdb-zenginlestir.mjs
//   TMDB_KEY=<v3 API anahtarı>           node tools/tmdb-zenginlestir.mjs --evren mcu
// Seçenekler:
//   --evren <id>   Yalnızca bir evreni işler (ör. mcu, sw, dc)
//   --yeniden      Afişi zaten olan yapımları da yeniden sorgular
//   --kapaklar     Kitap ve çizgi romanlar için Open Library kapaklarını da ekler (anahtar gerekmez)
//   --kuru         Dosyalara yazmadan yalnızca eşleşmeleri gösterir
// Windows PowerShell'de:  $env:TMDB_TOKEN="..."; node tools/tmdb-zenginlestir.mjs
//
// Not: Bu betik kendi yazdığımız özetleri (sum, sig) değiştirmez. TMDB'nin Türkçe özeti ayrı bir alana (tmdbOverview) yazılır.
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const kok = join(dirname(fileURLToPath(import.meta.url)), "..", "data");
const arg = (k) => process.argv.includes(k);
const deger = (k) => { const i = process.argv.indexOf(k); return i > -1 ? process.argv[i + 1] : null; };
const TOKEN = process.env.TMDB_TOKEN, KEY = process.env.TMDB_KEY;
const KURU = arg("--kuru"), YENIDEN = arg("--yeniden"), KAPAK = arg("--kapaklar"), TEK = deger("--evren");
const bekle = (ms) => new Promise((r) => setTimeout(r, ms));
const norm = (s) => String(s || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, " ").trim();

if (!TOKEN && !KEY && !KAPAK) {
  console.error("TMDB_TOKEN veya TMDB_KEY ortam değişkeni gerekli. Ücretsiz anahtar: https://www.themoviedb.org/settings/api");
  process.exit(1);
}

async function tmdb(yol, params = {}) {
  const u = new URL("https://api.themoviedb.org/3" + yol);
  Object.entries({ language: "tr-TR", ...params }).forEach(([k, v]) => v != null && u.searchParams.set(k, v));
  if (KEY && !TOKEN) u.searchParams.set("api_key", KEY);
  const r = await fetch(u, { headers: TOKEN ? { Authorization: `Bearer ${TOKEN}`, accept: "application/json" } : {} });
  if (r.status === 429) { await bekle(2500); return tmdb(yol, params); }
  if (!r.ok) throw new Error(`${r.status} ${u.pathname}`);
  await bekle(60);
  return r.json();
}

// Arama sonucundan en iyi eşleşmeyi seçer: başlık birebir + yıl > yıl > ilk sonuç
function sec(sonuclar, t, tur) {
  const ad = norm(t.name.replace(/ \([^)]*\)$/, ""));
  const yil = t.date ? +t.date.slice(0, 4) : null;
  const puan = (r) => {
    const ra = norm(tur === "movie" ? r.original_title || r.title : r.original_name || r.name);
    const ry = +(tur === "movie" ? r.release_date : r.first_air_date || "").slice(0, 4);
    return (ra === ad ? 10 : ra.includes(ad) || ad.includes(ra) ? 4 : 0) + (yil && ry === yil ? 6 : yil && Math.abs(ry - yil) <= 1 ? 3 : 0) + Math.min(3, (r.popularity || 0) / 20);
  };
  return [...sonuclar].sort((a, b) => puan(b) - puan(a))[0];
}

async function zenginlestir(t) {
  const tur = t.type === "film" ? "movie" : "tv";
  let id = t.tmdb && t.tmdb.id;
  if (!id) {
    const yil = t.date ? t.date.slice(0, 4) : null;
    const q = t.name.replace(/ \([^)]*\)$/, "");
    let s = await tmdb(`/search/${tur}`, tur === "movie" ? { query: q, primary_release_year: yil } : { query: q, first_air_date_year: yil });
    if (!s.results.length) s = await tmdb(`/search/${tur}`, { query: q });
    const r = sec(s.results, t, tur);
    if (!r) return "eşleşme yok";
    // Yıl tutmuyorsa (ör. 2028 yapımı için 2000 tarihli aynı adlı film) eşleştirme yapılmaz
    const ry = +((tur === "movie" ? r.release_date : r.first_air_date) || "").slice(0, 4);
    const yy = t.date ? +t.date.slice(0, 4) : null;
    if (yy && ry && Math.abs(ry - yy) > 1) return `atlandı: en yakın sonuç ${r.title || r.name} (${ry})`;
    if (yy && !ry && yy < new Date().getFullYear()) return "atlandı: tarihsiz sonuç";
    id = r.id;
  }
  const d = await tmdb(`/${tur}/${id}`, { append_to_response: tur === "movie" ? "credits" : "aggregate_credits" });
  t.tmdb = { id, kind: tur };
  if (d.poster_path) t.poster = d.poster_path;
  if (d.backdrop_path) t.backdrop = d.backdrop_path;
  if (d.vote_count > 50) t.vote = Math.round(d.vote_average * 10) / 10;
  if (d.overview) t.tmdbOverview = d.overview;
  if (!t.rt && d.runtime) t.rt = d.runtime;
  if (!t.g || !t.g.length) t.g = (d.genres || []).map((g) => g.name).slice(0, 3);
  const kredi = d.credits || d.aggregate_credits || {};
  if (!t.cast || !t.cast.length) t.cast = (kredi.cast || []).slice(0, 6).map((c) => [c.name, c.character || (c.roles && c.roles[0] && c.roles[0].character) || ""]);
  if (!t.dir || !t.dir.length) {
    t.dir = tur === "movie" ? (kredi.crew || []).filter((c) => c.job === "Director").map((c) => c.name) : (d.created_by || []).map((c) => c.name);
  }
  return `${d.title || d.name} (${(d.release_date || d.first_air_date || "").slice(0, 4)}) #${id}`;
}

async function kapak(t) {
  const u = new URL("https://openlibrary.org/search.json");
  u.searchParams.set("title", t.name.replace(/ \(\d{4}\)$/, ""));
  if (t.dir && t.dir[0]) u.searchParams.set("author", t.dir[0]);
  u.searchParams.set("limit", "1");
  const r = await fetch(u, { headers: { "User-Agent": "FilmEvreniAgi/1.0 (data enrichment)" } });
  if (!r.ok) return "hata " + r.status;
  const j = await r.json(); await bekle(300);
  const doc = j.docs && j.docs[0];
  if (!doc || !doc.cover_i) return "kapak yok";
  t.cover = `https://covers.openlibrary.org/b/id/${doc.cover_i}-L.jpg`;
  return doc.title;
}

// Veri dosyalarını elle düzenlenebilir biçimde (her kayıt bir satır) yazar
function yaz(d) {
  const L = (v) => JSON.stringify(v);
  const parca = Object.entries(d).map(([k, v]) =>
    Array.isArray(v) && ["titles", "chars", "events", "edges", "xref", "lanes"].includes(k)
      ? `"${k}":[\n${v.map(L).join(",\n")}\n]` : `"${k}":${L(v)}`);
  return "{\n" + parca.join(",\n") + "\n}\n";
}

const evrenler = JSON.parse(readFileSync(join(kok, "universes.json"), "utf8")).filter((u) => !TEK || u.id === TEK);
let n = 0, hata = 0;
for (const ev of evrenler) {
  const dosya = join(kok, "u", `${ev.id}.json`);
  const d = JSON.parse(readFileSync(dosya, "utf8"));
  console.log(`\n== ${ev.name} ==`);
  for (const t of d.titles) {
    try {
      if ((t.type === "film" || t.type === "dizi") && (TOKEN || KEY) && (YENIDEN || !t.poster)) {
        console.log(`  ${t.id.padEnd(12)} → ${await zenginlestir(t)}`); n++;
      } else if ((t.type === "kitap" || t.type === "cizgi") && KAPAK && (YENIDEN || !t.cover)) {
        console.log(`  ${t.id.padEnd(12)} → kapak: ${await kapak(t)}`); n++;
      }
    } catch (e) { hata++; console.log(`  ${t.id.padEnd(12)} ✗ ${e.message}`); }
  }
  if (!KURU) writeFileSync(dosya, yaz(d));
}
console.log(`\n${n} kayıt işlendi, ${hata} hata.${KURU ? " (kuru çalıştırma: dosyalar değişmedi)" : ""}`);
console.log("Eşleşmeleri kontrol edin: yanlış eşleşen bir yapımın 'tmdb' alanına doğru id'yi yazıp --yeniden ile tekrar çalıştırabilirsiniz.");
