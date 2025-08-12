/* assets/js/easter-eggs-ids.js — CLEAN BUILD */
(function () {
  // === Ayarlar ===
  const CONFIG = {
    // JSON katalogları (KESİN yollar)
  urls: [
    'assets/data/marvel.json',
    'assets/data/dc.json',
    'assets/data/starwars.json',
    'assets/data/harrypotter.json',
    'assets/data/matrix.json',
    'assets/data/avatar.json',
    'assets/data/pixar.json',
    'assets/data/middleearth.json'
  ],
    // Kaynağa göre efekt
    effectsMap: {
      marvel: 'dust',
      dc: 'bat',
      starwars: 'saber',
      harrypotter: 'oz',
      matrix: 'matrix',
      avatar: 'water',
      pixar: 'oz',
      middleearth: 'dust'
    },
    // Arama kutusu seçicileri
    searchSelectors: [
      '[x-model="search"]',
      '[x-model="filterText"]',
      'input[type="search"]',
      'input#q',
      'input[name="search"]'
    ],
    // Efekt uygulanacak küçük öğeler
    candidateSelectors: '.ac-item, .dropdown-item, .card, .result, li, .item, .list-item, .grid > *'
  };

  // === Yardımcılar ===
  const $  = (s, r=document) => r.querySelector(s);
  const $$ = (s, r=document) => Array.from(r.querySelectorAll(s));
  const esc  = s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const norm = s => (s || '')
    .toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/ı/g, 'i').replace(/İ/g, 'i');

  function tokenizeId(id) {
    return String(id || '')
      .split(/[\/_\-.]+/)
      .filter(t => t && !/^\d{2,4}$/.test(t) && t.length > 1);
  }
  function termsFromNode(n) {
    const t = new Set();
    tokenizeId(n.id || '').forEach(x => t.add(norm(x)));
    if (n.label) t.add(norm(String(n.label)));
    if (n.title) t.add(norm(String(n.title)));
    return [...t];
  }

  // === Efektler ===
  const Effects = {
    dust() {
      const nodes = $$(CONFIG.candidateSelectors);
      const arr = (nodes.length ? nodes : $$('div, li, section')).slice(0, 24);
      const n = Math.max(1, Math.floor(arr.length / 2));
      arr.sort(() => Math.random() - 0.5).slice(0, n).forEach((el, i) => {
        el.style.animation = 'egDust .9s ease forwards';
        el.style.animationDelay = (i * 60) + 'ms';
        setTimeout(() => { el.style.animation = ''; }, 1600);
      });
    },
    oz() {
      document.documentElement.classList.add('eg-oz');
      setTimeout(() => document.documentElement.classList.add('eg-oz-color'), 900);
      setTimeout(() => document.documentElement.classList.remove('eg-oz', 'eg-oz-color'), 2200);
    },
    bat() {
      let dark = $('.eg-dark');
      if (!dark) { dark = document.createElement('div'); dark.className = 'eg-dark'; document.body.appendChild(dark); }
      let layer = $('.eg-bat');
      if (!layer) { layer = document.createElement('div'); layer.className = 'eg-bat'; document.body.appendChild(layer); }
      dark.classList.add('show'); layer.innerHTML = '';
      for (let i = 0; i < 16; i++) {
        const s = document.createElement('span'); s.textContent = '🦇';
        s.style.left = (Math.random() * 100) + 'vw';
        s.style.top  = (20 + Math.random() * 60) + 'vh';
        s.style.animationDuration = (5 + Math.random() * 3) + 's';
        layer.appendChild(s);
      }
      setTimeout(() => dark.classList.remove('show'), 1600);
      setTimeout(() => layer.innerHTML = '', 3200);
    },
    saber() {
      let f = $('.eg-flash');
      if (!f) { f = document.createElement('div'); f.className = 'eg-flash'; document.body.appendChild(f); }
      f.classList.add('on'); setTimeout(() => f.classList.remove('on'), 300);
    },
    matrix() {
      let rain = $('.eg-matrix');
      if (!rain) {
        rain = document.createElement('div'); rain.className = 'eg-matrix'; document.body.appendChild(rain);
        for (let i = 0; i < 60; i++) {
          const s = document.createElement('span'); s.textContent = '01';
          s.style.left = (Math.random() * 100) + 'vw';
          s.style.animationDuration = (2 + Math.random() * 2) + 's';
          rain.appendChild(s);
        }
      }
      rain.classList.add('show'); setTimeout(() => rain.classList.remove('show'), 900);
    },
    water() {
      let w = $('.eg-water'); if (!w) { w = document.createElement('div'); w.className = 'eg-water'; document.body.appendChild(w); }
      w.classList.add('on'); setTimeout(() => w.classList.remove('on'), 800);
    }
  };

  // === CSS (tek sefer) ===
  (function injectCSS() {
    if (document.getElementById('eggs-style')) return;
    const css = `
    .eg-dark{position:fixed;inset:0;background:rgba(0,0,0,0.88);opacity:0;transition:.5s;pointer-events:none;z-index:9998}
    .eg-dark.show{opacity:1}
    .eg-bat{position:fixed;inset:0;pointer-events:none;overflow:hidden;z-index:9999}
    .eg-bat span{position:absolute;font-size:28px;opacity:0;animation:egFly 6s linear forwards}
    @keyframes egFly{0%{opacity:0;transform:translate(0,100vh) scale(.7)}10%{opacity:1}100%{opacity:0;transform:translate(10vw,-20vh) scale(1.4) rotate(15deg)}}
    @keyframes egDust{0%{opacity:1;filter:blur(0);transform:translate(0,0) rotate(0)}60%{opacity:.7;filter:blur(2px)}100%{opacity:0;filter:blur(6px);transform:translate(80px,-30px) rotate(8deg)}}
    .eg-oz{filter:grayscale(100%);transition:filter .8s ease}
    .eg-oz.eg-oz-color{filter:none}
    .eg-flash{position:fixed;inset:0;background:radial-gradient(circle at 50% 50%, rgba(255,255,255,0.85), rgba(255,255,255,0) 60%);opacity:0;transition:opacity .2s;pointer-events:none;z-index:9999}
    .eg-flash.on{opacity:1}
    .eg-matrix{position:fixed;inset:0;pointer-events:none;overflow:hidden;opacity:0;transition:opacity .2s;z-index:9999}
    .eg-matrix.show{opacity:1}
    .eg-matrix span{position:absolute;top:-10vh;animation-name:egDrop;animation-iteration-count:1;animation-timing-function:linear}
    @keyframes egDrop{to{transform:translateY(120vh)}}
    .eg-water{position:fixed;inset:0;pointer-events:none;background:radial-gradient(circle at 50% 50%, rgba(173,216,230,0.35), rgba(173,216,230,0) 40%);opacity:0;transition:opacity .3s;z-index:9999}
    .eg-water.on{opacity:1}
    `;
    const s = document.createElement('style'); s.id = 'eggs-style'; s.textContent = css;
    document.head.appendChild(s);
  })();

  // === Matcher inşa ===
  async function buildMatcher() {
    const entries = [];
    for (const url of CONFIG.urls) {
      try {
        const res = await fetch(url, { cache: 'no-store' });
        if (!res.ok) continue;
        const json = await res.json();
        const key = (url.match(/([-\w]+)\.json/i) || [])[1]?.toLowerCase() || 'default';
        const effect = CONFIG.effectsMap[key] || 'oz';
        const nodes = Array.isArray(json.nodes) ? json.nodes : [];
        for (const n of nodes) {
          for (const term of termsFromNode(n)) entries.push({ term, effect });
        }
      } catch (_) { /* sessiz */ }
    }

    // JSON hiç gelmediyse kaba fallback (ID’lerden)
    if (entries.length === 0) {
      $$('[id]').forEach(el => {
        const idtxt = norm(el.id);
        if (/batman|dc|gotham/.test(idtxt)) entries.push({ term: 'batman', effect: 'bat' });
        if (/thanos|avengers|marvel|ironman|spider/.test(idtxt)) entries.push({ term: 'marvel', effect: 'dust' });
        if (/starwars|jedi|sith|skywalker/.test(idtxt)) entries.push({ term: 'starwars', effect: 'saber' });
        if (/harry|hogwarts|dumbledore/.test(idtxt)) entries.push({ term: 'harry', effect: 'oz' });
      });
    }

    entries.sort((a, b) => b.term.length - a.term.length);
    const union = entries.map(e => esc(e.term)).join('|');
    const bigRe = union ? new RegExp(`(?:${union})`, 'i') : null;

    return function run(query) {
      if (!bigRe) return false;
      const q = norm(query || '');
      if (!q || !q.match(bigRe)) return false;
      const hit = entries.find(e => new RegExp(esc(e.term), 'i').test(q));
      if (hit && Effects[hit.effect]) { Effects[hit.effect](); return true; }
      return false;
    };
  }

  // === Arama ve ID bağlama ===
  function wireSearch(matcher) {
    const input = CONFIG.searchSelectors.map(s => $(s)).find(Boolean);
    if (input) {
      let last = '';
      input.addEventListener('input', () => {
        const v = input.value || '';
        if (v !== last) { last = v; matcher(v); }
      });
    }
    // Alpine varsa ayrıca izle; yoksa sessizce geç
    try {
      if (window.Alpine) {
        const root = document.querySelector('[x-data]');
        const ctx = Alpine && Alpine.raw ? Alpine.raw(Alpine.$data(root)) : null;
        if (ctx && typeof ctx.$watch === 'function') ctx.$watch('search', v => matcher(String(v || '')));
        if (ctx && typeof ctx.$watch === 'function') ctx.$watch('filterText', v => matcher(String(v || '')));
      }
    } catch (_) {}
  }

  function wireElements(matcher) {
    $$('[id]').forEach(el => {
      const txt = String(el.id || '');
      el.addEventListener('mouseenter', () => matcher(txt));
      el.addEventListener('click',      () => matcher(txt));
    });
  }

  // === Başlat ===
  (async function init() {
    const matcher = await buildMatcher();
    wireSearch(matcher);
    wireElements(matcher);
    if (location.hash && location.hash.length > 1) matcher(location.hash.slice(1));
  })();
})();
