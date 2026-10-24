#!/usr/bin/env node

/**
 * Write what the pages say into their HTML, so search engines, AI crawlers and link
 * previews that don't run JavaScript see it too. The pages still draw themselves the
 * same way when they load; this only fills in the HTML they start from.
 *
 *   pnpm run prerender
 *
 * Run it after changing data/tracks.js, js/i18n.js or images-data.js (a card coming out,
 * new art). It rewrites index.html, art.html and llms.txt, and nothing else.
 */

import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';
import { TRACKS, SKETCHES, SKETCH_SET, PLATFORMS } from '../data/tracks.js';
import ENVELOPES from '../data/envelopes.js';
import { STR } from '../js/i18n.js';
import { cap, esc, trackButtons, platformLinks, sketchRows } from '../js/markup.js';
import { SERIES as ART_SERIES, PER_PAGE, piecesFrom, inSeries, seriesButtons, workTiles } from '../js/art-markup.js';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const SITE = 'https://7thst.music';
const T = (k) => STR.es[k];
const tracks = TRACKS.map((t) => ({ ...t, dur: ENVELOPES[t.id]?.dur ?? 0 }));
const released = tracks.filter((t) => !t.sealed);
// counts read as words in running text: "nueve rolas", "nine songs"
const wordEs = (n) => ['cero', 'una', 'dos', 'tres', 'cuatro', 'cinco', 'seis', 'siete', 'ocho', 'nueve', 'diez', 'once', 'doce'][n] ?? String(n);
const wordEn = (n) => ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve'][n] ?? String(n);
const read = (f) => fs.readFileSync(path.join(ROOT, f), 'utf8');
const write = (f, s) => fs.writeFileSync(path.join(ROOT, f), s);
const isoDuration = (s) => `PT${Math.floor(s / 60)}M${Math.round(s % 60)}S`;

// the art, as the art page reads it
const sandbox = { window: {} };
vm.runInNewContext(read('images-data.js'), sandbox);
const IMAGES = sandbox.window.images || {};
const SERIES = [
  ['songart', 'Portadas', 'Covers'], ['dreams', 'Sueños', 'Dreams'], ['mandalas', 'Mandalas', 'Mandalas'],
  ['voices', 'Voces', 'Voices'], ['animals', 'Animales', 'Animals'],
].map(([key, es, en]) => ({ key, es, en, count: (IMAGES[key] || []).length }));

// ---------- the head: description, language versions, share cards ----------
function seoHead({ title, description, pathname, image, imageAlt }) {
  const url = `${SITE}${pathname}`;
  return `<!-- seo: written by scripts/prerender.mjs -->
<meta name="description" content="${esc(description)}">
<meta name="robots" content="index, follow, max-image-preview:large">
<link rel="canonical" href="${url}">
<link rel="alternate" hreflang="es" href="${url}">
<link rel="alternate" hreflang="en" href="${url}?lang=en">
<link rel="alternate" hreflang="x-default" href="${url}">
<meta property="og:type" content="website">
<meta property="og:site_name" content="7thSt.music">
<meta property="og:locale" content="es_MX">
<meta property="og:locale:alternate" content="en_US">
<meta property="og:url" content="${url}">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(description)}">
<meta property="og:image" content="${SITE}/${image}">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:image:alt" content="${esc(imageAlt)}">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${esc(title)}">
<meta name="twitter:description" content="${esc(description)}">
<meta name="twitter:image" content="${SITE}/${image}">
<meta name="twitter:image:alt" content="${esc(imageAlt)}">
<link rel="manifest" href="site.webmanifest">
<meta name="apple-mobile-web-app-title" content="llü">
<meta name="color-scheme" content="dark">
<!-- /seo -->`;
}

