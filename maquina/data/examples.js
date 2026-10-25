// The patterns `examples` lists and `live <n>` loads, built on Strudel's own drum machines
// and synths until llü's stems are up. Each has a dark bassline, mostly in C with a
// half step down to D flat. The third one is where `live` starts.

export const STARTER = 3;

export const EXAMPLES = [
  {
    name: 'four on the floor',
    code: `// four on the floor · and a bass that rolls under it
setcps(130/60/4)

stack(
  s("bd*4").bank("RolandTR909"),
  // the kick takes the beat; the bass fills the three steps after it
  note("[~ c2 c2 c2]*4").s("sawtooth")
    .lpf(sine.range(300, 700).slow(16)).decay(.09).sustain(0).gain(.6)
)`,
  },
  {
    name: 'rumble',
    code: `// rumble · a kick, its own dark echo, and a sub between them
setcps(128/60/4)

stack(
  s("bd*4").bank("RolandTR909").gain(1.1),
  s("bd*4").bank("RolandTR909")
    .late(1/8).lpf(160).room(.9).roomsize(6).gain(.8),
  s("[~ hh]*4").bank("RolandTR909").gain(.5),
  // a sine on the offbeat, low enough to feel more than hear
  note("[~ <c1 c1 db1 c1>]*4").s("sine").decay(.22).sustain(0).gain(.9),
  note("[~ <c2 c2 db2 c2>]*4").s("sawtooth").lpf(320).decay(.12).sustain(0).gain(.35)
)`,
  },
  {
    name: 'a first groove',
    code: `// a first groove · 132 bpm · Strudel's 909
setcps(132/60/4)

stack(
  s("bd*4").bank("RolandTR909").gain(1.1),
  s("~ hh ~ hh").bank("RolandTR909").hpf(6000),
  s("~ cp").bank("RolandTR909").room(.4),
  // one bar of C, then it drops a half step to D flat: that's the dark part
  note("<[c2 ~ c2 c3 ~ c2 eb2 ~] [db2 ~ db2 db3 ~ db2 c2 ~]>").s("sawtooth")
    .lpf(sine.range(250, 900).slow(8)).lpq(6)
    .decay(.14).sustain(0).gain(.6)
)`,
  },
  {
    name: 'hats and space',
    code: `// hats and space · with a slow bass that breathes
setcps(132/60/4)

stack(
  s("bd*4").bank("RolandTR909"),
  s("[~ hh]*4").bank("RolandTR909").gain(.7),
  s("hh*16").bank("RolandTR808")
    .gain(perlin.range(.15, .45)).pan(sine.slow(4)),
  s("~ oh ~ oh").bank("RolandTR909")
    .delay(.4).delaytime(.17).delayfeedback(.5).gain(.5),
  // two saws a hair apart, so the bass slowly beats against itself
  note("<c2 c2 ab1 bb1>".add("0,.12")).s("sawtooth")
    .lpf(perlin.range(180, 600).slow(4)).attack(.04).release(.3).gain(.35)
)`,
  },
  {
    name: 'acid line',
    code: `// acid line · the filter does the singing
setcps(134/60/4)

stack(
  s("bd*4").bank("RolandTR909"),
  s("[~ hh]*4").bank("RolandTR909").gain(.5),
  note("c2 [c2 c3] db2 [c2 g1] c2 bb1 [c2 c3] ab1")
    .s("sawtooth").lpf(sine.range(300, 2400).slow(8)).lpq(14)
    .shape(.3).decay(.15).sustain(0).gain(.5),
  // and a sub under it, one note a bar
  note("<c1 c1 db1 c1>").s("sine").decay(.4).sustain(.2).gain(.6)
)`,
  },
  {
    name: 'broken',
    code: `// broken · nothing on the one but the kick
setcps(126/60/4)

stack(
  s("bd ~ ~ bd ~ ~ bd ~").bank("RolandTR909"),
  s("~ ~ sd ~ ~ ~ sd ~").bank("RolandTR707").room(.3),
  s("hh(5,8)").bank("RolandTR808").gain(.6),
  s("rim(3,8,2)").bank("RolandTR909").gain(.5),
  // a square wave with some grit, landing where the kick doesn't
  note("~ c2 ~ ~ c2 ~ <db2 eb2> ~").s("square")
    .lpf(500).shape(.4).decay(.16).sustain(0).gain(.4)
)`,
  },
  {
    name: '3 a.m.',
    code: `// 3 a.m.
setcps(124/60/4)

stack(
  s("bd*4").bank("RolandTR909").lpf(900),
  s("[~ hh]*4").bank("RolandTR808").gain(.4),
  note("<[c2 c2 c2 db2] [c2 c2 bb1 c2]>*2").s("sawtooth")
    .lpf(perlin.range(200, 700).slow(4))
    .decay(.2).sustain(.1).room(.5).gain(.5),
  note("<[c4,eb4,g4] [db4,f4,ab4]>").s("triangle")
    .attack(.5).release(2).room(.9).gain(.15).slow(2)
)`,
  },
];

// what `samples` lists
export const DRUMS = ['bd', 'sd', 'hh', 'oh', 'cp', 'rim', 'lt', 'mt', 'ht', 'cr', 'rd'];
export const SYNTHS = ['sine', 'square', 'sawtooth', 'triangle'];
export const MORE = ['casio', 'crow', 'insect', 'wind', 'jazz', 'metal', 'east', 'space', 'numbers'];
