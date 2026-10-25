// La Máquina's sound engine. It runs inside sandbox.html, in a frame with no origin of its
// own, so the code people type (or open from a stranger's link) can only make sound.
// The terminal sends it { t: 'run', code }, { t: 'hush' }, { t: 'vol', v } and
// { t: 'unlock', label }; it answers with { t: 'ready' | 'ok' | 'err' | 'locked' |
// 'unlocked' | 'levels' | 'beat' }.
//
// Chrome lets a tap or a key on the terminal start sound in here. Browsers that don't
// (Safari, maybe Firefox) get 'locked' back: the terminal then lays this frame over its
// play button with { t: 'unlock' }, so the visitor's next tap lands in here and turns the
// sound on for the rest of the visit.
//
// Every sound passes through one chain before the speakers: a hard limiter, so no pattern
// can go past a safe ceiling whatever its gain says, then the volume, then an analyser for
// the terminal's scope.

import { initStrudel, evaluate, hush, samples, getAudioContext, getCps } from '../vendor/strudel-1.3.0/index.mjs';

const DOUGH = 'https://raw.githubusercontent.com/felixroos/dough-samples/main/';
const CEILING = 0.89; // about -1 dBFS

const ac = getAudioContext();
const input = new GainNode(ac);
const comp = new DynamicsCompressorNode(ac, { threshold: -10, knee: 0, ratio: 20, attack: 0.002, release: 0.15 });
// whatever reaches the clipper comes out no louder than CEILING
const curve = new Float32Array(1025);
for (let i = 0; i < curve.length; i++) {
  const x = (i / (curve.length - 1)) * 2 - 1;
  curve[i] = (CEILING * Math.tanh(x * 1.5)) / Math.tanh(1.5);
}
const clip = new WaveShaperNode(ac, { curve, oversample: 'none' }); // oversampling's filter can ring past the ceiling
const vol = new GainNode(ac, { gain: 0.6 });
const scope = new AnalyserNode(ac, { fftSize: 2048, smoothingTimeConstant: 0.55 });

const connect = AudioNode.prototype.connect;
connect.call(input, comp);
connect.call(comp, clip);
connect.call(clip, scope);
connect.call(clip, vol);
connect.call(vol, ac.destination);
// anything Strudel sends to the speakers goes through the chain instead
AudioNode.prototype.connect = function (dest, ...rest) {
  if (dest === ac.destination && this !== vol) dest = input;
  return connect.call(this, dest, ...rest);
};

const send = (msg) => parent.postMessage(msg, '*');
let lastErr = '', lastErrAt = 0;
const fail = (e) => {
  const msg = String(e?.message || e).replace(/^\[\w+\]\s*/, '').replace(/^error:\s*/i, '').slice(0, 300);
  if (msg === lastErr && performance.now() - lastErrAt < 2000) return;
  lastErr = msg; lastErrAt = performance.now();
  send({ t: 'err', msg });
};

let playing = false, evaluating = false, evalFailed = false, pending = null;
const ready = initStrudel({
  onEvalError: (e) => { evalFailed = true; fail(e); },
  prebake: () => Promise.all([
    samples(DOUGH + 'tidal-drum-machines.json'),
    samples(DOUGH + 'Dirt-Samples.json'),
  ]),
});
ready.then(() => send({ t: 'ready' }), fail);

// errors Strudel only logs while it plays, such as a sound that isn't loaded
document.addEventListener('strudel.log', (e) => {
  const { message, type } = e.detail || {};
  if (evaluating) return;
  if (type === 'error' || /error/i.test(String(message))) fail(message);
});

const wait = (ms) => new Promise((res) => setTimeout(res, ms));
async function unlocked() {
  if (ac.state === 'running') return true;
  ac.resume().catch(() => {});
  for (let i = 0; i < 8; i++) { await wait(50); if (ac.state === 'running') return true; }
  return false;
}

// Patterns never need a hand-written loop, and an endless one would hang the whole tab
// (most browsers run this frame in the page's own process), so they're refused outright.
const LOOP = /\b(?:for|while)\s*\(|\bdo\s*\{/;
const withoutComments = (code) => code.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/[^\n]*/g, '');

async function run(code) {
  if (LOOP.test(withoutComments(code))) { fail('loops (for, while, do) aren’t allowed in a pattern'); return; }
  pending = code;
  if (!(await unlocked())) { send({ t: 'locked' }); return; }
  pending = null;
  await ready;
  input.gain.cancelScheduledValues(ac.currentTime);
  input.gain.setValueAtTime(1, ac.currentTime);
  evaluating = true; evalFailed = false;
  try {
    await evaluate(code);
    if (!evalFailed) { playing = true; send({ t: 'ok' }); }
  } catch (e) { fail(e); }
  evaluating = false;
}

// the one-time button for browsers that only start sound on a tap in here
function showUnlock(label) {
  let b = document.getElementById('unlock');
  if (!b) {
    b = document.createElement('button');
    b.id = 'unlock';
    b.type = 'button';
    b.addEventListener('click', async () => {
      await ac.resume().catch(() => {});
      if (ac.state !== 'running') return;
      b.remove();
      send({ t: 'unlocked' });
      if (pending !== null) run(pending);
    });
    document.body.append(b);
  }
  b.textContent = String(label || '▶').slice(0, 40);
}

function stop() {
  try { hush(); } catch {}
  playing = false;
  // cut what's already scheduled, then open up again for the next run
  const now = ac.currentTime;
  input.gain.cancelScheduledValues(now);
  input.gain.setTargetAtTime(0, now, 0.01);
  input.gain.setValueAtTime(1, now + 0.6);
}

addEventListener('message', (e) => {
  if (e.source !== parent) return;
  const m = e.data;
  if (!m || typeof m !== 'object') return;
  if (m.t === 'run' && typeof m.code === 'string') run(m.code.slice(0, 20000));
  else if (m.t === 'hush') stop();
  else if (m.t === 'unlock') showUnlock(m.label);
  else if (m.t === 'vol' && Number.isFinite(m.v)) vol.gain.setTargetAtTime(Math.min(1, Math.max(0, m.v)), ac.currentTime, 0.02);
});

// the scope: 256 points of waveform and 48 bands of spectrum, about 30 times a second
const wave = new Float32Array(scope.fftSize);
const freq = new Uint8Array(scope.frequencyBinCount);
const BANDS = 48;
const edges = [2];
for (let i = 1; i <= BANDS; i++) edges.push(Math.max(edges[i - 1] + 1, Math.round(2 * Math.pow(freq.length / 2, i / BANDS))));
setInterval(() => {
  if (!playing) return;
  scope.getFloatTimeDomainData(wave);
  scope.getByteFrequencyData(freq);
  const w = [];
  for (let i = 0; i < 256; i++) w.push(Math.round(wave[i * 8] * 1000) / 1000);
  const b = [];
  for (let i = 0; i < BANDS; i++) {
    let s = 0, n = 0;
    for (let k = edges[i]; k < edges[i + 1]; k++) { s += freq[k]; n++; }
    b.push(Math.round(s / n));
  }
  let cps = 0;
  try { cps = getCps?.() || 0; } catch {}
  send({ t: 'levels', wave: w, bands: b, cps });
}, 33);

// a heartbeat, so the terminal can tell if this frame has hung
setInterval(() => send({ t: 'beat' }), 500);
