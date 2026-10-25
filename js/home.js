// The home page: the table, the deck, the player, the sketches from SoundCloud.
import { TRACKS, SKETCHES, SKETCH_SET, PLATFORMS, groundUrl, groundAvgUrl } from '../data/tracks.js';
import ENVELOPES from '../data/envelopes.js';
import { T, getLang, setLang, paintLang } from './i18n.js';
import { drawFrame, fit } from './microtext.js';
import { buildBack } from './cardback.js';
import { fmt, cap, first, esc, soundcloudLink, trackButtons, platformLinks, sketchRows } from './markup.js';
import { tick, arm, canBuzz } from './haptics.js';
import * as motion from './motion.js';

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
const coarse = matchMedia('(pointer: coarse)').matches;
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const session = {
  get(k) { try { return sessionStorage.getItem(k); } catch { return null; } },
  set(k, v) { try { sessionStorage.setItem(k, v); } catch {} },
};
$('#year').textContent = String(new Date().getFullYear());


// ---------- the card back, engraved once and reused everywhere ----------
buildBack($('#defs'));

const backHTML = () => '<span class="face face--back"><svg viewBox="0 0 516 884"><use href="#card-back"/></svg></span>';
const sealHTML = (t) => `<span class="seal"><span class="seal__n">${t.n}</span><span class="seal__mid"><span class="seal__name">${t.card}</span><span class="seal__date">${T('preview')} · ${T('when')}</span></span><span class="seal__stamp"><svg viewBox="0 0 44 44"><use href="#llu-mono"/></svg></span></span>`;
const sealedHTML = (t, ring) => `<span class="face face--back face--sealed" style="--field:${t.field}"><svg viewBox="0 0 516 884"><use href="#card-back"/></svg>${ring ? '<svg class="ringsvg" viewBox="0 0 516 884"><path class="ring" d="M258 370H330V514H186V370H258" pathLength="1"/></svg>' : ''}${sealHTML(t)}</span>`;
// ring marks the drawn card, the one face the page is really waiting on
const faceHTML = (t, ring = false) => (t.sealed ? sealedHTML(t, ring) : `<span class="face face--art"><img src="${t.img}" alt="" width="516" height="884" draggable="false"${ring ? ' fetchpriority="high"' : ' decoding="async"'}></span>`);
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
const state = { i: null, drawn: new Set(), sung: [], playing: false, breath: 0, kick: 0, lastFrame: -1, ready: false, src: 'card', via: 'first' };

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
function renderTracks() {
  tracksEl.style.setProperty('--n', TRACKS.length);
  tracksEl.innerHTML = trackButtons(TRACKS, T);
  $$('.tk', tracksEl).forEach(arm);
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
const followLinks = () => platformLinks(PLATFORMS);
$('#platforms').innerHTML = followLinks();
const followPop = $('#follow-pop');
// the popover leads with sharing the card that's on, then where to follow
function followPopHTML() {
  const t = state.i !== null ? TRACKS[state.i] : null;
  const share = t ? `<button type="button" class="share" data-act="share"><span>${T('share')(cap(t.card))}</span><svg><use href="#i-share"/></svg></button>` : '';
  return `<p>${T('followPop')}</p>${share}${followLinks()}`;
}
function setFollow(open) {
  if (open) { followPop.innerHTML = followPopHTML(); prepShare(); }
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
  // the phone's own player and the tab follow the same thing
  syncSession();
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
  followPop.innerHTML = followPopHTML();
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
  tick();
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
  arm(deckBtn);
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
// via says how the card got here (for analytics): first, link, draw, tracklist, swipe, next, prev, keys, shake, lockscreen, auto
// a card that came by the visitor's hand lands with a tick (Android; iPhones tick on the tap itself)
const byHand = (via) => !['first', 'link', 'auto', 'lockscreen'].includes(via);
function deal(i, { instant = false, autoplay = false, dir = 0, via = 'first' } = {}) {
  const t = TRACKS[i];
  const prev = state.i;
  if (prev === i) return;
  if (prev !== null) {
    if (!state.sung.includes(prev)) state.sung.push(prev);
    if (!instant && !reduce) flyToSung(prev, dir); else renderSung();
  }
  state.i = i;
  state.via = via;
  state.drawn.add(i);
  status.hidden = true;
  setFollow(false);
  layers.forEach((l, k) => l.classList.toggle('is-on', k === i));
  toneOf(t).then((c) => { if (state.i === i) themeColor.content = c; });
  cardFront.innerHTML = faceHTML(t, true);
  renderDeck();
  swapMeta(t, instant);
  const landed = () => { if (byHand(via)) tick(); };
  if (instant || reduce) landed();
  else {
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
    ).onfinish = () => { table.classList.remove('is-dealing'); landed(); };
  }
  load(t, autoplay);
}
function drawRandom(autoplay, via = 'draw') {
  const left = TRACKS.map((_, k) => k).filter((k) => k !== state.i && !state.drawn.has(k));
  const pool = left.length ? left : TRACKS.map((_, k) => k).filter((k) => k !== state.i);
  deal(pool[Math.floor(Math.random() * pool.length)], { autoplay, via });
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
  // the card and a sketch never sound together, whatever the sketch player last reported
  if (sk.frame) pauseSketch();
  setSource('card');
  const start = state.ready && audio.currentTime > 1 ? 'resume' : 'beginning';
  const p = audio.play();
  if (p && p.catch) p.catch(() => setPlaying(false));
  setPlaying(true);
  session.set('bs-arrived', '1');
  track('card_play', { card: t.id, kind: t.sealed ? 'preview' : 'full', via: state.via, start, lang: getLang() });
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
  track('card_complete', { card: t.id, kind: t.sealed ? 'preview' : 'full', lang: getLang() });
  // a preview runs on into the next card, the same as a full song
  deal((state.i + 1) % TRACKS.length, { autoplay: true, via: 'auto' });
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
      let hit = false;
      if (f > state.lastFrame) { for (let g = Math.max(state.lastFrame + 1, f - 3); g <= f; g++) if (t.env.onset[g]) hit = true; }
      if (hit) {
        state.kick = 1;
        // with sentir on, an Android phone pulses with the kick
        if (feel.on) tick(14);
      }
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
// The player holds the whole set and changes sketches without reloading: Safari only lets it
// start sound inside the press that asked, and the next sketch only follows on in the same player.
// iPhones can refuse to start a hidden player from the page's own button: when a tap
// plays nothing, SoundCloud's own player opens in that row, and every row after it.
const SC = 'https://w.soundcloud.com';
const SHOWN = 12;
// ids: the set's sounds in the set's own order, which isn't the list's newest-first
const sk = { frame: null, ids: null, i: null, ready: false, failed: false, playing: false, want: false, pos: 0, at: 0, timer: 0, embed: false, nudge: 0 };
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
// The list on the page is a snapshot. Reading the set when it comes into view adds
// whatever was uploaded since, so a new sketch shows up without touching the site.
function scLoad() {
  if (!sk.frame) {
    sk.frame = document.createElement('iframe');
    sk.frame.allow = 'autoplay; encrypted-media';
    sk.frame.title = 'SoundCloud';
    $('#sc-host').appendChild(sk.frame);
  }
  sk.ready = false;
  sk.frame.src = widgetSrc(`https://api.soundcloud.com/playlists/${SKETCH_SET.playlist}`);
  scTimeout();
}
// picks the sketch that's on out of the set, from its start, and plays it if it's wanted
function cue(pick) {
  if (pick) {
    const n = sk.ids.indexOf(SKETCHES[sk.i].id);
    // one the set no longer has can only be heard on SoundCloud
    if (n < 0) return scFailed();
    scSend('skip', n);
    scSend('seekTo', 0);
  }
  if (sk.want) { scSend('play'); armNudge(); }
}
// sketches read from SoundCloud only get in with a real SoundCloud link, a date and a length
function mergeSketches(sounds) {
  if (!Array.isArray(sounds) || !sounds.length) return;
  const inSet = new Set(sounds.map((s) => s.id));
  // only the set's first few come with details, which is where new uploads land
  const fresh = sounds
    .filter((s) => typeof s.title === 'string' && Number(s.duration) > 0 && /^\d{4}-\d{2}-\d{2}/.test(String(s.display_date || s.created_at)) && soundcloudLink(s.permalink_url) && !SKETCHES.some((k) => k.id === s.id))
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
  sk.timer = setTimeout(() => { if (!sk.ready) scFailed(); }, 6000);
}
function scFailed() {
  sk.failed = true;
  sk.want = false;
  renderSketches();
  syncMini();
}
// the player says a sketch is sounding
function heard(other) {
  // the card took over before the hidden player got going: the card stays on
  if (state.playing && !sk.embed) return scSend('pause');
  // a sound the page didn't ask for, like the set's own next one after the last row
  if (other) { if (!sk.want && !sk.embed) scSend('pause'); return; }
  sk.playing = true;
  sk.want = true;
  sk.at = performance.now();
  clearTimeout(sk.nudge);
  setSource('sketch');
  if (state.playing) pause();
  syncSketch();
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
    // the set is read once; a player that reloaded where it was moved starts back on the set's first sound
    if (!sk.ids) scSend('getSounds');
    else if (sk.i !== null) cue(true);
  }
  if (d.method === 'getSounds' && !sk.ids) {
    sk.ids = Array.isArray(d.value) ? d.value.map((s) => s.id) : [];
    mergeSketches(d.value);
    // a press that came before the player was ready
    if (sk.i !== null) cue(true);
  }
  // when a sketch ends the set moves on by itself, in its own order: only the sketch that's on counts
  const id = d.value?.soundId;
  const other = id != null && (sk.i === null || id !== SKETCHES[sk.i].id);
  // SoundCloud doesn't always send its play event, so progress nobody asked for counts the same
  if (d.method === 'play' || (d.method === 'playProgress' && !sk.playing && (sk.want || (state.playing && !sk.embed)))) heard(other);
  if (other) return;
  // SoundCloud also pauses its widgets on its own, when another of its players starts
  if (d.method === 'pause') { sk.playing = false; sk.want = false; syncSketch(); }
  if (d.method === 'finish') {
    if (sk.i === null) return;
    track('sketch_complete', { sketch: SKETCHES[sk.i].title, lang: getLang() });
    sk.playing = false;
    sk.want = false;
    // on down the list; after the last row the set would play on into sketches the page doesn't show
    if (sk.i < SKETCHES.length - 1) playSketch(sk.i + 1, true);
    else { scSend('pause'); syncSketch(); }
  }
  if (d.method === 'playProgress' && d.value) { sk.pos = d.value.currentPosition / 1000; sk.at = performance.now(); }
});
// auto: the sketch before it just ended, so an opened player stays where it is (moving it reloads it)
function playSketch(i, auto = false) {
  if (state.playing) pause();
  const changed = sk.i !== i;
  if (changed) sk.pos = 0;
  sk.i = i;
  sk.want = true;
  setSource('sketch');
  // setSource skips the redraw when a sketch was already on, so the next one redraws here
  if (changed) syncMini();
  if (sk.embed && !auto) placeFrame(i);
  // sent inside the press itself; a player still loading, or reloading after a move, cues it once it's ready
  if (!sk.frame || sk.failed) scLoad();
  else if (sk.ready && sk.ids) cue(changed);
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
  skEl.innerHTML = sketchRows(SKETCHES, T, { links: sk.failed, fallback: SKETCH_SET.url, icon: sk.failed ? 'out' : 'play' });
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
new IntersectionObserver(([e]) => { if (e.isIntersecting && !sk.frame) scLoad(); }, { rootMargin: '1200px 0px' }).observe($('#bocetos'));
const toggleActive = () => (miniSketch() ? toggleSketch() : toggle());

// ---------- input ----------
// On touch screens the card swipes: left for the next song, right for the one before.
// It follows the finger a little; a short drag springs back, and vertical scrolling is left alone.
const SWIPE = 56;
// past: the drag has gone far enough to change songs, which it says with a tick (Android)
const swipe = { id: null, x: 0, y: 0, dx: 0, used: false, past: false };
const stageEl = $('#stage');
stageEl.addEventListener('pointerdown', (e) => {
  swipe.used = false;
  if (e.pointerType === 'mouse' || arrival.running || state.i === null) return;
  Object.assign(swipe, { id: e.pointerId, x: e.clientX, y: e.clientY, dx: 0, past: false });
});
stageEl.addEventListener('pointermove', (e) => {
  if (e.pointerId !== swipe.id) return;
  const dx = e.clientX - swipe.x;
  if (!swipe.dx && (Math.abs(dx) < 8 || Math.abs(dx) < Math.abs(e.clientY - swipe.y))) return;
  swipe.dx = dx;
  if (swipe.past !== Math.abs(dx) >= SWIPE) { swipe.past = !swipe.past; if (swipe.past) tick(); }
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
  deal((state.i + dir + TRACKS.length) % TRACKS.length, { autoplay: state.playing, dir, via: 'swipe' });
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
    return deal(k, { autoplay: true, via: 'tracklist' });
  }
  const act = b.dataset.act;
  if (act === 'share') return shareCard(b);
  if (b.closest('#mini') && miniSketch()) {
    if (act === 'toggle') toggleSketch();
    if (act === 'next') playSketch((sk.i + 1) % SKETCHES.length);
    if (act === 'prev') playSketch((sk.i + SKETCHES.length - 1) % SKETCHES.length);
    return;
  }
  if (act === 'toggle') toggle();
  if (act === 'draw') drawRandom(true);
  if (act === 'follow') { setFollow(followPop.hidden); return; }
  if (act === 'next') deal((state.i + 1) % TRACKS.length, { autoplay: state.playing, via: 'next' });
  if (act === 'prev') deal((state.i + TRACKS.length - 1) % TRACKS.length, { autoplay: state.playing, via: 'prev' });
});
// the taps that change the song, and the language switch, tick under the finger on iPhones
$$('[data-act="draw"], [data-act="prev"], [data-act="next"]').forEach(arm);
arm($('#lang'));
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
  if (e.key === 'ArrowRight' && !onControl) deal((state.i + 1) % TRACKS.length, { autoplay: state.playing, via: 'keys' });
  if (e.key === 'ArrowLeft' && !onControl) deal((state.i + TRACKS.length - 1) % TRACKS.length, { autoplay: state.playing, via: 'keys' });
  if (e.key === 'd' || e.key === 'D') drawRandom(true, 'keys');
  if (/^[1-9]$/.test(e.key) && +e.key <= TRACKS.length && !e.target.closest('input')) deal(+e.key - 1, { autoplay: true, via: 'keys' });
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
  feel.inView = e.intersectionRatio >= 0.35;
  const on = !feel.inView && state.i !== null;
  $('#mini').classList.toggle('is-on', on);
  document.body.classList.toggle('mini-on', on);
}, { threshold: [0, 0.35, 0.6, 1] }).observe(table);

