// Square wave rippling out of the logo, as a single fragment shader.
// Grid geometry matches the DOM version this replaces: dots every 25px, a new
// wave every 500px. The wave travels at a fifth of the original 180px/s, with a
// wider, flatter lit band so the slower ring still reads as a moving border.

const SPACING = 25;
const WAVE_SPEED = 36;
const SPAWN_GAP = 500;
const BAND = SPACING * 2;
// Thickness of the lit band, in rows of dots. Raising this widens the border;
// it also lengthens how long the glow takes to sweep past a point, which is
// what stops a slow wave reading as motion — so it trades against WAVE_SPEED.
const RING_ROWS = 8;
const TRAIL = SPACING * RING_ROWS;

// Falloff across the band. Linear, so every row carries real light — a squared
// curve dumps most brightness into the leading edge and the back rows read as
// unlit however wide the band is.
const FALLOFF = 1.0;
const DOT_RADIUS = 0.08;
const MAX_WAVES = 12;

// Frame held under reduced motion, expressed as how far the wave has travelled
// so it stays the same picture regardless of WAVE_SPEED.
const STATIC_RADIUS = 1350;
const STATIC_TIME = STATIC_RADIUS / WAVE_SPEED;

// The DOM version advanced radius by 3 and rotation by 0.5 on the same tick,
// so a wave's angle is purely a function of how far it has travelled.
const ROT_RAD_PER_PX = (0.5 / 3) * Math.PI / 180;

const UNIFORMS = [
  'time', 'origin', 'spacing', 'band', 'trail',
  'spawnGap', 'maxRadius', 'cycle', 'waveCount', 'speed', 'rotPerPx',
];

const VERT = `
  attribute vec2 position;
  void main() { gl_Position = vec4(position, 0.0, 1.0); }
`;

const FRAG = `
  precision highp float;

  uniform float time;
  uniform vec2 origin;
  uniform float spacing;
  uniform float band;
  uniform float trail;
  uniform float spawnGap;
  uniform float maxRadius;
  uniform float cycle;
  uniform float waveCount;
  uniform float speed;
  uniform float rotPerPx;

  const vec3 GOLD = vec3(0.906, 0.831, 0.580);

  float waveAt(vec2 p, float radius) {
    if (radius > maxRadius) return 0.0;

    float a = radius * rotPerPx;
    float c = cos(a), s = sin(a);
    vec2 rp = vec2(p.x * c - p.y * s, p.x * s + p.y * c);

    float edge = max(abs(rp.x), abs(rp.y)) - radius;
    if (edge > band) return 0.0;

    float age = (band - edge) / trail;
    return pow(max(0.0, 1.0 - age), ${FALLOFF.toFixed(1)});
  }

  void main() {
    vec2 p = gl_FragCoord.xy - origin;

    float lit = 0.0;
    for (int i = 0; i < ${MAX_WAVES}; i++) {
      if (float(i) >= waveCount) break;
      // Negative travel means this wave has not spawned yet. Without the guard
      // mod() wraps it to a large radius and the page opens mid-cycle.
      float travel = time * speed - float(i) * spawnGap;
      if (travel >= 0.0) lit = max(lit, waveAt(p, mod(travel, cycle)));
    }

    // Grid stays screen-aligned while the wave rotates through it.
    vec2 cell = fract(gl_FragCoord.xy / spacing) - 0.5;
    float dist = length(cell) * spacing;
    float radius = ${DOT_RADIUS} * spacing * (1.0 + lit);

    float dotMask = smoothstep(radius, radius - 1.5, dist);
    float halo = smoothstep(radius * 2.5, radius, dist) * pow(lit, 4.0) * 0.04;

    gl_FragColor = vec4(GOLD, clamp((0.06 + lit * 0.74) * dotMask + halo, 0.0, 1.0));
  }
`;

function buildProgram(gl) {
  const shaders = [[gl.VERTEX_SHADER, VERT], [gl.FRAGMENT_SHADER, FRAG]].map(([type, src]) => {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, src);
    gl.compileShader(shader);
    if (gl.getShaderParameter(shader, gl.COMPILE_STATUS)) return shader;
    console.error('[dot-grid]', gl.getShaderInfoLog(shader));
    return null;
  });

  if (shaders.some((s) => !s)) return null;

  const program = gl.createProgram();
  shaders.forEach((s) => gl.attachShader(program, s));
  gl.linkProgram(program);
  if (gl.getProgramParameter(program, gl.LINK_STATUS)) return program;

  console.error('[dot-grid]', gl.getProgramInfoLog(program));
  return null;
}

