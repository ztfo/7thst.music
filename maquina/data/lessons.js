// `learn`: eight steps from one kick drum to a whole arranged track. Each step's code is the
// whole pattern so far, so `next` can always replace what's in the editor, and the last
// step arranges the parts the earlier ones named. Text is in both languages; the code is
// the same in either.

const TEMPO = 'setcps(130/60/4)';
const DRUMS = `const drums = stack(
  s("bd*4").bank("RolandTR909"),
  s("[~ hh]*4").bank("RolandTR909"),
  s("~ cp ~ cp").bank("RolandTR909"),
  s("hh(5,8)").bank("RolandTR808").gain(.4)
)`;
const BASS = `const bass = note("<[~ c2 c2 c2]*4 [[~ c2 c2 c2]*3 [~ c2 c2 db2]]>").s("sawtooth")
  .lpf(sine.range(250, 900).slow(8)).lpq(8)
  .decay(.1).sustain(0).gain(.6)`;
const STAB = `const stab = note("<~ [c4,eb4,g4]> ~ ~ ~").s("sawtooth")
  .lpf(1400).decay(.2).sustain(0)
  .delay(.5).delaytime(.23).delayfeedback(.55).room(.5).gain(.25)`;
const FILL = `const fill = s("sd*8").bank("RolandTR909")
  .gain(saw.range(.1, .8)).mask("<0 0 0 1>")`;

