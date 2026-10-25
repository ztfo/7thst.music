# La Máquina: the terminal side of 7thSt.music

A plan, not built yet. The lotería deck is the front door; this is the back room. A
black terminal where llü's dark techno lives, and where a visitor can write their own
techno in a few lines of code and hear it right away.

**La Máquina** is a tenth card that isn't in the deck. The techno is llü's too, under the
same name, so the deck and the machine point at each other. It lives at
**7thst.music/maquina** and opens as `llü@7thst:~$`.

## What it is

Three things in one screen:

1. **A listening room for the dark techno.** `ls` lists the tracks, `play <name>` plays
   one, and the screen draws the sound: a scope and a spectrum in green or amber
   characters, with the kicks shaking the frame the way the room breathes on the deck.
2. **A place to code techno.** `live` opens an editor beside the prompt. The visitor
   types a pattern, presses Ctrl+Enter (or a big ▶ on a phone), and it loops in time.
   Changes land on the next bar, so it never stops while you edit. That's how live coding
   works in TidalCycles, Strudel and Sonic Pi.
3. **llü's own sounds as the instrument.** A handful of llü's own kicks and hits sit on
   top of classic drum machines, so what people make starts from llü's sound.

It breaks the deck's layout on purpose: no cards, no gold, monospace on black. It shares
only the domain, the language switch and the follow links.

## The language

**Built on [Strudel](https://strudel.cc).** Strudel is TidalCycles in
the browser: the standard live-coding notation for techno, a scheduler that keeps
time, synths, effects and sample loading. It runs from a script tag, so the site still
has no build step. Writing our own engine would take months and still be worse. And what
visitors learn here carries over to Strudel, Tidal and the algorave scene, which is where
they'd find llü.

A first pattern would look like this:

```js
setcps(132/60/4)
stack(
  s("llu_kick*4").gain(1.1),
  s("~ llu_hat ~ llu_hat").hpf(6000),
  s("llu_rumble").slow(2).lpf(sine.range(200, 900).slow(8)),
  note("<c1 c1 eb1 g0>").s("sawtooth").lpf(400).decay(.2)
)
```

Mini-notation reads like a step sequencer: `*4` is four on the floor, `~` is a rest,
`<a b>` takes one each bar.

**The license.** Strudel is AGPL-3.0, and this repo is MIT. Strudel loads unchanged from
a pinned CDN version, and everything the terminal adds lives in `maquina/`, which has its
own AGPL-3.0 `LICENSE`. The rest of the site stays MIT. `help` ends with a credit line and
links to Strudel and to the terminal's source on GitHub, which covers AGPL's
offer-the-source rule. Code under `maquina/` can import the site's MIT modules (such as
`js/motion.js`), but nothing outside `maquina/` imports from it.

## Commands

Commands are in English, the way terminals are, with Spanish aliases. Messages follow the
site's language.

| Command | Alias | What |
| --- | --- | --- |
| `help` | `ayuda` | what you can do |
| `ls` | | the techno tracks, with BPM and length |
| `play <track>` / `stop` | `dale` / `para` | listen, with the scope |
| `cat <track>` | | its notes: when it was made, the gear, a line from llü |
| `live` | `máquina` | opens the editor with a starter pattern |
| `examples` | `ejemplos` | patterns to load: a kick, a full groove, one per track |
| `remix <track>` | | loads a pattern built from that track's own sounds |
| `samples` | `sonidos` | every llü sound you can use, and a click to hear each |
| `share` | `comparte` | a link with your pattern in it |
| `save` / `load` | | patterns kept in this browser |
| `record` | `graba` | records 30 seconds to a WAV you can download |
| `deck` / `exit` | `baraja` | back to the cards |
| `follow` | `sigue` | the follow links |

## The sounds

- **llü's one-shots**: there are no stems, so the pack starts with a few of llü's own
  kicks, hats, claps and hits, named `llu_kick`, `llu_hat` and so on. They go up to
  Cloudinary under `maquina/`, like the audio now, with a `pnpm run samples` script beside
  `cut-and-upload-audio.js`. More get added as they're made.
- **Drum machines**: the rest comes from the drum machine banks Strudel already loads
  (909, 808, 707 and others: `s("bd*4").bank("RolandTR909")`), plus its synths for bass
  and stabs. The starter patterns put llü's kick in front, so the first sound people hear
  is llü's.
- **The tracks**: a mix. Techno that's out plays in full. Techno that isn't plays a
  30-second preview, following the deck's rule. Each gets an envelope in
  `data/envelopes.js` so the screen can hit with the kicks before Strudel even loads.
- **The hidden track**: one full track that only plays here, never on streaming
  (`play ???`). It's the one exception to the deck's no-full-unreleased rule, on purpose.
  Being online in full means anyone who digs can save it, which is part of the fun.
  It's kept out of `ls`, the prerender and `llms.txt`.
- **Track patterns**: for each track, a short pattern that gets close to its groove with
  llü's one-shots and the drum machines. That's what `remix` loads, and it's what teaches
  people the most. Without stems these are a sketch of the track, not the track.

## How it fits the repo

| Path | What |
| --- | --- |
| `maquina/index.html` | the page. Pages serves it at `/maquina` |
| `maquina/LICENSE` | AGPL-3.0, for everything in `maquina/` |
| `maquina/terminal.css` | CRT look: monospace, scanlines, glow, all off with reduced motion |
| `maquina/js/shell.js` | the prompt, history, tab completion, commands |
| `maquina/js/live.js` | the editor and Strudel, loaded only when `live` or `play` runs |
| `maquina/js/scope.js` | the scope and spectrum, from a Web Audio analyser |
| `maquina/js/strings.js` | the terminal's strings in both languages. It reads the language from `js/i18n.js`, so the switch is shared with the deck |
| `maquina/data/techno.js` | the techno tracks, the samples and the track patterns |

