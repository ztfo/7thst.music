// Every card in Buena Suerte, the sketches from SoundCloud, and where to follow.
// Audio is on Cloudinary, put there by scripts/cut-and-upload-audio.js. A sealed
// card only ever has its 30-second preview up; the full song goes up the day it's out.

const CLOUD = 'https://res.cloudinary.com/dhjy8pfsa';
const audio = (id) => `${CLOUD}/video/upload/buena-suerte/${id}.mp3`;
const card = (pid) => `${CLOUD}/image/upload/c_crop,x_619,y_365,w_516,h_884/f_auto,q_88/${pid}`;

// a card's painted ground, turned on its side to fill the room
export const groundUrl = (pid, w) => `${CLOUD}/image/upload/c_crop,x_20,y_30,w_520,h_1654/a_90/c_fill,w_${w},h_${Math.round(w * 0.625)},g_center/f_auto,q_76/${pid}`;
// the same ground as one pixel, its average colour
export const groundAvgUrl = (pid) => `${CLOUD}/image/upload/c_crop,x_20,y_30,w_520,h_1654/c_scale,w_1,h_1/f_png/${pid}`;

const LUNA = 'La_Luna_zpuyld';
const COTORRO = 'El_Cotorro_az7mbb';
const DIABLITO = 'El_Diablito_poz9xb';

// n is the tracklist order, which isn't final. Sealed cards borrow a ground and tint it.
export const TRACKS = [
  { id: 'la-luna', n: 1, card: 'la luna', img: card(LUNA), ground: LUNA, src: audio('la-luna') },
  { id: 'el-cotorro', n: 2, card: 'el cotorro', img: card(COTORRO), ground: COTORRO, src: audio('el-cotorro') },
  { id: 'el-diablito', n: 3, card: 'el diablito', img: card(DIABLITO), ground: DIABLITO, src: audio('el-diablito') },
  { id: 'el-sueno', n: 4, card: 'el sueño', sealed: true, field: '#dca444', tint: '#9a6a24', ground: COTORRO, fx: -1, src: audio('el-sueno-preview') },
  { id: 'los-amigos', n: 5, card: 'los amigos', sealed: true, field: '#4a958b', tint: '#1f5a54', ground: COTORRO, fy: -1, src: audio('los-amigos-preview') },
  { id: 'el-corazon', n: 6, card: 'el corazón', sealed: true, field: '#bd5068', tint: '#6e2236', ground: DIABLITO, fx: -1, src: audio('el-corazon-preview') },
  { id: 'el-fuego', n: 7, card: 'el fuego', sealed: true, field: '#d2582f', tint: '#8a2a12', ground: DIABLITO, src: audio('el-fuego-preview') },
  { id: 'el-perdido', n: 8, card: 'el perdido', sealed: true, field: '#7a66be', tint: '#3a2d70', ground: DIABLITO, fy: -1, src: audio('el-perdido-preview') },
  { id: 'la-dama', n: 9, card: 'la dama', sealed: true, field: '#3a66b8', tint: '#1d3566', ground: LUNA, fx: -1, src: audio('la-dama-preview') },
];

// The newest twelve from the "works in progress." set on SoundCloud, as of this file.
// The page reads the set again on every visit and adds anything newer, so this is
// only what shows when SoundCloud can't be reached.
export const SKETCH_SET = { url: 'https://soundcloud.com/llu-official/sets/experiments', playlist: 1866428391, count: 38 };
export const SKETCHES = [
  { id: 2408842242, title: 'danza notturna', dur: 178, date: '2026-09-28', url: 'https://soundcloud.com/llu-official/danza-notturna' },
  { id: 2306913329, title: 'chopsuey', dur: 221, date: '2026-04-21', url: 'https://soundcloud.com/llu-official/chopsuey' },
  { id: 2225742206, title: 'use me', dur: 142, date: '2025-12-07', url: 'https://soundcloud.com/llu-official/use-me-bill-withers-bootleg' },
  { id: 2217883337, title: 'el altar', dur: 218, date: '2025-11-24', url: 'https://soundcloud.com/llu-official/el-altar' },
  { id: 2176896156, title: 'silver and gold', dur: 230, date: '2025-09-26', url: 'https://soundcloud.com/llu-official/silver-and-gold' },
  { id: 2161522398, title: 'so, be it.', dur: 136, date: '2025-08-29', url: 'https://soundcloud.com/llu-official/so-be-it' },
  { id: 2105563767, title: 'to be alive', dur: 182, date: '2025-05-31', url: 'https://soundcloud.com/llu-official/to-be-alive' },
  { id: 2099056965, title: 'push', dur: 80, date: '2025-05-20', url: 'https://soundcloud.com/llu-official/push-1' },
  { id: 2099055747, title: 'who do you think you are?', dur: 52, date: '2025-05-20', url: 'https://soundcloud.com/llu-official/who-do-you-think-you-are-2' },
  { id: 2083748061, title: 'enough', dur: 189, date: '2025-04-23', url: 'https://soundcloud.com/llu-official/enough' },
  { id: 2083746855, title: 'conflicted', dur: 139, date: '2025-04-23', url: 'https://soundcloud.com/llu-official/conflicted' },
  { id: 2066183284, title: 'summer with you', dur: 300, date: '2025-03-29', url: 'https://soundcloud.com/llu-official/summer-with-you' },
];

export const PLATFORMS = [
  { name: 'Spotify', href: 'https://open.spotify.com/artist/1t00W56dAWaTPJ7YcRwY91' },
  { name: 'Apple Music', href: 'https://music.apple.com/us/artist/ll%C3%BC/1770530866' },
  { name: 'SoundCloud', href: 'https://soundcloud.com/llu-official' },
  { name: 'Instagram', href: 'https://www.instagram.com/im.llu/' },
];
