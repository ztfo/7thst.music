// The home page: the table, the deck, the player, the sketches from SoundCloud.
import { TRACKS, SKETCHES, SKETCH_SET, PLATFORMS, groundUrl } from '../data/tracks.js';
import ENVELOPES from '../data/envelopes.js';
import { T, getLang, setLang, paintLang } from './i18n.js';
import { micro, drawFrame, fit } from './microtext.js';

const PREVIEW = 30;
// worlds load at the size the screen needs
const GROUND_W = innerWidth <= 760 ? 1000 : 1600;
const ground = (t) => groundUrl(t.ground, GROUND_W);

// each card's length and its room envelope, both measured when the audio was cut
TRACKS.forEach((t) => {
  const e = ENVELOPES[t.id];
  if (!e) return;
  t.dur = e.dur;
  const bytes = Uint8Array.from(atob(e.low), (c) => c.charCodeAt(0));
  const onset = new Uint8Array(bytes.length);
  e.onsets.forEach((f) => { onset[f] = 1; });
  t.env = { hop: e.hop, low: Float32Array.from(bytes, (v) => (v / 255) * 1.2), onset };
});

// Google Analytics events, quietly skipped wherever gtag is blocked
const track = (name, params) => { try { window.gtag?.('event', name, params); } catch {} };

const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const fine = matchMedia('(hover: hover) and (pointer: fine)').matches;
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const session = {
  get(k) { try { return sessionStorage.getItem(k); } catch { return null; } },
  set(k, v) { try { sessionStorage.setItem(k, v); } catch {} },
};
$('#year').textContent = String(new Date().getFullYear());
const SVGNS = 'http://www.w3.org/2000/svg';

const fmt = (s) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;
// card names take every word capitalized; labels and tips only their first
const cap = (s) => s.replace(/(^|\s)\S/g, (c) => c.toUpperCase());
const first = (s) => s.charAt(0).toUpperCase() + s.slice(1);
const esc = (s) => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
const pad2 = (n) => String(n).padStart(2, '0');
const monthYear = (iso) => { const [y, m] = iso.split('-').map(Number); return `${T('months')[m - 1]} ${y}`; };

// ---------- the card back, engraved once and reused everywhere ----------
// An engraved net: one ring per radius, each a cosine wave around the circle.
// Alternate rings run in opposite phase so neighbours cross into a mesh;
// an even wave count keeps it the same upside down and mirrored, like a real deck.
function net(cx, cy, k, a, step, r0, r1, perLobe = 18) {
  let d = '';
  for (let R = r0, i = 0; R <= r1; R += step, i++) {
    const steps = k * perLobe;
    const ph = (i % 2) * Math.PI;
    for (let j = 0; j <= steps; j++) {
      const t = (j / steps) * Math.PI * 2;
      const r = R + a * Math.cos(k * t + ph);
      d += `${j ? 'L' : 'M'}${(cx + r * Math.cos(t)).toFixed(1)} ${(cy + r * Math.sin(t)).toFixed(1)}`;
    }
    d += 'Z';
  }
  return d;
}
function buildBack() {
  const W = 516, H = 884, cx = 258, cy = 442;
  const t = (x, y, len, rot = 0) => `<text x="0" y="0" transform="translate(${x} ${y}) rotate(${rot})" textLength="${len}" lengthAdjust="spacing" font-family="Archivo, sans-serif" font-weight="600" font-size="6.4" fill="#d2b97c" fill-opacity=".5">${micro(len)}</text>`;
  const corner = (x, y, sx, sy) => `<path d="M${x} ${y + sy * 9}V${y}H${x + sx * 9}" fill="none" stroke="#d2b97c" stroke-opacity=".55" stroke-width=".8"/>`;
  const inner = 31.5;
  const clip = document.createElementNS(SVGNS, 'clipPath');
  clip.setAttribute('id', 'back-field');
  clip.innerHTML = `<rect x="${inner}" y="${inner}" width="${W - inner * 2}" height="${H - inner * 2}" rx="3"/>`;
  $('#defs').appendChild(clip);
  const sym = document.createElementNS(SVGNS, 'symbol');
  sym.setAttribute('id', 'card-back');
  sym.setAttribute('viewBox', `0 0 ${W} ${H}`);
  sym.innerHTML = [
    `<rect width="${W}" height="${H}" rx="10" fill="#0c0b09"/>`,
    `<rect x="17.5" y="17.5" width="${W - 35}" height="${H - 35}" rx="5" fill="none" stroke="#d2b97c" stroke-opacity=".45" stroke-width="1.1"/>`,
    // each run sits centred in the band between the two borders (17.5 to 31.5);
    // turned text grows to one side of its baseline, so the sides anchor further in
    t(40, 26.75, W - 80), t(40, H - 22.25, W - 80),
    t(26.75, H - 40, H - 80, -90), t(W - 26.75, 40, H - 80, 90),
    `<rect x="${inner}" y="${inner}" width="${W - inner * 2}" height="${H - inner * 2}" rx="3" fill="none" stroke="#d2b97c" stroke-opacity=".3" stroke-width=".8"/>`,
    corner(inner + 7, inner + 7, 1, 1), corner(W - inner - 7, inner + 7, -1, 1), corner(inner + 7, H - inner - 7, 1, -1), corner(W - inner - 7, H - inner - 7, -1, -1),
    // the net covers the whole field and runs past it; the field's edge clips it.
    // Wave count rises zone to zone so cells stay the same size out to the corners.
    `<g clip-path="url(#back-field)" fill="none" stroke="#d2b97c" stroke-width=".85">`,
    `<path d="${net(cx, cy, 20, 14, 15, 76, 200)}"/>`,
    `<path d="${net(cx, cy, 36, 13, 15, 214, 340)}"/>`,
    `<path d="${net(cx, cy, 52, 12, 15, 354, 484)}"/>`,
    `</g>`,
    `<rect x="${cx - 72}" y="${cy - 72}" width="144" height="144" fill="#0c0b09" fill-opacity=".6" stroke="#d2b97c" stroke-opacity=".28" stroke-width=".6"/>`,
    `<rect x="${cx - 62}" y="${cy - 62}" width="124" height="124" fill="#0c0b09" stroke="#d2b97c" stroke-opacity=".5" stroke-width=".9"/>`,
    `<rect x="${cx - 55}" y="${cy - 55}" width="110" height="110" fill="none" stroke="#d2b97c" stroke-opacity=".22" stroke-width=".6"/>`,
    `<use href="#llu-path" transform="translate(${cx - 26} ${cy - 26}) scale(1.1818)" fill="url(#llu-gold)" opacity=".92"/>`,
  ].join('');
  $('#defs').appendChild(sym);
}
buildBack();

