// La Máquina: the shell, the tabs, and the wiring between the editor, the scope and the
// sandboxed sound engine. What's typed at the prompt is matched against a fixed list of
// commands and never run; only the editor's pattern runs, and only inside the engine.

import { T, paint, getLang, setLang } from './strings.js';
import { EXAMPLES, STARTER, DRUMS, SYNTHS, MORE } from '../data/examples.js';
import { LESSONS, CHEAT } from '../data/lessons.js';
import { PLATFORMS } from '../../data/tracks.js';
import { THEMES, savedTheme, applyTheme } from './themes.js';
import { linkFor, unpack, sharedInHash, MAX_CODE } from './share.js';
import { makeEditor } from './editor.js';
import { makeScope } from './scope.js';
import { makeBridge } from './bridge.js';
import { ROWS, STEPS, gridCode, readGrid, starterSteps, bpmOf } from './grid.js';

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
  onChange: (v) => { clearTimeout(saveTimer); saveTimer = setTimeout(() => store.set('maq-draft', v), 300); edited(); },
});
document.querySelectorAll('.keys [data-ins]').forEach((b) => {
  b.addEventListener('pointerdown', (e) => e.preventDefault()); // keep the keyboard up
  b.addEventListener('click', () => { editor.insert(b.dataset.ins); editor.focus(); });
});

function loadExample(n) {
  const ex = EXAMPLES[n - 1];
  $('#lesson').hidden = true;
  editor.value = ex.code;
  store.set('maq-draft', ex.code);
  setShared(false);
  return ex;
}
function setShared(on) {
  shared = on;
  $('#notice').hidden = !on;
}

// ---------- learn: eight steps from a kick to a whole track ----------
let lessonAt = Math.min(LESSONS.length, Number(store.get('maq-learn')) || 0), lessonHinted = false;
function paintLesson() {
  if (!lessonAt) return;
  const t = LESSONS[lessonAt - 1][getLang()];
  $('#lesson-n').textContent = `${lessonAt}/${LESSONS.length}`;
  $('#lesson-title').textContent = t.title;
  $('#lesson-text').textContent = t.text;
  $('#lesson-try').textContent = t.try;
  $('#lesson-back').disabled = lessonAt === 1;
  $('#lesson-next-word').textContent = T(lessonAt === LESSONS.length ? 'learnFinish' : 'learnNext');
}
function showLesson(n) {
  lessonAt = n;
  store.set('maq-learn', String(n));
  paintLesson();
  $('#lesson').hidden = false;
  editor.value = LESSONS[n - 1].code;
  store.set('maq-draft', editor.value);
  setShared(false);
  setGrid(false);
  setTab('live');
  line(['  ' + T('learnStep')(n, LESSONS.length, LESSONS[n - 1][getLang()].title, !lessonHinted), 'a']);
  lessonHinted = true;
  // already playing: the new step lands on the next bar
  if (state === 'playing' || state === 'starting') runPattern('learn');
  track('learn_step', { step: n });
}
function learn(arg) {
  const n = arg ? Number(arg) : lessonAt || 1;
  if (!Number.isInteger(n) || !LESSONS[n - 1]) return line([T('learnNo')(arg), 'e']);
  showLesson(n);
}
function nextLesson() {
  if (!lessonAt) return learn();
  if (lessonAt < LESSONS.length) return showLesson(lessonAt + 1);
  for (const l of T('learnEnd')) line([l, 'ok']);
}
function prevLesson() { if (lessonAt > 1) showLesson(lessonAt - 1); else learn('1'); }
$('#lesson-next').addEventListener('click', nextLesson);
$('#lesson-back').addEventListener('click', prevLesson);
$('#lesson-close').addEventListener('click', () => { $('#lesson').hidden = true; line([T('learnHidden'), 'd']); });