// ---------- the phone: lock screen, tab, browser bar ----------
// The phone's own player (lock screen, Control Center, headphones, the car) shows what's on and
// works its buttons, and the tab's title says it too. Each card's artwork is made by scripts/render-cards.mjs.
const ms = 'mediaSession' in navigator ? navigator.mediaSession : null;
const TITLE = document.title;
const abs = (p) => new URL(p, location.href).href;
let sessionKey = '';
// fresh: set the details again even when they're the same (a new file can clear them on iPhones)
function syncSession(fresh = false) {
  const s = miniSketch();
  const t = state.i !== null ? TRACKS[state.i] : null;
  if (!s && !t) return;
  const on = s ? sk.playing || sk.want : state.playing;
  const name = s ? s.title : cap(t.card);
  document.title = on ? `▶ ${name} · llü` : TITLE;
  if (!ms) return;
  ms.playbackState = on ? 'playing' : 'paused';
  const key = `${s ? s.id : t.id}·${getLang()}`;
  if (key !== sessionKey || fresh) {
    sessionKey = key;
    try {
      ms.metadata = new MediaMetadata(s
        ? { title: s.title, artist: 'llü', album: first(T('wip')), artwork: [{ src: abs('assets/android-chrome-512x512.png'), sizes: '512x512', type: 'image/png' }] }
        : { title: name, artist: 'llü', album: t.sealed ? `Buena Suerte · ${T('previewPill')}` : 'Buena Suerte', artwork: [{ src: abs(`assets/cards/${t.id}.jpg`), sizes: '600x600', type: 'image/jpeg' }] });
    } catch {}
  }
  syncPosition();
}
function syncPosition() {
  if (!ms?.setPositionState) return;
  const s = miniSketch();
  const t = state.i !== null ? TRACKS[state.i] : null;
  try {
    if (s) ms.setPositionState({ duration: s.dur, playbackRate: 1, position: Math.min(sk.pos, s.dur) });
    else if (t && state.ready) ms.setPositionState({ duration: lenOf(t), playbackRate: 1, position: Math.min(audio.currentTime || 0, lenOf(t)) });
  } catch {}
}
audio.addEventListener('play', () => syncSession(true));
['loadedmetadata', 'pause', 'seeked'].forEach((ev) => audio.addEventListener(ev, syncPosition));
if (ms) {
  const on = (action, fn) => { try { ms.setActionHandler(action, fn); } catch {} };
  const step = (d) => {
    if (miniSketch()) return playSketch((sk.i + d + SKETCHES.length) % SKETCHES.length);
    if (state.i !== null) deal((state.i + d + TRACKS.length) % TRACKS.length, { autoplay: true, via: 'lockscreen' });
  };
  on('play', () => { if (miniSketch() ? !sk.want : !state.playing) toggleActive(); });
  on('pause', () => { if (miniSketch() ? sk.want : state.playing) toggleActive(); });
  on('previoustrack', () => step(-1));
  on('nexttrack', () => step(1));
  on('seekto', (d) => {
    const s = miniSketch();
    if (s) { seekSketch(d.seekTime / s.dur); syncPosition(); } else if (state.i !== null) seekTo(d.seekTime / lenOf(TRACKS[state.i]));
  });
}

