/* Film Evreni Ağı — uygulama kodu.
   Veri: data/universes.json + data/u/<evren>.json (yapımlar), data/site.json + data/pages.json (site bilgileri ve sayfalar).
   Görünümler aynı veri modelinden üretilir. Kurumsal/yasal sayfalar yönetim panelinden (#yonetim) düzenlenir. */
(() => {
"use strict";

/* ================= YARDIMCILAR ================= */
document.documentElement.lang = "tr";
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const NS = "http://www.w3.org/2000/svg";
const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
const finePointer = matchMedia("(hover: hover) and (pointer: fine)").matches;
const isMobile = () => innerWidth < 760;
const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const hashStr = (s) => { let h = 2166136261; for (const c of s) h = Math.imul(h ^ c.charCodeAt(0), 16777619) >>> 0; return h; };
const TODAY = (() => { const d = new Date(); d.setHours(0, 0, 0, 0); return d; })();
const pd = (iso) => (iso ? new Date(iso + "T00:00:00") : null);
const daysTo = (iso) => Math.round((pd(iso) - TODAY) / 864e5);
const fmtD = (iso) => pd(iso).toLocaleDateString("tr-TR", { day: "numeric", month: "long", year: "numeric" });
const fmtMY = (iso) => pd(iso).toLocaleDateString("tr-TR", { month: "long", year: "numeric" });
const fmtS = (iso) => pd(iso).toLocaleDateString("tr-TR", { day: "2-digit", month: "short" }).toLocaleUpperCase("tr");
const norm = (s) => String(s || "").toLocaleLowerCase("tr").replace(/ı/g, "i").normalize("NFD").replace(/[̀-ͯ]/g, "");
const store = {
  get(k, d) { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch { return d; } },
  set(k, v) { try { v == null ? localStorage.removeItem(k) : localStorage.setItem(k, JSON.stringify(v)); } catch {} }
};
const langAttr = (str, def = "en") => (/[ğüşöçıİĞÜŞÖÇ]/.test(str) ? ' lang="tr"' : def === "en" ? ' lang="en"' : "");
const KIND = { film: "Film", dizi: "Dizi", kitap: "Kitap", cizgi: "Çizgi roman" };
const ROLE = { ana: "Ana rol", yan: "Yan rol", cameo: "Kısa görünüm", anilir: "Anılıyor" };
const LVL = { fact: "Resmî", beklenti: "Beklenti", teori: "Teori", "söylenti": "Söylenti" };
const LANE_COLORS = ["#ff5a5f", "#ffb020", "#ffe066", "#5fd39a", "#2fd3c4", "#4fa3ff", "#8f7cff", "#e47cff", "#ff7ab6", "#c9a26b", "#9fd0ff", "#b8f26b"];
const SRC_COLOR = "#9aa6c9";
const isSrc = (t) => t.type === "kitap" || t.type === "cizgi";
const VIEWS = { map: ["Evren haritası", "Her alt seri bir metro hattı. Bir durağın üstüne gel ya da dokun; bağlantıları görürsün."], time: ["Zaman çizelgesi", "Vizyon sırası ile evren içi kronoloji arasında geçiş yap."], guide: ["İzleme rehberi", "Bir yapım seç; ondan önce izlemen gerekenleri hesaplayalım."], chars: ["Karakterler", "Karakterlerin yapımlar boyunca yolculuğu."], soon: ["Yakında ve teoriler", "Gelecek vizyonlar, resmî bilgiler ve açıkça etiketlenmiş varsayımlar."] };

function toast(msg) {
  const t = $("#toast"); t.textContent = msg; t.classList.add("on");
  clearTimeout(toast.t); toast.t = setTimeout(() => t.classList.remove("on"), 2400);
}
async function copyText(txt) {
  try { await navigator.clipboard.writeText(txt); toast("Kopyalandı"); }
  catch { toast("Kopyalanamadı; metni seçip kopyalayın"); }
}
function shortName(t) {
  let n = t.name.replace(/ – Part (\d)/, " $1").replace(/ \([^)]*\)$/, "");
  if (/^Mission: Impossible( 2| III)?$/.test(n)) return n;
  if (n.includes(" – ")) n = n.split(" – ").pop();
  else if (n.includes(": ")) {
    const [a, ...b] = n.split(": "); const rest = b.join(": ");
    const m = rest.match(/^Part (Two|Three)$/);
    n = m ? `${a} ${m[1] === "Two" ? 2 : 3}` : /^A .*Story$/.test(rest) ? a : rest.length >= 4 ? rest : n;
  }
  return n.replace(/^Harry Potter and the /, "").replace(/^Untitled /, "");
}
const initials = (name) => name.replace(/\(.*?\)/g, "").split(/[\s/]+/).filter((w) => /^[\p{L}]/u.test(w)).slice(0, 2).map((w) => w[0]).join("").toLocaleUpperCase("tr");
const claudeUse = (n) => (window.claude && typeof window.claude.use === "function" ? Promise.resolve(window.claude.use(n)).catch(() => null) : Promise.resolve(null));

/* ================= AMBLEMLER ================= */
const EMB = {
  stones: () => `<circle cx="24" cy="24" r="15"/>${[0, 60, 120, 180, 240, 300].map((a) => { const r = a * Math.PI / 180; return `<circle cx="${(24 + Math.cos(r) * 15).toFixed(1)}" cy="${(24 + Math.sin(r) * 15).toFixed(1)}" r="3.4" fill="currentColor"/>`; }).join("")}`,
  suns: () => `<circle cx="18" cy="19" r="7"/><circle cx="31" cy="24" r="4.5"/><path d="M4 34h40M10 40h28"/>`,
  shield: () => `<path d="M24 5l16 6v12c0 10-7 17-16 21C15 40 8 33 8 23V11z"/><path d="M16 19l8 8 8-8"/>`,
  bolt: () => `<path d="M28 4L12 27h11l-4 17 17-25H25z"/>`,
  ring: () => `<circle cx="24" cy="24" r="16"/><circle cx="24" cy="24" r="11"/><path d="M15 19q9-6 18 0"/>`,
  crown: () => `<path d="M8 34l2-20 8 9 6-13 6 13 8-9 2 20z"/><path d="M8 40h32"/>`,
  dune: () => `<circle cx="33" cy="13" r="5"/><path d="M4 30q10-8 20 0t20 0M4 38q10-8 20 0t20 0"/>`,
  claw: () => `<path d="M13 6c5 12 5 24-1 36M24 4c5 13 5 27 0 40M35 6c5 12 5 24-1 36"/>`,
  flame: () => `<path d="M24 5c6 8 10 13 10 21a10 10 0 0 1-20 0c0-5 3-9 6-13 1 5 4 7 4 7s1-8 0-15z"/><path d="M18 42h12"/>`,
  helix: () => `<path d="M14 4c0 10 20 10 20 20s-20 10-20 20M34 4c0 10-20 10-20 20s20 10 20 20"/><path d="M18 10h12M18 38h12M21 24h6"/>`,
  egg: () => `<path d="M24 6c8 0 13 12 13 22a13 13 0 0 1-26 0C11 18 16 6 24 6z"/><path d="M24 6v9M17 10l7 5 7-5"/>`,
  arrow: () => `<path d="M9 39L39 9M39 9H28M39 9v11M9 39l2-8M9 39l8-2M14 34l2-8M14 34l8-2"/>`,
  fossil: () => `<path d="M24 42c-6 0-9-5-7-10l3-6h8l3 6c2 5-1 10-7 10z"/><path d="M20 26l-7-15M24 26V7M28 26l7-15"/>`,
  speed: () => `<path d="M5 16h22M10 24h24M5 32h22"/><path d="M33 13l9 11-9 11"/>`,
  fuse: () => `<path d="M5 40c9-2 7-12 15-14s9 7 15 2"/><circle cx="37" cy="24" r="2" fill="currentColor"/><path d="M37 17v-6M37 31v6M30 24h-4M44 24h-4M42 19l3-3M42 29l3 3"/>`,
  coin: () => `<circle cx="24" cy="24" r="17"/><circle cx="24" cy="24" r="12"/><path d="M24 15l6 9-6 9-6-9z"/>`,
  web: () => { const p = (r) => [...Array(8)].map((_, i) => { const a = i * Math.PI / 4; return `${(24 + Math.cos(a) * r).toFixed(1)},${(24 + Math.sin(a) * r).toFixed(1)}`; }).join(" "); return `<polygon points="${p(8)}"/><polygon points="${p(15)}"/><polygon points="${p(20)}"/>${[...Array(8)].map((_, i) => { const a = i * Math.PI / 4; return `<path d="M24 24L${(24 + Math.cos(a) * 21).toFixed(1)} ${(24 + Math.sin(a) * 21).toFixed(1)}"/>`; }).join("")}`; },
  leaf: () => `<path d="M9 39C9 19 21 9 40 8c0 19-11 31-31 31z"/><path d="M9 39l22-22M18 30h8M24 24v-7"/>`,
  planet: () => `<circle cx="24" cy="24" r="11"/><ellipse cx="24" cy="24" rx="21" ry="7" transform="rotate(-20 24 24)"/>`,
  bio: () => `<circle cx="24" cy="15" r="8"/><circle cx="16" cy="29" r="8"/><circle cx="32" cy="29" r="8"/><circle cx="24" cy="24" r="3" fill="currentColor"/>`,
  lamp: () => `<path d="M10 42h18M19 42l4-14 9-9"/><path d="M28 9l11 11-6 6-11-11z"/><path d="M30 26c3 3 7 3 9 0"/>`,
  castle: () => `<path d="M6 42V24h8v18M34 42V24h8v18M14 42V17l10-11 10 11v25M6 24l4-5 4 5M34 24l4-5 4 5M21 42v-7a3 3 0 0 1 6 0v7M4 42h40M24 6V2"/>`,
  moon: () => `<path d="M30 6a18 18 0 1 0 12 30A15 15 0 0 1 30 6z"/><path d="M20 30l3-9M23 21l5 2"/>`,
  goggle: () => `<path d="M4 22h40"/><circle cx="24" cy="22" r="11"/><circle cx="24" cy="22" r="5" fill="currentColor"/><path d="M14 40c3-4 7-6 10-6s7 2 10 6"/>`
};
const emb = (k) => `<svg viewBox="0 0 48 48" aria-hidden="true">${(EMB[k] || EMB.planet)()}</svg>`;
const ICON = {
  clap: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 9h16v10a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1z"/><path d="M4 9l2-5 15 3-1 2M9 4.6l-1.4 4.2M14 5.6l-1.4 3.4"/></svg>`,
  eye: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/></svg>`,
  quote: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 7H5v6h4l-2 4M19 7h-4v6h4l-2 4"/></svg>`,
  flag: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 21V4M5 4h11l-2 4 2 4H5"/></svg>`,
  door: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 21V4l9-1v18M15 21h4M12 12h.01"/></svg>`,
  arrowR: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg>`,
  arrowL: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M19 12H5M11 6l-6 6 6 6"/></svg>`,
  book: `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2z"/><path d="M4 19V5M8 7h7"/></svg>`
};

/* ================= SİTE İÇERİĞİ (CMS) ================= */
const SITE = { name: "Film Evreni Ağı", domain: "filmtakvimi.com", tmdbImageBase: "https://image.tmdb.org/t/p/", dataUpdated: "2026-10-14", analytics: false };
let PAGES = [];
const pageMap = () => Object.fromEntries(PAGES.map((p) => [p.key, p]));
function applyCms(content, source) {
  if (!content) return;
  if (content.site) Object.assign(SITE, content.site);
  if (Array.isArray(content.pages) && content.pages.length) PAGES = content.pages.map((p) => ({ ...p }));
  CMS_SOURCE = source || CMS_SOURCE;
  if (UNIS.length) { renderFooter(); renderMoreMenus(); }
  const open = location.hash.slice(1);
  if (!$("#pageModal").hidden && pageMap()[open]) openPage(open, { noHash: true });
}
let CMS_SOURCE = "dosya";

/* Küçük ve güvenli Markdown işleyici: ham HTML'i asla geçirmez. */
function siteVar(k, S = SITE) {
  if (k === "analitik") return S.analytics ? "Sitede yalnızca onay vermeniz hâlinde çalışan analitik araçlar bulunmaktadır. Çerez bandındaki 'Yalnızca zorunlu' seçeneğiyle bunları reddedebilirsiniz." : "Sitede şu anda analitik, reklam veya izleme aracı kullanılmamaktadır. Bu durum değişirse, ilgili araçlar yalnızca açık onayınızla çalışacak şekilde bu sayfa ve çerez bandı güncellenecektir.";
  const v = S[k];
  return v == null ? `{{${k}}}` : String(v);
}
function mdInline(s, S = SITE) {
  const parts = [];
  let h = esc(s);
  h = h.replace(/`([^`]+)`/g, (_, c) => { parts.push(`<code>${c}</code>`); return `\u0000${parts.length - 1}\u0000`; });
  h = h.replace(/\{\{(\w+)\}\}/g, (_, k) => { const v = siteVar(k, S); return /^\[.*\]$/.test(v) ? `<span class="ph">${esc(v)}</span>` : esc(v); });
  h = h.replace(/\[\[rozet:([^\]]+)\]\]/g, (_, l) => `<span class="lvl lvl-${esc(l)}">${esc(LVL[l] || l)}</span>`);
  h = h.replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (m, t, u) => {
    const url = u.replace(/&amp;/g, "&");
    if (!/^(https?:\/\/|mailto:|#[\w-]*$|\/)/.test(url)) return t;
    const ext = /^https?:/.test(url);
    return `<a href="${esc(url)}"${ext ? ' target="_blank" rel="noopener"' : ""}>${t}</a>`;
  });
  h = h.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>").replace(/(^|[^*])\*([^*\s][^*]*)\*/g, "$1<em>$2</em>");
  return h.replace(/\u0000(\d+)\u0000/g, (_, i) => parts[+i]);
}
function md(src, S = SITE) {
  const lines = String(src || "").replace(/\r/g, "").split("\n");
  let out = "", i = 0;
  const para = [];
  const mi = (x) => mdInline(x, S);
  const flush = () => { if (para.length) { out += `<p>${mi(para.join(" "))}</p>`; para.length = 0; } };
  while (i < lines.length) {
    const l = lines[i], t = l.trim();
    if (!t) { flush(); i++; continue; }
    let m;
    if ((m = t.match(/^\[\[(kimlik|iletisim|cerez-sifirla)\]\]$/))) { flush(); out += SHORT[m[1]](S); i++; continue; }
    if ((m = t.match(/^(#{2,3})\s+(.*)$/))) { flush(); out += m[1].length === 2 ? `<h3>${mi(m[2])}</h3>` : `<h4>${mi(m[2])}</h4>`; i++; continue; }
    if (/^---+$/.test(t)) { flush(); out += "<hr>"; i++; continue; }
    if (t.startsWith(">")) { flush(); const q = []; while (i < lines.length && lines[i].trim().startsWith(">")) q.push(lines[i++].trim().replace(/^>\s?/, "")); out += `<p class="lead">${mi(q.join(" "))}</p>`; continue; }
    if (/^[-*]\s+/.test(t)) { flush(); let h = "<ul>"; while (i < lines.length && /^[-*]\s+/.test(lines[i].trim())) h += `<li>${mi(lines[i++].trim().replace(/^[-*]\s+/, ""))}</li>`; out += h + "</ul>"; continue; }
    if (/^\d+[.)]\s+/.test(t)) { flush(); let h = "<ol>"; while (i < lines.length && /^\d+[.)]\s+/.test(lines[i].trim())) h += `<li>${mi(lines[i++].trim().replace(/^\d+[.)]\s+/, ""))}</li>`; out += h + "</ol>"; continue; }
    if (t.startsWith("|")) {
      flush(); const rows = [];
      while (i < lines.length && lines[i].trim().startsWith("|")) rows.push(lines[i++].trim());
      const cells = (r) => r.replace(/^\||\|$/g, "").split("|").map((c) => c.trim());
      const hasHead = rows[1] && /^\|?\s*:?-{2,}/.test(rows[1]);
      const head = hasHead ? cells(rows[0]) : null, body = rows.slice(hasHead ? 2 : 0).map(cells);
      out += `<div class="ltable-w"><table class="ltable">${head ? `<thead><tr>${head.map((c) => `<th>${mi(c)}</th>`).join("")}</tr></thead>` : ""}<tbody>${body.map((r) => `<tr>${r.map((c) => `<td>${mi(c)}</td>`).join("")}</tr>`).join("")}</tbody></table></div>`;
      continue;
    }
    para.push(t); i++;
  }
  flush();
  return out;
}
const SHORT = {
  kimlik: (S = SITE) => `<dl class="idcard">${[["Site", `${S.name} · ${S.domain}`], ["İçerik sağlayıcı / veri sorumlusu", S.owner], ["Adres", S.address], ["E-posta", S.email], ["KEP", S.kep], ["Vergi / MERSİS", S.taxId], ["Yer sağlayıcı (hosting)", S.hosting]].map(([k, v]) => `<dt>${k}</dt><dd>${/^\[.*\]$/.test(String(v || "")) ? `<span class="ph">${esc(v)}</span>` : esc(v || "—")}</dd>`).join("")}</dl>`,
  iletisim: (S = SITE) => `<div class="contact-grid"><div class="contact-box"><h3>E-posta</h3><p class="mono sel">${esc(S.email || "")}</p><button type="button" class="btn-ghost" data-copy="${esc(S.email || "")}">Adresi kopyala</button></div><div class="contact-box"><h3>Posta adresi</h3><p>${esc(S.address || "")}</p></div></div>
