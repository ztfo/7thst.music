// The terminal's side of the sound engine. It talks to the sandboxed frame through
// postMessage only, takes nothing from it but small, checked messages, and never runs
// anything the frame sends.

const KINDS = new Set(['ready', 'ok', 'err', 'locked', 'unlocked', 'levels', 'beat']);

export function makeBridge(frame, on) {
  let lastBeat = performance.now(), unlockAt = null;
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
    frame.src = frame.getAttribute('src');
    on.restarted?.();
  }, 1000);

  return {
    run: (code) => send({ t: 'run', code }),
    hush: () => send({ t: 'hush' }),
    volume: (v) => send({ t: 'vol', v }),
    showUnlock,
    hideUnlock,
    place,
  };
}