// ---------- the step grid ----------
let gridOn = false;
const gridRows = $('#grid-rows');
ROWS.forEach((_, k) => {
  const row = document.createElement('div');
  row.className = 'grid__row';
  row.setAttribute('role', 'group');
  const label = document.createElement('span');
  label.className = 'grid__label';
  const steps = document.createElement('div');
  steps.className = 'grid__steps';
  for (let i = 0; i < STEPS; i++) {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'step';
    b.dataset.row = k;
    b.dataset.step = i;
    b.setAttribute('aria-pressed', 'false');
    steps.append(b);
  }
  row.append(label, steps);
  gridRows.append(row);
});
function paintGrid() {
  const g = readGrid(editor.value);
  $('#grid-not').hidden = !!g;
  $('#grid-on').hidden = !g;
  if (!g) return;
  $('#bpm').textContent = g.bpm;
  gridRows.querySelectorAll('.step').forEach((b) => b.setAttribute('aria-pressed', String(g.steps[b.dataset.row][b.dataset.step])));
}
// a change to the grid is a change to the code, and lands on the next bar if it's playing
function writeGrid(steps, bpm) {
  editor.value = gridCode(steps, bpm);
  store.set('maq-draft', editor.value);
  setShared(false);
  paintGrid();
  if (state === 'playing' || state === 'starting') runPattern('grid');
}
gridRows.addEventListener('click', (e) => {
  const b = e.target.closest('.step');
  const g = b && readGrid(editor.value);
  if (!g) return;
  g.steps[b.dataset.row][b.dataset.step] = !g.steps[b.dataset.row][b.dataset.step];
  writeGrid(g.steps, g.bpm);
});
const nudge = (d) => { const g = readGrid(editor.value); if (g) writeGrid(g.steps, Math.min(180, Math.max(60, g.bpm + d))); };
$('#bpm-down').addEventListener('click', () => nudge(-2));
$('#bpm-up').addEventListener('click', () => nudge(2));
$('#grid-new').addEventListener('click', () => writeGrid(starterSteps(), bpmOf(editor.value)));
const viewBtn = $('#view');
function setGrid(on) {
  gridOn = on;
  document.body.classList.toggle('is-grid', on);
  $('#grid').hidden = !on;
  viewBtn.setAttribute('aria-pressed', String(on));
  viewBtn.querySelector('.ctl__word').textContent = T(on ? 'codeView' : 'gridView');
  viewBtn.setAttribute('aria-label', T(on ? 'codeView' : 'gridView'));
  // the rows' names, in the visitor's language
  const names = T('gridRows');
  gridRows.querySelectorAll('.grid__row').forEach((row, k) => {
    row.setAttribute('aria-label', names[k]);
    row.querySelector('.grid__label').textContent = names[k];
    row.querySelectorAll('.step').forEach((b, i) => b.setAttribute('aria-label', `${names[k]} ${i + 1}`));
  });
  if (on) paintGrid();
  else if (!touch && document.body.dataset.tab === 'live') editor.focus();
}
viewBtn.addEventListener('click', () => setGrid(!gridOn));