<h3>Mesaj gönderin</h3>
<form class="contact-form" id="contactForm" novalidate>
  <div class="frow"><label for="cf-name">Adınız</label><input id="cf-name" name="name" autocomplete="name" required></div>
  <div class="frow"><label for="cf-mail">E-posta adresiniz</label><input id="cf-mail" name="email" type="email" autocomplete="email" required></div>
  <div class="frow"><label for="cf-topic">Konu</label><select id="cf-topic" name="topic"><option>Hata bildirimi</option><option>İçerik önerisi</option><option>İş birliği</option><option>Telif hakkı / içerik kaldırma</option><option>KVKK başvurusu</option><option>Diğer</option></select></div>
  <div class="frow"><label for="cf-msg">Mesajınız</label><textarea id="cf-msg" name="message" rows="5" required></textarea></div>
  <label class="check"><input type="checkbox" id="cf-kvkk" required> <span><a href="#gizlilik">Aydınlatma Metni</a>'ni okudum; mesajımın yanıtlanması için iletişim bilgilerimin işlenmesini anlıyorum.</span></label>
  <button type="submit" class="btn">Gönder</button>
  <p class="form-note" id="cf-note" role="status"></p>
</form>`,
  "cerez-sifirla": () => `<p><button type="button" class="btn-ghost" data-reset-consent>Çerez tercihimi sıfırla</button></p>`
};

/* ================= DURUM ================= */
let UNIS = [];
const DB = {};
let U = null;
let view = "map";
let tlMode = "release", tlType = "all", soonScope = "u";
let route = null;
let revealed = new Set();
let IMG_OK = false;
const prefs = store.get("fea.prefs", { u: null, spoil: {} });
const spoilIdx = () => (prefs.spoil && prefs.spoil[U.id] != null ? prefs.spoil[U.id] : Infinity);
const locked = (n) => n.rel > spoilIdx() && !revealed.has(n.id);
const dispName = (n) => (locked(n) ? "Spoiler" : n.name);
const stale = { map: true, time: true, guide: true, chars: true, soon: true };

/* ================= VERİ ================= */
async function getJSON(url) {
  const r = await fetch(url, { cache: "no-cache" });
  if (!r.ok) throw new Error(url + " " + r.status);
  return r.json();
}
const isFut = (t) => !t.date || pd(t.date) > TODAY;

function compile(meta, d) {
  const M = { id: meta.id, meta, d, nodes: new Map(), titles: [], chars: [], events: [], links: [], adj: new Map(), lanes: [], laneOf: new Map() };
  const ord = d.titles.map((t, i) => ({ t, i })).sort((a, b) => {
    if (!a.t.date && !b.t.date) return a.i - b.i;
    if (!a.t.date) return 1; if (!b.t.date) return -1;
    return a.t.date < b.t.date ? -1 : a.t.date > b.t.date ? 1 : a.i - b.i;
  });
  const usedLanes = new Set(d.titles.map((t) => t.lane));
  let ci = 0;
  d.lanes.filter((l) => usedLanes.has(l[0])).forEach(([id, name]) => {
    const src = d.titles.filter((t) => t.lane === id).every(isSrc);
    M.lanes.push({ id, name, src, color: src ? SRC_COLOR : LANE_COLORS[ci++ % LANE_COLORS.length] });
  });
  M.lanes.forEach((l, i) => M.laneOf.set(l.id, { ...l, i }));
  ord.forEach(({ t }, k) => {
    const n = { ...t, kind: "title", rel: k, u: meta.id, year: t.date ? +t.date.slice(0, 4) : null, fut: isFut(t), lbl: shortName(t) };
    M.titles.push(n); M.nodes.set(n.id, n);
  });
  const addL = (s, t, type, extra = {}) => M.links.push({ s, t, type, ...extra });
  (d.chars || []).forEach((c) => {
    const rel = Math.min(...c.app.map((a) => M.nodes.get(a[0]).rel));
    const n = { ...c, kind: "char", rel, u: meta.id };
    M.chars.push(n); M.nodes.set(c.id, n);
    c.app.forEach(([tid, role]) => addL(c.id, tid, "karakter", { role }));
  });
  (d.events || []).forEach((e) => {
    const n = { ...e, kind: "event", rel: M.nodes.get(e.at).rel, u: meta.id };
    M.events.push(n); M.nodes.set(e.id, n);
    addL(e.id, e.at, "olay");
    e.aff.forEach(([tid, note]) => addL(e.id, tid, "etkiler", { note }));
  });
  d.edges.forEach(([s, t, type, note]) => addL(s, t, type, { note }));
  M.nodes.forEach((_, k) => M.adj.set(k, new Set()));
  M.links.forEach((l) => { M.adj.get(l.s).add(l.t); M.adj.get(l.t).add(l.s); });
  M.charOrder = [...M.chars].sort((a, b) => b.app.length - a.app.length);
  M.stats = { film: d.titles.filter((t) => t.type === "film").length, dizi: d.titles.filter((t) => t.type === "dizi").length, kitap: d.titles.filter(isSrc).length, kar: M.chars.length };
  return M;
}
function upcoming(M) {
  const out = [];
  M.titles.forEach((t) => {
    if (t.fut) out.push({ u: M.id, t, date: t.date, tent: !!t.tent, label: null });
    if (t.next && pd(t.next[1]) > TODAY) out.push({ u: M.id, t, date: t.next[1], tent: !!t.next[2], label: t.next[0], note: t.next[3] });
  });
  return out;
}
const byDate = (a, b) => (!a.date ? 1 : !b.date ? -1 : a.date < b.date ? -1 : a.date > b.date ? 1 : 0);
function whenText(it, short) {
  if (!it.date) return "Tarih açıklanmadı";
  if (it.tent) return (it.label ? String(pd(it.date).getFullYear()) : fmtMY(it.date)) + (short ? "" : " · kesin değil");
  return short ? fmtS(it.date) : fmtD(it.date);
}
function titleDate(t) {
  if (!t.date) return "Tarih açıklanmadı";
  if (t.dp === "y") return String(t.year);
  if (t.tent || t.dp === "m") return fmtMY(t.date) + (t.tent ? " (kesin değil)" : "");
  return fmtD(t.date);
}

/* ================= POSTER ================= */
function posterHTML(t, opts = {}) {
  const meta = UNIS.find((x) => x.id === t.u) || UNIS[0] || { color: "#ef4a52", emblem: "planet" };
  const h = hashStr(t.id + t.u) % 360, h2 = (h + 40) % 360;
  const g = `radial-gradient(120% 70% at 20% 0%, hsl(${h} 70% 55% / .55), transparent 60%), radial-gradient(90% 70% at 100% 100%, color-mix(in srgb, ${meta.color} 60%, transparent), transparent 70%), linear-gradient(165deg, hsl(${h2} 40% 18%), #070a14 80%)`;
  const lk = opts.lock;
  const size = opts.size || (opts.big ? "w500" : "w342");
  const src = t.poster ? `${SITE.tmdbImageBase}${size}${t.poster}` : t.cover ? (size === "w185" || size === "w92" ? t.cover.replace("-L.jpg", "-M.jpg") : t.cover) : "";
  const img = IMG_OK && src && !lk ? `<img src="${esc(src)}" alt="" loading="lazy" decoding="async">` : "";
  const yr = t.year || (t.date ? t.date.slice(0, 4) : "TBA");
  return `<div class="poster${lk ? " lock" : ""}${img ? " has-img" : ""}" style="--g:${g}">${img}<div class="pg"><div class="pg-top"><span>${KIND[t.type]}</span><span class="pg-emb">${emb(meta.emblem)}</span></div><div><div class="pg-title"${langAttr(t.lbl || t.name)}>${esc(lk ? "Spoiler" : t.lbl || shortName(t))}</div><div class="pg-year">${yr}</div></div></div></div>`;
}
document.addEventListener("error", (e) => { if (e.target.tagName === "IMG" && e.target.closest(".poster,.m-bg")) { const p = e.target.closest(".poster"); if (p) p.classList.remove("has-img"); e.target.remove(); } }, true);
document.addEventListener("load", (e) => { if (e.target.tagName === "IMG" && e.target.closest(".poster,.m-bg")) e.target.classList.add("in"); }, true);
/* Görsel sunucusuna erişim var mı? (Bazı önizleme ortamları dış görselleri engeller; o zaman tipografik kapaklar kullanılır.) */
function probeImages() {
  const first = Object.values(DB).flatMap((M) => M.titles).find((t) => t.poster);
  if (!first) return;
  const im = new Image();
  im.onload = () => {
    IMG_OK = true; document.body.classList.add("img-ok"); refreshQuiet(); renderNext(); renderTicker();
    if (!$("#modal").hidden) { const [u, id] = decodeURIComponent(location.hash.slice(1)).split("~"); const sh = $("#modal .sheet"), y = sh.scrollTop; if (DB[u] && DB[u].nodes.has(id)) { const n = DB[u].nodes.get(id); n.kind === "title" ? openTitle(u, id, { noHash: true }) : openOther(u, id); sh.scrollTop = y; } }
  };
  im.onerror = () => { IMG_OK = false; };
  im.src = `${SITE.tmdbImageBase}w92${first.poster}`;
}

/* ================= YILDIZ ALANI ================= */
const Stars = (() => {
  const cv = $("#stars"), cx = cv.getContext("2d");
  let W = 0, H = 0, stars = [], warpAt = -1e9, col = "#ef4a52", running = false, visible = true;
  const mk = (any) => ({ x: Math.random() * 2 - 1, y: Math.random() * 2 - 1, z: any ? 0.08 + Math.random() * 0.92 : 1 });
  function size() {
    const r = cv.getBoundingClientRect(), dpr = Math.min(devicePixelRatio || 1, 2);
    W = r.width; H = r.height; cv.width = W * dpr; cv.height = H * dpr; cx.setTransform(dpr, 0, 0, dpr, 0, 0);
    stars = Array.from({ length: Math.min(420, (W * H / 3200) | 0) }, () => mk(true));
    if (reduce) draw(0);
  }
  const proj = (s) => [W / 2 + (s.x / s.z) * W * 0.5, H / 2 + (s.y / s.z) * H * 0.6];
  function draw(now) {
    const p = (now - warpAt) / 1400, w = p >= 0 && p < 1 ? Math.sin(Math.PI * p) ** 2 : 0, v = reduce ? 0 : 0.0005 + w * 0.032;
    cx.clearRect(0, 0, W, H);
    for (const s of stars) {
      const [px, py] = proj(s); s.z -= v;
      if (s.z <= 0.03) { Object.assign(s, mk(false)); continue; }
      const [x, y] = proj(s);
      if (x < -20 || x > W + 20 || y < -20 || y > H + 20) { Object.assign(s, mk(false)); continue; }
      const a = Math.min(1, (1 - s.z) * 1.15 + 0.06);
      if (w > 0.05) { cx.strokeStyle = col; cx.globalAlpha = a * w; cx.lineWidth = (1 - s.z) * 2.2 + 0.3; cx.beginPath(); cx.moveTo(px, py); cx.lineTo(x, y); cx.stroke(); }
      cx.globalAlpha = a * 0.85; cx.fillStyle = "#e3e8ff"; const r = (1 - s.z) * 1.7 + 0.25; cx.fillRect(x - r / 2, y - r / 2, r, r);
    }
    cx.globalAlpha = 1;
  }
  function loop(now) { if (!visible || reduce) { running = false; return; } draw(now); requestAnimationFrame(loop); }
  function start() { if (!running && !reduce) { running = true; requestAnimationFrame(loop); } }
  new IntersectionObserver((e) => { visible = e[0].isIntersecting; if (visible) start(); }).observe(cv);
  addEventListener("resize", () => { clearTimeout(size.t); size.t = setTimeout(size, 150); });
  return { init() { size(); start(); }, warp(c) { col = c; warpAt = performance.now(); start(); } };
})();