const backHTML = () => '<span class="face face--back"><svg viewBox="0 0 516 884"><use href="#card-back"/></svg></span>';
const sealHTML = (t) => `<span class="seal"><span class="seal__n">${t.n}</span><span class="seal__mid"><span class="seal__name">${t.card}</span><span class="seal__date">${T('preview')} · ${T('when')}</span></span><span class="seal__stamp"><svg viewBox="0 0 44 44"><use href="#llu-mono"/></svg></span></span>`;
const sealedHTML = (t, ring) => `<span class="face face--back face--sealed" style="--field:${t.field}"><svg viewBox="0 0 516 884"><use href="#card-back"/></svg>${ring ? '<svg class="ringsvg" viewBox="0 0 516 884"><path class="ring" d="M258 370H330V514H186V370H258" pathLength="1"/></svg>' : ''}${sealHTML(t)}</span>`;
const faceHTML = (t, ring = false) => (t.sealed ? sealedHTML(t, ring) : `<span class="face face--art"><img src="${t.img}" alt="" width="516" height="884" draggable="false"></span>`);
const edgeOf = (t) => (t.sealed ? t.field : 'rgba(239, 232, 216, 0.55)');

TRACKS.forEach((t) => { if (t.img) { new Image().src = t.img; new Image().src = ground(t); } });

const table = $('#table');
const audio = $('#audio');
const cardBtn = $('#card');
const cardInner = $('#card-inner');
const cardFront = $('#card-front');
const deckBtn = $('#deck');
const sungEl = $('#sung');
const swap = $('#meta-swap');
const status = $('#status');
const mainBar = $('#player [data-bar]');
const miniBar = $('#mini [data-bar]');
$('#card-reverse').innerHTML = backHTML();

// src: what the mini player and the space bar follow, the card or a sketch
const state = { i: null, drawn: new Set(), sung: [], playing: false, breath: 0, kick: 0, lastFrame: -1, previewEnded: false, ready: false, src: 'card' };

// ---------- worlds ----------
const worldEl = $('#world');
const layers = TRACKS.map((t) => {
  const d = document.createElement('div');
  d.className = 'world__layer';
  const tex = document.createElement('div');
  tex.className = 'world__tex';
  tex.style.setProperty('--img', `url(${ground(t)})`);
  if (t.fx) tex.style.setProperty('--fx', t.fx);
  if (t.fy) tex.style.setProperty('--fy', t.fy);
  d.appendChild(tex);
  if (t.tint) { d.dataset.tint = ''; d.style.setProperty('--tint', t.tint); }
  worldEl.appendChild(d);
  return d;
});

// the frame: four runs of microtext, fitted to the table
fit($('#frame'), drawFrame);

// ---------- the tracklist, follow links ----------
const tracksEl = $('#tracks');
const miniCard = (t) => (t.sealed
  ? `<span class="mini-card mini-card--sealed" style="--field:${t.field}"></span>`
  : `<span class="mini-card"><img src="${t.img}" alt="" width="20" height="34"></span>`);
function renderTracks() {
  tracksEl.style.setProperty('--n', TRACKS.length);
  tracksEl.innerHTML = TRACKS.map((t, i) => `<button class="tk" type="button" data-track="${i}" style="${t.sealed ? `--field:${t.field}` : ''}" aria-label="${t.n}, ${cap(t.card)}, ${t.sealed ? `${T('previewLong')}, ${T('outWhen')}` : `${T('fullSong')}, ${fmt(t.dur)}`}">${miniCard(t)}<span class="tk__txt"><span class="tk__name"><b>${t.n}</b>${cap(t.card)}</span><span class="tk__meta">${t.sealed ? `<span class="dot"></span>${T('preview')}` : `<span class="tk__dur tnum">${fmt(t.dur)}</span>`}<span class="eq" aria-hidden="true"><i></i><i></i><i></i></span></span></span></button>`).join('');
  markTracks();
}
function markTracks() {
  $$('.tk').forEach((b) => {
    const on = +b.dataset.track === state.i;
    b.classList.toggle('is-on', on);
    b.classList.toggle('is-playing', on && state.playing);
    b.setAttribute('aria-current', on ? 'true' : 'false');
  });
}
const followLinks = () => PLATFORMS.map((p) => `<a href="${p.href}" target="_blank" rel="noopener" data-platform="${p.name}"><span>${p.name}</span><svg><use href="#i-out"/></svg></a>`).join('');
$('#platforms').innerHTML = followLinks();
const followPop = $('#follow-pop');
function setFollow(open) {
  followPop.hidden = !open;
  $('[data-act="follow"]').setAttribute('aria-expanded', String(open));
}
document.addEventListener('click', (e) => {
  if (!followPop.hidden && !e.target.closest('#follow-pop, [data-act="follow"]')) setFollow(false);
  const out = e.target.closest('[data-platform]');
  if (out) track('follow_click', { platform: out.dataset.platform, lang: getLang() });
});

