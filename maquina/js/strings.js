// The terminal's words, in English and Spanish. Commands stay English, the way terminals
// are, with Spanish aliases; what the terminal says follows the site's language, which
// js/i18n.js picks and remembers for the deck and the machine alike.

import { getLang, setLang } from '../../js/i18n.js';

export const STR = {
  en: {
    tabShell: '~', tabLive: 'live', tabScope: 'scope', vol: 'vol',
    greet: 'La Máquina · llü · v0.1',
    greetHint: 'type help, or live to start making techno.',
    greetHintTouch: 'tap a word below, or type.',
    prompt: 'type a command', run: 'run', play: 'play', hush: 'hush', share: 'share',
    unlock: '▶ turn on sound', unlockHint: 'Tap ▶ once to turn on the sound.',
    help: [
      ['ls', 'what’s here'],
      ['live [n]', 'make techno in code (n: an example)'],
      ['play', 'run your pattern (tracks: soon)'],
      ['hush', 'silence, right now (or esc)'],
      ['examples', 'patterns to start from'],
      ['samples', 'every sound you can use'],
      ['share', 'a link to your pattern'],
      ['theme [name]', 'another shade of blue'],
      ['follow', 'where llü is'],
      ['credits', 'Strudel, the license, the source'],
      ['clear', 'clean the screen'],
      ['deck', 'back to the cards'],
    ],
    keysHint: 'in live: ctrl+enter runs, esc hushes, changes land on the next bar.',
    notFound: (c) => `${c}: command not found. try help`,
    lsTracks: 'coming soon', lsExamples: (n) => `${n} patterns`,
    tracksSoon: ['coming soon. llü is still in the studio.', 'try live meanwhile.'],
    loaded: (t) => `loaded ${t} · ctrl+enter or ▶ runs it`,
    noExample: (n) => `there's no example ${n}. try examples`,
    examplesHint: 'live <n> loads one.',
    samplesDrums: 'drum machines', samplesDrumsHow: '.bank("RolandTR909") · "RolandTR808" · "RolandTR707"',
    samplesSynths: 'synths', samplesMore: 'more',
    samplesSoon: 'llü’s own sounds are coming.',
    playing: (bpm) => `playing · ${bpm} bpm`, stopped: 'stopped', starting: 'starting…', loading: 'loading sounds…',
    ran: 'running · changes land on the next bar', hushed: 'hushed.',
    err: (m) => `error: ${m}`,
    sharedTitle: 'A pattern from a shared link.',
    sharedBody: 'Someone else wrote it. Read it, then press play. Nothing runs until you do.',
    sharedOpened: 'opened a shared pattern. read it, then run it.',
    shareEmpty: 'nothing to share yet. write a pattern in live first.',
    shareTooLong: 'that pattern is too long for a link.',
    shareCopied: 'link copied:', shareLink: 'your link:',
    shareBroken: 'that shared link is broken, so nothing was loaded.',
    themeNow: (n) => `theme: ${n}`, themeList: 'themes:', themeNo: (n) => `no theme called ${n}.`,
    follow: 'llü is on:',
    credits: [
      'La Máquina runs on Strudel, by Felix Roos, Alex McLean and the Strudel community.',
      'Its code, and Strudel’s, is free software under the AGPL-3.0.',
    ],
    creditsLinks: [['strudel', 'https://strudel.cc'], ['strudel’s source', 'https://codeberg.org/uzu/strudel'], ['this terminal’s source', 'https://github.com/ztfo/7thst.music/tree/main/maquina']],
    yours: 'what you make here is yours. share it with credit; don’t sell llü’s sounds.',
    whoami: 'a visitor. llü is the one behind the deck.',
    sudo: 'nice try.',
    restarted: 'the engine stopped answering, so it was restarted.',
    deck: 'back to the cards…',
    lang: 'language: english',
  },
  es: {
    tabShell: '~', tabLive: 'live', tabScope: 'scope', vol: 'vol',
    greet: 'La Máquina · llü · v0.1',
    greetHint: 'escribe help, o live para empezar a hacer techno.',
    greetHintTouch: 'toca una palabra abajo, o escribe.',
    prompt: 'escribe un comando', run: 'correr', play: 'dale', hush: 'para', share: 'comparte',
    unlock: '▶ prende el sonido', unlockHint: 'Toca ▶ una vez para prender el sonido.',
    help: [
      ['ls', 'lo que hay'],
      ['live [n]', 'haz techno con código (n: un ejemplo)'],
      ['play', 'corre tu patrón (las rolas: pronto)'],
      ['hush', 'silencio, ya (o esc)'],
      ['examples', 'patrones para empezar'],
      ['samples', 'los sonidos que puedes usar'],
      ['share', 'una liga a tu patrón'],
      ['theme [nombre]', 'otro tono de azul'],
      ['follow', 'dónde anda llü'],
      ['credits', 'Strudel, la licencia, el código'],
      ['clear', 'limpia la pantalla'],
      ['deck', 'de vuelta a las cartas'],
    ],
    keysHint: 'en live: ctrl+enter corre, esc lo para, los cambios entran en el siguiente compás.',
    notFound: (c) => `${c}: no conozco ese comando. prueba help`,
    lsTracks: 'pronto', lsExamples: (n) => `${n} patrones`,
    tracksSoon: ['pronto. llü sigue en el estudio.', 'mientras, prueba live.'],
    loaded: (t) => `cargué ${t} · ctrl+enter o ▶ lo corre`,
    noExample: (n) => `no hay ejemplo ${n}. prueba examples`,
    examplesHint: 'live <n> carga uno.',
    samplesDrums: 'cajas de ritmos', samplesDrumsHow: '.bank("RolandTR909") · "RolandTR808" · "RolandTR707"',
    samplesSynths: 'sintes', samplesMore: 'más',
    samplesSoon: 'ya vienen los sonidos de llü.',
    playing: (bpm) => `sonando · ${bpm} bpm`, stopped: 'parado', starting: 'arrancando…', loading: 'cargando sonidos…',
    ran: 'corriendo · los cambios entran en el siguiente compás', hushed: 'silencio.',
    err: (m) => `error: ${m}`,
    sharedTitle: 'Un patrón de una liga compartida.',
    sharedBody: 'Lo escribió alguien más. Léelo y luego dale play. Nada corre hasta que tú quieras.',
    sharedOpened: 'abrí un patrón compartido. léelo y luego córrelo.',
    shareEmpty: 'todavía no hay nada que compartir. escribe un patrón en live.',
    shareTooLong: 'ese patrón es muy largo para una liga.',
    shareCopied: 'liga copiada:', shareLink: 'tu liga:',
    shareBroken: 'esa liga compartida viene rota, así que no cargué nada.',
    themeNow: (n) => `tema: ${n}`, themeList: 'temas:', themeNo: (n) => `no hay un tema que se llame ${n}.`,
    follow: 'llü anda en:',
    credits: [
      'La Máquina corre en Strudel, de Felix Roos, Alex McLean y la comunidad de Strudel.',
      'Su código, y el de Strudel, es software libre bajo la AGPL-3.0.',
    ],
    creditsLinks: [['strudel', 'https://strudel.cc'], ['el código de strudel', 'https://codeberg.org/uzu/strudel'], ['el código de esta terminal', 'https://github.com/ztfo/7thst.music/tree/main/maquina']],
    yours: 'lo que hagas aquí es tuyo. compártelo con crédito; no vendas los sonidos de llü.',
    whoami: 'alguien de visita. llü es quien anda detrás de la baraja.',
    sudo: 'buen intento.',
    restarted: 'el motor dejó de contestar, así que lo reinicié.',
    deck: 'de vuelta a las cartas…',
    lang: 'idioma: español',
  },
};

export { getLang, setLang };
export const T = (k) => STR[getLang()][k];

// fills every [data-t] with its string
export function paint(root = document) {
  document.documentElement.lang = getLang();
  root.querySelectorAll('[data-t]').forEach((n) => { const v = T(n.dataset.t); if (typeof v === 'string') n.textContent = v; });
  root.querySelectorAll('[data-t-ph]').forEach((n) => { n.placeholder = T(n.dataset.tPh); });
  root.querySelectorAll('[data-t-label]').forEach((n) => { n.setAttribute('aria-label', T(n.dataset.tLabel)); });
}
