// Mis dibujos / My art: the series, the grid, a viewer with a wall label.
// The pieces come from images-data.js (pnpm run fetch-images), so a new upload
// to Cloudinary shows up here without touching this file.
import { T, getLang, setLang, paintLang } from './i18n.js';
import { drawFrame, drawRule, fit } from './microtext.js';
import { pad2 } from './markup.js';
import { SERIES, PER_PAGE, piecesFrom, large, seriesButtons, workTiles, inSeries as piecesIn, titleOf as nameOf } from './art-markup.js';

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const first = (s) => s.charAt(0).toUpperCase() + s.slice(1);
const track = (name, params) => { try { window.gtag?.('event', name, params); } catch {} };
$('#year').textContent = String(new Date().getFullYear());

const ART = piecesFrom(window.images || {});

fit($('#rule'), drawRule);
const frameEl = $('#viewer-frame');
fit(frameEl, drawFrame);

// ---------- the series, the grid ----------
const obra = { s: Object.keys(SERIES).find((s) => ART.some((a) => a.s === s)) || 'songart', all: false, v: null, from: null };
const inSeries = (s) => piecesIn(ART, s);
const titleOf = (a) => nameOf(ART, a, getLang());
const worksEl = $('#works');
function renderObra() {
  $('#series').innerHTML = seriesButtons(ART, obra.s, getLang());
  const list = inSeries(obra.s);
  const shown = obra.all ? list : list.slice(0, PER_PAGE);
  worksEl.classList.toggle('is-portrait', SERIES[obra.s].r > 1.1);
  worksEl.style.setProperty('--r', SERIES[obra.s].r);
  worksEl.innerHTML = workTiles(ART, shown, getLang());
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
