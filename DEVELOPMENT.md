# Working on 7thSt.music

How the site is put together and how to update it. For what the site is, see the [README](README.md).

- `index.html`: the table (the deck, the drawn card, the player, the tracklist), en proceso (works in progress from SoundCloud), and seguir (follow).
- `art.html`: Mis dibujos / My art, the drawings by series with a viewer.

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

For the details to show in GA's reports, each one needs registering once: **Admin → Custom definitions → Create custom dimension**, scope **Event**, with the same name as the detail (`card`, `kind`, `via`, `start`, `sketch`, `platform`, `series`, `piece`, `lang`, `method`, `feel`). The `track()` helper in `js/home.js` and `js/art.js` sends them, and does nothing where the tag is blocked.

## Local preview

```sh
python3 -m http.server 8000
```

Then open http://localhost:8000.
