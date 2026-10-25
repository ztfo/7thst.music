// La Máquina: the shell, the tabs, and the wiring between the editor, the scope and the
// sandboxed sound engine. What's typed at the prompt is matched against a fixed list of
// commands and never run; only the editor's pattern runs, and only inside the engine.

import { T, paint, getLang, setLang } from './strings.js';
import { EXAMPLES, STARTER, DRUMS, SYNTHS, MORE } from '../data/examples.js';
import { PLATFORMS } from '../../data/tracks.js';
import { THEMES, savedTheme, applyTheme } from './themes.js';
import { linkFor, unpack, sharedInHash, MAX_CODE } from './share.js';
import { makeEditor } from './editor.js';
import { makeScope } from './scope.js';
import { makeBridge } from './bridge.js';

const $ = (s) => document.querySelector(s);
const out = $('#out'), cmd = $('#cmd'), statusEl = $('#status'), statusText = $('#status-text');
const touch = matchMedia('(pointer: coarse)').matches;
const track = (name, params) => { try { window.gtag?.('event', name, { lang: getLang(), ...params }); } catch {} };
const store = {
  get: (k) => { try { return localStorage.getItem(k); } catch { return null; } },
  set: (k, v) => { try { localStorage.setItem(k, v); } catch {} },
};

// ---------- printing ----------
// a line is made of parts: a string, [text, class], or { href, text }. Only textContent,
// so nothing printed can become markup.
function line(...parts) {
  const ln = document.createElement('div');
  ln.className = 'ln';
  for (const p of parts) {
    if (p == null) continue;
    if (typeof p === 'string') ln.append(p);
    else if (Array.isArray(p)) { const s = document.createElement('span'); s.className = p[1]; s.textContent = p[0]; ln.append(s); }
    else { const a = document.createElement('a'); a.href = p.href; a.textContent = p.text; a.rel = 'noopener'; if (/^https?:/.test(p.href) && !p.href.startsWith(location.origin)) a.target = '_blank'; ln.append(a); }
  }
  out.append(ln);
  out.scrollTop = out.scrollHeight;
}
// the newest line stays in view when the shell changes size (the live split, a phone keyboard)
new ResizeObserver(() => { out.scrollTop = out.scrollHeight; }).observe(out);
const blank = () => line('');
const echo = (text) => line(['llü@7thst', 'a'], [':~$', 'd'], ' ' + text);
// a name and what it is, in two columns; the second wraps inside its own column
function row(name, ...what) {
  line(...what);
  const ln = out.lastElementChild;
  ln.classList.add('row');
  const k = document.createElement('span');
  k.textContent = name;
  const v = document.createElement('span');
  v.append(...ln.childNodes);
  ln.append(k, v);
}

// ---------- tabs ----------
const tabs = [...document.querySelectorAll('.tab')];
function setTab(name) {
  document.body.dataset.tab = name;
  tabs.forEach((t) => t.setAttribute('aria-selected', String(t.dataset.tab === name)));
  engine?.place();
  if (touch) return;
  if (name === 'live') editor.focus();
  else if (name === 'shell') cmd.focus({ preventScroll: true });
}
tabs.forEach((t) => t.addEventListener('click', () => setTab(t.dataset.tab)));

// ---------- the editor ----------
let shared = false, saveTimer = 0;
const editor = makeEditor({
  ta: $('#code'), hl: $('#hl'), nums: $('#nums'),
  onRun: () => runPattern('keys'),
  onChange: (v) => { clearTimeout(saveTimer); saveTimer = setTimeout(() => store.set('maq-draft', v), 300); },
});
document.querySelectorAll('.keys [data-ins]').forEach((b) => {
  b.addEventListener('pointerdown', (e) => e.preventDefault()); // keep the keyboard up
  b.addEventListener('click', () => { editor.insert(b.dataset.ins); editor.focus(); });
});

function loadExample(n) {
  const ex = EXAMPLES[n - 1];
  editor.value = ex.code;
  store.set('maq-draft', ex.code);
  setShared(false);
  return ex;
}
function setShared(on) {
  shared = on;
  $('#notice').hidden = !on;
}

