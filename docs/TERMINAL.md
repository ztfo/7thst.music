# La Máquina: the terminal side of 7thSt.music

The plan for La Máquina. Everything that doesn't need llü's music is built (see Phases). The lotería deck is the front door; this is the back room. A
black terminal where llü's dark techno lives, and where a visitor can write their own
techno in a few lines of code and hear it right away.

**La Máquina** is a tenth card that isn't in the deck. The techno is llü's too, under the
same name, so the deck and the machine point at each other. It lives at
**7thst.music/maquina** and opens as `llü@7thst:~$`.

## What it is

Three things in one screen:

1. **A listening room for the dark techno.** `ls` lists the tracks, `play <name>` plays
   one, and a pane draws the sound: a scope and a spectrum in the terminal's colours,
   pulsing with the kicks the way the room breathes on the deck. Until the tracks are
   done, `ls` lists them as coming soon.
2. **A place to code techno.** `live` opens an editor beside the prompt. The visitor
   types a pattern, presses Ctrl+Enter (or a big ▶ on a phone), and it loops in time.
   Changes land on the next bar, so it never stops while you edit. That's how live coding
   works in TidalCycles, Strudel and Sonic Pi.
3. **llü's own sounds as the instrument.** Sounds cut from llü's stems, so what people
   make sounds like llü. Until the stems are up, it plays Strudel's default sounds.

It breaks the deck's layout on purpose: no cards, no gold, monospace on black. It shares
only the domain, the language switch and the follow links.

## The look

Close to [Hyper](https://hyper.is): a modern terminal, not a retro CRT. Clean, dark and
quiet, with the music as the only thing that moves much.

- **Full screen, everywhere.** No window floating on a backdrop and no window dots: on a
  laptop and on a phone alike, the terminal is the whole page, as if you'd peeked behind
  the deck into the machine itself.
- **Tabs in the title bar.** Thin tabs sit where the title would be: `~` for the shell,
  `live` for the editor, `scope` for the sound. The active tab is a shade lighter, and
  the others are dim text.
- **Split panes.** `live` splits the window: the editor on the left, the shell and scope
  on the right, divided by a 1px line. On a phone the panes stack, and the tabs switch
  between them.
- **Colour.** Near-black ground (`#0b0b0e`), soft white text, a muted palette for
  names, numbers and errors, and one accent in blue (`#5b9cff`): the block cursor, the
  prompt, the sounds playing in the code, the kick in the scope and the play button.
  Selection is the same blue, faint. `theme` switches between blues (and maybe more).
- **Type.** The system's own monospace (`ui-monospace, SFMono-Regular, Menlo, Consolas,
  monospace`), so it looks native on each machine and loads nothing. 13 to 14px, with
  generous line height.
- **Motion.** No scanlines, no glow, no flicker. The cursor blinks; the scope and the
  line under the tabs pulse lightly with the kick. All of it stops with reduced motion.

It borrows Hyper's feel, never its name or logo.

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
  s("bd*4").bank("RolandTR909").gain(1.1),
  s("~ hh ~ hh").bank("RolandTR909").hpf(6000),
  s("~ cp").bank("RolandTR909").room(.4),
  note("<c1 c1 eb1 g0>").s("sawtooth").lpf(400).decay(.2)
)
```

Mini-notation reads like a step sequencer: `*4` is four on the floor, `~` is a rest,
`<a b>` takes one each bar. This uses Strudel's default 909. Once llü's stems are up,
the starter patterns swap to `s("llu_kick*4")` and the rest.

**The license.** Strudel is AGPL-3.0, and this repo is MIT. Strudel loads unchanged from
a pinned copy served from this site, and everything the terminal adds lives in `maquina/`, which has its
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
| `ls` | | the techno tracks, with BPM and length, or "coming soon" until they're out |
| `play <track>` / `stop` | `dale` / `para` | listen, with the scope |
| `cat <track>` | | its notes: when it was made, the gear, a line from llü |
| `live` | `máquina` | opens the editor with a starter pattern |
| `examples` | `ejemplos` | patterns to load: a kick, a full groove, one per track |
| `remix <track>` | | loads a pattern built from that track's own sounds |
| `samples` | `sonidos` | every sound you can use, and a click to hear each |
| `theme` | `tema` | switches the colour palette |
| `share` | `comparte` | a link with your pattern in it |
| `save` / `load` | | patterns kept in this browser |
| `record` | `graba` | records 30 seconds to a WAV you can download |
| `deck` / `exit` | `baraja` | back to the cards |
| `follow` | `sigue` | the follow links |

## The sounds

- **For now, the defaults.** Strudel's own sounds: its drum machine banks (909, 808, 707
  and others, as `s("bd*4").bank("RolandTR909")`), its sample library, and its synths
  for bass and stabs. Nothing to upload, so the machine can go up before the music.