const canvas = document.createElement('canvas');
canvas.className = 'dot-grid';
canvas.setAttribute('aria-hidden', 'true');
document.body.insertBefore(canvas, document.body.firstChild);

const gl = canvas.getContext('webgl', {
  alpha: true, antialias: false, premultipliedAlpha: false, depth: false, stencil: false,
});
const program = gl && buildProgram(gl);

if (!program) {
  canvas.classList.add('dot-grid--static');
} else {
  gl.useProgram(program);

  gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
  gl.bufferData(gl.ARRAY_BUFFER,
    new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]), gl.STATIC_DRAW);
  const position = gl.getAttribLocation(program, 'position');
  gl.enableVertexAttribArray(position);
  gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);

  gl.enable(gl.BLEND);
  gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

  const u = Object.fromEntries(
    UNIFORMS.map((name) => [name, gl.getUniformLocation(program, name)]));

  const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
  let reduced = motion.matches;
  let dpr = 1;
  let frame = 0;
  let onscreen = true;
  let elapsed = 0;
  let last = 0;

  const running = () => onscreen && !document.hidden && !reduced;

  function setOrigin() {
    const logo = document.querySelector('.logo');
    const box = logo && logo.getBoundingClientRect();
    const cx = box ? box.left + box.width / 2 : window.innerWidth / 2;
    const cy = box ? box.top + box.height / 2 : window.innerHeight / 2;
    gl.uniform2f(u.origin, cx * dpr, (window.innerHeight - cy) * dpr);
  }

  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = Math.max(1, Math.floor(window.innerWidth * dpr));
    const h = Math.max(1, Math.floor(window.innerHeight * dpr));
    canvas.width = w;
    canvas.height = h;
    gl.viewport(0, 0, w, h);

    const maxRadius = Math.hypot(w, h) * 1.2;
    const gap = SPAWN_GAP * dpr;
    const count = Math.min(MAX_WAVES, Math.max(1, Math.ceil(maxRadius / gap)));

    gl.uniform1f(u.spacing, SPACING * dpr);
    gl.uniform1f(u.band, BAND * dpr);
    gl.uniform1f(u.trail, TRAIL * dpr);
    gl.uniform1f(u.spawnGap, gap);
    gl.uniform1f(u.maxRadius, maxRadius);
    gl.uniform1f(u.cycle, count * gap);
    gl.uniform1f(u.waveCount, count);
    gl.uniform1f(u.speed, WAVE_SPEED * dpr);
    gl.uniform1f(u.rotPerPx, ROT_RAD_PER_PX / dpr);

    setOrigin();
    redrawIfPaused();
  }

  function draw(now) {
    // Clamped so a long frame or a resumed tab cannot lurch the wave forward.
    elapsed = reduced ? STATIC_TIME : elapsed + Math.min(last ? now - last : 0, 100) * 0.001;
    last = now;
    gl.uniform1f(u.time, elapsed);
    gl.drawArrays(gl.TRIANGLES, 0, 6);
  }

  function redrawIfPaused() {
    if (!frame) draw(last);
  }

  function loop(now) {
    draw(now);
    frame = running() ? requestAnimationFrame(loop) : 0;
  }

  function play() {
    if (frame) return;
    if (!running()) return redrawIfPaused();
    last = 0;
    frame = requestAnimationFrame(loop);
  }

  function pause() {
    if (!frame) return;
    cancelAnimationFrame(frame);
    frame = 0;
  }

  new IntersectionObserver(([entry]) => {
    onscreen = entry.isIntersecting;
    if (onscreen) play(); else pause();
  }).observe(canvas);

  window.addEventListener('resize', resize);
  window.addEventListener('scroll', () => {
    setOrigin();
    redrawIfPaused();
  }, { passive: true });

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) pause(); else play();
  });

  canvas.addEventListener('webglcontextlost', (e) => {
    e.preventDefault();
    pause();
    canvas.classList.add('dot-grid--static');
  });

  motion.addEventListener('change', (e) => {
    reduced = e.matches;
    if (reduced) pause();
    play();
  });

  resize();
  play();
}