/* ================= HERO ================= */
let countTimer = null;
function renderHero() {
  const m = U.meta, idx = UNIS.findIndex((x) => x.id === U.id);
  document.body.style.setProperty("--u1", m.color);
  document.body.style.setProperty("--u2", m.color2);
  $("#hIdx").textContent = String(idx + 1).padStart(2, "0");
  $("#hTot").textContent = String(UNIS.length).padStart(2, "0");
  let i = 0;
  $("#hTitle").setAttribute("lang", m.lang || "tr");
  $("#hTitle").innerHTML = m.name.split(" ").map((w) => `<span class="w">${[...w].map((ch) => `<span class="ch" style="--i:${i++}">${esc(ch)}</span>`).join("")}</span>`).join(" ");
  $("#hTag").textContent = m.tagline;
  ["#hTag", ".hero-stats", ".hero-cta", "#nextCard"].forEach((s) => { const el = $(s); el.style.animation = "none"; void el.offsetWidth; el.style.animation = ""; });
  const st = U.stats, up = upcoming(U).length;
  const items = [["Film", st.film], ["Dizi", st.dizi], ["Kitap ve çizgi roman", st.kitap], ["Karakter", st.kar], ["Yakında", up]].filter((x) => x[1] > 0);
  $("#hStats").innerHTML = items.map(([l, n]) => `<div><dt>${l}</dt><dd data-n="${n}">0</dd></div>`).join("");
  $$("#hStats dd").forEach((dd) => {
    const n = +dd.dataset.n; if (reduce) { dd.textContent = n; return; }
    const t0 = performance.now(), dur = 900;
    const step = (now) => { const p = Math.min(1, (now - t0) / dur); dd.textContent = Math.round(n * (1 - Math.pow(1 - p, 3))); if (p < 1) requestAnimationFrame(step); };
    requestAnimationFrame(step);
  });
  const he = $("#heroEmblem"); he.innerHTML = emb(m.emblem); he.classList.remove("draw"); void he.offsetWidth; he.classList.add("draw");
  $$("[data-uni-emb]").forEach((e) => (e.innerHTML = emb(m.emblem)));
  $$("[data-uni-name]").forEach((e) => (e.textContent = m.short));
  document.title = `${m.short} · ${SITE.name || "Film Evreni Ağı"}`;
  renderNext();
}
function renderNext() {
  clearInterval(countTimer);
  const up = upcoming(U).filter((x) => x.date).sort(byDate);
  const el = $("#nextCard");
  let it = up[0], kicker = "Sıradaki";
  if (!it) { const last = [...U.titles].filter((t) => !t.fut).pop(); it = { u: U.id, t: last, date: last.date, label: null }; kicker = "Son çıkan"; }
  else if (it.label) kicker = "Yeni sezon";
  const t = it.t, d = it.date ? daysTo(it.date) : null;
  el.dataset.id = t.id;
  el.innerHTML = `${posterHTML(t)}<div style="min-width:0"><p class="next-k">${kicker}</p><h3${langAttr(t.lbl)}>${esc(t.lbl)}</h3><p class="sub">${esc(KIND[t.type])}${it.label ? " · " + esc(it.label) : ""} · ${esc(whenText(it))}</p>${d != null && d >= 0 ? `<div class="count" id="count" aria-label="Geri sayım"></div>` : `<p class="sub">${esc(t.g ? t.g.slice(0, 2).join(" · ") : "")}</p>`}</div>`;
  if (d != null && d >= 0) {
    const target = pd(it.date).getTime(), prev = {};
    const tick = () => {
      const s = Math.max(0, Math.floor((target - Date.now()) / 1000));
      const v = { Gün: Math.floor(s / 86400), Saat: Math.floor((s % 86400) / 3600), Dk: Math.floor((s % 3600) / 60), Sn: s % 60 };
      const c = $("#count"); if (!c) return;
      if (!c.children.length) c.innerHTML = Object.keys(v).map((k) => `<div><b data-k="${k}">${v[k]}</b><span>${k}</span></div>`).join("");
      Object.entries(v).forEach(([k, n]) => {
        if (prev[k] === n) return; prev[k] = n;
        const b = c.querySelector(`[data-k="${k}"]`); b.textContent = String(n).padStart(k === "Gün" ? 1 : 2, "0");
        if (!reduce) { b.classList.remove("tick"); void b.offsetWidth; b.classList.add("tick"); }
      });
    };
    tick(); countTimer = setInterval(tick, 1000);
  }
}
$("#nextCard").addEventListener("click", () => { const id = $("#nextCard").dataset.id; if (id) openTitle(U.id, id); });
$("#nextCard").addEventListener("pointermove", (e) => {
  if (!finePointer || reduce) return; const r = e.currentTarget.getBoundingClientRect();
  e.currentTarget.style.transform = `perspective(800px) rotateY(${((e.clientX - r.left) / r.width - 0.5) * 10}deg) rotateX(${-((e.clientY - r.top) / r.height - 0.5) * 8}deg)`;
});
$("#nextCard").addEventListener("pointerleave", (e) => { e.currentTarget.style.transform = ""; });

function renderTicker() {
  const all = Object.values(DB).flatMap(upcoming).filter((x) => x.date).sort(byDate).slice(0, 30);
  const html = all.map((it) => {
    const m = DB[it.u].meta, d = daysTo(it.date);
    return `<button type="button" class="tk" data-u="${it.u}" data-id="${it.t.id}"><span class="tk-d">${whenText(it, true)}</span><span class="tk-dot" style="background:${m.color}"></span><span class="tk-u">${esc(m.short)}</span><span class="tk-n">${esc(it.t.lbl)}${it.label ? " · " + esc(it.label) : ""}</span><span class="tk-c">${it.tent ? "~" : ""}${d} gün</span></button>`;
  }).join("");
  $("#tickerTrack").innerHTML = html + html.replace(/<button /g, '<button tabindex="-1" aria-hidden="true" ');
  $("#tickerTrack").style.animationDuration = Math.max(40, all.length * 5) + "s";
}
$("#tickerTrack").addEventListener("click", (e) => { const b = e.target.closest(".tk"); if (b) openTitle(b.dataset.u, b.dataset.id); });

/* ================= GALERİ / EVREN SEÇİCİ ================= */
const GROUPS = [["Süper kahraman", ["mcu", "dc", "xmen", "sv"]], ["Bilim kurgu", ["sw", "dune", "alien", "avatar", "apes"]], ["Fantastik", ["ww", "me", "got", "hg"]], ["Animasyon", ["pixar", "disney", "dreamworks", "illumination"]], ["Aksiyon", ["ff", "mi", "jw", "jp", "mv"]], ["Korku", ["conj", "rage"]]];
function ucardHTML(m, i) {
  const M = DB[m.id], n = M.titles.length, up = upcoming(M).length;
  return `<button type="button" class="ucard" role="listitem" data-u="${m.id}" style="--c1:${m.color};--i:${i}" aria-current="${m.id === U.id}"><span class="emb">${emb(m.emblem)}</span><h3${langAttr(m.short)}>${esc(m.short)}</h3><p>${esc(m.tagline)}</p><span class="meta"><span>${n} yapım</span>${up ? `<b>${up} yakında</b>` : ""}</span></button>`;
}
function renderGallery() {
  $("#gallery").innerHTML = UNIS.map(ucardHTML).join("");
  const seen = new Set(); let k = 0;
  $("#uniGrid").innerHTML = GROUPS.map(([g, ids]) => {
    const ms = ids.map((id) => UNIS.find((x) => x.id === id)).filter(Boolean); ms.forEach((m) => seen.add(m.id));
    return `<section class="ug"><h3 class="ug-h">${esc(g)}</h3><div class="uni-grid">${ms.map((m) => ucardHTML(m, k++)).join("")}</div></section>`;
  }).join("") + (UNIS.some((m) => !seen.has(m.id)) ? `<section class="ug"><h3 class="ug-h">Diğer</h3><div class="uni-grid">${UNIS.filter((m) => !seen.has(m.id)).map((m) => ucardHTML(m, k++)).join("")}</div></section>` : "");
  const total = Object.values(DB).reduce((s, M) => s + M.titles.length, 0);
  $("#galSub").textContent = `${UNIS.length} evren · ${total} yapım · veri ${fmtD(SITE.dataUpdated || "2026-10-14")} tarihinde güncellendi`;
}
function markGallery() { $$(".ucard").forEach((c) => c.setAttribute("aria-current", c.dataset.u === U.id)); }
["#gallery", "#uniGrid"].forEach((s) => {
  const el = $(s);
  el.addEventListener("click", (e) => {
    const c = e.target.closest(".ucard"); if (!c) return;
    if (s === "#uniGrid") closeModal($("#uniModal"));
    setUniverse(c.dataset.u, { scroll: true });
  });
  el.addEventListener("pointermove", (e) => {
    const c = e.target.closest(".ucard"); if (!c || !finePointer || reduce) return;
    const r = c.getBoundingClientRect(), px = (e.clientX - r.left) / r.width, py = (e.clientY - r.top) / r.height;
    c.style.setProperty("--ry", (px - 0.5) * 12 + "deg"); c.style.setProperty("--rx", -(py - 0.5) * 10 + "deg");
    c.style.setProperty("--mx", px * 100 + "%"); c.style.setProperty("--my", py * 100 + "%");
  });
  el.addEventListener("pointerout", (e) => { const c = e.target.closest(".ucard"); if (c && !c.contains(e.relatedTarget)) { c.style.setProperty("--rx", "0deg"); c.style.setProperty("--ry", "0deg"); } });
});
$$("[data-gal]").forEach((b) => b.addEventListener("click", () => $("#gallery").scrollBy({ left: +b.dataset.gal * 480, behavior: reduce ? "auto" : "smooth" })));
$$("[data-open-unis]").forEach((b) => b.addEventListener("click", () => openModal($("#uniModal"))));

/* ================= SPOILER ================= */
function fillSpoiler() {
  const cur = spoilIdx();
  const opts = `<option value="-1">Kapalı · her şeyi göster</option>` + U.titles.filter((t) => !t.fut).map((t) => `<option value="${t.rel}"${t.rel === cur ? " selected" : ""}>${t.rel + 1}. ${esc(t.lbl)} (${t.year})'e kadar izledim</option>`).join("");
  $$(".spoil-select").forEach((s) => (s.innerHTML = opts));
  document.body.classList.toggle("spoil-on", cur !== Infinity);
}
document.addEventListener("change", (e) => {
  if (!e.target.classList.contains("spoil-select")) return;
  const v = +e.target.value; prefs.spoil = prefs.spoil || {};
  if (v < 0) delete prefs.spoil[U.id]; else prefs.spoil[U.id] = v;
  store.set("fea.prefs", prefs); revealed = new Set();
  $$(".spoil-select").forEach((s) => (s.value = String(v)));
  document.body.classList.toggle("spoil-on", v >= 0);
  refreshAll();
  toast(v < 0 ? "Spoiler kalkanı kapalı" : "Bu noktadan sonrası gizlendi");
});
function refreshAll() { Object.keys(stale).forEach((k) => (stale[k] = true)); renderView(); }

/* ================= MENÜLER ================= */
function setView(v, opts = {}) {
  if (!VIEWS[v]) v = "map";
  view = v;
  $$("[data-v]").forEach((b) => b.setAttribute("aria-pressed", b.dataset.v === v));
  moveIndicator();
  renderView();
  if (opts.scroll) $("#icerik").scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
}
function moveIndicator() {
  const nav = $("#vnav"), b = nav && nav.querySelector(`[data-v="${view}"]`), ind = $("#vnavInd");
  if (!b || !ind || !nav.offsetParent) return;
  ind.style.width = b.offsetWidth + "px"; ind.style.transform = `translateX(${b.offsetLeft}px)`;
}
addEventListener("resize", moveIndicator);
if (document.fonts && document.fonts.ready) document.fonts.ready.then(moveIndicator);
if (window.ResizeObserver) new ResizeObserver(() => moveIndicator()).observe($("#vnav"));
function renderView() {
  Object.keys(VIEWS).forEach((v) => ($("#v-" + v).hidden = v !== view));
  $("#vTitle").textContent = VIEWS[view][0];
  $("#vDesc").textContent = VIEWS[view][1];
  if (stale[view]) {
    stale[view] = false;
    ({ map: renderMap, time: renderTimeline, guide: renderGuide, chars: renderChars, soon: renderSoon })[view]();
  }
  const el = $("#v-" + view); el.classList.remove("enter"); void el.offsetWidth; el.classList.add("enter");
}
document.addEventListener("click", (e) => {
  const vb = e.target.closest("[data-v]"); if (vb && !vb.closest(".seg")) { e.preventDefault(); closeAllModals(); closePops(); setView(vb.dataset.v, { scroll: true }); return; }
  const g = e.target.closest("[data-goto]"); if (g) { e.preventDefault(); closeAllModals(); closePops(); setView(g.dataset.goto, { scroll: true }); return; }
  const s = e.target.closest("[data-scroll]"); if (s) { e.preventDefault(); closePops(); $("#" + s.dataset.scroll).scrollIntoView({ behavior: reduce ? "auto" : "smooth" }); }
  const p = e.target.closest("[data-page]"); if (p) { e.preventDefault(); closePops(); openPage(p.dataset.page); }
  const c = e.target.closest("[data-copy]"); if (c) copyText(c.dataset.copy);
  const t = e.target.closest("[data-top]"); if (t) scrollTo({ top: 0, behavior: reduce ? "auto" : "smooth" });
  const h = e.target.closest("[data-home]"); if (h) { e.preventDefault(); closeAllModals(); scrollTo({ top: 0, behavior: reduce ? "auto" : "smooth" }); }
  const rc = e.target.closest("[data-reset-consent]"); if (rc) { store.set("fea.consent", null); $("#cookie").hidden = false; toast("Çerez tercihi sıfırlandı"); }
  const ad = e.target.closest("[data-admin]"); if (ad) { e.preventDefault(); closeAllModals(); closePops(); openAdmin(); }
  const ins = e.target.closest("[data-install]"); if (ins) installApp();
  const se = e.target.closest("[data-search]"); if (se) { closeAllModals(); closePops(); openSearch(); }
  const sh = e.target.closest("[data-sheet]"); if (sh) { closePops(); openModal($("#" + sh.dataset.sheet)); }
  if (!e.target.closest(".pop,[data-pop]")) closePops();
});
/* Masaüstü açılır menüleri */
function closePops() { $$(".pop:not([hidden])").forEach((p) => { p.hidden = true; const b = $(`[data-pop="${p.id}"]`); if (b) b.setAttribute("aria-expanded", "false"); }); }
$$("[data-pop]").forEach((b) => b.addEventListener("click", (e) => {
  e.stopPropagation();
  const p = $("#" + b.dataset.pop), open = p.hidden;
  closePops();
  if (!open) return;
  p.hidden = false; b.setAttribute("aria-expanded", "true");
  const r = b.getBoundingClientRect();
  p.style.top = r.bottom + 10 + "px";
  p.style.right = Math.max(12, innerWidth - r.right) + "px";
  const f = p.querySelector("select,button,a"); if (f) f.focus({ preventScroll: true });
}));
function renderMoreMenus() {
  const groups = {};
  PAGES.filter((p) => p.footer !== false).sort((a, b) => (a.order || 0) - (b.order || 0)).forEach((p) => (groups[p.group] = groups[p.group] || []).push(p));
  const list = Object.entries(groups).map(([g, ps]) => `<div class="mm-g"><h4>${esc(g)}</h4>${ps.map((p) => `<button type="button" class="mm-i" data-page="${esc(p.key)}">${esc(p.title)}</button>`).join("")}</div>`).join("");
  $("#morePages").innerHTML = list;
  $("#sheetPages").innerHTML = list;
  $("#fCorp").innerHTML = (groups["Kurumsal"] || []).map((p) => `<li><button type="button" data-page="${esc(p.key)}">${esc(p.title)}</button></li>`).join("");
  $("#fLegal").innerHTML = (groups["Yasal"] || []).map((p) => `<li><button type="button" data-page="${esc(p.key)}">${esc(p.title)}</button></li>`).join("");
}

/* ================= EVREN DEĞİŞTİR ================= */
function setUniverse(id, opts = {}) {
  if (!DB[id]) id = UNIS[0].id;
  const changed = !U || U.id !== id;
  U = DB[id];
  if (changed) {
    prefs.u = id; store.set("fea.prefs", prefs);
    revealed = new Set(); route = null;
    Object.keys(stale).forEach((k) => (stale[k] = true));
    Stars.warp(U.meta.color);
    renderHero(); fillSpoiler(); markGallery(); fillGuideTargets();
    renderView();
    if (!opts.keepHash) history.replaceState(null, "", "#" + id);
  }
  if (opts.scroll) scrollTo({ top: 0, behavior: reduce ? "auto" : "smooth" });
}