// ---------- the engine ----------
const scope = makeScope($('#scope'));
let state = 'stopped', bpm = 0, readyYet = false, wantRun = null;
function setStatus(s, text) {
  state = s;
  statusEl.dataset.state = s;
  statusText.textContent = text;
  document.body.classList.toggle('is-playing', s === 'playing');
}
const engine = makeBridge($('#engine'), {
  ready() { readyYet = true; engine.volume(volume()); if (wantRun !== null) { const c = wantRun; wantRun = null; engine.run(c); } },
  ok() { setStatus('playing', bpm ? T('playing')(bpm) : T('ran')); },
  err(msg) { setStatus('err', T('err')(msg)); line([T('err')(msg), 'e']); },
  locked() {
    const btn = $('#run');
    if (!btn.offsetParent) setTab('live');
    engine.showUnlock(btn, T('unlock'));
    line([T('unlockHint'), 'a']);
  },
  unlocked() {},
  levels(m) {
    scope.feed(m);
    const b = Math.round(m.cps * 240);
    if (state === 'playing' && b && b !== bpm) { bpm = b; setStatus('playing', T('playing')(bpm)); }
  },
  restarted() { readyYet = false; setStatus('stopped', T('stopped')); line([T('restarted'), 'e']); },
});

function runPattern(via) {
  let code = editor.value;
  if (!code.trim()) { loadExample(STARTER); code = editor.value; }
  setStatus('starting', readyYet ? T('starting') : T('loading'));
  bpm = 0;
  track('live_run', { via, shared: shared ? 'yes' : 'no' });
  setShared(false);
  if (readyYet) engine.run(code); else wantRun = code;
}
function hush() {
  wantRun = null;
  engine.hush();
  bpm = 0;
  setStatus('stopped', T('stopped'));
}
$('#run').addEventListener('click', () => runPattern('button'));
$('#hush').addEventListener('click', hush);
$('#share').addEventListener('click', () => share());
addEventListener('keydown', (e) => {
  if (e.key === 'Escape' || (e.key === '.' && (e.ctrlKey || e.metaKey))) { e.preventDefault(); hush(); }
});

// ---------- volume, language, theme ----------
const volEl = $('#vol');
volEl.value = store.get('maq-vol') ?? 60;
const volume = () => Number(volEl.value) / 100;
volEl.addEventListener('input', () => { engine.volume(volume()); store.set('maq-vol', volEl.value); });

function paintLang() {
  paint();
  document.querySelectorAll('#lang [data-l]').forEach((s) => s.classList.toggle('on', s.dataset.l === getLang()));
  if (state === 'stopped') setStatus('stopped', T('stopped'));
}
$('#lang').addEventListener('click', () => { setLang(getLang() === 'es' ? 'en' : 'es'); paintLang(); line([T('lang'), 'd']); });

applyTheme(savedTheme());

// ---------- sharing ----------
async function share() {
  const code = editor.value.trim();
  if (!code) return line([T('shareEmpty'), 'd']);
  if (code.length > MAX_CODE) return line([T('shareTooLong'), 'e']);
  const url = await linkFor(code);
  if (touch && navigator.share) {
    try { await navigator.share({ title: 'La Máquina · llü', url }); track('pattern_share', { method: 'sheet' }); return; } catch (e) { if (e?.name === 'AbortError') return; }
  }
  try {
    await navigator.clipboard.writeText(url);
    line([T('shareCopied'), 'ok']);
    track('pattern_share', { method: 'link' });
  } catch { line([T('shareLink'), 'd']); track('pattern_share', { method: 'shown' }); }
  line({ href: url, text: url });
}

