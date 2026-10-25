// Both pages, both languages. Lotería words stay Spanish in either one, and the
// Spanish is Mexican, norteño leaning: "rolas", "pásale", "hasta arriba", the
// preterite over the perfect. Spanish comes first; a visitor's switch is remembered across pages.

const KEY = 'bs-lang';

export const STR = {
  es: {
    // said the way an artist says it, not the way a label reads: "probadita", "dale play", "inténtale"
    music: 'música', art: 'arte', wipNav: 'en proceso', follow: 'seguir', prev: 'anterior', play: 'dale play', pause: 'pausa', next: 'siguiente',
    listen: 'dale play', previewListen: 'probadita', preview: 'probadita', out: 'sale',
    failed: (n) => `No cargó ${n}. Recarga la página e inténtale otra vez.`,
    followH: 'Sigue a llü.', followP: 'Buena Suerte se va cantando carta por carta. Síguelo donde escuchas música para que no se te pase ninguna.',
    fullSong: 'completa', previewLong: 'probadita de 30 segundos', previewPill: 'probadita', restOf: 'completa a inicios del 2027',
    when: 'inicios del 2027', outWhen: 'sale a inicios del 2027',
    draw: 'saca una carta', prevCard: 'la anterior', nextCard: 'la que sigue', followTip: 'sigue a llü', position: 'posición',
    followPop: 'Sigue a llü.',
    share: (n) => `Comparte ${n}`, shareText: (n) => `${n}, de llü.`, copied: 'Liga copiada', feel: 'sentir',
    feelTilt: 'Inclina el cel y la luz se mueve con él.', feelShake: 'Sacúdelo y sale otra carta.', feelKick: 'Y vibra con cada bombo.', feelDenied: 'Sentir necesita permiso para leer el movimiento del cel.',
    wip: 'en proceso', wipH: 'Rolas sin terminar.', wipP: 'Así como van, todavía en el estudio. Lo más nuevo hasta arriba.',
    allOnSC: (n) => `Las ${n} en SoundCloud`, opensSC: 'Se abren en SoundCloud.', tapToPlay: 'Dale play aquí abajo.',
    back: 'regresar a la música', brand: 'llü · mis dibujos', studio: 'del estudio:',
    obraH: 'Mis dibujos.', obraP: 'Portadas, sueños, mandalas y lo que va saliendo entre rola y rola.',
    seeAll: (n) => `ver todos · ${n}`, seeLess: 'ver menos', close: 'cerrar', prevWork: 'anterior', nextWork: 'siguiente',
    months: ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'],
  },
  en: {
    music: 'music', art: 'art', wipNav: 'in progress', follow: 'follow', prev: 'prev', play: 'play', pause: 'pause', next: 'next',
    listen: 'listen', previewListen: 'preview', preview: 'preview', out: 'out',
    failed: (n) => `${n} didn't load. Reload the page to try again.`,
    followH: 'Follow llü.', followP: 'Buena Suerte is dealt one card at a time. Follow where you listen to hear each one the day it turns over.',
    fullSong: 'full song', previewLong: '30-second preview', previewPill: '30-second preview', restOf: 'full song in early 2027',
    when: 'early 2027', outWhen: 'out early 2027',
    draw: 'draw a card', prevCard: 'previous card', nextCard: 'next card', followTip: 'follow llü', position: 'position',
    followPop: 'Follow llü.',
    share: (n) => `Share ${n}`, shareText: (n) => `${n}, by llü.`, copied: 'Link copied', feel: 'feel',
    feelTilt: 'Tilt your phone and the light moves with it.', feelShake: 'Shake it to draw another card.', feelKick: 'It pulses with every kick, too.', feelDenied: 'Feel needs permission to read your phone’s motion.',
    wip: 'works in progress', wipH: 'Unfinished songs.', wipP: 'As they are, still in the studio. Newest at the top.',
    allOnSC: (n) => `All ${n} on SoundCloud`, opensSC: 'Opens on SoundCloud.', tapToPlay: 'Press play below.',
    back: 'back to the music', brand: 'llü · my art', studio: 'from the studio:',
    obraH: 'My art.', obraP: 'Covers, dreams, mandalas, and whatever turns up between songs.',
    seeAll: (n) => `see all · ${n}`, seeLess: 'see less', close: 'close', prevWork: 'previous', nextWork: 'next',
    months: ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'],
  },
};

// a ?lang=en or ?lang=es link wins (search engines index each language at its own address),
// then the visitor's own switch, then Spanish
let lang = (() => {
  try { const asked = new URLSearchParams(location.search).get('lang'); if (asked === 'es' || asked === 'en') return asked; } catch {}
  try { const saved = localStorage.getItem(KEY); if (saved === 'es' || saved === 'en') return saved; } catch {}
  return 'es';
})();

export const getLang = () => lang;
export function setLang(next) {
  lang = next;
  try { localStorage.setItem(KEY, next); } catch {}
}
export const T = (k) => STR[lang][k];

// fills every [data-t] with its string and sets the switch
export function paintLang(root = document) {
  document.documentElement.lang = lang;
  root.querySelectorAll('[data-t]').forEach((n) => { const v = T(n.dataset.t); if (typeof v === 'string') n.textContent = v; });
  const sw = document.getElementById('lang');
  if (sw) {
    sw.setAttribute('aria-checked', String(lang === 'es'));
    sw.querySelectorAll('[data-l]').forEach((s) => s.classList.toggle('on', s.dataset.l === lang));
  }
}