// On Android the browser bar takes the colour of the room's dark top edge, so it reads as part of
// the table: the card's ground, darkened about as the page darkens it up there. A sealed card's
// tint sets the hue, as its color blend does on the page.
const themeColor = $('meta[name="theme-color"]');
// measured against a screenshot of the table's top edge
const ROOM_TOP = 0.2;
const tones = new Map();
function toneOf(t) {
  if (!tones.has(t.id)) tones.set(t.id, new Promise((done) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      try {
        const g = document.createElement('canvas').getContext('2d', { willReadFrequently: true });
        g.drawImage(img, 0, 0, 1, 1);
        if (t.tint) { g.globalCompositeOperation = 'color'; g.fillStyle = t.tint; g.fillRect(0, 0, 1, 1); }
        const [r, gr, b] = g.getImageData(0, 0, 1, 1).data;
        done(`#${[r, gr, b].map((v) => Math.round(v * ROOM_TOP).toString(16).padStart(2, '0')).join('')}`);
      } catch { done('#000000'); }
    };
    img.onerror = () => done('#000000');
    img.src = groundAvgUrl(t.ground);
  }));
  return tones.get(t.id);
}

// ---------- sentir: the phone's own movement, and its motor ----------
// Off until the visitor turns it on, then remembered. With it on, tilting the phone moves the light
// across the gold and the card, a shake draws a new card, and an Android phone pulses with each kick.
// Only on touch screens that have the sensors or a motor for it.
const FEEL = 'bs-feel';
const feel = { on: false, inView: true };
const feelBtn = $('#feel');
feelBtn.hidden = !(coarse && (typeof DeviceOrientationEvent !== 'undefined' || canBuzz));
arm(feelBtn);
// the card leans a little the way the phone does, about half as far as it follows a cursor
function onTilt(x, y) {
  cardBtn.style.setProperty('--ty', `${(x * 3).toFixed(2)}deg`);
  cardBtn.style.setProperty('--tx', `${(-y * 2.5).toFixed(2)}deg`);
  table.style.setProperty('--lx', x.toFixed(3));
  table.style.setProperty('--ly', y.toFixed(3));
}
// a shake draws a card, while the table is in view and a card is on it
function onShake() {
  if (!feel.inView || arrival.running || state.i === null) return;
  drawRandom(state.playing, 'shake');
}
function setFeel(on) {
  feel.on = on;
  feelBtn.setAttribute('aria-checked', String(on));
  table.classList.toggle('is-feel', on);
  try { localStorage.setItem(FEEL, on ? '1' : '0'); } catch {}
  if (on) motion.start({ onTilt, onShake, tilt: !reduce });
  else { motion.stop(); onTilt(0, 0); }
}
feelBtn.addEventListener('click', () => {
  tick();
  if (feel.on) { setFeel(false); track('feel_switch', { feel: 'off', lang: getLang() }); return; }
  // an iPhone asks here, inside the tap
  motion.ask().then((ok) => {
    setFeel(ok);
    track('feel_switch', { feel: ok ? 'on' : 'denied', lang: getLang() });
  });
});
// a visit after it was turned on: Android carries on at once. An iPhone has to ask again inside a
// tap, so the first one anywhere does (it doesn't show the question again if the answer was yes).
let feelSaved = false;
try { feelSaved = localStorage.getItem(FEEL) === '1'; } catch {}
if (!feelBtn.hidden && feelSaved) {
  setFeel(true);
  if (motion.needsAsk) {
    const reask = (e) => {
      document.removeEventListener('click', reask, true);
      if (feel.on && !e.target.closest('#feel')) motion.ask().then((ok) => { if (!ok) setFeel(false); });
    };
    document.addEventListener('click', reask, true);
  }
}

