// Every card in Buena Suerte, the sketches from SoundCloud, and where to follow.
// Audio is on Cloudinary, put there by scripts/cut-and-upload-audio.js. A sealed
// card only ever has its 30-second preview up; the full song goes up the day it's out.

const CLOUD = 'https://res.cloudinary.com/dhjy8pfsa';
const audio = (id) => `${CLOUD}/video/upload/buena-suerte/${id}.mp3`;
// the card out of its scan, out to where its torn paper edge is still solid all the way along
// (the scans share one layout); its shape is the deck's, 516 by 884
const card = (pid) => `${CLOUD}/image/upload/c_crop,x_614,y_359,w_528,h_904/f_auto,q_88/${pid}`;

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

// The whole "works in progress." set on SoundCloud, in the set's own order (the order on
// SoundCloud, not upload dates), as of this file. The page reads the set again on every visit
// and follows its order, adding anything new, so this is only what shows before that, or when
// SoundCloud can't be reached. Refresh it with scripts/sketch-set.html.
export const SKETCH_SET = { url: 'https://soundcloud.com/llu-official/sets/experiments', playlist: 1866428391, count: 38 };
export const SKETCHES = [
  { id: 2408842242, title: 'danza notturna', dur: 178, date: '2026-09-28', url: 'https://soundcloud.com/llu-official/danza-notturna' },
  { id: 2306913329, title: 'chopsuey', dur: 221, date: '2026-04-21', url: 'https://soundcloud.com/llu-official/chopsuey' },
  { id: 2225742206, title: 'use me', dur: 142, date: '2025-12-07', url: 'https://soundcloud.com/llu-official/use-me-bill-withers-bootleg' },
  { id: 2217883337, title: 'el altar', dur: 218, date: '2025-11-24', url: 'https://soundcloud.com/llu-official/el-altar' },
  { id: 2105563767, title: 'to be alive', dur: 182, date: '2025-05-31', url: 'https://soundcloud.com/llu-official/to-be-alive' },
  { id: 2176896156, title: 'silver and gold', dur: 230, date: '2025-09-26', url: 'https://soundcloud.com/llu-official/silver-and-gold' },
  { id: 1888890759, title: 'honky tonk', dur: 267, date: '2024-08-04', url: 'https://soundcloud.com/llu-official/dancing-in-the-rain-honky-tonk' },
  { id: 2011549395, title: 'wandering', dur: 202, date: '2025-01-17', url: 'https://soundcloud.com/llu-official/wondering' },
  { id: 2083748061, title: 'enough', dur: 189, date: '2025-04-23', url: 'https://soundcloud.com/llu-official/enough' },
  { id: 1938486248, title: 'reframe', dur: 167, date: '2024-10-21', url: 'https://soundcloud.com/llu-official/reframe' },
  { id: 2066183284, title: 'summer with you', dur: 300, date: '2025-03-29', url: 'https://soundcloud.com/llu-official/summer-with-you' },
  { id: 2161522398, title: 'so, be it.', dur: 136, date: '2025-08-29', url: 'https://soundcloud.com/llu-official/so-be-it' },
  { id: 1920243620, title: 'kinetic', dur: 97, date: '2024-09-20', url: 'https://soundcloud.com/llu-official/kinetic' },
  { id: 2030112024, title: 'we can keep on', dur: 183, date: '2025-02-09', url: 'https://soundcloud.com/llu-official/we-can-keep-on' },
  { id: 1901077968, title: 'few friends', dur: 270, date: '2024-08-21', url: 'https://soundcloud.com/llu-official/few-friends' },
  { id: 1888894995, title: 'mi sangre', dur: 225, date: '2024-08-04', url: 'https://soundcloud.com/llu-official/mi-sangre' },
  { id: 1901085081, title: 'lucid', dur: 206, date: '2024-08-21', url: 'https://soundcloud.com/llu-official/lucid' },
  { id: 2066178856, title: 'in my head', dur: 309, date: '2025-03-29', url: 'https://soundcloud.com/llu-official/in-my-head' },
  { id: 2099055747, title: 'who do you think you are?', dur: 52, date: '2025-05-20', url: 'https://soundcloud.com/llu-official/who-do-you-think-you-are-2' },
  { id: 2099056965, title: 'push', dur: 80, date: '2025-05-20', url: 'https://soundcloud.com/llu-official/push-1' },
  { id: 2083746855, title: 'conflicted', dur: 139, date: '2025-04-23', url: 'https://soundcloud.com/llu-official/conflicted' },
  { id: 1907745065, title: 'move', dur: 206, date: '2024-08-31', url: 'https://soundcloud.com/llu-official/move' },
  { id: 2011680219, title: 'no expectation', dur: 40, date: '2025-01-18', url: 'https://soundcloud.com/llu-official/no-expectation' },
  { id: 1901095740, title: 'mirage', dur: 112, date: '2024-08-21', url: 'https://soundcloud.com/llu-official/mirage' },
  { id: 1901079153, title: 'candela', dur: 258, date: '2024-08-21', url: 'https://soundcloud.com/llu-official/tengo-candela' },
  { id: 1901082750, title: 'help me say', dur: 201, date: '2024-08-21', url: 'https://soundcloud.com/llu-official/help-me-say' },
  { id: 1935673850, title: 'escape', dur: 47, date: '2024-10-16', url: 'https://soundcloud.com/llu-official/escape' },
  { id: 1901087352, title: 'paranoia', dur: 130, date: '2024-08-21', url: 'https://soundcloud.com/llu-official/paranoia' },
  { id: 1901080449, title: 'chaos', dur: 108, date: '2024-08-21', url: 'https://soundcloud.com/llu-official/chaos' },
  { id: 1915198430, title: 'running away', dur: 138, date: '2024-09-12', url: 'https://soundcloud.com/llu-official/running-away' },
  { id: 1901088117, title: 'sly', dur: 110, date: '2024-08-21', url: 'https://soundcloud.com/llu-official/brain' },
  { id: 1901094897, title: 'pace', dur: 100, date: '2024-08-21', url: 'https://soundcloud.com/llu-official/pace' },
  { id: 1907746418, title: 'collapse', dur: 286, date: '2024-08-31', url: 'https://soundcloud.com/llu-official/collapse' },
  { id: 1914967631, title: 'bossa', dur: 117, date: '2024-09-12', url: 'https://soundcloud.com/llu-official/bossa' },
  { id: 1914968129, title: 'the calm before', dur: 94, date: '2024-09-12', url: 'https://soundcloud.com/llu-official/the-calm-before' },
  { id: 1914969014, title: 'day dreaming', dur: 126, date: '2024-09-12', url: 'https://soundcloud.com/llu-official/day-dreaming' },
  { id: 1914969581, title: 'complicated', dur: 83, date: '2024-09-12', url: 'https://soundcloud.com/llu-official/itscomplicated-98' },
  { id: 1914970028, title: 'languish', dur: 37, date: '2024-09-12', url: 'https://soundcloud.com/llu-official/languish-80' },
];

export const PLATFORMS = [
  { name: 'Spotify', href: 'https://open.spotify.com/artist/1t00W56dAWaTPJ7YcRwY91' },
  { name: 'Apple Music', href: 'https://music.apple.com/us/artist/ll%C3%BC/1770530866' },
  { name: 'SoundCloud', href: 'https://soundcloud.com/llu-official' },
  { name: 'Instagram', href: 'https://www.instagram.com/im.llu/' },
];
