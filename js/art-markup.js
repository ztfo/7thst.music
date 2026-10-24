// The art page's pieces and the markup it draws: shared by js/art.js and by
// scripts/prerender.mjs, which writes the first series into art.html for crawlers.
import { cap, esc, pad2 } from './markup.js';

// series in curated order; r is each series' height over width
export const SERIES = {
  songart: { es: 'portadas', en: 'covers', r: 1 },
  dreams: { es: 'sueños', en: 'dreams', r: 1, one: { es: 'Sueño', en: 'Dream' } },
  mandalas: { es: 'mandalas', en: 'mandalas', r: 1, one: { es: 'Mandala', en: 'Mandala' } },
  voices: { es: 'voces', en: 'voices', r: 1 },
  animals: { es: 'animales', en: 'animals', r: 4 / 3 },
};
export const PER_PAGE = 12;

// file names become titles: "Wild_Elements_bu9ahz" reads "Wild Elements"; an id-only name is untitled
const FIX = { 'Quien Fue': '¿Quién fue?' };
function titleFrom(name) {
  if (/^[a-z0-9]{20}$/.test(name)) return null;
  const t = name.replace(/_[a-z0-9]{6}$/, '').replace(/^_+|_+$/g, '').replace(/_/g, ' ').replace(/\s+/g, ' ').trim();
  return FIX[t] || t;
}
// images-data.js, read into one list of pieces in series order
export const piecesFrom = (images) => Object.keys(SERIES).flatMap((s) => (images[s] || []).map((img) => ({ s, pid: img.publicId, t: titleFrom(img.displayName || '') })));

const CLOUD = 'https://res.cloudinary.com/dhjy8pfsa/image/upload';
export const small = (a) => `${CLOUD}/f_auto,q_auto/c_limit,w_640,h_640/${a.pid}`;
export const large = (a) => `${CLOUD}/f_auto,q_auto/c_limit,w_1400,h_1400/${a.pid}`;

export const inSeries = (art, s) => art.filter((a) => a.s === s);
export const titleOf = (art, a, lang) => a.t || `${SERIES[a.s].one?.[lang] || cap(SERIES[a.s][lang])} nº ${inSeries(art, a.s).indexOf(a) + 1}`;

export const seriesButtons = (art, current, lang) => Object.keys(SERIES).filter((s) => inSeries(art, s).length).map((s) => `<button type="button" data-series="${s}" aria-pressed="${s === current}">${SERIES[s][lang]}<b>${inSeries(art, s).length}</b></button>`).join('');
export const workTiles = (art, shown, lang) => shown.map((a, k) => `<button class="work" type="button" data-work="${k}"><span class="work__img"><img src="${small(a)}" alt="${esc(titleOf(art, a, lang))}" loading="lazy" decoding="async"></span><span class="work__cap"><b>${pad2(k + 1)}</b>${esc(titleOf(art, a, lang))}</span></button>`).join('');