- **Then llü's stems.** llü will hand over a folder of stems. A `pnpm run samples`
  script beside `cut-and-upload-audio.js` uploads them to Cloudinary under `maquina/`,
  like the audio now, and writes a sound map for Strudel (`llu_kick`, `llu_hat`,
  `llu_rumble`, and so on). The starter patterns and `examples` then switch to them.
  Stems are short pieces of a track, never a full unreleased song.
- **The tracks: coming soon.** llü is still working on them, so for now `ls` lists them
  as coming soon (or nothing yet). When they're ready: techno that's out plays in full,
  and techno that isn't plays a 30-second preview, following the deck's rule. Each gets
  an envelope in `data/envelopes.js` so the scope can hit with the kicks.
- **The hidden track**: one full track that only plays here, never on streaming
  (`play ???`). It's the one exception to the deck's no-full-unreleased rule, on purpose.
  Being online in full means anyone who digs can save it, which is part of the fun.
  It's kept out of `ls`, the prerender and `llms.txt`.
- **Track patterns**: with the stems up, each track gets a short pattern built from its
  own stems. That's what `remix` loads, and it's what teaches people the most.

## How it fits the repo

| Path | What |
| --- | --- |
| `maquina/index.html` | the page. Pages serves it at `/maquina` |
| `maquina/LICENSE` | AGPL-3.0, for everything in `maquina/` |
| `maquina/terminal.css` | the full-screen terminal, tabs, panes and palettes |
| `maquina/js/shell.js` | the prompt, history, tab completion, commands, and the wiring |
| `maquina/js/editor.js` | the editor |
| `maquina/js/scope.js` | the scope and spectrum, from the engine's analyser |
| `maquina/js/bridge.js` | the page's side of the engine: messages, the unlock button, the watchdog |
| `maquina/js/themes.js` | the palettes `theme` switches between |
| `maquina/sandbox.html`, `maquina/js/engine.js` | the sandboxed frame that runs pattern code and makes the sound |
| `maquina/vendor/strudel-1.3.0/` | a pinned copy of Strudel, served from this site |
| `maquina/js/strings.js` | the terminal's strings in both languages. It reads the language from `js/i18n.js`, so the switch is shared with the deck |
| `maquina/data/examples.js` | the example patterns and the sounds `samples` lists; the tracks join it later |

- **Editor**: a plain textarea over a highlighted copy of its own text. It's light, needs
  no build, and keeps the phone's own keyboard and selection working. CodeMirror (what
  Strudel's REPL uses) can replace it if it ever needs more. On a phone the editor gets a
  row of keys for `~ * [ ] < > ( ) " . ,` and a big ▶, because a phone keyboard hides those.
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
  Buena Suerte nine: **La Máquina**, black with a blue cursor engraved on it. Playing it opens the
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
  the default `live` opens with, credited in `cat`. This one waits for the stems.

## Security and safety

The site has no accounts, no payments and no server, so there isn't much to steal. The one
real risk is built into live coding: **a Strudel pattern is JavaScript, and a share link
carries someone else's pattern.** Everything else is small. In order of how much it matters:

**1. Shared links run a stranger's code.** If `/maquina#p=...` ran its pattern straight in
the page, anyone could send a link that runs any script on 7thst.music: put up a fake
"llü" message or a scam, send the visitor somewhere else, run a crypto miner, or read
and change what the site keeps in the browser (the language, sentir, saved patterns).
That's cross-site scripting, handed out by design. How we stop it:
- **Patterns run in a sandbox.** All pattern code, the visitor's own and shared, runs in
  an `<iframe sandbox="allow-scripts">` without `allow-same-origin`. It gets a blank
  origin of its own: it can make sound, but it can't touch the terminal, the deck, the
  site's storage or its cookies, and it can't navigate the window. The terminal sends it
  code and gets back sound levels for the scope through `postMessage`, nothing else.
  The frame gets `allow="autoplay"`. In Chrome, the visitor's tap or key on the page is
  enough to start sound in it (tested). Where a browser won't allow that (likely
  Safari), the engine says so and the page lays the frame over the play button, so the
  next tap lands on the engine's own "turn on sound" button. That works anywhere, once
  per visit (tested by forcing it in Chrome). It still needs checking on a real iPhone.
- **Nothing runs until you press play.** A shared link opens with the code showing, under
  a line saying it's someone else's pattern. Strudel's own site works the same way.
- **The shell never evaluates.** `help`, `ls`, `play` and the rest are a fixed list of
  commands. What's typed at the prompt is matched against that list, never run. The
  same goes for the 404 page's prompt.