// ---------- share: the card as a picture for Stories or a chat, with its link ----------
// The picture (from scripts/render-cards.mjs) is fetched when the popover opens: a phone only
// opens its share sheet inside the tap, with no waiting on the network.
const pictures = new Map();
function prepShare() {
  const t = state.i !== null ? TRACKS[state.i] : null;
  if (!t || !navigator.canShare || pictures.has(t.id)) return;
  pictures.set(t.id, null);
  fetch(`assets/cards/${t.id}-story.jpg`)
    .then((r) => (r.ok ? r.blob() : Promise.reject(new Error(String(r.status)))))
    .then((b) => pictures.set(t.id, new File([b], `${t.id}.jpg`, { type: 'image/jpeg' })))
    .catch(() => pictures.delete(t.id));
}
async function shareCard(btn) {
  const t = state.i !== null ? TRACKS[state.i] : null;
  if (!t) return;
  const url = `${location.origin}${location.pathname}?carta=${t.id}${getLang() === 'en' ? '&lang=en' : ''}`;
  const text = T('shareText')(cap(t.card));
  const file = pictures.get(t.id);
  const shared = (method) => track('card_share', { card: t.id, method, lang: getLang() });
  try {
    if (file && navigator.canShare({ files: [file] })) await navigator.share({ files: [file], text, url });
    else if (navigator.share) await navigator.share({ title: `${cap(t.card)} · llü`, text, url });
    else {
      // no share sheet here (most desktops): the link goes on the clipboard instead
      await navigator.clipboard.writeText(url);
      shared('link');
      btn.firstElementChild.textContent = T('copied');
      setTimeout(() => setFollow(false), 1400);
      return;
    }
    shared('sheet');
    setFollow(false);
  } catch {
    // closing the share sheet without picking anything isn't an error
  }
}

