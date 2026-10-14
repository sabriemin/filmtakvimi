/* Film Evreni Ağı — yönetim paneli (#yonetim).
   Kurumsal ve yasal sayfalarla site/iletişim bilgilerini düzenler. Kayıt yeri çalıştığı ortama göre seçilir:
   - "bulut":   Claude yayın ortamının kalıcı veritabanı (yalnızca sahip ve düzenleyiciler yazabilir)
   - "sunucu":  kendi sunucunuzdaki api/cms.php (şifreyle giriş, otomatik yedek)
   - "taslak":  sunucu yoksa yalnızca bu tarayıcıda taslak; JSON olarak dışa aktarılıp data/ klasörüne yüklenir */
(() => {
"use strict";
let ctx = null, root = null, state = null, saved = null, mode = "kontrol", editable = false, dirty = false;
let sel = { type: "site" }, php = { csrf: null }, db = null, view = "edit", confirmDel = false, closeAsk = false;
const $ = (s, r = root) => r.querySelector(s);
const $$ = (s, r = root) => [...r.querySelectorAll(s)];
const MODES = {
  kontrol: ["Bağlanıyor", "Kayıt yeri aranıyor…"],
  bulut: ["Bulut", "Değişiklikler bu yayının kalıcı veritabanına kaydedilir ve bütün ziyaretçiler görür."],
  sunucu: ["Sunucu", "Değişiklikler sunucudaki data/pages.json ve data/site.json dosyalarına yazılır; her kayıttan önce yedek alınır."],
  taslak: ["Yerel taslak", "Sunucu bağlantısı yok. Değişiklikler yalnızca bu tarayıcıda saklanır; yayına almak için dışa aktarıp data/ klasörüne yükleyin."]
};
const SITE_FIELDS = [
  ["name", "Site adı", "text", "Sayfa başlıklarında ve yasal metinlerde görünür."],
  ["domain", "Alan adı", "text", "Örnek: filmtakvimi.com"],
  ["baseUrl", "Site adresi", "url", "Sitenin tam adresi."],
  ["owner", "Site sahibi / şirket unvanı", "text", "KVKK kapsamında veri sorumlusu ve 5651 kapsamında içerik sağlayıcı."],
  ["address", "Açık posta adresi", "text", "KVKK başvuruları bu adrese yapılabilir."],
  ["email", "E-posta adresi", "email", "İletişim ve telif bildirimleri için."],
  ["kep", "KEP adresi", "text", "Varsa kayıtlı elektronik posta adresi."],
  ["taxId", "Vergi kimlik / MERSİS no", "text", "Şirketseniz doldurun."],
  ["hosting", "Yer sağlayıcı (hosting)", "text", "Barındırma şirketinin adı ve ülkesi."],
  ["court", "Yetkili mahkeme", "text", "Örnek: İstanbul (Çağlayan) Mahkemeleri ve İcra Daireleri"],
  ["dataUpdated", "Veri güncelleme tarihi", "date", "Sitede 'veri güncellemesi' olarak gösterilir."]
];
const VARS = [["name", "Site adı"], ["domain", "Alan adı"], ["owner", "Site sahibi"], ["address", "Adres"], ["email", "E-posta"], ["kep", "KEP"], ["taxId", "Vergi no"], ["hosting", "Hosting"], ["court", "Mahkeme"], ["analitik", "Analitik cümlesi"]];
const SHORTS = [["[[kimlik]]", "Kimlik kartı (veri sorumlusu bilgileri)"], ["[[iletisim]]", "İletişim kutuları ve formu"], ["[[cerez-sifirla]]", "Çerez tercihini sıfırla düğmesi"], ["[[rozet:fact]]", "Rozet: Resmî"], ["[[rozet:beklenti]]", "Rozet: Beklenti"], ["[[rozet:teori]]", "Rozet: Teori"], ["[[rozet:söylenti]]", "Rozet: Söylenti"]];
const clone = (x) => JSON.parse(JSON.stringify(x));
const today = () => new Date().toISOString().slice(0, 10);
const E = (s) => ctx.esc(s);

/* ---------- açılış ---------- */
function open(c) {
  ctx = c;
  if (root) { root.hidden = false; document.body.classList.add("lock"); return; }
  state = { site: clone(c.site), pages: clone(c.pages) };
  saved = JSON.stringify(state);
  root = document.createElement("div");
  root.className = "adm"; root.setAttribute("role", "dialog"); root.setAttribute("aria-modal", "true"); root.setAttribute("aria-label", "Yönetim paneli");
  document.body.appendChild(root); document.body.classList.add("lock");
  root.addEventListener("click", onClick); root.addEventListener("input", onInput); root.addEventListener("change", onInput);
  root.addEventListener("keydown", (e) => { if (e.key === "Escape") { e.stopPropagation(); tryClose(); } if ((e.ctrlKey || e.metaKey) && e.key === "s") { e.preventDefault(); save(); } });
  addEventListener("beforeunload", (e) => { if (dirty && root && !root.hidden) { e.preventDefault(); e.returnValue = ""; } });
  shell(); detect();
}
function isOpen() { return !!root && !root.hidden; }
function tryClose() { if (dirty && editable) { closeAsk = true; renderTop(); return; } close(); }
function close(force) {
  if (!root) return;
  if (force && dirty) { /* gezinme ile kapatıldı; taslağı koru */ }
  root.hidden = true; closeAsk = false;
  if (!document.querySelector(".modal:not([hidden])")) document.body.classList.remove("lock");
  ctx.onClose && ctx.onClose();
}

/* ---------- kayıt yerini bul ---------- */
async function detect() {
  mode = "kontrol"; renderTop();
  db = await ctx.claudeUse("db");
  if (db) {
    const user = await ctx.claudeUse("user");
    editable = user ? !!(await user.canEdit()) : false;
    try {
      const s = await db.doc("cms/content").get();
      if (s.exists) { const d = s.data(); state = { site: { ...state.site, ...(d.site || {}) }, pages: clone(d.pages || state.pages) }; saved = JSON.stringify(state); }
    } catch (e) { console.warn(e); }
    mode = "bulut"; render(); return;
  }
  try {
    const r = await fetch("api/cms.php?a=durum", { credentials: "same-origin", cache: "no-store" });
    if (r.ok && (r.headers.get("content-type") || "").includes("json")) {
      php = await r.json(); mode = "sunucu";
      if (!php.oturum) { editable = false; renderLogin(); return; }
      editable = true; render(); return;
    }
  } catch {}
  mode = "taslak"; editable = true;
  const draft = ctx.store.get("fea.cms.draft", null);
  if (draft && draft.pages) { state = { site: { ...state.site, ...draft.site }, pages: clone(draft.pages) }; saved = JSON.stringify(state); }
  render();
}

/* ---------- iskelet ---------- */
function shell() {
  root.innerHTML = `<header class="adm-top" id="admTop"></header><div class="adm-body"><aside class="adm-side" id="admSide"></aside><section class="adm-main" id="admMain"></section><section class="adm-prev" id="admPrev" aria-label="Önizleme"></section></div>`;
  renderTop();
}
function renderTop() {
  const [m, d] = MODES[mode];
  $("#admTop").innerHTML = `<div class="at-l"><span class="at-logo">Yönetim paneli</span><span class="at-mode m-${mode}" title="${E(d)}">${E(m)}</span>${mode === "bulut" && !editable ? `<span class="at-ro">Salt okunur</span>` : ""}</div>
  <div class="at-r">${mode === "sunucu" && !php.oturum ? `<button type="button" class="icon-btn" data-a="close" aria-label="Paneli kapat"><svg viewBox="0 0 20 20"><path d="M5 5l10 10M15 5L5 15"/></svg></button>` : closeAsk ? `<span class="at-ask">Kaydedilmemiş değişiklikler var.</span><button type="button" class="btn" data-a="save-close">Kaydet ve kapat</button><button type="button" class="btn-ghost" data-a="discard-close">Kaydetmeden kapat</button>` : `<span class="at-status" id="admStatus">${dirty ? "Kaydedilmemiş değişiklikler" : mode === "kontrol" ? "" : "Tüm değişiklikler kaydedildi"}</span>${mode === "sunucu" && php.oturum ? `<button type="button" class="btn-ghost sm" data-a="logout">Çıkış</button>` : ""}<button type="button" class="btn sm" data-a="save" ${!editable || !dirty ? "disabled" : ""}>Kaydet</button><button type="button" class="icon-btn" data-a="close" aria-label="Paneli kapat"><svg viewBox="0 0 20 20"><path d="M5 5l10 10M15 5L5 15"/></svg></button>`}</div>`;
}
function setDirty(v) { dirty = v; renderTop(); }
function status(t, err) { const s = $("#admStatus"); if (s) { s.textContent = t; s.classList.toggle("err", !!err); } }

/* ---------- giriş (PHP) ---------- */
function renderLogin() {
  $("#admSide").innerHTML = "";
  $("#admPrev").innerHTML = "";
  $("#admMain").innerHTML = php.kurulu
    ? `<form class="adm-card adm-login" id="loginForm"><h2>Giriş yap</h2><p>Sunucudaki yönetim paneline erişmek için yönetici şifrenizi girin.</p><label class="af"><span>Şifre</span><input type="password" id="lgPass" autocomplete="current-password" required></label><button class="btn" type="submit">Giriş yap</button><p class="af-note" id="lgNote" role="status"></p></form>`
    : `<form class="adm-card adm-login" id="setupForm"><h2>İlk kurulum</h2><p>Yönetici şifresi henüz belirlenmemiş. <code>api/ayar.php</code> dosyasına yazdığınız kurulum anahtarını ve yeni şifrenizi girin. Şifre en az 10 karakter olmalı.</p><label class="af"><span>Kurulum anahtarı</span><input id="stKey" autocomplete="off" required></label><label class="af"><span>Yeni şifre</span><input type="password" id="stPass" autocomplete="new-password" minlength="10" required></label><label class="af"><span>Yeni şifre (tekrar)</span><input type="password" id="stPass2" autocomplete="new-password" minlength="10" required></label><button class="btn" type="submit">Şifreyi kaydet</button><p class="af-note" id="stNote" role="status"></p></form>`;
  const lf = $("#loginForm"), sf = $("#setupForm");
  if (lf) { $("#lgPass").focus(); lf.addEventListener("submit", async (e) => {
    e.preventDefault(); const note = $("#lgNote"); note.textContent = "Kontrol ediliyor…";
    try { const j = await api("giris", { sifre: $("#lgPass").value }); php = { ...php, ...j, oturum: true }; editable = true; render(); ctx.toast("Giriş yapıldı"); }
    catch (err) { note.textContent = err.message; note.classList.add("err"); }
  }); }
  if (sf) sf.addEventListener("submit", async (e) => {
    e.preventDefault(); const note = $("#stNote");
    if ($("#stPass").value !== $("#stPass2").value) { note.textContent = "Şifreler aynı değil."; note.classList.add("err"); return; }
    try { await api("kurulum", { anahtar: $("#stKey").value, sifre: $("#stPass").value }); php.kurulu = true; renderLogin(); ctx.toast("Şifre kaydedildi; şimdi giriş yapın"); }
    catch (err) { note.textContent = err.message; note.classList.add("err"); }
  });
  renderTop();
}
async function api(a, body) {
  const r = await fetch(`api/cms.php?a=${a}`, { method: body ? "POST" : "GET", credentials: "same-origin", cache: "no-store", headers: body ? { "Content-Type": "application/json", "X-CSRF": php.csrf || "" } : {}, body: body ? JSON.stringify(body) : undefined });
  let j = {}; try { j = await r.json(); } catch {}
  if (!r.ok) throw new Error(j.hata || `Sunucu hatası (${r.status})`);
  if (j.csrf) php.csrf = j.csrf;
  return j;
}

/* ---------- ana görünüm ---------- */
function render() { renderTop(); renderSide(); renderMain(); renderPrev(); }
function sortedPages() { return [...state.pages].sort((a, b) => (a.group > b.group ? 1 : a.group < b.group ? -1 : (a.order || 0) - (b.order || 0))); }
function renderSide() {
  const groups = {};
  sortedPages().forEach((p) => (groups[p.group || "Diğer"] = groups[p.group || "Diğer"] || []).push(p));
  const item = (attrs, label, sub, on) => `<button type="button" class="as-i${on ? " on" : ""}" ${attrs}><span>${label}</span>${sub ? `<small>${sub}</small>` : ""}</button>`;
  $("#admSide").innerHTML = `${item('data-a="sel-site"', "Site ve iletişim bilgileri", "Yasal sayfalarda otomatik görünür", sel.type === "site")}
  ${Object.entries(groups).map(([g, ps]) => `<h4>${E(g)}</h4>${ps.map((p) => item(`data-a="sel-page" data-k="${E(p.key)}"`, E(p.title || p.key), "#" + E(p.key) + (p.footer === false ? " · gizli" : ""), sel.type === "page" && sel.key === p.key)).join("")}`).join("")}
  ${editable ? `<button type="button" class="as-add" data-a="add">+ Yeni sayfa</button>` : ""}
  <h4>Araçlar</h4>
  ${item('data-a="sel-io"', "Dışa / içe aktar", "JSON yedeği", sel.type === "io")}
  ${mode === "sunucu" ? item('data-a="sel-backups"', "Yedekler", "Önceki kayıtlara dön", sel.type === "backups") : ""}
  <p class="as-mode">${E(MODES[mode][1])}</p>`;
}
function page() { return state.pages.find((p) => p.key === sel.key); }
function dis() { return editable ? "" : "disabled"; }
function renderMain() {
  const M = $("#admMain");
  root.classList.toggle("show-prev", view === "prev");
  const tabs = `<div class="am-tabs"><button type="button" data-a="v-edit" aria-pressed="${view === "edit"}">Düzenle</button><button type="button" data-a="v-prev" aria-pressed="${view === "prev"}">Önizle</button></div>`;
  if (sel.type === "site") {
    M.innerHTML = `${tabs}<div class="am-head"><h2>Site ve iletişim bilgileri</h2><p>Bu bilgiler Gizlilik/KVKK, Yasal Bilgilendirme, İletişim ve Kullanım Koşulları sayfalarında <code>{{owner}}</code> gibi değişkenler ve <code>[[kimlik]]</code> kartı aracılığıyla otomatik gösterilir.</p></div>
    <div class="adm-card">${SITE_FIELDS.map(([k, l, t, h]) => `<label class="af"><span>${E(l)}</span><input data-site="${k}" type="${t}" value="${E(state.site[k] || "")}" ${dis()}><small>${E(h)}</small>${/^\[.*\]$/.test(state.site[k] || "") ? `<em class="af-warn">Henüz doldurulmadı</em>` : ""}</label>`).join("")}
    <label class="af af-check"><input type="checkbox" data-site="analytics" ${state.site.analytics ? "checked" : ""} ${dis()}><span>Sitede analitik veya reklam aracı kullanıyorum</span><small>İşaretlerseniz gizlilik ve çerez metinlerindeki <code>{{analitik}}</code> cümlesi buna göre değişir.</small></label></div>`;
  } else if (sel.type === "page") {
    const p = page(); if (!p) { sel = { type: "site" }; return renderMain(); }
    M.innerHTML = `${tabs}<div class="am-head"><h2>${E(p.title || "Adsız sayfa")}</h2><p>Son güncelleme: ${E(p.updated || "—")} · Adres: <code>#${E(p.key)}</code></p></div>
    <div class="adm-card">
      <div class="af-row"><label class="af"><span>Başlık</span><input data-p="title" value="${E(p.title || "")}" ${dis()} required></label><label class="af af-sm"><span>Adres (kısa ad)</span><input data-p="key" value="${E(p.key)}" pattern="[a-z0-9-]{2,40}" ${dis()}><small>Küçük harf, rakam ve tire</small></label></div>
      <div class="af-row"><label class="af af-sm"><span>Grup</span><select data-p="group" ${dis()}>${["Kurumsal", "Yasal"].map((g) => `<option${p.group === g ? " selected" : ""}>${g}</option>`).join("")}</select></label><label class="af af-xs"><span>Sıra</span><input data-p="order" type="number" min="0" max="99" value="${p.order || 0}" ${dis()}></label><label class="af af-check"><input type="checkbox" data-p="footer" ${p.footer !== false ? "checked" : ""} ${dis()}><span>Footer ve menülerde göster</span></label></div>
      <label class="af"><span>Giriş paragrafı</span><textarea data-p="lead" rows="3" ${dis()}>${E(p.lead || "")}</textarea><small>Sayfanın başında büyük puntoyla gösterilir.</small></label>
      <div class="af"><span>İçerik</span>
        <div class="md-bar" role="toolbar" aria-label="Biçimlendirme">
          <button type="button" data-md="b" title="Kalın">B</button><button type="button" data-md="i" title="İtalik"><em>i</em></button><button type="button" data-md="h2" title="Ara başlık">H2</button><button type="button" data-md="h3" title="Küçük başlık">H3</button><button type="button" data-md="ul" title="Madde listesi">• Liste</button><button type="button" data-md="ol" title="Numaralı liste">1. Liste</button><button type="button" data-md="link" title="Bağlantı">Bağlantı</button><button type="button" data-md="table" title="Tablo">Tablo</button>
          <select data-md-ins aria-label="Kısa kod ekle" ${dis()}><option value="">Kısa kod ekle…</option>${SHORTS.map(([v, l]) => `<option value="${E(v)}">${E(l)}</option>`).join("")}</select>
          <select data-md-ins aria-label="Değişken ekle" ${dis()}><option value="">Değişken ekle…</option>${VARS.map(([v, l]) => `<option value="{{${v}}}">${E(l)} · {{${v}}}</option>`).join("")}</select>
        </div>
        <textarea data-p="body" id="mdBody" rows="22" spellcheck="true" ${dis()}>${E(p.body || "")}</textarea>
        <small>Markdown: <code>## Başlık</code>, <code>**kalın**</code>, <code>- madde</code>, <code>[metin](#gizlilik)</code>, tablolar için <code>| a | b |</code>. Ham HTML desteklenmez.</small>
      </div>
      ${editable ? `<div class="af-danger">${confirmDel ? `<span>Bu sayfa kalıcı olarak silinecek.</span><button type="button" class="btn danger" data-a="del-yes">Evet, sil</button><button type="button" class="btn-ghost" data-a="del-no">Vazgeç</button>` : `<button type="button" class="btn-ghost danger-ghost" data-a="del">Sayfayı sil</button>`}</div>` : ""}
    </div>`;
  } else if (sel.type === "io") {
    const json = JSON.stringify({ site: state.site, pages: state.pages }, null, 1);
    M.innerHTML = `${tabs}<div class="am-head"><h2>Dışa / içe aktar</h2><p>İçeriğin tamamını JSON olarak alın ya da daha önce aldığınız bir yedeği geri yükleyin.</p></div>
    <div class="adm-card"><h3>Dışa aktar</h3><p class="af-note">Yayına almak için: <b>site</b> kısmını <code>data/site.json</code>, <b>pages</b> kısmını <code>{"pages": [...]}</code> biçiminde <code>data/pages.json</code> dosyasına kaydedin.</p>
      <div class="af-btns"><button type="button" class="btn-ghost" data-a="copy-json">Panoya kopyala</button><button type="button" class="btn-ghost" data-a="dl-site">site.json indir</button><button type="button" class="btn-ghost" data-a="dl-pages">pages.json indir</button></div>
      <textarea class="mono" rows="10" readonly id="ioOut">${E(json)}</textarea></div>
    <div class="adm-card"><h3>İçe aktar</h3><p class="af-note">Bir JSON dosyası seçin ya da içeriği yapıştırın. İçe aktarılan içerik kaydedene kadar yalnızca bu panelde kalır.</p>
      <input type="file" id="ioFile" accept="application/json,.json" ${dis()}><textarea class="mono" rows="6" id="ioIn" placeholder='{"site": {...}, "pages": [...]}' ${dis()}></textarea><div class="af-btns"><button type="button" class="btn" data-a="import" ${dis()}>İçe aktar</button></div><p class="af-note" id="ioNote" role="status"></p></div>
    ${mode === "taslak" ? `<div class="adm-card"><h3>Sitede önizle</h3><label class="af af-check"><input type="checkbox" id="prevToggle" ${ctx.store.get("fea.cms.preview", false) ? "checked" : ""}><span>Kaydettiğim taslağı bu tarayıcıda sitede göster</span><small>Yalnızca sizin tarayıcınızı etkiler; ziyaretçiler dosyadaki içeriği görür.</small></label></div>` : ""}`;
    const f = $("#ioFile"); if (f) f.addEventListener("change", async () => { const file = f.files[0]; if (file) $("#ioIn").value = await file.text(); });
    const pt = $("#prevToggle"); if (pt) pt.addEventListener("change", () => { ctx.store.set("fea.cms.preview", pt.checked); ctx.toast(pt.checked ? "Taslak bu tarayıcıda sitede gösterilecek" : "Site dosyadaki içeriği gösterecek"); });
  } else if (sel.type === "backups") {
    M.innerHTML = `${tabs}<div class="am-head"><h2>Yedekler</h2><p>Sunucu her kayıttan önce mevcut dosyaların yedeğini alır; son 30 yedek saklanır.</p></div><div class="adm-card" id="bkList">Yükleniyor…</div>`;
    api("yedekler").then((j) => {
      $("#bkList").innerHTML = j.yedekler && j.yedekler.length ? `<ul class="bk">${j.yedekler.map((b) => `<li><span class="mono">${E(b.ad)}</span><small>${E(b.tarih)}</small><button type="button" class="btn-ghost sm" data-a="restore" data-b="${E(b.ad)}">Geri yükle</button></li>`).join("")}</ul>` : "Henüz yedek yok.";
    }).catch((e) => ($("#bkList").textContent = e.message));
  }
  M.scrollTop = 0;
}
function renderPrev() {
  const P = $("#admPrev");
  if (sel.type === "page") {
    const p = page(); if (!p) return;
    P.innerHTML = `<div class="ap-h"><button type="button" class="ap-back" data-a="v-edit">← Düzenle</button>Önizleme · <span class="mono">#${E(p.key)}</span></div><div class="page ap-page"><p class="page-k">${E(p.group || "")}</p><h2>${E(p.title || "")}</h2><p class="page-d">Son güncelleme: ${E(p.updated || "")}</p>${p.lead ? `<p class="lead">${ctx.mdInline(p.lead, state.site)}</p>` : ""}${ctx.md(p.body, state.site)}</div>`;
  } else if (sel.type === "site") {
    P.innerHTML = `<div class="ap-h"><button type="button" class="ap-back" data-a="v-edit">← Düzenle</button>Önizleme · kimlik kartı</div><div class="page ap-page">${ctx.md("[[kimlik]]", state.site)}<p>${ctx.mdInline("{{analitik}}", state.site)}</p></div>`;
  } else P.innerHTML = `<div class="ap-h">Önizleme</div><p class="ap-empty">Bu bölümde önizleme yok.</p>`;
}
let prevT = 0;
function schedulePrev() { clearTimeout(prevT); prevT = setTimeout(renderPrev, 180); }

/* ---------- olaylar ---------- */
function onInput(e) {
  const t = e.target;
  if (t.dataset.site) {
    state.site[t.dataset.site] = t.type === "checkbox" ? t.checked : t.value;
    setDirty(JSON.stringify(state) !== saved); schedulePrev(); return;
  }
  if (t.dataset.p) {
    const p = page(); if (!p) return;
    const k = t.dataset.p;
    if (k === "key") {
      const v = t.value.trim().toLowerCase();
      const ok = /^[a-z0-9-]{2,40}$/.test(v) && !state.pages.some((x) => x !== p && x.key === v) && !/^(yonetim|mcu|sw)$/.test(v);
      t.setCustomValidity(ok ? "" : "Geçersiz ya da kullanılan bir adres");
      if (!ok) { t.reportValidity && e.type === "change" && t.reportValidity(); return; }
      p.key = v; sel.key = v;
    } else if (k === "footer") p.footer = t.checked;
    else if (k === "order") p.order = Math.max(0, Math.min(99, +t.value || 0));
    else p[k] = t.value;
    p.updated = today();
    setDirty(JSON.stringify(state) !== saved);
    if (k === "title" || k === "group" || k === "order" || k === "footer" || k === "key") renderSide();
    schedulePrev(); return;
  }
  if (t.matches("[data-md-ins]") && t.value) { insert(t.value, ""); t.value = ""; }
}
function insert(before, after = "", placeholder = "") {
  const ta = $("#mdBody"); if (!ta || ta.disabled) return;
  const s = ta.selectionStart, en = ta.selectionEnd, txt = ta.value.slice(s, en) || placeholder;
  ta.setRangeText(before + txt + after, s, en, "end");
  ta.focus(); ta.dispatchEvent(new Event("input", { bubbles: true }));
}
function lineInsert(prefix) {
  const ta = $("#mdBody"); if (!ta || ta.disabled) return;
  const s = ta.selectionStart, ls = ta.value.lastIndexOf("\n", s - 1) + 1;
  ta.setRangeText(prefix, ls, ls, "end"); ta.focus(); ta.dispatchEvent(new Event("input", { bubbles: true }));
}
async function onClick(e) {
  const md = e.target.closest("[data-md]");
  if (md) {
    const k = md.dataset.md;
    if (k === "b") insert("**", "**", "kalın metin");
    else if (k === "i") insert("*", "*", "italik metin");
    else if (k === "h2") lineInsert("## ");
    else if (k === "h3") lineInsert("### ");
    else if (k === "ul") lineInsert("- ");
    else if (k === "ol") lineInsert("1. ");
    else if (k === "link") insert("[", "](#iletisim)", "bağlantı metni");
    else if (k === "table") insert("\n| Başlık 1 | Başlık 2 |\n|---|---|\n| Hücre | Hücre |\n", "");
    return;
  }
  const b = e.target.closest("[data-a]"); if (!b) return;
  const a = b.dataset.a;
  if (a === "close") tryClose();
  else if (a === "discard-close") { state = JSON.parse(saved); dirty = false; closeAsk = false; render(); close(); }
  else if (a === "save-close") { if (await save()) close(); }
  else if (a === "save") save();
  else if (a === "logout") { try { await api("cikis", {}); } catch {} php.oturum = false; editable = false; dirty = false; renderLogin(); }
  else if (a === "sel-site") { sel = { type: "site" }; confirmDel = false; render(); }
  else if (a === "sel-page") { sel = { type: "page", key: b.dataset.k }; confirmDel = false; render(); }
  else if (a === "sel-io") { sel = { type: "io" }; render(); }
  else if (a === "sel-backups") { sel = { type: "backups" }; render(); }
  else if (a === "v-edit" || a === "v-prev") { view = a === "v-edit" ? "edit" : "prev"; renderMain(); renderPrev(); }
  else if (a === "add") {
    let n = 1; while (state.pages.some((p) => p.key === `yeni-sayfa-${n}`)) n++;
    const order = Math.max(0, ...state.pages.filter((p) => p.group === "Kurumsal").map((p) => p.order || 0)) + 1;
    state.pages.push({ key: `yeni-sayfa-${n}`, group: "Kurumsal", order, title: "Yeni sayfa", lead: "", body: "## Ara başlık\nSayfa metnini buraya yazın.", updated: today(), footer: true });
    sel = { type: "page", key: `yeni-sayfa-${n}` }; setDirty(true); render();
    const ti = $('[data-p="title"]'); if (ti) { ti.focus(); ti.select(); }
  }
  else if (a === "del") { confirmDel = true; renderMain(); }
  else if (a === "del-no") { confirmDel = false; renderMain(); }
  else if (a === "del-yes") { state.pages = state.pages.filter((p) => p.key !== sel.key); sel = { type: "site" }; confirmDel = false; setDirty(true); render(); ctx.toast("Sayfa silindi; kalıcı olması için kaydedin"); }
  else if (a === "copy-json") { try { await navigator.clipboard.writeText($("#ioOut").value); ctx.toast("Kopyalandı"); } catch { $("#ioOut").select(); ctx.toast("Metni seçip kopyalayın"); } }
  else if (a === "dl-site" || a === "dl-pages") {
    const data = a === "dl-site" ? state.site : { pages: state.pages };
    const url = URL.createObjectURL(new Blob([JSON.stringify(data, null, 1) + "\n"], { type: "application/json" }));
    const l = document.createElement("a"); l.href = url; l.download = a === "dl-site" ? "site.json" : "pages.json"; document.body.appendChild(l); l.click(); l.remove();
    setTimeout(() => URL.revokeObjectURL(url), 2000);
    ctx.toast("İndirme başlatıldı; çalışmazsa panoya kopyalayın");
  }
  else if (a === "import") {
    const note = $("#ioNote");
    try {
      const j = JSON.parse($("#ioIn").value);
      const pages = j.pages || (Array.isArray(j) ? j : null);
      if (!pages || !Array.isArray(pages) || !pages.every((p) => p && typeof p.key === "string" && typeof p.title === "string")) throw new Error("Beklenen biçim: {\"site\": {...}, \"pages\": [...]}");
      state = { site: { ...state.site, ...(j.site || {}) }, pages: clone(pages) };
      setDirty(true); sel = { type: "site" }; render(); ctx.toast("İçe aktarıldı; kalıcı olması için kaydedin");
    } catch (err) { note.textContent = "İçe aktarılamadı: " + err.message; note.classList.add("err"); }
  }
  else if (a === "restore") {
    try { await api("geri-yukle", { ad: b.dataset.b }); const fresh = await ctx.getJSON("data/pages.json?" + Date.now()); const site = await ctx.getJSON("data/site.json?" + Date.now()); state = { site, pages: fresh.pages }; saved = JSON.stringify(state); setDirty(false); ctx.applyCms(state, "sunucu"); render(); ctx.toast("Yedek geri yüklendi"); }
    catch (err) { ctx.toast(err.message); }
  }
}

/* ---------- kaydet ---------- */
function validate() {
  const keys = new Set();
  for (const p of state.pages) {
    if (!/^[a-z0-9-]{2,40}$/.test(p.key)) return `Geçersiz sayfa adresi: ${p.key}`;
    if (keys.has(p.key)) return `Aynı adres iki kez kullanılmış: ${p.key}`;
    keys.add(p.key);
    if (!String(p.title || "").trim()) return `Başlığı boş bir sayfa var (#${p.key})`;
    if (String(p.body || "").length > 60000) return `İçerik çok uzun (#${p.key})`;
  }
  return null;
}
async function save() {
  if (!editable) { ctx.toast("Bu ortamda kaydetme izniniz yok"); return false; }
  const err = validate(); if (err) { status(err, true); ctx.toast(err); return false; }
  const content = { site: state.site, pages: state.pages, updated: new Date().toISOString() };
  status("Kaydediliyor…");
  try {
    if (mode === "bulut") await db.doc("cms/content").set(clone(content));
    else if (mode === "sunucu") await api("kaydet", content);
    else ctx.store.set("fea.cms.draft", content);
    saved = JSON.stringify(state); dirty = false; closeAsk = false;
    ctx.applyCms(clone(content), mode);
    renderTop();
    ctx.toast(mode === "taslak" ? "Taslak bu tarayıcıya kaydedildi" : "Kaydedildi; site güncellendi");
    return true;
  } catch (e) {
    const code = e && e.code;
    if (code === "invalid_argument" || code === "not_granted") { editable = false; render(); status("Bu yayında düzenleme izniniz yok", true); }
    else status("Kaydedilemedi: " + (e.message || code || "bilinmeyen hata"), true);
    return false;
  }
}

window.FEA_ADMIN = { open, close, isOpen };
})();
