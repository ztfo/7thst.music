// The terminal's side of the sound engine. It talks to the sandboxed frame through
// postMessage only, takes nothing from it but small, checked messages, and never runs
// anything the frame sends.

const KINDS = new Set(['ready', 'ok', 'err', 'locked', 'unlocked', 'levels', 'beat', 'wav']);
// 30 seconds of 16-bit stereo at up to 96 kHz, and a little room
const MAX_WAV = 44 + 30 * 96000 * 4 + 1024;

export function makeBridge(frame, on) {
  let lastBeat = performance.now(), unlockAt = null, recording = false;
  const send = (m) => frame.contentWindow?.postMessage(m, '*');

  addEventListener('message', (e) => {
    if (e.source !== frame.contentWindow) return;
    const m = e.data;
    if (!m || typeof m !== 'object' || !KINDS.has(m.t)) return;
    lastBeat = performance.now();
    if (m.t === 'levels') {
      if (!Array.isArray(m.wave) || !Array.isArray(m.bands)) return;
      on.levels?.({ wave: m.wave.slice(0, 256).map(Number), bands: m.bands.slice(0, 48).map(Number), cps: Number(m.cps) || 0 });
    } else if (m.t === 'err') on.err?.(String(m.msg ?? '').slice(0, 300));
    else if (m.t === 'unlocked') { hideUnlock(); on.unlocked?.(); }
    else if (m.t === 'wav') {
      // only the one file a recording asked for, and only if it's really a WAV
      if (!recording || !(m.buf instanceof ArrayBuffer) || m.buf.byteLength < 44 || m.buf.byteLength > MAX_WAV) return;
      if (new TextDecoder().decode(new Uint8Array(m.buf, 0, 4)) !== 'RIFF') return;
      recording = false;
      on.wav?.(new Blob([m.buf], { type: 'audio/wav' }));
    }
    else if (m.t !== 'beat') on[m.t]?.();
  });

  // lays the frame over a button, so the next tap there lands in the engine
  function place() {
    if (!unlockAt) return;
    const r = unlockAt.getBoundingClientRect();
    Object.assign(frame.style, { left: r.left + 'px', top: r.top + 'px', width: r.width + 'px', height: r.height + 'px', right: 'auto', bottom: 'auto' });
  }
  function showUnlock(el, label) {
    unlockAt = el;
    frame.classList.add('is-unlock');
    place();
    send({ t: 'unlock', label });
  }
  function hideUnlock() {
    unlockAt = null;
    frame.classList.remove('is-unlock');
    frame.removeAttribute('style');
  }
  addEventListener('resize', place);

  // a frame that stops answering (an endless loop in a pattern) gets reloaded. That only
  // helps where the browser runs the frame in its own process; elsewhere the tab hangs.
  document.addEventListener('visibilitychange', () => { lastBeat = performance.now(); });
  setInterval(() => {
    if (document.visibilityState !== 'visible' || performance.now() - lastBeat < 5000) return;
    lastBeat = performance.now();
    hideUnlock();
    recording = false;
    frame.src = frame.getAttribute('src');
    on.restarted?.();
  }, 1000);

  return {
    run: (code) => send({ t: 'run', code }),
    record: (s) => { recording = true; send({ t: 'rec', s }); },
    stopRecording: () => send({ t: 'recstop' }),
    get recording() { return recording; },
    hush: () => send({ t: 'hush' }),
    volume: (v) => send({ t: 'vol', v }),
    showUnlock,
    hideUnlock,
    place,
  };
}
