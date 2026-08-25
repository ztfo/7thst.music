// Square wave rippling out of the logo, as a single fragment shader.
// Dots sit every 25px. Waves spawn on a fixed travel gap and then accelerate,
// so several rings crowd the hero while the leading ones tear past the viewport
// edge and on down the page.

const SPACING = 25;
const WAVE_SPEED = 36;
const SPAWN_GAP = 520;
const BAND = SPACING * 2;

// How far behind the front a dot keeps its full brightness, in rows of dots.
// This is what makes the wave read as the square filling the page in rather
// than as a border sweeping past: the front lights a dot and moves on, and the
// dot holds that light for HOLD_ROWS more rows of travel before it starts to go.
const HOLD_ROWS = 3;
const HOLD = SPACING * HOLD_ROWS;

// ...and how many rows it then takes to go dark, so the oldest dots — the ones
// nearest the logo — are fading out while the front is still expanding.
const FADE_ROWS = 8;
const FADE = SPACING * FADE_ROWS;

// Soft ramp at the very front so dots ease on rather than popping.
const LEAD = SPACING * 1.5;

// Rings accelerate as they travel: screen radius grows as u + u²/ACCEL_LENGTH
// against travel u, so a ring has doubled its speed once it is ACCEL_LENGTH/2
// from the logo. This is what spreads the wave down a scrolled page — without
// it every ring crawls at WAVE_SPEED and never clears the hero.
const ACCEL_LENGTH = 900;

// Distant rings hold and fade over proportionally longer distances, so a wave
// that has reached the footer still covers ground instead of thinning to a
// line. One extra hold-and-fade per SPREAD_LENGTH of radius.
const SPREAD_LENGTH = 4000;

// Brightness of the unlit grid. High enough that the whole page keeps its dot
// texture while the wave is somewhere above a scrolled viewport.
const BASE_ALPHA = 0.13;

// Brightness a dot gains at full activation, on top of BASE_ALPHA.
const LIT_ALPHA = 0.52;

// Dots keep one size whether lit or not — activation reads as brightness
// alone, so a passing wave does not make the grid appear to breathe.
const DOT_RADIUS = 0.08;

// A cursor lights the dots under it, short of what the wave does. Skipped
// entirely on touch, where there is no hover and the highlight would stick
// wherever the last tap landed.
const HOVER_RADIUS = 130;
const HOVER_STRENGTH = 0.5;

const MAX_WAVES = 16;

// Inverse of radius(travel) = travel + travel² / accel, used to size the wave
// count and to hold a fixed radius under reduced motion.
const travelFor = (radius, accel) =>
  accel * 0.5 * (Math.sqrt(1 + 4 * radius / accel) - 1);

// Frame held under reduced motion, expressed as how far the wave has travelled
// so it stays the same picture regardless of WAVE_SPEED.
const STATIC_RADIUS = 1350;
const STATIC_TIME = travelFor(STATIC_RADIUS, ACCEL_LENGTH) / WAVE_SPEED;

// The DOM version advanced radius by 3 and rotation by 0.5 on the same tick,
// so a wave's angle is purely a function of how far it has travelled. Angle
// tracks travel rather than radius, so acceleration does not spin the outer
// rings into a blur.
const ROT_RAD_PER_PX = (0.5 / 3) * Math.PI / 180;