// ---------- the engine ----------
const scope = makeScope($('#scope'));
let state = 'stopped', bpm = 0, readyYet = false, wantRun = null;
// applied: the code that's actually playing; sending: the code on its way to the engine;
// failed: code that didn't run, so auto doesn't keep resending it
let sounding = false, applied = null, sending = null, failed = null, lastVia = '';
let autoOn = store.get('maq-auto') === 'on', autoTimer = 0;
const isDirty = () => sounding && editor.value !== applied;
// the run button says update, and the status says why, while the code on screen isn't what's playing
function markDirty() {
  const dirty = isDirty();
  const run = $('#run');
  run.classList.toggle('is-dirty', dirty);
  $('#run-word').textContent = T(dirty ? 'update' : 'play');
  // an error stays up only while the code it came from is still on screen
  if (dirty && (statusEl.dataset.state !== 'err' || editor.value !== failed)) {
    statusEl.dataset.state = 'edited';
    statusText.textContent = T(autoOn ? 'editedAuto' : 'edited');
  } else if (!dirty && sounding && statusEl.dataset.state === 'edited') setStatus('playing', bpm ? T('playing')(bpm) : T('ran'));
}
function edited() {
  markDirty();
  if (!autoOn || !sounding) return;
  clearTimeout(autoTimer);
  autoTimer = setTimeout(() => {
    const code = editor.value;
    if (code.trim() && code !== applied && code !== failed && code !== sending) runPattern('auto');
  }, 900);
}
function setStatus(s, text) {
  state = s;
  statusEl.dataset.state = s;
  statusText.textContent = text;
  document.body.classList.toggle('is-playing', s === 'playing');
}
const engine = makeBridge($('#engine'), {
  ready() { readyYet = true; engine.volume(volume()); if (wantRun !== null) { const c = wantRun; wantRun = null; engine.run(c); } },
  ok() {
    sounding = true;
    applied = sending ?? applied;
    sending = null;
    failed = null;
    setStatus('playing', bpm ? T('playing')(bpm) : T('ran'));
    markDirty();
  },
  err(msg) {
    if (sending !== null) { failed = sending; sending = null; }
    // what was playing keeps playing; the error only shows
    if (sounding) { statusEl.dataset.state = 'err'; statusText.textContent = T('err')(msg); }
    else setStatus('err', T('err')(msg));
    // auto doesn't fill the shell with an error for every pause in typing
    if (lastVia !== 'auto') line([T('err')(msg), 'e']);
  },
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
    if (state === 'playing' && b && b !== bpm) { bpm = b; if (!isDirty() && statusEl.dataset.state === 'playing') setStatus('playing', T('playing')(bpm)); }
  },
  restarted() { readyYet = false; sounding = false; applied = sending = null; markDirty(); clearInterval(recTimer); setStatus('stopped', T('stopped')); line([T('restarted'), 'e']); },
  wav(blob) {
    clearInterval(recTimer);
    const d = new Date(), p2 = (n) => String(n).padStart(2, '0');
    const name = `la-maquina-${d.getFullYear()}-${p2(d.getMonth() + 1)}-${p2(d.getDate())}-${p2(d.getHours())}${p2(d.getMinutes())}.wav`;
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = name;
    document.body.append(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 60000);
    line([T('recSaved')(name), 'ok']);
    if (state === 'playing') setStatus('playing', bpm ? T('playing')(bpm) : T('ran'));
    track('pattern_record', { seconds: recSeconds });
  },
});

// ---------- recording ----------
let recTimer = 0, recSeconds = 0;
function record(arg) {
  if (arg === 'stop' || arg === 'para') {
    if (!engine.recording) return line([T('recNotNow'), 'd']);
    return engine.stopRecording();
  }
  if (engine.recording) return line([T('recAlready'), 'd']);
  if (state !== 'playing') return line([T('recNothing'), 'd']);
  const n = Math.min(30, Math.max(1, Math.round(Number(arg) || 30)));
  engine.record(n);
  recSeconds = n;
  line([T('recStart')(n), 'a']);
  let left = n;
  statusText.textContent = T('recLeft')(left);
  clearInterval(recTimer);
  recTimer = setInterval(() => {
    left -= 1;
    if (left <= 0 || !engine.recording) clearInterval(recTimer);
    else statusText.textContent = T('recLeft')(left);
  }, 1000);
}

