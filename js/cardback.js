// The card back, engraved once into the page's <defs> and reused everywhere as #card-back.
// Shared by the home page and the share-image template in scripts/og/.
import { micro } from './microtext.js';

const SVGNS = 'http://www.w3.org/2000/svg';

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
export function buildBack(defs) {
  const W = 516, H = 884, cx = 258, cy = 442;
  const t = (x, y, len, rot = 0) => `<text x="0" y="0" transform="translate(${x} ${y}) rotate(${rot})" textLength="${len}" lengthAdjust="spacing" font-family="Archivo, sans-serif" font-weight="600" font-size="6.4" fill="#d2b97c" fill-opacity=".5">${micro(len)}</text>`;
  const corner = (x, y, sx, sy) => `<path d="M${x} ${y + sy * 9}V${y}H${x + sx * 9}" fill="none" stroke="#d2b97c" stroke-opacity=".55" stroke-width=".8"/>`;
  const inner = 31.5;
  const clip = document.createElementNS(SVGNS, 'clipPath');
  clip.setAttribute('id', 'back-field');
  clip.innerHTML = `<rect x="${inner}" y="${inner}" width="${W - inner * 2}" height="${H - inner * 2}" rx="3"/>`;
  defs.appendChild(clip);
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
  defs.appendChild(sym);
}
