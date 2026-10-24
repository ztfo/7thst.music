// Mis dibujos / My art: the series, the grid, a viewer with a wall label.
// The pieces come from images-data.js (pnpm run fetch-images), so a new upload
// to Cloudinary shows up here without touching this file.
import { T, getLang, setLang, paintLang } from './i18n.js';
import { drawFrame, drawRule, fit } from './microtext.js';

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const esc = (s) => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
const pad2 = (n) => String(n).padStart(2, '0');
const cap = (s) => s.replace(/(^|\s)\S/g, (c) => c.toUpperCase());
const first = (s) => s.charAt(0).toUpperCase() + s.slice(1);
const track = (name, params) => { try { window.gtag?.('event', name, params); } catch {} };
$('#year').textContent = String(new Date().getFullYear());

// series in curated order; r is each series' height over width
const SERIES = {
  songart: { es: 'portadas', en: 'covers', r: 1 },
  dreams: { es: 'sueños', en: 'dreams', r: 1, one: { es: 'Sueño', en: 'Dream' } },
  mandalas: { es: 'mandalas', en: 'mandalas', r: 1, one: { es: 'Mandala', en: 'Mandala' } },
  voices: { es: 'voces', en: 'voices', r: 1 },
  animals: { es: 'animales', en: 'animals', r: 4 / 3 },
};
// file names become titles: "Wild_Elements_bu9ahz" reads "Wild Elements"; an id-only name is untitled
const FIX = { 'Quien Fue': '¿Quién fue?' };
function titleFrom(name) {
  if (/^[a-z0-9]{20}$/.test(name)) return null;
  const t = name.replace(/_[a-z0-9]{6}$/, '').replace(/^_+|_+$/g, '').replace(/_/g, ' ').replace(/\s+/g, ' ').trim();
  return FIX[t] || t;
}
const IMAGES = window.images || {};
const ART = Object.keys(SERIES).flatMap((s) => (IMAGES[s] || []).map((img) => ({ s, pid: img.publicId, t: titleFrom(img.displayName || '') })));
const CLOUD = 'https://res.cloudinary.com/dhjy8pfsa/image/upload';
const small = (a) => `${CLOUD}/f_auto,q_auto/c_limit,w_640,h_640/${a.pid}`;
const large = (a) => `${CLOUD}/f_auto,q_auto/c_limit,w_1400,h_1400/${a.pid}`;

fit($('#rule'), drawRule);
const frameEl = $('#viewer-frame');
fit(frameEl, drawFrame);

// ---------- the series, the grid ----------
const PER_PAGE = 12;
const obra = { s: Object.keys(SERIES).find((s) => ART.some((a) => a.s === s)) || 'songart', all: false, v: null, from: null };
const inSeries = (s) => ART.filter((a) => a.s === s);
const titleOf = (a) => a.t || `${SERIES[a.s].one?.[getLang()] || cap(SERIES[a.s][getLang()])} nº ${inSeries(a.s).indexOf(a) + 1}`;
const worksEl = $('#works');
function renderObra() {
  $('#series').innerHTML = Object.keys(SERIES).filter((s) => inSeries(s).length).map((s) => `<button type="button" data-series="${s}" aria-pressed="${s === obra.s}">${SERIES[s][getLang()]}<b>${inSeries(s).length}</b></button>`).join('');
  const list = inSeries(obra.s);
  const shown = obra.all ? list : list.slice(0, PER_PAGE);
  worksEl.classList.toggle('is-portrait', SERIES[obra.s].r > 1.1);
  worksEl.style.setProperty('--r', SERIES[obra.s].r);
  worksEl.innerHTML = shown.map((a, k) => `<button class="work" type="button" data-work="${k}"><span class="work__img"><img src="${small(a)}" alt="${esc(titleOf(a))}" loading="lazy" decoding="async"></span><span class="work__cap"><b>${pad2(k + 1)}</b>${esc(titleOf(a))}</span></button>`).join('');
  const more = $('#works-more');
  more.hidden = list.length <= PER_PAGE;
  more.textContent = obra.all ? T('seeLess') : T('seeAll')(list.length);
}
$('#series').addEventListener('click', (e) => {
  const b = e.target.closest('[data-series]');
  if (!b || b.dataset.series === obra.s) return;
  obra.s = b.dataset.series;
  obra.all = false;
  renderObra();
});
$('#works-more').addEventListener('click', () => {
  obra.all = !obra.all;
  renderObra();
  if (!obra.all) $('#obra').scrollIntoView({ block: 'start' });
});

// ---------- the viewer ----------
const viewer = $('#viewer');
const viewerImg = $('#viewer-img');
function showWork(k) {
  const list = inSeries(obra.s);
  obra.v = (k + list.length) % list.length;
  const a = list[obra.v];
  viewerImg.classList.add('is-loading');
  viewerImg.onload = () => viewerImg.classList.remove('is-loading');
  viewerImg.src = large(a);
  viewerImg.alt = titleOf(a);
  $('#viewer-series').textContent = SERIES[a.s][getLang()];
  $('#viewer-title').textContent = titleOf(a);
  $('#viewer-count').textContent = `${pad2(obra.v + 1)} / ${pad2(list.length)}`;
  // the neighbours load while this one is looked at
  [1, -1].forEach((d) => { new Image().src = large(list[(obra.v + d + list.length) % list.length]); });
}
worksEl.addEventListener('click', (e) => {
  const b = e.target.closest('[data-work]');
  if (!b) return;
  obra.from = b;
  showWork(+b.dataset.work);
  viewer.showModal();
  drawFrame(frameEl);
  track('art_open', { series: obra.s, piece: titleOf(inSeries(obra.s)[obra.v]) });
});
viewer.addEventListener('close', () => { obra.v = null; if (obra.from) obra.from.focus(); });
$('#viewer-close').addEventListener('click', () => viewer.close());
viewer.addEventListener('click', (e) => {
  const b = e.target.closest('[data-view]');
  if (b) showWork(obra.v + +b.dataset.view);
});
// swipe between works; a tap off the work closes the viewer
const stageEl = $('#viewer-stage');
let swipeX = null;
stageEl.addEventListener('pointerdown', (e) => { swipeX = e.clientX; });
stageEl.addEventListener('pointerup', (e) => {
  if (swipeX === null) return;
  const dx = e.clientX - swipeX;
  swipeX = null;
  if (Math.abs(dx) > 48) showWork(obra.v + (dx < 0 ? 1 : -1));
  else if (e.target === stageEl) viewer.close();
});
// escape is the dialog's own
document.addEventListener('keydown', (e) => {
  if (!viewer.open || e.metaKey || e.ctrlKey || e.altKey) return;
  if (e.key === 'ArrowRight') { e.preventDefault(); showWork(obra.v + 1); }
  if (e.key === 'ArrowLeft') { e.preventDefault(); showWork(obra.v - 1); }
});

// ---------- language ----------
function applyLang() {
  paintLang();
  $$('[data-view]').forEach((b) => b.setAttribute('aria-label', first(T(b.dataset.view === '1' ? 'nextWork' : 'prevWork'))));
  renderObra();
  if (obra.v !== null) showWork(obra.v);
}
$('#lang').addEventListener('click', () => {
  setLang(getLang() === 'es' ? 'en' : 'es');
  applyLang();
  track('lang_switch', { lang: getLang() });
});
applyLang();