// ---------- the scrub bar: the song, or the preview plus what's still to come ----------
// lock: the label for a preview's hatched remainder; none for a full song or a sketch
function fillBar(bar, dur, lock = '') {
  const preview = !!lock;
  bar.classList.toggle('is-preview', preview);
  bar.style.setProperty('--lockw', preview ? '38%' : '0%');
  let ticks = '';
  if (!preview) for (let m = 60; m < dur; m += 60) ticks += `<span style="left:${((m / dur) * 100).toFixed(2)}%"></span>`;
  bar.innerHTML = `<div class="bar__track"><i class="bar__fill"></i></div><div class="bar__ticks">${ticks}</div><div class="bar__lock"></div><span class="bar__lockl">${lock}</span><span class="bar__thumb"></span><span class="bar__hover tnum"></span>`;
}
const lockOf = (t) => (t.sealed ? T('restOf') : '');
function buildBar(t) {
  fillBar(mainBar, t.dur, lockOf(t));
  $('#player [data-total]').textContent = fmt(lenOf(t));
  mainBar.setAttribute('aria-label', `${T('position')}, ${cap(t.card)}`);
  syncMini();
}
// the mini player follows whatever is on: the card, or a sketch
const miniSketch = () => (state.src === 'sketch' && sk.i !== null ? SKETCHES[sk.i] : null);
function syncMini() {
  const s = miniSketch();
  const t = state.i !== null ? TRACKS[state.i] : null;
  if (s) {
    $('#mini-thumb').innerHTML = backHTML();
    $('#mini-eyebrow').textContent = `${T('wip')} · ${fmt(s.dur)}`;
    $('#mini-title').textContent = s.title;
    fillBar(miniBar, s.dur);
    $('#mini [data-total]').textContent = fmt(s.dur);
  } else if (t) {
    $('#mini-thumb').innerHTML = faceHTML(t);
    $('#mini-eyebrow').textContent = `${t.n} · ${$('#pill-text').textContent}`;
    $('#mini-title').textContent = t.card;
    fillBar(miniBar, t.dur, lockOf(t));
    $('#mini [data-total]').textContent = fmt(lenOf(t));
  }
  syncMiniIcon();
}
function syncMiniIcon() {
  const on = miniSketch() ? sk.playing || sk.want : state.playing;
  $('#mini [data-toggle-icon]').setAttribute('href', on ? '#i-pause' : '#i-play');
  const b = $('#mini [data-act="toggle"]');
  b.dataset.tip = first(on ? T('pause') : T('play'));
  b.setAttribute('aria-label', b.dataset.tip);
}
function setPill(t) {
  const pill = $('#pill');
  pill.className = `pill ${t.sealed ? 'pill--preview' : 'pill--full'}`;
  pill.style.setProperty('--field', t.field || 'transparent');
  $('#pill-text').textContent = t.sealed ? `${T('previewPill')} · ${T('outWhen')}` : `${T('fullSong')} · ${fmt(t.dur)}`;
}
function setTips() {
  const tip = { draw: T('draw'), prev: T('prevCard'), next: T('nextCard'), follow: T('followTip'), toggle: state.playing ? T('pause') : T('play') };
  $$('[data-tip]').forEach((b) => {
    const v = tip[b.dataset.act];
    if (!v) return;
    b.dataset.tip = first(v);
    b.setAttribute('aria-label', first(v));
  });
}

// ---------- binding ----------
function bind(t) {
  $$('[data-b="n"]').forEach((n) => { n.textContent = String(t.n); });
  $$('[data-b="card"]').forEach((n) => { n.textContent = t.card; });
  setPill(t);
  bindCounts();
  markTracks();
  cardBtn.classList.toggle('is-sealed', !!t.sealed);
  buildBar(t);
  $('#playmark-label').textContent = t.sealed ? T('previewListen') : T('listen');
  cardBtn.setAttribute('aria-label', `${first(state.playing ? T('pause') : T('play'))}: ${cap(t.card)}`);
}
function bindCounts() {
  $$('[data-b="sung"]').forEach((n) => { n.textContent = String(state.sung.length); });
  $$('[data-b="left"]').forEach((n) => { n.textContent = String(TRACKS.length - state.drawn.size); });
  $$('[data-b="total"]').forEach((n) => { n.textContent = String(TRACKS.length); });
}
function applyLang() {
  paintLang();
  setTips();
  followPop.innerHTML = `<p>${T('followPop')}</p>${followLinks()}`;
  renderTracks();
  renderSung();
  renderDeck();
  renderSketches();
  if (state.i !== null) {
    const t = TRACKS[state.i];
    bind(t);
    if (t.sealed) cardFront.innerHTML = faceHTML(t, true);
  }
}
$('#lang').addEventListener('click', () => {
  setLang(getLang() === 'es' ? 'en' : 'es');
  applyLang();
  track('lang_switch', { lang: getLang() });
});