// ---------- arrival ----------
const arrival = { running: false, timers: [], start: 0 };
const STEPS = ['s-frame', 's-brand', 's-line', 's-deck', 's-line-out', 's-card', 's-ui'];
// a shared link opens on its card (?carta=el-cotorro); otherwise one of the three that are out
const linked = (() => { try { return TRACKS.findIndex((t) => t.id === new URLSearchParams(location.search).get('carta')); } catch { return -1; } })();
const firstCard = () => (linked >= 0 ? linked : Math.floor(Math.random() * 3));
const firstVia = linked >= 0 ? 'link' : 'first';
function finishArrival() {
  arrival.timers.forEach(clearTimeout);
  arrival.timers = [];
  if (state.i === null) deal(firstCard(), { instant: true, via: firstVia });
  table.classList.remove('arriving', ...STEPS);
  arrival.running = false;
  session.set('bs-arrived', '1');
}
function runArrival() {
  if (reduce) { table.classList.remove('arriving'); deal(firstCard(), { instant: true, via: firstVia }); return; }
  arrival.running = true;
  arrival.start = performance.now();
  // the table is already dark (a script in index.html hid it before it could paint)
  table.dataset.arrival = '1';
  table.classList.add('arriving');
  const at = (ms, fn) => arrival.timers.push(setTimeout(fn, ms));
  // the caller's line first, then the frame, the mark, the deck, and the first card
  at(100, () => table.classList.add('s-line'));
  at(700, () => table.classList.add('s-frame'));
  at(1100, () => table.classList.add('s-brand'));
  at(1700, () => table.classList.add('s-deck'));
  at(2700, () => table.classList.add('s-line-out'));
  at(2900, () => { table.classList.add('s-card'); deal(firstCard(), { via: firstVia }); });
  at(3700, () => table.classList.add('s-ui'));
  at(4800, finishArrival);
}

// the arrival plays once a visit
applyLang();
if (session.get('bs-arrived')) { table.classList.remove('arriving'); deal(firstCard(), { instant: true, via: firstVia }); } else runArrival();