// ---------- structured data ----------
const ARTIST_ID = `${SITE}/#llu`;
const artist = {
  '@type': 'MusicGroup',
  '@id': ARTIST_ID,
  name: 'llü',
  url: `${SITE}/`,
  description: 'Dance music written and produced by Luis Palomares, who also draws its art.',
  genre: 'Electronic',
  image: `${SITE}/assets/og/buena-suerte.jpg`,
  founder: { '@type': 'Person', name: 'Luis Palomares' },
  sameAs: PLATFORMS.map((p) => p.href),
};
const homeLd = [
  { '@context': 'https://schema.org', '@type': 'WebSite', name: '7thSt.music', url: `${SITE}/`, inLanguage: ['es', 'en'], publisher: { '@id': ARTIST_ID } },
  { '@context': 'https://schema.org', ...artist },
  {
    '@context': 'https://schema.org',
    '@type': 'MusicAlbum',
    name: 'Buena Suerte',
    url: `${SITE}/`,
    byArtist: { '@id': ARTIST_ID },
    albumProductionType: 'https://schema.org/StudioAlbum',
    numTracks: tracks.length,
    image: `${SITE}/assets/og/buena-suerte.jpg`,
    description: `A deck of ${wordEn(tracks.length)} songs, each one a card. ${released.map((t) => cap(t.card)).join(', ')} are out; the rest arrive in early 2027.`,
    track: {
      '@type': 'ItemList',
      numberOfItems: tracks.length,
      itemListElement: tracks.map((t, i) => ({
        '@type': 'ListItem',
        position: i + 1,
        item: { '@type': 'MusicRecording', name: cap(t.card), byArtist: { '@id': ARTIST_ID }, ...(t.sealed ? {} : { duration: isoDuration(t.dur) }) },
      })),
    },
  },
];
const artLd = [{
  '@context': 'https://schema.org',
  '@type': 'CollectionPage',
  name: 'Mis dibujos',
  alternateName: 'My art',
  url: `${SITE}/art.html`,
  inLanguage: ['es', 'en'],
  image: `${SITE}/assets/og/mis-dibujos.jpg`,
  creator: { '@type': 'MusicGroup', '@id': ARTIST_ID, name: 'llü' },
  mainEntity: {
    '@type': 'ImageGallery',
    name: 'Mis dibujos',
    hasPart: SERIES.filter((s) => s.count).map((s) => ({ '@type': 'Collection', name: s.es, alternateName: s.en, collectionSize: s.count })),
  },
}];
const ldBlock = (data) => `<!-- ld: written by scripts/prerender.mjs -->\n<script type="application/ld+json">\n${JSON.stringify(data, null, 1).replace(/</g, '\\u003c')}\n</script>\n<!-- /ld -->`;

// ---------- helpers that keep a re-run idempotent ----------
function between(html, start, end, inner) {
  const i = html.indexOf(start);
  if (i < 0) throw new Error(`missing ${start}`);
  const j = html.indexOf(end, i + start.length);
  if (j < 0) throw new Error(`missing ${end} after ${start}`);
  return html.slice(0, i + start.length) + inner + html.slice(j);
}
function block(html, name, content) {
  const open = `<!-- ${name}:`;
  const close = `<!-- /${name} -->`;
  const i = html.indexOf(open);
  if (i >= 0) return html.slice(0, i) + content + html.slice(html.indexOf(close, i) + close.length);
  return html.replace('</head>', `${content}\n</head>`);
}
// every [data-t] element gets its Spanish text; such elements only ever hold text
const fillText = (html) => html.replace(/(<(\w+)\b[^>]*\bdata-t="(\w+)"[^>]*>)([^<]*)(<\/\2>)/g, (m, open, _tag, key, _old, close) => {
  const v = STR.es[key];
  return typeof v === 'string' ? `${open}${esc(v)}${close}` : m;
});

// ---------- index.html ----------
let home = read('index.html');
home = block(home, 'seo', seoHead({
  title: 'llü · Buena Suerte',
  description: `Buena Suerte, lo nuevo de llü: ${wordEs(tracks.length)} rolas, cada una una carta. Escucha ${released.map((t) => cap(t.card)).join(', ').replace(/, ([^,]*)$/, ' y $1')} completas y una probadita del resto, que sale a inicios del 2027.`,
  pathname: '/',
  image: 'assets/og/buena-suerte.jpg',
  imageAlt: 'Las cartas de Buena Suerte sobre una mesa negra, con llü en dorado.',
}));
home = block(home, 'ld', ldBlock(homeLd));
home = fillText(home);
home = between(home, '<nav class="tracks__list" id="tracks" aria-label="Cards in the deck"', '</nav>', ` style="--n:${tracks.length}">${trackButtons(tracks, T)}`);
home = between(home, '<ol class="sketches" id="sketches">', '</ol>', sketchRows(SKETCHES, T, { links: true, fallback: SKETCH_SET.url }));
home = between(home, '<a class="sketches__all" id="sketches-all"', '<svg>', ` href="${SKETCH_SET.url}" target="_blank" rel="noopener"><span>${esc(T('allOnSC')(SKETCH_SET.count))}</span>`);
home = between(home, '<nav class="platforms" id="platforms" aria-label="Follow llü">', '</nav>', platformLinks(PLATFORMS));
write('index.html', home);

