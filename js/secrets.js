// The ways into La Máquina (/maquina/), the terminal behind the deck. Nothing on the page
// points to it: it's found by drawing the tenth card, typing a word on the deck, worrying
// at El Perdido, clicking the one wrong character in the frame, staying up until 3 a.m.,
// or opening the console. Each way in arrives with its own ?via= for analytics.

import { T, getLang } from './i18n.js';

const MACHINE = '/maquina/';
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const track = (name, params) => { try { window.gtag?.('event', name, params); } catch {} };

// the page gives out like an old screen on the way into the terminal (styles/site.css,
// "the ways into La Máquina"): it never flashes, and with reduced motion it just goes
export function goToMachine(via) {
  if (document.body.classList.contains('is-leaving')) return;
  track('secret_found', { way: via, lang: getLang() });
  const url = `${MACHINE}?via=${encodeURIComponent(via)}`;
  if (reduce) { setTimeout(() => { location.href = url; }, 150); return; }
  // the screen collapses to a line across the middle of the view, wherever the page is scrolled
  document.body.style.setProperty('--leave-y', `${scrollY}px`);
  document.documentElement.classList.add('is-leaving');
  document.body.classList.add('is-leaving');
  const crt = document.createElement('div');
  crt.className = 'crt';
  crt.innerHTML = '<i class="crt__line"></i>';
  document.documentElement.append(crt);
  setTimeout(() => { location.href = url; }, 1150);
}

// coming back with the browser's back button can restore the page mid-collapse; put it back
addEventListener('pageshow', (e) => {
  if (!e.persisted) return;
  document.documentElement.classList.remove('is-leaving');
  document.body.classList.remove('is-leaving');
  document.querySelector('.crt')?.remove();
});

// ---------- the tenth card ----------
// One draw in fifty deals a card that isn't in the nine: La Máquina. ?carta=la-maquina opens on it.
const CHANCE = 1 / 50;
let dialog = null, dealt = false;
function machineDialog() {
  if (dialog) return dialog;
  dialog = document.createElement('dialog');
  dialog.className = 'machine';
  dialog.setAttribute('aria-labelledby', 'machine-name');
  dialog.innerHTML = `
    <div class="machine__card" aria-hidden="true">
      <span class="machine__n">10</span>
      <span class="machine__cursor"></span>
      <span class="machine__label">LA MÁQUINA</span>
    </div>
    <h2 class="machine__name" id="machine-name">La Máquina</h2>
    <p class="machine__sub" data-t="machineSub"></p>
    <div class="machine__acts">
      <button type="button" class="machine__go" data-act="machine-go"></button>
      <button type="button" class="machine__back" data-act="machine-back"></button>
    </div>`;
  dialog.addEventListener('click', (e) => {
    const act = e.target.closest('[data-act]')?.dataset.act;
    if (act === 'machine-go') goToMachine('card');
    else if (act === 'machine-back' || e.target === dialog) dialog.close();
  });
  document.body.append(dialog);
  return dialog;
}
export function showMachineCard(via) {
  const d = machineDialog();
  d.querySelector('[data-t="machineSub"]').textContent = T('machineSub');
  d.querySelector('.machine__go').textContent = T('machineGo');
  d.querySelector('.machine__back').textContent = T('machineBack');
  if (!d.open) d.showModal();
  track('machine_card', { via, lang: getLang() });
}
// called on every draw by hand; true when the tenth card took this draw
export function drawTenth(via) {
  if (dealt || !['draw', 'keys', 'shake'].includes(via) || Math.random() >= CHANCE) return false;
  dealt = true;
  showMachineCard(via);
  return true;
}
export const linkedToMachine = () => { try { return new URLSearchParams(location.search).get('carta') === 'la-maquina'; } catch { return false; } };

// ---------- typing on the deck ----------
// llu, llü, sudo or máquina typed anywhere on the page (or just /) goes in. Nothing says so.
const WORDS = ['llu', 'sudo', 'maquina'];
const fold = (s) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
export function watchKeys() {
  let typed = '';
  addEventListener('keydown', (e) => {
    if (e.ctrlKey || e.metaKey || e.altKey || e.key.length !== 1) return;
    if (e.target.closest?.('input, textarea, select, [contenteditable]')) return;
    if (e.key === '/') { e.preventDefault(); goToMachine('keys'); return; }
    typed = (typed + fold(e.key)).slice(-8);
    if (WORDS.some((w) => typed.endsWith(w))) goToMachine('keys');
  });
}

// ---------- the frame ----------
// the one wrong character in the microtext frame (js/microtext.js) is a link
export function watchFrame() {
  document.addEventListener('click', (e) => {
    if (!e.target.closest?.('.frame .secret')) return;
    e.preventDefault();
    goToMachine('frame');
  });
}

// ---------- El Perdido ----------
// the lost one: seven taps on its sealed card in a row, or holding it for three seconds
export function watchPerdido(cardBtn, onPerdido) {
  let taps = 0, last = 0, hold = 0, at = null;
  cardBtn.addEventListener('click', () => {
    if (!onPerdido()) { taps = 0; return; }
    const now = performance.now();
    taps = now - last < 900 ? taps + 1 : 1;
    last = now;
    if (taps >= 7) { taps = 0; goToMachine('perdido'); }
  });
  const cancel = () => { clearTimeout(hold); at = null; };
  cardBtn.addEventListener('pointerdown', (e) => {
    if (!onPerdido()) return;
    at = { x: e.clientX, y: e.clientY };
    hold = setTimeout(() => goToMachine('perdido'), 3000);
  });
  cardBtn.addEventListener('pointermove', (e) => { if (at && Math.hypot(e.clientX - at.x, e.clientY - at.y) > 12) cancel(); });
  ['pointerup', 'pointercancel', 'pointerleave'].forEach((ev) => cardBtn.addEventListener(ev, cancel));
  // a long press shouldn't open the phone's own menu over the card
  cardBtn.addEventListener('contextmenu', (e) => { if (onPerdido()) e.preventDefault(); });
}

// ---------- 3 a.m. ----------
// Between 3 and 4 in the morning, the visitor's time, the deck slowly sinks into the
// terminal's dark blue, and a cursor blinks in the corner.
export function lateNight() {
  let veil = null;
  const check = () => {
    const late = new Date().getHours() === 3;
    if (late && !veil) {
      veil = document.createElement('div');
      veil.className = 'late';
      veil.innerHTML = '<a class="late__cursor" href="/maquina/?via=3am" aria-label="La Máquina"></a>';
      veil.querySelector('a').addEventListener('click', (e) => { e.preventDefault(); goToMachine('3am'); });
      document.body.append(veil);
      requestAnimationFrame(() => requestAnimationFrame(() => veil.classList.add('is-on')));
    } else if (!late && veil) { veil.remove(); veil = null; }
  };
  check();
  setInterval(check, 60000);
}

// ---------- the console ----------
// for the people who open dev tools, who are the people who'll love the machine
export function consoleHello() {
  window.llu = Object.freeze({ maquina() { goToMachine('console'); return '→ /maquina/'; } });
  const art = [
    '█   █   █ █',
    '█   █',
    '█   █   █ █',
    '█   █   █ █',
    '██  ██  ███',
  ].join('\n');
  try {
    console.log(`%c${art}`, 'color:#5b9cff;font:12px/1.1 ui-monospace,Menlo,Consolas,monospace');
    console.log('%cthere’s a machine behind the deck. try llu.maquina()', 'color:#8a8a94;font:12px ui-monospace,Menlo,Consolas,monospace');
  } catch {}
}