/* ================= HARİTA ================= */
const mapSvg = d3.select("#map");
let MAP = null, MAP_V = {};
const LINK_TYPES = ["devam", "bagli", "uyarlama", "gonderme"];
function wrap2(s, max) {
  if (s.length <= max) return [s];
  const words = s.split(" "); let a = "";
  while (words.length && (a + " " + words[0]).trim().length <= max) a = (a + " " + words.shift()).trim();
  if (!a) return [s.slice(0, max - 1) + "…"];
  let b = words.join(" ");
  if (b.length > max) b = b.slice(0, max - 1) + "…";
  return [a, b];
}
function renderMap() {
  const wrapEl = $("#mapWrap"), W = wrapEl.clientWidth || 900;
  const vertical = W < 700;
  wrapEl.classList.toggle("h", !vertical);
  const T = U.titles, L = U.lanes, nL = L.length;
  let pos, lanePos, width, height, today = null, blocks = [];
  const lastRel = T.filter((t) => !t.fut).length - 1;
  if (!vertical) {
    const colW = 92, laneH = 80, left = 200, top = 70, gap = 18;
    const colOf = new Map(); let col = 0;
    T.forEach((t) => {
      const key = (t.year ?? 9999) + (t.fut ? "f" : "r");
      let b = blocks[blocks.length - 1];
      if (!b || b.key !== key) blocks.push((b = { key, year: t.year, fut: t.fut, start: col, cnt: {}, w: 0 }));
      const k = b.cnt[t.lane] || 0; b.cnt[t.lane] = k + 1;
      colOf.set(t.id, [b.start + k, blocks.length - 1]);
      b.w = Math.max(b.w, k + 1); col = b.start + b.w;
    });
    const xc = (c, bi) => left + c * colW + bi * gap + colW / 2;
    blocks.forEach((b, i) => (b.x = xc(b.start, i) - colW / 2 - gap / 2));
    pos = (t) => { const [c, bi] = colOf.get(t.id); return { x: xc(c, bi), y: top + U.laneOf.get(t.lane).i * laneH + 24 }; };
    lanePos = (l) => ({ y: top + l.i * laneH + 24 });
    width = left + col * colW + blocks.length * gap + 60; height = top + nL * laneH + 10;
    const fb = blocks.findIndex((b) => b.fut);
    if (fb > 0) today = blocks[fb].x;
  } else {
    const rowH = 54, top = 30, left = 46, laneW = Math.max(14, Math.min(26, (W * 0.42) / nL));
    pos = (t) => ({ x: left + U.laneOf.get(t.lane).i * laneW + laneW / 2, y: top + t.rel * rowH + rowH / 2 });
    lanePos = (l) => ({ x: left + l.i * laneW + laneW / 2 });
    width = W; height = top + T.length * rowH + 24;
    MAP_V = { left, laneW, labelX: left + nL * laneW + 12, rowH, top };
    if (lastRel >= 0 && lastRel < T.length - 1) today = top + (lastRel + 1) * rowH;
  }
  mapSvg.selectAll("*").remove();
  mapSvg.attr("viewBox", vertical ? `0 0 ${width} ${height}` : null).attr("height", vertical ? height : null);
  const root = mapSvg.append("g").attr("class", "root");
  const P = new Map(T.map((t) => [t.id, pos(t)]));
  const axis = root.append("g");
  let lastY = null, lastMark = -1e9;
  if (!vertical) blocks.forEach((b) => {
    if (b.year === lastY && b.fut) return; lastY = b.year;
    axis.append("line").attr("class", "yr-line").attr("x1", b.x).attr("x2", b.x).attr("y1", 44).attr("y2", height);
    if (b.x - lastMark >= 44) { axis.append("text").attr("class", "yr").attr("x", b.x + 6).attr("y", 40).text(b.year || "TBA"); lastMark = b.x; }
  });
  else T.forEach((t) => {
    const p = P.get(t.id); if (t.year === lastY) return; lastY = t.year;
    if (p.y - lastMark < 22) return; lastMark = p.y;
    axis.append("line").attr("class", "yr-line").attr("x1", 0).attr("x2", width).attr("y1", p.y - MAP_V.rowH / 2).attr("y2", p.y - MAP_V.rowH / 2);
    axis.append("text").attr("class", "yr").attr("x", 4).attr("y", p.y + 4).text(t.year || "TBA");
  });
  if (today != null) {
    if (!vertical) {
      axis.append("line").attr("class", "today-line").attr("x1", today).attr("x2", today).attr("y1", 50).attr("y2", height);
      axis.append("text").attr("class", "today-lbl").attr("x", today + 6).attr("y", 58).text("BUGÜN · YAKINDA →");
    } else {
      axis.append("line").attr("class", "today-line").attr("x1", 0).attr("x2", width).attr("y1", today).attr("y2", today);
      axis.append("text").attr("class", "today-lbl").attr("x", width - 8).attr("y", today - 6).attr("text-anchor", "end").text("BUGÜN ↓ YAKINDA");
    }
  }
  const lanesG = root.append("g");
  L.forEach((l0) => {
    const l = U.laneOf.get(l0.id), st = T.filter((t) => t.lane === l.id);
    if (!st.length) return;
    const lp = lanePos(l);
    lanesG.append("line").attr("stroke", l.color).attr("stroke-opacity", 0.12).attr("stroke-width", 1)
      .attr("x1", vertical ? lp.x : 200).attr("x2", vertical ? lp.x : width - 20).attr("y1", vertical ? 30 : lp.y).attr("y2", vertical ? height - 10 : lp.y);
    const rel = st.filter((t) => !t.fut), fut = st.filter((t) => t.fut);
    const seg = (arr, cls) => { if (arr.length < 2) return; const a = P.get(arr[0].id), b = P.get(arr[arr.length - 1].id); lanesG.append("line").attr("class", "lane-line " + cls + (l.src ? " src" : "")).attr("stroke", l.color).attr("x1", a.x).attr("y1", a.y).attr("x2", b.x).attr("y2", b.y); };
    seg(rel, "");
    if (fut.length) seg(rel.length ? [rel[rel.length - 1], ...fut] : fut, "fut");
  });
  const linksG = root.append("g").attr("class", "links");
  U.links.filter((k) => LINK_TYPES.includes(k.type)).forEach((k) => {
    const a = P.get(k.s), b = P.get(k.t); if (!a || !b) return;
    const sameLane = U.nodes.get(k.s).lane === U.nodes.get(k.t).lane;
    if (k.type === "devam" && sameLane && Math.abs(U.nodes.get(k.s).rel - U.nodes.get(k.t).rel) === 1) return;
    let d;
    if (!vertical) {
      if (sameLane) { const h = Math.min(60, 18 + Math.abs(b.x - a.x) * 0.12); d = `M${a.x},${a.y}C${a.x},${a.y - h} ${b.x},${b.y - h} ${b.x},${b.y}`; }
      else { const mx = (a.x + b.x) / 2; d = `M${a.x},${a.y}C${mx},${a.y} ${mx},${b.y} ${b.x},${b.y}`; }
    } else {
      if (sameLane) { const w = Math.min(40, 12 + Math.abs(b.y - a.y) * 0.08); d = `M${a.x},${a.y}C${a.x - w},${a.y} ${b.x - w},${b.y} ${b.x},${b.y}`; }
      else { const my = (a.y + b.y) / 2; d = `M${a.x},${a.y}C${a.x},${my} ${b.x},${my} ${b.x},${b.y}`; }
    }
    linksG.append("path").attr("class", `lnk lnk-${k.type}`).attr("d", d).attr("data-s", k.s).attr("data-t", k.t).append("title").text(k.note || `${U.nodes.get(k.s).name} → ${U.nodes.get(k.t).name}`);
  });
  root.append("g").attr("class", "routeG");
  const stG = root.append("g");
  T.forEach((t) => {
    const p = P.get(t.id), l = U.laneOf.get(t.lane), lk = locked(t);
    const g = stG.append("g").attr("class", `st k-${t.type}${t.fut ? " fut" : ""}${lk ? " locked" : ""}`).attr("transform", `translate(${p.x},${p.y})`)
      .attr("data-id", t.id).attr("tabindex", 0).attr("role", "button").attr("aria-label", `${KIND[t.type]}: ${lk ? "Spoiler" : t.name}, ${t.year || "tarih yok"}`)
      .style("--sc", l.color).style("animation", reduce ? null : `stIn .6s ${Math.min(t.rel * 10, 700)}ms both`);
    g.append("circle").attr("class", "ring").attr("r", 9);
    if (t.type === "dizi") g.append("rect").attr("class", "dot").attr("x", -7.5).attr("y", -7.5).attr("width", 15).attr("height", 15).attr("rx", 4).attr("stroke", l.color);
    else if (isSrc(t)) g.append("rect").attr("class", "dot").attr("x", -6).attr("y", -6).attr("width", 12).attr("height", 12).attr("transform", "rotate(45)").attr("stroke", l.color);
    else g.append("circle").attr("class", "dot").attr("r", 8).attr("stroke", l.color);
    const name = lk ? "Spoiler" : t.lbl;
    if (!vertical) wrap2(name, 14).forEach((ln, i) => g.append("text").attr("class", "lbl").attr("text-anchor", "middle").attr("y", 26 + i * 14).text(ln));
    else {
      const maxCh = Math.max(8, Math.floor((width - MAP_V.labelX - 8) / 6.6)), lx = MAP_V.labelX - p.x;
      g.append("line").attr("class", "leader").attr("x1", 10).attr("x2", lx - 4).attr("y1", 0).attr("y2", 0);
      g.append("text").attr("class", "lbl").attr("x", lx).attr("y", 4).text(name.length > maxCh ? name.slice(0, maxCh - 1) + "…" : name);
    }
  });
  const laneLbl = mapSvg.append("g").attr("class", "laneLbl");
  if (!vertical) {
    laneLbl.append("rect").attr("class", "lane-lbl-bg").attr("x", 0).attr("y", 0).attr("width", 186).attr("height", height).attr("opacity", 0.92);
    L.forEach((l0) => {
      const l = U.laneOf.get(l0.id), y = lanePos(l).y;
      laneLbl.append("rect").attr("x", 14).attr("y", y - 3).attr("width", 16).attr("height", 6).attr("rx", 3).attr("fill", l.color).attr("opacity", l.src ? 0.6 : 1);
      laneLbl.append("text").attr("class", "lane-lbl").attr("x", 38).attr("y", y + 4).text(l.name.length > 22 ? l.name.slice(0, 21) + "…" : l.name);
    });
  }
  MAP = { root, P, vertical, width, height, today, laneLbl };
  stG.selectAll(".st")
    .on("mouseenter", function (e) { const id = this.dataset.id; hl(id); showTip(e, U.nodes.get(id)); })
    .on("mousemove", (e) => moveTip(e))
    .on("mouseleave", () => { hl(null); hideTip(); })
    .on("focus", function () { hl(this.dataset.id); })
    .on("blur", () => hl(null))
    .on("click", function (e) { e.stopPropagation(); hideTip(); openTitle(U.id, this.dataset.id); })
    .on("keydown", function (e) { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); openTitle(U.id, this.dataset.id); } });
  mapSvg.classed("all-links", $("#allLinks").checked);
  if (!vertical) {
    const H = $("#map").clientHeight || 600;
    const zoom = d3.zoom().scaleExtent([0.3, 2.2])
      .filter((e) => (e.type === "wheel" ? e.ctrlKey || e.metaKey : !e.button))
      .translateExtent([[-200, -100], [width + 200, height + 200]])
      .on("zoom", (e) => { root.attr("transform", e.transform); laneLbl.attr("transform", `translate(0,${e.transform.y}) scale(${e.transform.k})`); });
    mapSvg.call(zoom).on("dblclick.zoom", null);
    mapSvg.on("wheel.pan", (e) => {
      if (e.ctrlKey || e.metaKey) return;
      if (Math.abs(e.deltaX) > Math.abs(e.deltaY) || e.shiftKey) { e.preventDefault(); mapSvg.call(zoom.translateBy, -(e.shiftKey ? e.deltaY : e.deltaX) / d3.zoomTransform(mapSvg.node()).k, 0); }
    });
    MAP.zoom = zoom;
    const k = Math.max(0.42, Math.min(1, H / (height + 20)));
    const fx = today != null ? today : width;
    const tx = Math.min(0, Math.max(W - width * k, W * 0.62 - fx * k));
    mapSvg.call(zoom.transform, d3.zoomIdentity.translate(tx, (H - height * k) / 2).scale(k));
    $("#mapHint").textContent = "Sürükle: kaydır · Ctrl + tekerlek: yakınlaştır · Bir durağa tıkla";
  } else {
    mapSvg.on(".zoom", null).on("wheel.pan", null);
    $("#mapHint").textContent = "";
  }
  $("#zoomBtns").hidden = vertical;
  renderRouteChips(); renderLegend();
  if (route) drawRoute(route, false);
}
function hl(id) {
  if (!MAP) return;
  if (!id && route) { drawRoute(route, false); return; }
  mapSvg.selectAll(".lnk").classed("on", false);
  mapSvg.selectAll(".st").classed("hl", false);
  if (!id) { mapSvg.classed("dim", false); return; }
  const nb = U.adj.get(id) || new Set();
  mapSvg.classed("dim", true);
  mapSvg.selectAll(".st").classed("hl", function () { return this.dataset.id === id || nb.has(this.dataset.id); });
  mapSvg.selectAll(".lnk").classed("on", function () { return this.dataset.s === id || this.dataset.t === id; });
}
function renderRouteChips() {
  const top = U.charOrder.slice(0, 14);
  $("#route").innerHTML = `<span class="route-l">Rota çiz</span>` + top.map((c, i) => `<button type="button" class="rchip" data-c="${c.id}" aria-pressed="${route === c.id}" style="--rc:${LANE_COLORS[i % LANE_COLORS.length]}"><span class="av" style="--a:${i * 40}deg"><span>${esc(initials(c.name))}</span></span>${esc(locked(c) ? "Spoiler" : c.name.split(" / ")[0])}</button>`).join("");
}
$("#route").addEventListener("click", (e) => {
  const b = e.target.closest(".rchip"); if (!b) return;
  route = route === b.dataset.c ? null : b.dataset.c;
  $$("#route .rchip").forEach((x) => x.setAttribute("aria-pressed", x.dataset.c === route));
  if (route) drawRoute(route, true); else { mapSvg.select(".routeG").selectAll("*").remove(); hl(null); }
});
function drawRoute(cid, animate) {
  if (!MAP) return;
  const c = U.nodes.get(cid); if (!c) return;
  const idx = U.charOrder.indexOf(c), col = LANE_COLORS[idx % LANE_COLORS.length];
  const apps = c.app.map(([tid, role]) => ({ n: U.nodes.get(tid), role })).sort((a, b) => a.n.rel - b.n.rel);
  const pts = apps.map((a) => [MAP.P.get(a.n.id).x, MAP.P.get(a.n.id).y]);
  const g = mapSvg.select(".routeG"); g.selectAll("*").remove();
  const path = g.append("path").attr("class", "route-path").attr("stroke", col).style("color", col).attr("d", d3.line().curve(d3.curveCatmullRom.alpha(0.5))(pts));
  if (animate && !reduce) { const len = path.node().getTotalLength(); path.attr("stroke-dasharray", len).attr("stroke-dashoffset", len).transition().duration(1400).ease(d3.easeCubicInOut).attr("stroke-dashoffset", 0); }
  const ids = new Set(apps.map((a) => a.n.id));
  mapSvg.classed("dim", true);
  mapSvg.selectAll(".st").classed("hl", function () { return ids.has(this.dataset.id); });
  mapSvg.selectAll(".lnk").classed("on", false);
  if (animate && !MAP.vertical && MAP.zoom) {
    const xs = pts.map((p) => p[0]), W = $("#map").clientWidth, H = $("#map").clientHeight;
    const k = Math.max(0.3, Math.min(1, (W - 260) / (Math.max(...xs) - Math.min(...xs) + 200), H / (MAP.height + 20)));
    const cx = (Math.min(...xs) + Math.max(...xs)) / 2;
    mapSvg.transition().duration(reduce ? 0 : 900).ease(d3.easeCubicInOut).call(MAP.zoom.transform, d3.zoomIdentity.translate(W / 2 + 80 - cx * k, (H - MAP.height * k) / 2).scale(k));
  }
  if (animate) toast(`${c.name.split(" / ")[0]} · ${apps.length} yapım`);
}
$("#allLinks").addEventListener("change", (e) => mapSvg.classed("all-links", e.target.checked));
$("#zoomBtns").addEventListener("click", (e) => {
  const b = e.target.closest("[data-zoom]"); if (!b || !MAP || !MAP.zoom) return;
  const W = $("#map").clientWidth, H = $("#map").clientHeight, z = b.dataset.zoom, dur = reduce ? 0 : 600;
  if (z === "in") mapSvg.transition().duration(dur).call(MAP.zoom.scaleBy, 1.35);
  else if (z === "out") mapSvg.transition().duration(dur).call(MAP.zoom.scaleBy, 1 / 1.35);
  else if (z === "fit") { const k = Math.min(W / (MAP.width + 20), H / (MAP.height + 20)); mapSvg.transition().duration(dur).call(MAP.zoom.transform, d3.zoomIdentity.translate((W - MAP.width * k) / 2, (H - MAP.height * k) / 2).scale(k)); }
  else if (z === "today") { const k = d3.zoomTransform(mapSvg.node()).k, fx = MAP.today ?? MAP.width; mapSvg.transition().duration(dur).call(MAP.zoom.transform, d3.zoomIdentity.translate(W * 0.6 - fx * k, (H - MAP.height * k) / 2).scale(k)); }
});
function renderLegend() {
  const items = [["Devam (şerit dışı)", '<path d="M0 6H26" stroke="#fff" stroke-width="1.8"/>'], ["Bağlantılı", '<path d="M0 6H26" stroke="var(--u2)" stroke-width="1.8" stroke-dasharray="6 5"/>'], ["Uyarlama", '<path d="M0 6H26" stroke="#9aa6c9" stroke-width="1.8" stroke-dasharray="2 4"/>'], ["Gönderme", '<path d="M1 6H26" stroke="#c49bff" stroke-width="2.4" stroke-dasharray="1 5" stroke-linecap="round"/>']];
  const shapes = `<span><svg viewBox="0 0 26 12"><circle cx="13" cy="6" r="5" fill="none" stroke="var(--text)" stroke-width="2"/></svg>Film</span><span><svg viewBox="0 0 26 12"><rect x="8" y="1" width="10" height="10" rx="3" fill="none" stroke="var(--text)" stroke-width="2"/></svg>Dizi</span><span><svg viewBox="0 0 26 12"><rect x="9" y="2" width="8" height="8" transform="rotate(45 13 6)" fill="none" stroke="var(--text)" stroke-width="2"/></svg>Kitap / çizgi roman</span><span><svg viewBox="0 0 26 12"><circle cx="13" cy="6" r="5" fill="none" stroke="var(--text)" stroke-width="2" stroke-dasharray="3 3"/></svg>Yakında</span>`;
  const lanes = MAP && MAP.vertical ? U.lanes.map((l) => `<span><svg viewBox="0 0 26 12"><rect x="2" y="3" width="22" height="6" rx="3" fill="${l.color}"/></svg>${esc(l.name)}</span>`).join("") : "";
  $("#legend").innerHTML = shapes + items.map(([l, s]) => `<span><svg viewBox="0 0 26 12">${s}</svg>${l}</span>`).join("") + lanes;
}
const tipEl = $("#tip");
function showTip(e, n) {
  if (!finePointer || !n) return;
  const lk = locked(n), l = U.laneOf.get(n.lane);
  tipEl.innerHTML = `${posterHTML(n, { lock: lk, size: "w185" })}<div style="min-width:0"><b>${esc(lk ? "Spoiler" : n.name)}</b>${n.tr && !lk ? `<small>${esc(n.tr)}</small>` : ""}<small>${KIND[n.type]} · ${titleDate(n)}</small><small style="color:${l.color}">${esc(l.name)}</small>${n.fut && n.date ? `<small style="color:var(--u1)">${daysTo(n.date)} gün sonra</small>` : ""}</div>`;
  tipEl.hidden = false; moveTip(e);
}
function moveTip(e) { if (tipEl.hidden) return; const w = 270, h = tipEl.offsetHeight; let x = e.clientX + 16, y = e.clientY + 16; if (x + w > innerWidth) x = e.clientX - w - 12; if (y + h > innerHeight) y = e.clientY - h - 12; tipEl.style.left = x + "px"; tipEl.style.top = y + "px"; }
function hideTip() { tipEl.hidden = true; }