- **A Content Security Policy** in a `<meta>` tag on `/maquina` (Pages can't send
  headers, but the meta tag covers this) lets scripts load only from this site and the
  pinned Strudel source, and sounds only from Cloudinary and Strudel's sample hosts.

**2. Volume and hearing.** A pattern can be painfully loud or shrill (`.gain(50)`, a
piercing sine), and a share link could be made to hurt someone in headphones. How we stop
it:
- a limiter on the master output, so nothing goes past a safe ceiling whatever the code
  says;
- the first play starts at a moderate volume, with a volume control in the title bar;
- `Esc`, a `hush` command and a stop button always silence everything at once.

**3. Flashing.** Anything that flashes more than three times a second can trigger
seizures. The scope and the border pulse softly and never flash the whole screen. With
reduced motion they stop. Pattern code can't draw visuals, since the sandbox only makes
sound.

**4. Where Strudel comes from.** Loading a script from a CDN means trusting that CDN. A
copy of one exact Strudel version is kept in `maquina/vendor/` and served from this site,
so nothing outside can change it. Upgrading means copying a newer version in on purpose.

**5. Freezing a phone.** An endless loop or a huge pattern can hang the tab and drain the
battery. The sandbox doesn't contain that on its own: most browsers run the frame in the
page's own process, so an endless loop hangs the whole tab (tested). So the engine
refuses `for`, `while` and `do` loops outright, which patterns never need. Where a
browser does run the frame in its own process, a watchdog reloads the frame if it stops
answering. Very heavy code can still slow a tab for a while; closing it always ends it.

**6. What's given away.** Anything on Cloudinary can be downloaded by anyone, so:
- the hidden track is effectively released the day it goes up, since anyone can save it
  and post it;
- the stems can be saved and used too, so only upload stems you're happy to give away;
- `help` says what people may do with what they make (for example, share it with credit,
  not sell it).

**7. Bandwidth.** If a link goes viral, the samples are fetched over and over from
Cloudinary. Turn on Cloudinary's usage alerts, and keep samples short and compressed.

**8. Privacy.** Analytics never sends pattern code or anything typed at the prompt, since
people type all sorts of things. Only the command's name goes, like `term_command:
play`. Listening for keys on the deck ignores anything typed into a field, and keeps
only the last few letters, to spot a secret word.

**Later, the gallery** brings in a server and what other people post, so spam,
moderation and access rules (Supabase row-level security) get their own plan when we get
there.

## Phases

The machine can go up before the music, so it comes first.

1. **The machine** (built). `/maquina` in the Hyper-style window, the shell
   (`help`, `ls` with tracks as coming soon, `follow`, `deck`, `theme`), both languages,
   the phone layout. Strudel with its default sounds, the AGPL `LICENSE` and credit, the
   editor in a split pane, `examples`, `samples`, the scope on the live pattern, and
   share links with the pattern in the address. The phone key row.
2. **The secrets** (built). The tenth card, typing on the deck, El Perdido, the
   microtext glitch, the 3 a.m. fade, the console, view source and the 404. Analytics on
   each way in.
3. **llü's sounds** (when the stems are ready). The `samples` script, the stems on
   Cloudinary, the starter patterns switched to them, `remix` per track.
4. **The music** (when the tracks are ready). `ls` and `play` with the real tracks and
   their envelopes, `cat` notes, the hidden track, the spectrogram picture.
5. **The loop** (ongoing). Built: `record`, `save` / `load` / `rm`, and the step grid (on
   every screen, not just phones). Still to run, not build: pattern of the week, the remix
   contest. Later, maybe a public gallery of shared patterns, which would need a small
   backend (Supabase) and moderation.

Each phase can ship on its own. Phase 1 is worth having even if the rest never happens.

## Decided

| Question | Answer |
| --- | --- |
| Engine and license | Strudel, a pinned copy served from this site. The terminal's code is AGPL-3.0 in `maquina/`; the rest of the site stays MIT |
| Address | `/maquina` |
| Name and artist | La Máquina, by llü |
| Look | Close to Hyper: a clean, modern terminal, full screen on every device, with tabs, split panes and a blue accent. Not a retro CRT |
| Shared patterns | Links only, with the pattern in the address. A gallery maybe later |
| Tracks | Coming soon. When ready: released techno in full, unreleased as 30-second previews |
| Sounds | Strudel's defaults for now; llü's stems on Cloudinary once the machine is up |
| Hidden track | Yes, one full exclusive that plays only in the terminal |

## Waiting on

- Nothing for phase 1.
- llü's folder of stems, for phase 3.
- The finished tracks, which are out and which aren't, and which one is hidden, for
  phase 4.