// ---------- piles, with card edges ----------
function stackHTML(list, topHTML) {
  const edges = list.slice(0, -1).slice(-7);
  return edges.map((t, j) => `<span class="edge" style="--e:${edgeOf(t)};--o:${edges.length - j}"></span>`).join('') + `<span class="stack__top">${topHTML}</span>`;
}
function renderDeck() {
  const left = TRACKS.filter((_, k) => !state.drawn.has(k));
  deckBtn.innerHTML = left.length ? stackHTML(left, backHTML()) : '<span class="stack-empty"></span>';
}
function renderSung() {
  const list = state.sung.map((k) => TRACKS[k]);
  sungEl.innerHTML = list.length ? stackHTML(list, faceHTML(list[list.length - 1])) : '<span class="stack-empty"></span>';
}

// ---------- the deal ----------
function swapMeta(t, instant) {
  if (instant || reduce) return bind(t);
  swap.classList.add('is-swapping');
  setTimeout(() => { bind(t); swap.classList.remove('is-swapping'); }, 220);
}
// dir: 1 or -1 when the card was swiped, so it leaves the way the finger sent it
function flyToSung(k, dir = 0) {
  const from = cardBtn.getBoundingClientRect();
  const to = sungEl.getBoundingClientRect();
  const fly = document.createElement('div');
  Object.assign(fly.style, { position: 'fixed', zIndex: 70, pointerEvents: 'none', left: `${from.left}px`, top: `${from.top}px`, width: `${from.width}px`, height: `${from.height}px` });
  fly.innerHTML = faceHTML(TRACKS[k]);
  document.body.appendChild(fly);
  const visible = to.width > 0;
  const dx = visible ? to.left + to.width / 2 - (from.left + from.width / 2) : (dir ? -dir * window.innerWidth * 0.8 : window.innerWidth * 0.6);
  const dy = visible ? to.top + to.height / 2 - (from.top + from.height / 2) : 0;
  const s = visible ? to.height / from.height : (dir ? 0.9 : 0.6);
  fly.animate([{ transform: 'none', opacity: 1 }, { transform: `translate(${dx}px, ${dy}px) scale(${s})`, opacity: visible ? 1 : 0 }], { duration: 820, easing: 'cubic-bezier(.5,0,.2,1)' }).onfinish = () => { fly.remove(); renderSung(); };
}
function deal(i, { instant = false, autoplay = false, dir = 0 } = {}) {
  const t = TRACKS[i];
  const prev = state.i;
  if (prev === i) return;
  if (prev !== null) {
    if (!state.sung.includes(prev)) state.sung.push(prev);
    if (!instant && !reduce) flyToSung(prev, dir); else renderSung();
  }
  state.i = i;
  state.drawn.add(i);
  status.hidden = true;
  setFollow(false);
  layers.forEach((l, k) => l.classList.toggle('is-on', k === i));
  cardFront.innerHTML = faceHTML(t, true);
  renderDeck();
  swapMeta(t, instant);
  if (!instant && !reduce) {
    const d = deckBtn.getBoundingClientRect();
    const c = cardBtn.getBoundingClientRect();
    const fromDeck = d.width > 0;
    const dx = fromDeck ? d.left + d.width / 2 - (c.left + c.width / 2) : dir * window.innerWidth * 0.7;
    const dy = fromDeck ? d.top + d.height / 2 - (c.top + c.height / 2) : (dir ? 0 : 60);
    const s = fromDeck ? d.height / c.height : (dir ? 0.96 : 0.85);
    // sealed cards land face down, so they travel without turning over
    const turn = t.sealed ? 0 : 180;
    table.classList.add('is-dealing');
    cardInner.animate(
      [
        { transform: `translate(${dx}px, ${dy}px) scale(${s}) rotateY(${turn}deg)` },
        { offset: 0.5, transform: `translate(${dx * 0.2}px, ${dy * 0.2 - 20}px) scale(${(s + 1) / 2}) rotateY(${turn * 0.6}deg)` },
        { transform: 'none' },
      ],
      { duration: 1150, easing: 'cubic-bezier(.16,1,.3,1)', delay: prev === null ? 0 : 140, fill: 'backwards' },
    ).onfinish = () => table.classList.remove('is-dealing');
  }
  load(t, autoplay);
}
function drawRandom(autoplay) {
  const left = TRACKS.map((_, k) => k).filter((k) => k !== state.i && !state.drawn.has(k));
  const pool = left.length ? left : TRACKS.map((_, k) => k).filter((k) => k !== state.i);
  deal(pool[Math.floor(Math.random() * pool.length)], { autoplay });
}

