// The site's one signature line: microtext that reads as a hairline from across the room.

export function micro(len, size = 6.4) {
  const phrase = 'BUENA SUERTE · LLÜ · 7TH ST · ';
  const perChar = size * 0.78;
  const count = Math.max(1, Math.round(len / (phrase.length * perChar)));
  return phrase.repeat(count).trim();
}

const run = (x, y, len, rot) => `<text transform="translate(${x} ${y}) rotate(${rot})" textLength="${len}" lengthAdjust="spacing">${micro(len, 7)}</text>`;

// four runs around an element, with corner marks
export function drawFrame(el) {
  const r = el.getBoundingClientRect();
  if (!r.width) return;
  const w = r.width + 12, h = r.height + 12, o = 6, c = 7;
  el.innerHTML = `<svg viewBox="0 0 ${w} ${h}">${run(o + 16, o + 2.5, w - 2 * o - 32, 0)}${run(w - o - 16, h - o - 2.5, w - 2 * o - 32, 180)}${run(o + 2.5, h - o - 16, h - 2 * o - 32, -90)}${run(w - o - 2.5, o + 16, h - 2 * o - 32, 90)}<path class="corner" d="M${o} ${o + c}V${o}H${o + c}M${w - o - c} ${o}H${w - o}V${o + c}M${w - o} ${h - o - c}V${h - o}H${w - o - c}M${o + c} ${h - o}H${o}V${h - o - c}"/></svg>`;
}

// one run along an element's width, as a rule
export function drawRule(el) {
  const w = el.getBoundingClientRect().width;
  if (w) el.innerHTML = `<svg viewBox="0 0 ${w} 8">${run(0, 6, w, 0)}</svg>`;
}

// keeps a frame or rule fitted as its element resizes
export const fit = (el, draw) => new ResizeObserver(() => draw(el)).observe(el);