/* ================= ZAMAN ÇİZELGESİ ================= */
function tlTypes() {
  const has = { film: U.stats.film, dizi: U.stats.dizi, kitap: U.stats.kitap };
  const opts = [["all", "Tümü"], ["film", "Film"], ["dizi", "Dizi"], ["kitap", "Kitap"]].filter(([k]) => k === "all" || has[k]);
  if (!opts.some(([k]) => k === tlType)) tlType = "all";
  $("#tlTypes").innerHTML = opts.map(([k, l]) => `<button type="button" data-t="${k}" aria-pressed="${k === tlType}">${l}</button>`).join("");
}
let TL = null;
function renderTimeline() {
  tlTypes();
  const sc = $("#tlScroll"), vertical = sc.clientWidth < 700, track = $("#track");
  $$(".tcard,.rail", track).forEach((x) => x.remove());
  const CW = vertical ? 64 : 150, STEP = vertical ? 120 : 172, ARC_H = vertical ? 0 : 170, TOP = vertical ? 0 : ARC_H + 22;
  TL = { vertical, CW, STEP, ARC_H, TOP };
  const rail = document.createElement("div"); rail.className = "rail";
  if (vertical) Object.assign(rail.style, { left: "4px", right: "auto", top: "0", bottom: "0", width: "1px", height: "auto", background: "linear-gradient(transparent,var(--line2) 2%,var(--line2) 98%,transparent)" });
  else rail.style.top = ARC_H + 4 + "px";
  track.appendChild(rail);
  U.titles.forEach((t) => {
    const c = document.createElement("button"); c.type = "button"; c.className = "tcard"; c.dataset.id = t.id;
    c.style.setProperty("--sc", U.laneOf.get(t.lane).color);
    if (vertical) c.style.cssText += `;display:grid;grid-template-columns:${CW}px minmax(0,1fr);gap:14px;align-items:center;width:calc(100% - 22px);left:22px`;
    else c.style.width = CW + "px";
    c.innerHTML = `${posterHTML(t, { lock: locked(t), size: vertical ? "w185" : "w342" })}<div class="tc-txt"><div class="tc-big"></div><div class="tc-name"></div><div class="tc-meta"></div></div>`;
    track.appendChild(c);
  });
  track.classList.toggle("tl-v", vertical);
  layoutTimeline(true);
}
function tlOrder() {
  let arr = U.titles.filter((t) => tlType === "all" || (tlType === "kitap" ? isSrc(t) : t.type === tlType));
  if (tlMode === "chrono") arr = arr.filter((t) => t.c != null).sort((a, b) => a.c - b.c || a.rel - b.rel);
  return arr;
}
function layoutTimeline(instant) {
  if (!TL) return;
  const { vertical, CW, STEP, TOP } = TL, track = $("#track");
  const ord = tlOrder(), pos = new Map(ord.map((t, i) => [t.id, i])), anim = !instant && !reduce;
  $("#arcs").classList.add("out");
  const n = ord.length;
  if (vertical) { track.style.height = n * STEP + "px"; track.style.width = ""; }
  else { track.style.width = Math.max(n, 1) * STEP + "px"; track.style.height = TOP + CW * 1.5 + 100 + "px"; }
  $$(".tcard", track).forEach((c) => {
    const t = U.nodes.get(c.dataset.id), i = pos.get(t.id), lk = locked(t), shown = i != null;
    c.classList.toggle("gone", !shown); c.classList.toggle("locked", lk);
    c.tabIndex = shown ? 0 : -1;
    c.setAttribute("aria-label", lk ? "Spoiler" : t.name);
    const k = shown ? i : (c._last ?? 0); c._last = k;
    c.style.transitionDuration = anim ? "" : "0ms";
    c.style.transitionDelay = anim ? Math.min(k * 22, 600) + "ms" : "0ms";
    c.style.transform = vertical ? `translateY(${k * STEP}px)` : `translate(${k * STEP}px, ${TOP}px)`;
    const big = c.querySelector(".tc-big");
    const val = tlMode === "release" ? (t.date ? (t.fut && !t.tent ? fmtS(t.date) + " " + t.year : t.year) : "TBA") : t.cl || "—";
    const set = () => { big.textContent = val; big.classList.toggle("long", String(val).length > 7); big.classList.remove("swap"); if (anim) { void big.offsetWidth; big.classList.add("swap"); } };
    anim && shown ? setTimeout(set, Math.min(k * 22, 600) + 380) : set();
    c.querySelector(".tc-name").textContent = lk ? "Spoiler" : t.name;
    const rt = t.rt ? (t.type === "dizi" ? `≈ ${t.rt} dk` : `${t.rt} dk`) : t.eps || KIND[t.type];
    c.querySelector(".tc-meta").textContent = tlMode === "release" ? `${KIND[t.type]} · ${rt}` : `vizyon #${t.rel + 1} → kronoloji #${(i ?? 0) + 1}`;
  });
  clearTimeout(layoutTimeline.t);
  layoutTimeline.t = setTimeout(() => drawArcs(pos, anim), anim ? 900 + Math.min(n * 22, 600) * 0.6 : 0);
  if (tlMode === "chrono") {
    let best = null, bd = -1;
    const relOrder = U.titles.filter((x) => ord.includes(x));
    ord.forEach((t, i) => { const rank = relOrder.indexOf(t), d = Math.abs(rank - i); if (d > bd) { bd = d; best = { t, i, rank }; } });
    const hidden = U.titles.filter((t) => t.c == null).length;
    $("#insight").innerHTML = best ? `En büyük sıçrama: <b>${esc(dispName(best.t))}</b>, vizyonda ${best.rank + 1}. sırada, kronolojide ${best.i + 1}. sırada. <span class="mono">${esc(U.d.chronoLabel || "")}</span>${hidden ? ` · ${hidden} kaynak eser kronolojide gösterilmez.` : ""}` : "";
  } else $("#insight").innerHTML = `<b>${n} yapım</b> çıkış tarihine göre. Kronolojiye geçince kartlar evren içindeki yerlerine kayar.`;
}
function drawArcs(pos, anim) {
  const arcs = $("#arcs"); arcs.innerHTML = "";
  if (!TL || TL.vertical) { arcs.classList.remove("out"); return; }
  const { CW, STEP, ARC_H } = TL, n = pos.size, B = ARC_H + 4;
  arcs.setAttribute("width", n * STEP); arcs.setAttribute("height", ARC_H + 8);
  arcs.style.width = n * STEP + "px"; arcs.style.height = ARC_H + 8 + "px";
  let k = 0;
  U.links.filter((l) => LINK_TYPES.includes(l.type)).forEach((l) => {
    const a = pos.get(l.s), b = pos.get(l.t); if (a == null || b == null || a === b) return;
    const off = { devam: 0, bagli: 5, uyarlama: -5, gonderme: -9 }[l.type];
    const x1 = a * STEP + CW / 2 + off, x2 = b * STEP + CW / 2 + off, h = Math.min(ARC_H - 6, 22 + Math.abs(x2 - x1) * 0.16);
    const p = document.createElementNS(NS, "path");
    p.setAttribute("d", `M${x1},${B}C${x1},${B - h} ${x2},${B - h} ${x2},${B}`);
    p.setAttribute("class", `arc arc-${l.type}` + (locked(U.nodes.get(l.s)) || locked(U.nodes.get(l.t)) ? " lk" : ""));
    const tt = document.createElementNS(NS, "title"); tt.textContent = l.note || `${U.nodes.get(l.s).name} → ${U.nodes.get(l.t).name}`; p.appendChild(tt);
    arcs.appendChild(p);
    if (anim && l.type === "devam") { const len = p.getTotalLength(); p.style.strokeDasharray = len; p.style.strokeDashoffset = len; p.getBoundingClientRect(); p.style.transition = `stroke-dashoffset .9s ${Math.min(k++ * 40, 800)}ms cubic-bezier(.65,0,.25,1)`; p.style.strokeDashoffset = 0; }
  });
  arcs.classList.remove("out");
}
$("#tlMode").addEventListener("click", (e) => { const b = e.target.closest("button"); if (!b || b.dataset.m === tlMode) return; tlMode = b.dataset.m; $$("#tlMode button").forEach((x) => x.setAttribute("aria-pressed", x === b)); layoutTimeline(false); });
$("#tlTypes").addEventListener("click", (e) => { const b = e.target.closest("button"); if (!b || b.dataset.t === tlType) return; tlType = b.dataset.t; $$("#tlTypes button").forEach((x) => x.setAttribute("aria-pressed", x === b)); layoutTimeline(false); });
$("#track").addEventListener("click", (e) => { const c = e.target.closest(".tcard"); if (c) openTitle(U.id, c.dataset.id); });