// ---------- audio: full songs for face-up cards, a 30-second preview for sealed ones ----------
// A sealed card's file is only its preview, already faded in and out.
const lenOf = (t) => (t.sealed ? PREVIEW : t.dur);
function load(t, autoplay) {
  const resume = state.playing || autoplay;
  // until the new file reports in, currentTime can still be the last song's
  state.ready = false;
  audio.src = t.src;
  state.lastFrame = -1;
  state.previewEnded = false;
  if (resume) play(); else setPlaying(false);
}
audio.addEventListener('loadedmetadata', () => {
  const t = TRACKS[state.i];
  if (!t) return;
  if (!t.sealed && isFinite(audio.duration)) { t.dur = audio.duration; setPill(t); buildBar(t); }
  state.ready = true;
});
function play() {
  const t = TRACKS[state.i];
  if (sk.playing || sk.want) pauseSketch();
  setSource('card');
  if (t.sealed && state.previewEnded) { audio.currentTime = 0; state.previewEnded = false; status.hidden = true; }
  const p = audio.play();
  if (p && p.catch) p.catch(() => setPlaying(false));
  setPlaying(true);
  session.set('bs-arrived', '1');
  track('card_play', { card: t.id, kind: t.sealed ? 'preview' : 'full', lang: getLang() });
}
// a preview stops on its card and says when the rest comes, instead of dealing the next
function previewOver(t) {
  setPlaying(false);
  state.previewEnded = true;
  status.innerHTML = `${T('previewOver')(cap(t.card))} <button type="button" data-act="follow">${T('followToHear')}</button>, <button type="button" data-act="next">${T('orNext')}</button>.`;
  status.hidden = false;
}
function pause() { audio.pause(); setPlaying(false); }
function toggle() { if (state.playing) pause(); else play(); }
function setPlaying(on) {
  state.playing = on;
  table.classList.toggle('is-playing', on);
  $('#mini').classList.toggle('is-playing', on);
  $('#player [data-toggle-icon]').setAttribute('href', on ? '#i-pause' : '#i-play');
  setTips();
  syncMiniIcon();
  markTracks();
  $('#playmark-icon').setAttribute('href', on ? '#i-pause' : '#i-play');
  if (state.i !== null) cardBtn.setAttribute('aria-label', `${first(on ? T('pause') : T('play'))}: ${cap(TRACKS[state.i].card)}`);
}
audio.addEventListener('ended', () => {
  const t = TRACKS[state.i];
  if (t.sealed) previewOver(t);
  else deal((state.i + 1) % TRACKS.length, { autoplay: true });
});
audio.addEventListener('error', () => {
  status.textContent = T('failed')(cap(TRACKS[state.i].card));
  status.hidden = false;
  setPlaying(false);
});
function seekTo(fraction) {
  const t = TRACKS[state.i];
  if (!t) return;
  const f = Math.max(0, Math.min(0.999, fraction));
  audio.currentTime = f * lenOf(t);
  state.lastFrame = -1;
  if (t.sealed) state.previewEnded = false;
}

// ---------- frame loop ----------
let lastT = 0;
function loop(now) {
  const dt = lastT ? Math.min(0.1, (now - lastT) / 1000) : 0;
  lastT = now;
  if (arrival.running && now - arrival.start > 6500) finishArrival();
  const t = state.i !== null ? TRACKS[state.i] : null;
  if (t) {
    const ct = state.ready ? audio.currentTime || 0 : 0;
    const pos = Math.min(ct, lenOf(t));
    const len = lenOf(t);
    const p = Math.min(1, pos / len);
    mainBar.style.setProperty('--p', p.toFixed(4));
    $('#player [data-now]').textContent = fmt(pos);
    if (!miniSketch()) {
      miniBar.style.setProperty('--p', p.toFixed(4));
      $('#mini [data-now]').textContent = fmt(pos);
    }
    mainBar.setAttribute('aria-valuenow', String(Math.round(p * 100)));
    mainBar.setAttribute('aria-valuetext', `${fmt(pos)} / ${fmt(len)}`);
    if (t.sealed) cardFront.style.setProperty('--ring', (1 - p).toFixed(4));
    let target = 0;
    if (state.playing && !audio.paused && t.env) {
      const f = Math.min(t.env.low.length - 1, Math.floor(ct / t.env.hop));
      target = t.env.low[f] || 0;
      if (f > state.lastFrame) { for (let g = Math.max(state.lastFrame + 1, f - 3); g <= f; g++) if (t.env.onset[g]) state.kick = 1; }
      state.lastFrame = f;
    } else if (!state.playing) { state.lastFrame = -1; }
    state.breath += (target - state.breath) * (target > state.breath ? 0.35 : 0.05);
    state.kick *= Math.exp(-dt * 5);
    table.style.setProperty('--breath', state.breath.toFixed(3));
    table.style.setProperty('--kick', state.kick.toFixed(3));
  }
  if (sk.i !== null) {
    const s = SKETCHES[sk.i];
    const pos = Math.min(s.dur, sk.pos + (sk.playing ? (now - sk.at) / 1000 : 0));
    const p = (pos / s.dur).toFixed(4);
    const row = skEl.children[sk.i]?.firstElementChild;
    if (row) {
      row.style.setProperty('--p', p);
      const shown = `${fmt(pos)} / ${fmt(s.dur)}`;
      const l = row.querySelector('.sk__l');
      if (l.textContent !== shown) l.textContent = shown;
    }
    if (miniSketch()) {
      miniBar.style.setProperty('--p', p);
      $('#mini [data-now]').textContent = fmt(pos);
    }
  }
  requestAnimationFrame(loop);
}
requestAnimationFrame(loop);

