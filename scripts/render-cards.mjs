#!/usr/bin/env node

/**
 * Draw each card's two pictures from scripts/og/carta.html, with headless Chrome:
 *   assets/cards/<id>-story.jpg  1080x1920, what the share button sends to Stories and chats
 *   assets/cards/<id>.jpg        600x600, the artwork on the phone's lock screen
 *
 *   pnpm run cards               # every card
 *   pnpm run cards el-fuego      # one card, say the day it comes out
 *
 * Run it after a card's art, name, number or colours change in data/tracks.js, and commit the
 * pictures. Needs Google Chrome (or CHROME=/path/to/chrome) and macOS's sips for the JPEGs.
 */

import fs from 'node:fs';
import http from 'node:http';
import os from 'node:os';
import path from 'node:path';
import { execFile, execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { TRACKS } from '../data/tracks.js';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const OUT = path.join(ROOT, 'assets/cards');
const CHROME = process.env.CHROME || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const SHAPES = [
  { shape: 'story', w: 1080, h: 1920, file: (id) => `${id}-story.jpg` },
  { shape: 'square', w: 600, h: 600, file: (id) => `${id}.jpg` },
];

const asked = process.argv.slice(2);
const cards = asked.length ? TRACKS.filter((t) => asked.includes(t.id)) : TRACKS;
if (!cards.length) throw new Error(`no card called ${asked.join(', ')}; the ids are in data/tracks.js`);
if (!fs.existsSync(CHROME)) throw new Error(`no Chrome at ${CHROME}; set CHROME to its path`);

// ES modules won't load from file://, so the repo is served for the length of the run
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css', '.woff2': 'font/woff2', '.png': 'image/png', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml' };
const server = http.createServer((req, res) => {
  const file = path.join(ROOT, decodeURIComponent(new URL(req.url, 'http://x').pathname));
  if (!file.startsWith(ROOT) || !fs.existsSync(file) || !fs.statSync(file).isFile()) { res.writeHead(404).end(); return; }
  res.writeHead(200, { 'content-type': TYPES[path.extname(file)] || 'application/octet-stream' });
  fs.createReadStream(file).pipe(res);
});
await new Promise((ok) => server.listen(0, '127.0.0.1', ok));
const base = `http://127.0.0.1:${server.address().port}`;

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'cards-'));
fs.mkdirSync(OUT, { recursive: true });
try {
  for (const t of cards) {
    for (const s of SHAPES) {
      const png = path.join(tmp, `${t.id}-${s.shape}.png`);
      // the virtual time budget lets the fonts and Cloudinary's images arrive before the shot
      await run(CHROME, ['--headless=new', '--disable-gpu', '--hide-scrollbars', '--force-device-scale-factor=1', `--window-size=${s.w},${s.h}`, '--virtual-time-budget=20000', `--screenshot=${png}`, `${base}/scripts/og/carta.html?id=${t.id}&shape=${s.shape}`]);
      execFileSync('sips', ['-s', 'format', 'jpeg', '-s', 'formatOptions', '82', png, '--out', path.join(OUT, s.file(t.id))], { stdio: 'ignore' });
      console.log(`assets/cards/${s.file(t.id)}`);
    }
  }
} finally {
  server.close();
  fs.rmSync(tmp, { recursive: true, force: true });
}

// Chrome runs while this process keeps serving the page to it, so it can't be a blocking call
function run(cmd, args) {
  return new Promise((ok, fail) => execFile(cmd, args, (err) => (err ? fail(err) : ok())));
}