/* ================= İZLEME REHBERİ ================= */
function defaultTarget() {
  const up = U.titles.filter((t) => t.fut && t.date && !isSrc(t)).sort((a, b) => a.rel - b.rel);
  const withDeps = (t) => U.d.edges.some((e) => e[1] === t.id && e[2] !== "gonderme");
  return (up.find(withDeps) || [...U.titles].reverse().find((t) => !t.fut && !isSrc(t) && withDeps(t)) || U.titles[U.titles.length - 1]).id;
}
function fillGuideTargets() {
  const sel = $("#gTarget");
  sel.innerHTML = U.lanes.map((l) => {
    const ts = U.titles.filter((t) => t.lane === l.id);
    return ts.length ? `<optgroup label="${esc(l.name)}">${ts.map((t) => `<option value="${t.id}">${esc(t.lbl)} (${t.year || "TBA"})</option>`).join("")}</optgroup>` : "";
  }).join("");
  sel.value = defaultTarget();
}
function deps(target, rec, books) {
  const E = U.d.edges, pred = (id, type) => E.filter((e) => e[1] === id && e[2] === type);
  const out = new Map();
  const chain = (id, lvl) => pred(id, "devam").forEach((e) => { if (e[0] !== target && !out.has(e[0])) { out.set(e[0], { lvl, why: e[3] || "Doğrudan öncesi", for: id }); chain(e[0], lvl); } });
  chain(target, 1);
  if (rec) [target, ...out.keys()].forEach((id) => pred(id, "bagli").forEach((e) => { if (e[0] !== target && !out.has(e[0])) { out.set(e[0], { lvl: 2, why: e[3] || "Bağlantılı hikâye", for: id }); chain(e[0], 2); } }));
  if (books) [target, ...out.keys()].forEach((id) => pred(id, "uyarlama").forEach((e) => { if (!out.has(e[0])) out.set(e[0], { lvl: 3, why: e[3] || "Uyarlandığı eser", for: id }); }));
  return out;
}
function renderGuide() {
  if (!U.nodes.has($("#gTarget").value)) $("#gTarget").value = defaultTarget();
  const target = $("#gTarget").value, ord = $("#gOrder").value;
  const dmap = deps(target, $("#gRec").checked, $("#gBooks").checked);
  const items = [...dmap].map(([id, i]) => ({ n: U.nodes.get(id), ...i }));
  const tn = U.nodes.get(target); items.push({ n: tn, target: true });
  const key = (x) => (ord === "chrono" && x.n.c != null ? x.n.c : x.n.rel + (ord === "chrono" ? 1e6 : 0));
  items.sort((a, b) => (!!a.target - !!b.target) || (ord === "release" ? a.n.rel - b.n.rel : key(a) - key(b)));
  const watch = items.filter((x) => !isSrc(x.n));
  const mins = watch.reduce((s, x) => s + (x.n.rt || 0), 0), unknown = watch.filter((x) => !x.n.rt).length, books = items.length - watch.length;
  const d = tn.date && tn.fut ? daysTo(tn.date) : null;
  $("#gOut").innerHTML = `<div class="g-hero"><p class="g-k">${items.length > 1 ? "Bunu izlemeden önce" : "Doğrudan başlayabilirsin"}</p><h2${langAttr(tn.name)}>${esc(dispName(tn))}</h2>
    <p class="g-stats"><span><b>${watch.length}</b> yapım</span>${books ? `<span><b>${books}</b> kaynak eser</span>` : ""}<span>Toplam <b>≈ ${Math.floor(mins / 60)} sa ${mins % 60} dk</b>${unknown ? ` (+${unknown} süresi belirsiz)` : ""}</span>${d != null ? `<span>Vizyona <b>${d} gün</b></span>` : ""}</p></div>
    <ol class="steps">${items.map((it, i) => {
      const n = it.n, lk = locked(n);
      const pill = it.target ? `<span class="pill pt">Hedef</span>` : it.lvl === 1 ? `<span class="pill p1">Şart</span>` : it.lvl === 2 ? `<span class="pill p2">Önerilir</span>` : `<span class="pill p3">Kaynak eser</span>`;
      return `<li class="step${it.target ? " is-target" : ""}${lk ? " locked" : ""}" style="--i:${i}" data-id="${n.id}" tabindex="0" role="button"><span class="s-num">${i + 1}</span>${posterHTML(n, { lock: lk, size: "w185" })}<div style="min-width:0"><div class="s-title">${esc(lk ? "Spoiler" : n.name)} ${pill}${n.fut ? `<span class="pill pf">Yakında</span>` : ""}</div><div class="s-why">${it.target ? "Listenin sonu" : `${esc(it.why)} · <em>${esc(U.nodes.get(it.for).lbl)}</em> için`}</div><div class="s-meta">${n.year || "TBA"} · ${KIND[n.type]}${n.rt ? ` · ${n.type === "dizi" ? "≈ " : ""}${n.rt} dk` : n.eps ? " · " + esc(n.eps) : ""}</div></div></li>`;
    }).join("")}</ol>`;
}
["#gTarget", "#gOrder", "#gRec", "#gBooks"].forEach((s) => $(s).addEventListener("change", renderGuide));
$("#gOut").addEventListener("click", (e) => { const s = e.target.closest(".step"); if (s) openTitle(U.id, s.dataset.id); });
$("#gOut").addEventListener("keydown", (e) => { const s = e.target.closest(".step"); if (s && (e.key === "Enter" || e.key === " ")) { e.preventDefault(); openTitle(U.id, s.dataset.id); } });

/* ================= KARAKTERLER ================= */
function stripHTML(c) {
  const m = new Map(c.app.map((a) => [a[0], a[1]]));
  return `<div class="strip">${U.titles.map((t) => `<i class="${m.has(t.id) ? ({ ana: "on", yan: "on", cameo: "half", anilir: "men" })[m.get(t.id)] : ""}" title="${esc(t.name)}"></i>`).join("")}</div><div class="strip-cap"><span>${U.titles[0].year || ""}</span><span>${c.app.length} / ${U.titles.length} yapımda</span><span>${U.titles[U.titles.length - 1].year || "TBA"}</span></div>`;
}
function renderChars() {
  const q = norm($("#charQ").value);
  const list = U.charOrder.filter((c) => !q || norm(c.name + " " + c.actor).includes(q));
  $("#charsInfo").innerHTML = `<b>${U.chars.length} karakter</b> · görünüm sayısına göre sıralı. Şerit, karakterin vizyon sırasındaki yapımlarda nerede göründüğünü gösterir.`;
  $("#charGrid").innerHTML = list.map((c, i) => {
    const lk = locked(c);
    return `<button type="button" class="ccard" data-id="${c.id}" style="--i:${Math.min(i, 20)}"><span class="av" style="--a:${(hashStr(c.id) % 360)}deg"><span>${esc(initials(c.name))}</span></span><span style="min-width:0"><h3>${esc(lk ? "Spoiler" : c.name)}</h3><span class="act">${esc(c.actor)}</span>${lk ? "" : `<p>${esc(c.sum)}</p>`}</span><span class="mini">${stripHTML(c)}</span></button>`;
  }).join("") || `<p class="soon-empty">Eşleşen karakter yok.</p>`;
}
$("#charQ").addEventListener("input", () => { clearTimeout(renderChars.t); renderChars.t = setTimeout(renderChars, 120); });
$("#charGrid").addEventListener("click", (e) => { const c = e.target.closest(".ccard"); if (c) openNode(U.id, c.dataset.id); });

/* ================= YAKINDA ================= */
function renderSoon() {
  const src = soonScope === "u" ? [U] : Object.values(DB);
  const list = src.flatMap(upcoming).sort(byDate);
  $("#soonOut").innerHTML = list.length ? list.map((it, i) => {
    const M = DB[it.u], t = it.t, m = M.meta, d = it.date ? daysTo(it.date) : null;
    const facts = (t.facts || []).map((f) => `<li><span class="lvl lvl-fact">Resmî</span><span>${esc(f)}</span></li>`).join("");
    const spec = (t.spec || []).map(([l, s]) => `<li><span class="lvl lvl-${l}">${LVL[l]}</span><span>${esc(s)}</span></li>`).join("");
    return `<article class="scard" style="--i:${Math.min(i, 12)};--u1:${m.color}"><div data-open="${it.u}~${t.id}">${posterHTML(t)}</div><div style="min-width:0">
      <div class="sc-top"><span class="sc-u"><i style="background:${m.color}"></i>${esc(m.short)}</span><span>${KIND[t.type]}${it.label ? " · " + esc(it.label) : ""}</span></div>
      <h3${langAttr(t.name)}><button type="button" data-open="${it.u}~${t.id}">${esc(t.name)}</button></h3>${t.tr ? `<p class="small" style="margin:0">${esc(t.tr)}</p>` : ""}
      <div class="sc-when"><span class="sc-date">${esc(whenText(it))}</span>${d != null ? `<span class="sc-days">${it.tent ? "~" : ""}${d}<small>gün</small></span>` : ""}</div>
      ${it.label ? `<p class="small" style="margin:0">${esc(it.note || "")}</p>` : `<p class="small" style="margin:0 0 4px">${esc(t.sum)}</p>`}
      ${facts ? `<div class="sc-sec"><h4>Bildiklerimiz</h4><ul class="facts">${facts}</ul></div>` : ""}
      ${spec ? `<div class="sc-sec"><h4>Varsayımlar ve teoriler</h4><ul class="facts">${spec}</ul></div>` : ""}
    </div></article>`;
  }).join("") : `<p class="soon-empty">Bu evrende duyurulmuş yeni bir yapım yok. <button type="button" class="linkish" data-s-all>Tüm evrenlerin takvimine bak</button></p>`;
}
$("#soonScope").addEventListener("click", (e) => { const b = e.target.closest("button"); if (!b) return; soonScope = b.dataset.s; $$("#soonScope button").forEach((x) => x.setAttribute("aria-pressed", x === b)); renderSoon(); });
$("#soonOut").addEventListener("click", (e) => {
  const o = e.target.closest("[data-open]"); if (o) { const [u, id] = o.dataset.open.split("~"); openTitle(u, id); }
  if (e.target.closest("[data-s-all]")) $('#soonScope [data-s="all"]').click();
});

/* ================= MODAL / ALTTAN AÇILAN PANEL ================= */
let lastFocus = null;
function openModal(m) {
  if (m.hidden) lastFocus = document.activeElement;
  m.hidden = false; m.classList.remove("closing"); document.body.classList.add("lock");
  const sh = m.querySelector(".sheet,.search-box");
  sh.style.transform = ""; sh.scrollTop = 0;
  setTimeout(() => (m.querySelector("#q") || sh).focus({ preventScroll: true }), 30);
}
function closeModal(m, keepHash) {
  if (!m || m.hidden || m.classList.contains("closing")) return;
  m.classList.add("closing");
  setTimeout(() => { m.hidden = true; m.classList.remove("closing"); const sh = m.querySelector(".sheet"); if (sh) sh.style.transform = ""; if ($$(".modal:not([hidden])").length === 0) document.body.classList.remove("lock"); }, reduce ? 0 : 230);
  if (!keepHash && (m.id === "modal" || m.id === "pageModal") && U) history.replaceState(null, "", "#" + U.id);
  if (lastFocus && lastFocus.focus) lastFocus.focus({ preventScroll: true });
}
function closeAllModals() { $$(".modal:not([hidden])").forEach((m) => closeModal(m, true)); }
$$(".modal").forEach((m) => m.addEventListener("click", (e) => { if (e.target.closest("[data-close]")) closeModal(m); }));
/* Telefonda paneli aşağı sürükleyerek kapatma */
$$(".modal .sheet").forEach((sh) => {
  const grab = document.createElement("div"); grab.className = "grab"; grab.setAttribute("aria-hidden", "true"); sh.prepend(grab);
  let y0 = null, dy = 0, t0 = 0, fromGrab = false;
  sh.addEventListener("pointerdown", (e) => {
    if (!isMobile() || e.pointerType === "mouse") return;
    fromGrab = !!e.target.closest(".grab,.m-hero,.sheet-h,.page-k");
    if (!fromGrab && sh.scrollTop > 0) return;
    y0 = e.clientY; dy = 0; t0 = performance.now();
  });
  sh.addEventListener("pointermove", (e) => {
    if (y0 == null) return;
    dy = e.clientY - y0;
    if (dy <= 0) { if (!fromGrab) y0 = null; sh.style.transform = ""; return; }
    if (!fromGrab && sh.scrollTop > 0) { y0 = null; return; }
    sh.style.transition = "none"; sh.style.transform = `translateY(${dy}px)`;
  });
  const end = () => {
    if (y0 == null) return;
    const v = dy / Math.max(1, performance.now() - t0);
    sh.style.transition = "";
    if (dy > 120 || v > 0.6) { sh.style.transform = `translateY(100%)`; closeModal(sh.closest(".modal")); }
    else sh.style.transform = "";
    y0 = null;
  };
  sh.addEventListener("pointerup", end); sh.addEventListener("pointercancel", end);
});
addEventListener("keydown", (e) => {
  if (e.key === "Escape") { if (!$(".pop:not([hidden])")) { const open = $$(".modal:not([hidden])").pop(); if (open) closeModal(open); else if (route) $(`#route .rchip[aria-pressed="true"]`)?.click(); } closePops(); }
  if ((e.key === "k" && (e.ctrlKey || e.metaKey)) || (e.key === "/" && !/INPUT|TEXTAREA|SELECT/.test(document.activeElement.tagName))) { e.preventDefault(); openSearch(); }
  if (e.key === "Tab") { const m = $$(".modal:not([hidden])").pop(); if (m) trap(e, m); }
});
function trap(e, m) {
  const f = $$('button,[href],input,select,textarea,[tabindex]:not([tabindex="-1"])', m).filter((x) => !x.disabled && x.offsetParent !== null);
  if (!f.length) return; const a = f[0], z = f[f.length - 1];
  if (e.shiftKey && document.activeElement === a) { e.preventDefault(); z.focus(); } else if (!e.shiftKey && document.activeElement === z) { e.preventDefault(); a.focus(); }
}

/* ================= DETAY: BAĞLANTI VE GÖNDERME KARTLARI ================= */
const REL = {
  devam: { in: "Öncesi", out: "Devamı", cls: "r-devam" },
  bagli: { in: "Bağlantılı hikâye", out: "Bağlantılı hikâye", cls: "r-bagli" },
  uyarlama: { in: "Kaynak eser", out: "Uyarlaması", cls: "r-uyarlama" }
};
function lcard(M, l, id) {
  const out = l.s === id, oid = out ? l.t : l.s, n = M.nodes.get(oid); if (!n) return "";
  const lk = n.rel > (prefs.spoil?.[M.id] ?? Infinity) && !revealed.has(n.id);
  const lane = n.kind === "title" ? M.laneOf.get(n.lane) : null;
  const r = REL[l.type];
  return `<button type="button" class="lcard ${r.cls}" data-node="${M.id}~${oid}" style="--lc:${lane ? lane.color : "var(--u1)"}">${posterHTML(n, { lock: lk, size: "w185" })}<span class="lc-b"><span class="lc-rel">${out ? ICON.arrowR : ICON.arrowL}${esc(out ? r.out : r.in)}</span><b${langAttr(n.name)}>${esc(lk ? "Spoiler" : n.lbl || n.name)}</b><small>${esc([n.year || "TBA", KIND[n.type], lane && lane.name].filter(Boolean).join(" · "))}</small>${l.note ? `<span class="lc-note${lk ? " blur" : ""}">${esc(l.note)}</span>` : ""}</span></button>`;
}
function eggKind(note) {
  if (/jenerik sonrası/i.test(note)) return ["Jenerik sonrası sahne", ICON.clap];
  if (/jenerik ortası/i.test(note)) return ["Jenerik ortası sahne", ICON.clap];
  if (/jenerik/i.test(note)) return ["Jenerik", ICON.clap];
  if (/^final|finalde|final sahne/i.test(note)) return ["Final sahnesi", ICON.flag];
  if (/^açılış/i.test(note)) return ["Açılış sahnesi", ICON.door];
  if (/görünür|belirir|saklı|gizli/i.test(note)) return ["Gizli ayrıntı", ICON.eye];
  return ["Gönderme", ICON.quote];
}
function eggCard(M, l, id, i) {
  const out = l.s === id, oid = out ? l.t : l.s, n = M.nodes.get(oid); if (!n) return "";
  const lk = n.rel > (prefs.spoil?.[M.id] ?? Infinity) && !revealed.has(n.id);
  const [k, ic] = eggKind(l.note || "");
  return `<article class="egg" style="--i:${i}"><div class="egg-top"><span class="egg-ic">${ic}</span><span class="egg-k">${esc(k)}</span><span class="egg-dir">${out ? "Bu yapımdan" : "Bu yapıma"}</span></div>
    <p class="egg-q${lk ? " blur" : ""}">${esc(l.note || "Gönderme")}</p>
    <button type="button" class="egg-to" data-node="${M.id}~${oid}">${posterHTML(n, { lock: lk, size: "w92" })}<span><small>${out ? "Gönderme yaptığı yapım" : "Gönderme yapan yapım"}</small><b${langAttr(n.name)}>${esc(lk ? "Spoiler" : n.lbl || n.name)}</b></span>${ICON.arrowR}</button></article>`;
}
function traceCard(M, l, i) {
  const ev = M.nodes.get(l.s); if (!ev) return "";
  const lk = ev.rel > (prefs.spoil?.[M.id] ?? Infinity) && !revealed.has(ev.id);
  const at = M.nodes.get(ev.at);
  return `<article class="egg egg-trace" style="--i:${i}"><div class="egg-top"><span class="egg-ic">${ICON.flag}</span><span class="egg-k">${esc(lk ? "Spoiler" : ev.name)}</span><span class="egg-dir">${esc(at ? at.lbl : "")}</span></div><p class="egg-q${lk ? " blur" : ""}">${esc(l.note || ev.sum)}</p><button type="button" class="egg-to" data-node="${M.id}~${ev.id}"><span><small>Olayın tamamı</small><b>${esc(lk ? "Spoiler" : ev.name)}</b></span>${ICON.arrowR}</button></article>`;
}
function chip(M, id, extra = "") {
  const n = M.nodes.get(id); if (!n) return "";
  const lk = n.rel > (prefs.spoil?.[M.id] ?? Infinity) && !revealed.has(n.id);
  const type = n.kind === "title" ? n.type : n.kind === "char" ? "karakter" : "olay";
  const col = n.kind === "title" ? M.laneOf.get(n.lane).color : "";
  return `<button type="button" class="chip k-${type}${lk ? " lk" : ""}" data-node="${M.id}~${id}" style="${col ? "--c:" + col : ""}"><i></i>${esc(lk ? "Spoiler" : n.kind === "title" ? n.lbl : n.name.split(" / ")[0])}${extra}</button>`;
}
const sec = (t, body, cls = "") => (body ? `<section class="msec ${cls}"><h3>${t}</h3>${body}</section>` : "");
const rows = (M, arr, cls = "") => (arr.length ? `<ul class="rows">${arr.map(([lbl, id, note]) => { const n = M.nodes.get(id); const lk = n && locked(n); return `<li class="${cls}"><span class="r-lbl">${esc(lbl)}</span>${chip(M, id)}${note ? `<p class="r-note${lk ? " blur" : ""}">${esc(note)}</p>` : ""}</li>`; }).join("")}</ul>` : "");