// ---------- en proceso: SoundCloud's own player, hidden, under these controls ----------
// Plays still count on SoundCloud. If its player can't load here, each row opens SoundCloud instead.
// iPhones can refuse to start a hidden player from the page's own button: when a tap
// plays nothing, SoundCloud's own player opens in that row, and every row after it.
const SC = 'https://w.soundcloud.com';
const SHOWN = 12;
const sk = { frame: null, i: null, loaded: null, ready: false, failed: false, playing: false, want: false, pos: 0, at: 0, timer: 0, embed: false, nudge: 0 };
const skEl = $('#sketches');
function scSend(method, value) {
  if (sk.frame && sk.frame.contentWindow) sk.frame.contentWindow.postMessage(JSON.stringify(value === undefined ? { method } : { method, value }), SC);
}
// moving an iframe reloads it, so the player reports ready again wherever it lands
function placeFrame(i) {
  const li = skEl.children[i];
  let box = li.querySelector('.sk-embed');
  if (!box) {
    box = document.createElement('div');
    box.className = 'sk-embed';
    box.innerHTML = `<p>${T('tapToPlay')}</p>`;
    li.appendChild(box);
  }
  if (sk.frame.parentNode !== box) { sk.ready = false; box.appendChild(sk.frame); }
  skEl.querySelectorAll('.sk-embed').forEach((b) => { if (b !== box) b.remove(); });
}
function armNudge() {
  clearTimeout(sk.nudge);
  if (sk.embed) return;
  sk.nudge = setTimeout(() => {
    if (!sk.want || sk.playing || !sk.ready) return;
    sk.embed = true;
    placeFrame(sk.i);
  }, 2500);
}
const widgetSrc = (api) => `${SC}/player/?url=${encodeURIComponent(api)}&color=%23d2b97c&auto_play=false&visual=false&show_artwork=false&sharing=false&buying=false&download=false&show_comments=false&show_teaser=false`;
function scFrame() {
  if (sk.frame) return;
  sk.frame = document.createElement('iframe');
  sk.frame.allow = 'autoplay; encrypted-media';
  sk.frame.title = 'SoundCloud';
  $('#sc-host').appendChild(sk.frame);
}
// sk.loaded is a sketch's index, or 'set' while the player reads the whole set
function scLoad(i) {
  scFrame();
  if (sk.embed) placeFrame(i);
  sk.loaded = i;
  sk.ready = false;
  sk.frame.src = widgetSrc(`https://api.soundcloud.com/tracks/${SKETCHES[i].id}`);
  scTimeout();
}
// The list on the page is a snapshot. Reading the set when it comes into view adds
// whatever was uploaded since, so a new sketch shows up without touching the site.
function scLoadSet() {
  scFrame();
  sk.loaded = 'set';
  sk.ready = false;
  sk.frame.src = widgetSrc(`https://api.soundcloud.com/playlists/${SKETCH_SET.playlist}`);
  scTimeout();
}
function mergeSketches(sounds) {
  if (!Array.isArray(sounds) || !sounds.length) return;
  const inSet = new Set(sounds.map((s) => s.id));
  // only the set's first few come with details, which is where new uploads land
  const fresh = sounds
    .filter((s) => s.title && s.duration && !SKETCHES.some((k) => k.id === s.id))
    .map((s) => ({ id: s.id, title: s.title, dur: Math.round(s.duration / 1000), date: String(s.display_date || s.created_at).slice(0, 10), url: s.permalink_url }));
  const keep = (k) => inSet.has(k.id);
  const current = sk.i !== null ? SKETCHES[sk.i].id : null;
  const next = [...fresh, ...SKETCHES.filter(keep)].sort((a, b) => b.date.localeCompare(a.date)).slice(0, SHOWN);
  if (current !== null && !next.some((k) => k.id === current)) return;
  SKETCHES.splice(0, SKETCHES.length, ...next);
  SKETCH_SET.count = sounds.length;
  if (current !== null) sk.i = SKETCHES.findIndex((k) => k.id === current);
  renderSketches();
}
function scTimeout() {
  clearTimeout(sk.timer);
  sk.timer = setTimeout(() => {
    if (sk.ready) return;
    sk.failed = true;
    sk.want = false;
    renderSketches();
    syncMini();
  }, 6000);
}
addEventListener('message', (e) => {
  if (e.origin !== SC || !sk.frame || e.source !== sk.frame.contentWindow) return;
  let d;
  try { d = JSON.parse(e.data); } catch { return; }
  if (d.method === 'ready') {
    sk.ready = true;
    clearTimeout(sk.timer);
    if (sk.failed) { sk.failed = false; renderSketches(); }
    ['play', 'pause', 'finish', 'playProgress'].forEach((ev) => scSend('addEventListener', ev));
    if (sk.loaded === 'set') scSend('getSounds');
    if (sk.want && sk.loaded === sk.i) { scSend('play'); armNudge(); }
  }
  if (d.method === 'getSounds' && sk.loaded === 'set') mergeSketches(d.value);
  if (d.method === 'play') { sk.playing = true; sk.want = true; sk.at = performance.now(); clearTimeout(sk.nudge); setSource('sketch'); if (state.playing) pause(); syncSketch(); }
  // SoundCloud also pauses its widgets on its own, when another of its players starts
  if (d.method === 'pause') { sk.playing = false; sk.want = false; syncSketch(); }
  if (d.method === 'finish') {
    if (sk.i === null) return;
    sk.playing = false;
    sk.want = false;
    if (sk.i < SKETCHES.length - 1) playSketch(sk.i + 1);
    else syncSketch();
  }
  if (d.method === 'playProgress' && d.value) { sk.pos = d.value.currentPosition / 1000; sk.at = performance.now(); }
});
function playSketch(i) {
  if (state.playing) pause();
  if (sk.i !== i) sk.pos = 0;
  sk.i = i;
  sk.want = true;
  setSource('sketch');
  // a player still loading this sketch plays it as soon as it's ready
  if (sk.loaded !== i || sk.failed) scLoad(i);
  else if (sk.ready) { scSend('play'); armNudge(); }
  if (sk.embed && sk.frame) placeFrame(i);
  syncSketch();
  track('sketch_play', { sketch: SKETCHES[i].title, lang: getLang() });
}
function pauseSketch() {
  sk.want = false;
  sk.playing = false;
  scSend('pause');
  syncSketch();
}
function toggleSketch(i = sk.i) {
  if (i === null) return;
  if (i === sk.i && sk.want) pauseSketch();
  else playSketch(i);
}
function seekSketch(f) {
  const s = SKETCHES[sk.i];
  if (!s || !sk.ready) return;
  sk.pos = Math.max(0, Math.min(0.999, f)) * s.dur;
  sk.at = performance.now();
  scSend('seekTo', Math.round(sk.pos * 1000));
}
function setSource(src) {
  if (state.src === src) return;
  state.src = src;
  syncMini();
}
// rows are built once per language; play state only toggles classes, so focus stays put
function renderSketches() {
  skEl.innerHTML = SKETCHES.map((s, i) => {
    const inner = `<span class="sk__n">${pad2(i + 1)}</span><span class="sk__t">${esc(s.title)}</span><span class="sk__d">${monthYear(s.date)}</span><span class="sk__l tnum">${fmt(s.dur)}</span><span class="sk__i"><svg><use href="#i-${sk.failed ? 'out' : 'play'}"/></svg></span>`;
    return sk.failed
      ? `<li><a class="sk" href="${s.url}" target="_blank" rel="noopener">${inner}</a></li>`
      : `<li><button class="sk" type="button" data-sketch="${i}" aria-label="${esc(s.title)}, ${fmt(s.dur)}">${inner}</button></li>`;
  }).join('');
  const all = $('#sketches-all');
  all.href = SKETCH_SET.url;
  all.firstElementChild.textContent = T('allOnSC')(SKETCH_SET.count);
  $('#sketches-note').hidden = !sk.failed;
  // a rebuild takes an opened player with it; put it back where it belongs
  if (sk.frame && !sk.frame.isConnected) {
    sk.ready = false;
    if (sk.embed && sk.i !== null && !sk.failed) placeFrame(sk.i);
    else $('#sc-host').appendChild(sk.frame);
  }
  syncSketch();
}
function syncSketch() {
  [...skEl.children].forEach((li, i) => {
    const row = li.firstElementChild;
    const on = i === sk.i;
    row.classList.toggle('is-on', on);
    row.classList.toggle('is-playing', on && sk.want);
    row.classList.toggle('is-loading', on && sk.want && !sk.playing && !sk.failed);
    if (!sk.failed) row.querySelector('use').setAttribute('href', on && sk.want ? '#i-pause' : '#i-play');
    if (!on) { row.style.setProperty('--p', 0); row.querySelector('.sk__l').textContent = fmt(SKETCHES[i].dur); }
  });
  syncMiniIcon();
}
skEl.addEventListener('click', (e) => {
  const b = e.target.closest('[data-sketch]');
  if (b) toggleSketch(+b.dataset.sketch);
});
// warm SoundCloud's player as the list comes near, so the first press plays at once
// warm SoundCloud's player as the list comes near: it reads the set first, then plays on the first press
new IntersectionObserver(([e]) => { if (e.isIntersecting && !sk.frame) scLoadSet(); }, { rootMargin: '1200px 0px' }).observe($('#bocetos'));
const toggleActive = () => (miniSketch() ? toggleSketch() : toggle());