// ---------- commands ----------
const fold = (s) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
const COMMANDS = {
  help() {
    for (const [c, d] of T('help')) row(c, [d, 'd']);
    line(['  ' + T('keysHint'), 'd']);
  },
  ls(arg) {
    if (arg === 'tracks' || arg === 'tracks/') return COMMANDS.play('track');
    if (arg === 'examples' || arg === 'examples/') return COMMANDS.examples();
    if (arg === 'samples' || arg === 'samples/') return COMMANDS.samples();
    row('tracks/', [T('lsTracks'), 'd']);
    row('examples/', [T('lsExamples')(EXAMPLES.length), 'd']);
    row('samples/', ['909 · 808 · 707 · synths', 'd']);
  },
  play(arg) {
    if (arg) { for (const l of T('tracksSoon')) line(['  ' + l, 'd']); return; }
    runPattern('shell');
    line(['  ' + T('ran'), 'ok']);
  },
  live(arg) {
    if (arg) {
      const n = Number(arg);
      if (!EXAMPLES[n - 1]) return line([T('noExample')(arg), 'e']);
      const ex = loadExample(n);
      line(['  ', ''], [T('loaded')(ex.name), 'ok']);
    } else if (!editor.value.trim()) loadExample(STARTER);
    setTab('live');
  },
  examples() {
    EXAMPLES.forEach((ex, i) => line('  ', [String(i + 1), 'a'], ' ' + ex.name));
    line(['  ' + T('examplesHint'), 'd']);
  },
  samples() {
    row(T('samplesDrums'), [T('samplesDrumsHow'), 'c']);
    row('', [DRUMS.join(' '), 'd']);
    row(T('samplesSynths'), [SYNTHS.join(' · '), 'd']);
    row(T('samplesMore'), [MORE.join(' · '), 'd']);
    line(['  ' + T('samplesSoon'), 'd']);
  },
  hush() { hush(); line(['  ' + T('hushed'), 'd']); },
  share,
  theme(arg) {
    if (arg && THEMES[arg]) { applyTheme(arg); scope.recolor(); return line([T('themeNow')(arg), 'a']); }
    if (arg) line([T('themeNo')(arg), 'e']);
    line([T('themeList'), 'd'], ' ', Object.keys(THEMES).join(' · '));
  },
  follow() {
    line([T('follow'), 'd']);
    for (const p of PLATFORMS) row(p.name.toLowerCase(), { href: p.href, text: p.href.replace(/^https:\/\/(www\.)?/, '') });
  },
  credits() {
    for (const l of T('credits')) line(l);
    for (const [label, href] of T('creditsLinks')) row(label, { href, text: href.replace(/^https:\/\//, '') });
    line([T('yours'), 'd']);
  },
  clear() { out.textContent = ''; },
  deck() { line([T('deck'), 'd']); setTimeout(() => { location.href = '../'; }, 250); },
  lang(arg) { if (arg === 'en' || arg === 'es') { setLang(arg); paintLang(); } line([T('lang'), 'd']); },
  whoami() { line(T('whoami')); },
  sudo() { line(T('sudo')); },
};
const ALIASES = {
  ayuda: 'help', '?': 'help', dir: 'ls', dale: 'play', run: 'play', maquina: 'live', edit: 'live',
  ejemplos: 'examples', sonidos: 'samples', stop: 'hush', para: 'hush', silencio: 'hush', comparte: 'share',
  tema: 'theme', sigue: 'follow', creditos: 'credits', source: 'credits', license: 'credits', licencia: 'credits',
  limpia: 'clear', cls: 'clear', baraja: 'deck', exit: 'deck', salir: 'deck', cd: 'deck', idioma: 'lang',
};

const history = [];
let hIdx = 0;
function exec(raw) {
  const text = raw.trim().slice(0, 200);
  echo(text);
  if (!text) return;
  history.push(text); hIdx = history.length;
  const [word, ...rest] = text.split(/\s+/);
  const name = ALIASES[fold(word)] || fold(word);
  const fn = Object.hasOwn(COMMANDS, name) ? COMMANDS[name] : null;
  if (!fn) return line([T('notFound')(word), 'e']);
  // cd .. and cd ~ go back to the deck; any other cd is just a command not found
  if (fold(word) === 'cd' && rest[0] && !['..', '~', '/'].includes(rest[0])) return line([T('notFound')(text), 'e']);
  track('term_command', { command: name });
  fn(fold(rest.join(' ')));
}

$('#prompt').addEventListener('submit', (e) => { e.preventDefault(); exec(cmd.value); cmd.value = ''; });
cmd.addEventListener('keydown', (e) => {
  if (e.key === 'ArrowUp' && history.length) { e.preventDefault(); hIdx = Math.max(0, hIdx - 1); cmd.value = history[hIdx]; }
  else if (e.key === 'ArrowDown' && history.length) { e.preventDefault(); hIdx = Math.min(history.length, hIdx + 1); cmd.value = history[hIdx] ?? ''; }
  else if (e.key === 'Tab' && cmd.value && !cmd.value.includes(' ')) {
    const hit = Object.keys(COMMANDS).find((c) => c.startsWith(fold(cmd.value)));
    if (hit) { e.preventDefault(); cmd.value = hit + ' '; }
  }
});
document.querySelectorAll('.chips [data-cmd]').forEach((b) => b.addEventListener('click', () => exec(b.dataset.cmd)));
// a click on the shell's empty space puts the cursor back in the prompt
$('#pane-shell').addEventListener('click', (e) => {
  if (!touch && e.target === out && !getSelection().toString()) cmd.focus({ preventScroll: true });
});

// ---------- start ----------
paintLang();
setStatus('stopped', T('stopped'));
line(['La Máquina', 'i'], [' · llü · v0.1', 'd']);
line([touch ? T('greetHintTouch') : T('greetHint'), 'd']);
blank();

const via = new URLSearchParams(location.search).get('via');
const packed = sharedInHash();
if (packed) {
  unpack(packed).then((code) => {
    editor.value = code;
    setShared(true);
    setTab('live');
    line([T('sharedOpened'), 'a']);
    track('pattern_open', {});
  }, () => {
    line([T('shareBroken'), 'e']);
    editor.value = store.get('maq-draft') || '';
  });
} else {
  editor.value = store.get('maq-draft') || '';
  setTab('shell');
}
track('term_open', { via: via ? via.slice(0, 40) : packed ? 'pattern' : 'direct' });
