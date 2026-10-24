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
| `js/i18n.js` | every string, in English and Mexican Spanish, and the remembered language. Spanish is written the way an artist talks ("probadita", "dale play"), and labels capitalize only their first word |
| `js/home.js`, `js/art.js` | each page's behavior |
| `js/microtext.js` | the "BUENA SUERTE · LLÜ · 7TH ST" line used for frames and rules |
| `data/tracks.js` | the nine cards, the SoundCloud sketches, follow links |
| `data/envelopes.js` | generated: each song's low-end energy, which makes the room breathe |
| `images-data.js` | generated: the art, from Cloudinary (`pnpm run fetch-images`) |
| `fonts/` | Gambetta (Fontshare), self-hosted; Archivo loads from Google Fonts |

Audio and art are on Cloudinary, never in this repo. The repo is public.

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

## Works in progress

The list shows the newest 12 from the SoundCloud set "works in progress." and plays them through SoundCloud's own player, so plays count there. On each visit the page reads the set again and adds anything newer, so a new upload shows up without touching the site. The list in `data/tracks.js` is only what shows when SoundCloud can't be reached. Refresh it now and then.

## Art

Upload through the existing tool (`upload.html` with `pnpm run upload-server`, kept out of git), then run `pnpm run fetch-images` and commit `images-data.js`. Titles come from the Cloudinary display names, and untitled pieces are numbered.

## Local preview

```sh
python3 -m http.server 8000
```

Then open http://localhost:8000.