// ---------- input ----------
// On touch screens the card swipes: left for the next song, right for the one before.
// It follows the finger a little; a short drag springs back, and vertical scrolling is left alone.
const SWIPE = 56;
const swipe = { id: null, x: 0, y: 0, dx: 0, used: false };
const stageEl = $('#stage');
stageEl.addEventListener('pointerdown', (e) => {
  swipe.used = false;
  if (e.pointerType === 'mouse' || arrival.running || state.i === null) return;
  Object.assign(swipe, { id: e.pointerId, x: e.clientX, y: e.clientY, dx: 0 });
});
stageEl.addEventListener('pointermove', (e) => {
  if (e.pointerId !== swipe.id) return;
  const dx = e.clientX - swipe.x;
  if (!swipe.dx && (Math.abs(dx) < 8 || Math.abs(dx) < Math.abs(e.clientY - swipe.y))) return;
  swipe.dx = dx;
  cardBtn.classList.add('is-dragging');
  cardBtn.style.setProperty('--dx', `${(dx * 0.6).toFixed(1)}px`);
  cardBtn.style.setProperty('--rz', `${(dx * 0.02).toFixed(2)}deg`);
});
function endSwipe(e) {
  if (e.pointerId !== swipe.id) return;
  swipe.id = null;
  const released = () => { cardBtn.style.removeProperty('--dx'); cardBtn.style.removeProperty('--rz'); };
  if (Math.abs(swipe.dx) < SWIPE || e.type === 'pointercancel') {
    cardBtn.classList.remove('is-dragging');
    released();
    return;
  }
  // deal while the card is still where the finger left it, so it flies off from there
  swipe.used = true;
  const dir = swipe.dx < 0 ? 1 : -1;
  deal((state.i + dir + TRACKS.length) % TRACKS.length, { autoplay: state.playing, dir });
  released();
  requestAnimationFrame(() => cardBtn.classList.remove('is-dragging'));
}
stageEl.addEventListener('pointerup', endSwipe);
stageEl.addEventListener('pointercancel', endSwipe);
// a swipe that ends on the card isn't also a tap on it
cardBtn.addEventListener('click', () => {
  if (swipe.used) { swipe.used = false; return; }
  if (arrival.running) finishArrival();
  toggle();
});
table.addEventListener('pointerdown', (e) => { if (arrival.running && !e.target.closest('#card')) finishArrival(); });
deckBtn.addEventListener('click', () => drawRandom(true));
document.addEventListener('click', (e) => {
  const b = e.target.closest('[data-act], [data-track]');
  if (!b) return;
  if (b.dataset.track !== undefined) {
    const k = +b.dataset.track;
    if (k === state.i) return toggle();
    return deal(k, { autoplay: true });
  }
  const act = b.dataset.act;
  if (b.closest('#mini') && miniSketch()) {
    if (act === 'toggle') toggleSketch();
    if (act === 'next') playSketch((sk.i + 1) % SKETCHES.length);
    if (act === 'prev') playSketch((sk.i + SKETCHES.length - 1) % SKETCHES.length);
    return;
  }
  if (act === 'toggle') toggle();
  if (act === 'draw') drawRandom(true);
  if (act === 'follow') { setFollow(followPop.hidden); return; }
  if (act === 'next') deal((state.i + 1) % TRACKS.length, { autoplay: state.playing });
  if (act === 'prev') deal((state.i + TRACKS.length - 1) % TRACKS.length, { autoplay: state.playing });
});
$$('[data-bar]').forEach((bar) => {
  // positions are measured against the playable part, never the hatched remainder
  const frac = (e) => {
    const r = bar.getBoundingClientRect();
    const playable = r.width * (bar.classList.contains('is-preview') ? 0.62 : 1);
    return { f: (e.clientX - r.left) / playable, x: Math.min(e.clientX - r.left, playable) };
  };
  // the mini bar scrubs a sketch while one is on
  const sketch = () => (bar === miniBar ? miniSketch() : null);
  const seek = (f) => (sketch() ? seekSketch(f) : seekTo(f));
  bar.addEventListener('pointerdown', (e) => { bar.setPointerCapture(e.pointerId); bar.classList.add('is-dragging'); seek(frac(e).f); });
  bar.addEventListener('pointermove', (e) => {
    const t = TRACKS[state.i];
    if (!t) return;
    const { f, x } = frac(e);
    if (bar.hasPointerCapture(e.pointerId)) seek(f);
    bar.style.setProperty('--hx', `${Math.max(0, x)}px`);
    bar.querySelector('.bar__hover').textContent = fmt(Math.max(0, Math.min(1, f)) * (sketch() ? sketch().dur : lenOf(t)));
    bar.classList.add('is-hover');
  });
  bar.addEventListener('pointerup', () => bar.classList.remove('is-dragging'));
  bar.addEventListener('pointerleave', () => bar.classList.remove('is-hover'));
  bar.addEventListener('keydown', (e) => {
    const t = TRACKS[state.i];
    if (!t) return;
    const pos = audio.currentTime;
    const step = t.sealed ? 2 : 5;
    if (e.key === 'ArrowRight') { seekTo((pos + step) / lenOf(t)); e.preventDefault(); e.stopPropagation(); }
    if (e.key === 'ArrowLeft') { seekTo((pos - step) / lenOf(t)); e.preventDefault(); e.stopPropagation(); }
    if (e.key === 'Home') { seekTo(0); e.preventDefault(); }
    if (e.key === 'End') { seekTo(0.98); e.preventDefault(); }
  });
});
document.addEventListener('keydown', (e) => {
  if (arrival.running) return finishArrival();
  if (e.metaKey || e.ctrlKey || e.altKey) return;
  const onControl = e.target.closest('button, a, input, [role="slider"], [role="switch"]');
  if (e.key === ' ' && !onControl) { e.preventDefault(); toggleActive(); }
  if (e.key === 'ArrowRight' && !onControl) deal((state.i + 1) % TRACKS.length, { autoplay: state.playing });
  if (e.key === 'ArrowLeft' && !onControl) deal((state.i + TRACKS.length - 1) % TRACKS.length, { autoplay: state.playing });
  if (e.key === 'd' || e.key === 'D') drawRandom(true);
  if (/^[1-9]$/.test(e.key) && +e.key <= TRACKS.length && !e.target.closest('input')) deal(+e.key - 1, { autoplay: true });
  if (e.key === 'Escape') setFollow(false);
});