// ---------- art.html ----------
let art = read('art.html');
art = block(art, 'seo', seoHead({
  title: 'Mis dibujos · llü',
  description: `Los dibujos de llü: ${SERIES.filter((s) => s.count).map((s) => s.es.toLowerCase()).join(', ').replace(/, ([^,]*)$/, ' y $1')}, tal como salieron del papel.`,
  pathname: '/art.html',
  image: 'assets/og/mis-dibujos.jpg',
  imageAlt: 'Dibujos de llü sobre negro.',
}));
art = block(art, 'ld', ldBlock(artLd));
art = fillText(art);
// the series row and the first series' pieces, titled, as the page opens on them
const pieces = piecesFrom(IMAGES);
const opening = Object.keys(ART_SERIES).find((k) => inSeries(pieces, k).length);
if (opening) {
  art = between(art, '<nav class="series" id="series" aria-label="Series">', '</nav>', seriesButtons(pieces, opening, 'es'));
  art = between(art, '<div class="works" id="works"', '</div>', ` style="--r:${ART_SERIES[opening].r}">${workTiles(pieces, inSeries(pieces, opening).slice(0, PER_PAGE), 'es')}`);
}
write('art.html', art);

// ---------- llms.txt: the site in plain words, for AI assistants ----------
const lines = [
  '# llü',
  '',
  `> llü is the dance music project of Luis Palomares, who writes and produces the songs and draws their art. The site, ${SITE}, is in Spanish first, with English at ${SITE}/?lang=en.`,
  '',
  '## Buena Suerte',
  '',
  `The new record: ${wordEn(tracks.length)} songs dealt like a Lotería deck, one card each. On the site a card is drawn at a time and the room takes the color of its painted world. The cards that are out play in full; the ones still to come are sealed and play a 30-second preview ("probadita") until they come out in early 2027.`,
  '',
  ...tracks.map((t) => `- ${t.n}. ${cap(t.card)}: ${t.sealed ? 'sealed, 30-second preview on the site, out in full in early 2027' : `out now, ${Math.floor(t.dur / 60)}:${String(Math.round(t.dur % 60)).padStart(2, '0')}`}`),
  '',
  '## Listen and follow',
  '',
  ...PLATFORMS.map((p) => `- [${p.name}](${p.href})`),
  '',
  '## Works in progress',
  '',
  `Unfinished songs, newest first, from the SoundCloud set [works in progress.](${SKETCH_SET.url}) (${SKETCH_SET.count} in all). The newest play right on the site:`,
  '',
  ...SKETCHES.map((s) => `- [${s.title}](${s.url})`),
  '',
  '## Art',
  '',
  `[Mis dibujos / My art](${SITE}/art.html): ${SERIES.filter((s) => s.count).map((s) => `${s.en.toLowerCase()} (${s.es !== s.en ? `${s.es.toLowerCase()}, ` : ''}${s.count})`).join(', ')}.`,
  '',
  '## From the studio',
  '',
  '- [Arreglo](https://arreglo.ai): an AI-powered music arrangement generator for Figma, by 7thSt.music and llü.',
  '',
  '## Pages',
  '',
  `- [Home: Buena Suerte, works in progress, follow](${SITE}/)`,
  `- [Mis dibujos / My art](${SITE}/art.html)`,
  '',
];
write('llms.txt', lines.join('\n'));
console.log(`prerendered index.html, art.html and llms.txt: ${tracks.length} cards, ${SKETCHES.length} sketches, ${SERIES.reduce((n, s) => n + s.count, 0)} drawings`);