- **Editor**: CodeMirror 6 from a pinned CDN (Strudel's own REPL uses it). On a phone the
  editor gets a row of keys for `~ * [ ] < > ( ) " .` and a big ▶, because a phone
  keyboard hides those.
- **Font**: one mono face. JetBrains Mono or IBM Plex Mono from Google Fonts, which the
  site already loads from.
- **Phones**: typing code on a phone is hard, so phones get a step grid under the editor.
  Tapping a step rewrites the pattern text, so the code and the grid stay the same thing.
  Tilt can drive the filter, reusing `js/motion.js`.
- **Audio unlock**: browsers only start sound after a tap or a key, so the first command
  does it (it already has to be typed).
- **Search**: `/maquina` is left out of `sitemap.xml`, but it stays indexable once
  people link to it. `llms.txt` gets a line about it.
- **Analytics**: `term_open` (with `via`, the way it was found), `term_command`,
  `live_run`, `pattern_share`, `pattern_open`. Together these show which way in actually
  works.

## Getting in: ways to discover it

The terminal should feel found, not linked. A few ways in, from obvious to buried:

**On the deck**
- **Type on the deck.** Anywhere on the home page, typing `llu`, `sudo`, `máquina` or
  just `/` on a keyboard glitches the page into the terminal. Nothing on screen says so.
- **The tenth card.** One draw in fifty, the deck deals a card that isn't in the
  Buena Suerte nine: **La Máquina**, black with a green engraving. Playing it opens the
  terminal. Sharing it shares the way in.
- **El Perdido.** The lost one. Tapping its sealed card face seven times, or holding it
  for three seconds, opens a prompt instead of the preview.
- **The microtext frame.** The `BUENA SUERTE · LLÜ · 7TH ST` line around the page has
  one character that's wrong. Clicking it opens the terminal.
- **Late at night.** Between 3 and 4 a.m. local time, the deck slowly fades to the
  terminal palette and a blinking cursor appears in the corner.

**For the curious**
- **The browser console.** Opening dev tools shows an ASCII llü and `try llu.maquina()`.
  The people who open the console are the people who'll love this.
- **View source.** A comment in the HTML, `<!-- the machine is at /maquina -->`,
  where the prerender writes the head.
- **The 404 page** is a terminal: `bash: /whatever: no such card`, with a prompt that
  works.
- **`llms.txt`** mentions it, so AI assistants send the curious there.
- **The Konami code** on the deck, because people still try it.

**In the music**
- **A picture in the spectrogram.** One techno track hides the terminal's address, or a
  QR code, in its high frequencies, the way Aphex Twin hid his face in a B-side of the *Windowlicker* single.
  Anyone who puts it into a spectrogram finds it. People film themselves finding these.
- **A spoken line.** A pitched-down voice in a breakdown says the command.
- **A hidden track.** One techno track only plays in the terminal (`play ???`), never on
  streaming. That's a reason to come back and a reason to tell people.

**Out in the world**
- **At shows.** A QR code on the visuals during the techno part of a set, and on stickers
  and printed cards. The link carries `?via=show`, so analytics can tell.
- **Shared patterns spread it.** Every `share` link opens the terminal with someone's
  pattern loaded and playing on the first tap. The pattern rides in the address
  (`/maquina#p=<compressed code>`), so nothing is stored and nothing needs moderating.
  Each pattern that gets shared is an invite. A public gallery can come later (see
  Phases).
- **Pattern of the week.** A pattern from a visitor gets played in a set or posted on
  Instagram with its link. People make things to be picked.
- **A remix contest.** Remix a track with its own sounds. The winner's pattern becomes
  the default `live` opens with, credited in `cat`.

## Phases

1. **The room** (about a week). `/maquina`, the shell, `help`, `ls`, `play`, the
   scope, both languages, phone layout, the console and 404 ways in. No coding yet. It
   already shows off the techno.
2. **The machine** (about two weeks). Strudel, the AGPL `LICENSE` and credit, the editor,
   llü's one-shots and their script, the drum machine banks, `examples`, `samples`, and
   share links with the pattern in the address. The phone key row.
3. **The secrets** (about a week). The tenth card, typing on the deck, El Perdido, the
   microtext glitch, the 3 a.m. fade and the hidden track. Analytics on each way in.
4. **The loop** (ongoing). `remix` patterns per track, `record`, the phone step grid,
   the spectrogram picture, pattern of the week. Later, maybe a public gallery of shared
   patterns, which would need a small backend (Supabase) and moderation.

Each phase can ship on its own. Phase 1 is worth having even if the rest never happens.

## Decided

| Question | Answer |
| --- | --- |
| Engine and license | Strudel, from a pinned CDN. The terminal's code is AGPL-3.0 in `maquina/`; the rest of the site stays MIT |
| Address | `/maquina` |
| Name and artist | La Máquina, by llü |
| Shared patterns | Links only, with the pattern in the address. A gallery maybe later |
| Tracks | Released techno in full, unreleased as 30-second previews |
| Sounds | A few of llü's own one-shots (no stems) on top of Strudel's drum machines |
| Hidden track | Yes, one full exclusive that plays only in the terminal |

## Before phase 1

- The list of techno tracks, which are out and which aren't, and their files.
- Which track is the hidden one.
- The one-shots (WAV), for phase 2.
