// The patterns `examples` lists and `live <n>` loads, built on Strudel's own drum machines
// and synths until llü's stems are up. The third one is where `live` starts.

export const STARTER = 3;

export const EXAMPLES = [
  {
    name: 'four on the floor',
    code: `// four on the floor · 130 bpm
setcps(130/60/4)

s("bd*4").bank("RolandTR909")`,
  },
  {
    name: 'rumble',
    code: `// rumble · a kick and its own dark echo
setcps(128/60/4)

stack(
  s("bd*4").bank("RolandTR909").gain(1.1),
  s("bd*4").bank("RolandTR909")
    .late(1/8).lpf(160).room(.9).roomsize(6).gain(.8),
  s("[~ hh]*4").bank("RolandTR909").gain(.5)
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
  note("<c1 c1 eb1 g0>").s("sawtooth")
    .lpf(sine.range(200, 900).slow(8))
    .decay(.2)
)`,
  },
  {
    name: 'hats and space',
    code: `// hats and space
setcps(132/60/4)

stack(
  s("bd*4").bank("RolandTR909"),
  s("[~ hh]*4").bank("RolandTR909").gain(.7),
  s("hh*16").bank("RolandTR808")
    .gain(perlin.range(.15, .45)).pan(sine.slow(4)),
  s("~ oh ~ oh").bank("RolandTR909")
    .delay(.4).delaytime(.17).delayfeedback(.5).gain(.5)
)`,
  },
  {
    name: 'acid line',
    code: `// acid line
setcps(134/60/4)

stack(
  s("bd*4").bank("RolandTR909"),
  s("[~ hh]*4").bank("RolandTR909").gain(.5),
  note("c2 [c2 c3] eb2 [c2 g1] c2 bb1 [c2 c3] f2")
    .s("sawtooth").lpf(sine.range(300, 2400).slow(8)).lpq(12)
    .decay(.15).sustain(0).gain(.6)
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
  s("rim(3,8,2)").bank("RolandTR909").gain(.5)
)`,
  },
  {
    name: '3 a.m.',
    code: `// 3 a.m.
setcps(124/60/4)

stack(
  s("bd*4").bank("RolandTR909").lpf(900),
  s("[~ hh]*4").bank("RolandTR808").gain(.4),
  note("<c1 eb1>*2").s("sawtooth")
    .lpf(perlin.range(200, 900).slow(4))
    .decay(.3).sustain(.2).room(.6).gain(.5),
  note("<[c4,eb4,g4] [bb3,d4,f4]>").s("triangle")
    .attack(.5).release(2).room(.9).gain(.15).slow(2)
)`,
  },
];

// what `samples` lists
export const DRUMS = ['bd', 'sd', 'hh', 'oh', 'cp', 'rim', 'lt', 'mt', 'ht', 'cr', 'rd'];
export const SYNTHS = ['sine', 'square', 'sawtooth', 'triangle'];
export const MORE = ['casio', 'crow', 'insect', 'wind', 'jazz', 'metal', 'east', 'space', 'numbers'];