function openNode(u, id) {
  const M = DB[u]; const n = M && M.nodes.get(id); if (!n) return;
  if (n.kind === "title") openTitle(u, id); else openOther(u, id);
}
function openTitle(u, id, opts = {}) {
  if (!DB[u]) return;
  if (U.id !== u) setUniverse(u, { keepHash: true });
  const M = U, t = M.nodes.get(id); if (!t || t.kind !== "title") return openNode(u, id);
  const lk = locked(t), L = M.links.filter((l) => l.s === id || l.t === id), lane = M.laneOf.get(t.lane);
  const d = t.date ? daysTo(t.date) : null, nowNext = t.next && pd(t.next[1]) > TODAY;
  const g = `radial-gradient(80% 90% at 20% 0%, hsl(${hashStr(t.id + u) % 360} 70% 50%), transparent), linear-gradient(160deg, ${M.meta.color}, #070a14)`;
  const bg = IMG_OK && t.backdrop && !lk ? `<img src="${SITE.tmdbImageBase}w780${esc(t.backdrop)}" alt="">` : "";
  const dirLbl = isSrc(t) ? "Yazar / çizer" : t.type === "dizi" ? "Yaratıcı / yönetmen" : "Yönetmen";
  const runtime = t.rt ? (t.type === "dizi" ? `≈ ${t.rt} dk` : `${t.rt} dk`) : t.type === "film" && t.fut ? "Süre açıklanmadı" : "";
  let h = `<header class="m-hero${bg ? " has-bg" : ""}"><div class="m-bg" style="--g:${g}">${bg}</div>${posterHTML(t, { lock: lk, big: true })}<div style="min-width:0">
    <div class="m-k"><b>${esc(M.meta.short)}</b><span>${KIND[t.type]}</span><span style="color:${lane.color}">${esc(lane.name)}</span></div>
    <h2 class="m-title" id="mTitle"${langAttr(t.name)}>${esc(lk ? "Spoiler" : t.name)}</h2>${t.tr && !lk ? `<p class="m-tr">${esc(t.tr)}</p>` : ""}
    <div class="m-chips">${t.date ? `<span class="tag${t.fut ? " fut" : ""}">${t.fut ? "Yakında · " : ""}${esc(titleDate(t))}</span>` : `<span class="tag fut">Tarih açıklanmadı</span>`}${runtime ? `<span class="tag">${runtime}</span>` : ""}${t.eps ? `<span class="tag">${esc(t.eps)}</span>` : ""}${(t.g || []).map((x) => `<span class="tag">${esc(x)}</span>`).join("")}${t.vote ? `<span class="tag acc">TMDB ${t.vote.toFixed(1)}</span>` : ""}</div></div></header><div class="m-body">`;
  if (t.fut && d != null && d >= 0) h += `<div class="status"><div><div class="status-t">${t.tent ? "Planlanan vizyon" : "Vizyona"} ${d} gün</div><div class="status-s">${esc(titleDate(t))}</div></div><div class="count">${[["Gün", d], ["Hafta", Math.floor(d / 7)]].map(([k, v]) => `<div><b>${v}</b><span>${k}</span></div>`).join("")}</div></div>`;
  else if (nowNext) h += `<div class="status"><div><div class="status-t">${esc(t.next[0])}: ${esc(t.next[2] ? String(pd(t.next[1]).getFullYear()) + " (kesin değil)" : fmtD(t.next[1]))}</div><div class="status-s">${esc(t.next[3] || "")}</div></div><div class="count"><div><b>${t.next[2] ? "~" : ""}${daysTo(t.next[1])}</b><span>Gün</span></div></div></div>`;
  if (lk) {
    h += `<div class="lockbox"><p>Bu yapım, spoiler kalkanında seçtiğiniz noktadan sonra geliyor. Özet ve bağlantılar gizlendi.</p><button type="button" class="btn" data-reveal="${id}">Yine de göster</button></div>`;
  } else {
    h += `<dl class="credits">${t.dir && t.dir.length ? `<div><dt>${dirLbl}</dt><dd>${esc(t.dir.join(", "))}</dd></div>` : ""}<div><dt>Evren içi zaman</dt><dd>${esc(t.cl || "Kronoloji dışı")}</dd></div><div><dt>Vizyon sırası</dt><dd>${t.rel + 1}. / ${M.titles.length}</dd></div>${t.g ? `<div><dt>Tür</dt><dd>${esc(t.g.join(", "))}</dd></div>` : ""}</dl>`;
    h += sec("Özet", `<p class="prose">${esc(t.sum)}</p>`);
    h += sec("Evrendeki yeri", `<div class="sig">${esc(t.sig)}</div>`);
    if (t.facts) h += sec("Bildiklerimiz", `<ul class="facts">${t.facts.map((f) => `<li><span class="lvl lvl-fact">Resmî</span><span>${esc(f)}</span></li>`).join("")}</ul>`);
    if (t.spec) h += sec("Varsayımlar ve teoriler", `<ul class="facts">${t.spec.map(([l, s]) => `<li><span class="lvl lvl-${l}">${LVL[l]}</span><span>${esc(s)}</span></li>`).join("")}</ul><p class="small" style="margin:8px 0 0">Teori ve söylentiler doğrulanmamıştır. <button type="button" class="linkish" data-page="editoryal">Bilgi düzeyleri</button></p>`);
    if (t.cast && t.cast.length) h += sec("Oyuncular", `<div class="cast">${t.cast.map(([a, r]) => `<div><span class="av" style="--a:${hashStr(a) % 360}deg"><span>${esc(initials(a))}</span></span><span style="min-width:0"><b>${esc(a)}</b>${r ? `<small>${esc(r)}</small>` : ""}</span></div>`).join("")}</div>`);
    // Hikâye bağlantıları: önce / sonra
    const story = L.filter((l) => REL[l.type]);
    const before = story.filter((l) => l.t === id).sort((a, b) => M.nodes.get(a.s).rel - M.nodes.get(b.s).rel);
    const after = story.filter((l) => l.s === id).sort((a, b) => M.nodes.get(a.t).rel - M.nodes.get(b.t).rel);
    if (before.length || after.length) {
      const flow = `<div class="flow" aria-hidden="true"><span class="fl-n">${before.length}<small>önce</small></span><span class="fl-line"><i></i></span><span class="fl-me">${esc(t.lbl)}</span><span class="fl-line"><i></i></span><span class="fl-n">${after.length}<small>sonra</small></span></div>`;
      h += sec("Hikâye bağlantıları", flow + `<div class="lgrid">${before.length ? `<div class="lcol"><h4>${ICON.arrowL}Önce izle</h4>${before.map((l) => lcard(M, l, id)).join("")}</div>` : ""}${after.length ? `<div class="lcol"><h4>Sonra izle${ICON.arrowR}</h4>${after.map((l) => lcard(M, l, id)).join("")}</div>` : ""}</div>`, "msec-links");
    }
    const refs = L.filter((l) => l.type === "gonderme");
    const traces = L.filter((l) => l.type === "etkiler" && l.t === id);
    if (refs.length || traces.length) {
      const outR = refs.filter((l) => l.s === id), inR = refs.filter((l) => l.t === id);
      h += sec(`Göndermeler ve easter egg'ler <span class="cnt">${refs.length + traces.length}</span>`, `<div class="eggs">${[...outR, ...inR].map((l, i) => eggCard(M, l, id, i)).join("")}${traces.map((l, i) => traceCard(M, l, i + refs.length)).join("")}</div>`, "msec-eggs");
    }
    const chars = L.filter((l) => l.type === "karakter").sort((a, b) => Object.keys(ROLE).indexOf(a.role) - Object.keys(ROLE).indexOf(b.role));
    h += sec("Karakterler", chars.length ? `<div class="chips">${chars.map((l) => chip(M, l.s, l.role !== "ana" ? ` <small>${ROLE[l.role]}</small>` : "")).join("")}</div>` : "");
    const ev = L.filter((l) => l.type === "olay");
    h += sec("Burada yaşanan olaylar", ev.length ? `<div class="chips">${ev.map((l) => chip(M, l.s)).join("")}</div>` : "");
    const x = Object.values(DB).flatMap((D) => (D.d.xref || []).filter((r) => (D.id === u && r[0] === id) || (r[1] === u && r[2] === id)).map((r) => (D.id === u && r[0] === id ? { u: r[1], id: r[2], note: r[3] } : { u: D.id, id: r[0], note: r[3] })));
    if (x.length) h += sec("Diğer evrenlerle bağlantı", `<div class="lgrid lgrid-x">${x.map((r) => { const D = DB[r.u], n = D.nodes.get(r.id); return `<button type="button" class="lcard r-x" data-node="${r.u}~${r.id}" style="--lc:${D.meta.color}">${posterHTML(n, { size: "w185" })}<span class="lc-b"><span class="lc-rel">${emb(D.meta.emblem)}${esc(D.meta.short)}</span><b${langAttr(n.name)}>${esc(n.lbl)}</b><small>${n.year || "TBA"} · ${KIND[n.type]}</small><span class="lc-note">${esc(r.note)}</span></span></button>`; }).join("")}</div>`);
    if (t.tmdbOverview && t.tmdbOverview !== t.sum) h += `<details class="tmdb-ov"><summary>TMDB özeti</summary><p class="prose">${esc(t.tmdbOverview)}</p><p class="small">Kaynak: TMDB. Bu ürün TMDB API'sini kullanır ancak TMDB tarafından onaylanmamış veya sertifikalandırılmamıştır.</p></details>`;
  }
  const prev = M.titles[t.rel - 1], next = M.titles[t.rel + 1];
  h += `<nav class="m-nav" aria-label="Yapımlar arasında gezin"><div class="grp">${prev ? `<button type="button" class="btn-ghost nx" data-node="${u}~${prev.id}">← <span>${esc(locked(prev) ? "Spoiler" : prev.lbl)}</span></button>` : ""}${next ? `<button type="button" class="btn-ghost nx" data-node="${u}~${next.id}"><span>${esc(locked(next) ? "Spoiler" : next.lbl)}</span> →</button>` : ""}</div><div class="grp"><button type="button" class="btn-ghost" data-onmap="${id}">Haritada göster</button><button type="button" class="btn-ghost" data-share="${u}~${id}">Bağlantıyı kopyala</button></div></nav></div>`;
  $("#mBody").innerHTML = h;
  openModal($("#modal"));
  if (!opts.noHash && location.hash !== `#${u}~${id}`) history.pushState(null, "", `#${u}~${id}`);
}
function openOther(u, id) {
  if (U.id !== u) setUniverse(u, { keepHash: true });
  const M = U, n = M.nodes.get(id); if (!n) return;
  const lk = locked(n);
  let h = `<header class="m-hero m-hero-sm"><div class="m-bg" style="--g:linear-gradient(160deg,${M.meta.color},#070a14)"></div><span class="av av-xl" style="--a:${hashStr(n.id) % 360}deg"><span>${esc(n.kind === "char" ? initials(n.name) : "!")}</span></span><div style="min-width:0"><div class="m-k"><b>${esc(M.meta.short)}</b><span>${n.kind === "char" ? "Karakter" : "Olay"}</span></div><h2 class="m-title" id="mTitle"${langAttr(n.name, n.kind === "char" ? "en" : "tr")}>${esc(lk ? "Spoiler" : n.name)}</h2>${n.actor ? `<p class="m-tr">${esc(n.actor)}</p>` : ""}</div></header><div class="m-body">`;
  if (lk) h += `<div class="lockbox"><p>Bu ${n.kind === "char" ? "karakter" : "olay"}, izlediğiniz yerden sonra ortaya çıkıyor.</p><button type="button" class="btn" data-reveal="${id}">Yine de göster</button></div>`;
  else if (n.kind === "char") {
    const app = [...n.app].sort((a, b) => M.nodes.get(a[0]).rel - M.nodes.get(b[0]).rel);
    h += `<p class="prose">${esc(n.sum)}</p>` + sec("Vizyon sırasında görünümleri", stripHTML(n)) +
      sec("Göründüğü yapımlar", `<div class="lgrid lgrid-x">${app.map(([tid, r]) => { const tn = M.nodes.get(tid), tl = locked(tn); return `<button type="button" class="lcard" data-node="${u}~${tid}" style="--lc:${M.laneOf.get(tn.lane).color}">${posterHTML(tn, { lock: tl, size: "w185" })}<span class="lc-b"><span class="lc-rel">${esc(ROLE[r])}</span><b${langAttr(tn.name)}>${esc(tl ? "Spoiler" : tn.lbl)}</b><small>${tn.year || "TBA"} · ${KIND[tn.type]}</small></span></button>`; }).join("")}</div>`) +
      `<nav class="m-nav"><div class="grp"><button type="button" class="btn" data-route="${id}">Rotayı haritada göster</button></div></nav>`;
  } else {
    h += `<p class="prose">${esc(n.sum)}</p>` + sec("Gerçekleştiği yapım", rows(M, [["Yapım", n.at]])) + sec("Etkilediği yapımlar", n.aff.length ? `<div class="eggs">${n.aff.map(([tid, note], i) => { const tn = M.nodes.get(tid), tl = locked(tn); return `<article class="egg" style="--i:${i}"><div class="egg-top"><span class="egg-ic">${ICON.flag}</span><span class="egg-k">Etkisi</span></div><p class="egg-q${tl ? " blur" : ""}">${esc(note)}</p><button type="button" class="egg-to" data-node="${u}~${tid}">${posterHTML(tn, { lock: tl, size: "w92" })}<span><small>Etkilenen yapım</small><b>${esc(tl ? "Spoiler" : tn.lbl)}</b></span>${ICON.arrowR}</button></article>`; }).join("")}</div>` : "");
  }
  $("#mBody").innerHTML = h + "</div>";
  openModal($("#modal"));
  if (location.hash !== `#${u}~${id}`) history.pushState(null, "", `#${u}~${id}`);
}
$("#mBody").addEventListener("click", (e) => {
  const nd = e.target.closest("[data-node]"); if (nd) { const [u, id] = nd.dataset.node.split("~"); $(".sheet", $("#modal")).scrollTop = 0; openNode(u, id); return; }
  const rv = e.target.closest("[data-reveal]"); if (rv) { revealed.add(rv.dataset.reveal); const [u, id] = location.hash.slice(1).split("~"); openNode(u || U.id, id || rv.dataset.reveal); refreshQuiet(); return; }
  const bl = e.target.closest(".blur"); if (bl) { bl.classList.remove("blur"); return; }
  const sh = e.target.closest("[data-share]"); if (sh) { copyText(location.href.split("#")[0] + "#" + sh.dataset.share); return; }
  const om = e.target.closest("[data-onmap]"); if (om) { closeModal($("#modal")); route = null; setView("map", { scroll: true }); focusStation(om.dataset.onmap); return; }
  const ro = e.target.closest("[data-route]"); if (ro) { closeModal($("#modal")); setView("map", { scroll: true }); route = ro.dataset.route; setTimeout(() => { renderRouteChips(); drawRoute(route, true); }, 60); }
});
function refreshQuiet() { if (!U) return; Object.keys(stale).forEach((k) => (stale[k] = true)); stale[view] = false; ({ map: renderMap, time: renderTimeline, guide: renderGuide, chars: renderChars, soon: renderSoon })[view](); }
function focusStation(id) {
  setTimeout(() => {
    if (!MAP) return; const p = MAP.P.get(id); if (!p) return;
    hl(id);
    if (MAP.vertical) { const r = $("#map").getBoundingClientRect(); scrollTo({ top: scrollY + r.top + (p.y / MAP.height) * r.height - innerHeight / 2, behavior: reduce ? "auto" : "smooth" }); }
    else if (MAP.zoom) { const W = $("#map").clientWidth, H = $("#map").clientHeight, k = Math.max(0.8, d3.zoomTransform(mapSvg.node()).k); mapSvg.transition().duration(reduce ? 0 : 900).call(MAP.zoom.transform, d3.zoomIdentity.translate(W / 2 - p.x * k, H / 2 - p.y * k).scale(k)); }
    const st = $(`.st[data-id="${id}"]`); if (st) { st.classList.add("sel"); setTimeout(() => st.classList.remove("sel"), 3200); }
    setTimeout(() => hl(null), 3200);
  }, 120);
}