export const LESSONS = [
  {
    code: `${TEMPO}

s("bd*4").bank("RolandTR909")`,
    en: {
      title: 'the kick',
      text: 'Every techno track starts here. s() plays a sound: "bd" is a kick drum, and *4 plays it four times a bar. .bank() picks the drum machine, a Roland 909. setcps() sets the tempo, 130 beats a minute. Press play to hear it. Each step replaces the code with the next one.',
      try: 'change *4 to *2 or *8, then press play again: changes land on the next bar.',
    },
    es: {
      title: 'el bombo',
      text: 'Todo track de techno empieza aquí. s() toca un sonido: "bd" es el bombo, y *4 lo toca cuatro veces por compás. .bank() escoge la caja de ritmos, una Roland 909. setcps() pone el tempo, 130 golpes por minuto. Dale play para oírlo. Cada paso reemplaza el código con el siguiente.',
      try: 'cambia *4 por *2 o *8 y dale play otra vez: los cambios entran en el siguiente compás.',
    },
  },
  {
    code: `${TEMPO}

stack(
  s("bd*4").bank("RolandTR909"),
  s("[~ hh]*4").bank("RolandTR909")
)`,
    en: {
      title: 'space and hats',
      text: 'stack() plays parts at the same time. ~ is a rest, and [ ] squeezes everything inside it into one step: [~ hh] is a rest and then a hat, so the hat lands between the kicks, on the offbeat. That push and pull is the heart of techno.',
      try: 'make the hats busier with "[~ hh hh]*4", or open them up with "oh" instead of "hh".',
    },
    es: {
      title: 'espacio y hats',
      text: 'stack() toca partes al mismo tiempo. ~ es un silencio, y [ ] mete todo lo de adentro en un solo paso: [~ hh] es un silencio y luego un hat, así que el hat cae entre los bombos, a contratiempo. Ese jaloneo es el corazón del techno.',
      try: 'hazlos más movidos con "[~ hh hh]*4", o ábrelos con "oh" en vez de "hh".',
    },
  },
  {
    code: `${TEMPO}

${DRUMS}

drums`,
    en: {
      title: 'the full beat',
      text: 'A clap on two and four ("~ cp ~ cp"), and an 808 hat in (5,8): five hits spread as evenly as they fit over eight steps, which gives a rolling, not-quite-straight feel. .gain() turns a part down. const drums gives the beat a name, so later steps can use it.',
      try: 'try (3,8) or (7,16) for the 808 hat, or swap the clap for "rim".',
    },
    es: {
      title: 'el beat completo',
      text: 'Unas palmas en el dos y el cuatro ("~ cp ~ cp"), y un hat de 808 en (5,8): cinco golpes repartidos lo más parejo posible en ocho pasos, que dan un groove rodado, no tan derecho. .gain() le baja a una parte. const drums le pone nombre al beat, para usarlo en los siguientes pasos.',
      try: 'prueba (3,8) o (7,16) en el hat de 808, o cambia las palmas por "rim".',
    },
  },
  {
    code: `${TEMPO}

${DRUMS}

const bass = note("[~ c2 c2 c2]*4").s("sawtooth")
  .lpf(400).decay(.1).sustain(0).gain(.6)

stack(drums, bass)`,
    en: {
      title: 'a bassline',
      text: 'note() plays pitches instead of samples: c2 is a low C. .s("sawtooth") makes it a buzzy synth, and .lpf(400) cuts its highs off above 400 Hz, which is what makes it dark and round. .decay(.1) with .sustain(0) keeps each note short. "[~ c2 c2 c2]*4" leaves the first step to the kick and rolls the rest.',
      try: 'lower .lpf to 200 for darker, raise it to 1200 for brighter, or try "square" instead of "sawtooth".',
    },
    es: {
      title: 'un bajo',
      text: 'note() toca notas en vez de samples: c2 es un Do grave. .s("sawtooth") lo vuelve un sinte zumbón, y .lpf(400) le corta los agudos arriba de 400 Hz, que es lo que lo hace oscuro y redondo. .decay(.1) con .sustain(0) deja cada nota cortita. "[~ c2 c2 c2]*4" le deja el primer paso al bombo y rueda el resto.',
      try: 'baja .lpf a 200 para más oscuro, súbelo a 1200 para más brillante, o prueba "square" en vez de "sawtooth".',
    },
  },
  {
    code: `${TEMPO}

${DRUMS}

${BASS}

stack(drums, bass)`,
    en: {
      title: 'make it move',
      text: '< > takes turns, one each bar: the first bar rolls on C, and the second ends on D flat (db2), half a step above C, which is what makes it sound dark. sine.range(250, 900).slow(8) is a value that sweeps up and down over eight bars, so the filter slowly opens and closes. .lpq(8) makes the filter ring as it moves.',
      try: 'try .slow(2) for a faster sweep, .lpq(14) for an acid squeal, or eb2 instead of db2.',
    },
    es: {
      title: 'que se mueva',
      text: '< > se turna, uno por compás: el primer compás rueda en Do, y el segundo termina en Re bemol (db2), medio tono arriba de Do, que es lo que le da lo oscuro. sine.range(250, 900).slow(8) es un valor que sube y baja en ocho compases, así que el filtro se abre y se cierra despacito. .lpq(8) hace que el filtro resuene al moverse.',
      try: 'prueba .slow(2) para que barra más rápido, .lpq(14) para un chillido acid, o eb2 en vez de db2.',
    },
  },
  {
    code: `${TEMPO}

${DRUMS}

${BASS}

${STAB}

stack(drums, bass, stab)`,
    en: {
      title: 'a stab, and space',
      text: 'Commas play notes together: [c4,eb4,g4] is a C minor chord, the dark one. "<~ [c4,eb4,g4]> ~ ~ ~" plays it on the first beat of every other bar. .delay() repeats it in echoes, .delaytime() sets how far apart, and .delayfeedback() how long they ring. .room() puts it in a big space.',
      try: 'try [c4,eb4,ab4] for a darker chord, or raise .delayfeedback to .7 for longer echoes (keep it under 1).',
    },
    es: {
      title: 'un stab, y espacio',
      text: 'Las comas tocan notas juntas: [c4,eb4,g4] es un acorde de Do menor, el oscuro. "<~ [c4,eb4,g4]> ~ ~ ~" lo toca en el primer tiempo cada dos compases. .delay() lo repite en ecos, .delaytime() pone qué tan separados, y .delayfeedback() cuánto duran. .room() lo mete en un cuarto grande.',
      try: 'prueba [c4,eb4,ab4] para un acorde más oscuro, o sube .delayfeedback a .7 para ecos más largos (abajo de 1).',
    },
  },
  {
    code: `${TEMPO}

${DRUMS}

${BASS}

${STAB}

${FILL}

stack(drums.every(4, x => x.fast(2)), bass, stab, fill)`,
    en: {
      title: 'variation and fills',
      text: 'A track needs things to happen. drums.every(4, x => x.fast(2)) doubles the beat every fourth bar. The fill is a snare roll that gets louder (saw.range(.1, .8) climbs across the bar), and .mask("<0 0 0 1>") only lets it through on bar four, so it leads into the next phrase.',
      try: 'try .every(8, ...) for a rarer change, or x => x.slow(2) to halve it instead.',
    },
    es: {
      title: 'variación y redobles',
      text: 'A un track le tienen que pasar cosas. drums.every(4, x => x.fast(2)) dobla el beat cada cuarto compás. El fill es un redoble de tarola que va subiendo (saw.range(.1, .8) crece a lo largo del compás), y .mask("<0 0 0 1>") solo lo deja pasar en el compás cuatro, para que entre a la siguiente frase.',
      try: 'prueba .every(8, ...) para un cambio más raro, o x => x.slow(2) para ponerlo a la mitad.',
    },
  },
  {
    code: `${TEMPO}

${DRUMS}

${BASS}

${STAB}

${FILL}

arrange(
  [4, drums],
  [8, stack(drums, bass)],
  [8, stack(drums, bass, stab)],
  [4, stack(bass, stab)],
  [8, stack(drums.every(4, x => x.fast(2)), bass, stab, fill)],
  [4, stack(drums, stab)]
)`,
    en: {
      title: 'arrange the track',
      text: 'arrange() plays each part for a number of bars, in order, then starts over: 4 bars of beat, the bass comes in, then the stab, a break with no kick at bar 21, the full drop with fills, and the outro. 36 bars is about a minute at 130. That’s a track. record 30 saves it as a WAV, and share gives you a link.',
      try: 'make the break longer, add a second drop, change the tempo, or save it with save my-track.',
    },
    es: {
      title: 'arma el track',
      text: 'arrange() toca cada parte por un número de compases, en orden, y vuelve a empezar: 4 compases de beat, entra el bajo, luego el stab, un break sin bombo en el compás 21, el drop completo con redobles, y la salida. 36 compases son como un minuto a 130. Eso es un track. record 30 lo guarda en WAV, y share te da una liga.',
      try: 'alarga el break, agrega otro drop, cambia el tempo, o guárdalo con save mi-track.',
    },
  },
];