// ---------- saved patterns, kept in this browser only ----------
const SAVED = 'maq-saved';
const slug = (s) => fold(s).replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 30);
function savedList() {
  try {
    const list = JSON.parse(store.get(SAVED) || '[]');
    return Array.isArray(list) ? list.filter((x) => x && typeof x.name === 'string' && typeof x.code === 'string') : [];
  } catch { return []; }
}
function keep(list) { try { localStorage.setItem(SAVED, JSON.stringify(list)); return true; } catch { return false; } }
function save(arg) {
  const code = editor.value.trim();
  if (!code) return line([T('shareEmpty'), 'd']);
  const list = savedList();
  let name = slug(arg);
  if (!name) { let n = 1; while (list.some((x) => x.name === `pattern-${n}`)) n++; name = `pattern-${n}`; }
  const i = list.findIndex((x) => x.name === name);
  if (i < 0 && list.length >= 50) return line([T('saveFull'), 'e']);
  const entry = { name, code: code.slice(0, 20000), at: Date.now() };
  if (i < 0) list.push(entry); else list[i] = entry;
  if (!keep(list)) return line([T('saveNoStore'), 'e']);
  line([T('saved')(name), 'ok']);
}
function load(arg) {
  const list = savedList();
  if (!arg) {
    if (!list.length) return line([T('savedNone'), 'd']);
    line([T('savedList'), 'd']);
    for (const x of list) row(x.name, [`${new Date(x.at).toLocaleDateString(getLang())} · ${x.code.split('\n').length} lines`, 'd']);
    return;
  }
  const x = list.find((y) => y.name === slug(arg));
  if (!x) return line([T('loadNo')(slug(arg) || arg), 'e']);
  editor.value = x.code;
  store.set('maq-draft', x.code);
  setShared(false);
  $('#lesson').hidden = true;
  line([T('loadedSaved')(x.name), 'ok']);
  setGrid(gridOn && !!readGrid(x.code));
  setTab('live');
}
function forget(arg) {
  const list = savedList();
  const i = list.findIndex((y) => y.name === slug(arg));
  if (!arg || i < 0) return line([T('loadNo')(slug(arg) || arg || '?'), 'e']);
  list.splice(i, 1);
  keep(list);
  line([T('forgot')(slug(arg)), 'd']);
}

function runPattern(via) {
  let code = editor.value;
  if (!code.trim()) { loadExample(STARTER); code = editor.value; }
  lastVia = via;
  sending = code;
  clearTimeout(autoTimer);
  // already playing: the change lands on the next bar, and the music doesn't stop meanwhile
  if (sounding) { statusEl.dataset.state = 'playing'; statusText.textContent = T('applying'); }
  else { setStatus('starting', readyYet ? T('starting') : T('loading')); bpm = 0; }
  if (!['grid', 'learn', 'auto'].includes(via)) track('live_run', { via, shared: shared ? 'yes' : 'no' });
  setShared(false);
  if (readyYet) engine.run(code); else wantRun = code;
}
function hush() {
  wantRun = null;
  if (engine.recording) engine.stopRecording();
  engine.hush();
  bpm = 0;
  sounding = false;
  applied = sending = null;
  clearTimeout(autoTimer);
  setStatus('stopped', T('stopped'));
  markDirty();
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
  setGrid(gridOn);
  paintLesson();
  markDirty();
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
    setGrid(false);
    setTab('live');
  },
  grid() {
    $('#lesson').hidden = true;
    if (!editor.value.trim()) { editor.value = gridCode(starterSteps(), 132); store.set('maq-draft', editor.value); }
    setTab('live');
    setGrid(true);
  },
  record,
  save,
  load,
  rm: forget,
  learn,
  next: nextLesson,
  back: prevLesson,
  cheat() {
    line([T('cheatTitle'), 'd']);
    for (const [k, v] of CHEAT[getLang()]) row(k, [v, 'd']);
    line([T('cheatMore'), 'd'], ' ', { href: 'https://strudel.cc/workshop/getting-started/', text: 'strudel.cc/workshop' });
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
  auto(arg) {
    if (arg === 'on' || arg === 'off') autoOn = arg === 'on';
    else autoOn = !autoOn;
    store.set('maq-auto', autoOn ? 'on' : 'off');
    line([T(autoOn ? 'autoOn' : 'autoOff'), 'a']);
    markDirty();
    track('auto_switch', { auto: autoOn ? 'on' : 'off' });
  },
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
  cuadricula: 'grid', steps: 'grid', graba: 'record', rec: 'record', guarda: 'save', carga: 'load', open: 'load',
  borra: 'rm', olvida: 'rm', delete: 'rm',
  aprende: 'learn', tutorial: 'learn', curso: 'learn', siguiente: 'next', atras: 'back', anterior: 'back',
  prev: 'back', chuleta: 'cheat', ref: 'cheat', acordeon: 'cheat',
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
