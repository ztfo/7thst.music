// The scope: the engine's waveform over its spectrum, drawn on a canvas, and the kick,
// read from the low bands, which the bar's bottom edge breathes with (not with reduced
// motion). Nothing flashes: the kick only eases a line's colour up and back.

const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

export function makeScope(canvas) {
  const cx = canvas.getContext('2d');
  let wave = null, bands = null, at = 0, low = 0, kick = 0, last = 0;
  let colors = null;
  const readColors = () => {
    const cs = getComputedStyle(document.documentElement);
    colors = { accent: cs.getPropertyValue('--accent').trim(), ink: cs.getPropertyValue('--ink').trim(), line: 'rgba(255,255,255,.08)' };
  };

  function feed(m) {
    wave = m.wave; bands = m.bands; at = performance.now();
    const l = (bands[0] + bands[1] + bands[2] + bands[3]) / 4 / 255;
    if (l - low > 0.1 && l > 0.45) kick = 1;
    low = l;
  }

  function frame(now) {
    const dt = last ? Math.min(0.1, (now - last) / 1000) : 0;
    last = now;
    kick *= Math.exp(-dt * 6);
    // when the engine goes quiet, the scope settles flat
    const live = now - at < 400;
    if (!live) { wave = null; bands = null; }
    if (!reduce) document.documentElement.style.setProperty('--kick', kick.toFixed(3));

    const dpr = Math.min(2, devicePixelRatio || 1);
    const w = canvas.clientWidth, h = canvas.clientHeight;
    if (!w || !h) { requestAnimationFrame(frame); return; }
    if (canvas.width !== Math.round(w * dpr) || canvas.height !== Math.round(h * dpr)) {
      canvas.width = Math.round(w * dpr); canvas.height = Math.round(h * dpr);
    }
    if (!colors) readColors();
    cx.setTransform(dpr, 0, 0, dpr, 0, 0);
    cx.clearRect(0, 0, w, h);

    // the waveform, over the top half
    const wh = Math.round(h * 0.48), mid = wh / 2;
    cx.strokeStyle = colors.line; cx.lineWidth = 1;
    cx.beginPath(); cx.moveTo(0, mid + 0.5); cx.lineTo(w, mid + 0.5); cx.stroke();
    if (wave) {
      cx.strokeStyle = colors.ink; cx.lineWidth = 1.4; cx.lineJoin = 'round';
      cx.beginPath();
      for (let i = 0; i < wave.length; i++) {
        const x = (i / (wave.length - 1)) * w, y = mid - Math.max(-1, Math.min(1, wave[i])) * (mid - 4);
        i ? cx.lineTo(x, y) : cx.moveTo(x, y);
      }
      cx.stroke();
    }

    // the spectrum, under it; the low bands, where the kick is, in the accent
    const n = 48, gap = 3, bw = (w - gap * (n - 1)) / n, top = wh + 14, bh = h - top;
    for (let i = 0; i < n; i++) {
      const v = bands ? bands[i] / 255 : 0;
      const bar = Math.max(2, v * bh);
      cx.fillStyle = i < 6 ? colors.accent : colors.ink;
      cx.globalAlpha = i < 6 ? 1 : 0.75 - i / 96;
      cx.fillRect(i * (bw + gap), h - bar, bw, bar);
    }
    cx.globalAlpha = 1;
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);

  return { feed, recolor: readColors };
}