/* ================= SAYFALAR ================= */
function openPage(key, opts = {}) {
  const P = pageMap()[key]; if (!P) return;
  const others = [...PAGES].sort((a, b) => (a.group > b.group ? 1 : a.group < b.group ? -1 : (a.order || 0) - (b.order || 0))).filter((p) => p.key !== key && p.footer !== false);
  $("#pBody").innerHTML = `<div class="page"><p class="page-k">${esc(P.group || "")}</p><h2 id="pTitle">${esc(P.title)}</h2><p class="page-d">Son güncelleme: ${esc(fmtD(P.updated || SITE.dataUpdated || "2026-10-14"))}</p>${P.lead ? `<p class="lead">${mdInline(P.lead)}</p>` : ""}${md(P.body)}<nav class="page-nav" aria-label="Diğer sayfalar">${others.map((p) => `<button type="button" class="chip-btn" data-page="${esc(p.key)}">${esc(p.title)}</button>`).join("")}</nav></div>`;
  const f = $("#contactForm");
  if (f) f.addEventListener("submit", (e) => {
    e.preventDefault(); const note = $("#cf-note");
    const ok = f.checkValidity() && $("#cf-kvkk").checked;
    note.classList.toggle("err", !ok);
    note.textContent = ok ? "Teşekkürler. Bu form henüz bir sunucuya bağlı olmadığı için mesaj gönderilmedi; lütfen yukarıdaki e-posta adresini kullanın." : "Lütfen bütün alanları doldurun ve onay kutusunu işaretleyin.";
  });
  closeModal($("#modal"), true);
  openModal($("#pageModal"));
  if (!opts.noHash && location.hash !== "#" + key) history.pushState(null, "", "#" + key);
}

/* ================= ARAMA ================= */
let SIDX = [];
function buildIndex() {
  SIDX = [];
  Object.values(DB).forEach((M) => {
    M.titles.forEach((t) => SIDX.push({ u: M.id, id: t.id, k: "title", n: t, s: norm([t.name, t.tr, t.lbl].join(" ")), s2: norm([...(t.cast || []).flat(), ...(t.dir || [])].join(" ")) }));
    M.chars.forEach((c) => SIDX.push({ u: M.id, id: c.id, k: "char", n: c, s: norm(c.name), s2: norm(c.actor) }));
    M.events.forEach((o) => SIDX.push({ u: M.id, id: o.id, k: "event", n: o, s: norm(o.name), s2: "" }));
  });
}
function openSearch() { openModal($("#searchModal")); $("#q").select(); runSearch(); }
let sSel = 0;
function runSearch() {
  const q = norm($("#q").value.trim()), res = $("#qRes");
  if (!q) { res.innerHTML = `<p class="sr-empty">Örnek: <b>Endgame</b>, <b>Gandalf</b>, <b>Pedro Pascal</b>, <b>Oyuncak Hikayesi</b></p>`; return; }
  const scored = SIDX.map((x) => { let sc = 0; if (x.s.startsWith(q)) sc = 100; else if (x.s.includes(" " + q)) sc = 80; else if (x.s.includes(q)) sc = 60; else if (x.s2.includes(q)) sc = 35; if (sc && x.u === U.id) sc += 5; return [sc, x]; }).filter((a) => a[0]).sort((a, b) => b[0] - a[0]);
  let html = "", i = 0;
  [["title", "Yapımlar"], ["char", "Karakterler"], ["event", "Olaylar"]].forEach(([k, lbl]) => {
    const g = scored.filter((a) => a[1].k === k).slice(0, 8); if (!g.length) return;
    html += `<div class="sr-h">${lbl}</div>` + g.map(([, x]) => {
      const m = DB[x.u].meta, n = x.n;
      const left = k === "title" ? posterHTML(n, { size: "w92" }) : `<span class="av" style="--a:${hashStr(n.id) % 360}deg"><span>${esc(k === "char" ? initials(n.name) : "!")}</span></span>`;
      const sub = k === "title" ? `${KIND[n.type]} · ${n.year || "TBA"}${n.tr ? " · " + n.tr : ""}` : k === "char" ? n.actor : n.sum;
      return `<button type="button" class="sr-i" role="option" data-i="${i++}" data-node="${x.u}~${x.id}" aria-selected="false">${left}<span style="min-width:0"><b>${esc(n.name)}</b><small>${esc(sub)}</small></span><span class="sr-u"><i style="background:${m.color}"></i>${esc(m.short)}</span></button>`;
    }).join("");
  });
  res.innerHTML = html || `<p class="sr-empty">'${esc($("#q").value)}' için sonuç yok.</p>`;
  sSel = 0; markSel();
}
function markSel() { $$("#qRes .sr-i").forEach((b) => b.setAttribute("aria-selected", +b.dataset.i === sSel)); const s = $(`#qRes .sr-i[data-i="${sSel}"]`); if (s) s.scrollIntoView({ block: "nearest" }); }
$("#q").addEventListener("input", () => { clearTimeout(runSearch.t); runSearch.t = setTimeout(runSearch, 80); });
$("#q").addEventListener("keydown", (e) => {
  const n = $$("#qRes .sr-i").length;
  if (e.key === "ArrowDown") { e.preventDefault(); sSel = Math.min(n - 1, sSel + 1); markSel(); }
  if (e.key === "ArrowUp") { e.preventDefault(); sSel = Math.max(0, sSel - 1); markSel(); }
  if (e.key === "Enter") { const b = $(`#qRes .sr-i[data-i="${sSel}"]`); if (b) b.click(); }
});
$("#qRes").addEventListener("click", (e) => { const b = e.target.closest(".sr-i"); if (!b) return; const [u, id] = b.dataset.node.split("~"); closeModal($("#searchModal"), true); setTimeout(() => openNode(u, id), 60); });

/* ================= YÖNETİM PANELİ ================= */
let adminLoading = null;
function loadAsset(tag, attrs) { return new Promise((res, rej) => { const el = document.createElement(tag); Object.assign(el, attrs); el.onload = res; el.onerror = rej; document.head.appendChild(el); }); }
async function openAdmin() {
  if (location.hash !== "#yonetim") history.pushState(null, "", "#yonetim");
  try {
    if (!window.FEA_ADMIN) {
      adminLoading = adminLoading || Promise.all([loadAsset("link", { rel: "stylesheet", href: "assets/admin.css" }), loadAsset("script", { src: "assets/admin.js" })]);
      await adminLoading;
    }
    window.FEA_ADMIN.open({
      site: SITE, pages: PAGES, md, mdInline, esc, toast, store, claudeUse, applyCms, getJSON,
      source: () => CMS_SOURCE,
      onClose: () => { if (location.hash === "#yonetim") history.replaceState(null, "", "#" + U.id); }
    });
  } catch (err) { console.error(err); toast("Yönetim paneli yüklenemedi"); }
}

/* ================= YÖNLENDİRME ================= */
function routeHash() {
  const h = decodeURIComponent(location.hash.slice(1));
  if (!h) { closeModal($("#modal"), true); closeModal($("#pageModal"), true); return; }
  if (h === "yonetim") { openAdmin(); return; }
  if (window.FEA_ADMIN && window.FEA_ADMIN.isOpen && window.FEA_ADMIN.isOpen()) window.FEA_ADMIN.close(true);
  if (pageMap()[h]) { openPage(h, { noHash: true }); return; }
  const [u, id] = h.split("~");
  if (DB[u]) {
    if (U.id !== u) setUniverse(u, { keepHash: true });
    if (id && DB[u].nodes.has(id)) { const n = DB[u].nodes.get(id); n.kind === "title" ? openTitle(u, id, { noHash: true }) : openOther(u, id); }
    else { closeModal($("#modal"), true); closeModal($("#pageModal"), true); }
  }
}
addEventListener("popstate", routeHash);

/* ================= FOOTER / ÇEREZ / PWA ================= */
function renderFooter() {
  $("#fUnis").innerHTML = UNIS.map((m) => `<li><button type="button" class="fu" data-uni="${m.id}"><i style="background:${m.color}"></i>${esc(m.short)}</button></li>`).join("");
  const total = Object.values(DB).reduce((s, M) => s + M.titles.length, 0), chars = Object.values(DB).reduce((s, M) => s + M.chars.length, 0);
  $("#fMeta").textContent = `${UNIS.length} evren · ${total} yapım · ${chars} karakter · veri güncellemesi ${fmtD(SITE.dataUpdated || "2026-10-14")}`;
  $("#fCopy").textContent = `© ${new Date().getFullYear()} ${SITE.name || "Film Evreni Ağı"} · ${SITE.domain || ""}`;
}
$("#fUnis").addEventListener("click", (e) => { const b = e.target.closest("[data-uni]"); if (b) setUniverse(b.dataset.uni, { scroll: true }); });
function cookieInit() {
  const c = store.get("fea.consent", null);
  $("#cookie").hidden = !!(c && Date.now() - c.t < 365 * 864e5);
}
$("#cookie").addEventListener("click", (e) => { const b = e.target.closest("[data-consent]"); if (!b) return; store.set("fea.consent", { v: b.dataset.consent, t: Date.now() }); $("#cookie").hidden = true; });
addEventListener("scroll", () => {
  $("#nav").classList.toggle("scrolled", scrollY > 10);
  document.body.classList.toggle("in-views", $("#icerik").getBoundingClientRect().top < innerHeight * 0.6);
}, { passive: true });
let lastW = innerWidth, resizeT = 0;
addEventListener("resize", () => {
  clearTimeout(resizeT);
  resizeT = setTimeout(() => {
    if (Math.abs(innerWidth - lastW) < 40) return; lastW = innerWidth;
    stale.map = stale.time = true; if (view === "map" || view === "time") { stale[view] = false; (view === "map" ? renderMap : renderTimeline)(); }
  }, 200);
});
/* Uygulama olarak yükleme (PWA) */
let installEvt = null;
const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent);
const standalone = matchMedia("(display-mode: standalone)").matches || navigator.standalone;
if (standalone) document.body.classList.add("standalone");
addEventListener("beforeinstallprompt", (e) => { e.preventDefault(); installEvt = e; document.body.classList.add("can-install"); });
addEventListener("appinstalled", () => { installEvt = null; document.body.classList.remove("can-install"); toast("Uygulama yüklendi"); });
if (isIOS && !standalone) document.body.classList.add("ios-install");
async function installApp() {
  if (installEvt) { installEvt.prompt(); const r = await installEvt.userChoice.catch(() => null); if (r && r.outcome === "accepted") toast("Yükleniyor…"); installEvt = null; document.body.classList.remove("can-install"); }
  else if (isIOS) toast("Safari'de Paylaş simgesine, sonra 'Ana Ekrana Ekle'ye dokunun");
  else toast("Tarayıcınızın menüsünden 'Uygulamayı yükle' seçeneğini kullanın");
}
function registerSW() {
  if (!("serviceWorker" in navigator) || !window.isSecureContext) return;
  if (!/^(https:|http:\/\/localhost|http:\/\/127\.0\.0\.1)/.test(location.href)) return;
  navigator.serviceWorker.register("sw.js").catch(() => {});
}

/* ================= BAŞLAT ================= */
async function loadCmsOverrides() {
  // 1) Yönetim panelinde "bu tarayıcıda önizle" seçildiyse yerel taslak
  const draft = store.get("fea.cms.draft", null);
  if (draft && store.get("fea.cms.preview", false)) applyCms(draft, "taslak");
  // 2) Claude yayın ortamındaki kalıcı veritabanı (varsa)
  const db = await claudeUse("db");
  if (db) {
    try { const s = await db.doc("cms/content").get(); if (s.exists) applyCms(s.data(), "bulut"); }
    catch (e) { console.warn("CMS okunamadı", e && e.code); }
  }
}
async function boot() {
  try {
    const [unis, site, pages] = await Promise.all([getJSON("data/universes.json"), getJSON("data/site.json").catch(() => ({})), getJSON("data/pages.json").catch(() => ({ pages: [] }))]);
    Object.assign(SITE, site); PAGES = pages.pages || [];
    UNIS = unis;
    const datas = await Promise.all(UNIS.map((m) => getJSON(`data/u/${m.id}.json`)));
    UNIS.forEach((m, i) => (DB[m.id] = compile(m, datas[i])));
  } catch (err) {
    console.error(err);
    $("#hTitle").textContent = "Veri yüklenemedi";
    $("#hTag").innerHTML = "Site dosyaları bir web sunucusu üzerinden açılmalı. Yerelde denemek için proje klasöründe <code>python -m http.server</code> çalıştırın.";
    return;
  }
  const h = decodeURIComponent(location.hash.slice(1)).split("~")[0];
  const first = DB[h] ? h : DB[prefs.u] ? prefs.u : UNIS[0].id;
  Stars.init();
  setUniverse(first, { keepHash: true });
  renderGallery(); renderTicker(); renderFooter(); renderMoreMenus(); buildIndex();
  requestAnimationFrame(moveIndicator);
  cookieInit();
  if (location.hash && location.hash.length > 1) routeHash();
  probeImages();
  registerSW();
  loadCmsOverrides();
}
window.FEA = { applyCms, md };
boot();
})();
