// The lists the home page draws: shared by the page and by scripts/prerender.mjs, which
// writes the same markup into index.html so crawlers that don't run JavaScript see it too.

export const fmt = (s) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;
// card names take every word capitalized; labels and tips only their first
export const cap = (s) => s.replace(/(^|\s)\S/g, (c) => c.toUpperCase());
export const first = (s) => s.charAt(0).toUpperCase() + s.slice(1);
export const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
export const pad2 = (n) => String(n).padStart(2, '0');
export const monthYear = (iso, T) => { const [y, m] = iso.split('-').map(Number); return `${T('months')[m - 1]} ${y}`; };
export const soundcloudLink = (u) => typeof u === 'string' && u.startsWith('https://soundcloud.com/');

const miniCard = (t) => (t.sealed
  ? `<span class="mini-card mini-card--sealed" style="--field:${t.field}"></span>`
  : `<span class="mini-card"><img src="${t.img}" alt="" width="20" height="34" decoding="async"></span>`);

export const trackButtons = (tracks, T) => tracks.map((t, i) => `<button class="tk" type="button" data-track="${i}" style="${t.sealed ? `--field:${t.field}` : ''}" aria-label="${t.n}, ${cap(t.card)}, ${t.sealed ? `${T('previewLong')}, ${T('outWhen')}` : `${T('fullSong')}, ${fmt(t.dur)}`}">${miniCard(t)}<span class="tk__txt"><span class="tk__name"><b>${t.n}</b>${cap(t.card)}</span><span class="tk__meta">${t.sealed ? `<span class="dot"></span>${T('preview')}` : `<span class="tk__dur tnum">${fmt(t.dur)}</span>`}<span class="eq" aria-hidden="true"><i></i><i></i><i></i></span></span></span></button>`).join('');

export const platformLinks = (platforms) => platforms.map((p) => `<a href="${p.href}" target="_blank" rel="noopener" data-platform="${p.name}"><span>${p.name}</span><svg><use href="#i-out"/></svg></a>`).join('');

// buttons play the sketch on the page; links open it on SoundCloud (written into the HTML,
// and used when SoundCloud's player can't load)
export const sketchRows = (sketches, T, { links = false, fallback = '', icon = 'play' } = {}) => sketches.map((s, i) => {
  const inner = `<span class="sk__n">${pad2(i + 1)}</span><span class="sk__t">${esc(s.title)}</span><span class="sk__d">${monthYear(s.date, T)}</span><span class="sk__l tnum">${fmt(s.dur)}</span><span class="sk__i"><svg><use href="#i-${icon}"/></svg></span>`;
  return links
    ? `<li><a class="sk" href="${esc(soundcloudLink(s.url) ? s.url : fallback)}" target="_blank" rel="noopener">${inner}</a></li>`
    : `<li><button class="sk" type="button" data-sketch="${i}" aria-label="${esc(s.title)}, ${fmt(s.dur)}">${inner}</button></li>`;
}).join('');