const UNIFORMS = [
  'time', 'origin', 'spacing', 'band', 'hold', 'fade', 'lead', 'accel', 'spread',
  'spawnGap', 'maxRadius', 'cycle', 'waveCount', 'speed', 'rotPerPx',
  'pointer', 'hoverRadius', 'hoverStrength',
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
  uniform float hold;
  uniform float fade;
  uniform float lead;
  uniform float accel;
  uniform float spread;
  uniform float spawnGap;
  uniform float maxRadius;
  uniform float cycle;
  uniform float waveCount;
  uniform float speed;
  uniform float rotPerPx;
  uniform vec2 pointer;
  uniform float hoverRadius;
  uniform float hoverStrength;

  const vec3 GOLD = vec3(0.906, 0.831, 0.580);

  float waveAt(vec2 p, float travel) {
    float radius = travel + travel * travel / accel;
    if (radius > maxRadius) return 0.0;

    float a = travel * rotPerPx;
    float c = cos(a), s = sin(a);
    vec2 rp = vec2(p.x * c - p.y * s, p.x * s + p.y * c);

    // How far this dot sits behind the front. Negative is still ahead of it.
    float behind = radius + band - max(abs(rp.x), abs(rp.y));
    if (behind < 0.0) return 0.0;

    float scale = 1.0 + radius / spread;
    float litFor = hold * scale;
    float fadeOver = fade * scale;
    if (behind > litFor + fadeOver) return 0.0;

    return smoothstep(0.0, lead, behind) *
           (1.0 - smoothstep(litFor, litFor + fadeOver, behind));
  }

  void main() {
    // Sample the wave at the dot's centre, not at the fragment. Per-fragment
    // sampling lets the wavefront cut through a single dot, lighting one half
    // at the larger radius and leaving the other at the smaller — the sliver
    // between the two discs is what showed up as crescents along the front.
    // Grid stays screen-aligned while the wave rotates through it.
    vec2 dotPos = (floor(gl_FragCoord.xy / spacing) + 0.5) * spacing;
    vec2 p = dotPos - origin;

    float lit = 0.0;
    for (int i = 0; i < ${MAX_WAVES}; i++) {
      if (float(i) >= waveCount) break;
      // Negative travel means this wave has not spawned yet. Without the guard
      // mod() wraps it to a large radius and the page opens mid-cycle.
      float travel = time * speed - float(i) * spawnGap;
      if (travel >= 0.0) lit = max(lit, waveAt(p, mod(travel, cycle)));
    }

    lit = max(lit, hoverStrength *
      (1.0 - smoothstep(0.0, hoverRadius, distance(dotPos, pointer))));

    float dist = length(gl_FragCoord.xy - dotPos);
    float radius = ${DOT_RADIUS} * spacing;

    float dotMask = smoothstep(radius, radius - 1.5, dist);
    float halo = smoothstep(radius * 2.5, radius, dist) * pow(lit, 4.0) * 0.04;

    gl_FragColor = vec4(GOLD,
      clamp((${BASE_ALPHA.toFixed(2)} + lit * ${LIT_ALPHA.toFixed(2)}) * dotMask
            + halo, 0.0, 1.0));
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

// premultipliedAlpha must be true: the SRC_ALPHA/ONE_MINUS_SRC_ALPHA blend
// below writes GOLD*a into a transparent buffer, which is premultiplied
// already. Declaring it false makes the compositor scale by alpha a second
// time, squaring it — which sank the unlit grid to 4/255 and read as black.
const gl = canvas.getContext('webgl', {
  alpha: true, antialias: false, premultipliedAlpha: true, depth: false, stencil: false,
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

    // The canvas is viewport-fixed but the origin tracks the logo, so once the
    // page is scrolled the wave has to reach from above the fold to the footer.
    // Sizing this off the viewport alone is what left the lower page unlit.
    const docHeight = Math.max(document.documentElement.scrollHeight, window.innerHeight);
    const maxRadius = Math.hypot(window.innerWidth, docHeight) * dpr * 1.1;

    const accel = ACCEL_LENGTH * dpr;
    const gap = SPAWN_GAP * dpr;
    const count = Math.min(MAX_WAVES,
      Math.max(1, Math.ceil(travelFor(maxRadius, accel) / gap)));

    gl.uniform1f(u.spacing, SPACING * dpr);
    gl.uniform1f(u.band, BAND * dpr);
    gl.uniform1f(u.hold, HOLD * dpr);
    gl.uniform1f(u.fade, FADE * dpr);
    gl.uniform1f(u.lead, LEAD * dpr);
    gl.uniform1f(u.accel, accel);
    gl.uniform1f(u.spread, SPREAD_LENGTH * dpr);
    gl.uniform1f(u.spawnGap, gap);
    gl.uniform1f(u.maxRadius, maxRadius);
    gl.uniform1f(u.cycle, count * gap);
    gl.uniform1f(u.waveCount, count);
    gl.uniform1f(u.speed, WAVE_SPEED * dpr);
    gl.uniform1f(u.rotPerPx, ROT_RAD_PER_PX / dpr);
    gl.uniform1f(u.hoverRadius, HOVER_RADIUS * dpr);

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

  // Parked far enough out that no dot is within HOVER_RADIUS of it, which is
  // also where the cursor goes when it leaves the window.
  const parkPointer = () => gl.uniform2f(u.pointer, -1e6, -1e6);

  if (window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
    gl.uniform1f(u.hoverStrength, HOVER_STRENGTH);
    window.addEventListener('pointermove', (e) => {
      gl.uniform2f(u.pointer, e.clientX * dpr, (window.innerHeight - e.clientY) * dpr);
      redrawIfPaused();
    }, { passive: true });
    document.documentElement.addEventListener('pointerleave', () => {
      parkPointer();
      redrawIfPaused();
    });
  } else {
    gl.uniform1f(u.hoverStrength, 0.0);
  }
  parkPointer();

  new IntersectionObserver(([entry]) => {
    onscreen = entry.isIntersecting;
    if (onscreen) play(); else pause();
  }).observe(canvas);

  window.addEventListener('resize', resize);
  // The embedded players settle after first paint, so the document is taller
  // than it was when resize() first measured it for maxRadius.
  window.addEventListener('load', resize);
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
