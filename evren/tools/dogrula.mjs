// Veri doğrulayıcı: node tools/dogrula.mjs
// Her evren dosyasında kimliklerin, bağlantıların, şeritlerin ve tarihlerin tutarlı olduğunu kontrol eder.
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const kok = join(dirname(fileURLToPath(import.meta.url)), "..", "data");
const evrenler = JSON.parse(readFileSync(join(kok, "universes.json"), "utf8"));
const TURLER = new Set(["film", "dizi", "kitap", "cizgi"]);
const BAG = new Set(["devam", "bagli", "gonderme", "uyarlama"]);
const ROL = new Set(["ana", "yan", "cameo", "anilir"]);
const SPEC = new Set(["beklenti", "teori", "söylenti"]);
const tumu = {};
let hata = 0, uyari = 0, sayac = { yapim: 0, karakter: 0, olay: 0, bag: 0 };
const H = (u, m) => { hata++; console.log(`HATA  [${u}] ${m}`); };
const W = (u, m) => { uyari++; console.log(`uyarı [${u}] ${m}`); };

for (const ev of evrenler) {
  let d;
  try { d = JSON.parse(readFileSync(join(kok, "u", `${ev.id}.json`), "utf8")); }
  catch (e) { H(ev.id, "dosya okunamadı: " + e.message); continue; }
  tumu[ev.id] = d;
  if (d.id !== ev.id) H(ev.id, `dosyadaki id '${d.id}'`);
  const seritler = new Set(d.lanes.map(l => l[0]));
  const ids = new Set();
  for (const t of d.titles) {
    if (ids.has(t.id)) H(ev.id, `yinelenen yapım id: ${t.id}`);
    ids.add(t.id);
    if (!TURLER.has(t.type)) H(ev.id, `${t.id}: bilinmeyen tür ${t.type}`);
    if (!seritler.has(t.lane)) H(ev.id, `${t.id}: bilinmeyen şerit ${t.lane}`);
    if (t.date !== null && !/^\d{4}-\d{2}-\d{2}$/.test(t.date || "")) H(ev.id, `${t.id}: tarih biçimi ${t.date}`);
    if (!t.sum || !t.sig) H(ev.id, `${t.id}: özet veya önem eksik`);
    if ((t.type === "film" || t.type === "dizi") && !Array.isArray(t.cast)) H(ev.id, `${t.id}: oyuncu listesi yok`);
    if ((t.facts || t.spec) && !(t.facts && t.spec)) W(ev.id, `${t.id}: facts/spec yalnızca biri var`);
    (t.spec || []).forEach(s => { if (!SPEC.has(s[0])) H(ev.id, `${t.id}: varsayım düzeyi ${s[0]}`); });
    if (t.next && !/^\d{4}-\d{2}-\d{2}$/.test(t.next[1])) H(ev.id, `${t.id}: sonraki sezon tarihi`);
    sayac.yapim++;
  }
  for (const e of d.edges) {
    if (!ids.has(e[0]) || !ids.has(e[1])) H(ev.id, `bağlantı ucu yok: ${e.join(" → ")}`);
    if (!BAG.has(e[2])) H(ev.id, `bağlantı türü: ${e[2]}`);
    if (e[2] === "gonderme" && !e[3]) W(ev.id, `notsuz gönderme: ${e[0]} → ${e[1]}`);
    sayac.bag++;
  }
  const kid = new Set();
  for (const c of d.chars || []) {
    if (ids.has(c.id) || kid.has(c.id)) H(ev.id, `karakter id çakışması: ${c.id}`);
    kid.add(c.id);
    c.app.forEach(a => { if (!ids.has(a[0])) H(ev.id, `${c.id}: yapım yok ${a[0]}`); if (!ROL.has(a[1])) H(ev.id, `${c.id}: rol ${a[1]}`); });
    sayac.karakter++;
  }
  for (const o of d.events || []) {
    if (ids.has(o.id) || kid.has(o.id)) H(ev.id, `olay id çakışması: ${o.id}`);
    if (!ids.has(o.at)) H(ev.id, `${o.id}: yer yok ${o.at}`);
    o.aff.forEach(a => { if (!ids.has(a[0])) H(ev.id, `${o.id}: etkilenen yok ${a[0]}`); });
    sayac.olay++;
  }
}
// Evrenler arası bağlantılar
for (const [uid, d] of Object.entries(tumu)) {
  for (const x of d.xref || []) {
    const hedef = tumu[x[1]];
    if (!d.titles.some(t => t.id === x[0])) H(uid, `xref kaynak yok: ${x[0]}`);
    if (!hedef || !hedef.titles.some(t => t.id === x[2])) H(uid, `xref hedef yok: ${x[1]}/${x[2]}`);
  }
}
console.log(`\n${Object.keys(tumu).length} evren · ${sayac.yapim} yapım · ${sayac.karakter} karakter · ${sayac.olay} olay · ${sayac.bag} bağlantı`);
console.log(hata ? `${hata} hata, ${uyari} uyarı` : `Hata yok (${uyari} uyarı)`);
process.exit(hata ? 1 : 0);
