# Working on 7thSt.music

How the site is put together and how to update it. For what the site is, see the [README](../README.md).

- `index.html`: the table (the deck, the drawn card, the player, the tracklist), en proceso (works in progress from SoundCloud), and seguir (follow).
- `art.html`: Mis dibujos / My art, the drawings by series with a viewer.
- `maquina/`: La Máquina, the terminal at `/maquina/` where visitors write techno in code (see [La Máquina](#la-máquina)). Its plan is [TERMINAL.md](TERMINAL.md).

Plain HTML, CSS and ES modules on GitHub Pages. There is no build step: edit, commit, push to `main`, and Pages publishes it to 7thst.music.

## Where things live

| Path | What |
| --- | --- |
| `styles/site.css` | tokens, base, the microtext frame, language switch, footer (both pages) |
| `styles/home.css`, `styles/art.css` | each page's own styles |
| `js/i18n.js` | every string, in English and Mexican Spanish, the remembered language, and a first visit following the browser's language (Spanish when it's neither). Spanish is written the way an artist talks ("probadita", "dale play"), and labels capitalize only their first word |
| `js/home.js`, `js/art.js` | each page's behavior |
| `js/microtext.js` | the "BUENA SUERTE · LLÜ · 7TH ST" line used for frames and rules |
| `data/tracks.js` | the nine cards, the SoundCloud sketches, follow links |
| `data/envelopes.js` | generated: each song's low-end energy, which makes the room breathe |
| `js/markup.js`, `js/art-markup.js` | the lists both pages draw, shared with the prerender |
| `js/cardback.js` | the engraved card back |
| `js/haptics.js`, `js/motion.js` | the phone's ticks, tilt and shake (see [The phone](#the-phone)) |
| `js/secrets.js` | the hidden ways into La Máquina (see [Ways in](#ways-in)) |
| `js/lost.js` | the 404 page's little terminal |
| `scripts/prerender.mjs` | writes the pages' content, head tags, structured data and `llms.txt` into the HTML |
| `assets/cards/` | generated: each card's share picture and lock screen artwork (`pnpm run cards`) |
| `images-data.js` | generated: the art, from Cloudinary (`pnpm run fetch-images`) |
| `fonts/` | Gambetta (Fontshare), self-hosted; Archivo loads from Google Fonts |

Audio and art are on Cloudinary, never in this repo. The repo is public. The card pictures in `assets/cards/` show sealed cards face down, never their art.

## Audio

Released cards play the full song. Sealed cards play only a 30-second preview, cut from a third of the way in with fades. A full unreleased song is never uploaded.

```sh
pnpm run audio --src "<file>" --id el-fuego --kind preview   # a sealed card
pnpm run audio --src "<file>" --id la-luna --kind full       # a card that's out
```

This needs ffmpeg and the Cloudinary credentials in `.env`. Each run uploads to `buena-suerte/<id>` (with `-preview` added for previews) and rewrites that song's entry in `data/envelopes.js`, so commit the envelope change. The same `--id` replaces the file at the same address. To drop in a remaster, re-run it. `--start <seconds>` picks a preview's start, and `--dry` cuts without uploading.

**When a card comes out:**
1. Upload it in full with `--kind full`.
2. In `data/tracks.js`, remove `sealed: true` and the field and tint colors, then add its card art (`img`) and its own `ground`.
3. Point `src` at the full file.
4. Run `pnpm run cards <id>` for its share picture and lock screen artwork, then `pnpm run prerender`, and commit both.

## Works in progress

The list shows the newest 12 from the SoundCloud set "works in progress." and plays them through SoundCloud's own player, so plays count there. On each visit the page reads the set again and adds anything newer, so a new upload shows up without touching the site. The list in `data/tracks.js` is only what shows when SoundCloud can't be reached. Refresh it now and then.

## Art

Upload through the existing tool (`upload.html` with `pnpm run upload-server`, kept out of git), then run `pnpm run fetch-images` and commit `images-data.js`. Titles come from the Cloudinary display names, and untitled pieces are numbered.

## Search and sharing

The pages draw themselves with JavaScript, but most AI crawlers and link previews don't run it. So `pnpm run prerender` writes what the pages say into their HTML, in Spanish:
- the nav, headings and copy;
- the tracklist, the works in progress and the follow links;
- the art page's series and first set of drawings.

It also writes the head tags (description, canonical, `es`/`en` alternates, Open Graph and Twitter cards), the JSON-LD structured data (the artist, Buena Suerte and its tracks, the art), and `llms.txt`, a plain summary for AI assistants. The same templates (`js/markup.js`, `js/art-markup.js`) draw the pages, so the HTML always matches.

**Run `pnpm run prerender` whenever you change `data/tracks.js`, `js/i18n.js` or `images-data.js`**, such as a card coming out, a new sketch list or new art, and commit what it changes. It only rewrites `index.html`, `art.html` and `llms.txt`, and running it twice changes nothing.

English has its own address for search engines: `?lang=en` (for example `https://7thst.music/?lang=en`).

**Card pictures** are in `assets/cards/`: `<id>-story.jpg` (1080 by 1920, what the share button sends) and `<id>.jpg` (600 by 600, the lock screen artwork). `pnpm run cards` draws them all from `scripts/og/carta.html` with headless Chrome, and `pnpm run cards el-fuego` draws one.

**Share images** are `assets/og/buena-suerte.jpg` and `assets/og/mis-dibujos.jpg`, at 1200 by 630. To redo one:
1. Serve the repo.
2. Open `scripts/og/buena-suerte.html` or `scripts/og/mis-dibujos.html` in a 1200 by 630 window.
3. Screenshot it and save it over the JPEG.

Also in the root: `robots.txt` (everything allowed), `sitemap.xml`, `site.webmanifest` (home screen name and icons), and `404.html`.

## The phone

On phones and in the browser the site reaches past the page. What works where:

| What | Where | How |
| --- | --- | --- |
| Lock screen, Control Center, headphones, the car | iPhone, Android, desktop | The Media Session API shows the card's name and artwork. Prev and next deal cards, and the scrubber seeks. Works in progress show too, as best they can: they play inside SoundCloud's player, so the phone may show SoundCloud's details instead. |
| Tab title | everywhere | `▶ El Cotorro · llü` while something plays |
| Browser bar colour | Android | `theme-color` takes the dark top edge of the card's room, read from Cloudinary's one-pixel average of the ground. iOS Safari picks its own colour from the page. |
| Card links | everywhere | `?carta=el-cotorro` opens on that card (with `&lang=en` for English). The address bar isn't rewritten as cards change, so page views aren't counted twice. |
| Share a card | everywhere | The top row of the follow popover. Phones and Safari open the share sheet with the card's picture (`assets/cards/<id>-story.jpg`) and its link. Elsewhere, the link is copied. |
| Ticks | iPhone: taps. Android: taps, swipes and landings | Android uses `navigator.vibrate`. iPhones have no vibration API, but Safari ticks when a finger toggles a switch input, so `arm()` in `js/haptics.js` lays an invisible one over draw, prev, next, the deck, the tracklist, the card and the two switches. Since iOS 26.5 only a real tap does it, never code, so an iPhone can't tick on a kick. A swipe can only tick if Safari's switch ticks as the drag carries it over. Link buttons are never armed, since the switch would take their click. |
| Sentir | phones only, off until turned on, remembered | Tilting moves the light across the gold and the card (the card itself stays flat). A hard shake draws a card. On Android each kick pulses the phone. iPhones ask for motion access when it's switched on. Turning it on shows a line under the switch saying what it does. |

Motion and sharing need HTTPS, so on a phone test through a tunnel to the local server, not the LAN address. `js/motion.js` holds the shake's thresholds and the tilt's range. The light's strength is in `styles/home.css`, under "sentir".

## La Máquina

`/maquina/` is a terminal for live coding techno, built on [Strudel](https://strudel.cc). Everything in `maquina/` is AGPL-3.0 (`maquina/LICENSE`), because Strudel is; the rest of the site isn't. The `credits` command (listed in `help`) credits Strudel and links to both sources, which is what the AGPL asks of a site; keep it there. Code in `maquina/` may import the site's modules (it reads `js/i18n.js` and `data/tracks.js`), but nothing outside it imports from `maquina/`.

| Path | What |
| --- | --- |
| `maquina/index.html` | the page: tabs, the editor, the shell, the scope |
| `maquina/terminal.css` | the look: full screen, one blue accent, one pane at a time on phones |
| `maquina/js/shell.js` | the commands, the tabs, and the wiring between the parts |
| `maquina/js/editor.js` | the editor: a textarea over its own highlighted copy |
| `maquina/js/scope.js` | the waveform and spectrum, and the kick the bar breathes with |
| `maquina/js/bridge.js` | the page's side of the sound engine |
| `maquina/sandbox.html`, `maquina/js/engine.js` | the sound engine, which runs the patterns |
| `maquina/js/strings.js` | what the terminal says, in both languages |
| `maquina/js/share.js` | share links, with the pattern in the address after `#p=` |
| `maquina/js/themes.js` | the blues `theme` switches between |
| `maquina/js/grid.js` | the step grid: five drums by sixteen steps, read from and written to the code |
| `maquina/data/examples.js` | the seven example patterns and the list `samples` shows |
| `maquina/data/lessons.js` | `learn`, eight steps from a kick to an arranged track, and the `cheat` sheet, in both languages |
| `maquina/vendor/strudel-1.3.0/` | a pinned copy of Strudel's browser bundle, served from this site |

**Pattern code is JavaScript, and a share link carries a stranger's.** So it only ever runs in the engine: `sandbox.html` in an iframe sandboxed without `allow-same-origin`. There it has a blank origin of its own. It can't touch the page, its storage or its cookies, can't navigate or open windows, and its own Content Security Policy lets it fetch only samples. The page and the engine talk through `postMessage`, and the page takes only small, checked messages back. The page never evaluates anything: the shell matches a fixed list of commands. A shared link opens with its code showing and nothing runs until the visitor presses play.

**Sound.** Everything goes through a limiter before the speakers, so nothing goes past about -1 dBFS whatever a pattern's gain says. Then comes the volume (60% to start). Esc, `hush` and the stop button always cut it. Loops (`for`, `while`, `do`) are refused, because an endless one would hang the tab: most browsers run the frame in the page's process.

**Starting sound.** Chrome lets the visitor's tap or key on the page start sound in the frame. Where a browser doesn't (likely Safari), the engine answers `locked` and the page lays the frame over the play button. The visitor's next tap lands in the engine's own "turn on sound" button, once per visit. Check this on an iPhone whenever the engine changes.

**Sounds** for now are Strudel's defaults: the drum machines and Dirt-Samples, loaded from GitHub by `engine.js`, plus Strudel's synths. llü's stems come later (see [TERMINAL.md](TERMINAL.md)).

**Changing what's playing:** edits go in when the visitor presses play (or Ctrl+Enter), and land on the next bar, as in every live-coding tool: half-typed code is usually broken. While the code on screen isn't what's playing, the button says "update" ("actualiza") and breathes softly, and the status says to press it. `auto on` applies changes by itself about a second after typing stops. Code that doesn't run is skipped: the last good version keeps playing, and the error shows only in the status line. The choice is remembered.

**Learning:** `learn` walks a newcomer from one kick drum to a whole arranged track in eight steps. Each step shows a panel above the code (what's new, and something to try) and loads the whole pattern so far, so `next` and `back` can always replace the code. Each step's code must run on its own. Change one, and run all eight. `cheat` prints the notation on one screen. The step someone reached is remembered.

**Beyond patterns:** `grid` swaps the editor for a step grid. A grid pattern is code in one exact shape, so tapping a step rewrites the code, and code edited out of that shape stops being a grid. `record [seconds]` saves up to 30 seconds of what's playing as a WAV. The engine encodes it and the page downloads it, taking the file only while a recording it asked for is running. `save`, `load` and `rm` keep patterns in the visitor's own browser, and nothing goes anywhere else.

**Upgrading Strudel:** `npm pack @strudel/web@<version>`, copy its `dist/index.mjs`, `dist/assets/` and `LICENSE` into a new `maquina/vendor/strudel-<version>/`, point the import in `maquina/js/engine.js` at it, delete the old folder, and run every example.

**Previewing it locally** needs a server that sends `Access-Control-Allow-Origin: *`, as GitHub Pages does, since the sandboxed frame loads its scripts cross-origin. `pnpm run serve` does (see [Local preview](#local-preview)). `python3 -m http.server` serves the page, but not a working engine.

## Ways in

Nothing on the site links to La Máquina; it's found. Each way in lands on `/maquina/?via=<way>`, and `term_open` reports the `via`. Most of them live in `js/secrets.js`.

| Way (`via`) | Where | What |
| --- | --- | --- |
| `card` | home | One draw in fifty (the deck, `d`, or a shake) deals the tenth card, La Máquina, instead of a song. Its "pásale / step in" goes in. `?carta=la-maquina` opens on it. |
| `keys` | home | Typing `llu`, `llü`, `sudo` or `máquina` anywhere (not in a field), or just `/` |
| `perdido` | home | Seven quick taps on El Perdido's card, or holding it for three seconds |
| `frame` | home | The microtext frame's one wrong character: the Ü of the last LLÜ along the top is a `_` (`js/microtext.js`) |
| `3am` | home | From 3 to 4 a.m. local time the room sinks into a dark blue, and a blinking cursor in the bottom corner goes in |
| `console` | home, art | The console says `try llu.maquina()` |
| `source` | home, art | A comment in the page source names `/maquina/?via=source` |
| `404` | any missing page | `404.html` is a small terminal; `ls -a` shows `.maquina/`, and `cd .maquina` goes in |

`llms.txt` also describes it, for AI assistants. On the way in the page jitters and darkens for half a second (`.is-leaving` in `styles/site.css`). It never flashes, and with reduced motion it just goes.

To try the tenth card without drawing fifty times, open `/?carta=la-maquina`. To see 3 a.m. at another hour, set the computer's clock to 3 a.m. and reload.

## Analytics

Google Analytics 4 (`G-G9DRK12SZE`) runs on both pages. On top of the page views GA tracks by itself, the site sends these events. Every one carries `lang`.

| Event | When | Details |
| --- | --- | --- |
| `card_play` | a card starts playing | `card`, `kind` (full or preview), `via` (first, link, draw, tracklist, swipe, next, prev, keys, shake, lockscreen, auto), `start` (beginning or resume) |
| `card_complete` | a song or probadita plays to the end | `card`, `kind` |
| `sketch_play` / `sketch_complete` | a work in progress starts / plays to the end | `sketch` |
| `follow_click` | Spotify, Apple Music, SoundCloud or Instagram tapped | `platform` |
| `art_open` | a drawing opened in the viewer | `series`, `piece` |
| `lang_switch` | the EN/ES switch | `lang` |
| `card_share` | a card shared from the follow popover | `card`, `method` (sheet or link) |
| `feel_switch` | the sentir switch | `feel` (on, off, or denied when an iPhone's motion access is refused) |
| `term_open` | La Máquina opens | `via` (a `?via=` from the link, `pattern` for a share link, or `direct`) |
| `term_command` | a command in La Máquina | `command` (only its name, never what was typed after it) |
| `live_run` | a pattern runs | `via` (keys, button, shell), `shared` (yes when it came from a share link) |
| `pattern_share` / `pattern_open` | a pattern shared / a share link opened | `method` (sheet, link, shown) |
| `pattern_record` | a recording is saved | `seconds` |
| `learn_step` | a step of `learn` opens | `step` (1 to 8) |
| `auto_switch` | `auto` turned on or off | `auto` (on, off) |
| `secret_found` | a way into La Máquina is used, on the deck | `way` (card, keys, perdido, frame, 3am, console) |
| `machine_card` | the tenth card shows | `via` (draw, keys, shake, link) |

For the details to show in GA's reports, each one needs registering once: **Admin → Custom definitions → Create custom dimension**, scope **Event**, with the same name as the detail (`card`, `kind`, `via`, `start`, `sketch`, `platform`, `series`, `piece`, `lang`, `method`, `feel`, `command`, `shared`, `seconds`, `way`, `step`, `auto`). The `track()` helper in `js/home.js` and `js/art.js` sends them, and does nothing where the tag is blocked.

## Local preview

```sh
pnpm run serve
```

It opens http://localhost:8000. It sends the same cross-origin header GitHub Pages does, which La Máquina's sound engine needs; `python3 -m http.server 8000` works for everything else.