// what `cheat` prints: the notation on one screen
export const CHEAT = {
  en: [
    ['"bd*4"', 'four times in one step'],
    ['"~"', 'a rest'],
    ['"[a b]"', 'both squeezed into one step'],
    ['"<a b>"', 'one each bar, taking turns'],
    ['"[c4,eb4]"', 'at the same time (a chord)'],
    ['"hh(5,8)"', 'five hits spread over eight steps'],
    ['stack(a, b)', 'play parts together'],
    ['s("bd")', 'a sound; .bank("RolandTR909") picks the machine'],
    ['note("c2")', 'a pitch; .s("sawtooth") picks the synth'],
    ['.lpf(400)', 'darker (cuts the highs); .lpq(8) makes it ring'],
    ['.gain(.5)', 'quieter'],
    ['.room(.5)', 'space; .delay(.4) echoes'],
    ['.shape(.4)', 'grit; .distort(2) more'],
    ['.slow(2)', 'half as fast; .fast(2) twice as fast'],
    ['sine.range(a, b)', 'a value that sweeps between a and b'],
    ['.every(4, x => …)', 'change every fourth bar'],
    ['.mask("<0 1>")', 'only let it through on some bars'],
    ['arrange([4, a], [8, b])', 'a song: so many bars of each'],
    ['dark notes', 'c db eb f g ab bb'],
  ],
  es: [
    ['"bd*4"', 'cuatro veces en un paso'],
    ['"~"', 'un silencio'],
    ['"[a b]"', 'los dos metidos en un paso'],
    ['"<a b>"', 'uno por compás, turnándose'],
    ['"[c4,eb4]"', 'al mismo tiempo (un acorde)'],
    ['"hh(5,8)"', 'cinco golpes repartidos en ocho pasos'],
    ['stack(a, b)', 'tocar partes juntas'],
    ['s("bd")', 'un sonido; .bank("RolandTR909") escoge la máquina'],
    ['note("c2")', 'una nota; .s("sawtooth") escoge el sinte'],
    ['.lpf(400)', 'más oscuro (corta agudos); .lpq(8) lo hace resonar'],
    ['.gain(.5)', 'más bajito'],
    ['.room(.5)', 'espacio; .delay(.4) ecos'],
    ['.shape(.4)', 'mugre; .distort(2) más'],
    ['.slow(2)', 'a la mitad; .fast(2) al doble'],
    ['sine.range(a, b)', 'un valor que barre entre a y b'],
    ['.every(4, x => …)', 'cambia cada cuarto compás'],
    ['.mask("<0 1>")', 'solo lo deja pasar en algunos compases'],
    ['arrange([4, a], [8, b])', 'una canción: tantos compases de cada parte'],
    ['notas oscuras', 'c db eb f g ab bb'],
  ],
};