// the card tilts toward the cursor
if (fine && !reduce) {
  const stage = $('#stage');
  stage.addEventListener('pointermove', (e) => {
    const r = cardBtn.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width - 0.5;
    const y = (e.clientY - r.top) / r.height - 0.5;
    cardBtn.style.setProperty('--ty', `${x * 5}deg`);
    cardBtn.style.setProperty('--tx', `${-y * 4}deg`);
  });
  stage.addEventListener('pointerleave', () => {
    cardBtn.style.setProperty('--ty', '0deg');
    cardBtn.style.setProperty('--tx', '0deg');
  });
}

new IntersectionObserver(([e]) => {
  const on = e.intersectionRatio < 0.35 && state.i !== null;
  $('#mini').classList.toggle('is-on', on);
  document.body.classList.toggle('mini-on', on);
}, { threshold: [0, 0.35, 0.6, 1] }).observe(table);

// ---------- arrival ----------
const arrival = { running: false, timers: [], start: 0 };
const STEPS = ['s-frame', 's-brand', 's-line', 's-deck', 's-line-out', 's-card', 's-ui'];
const firstCard = () => Math.floor(Math.random() * 3);
function finishArrival() {
  arrival.timers.forEach(clearTimeout);
  arrival.timers = [];
  if (state.i === null) deal(firstCard(), { instant: true });
  table.classList.remove('arriving', ...STEPS);
  arrival.running = false;
  session.set('bs-arrived', '1');
}
function runArrival() {
  if (reduce) { deal(firstCard(), { instant: true }); return; }
  arrival.running = true;
  arrival.start = performance.now();
  table.classList.add('arriving');
  const at = (ms, fn) => arrival.timers.push(setTimeout(fn, ms));
  at(60, () => table.classList.add('s-frame'));
  at(450, () => table.classList.add('s-brand'));
  at(900, () => table.classList.add('s-line'));
  at(1500, () => table.classList.add('s-deck'));
  at(2600, () => table.classList.add('s-line-out'));
  at(2800, () => { table.classList.add('s-card'); deal(firstCard()); });
  at(3600, () => table.classList.add('s-ui'));
  at(4700, finishArrival);
}

// the arrival plays once a visit
applyLang();
if (session.get('bs-arrived')) deal(firstCard(), { instant: true });
else runArrival();
