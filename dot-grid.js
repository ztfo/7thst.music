// Square wave rippling out of the logo, as a single fragment shader.
// Constants match the DOM version it replaces: dots every 25px, wave travels
// 180px/s, a new wave every 500px, each dot lit for 2s as the wave passes.

(function () {
  'use strict';

  var SPACING = 25;
  var WAVE_SPEED = 180;
  var SPAWN_GAP = 500;
  var BAND = SPACING * 2;
  var TRAIL = WAVE_SPEED * 2;
  var DOT_RADIUS = 0.08;
  var MAX_WAVES = 12;

  // The DOM version advanced radius by 3 and rotation by 0.5 on the same tick,
  // so a wave's angle is purely a function of how far it has travelled.
  var ROT_RAD_PER_PX = (0.5 / 3) * Math.PI / 180;

  var STATIC_TIME = 7.5;

  var VERT = [
    'attribute vec2 position;',
    'void main() { gl_Position = vec4(position, 0.0, 1.0); }'
  ].join('\n');

  var FRAG = [
    'precision highp float;',

    'uniform float time;',
    'uniform vec2  origin;',
    'uniform float spacing;',
    'uniform float band;',
    'uniform float trail;',
    'uniform float spawnGap;',
    'uniform float maxRadius;',
    'uniform float cycle;',
    'uniform float waveCount;',
    'uniform float speed;',
    'uniform float rotPerPx;',

    'const vec3 GOLD = vec3(0.906, 0.831, 0.580);',

    'float waveAt(vec2 p, float radius) {',
    '  if (radius > maxRadius) return 0.0;',
    '  float a = radius * rotPerPx;',
    '  float c = cos(a), s = sin(a);',
    '  vec2 rp = vec2(p.x * c - p.y * s, p.x * s + p.y * c);',
    '  float edge = max(abs(rp.x), abs(rp.y)) - radius;',
    '  if (edge > band) return 0.0;',
    '  float age = (band - edge) / trail;',
    '  return pow(max(0.0, 1.0 - age), 3.0);',
    '}',

    'void main() {',
    '  vec2 p = gl_FragCoord.xy - origin;',

    '  float lit = 0.0;',
    '  for (int i = 0; i < MAX_WAVES; i++) {',
    '    if (float(i) >= waveCount) break;',
    '    lit = max(lit, waveAt(p, mod(time * speed - float(i) * spawnGap, cycle)));',
    '  }',

    // Grid stays screen-aligned while the wave rotates through it.
    '  vec2 cell = fract(gl_FragCoord.xy / spacing) - 0.5;',
    '  float dist = length(cell) * spacing;',
    '  float radius = DOT_R * spacing * (1.0 + lit);',
    '  float dotMask = smoothstep(radius, radius - 1.5, dist);',
    '  float halo = smoothstep(radius * 2.5, radius, dist) * pow(lit, 4.0) * 0.04;',

    '  float alpha = (0.06 + lit * 0.74) * dotMask + halo;',
    '  gl_FragColor = vec4(GOLD, clamp(alpha, 0.0, 1.0));',
    '}'
  ].join('\n')
    .replace(/DOT_R/g, DOT_RADIUS.toFixed(3))
    .replace(/MAX_WAVES/g, String(MAX_WAVES));

  function compile(gl, type, src) {
    var sh = gl.createShader(type);
    gl.shaderSource(sh, src);
    gl.compileShader(sh);
    if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
      console.error('[dot-grid]', gl.getShaderInfoLog(sh));
      gl.deleteShader(sh);
      return null;
    }
    return sh;
  }

  function start() {
    var canvas = document.createElement('canvas');
    canvas.className = 'dot-grid';
    canvas.setAttribute('aria-hidden', 'true');
    document.body.insertBefore(canvas, document.body.firstChild);

    var gl = canvas.getContext('webgl', {
      alpha: true, antialias: false, premultipliedAlpha: false, depth: false, stencil: false
    });
    if (!gl) {
      canvas.classList.add('dot-grid--static');
      return;
    }

    var vs = compile(gl, gl.VERTEX_SHADER, VERT);
    var fs = vs && compile(gl, gl.FRAGMENT_SHADER, FRAG);
    var prog = fs && gl.createProgram();
    if (!prog) {
      canvas.classList.add('dot-grid--static');
      return;
    }

    gl.attachShader(prog, vs);
    gl.attachShader(prog, fs);
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
      console.error('[dot-grid]', gl.getProgramInfoLog(prog));
      canvas.classList.add('dot-grid--static');
      return;
    }
    gl.useProgram(prog);

    var buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]), gl.STATIC_DRAW);
    var pos = gl.getAttribLocation(prog, 'position');
    gl.enableVertexAttribArray(pos);
    gl.vertexAttribPointer(pos, 2, gl.FLOAT, false, 0, 0);

    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

    function u(name) { return gl.getUniformLocation(prog, name); }
    var uTime = u('time'), uOrigin = u('origin'), uSpacing = u('spacing'),
        uBand = u('band'), uTrail = u('trail'), uSpawnGap = u('spawnGap'),
        uMaxRadius = u('maxRadius'), uCycle = u('cycle'),
        uWaveCount = u('waveCount'), uSpeed = u('speed'), uRotPerPx = u('rotPerPx');

    var dpr = 1;
    var frame = 0;
    var visible = true;
    var elapsed = 0;
    var last = 0;

    var motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    var reduced = motionQuery.matches;

    function setOrigin() {
      var logo = document.querySelector('.logo');
      var cx = window.innerWidth / 2;
      var cy = window.innerHeight / 2;
      if (logo) {
        var r = logo.getBoundingClientRect();
        cx = r.left + r.width / 2;
        cy = r.top + r.height / 2;
      }
      gl.uniform2f(uOrigin, cx * dpr, (window.innerHeight - cy) * dpr);
    }

    function resize() {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      var w = Math.max(1, Math.floor(window.innerWidth * dpr));
      var h = Math.max(1, Math.floor(window.innerHeight * dpr));
      canvas.width = w;
      canvas.height = h;
      gl.viewport(0, 0, w, h);

      var maxRadius = Math.sqrt(w * w + h * h) * 1.2;
      var gap = SPAWN_GAP * dpr;
      var count = Math.min(MAX_WAVES, Math.max(1, Math.ceil(maxRadius / gap)));

      gl.uniform1f(uSpacing, SPACING * dpr);
      gl.uniform1f(uBand, BAND * dpr);
      gl.uniform1f(uTrail, TRAIL * dpr);
      gl.uniform1f(uSpawnGap, gap);
      gl.uniform1f(uMaxRadius, maxRadius);
      gl.uniform1f(uCycle, count * gap);
      gl.uniform1f(uWaveCount, count);
      gl.uniform1f(uSpeed, WAVE_SPEED * dpr);
      gl.uniform1f(uRotPerPx, ROT_RAD_PER_PX / dpr);

      setOrigin();
      if (!frame) draw(last);
    }

    function draw(now) {
      if (reduced) {
        elapsed = STATIC_TIME;
      } else {
        elapsed += Math.min(last ? now - last : 0, 100) * 0.001;
      }
      last = now;
      gl.uniform1f(uTime, elapsed);
      gl.drawArrays(gl.TRIANGLES, 0, 6);
    }

    function loop(now) {
      draw(now);
      frame = running() ? requestAnimationFrame(loop) : 0;
    }

    function running() { return visible && !document.hidden && !reduced; }

    function play() {
      if (frame) return;
      if (!running()) { draw(last); return; }
      last = 0;
      frame = requestAnimationFrame(loop);
    }

    function pause() {
      if (!frame) return;
      cancelAnimationFrame(frame);
      frame = 0;
    }

    if (window.IntersectionObserver) {
      new IntersectionObserver(function (entries) {
        visible = entries[0] ? entries[0].isIntersecting : true;
        if (visible) play(); else pause();
      }).observe(canvas);
    }

    window.addEventListener('resize', resize);
    window.addEventListener('scroll', function () {
      setOrigin();
      if (!frame) draw(last);
    }, { passive: true });
    document.addEventListener('visibilitychange', function () {
      if (document.hidden) pause(); else play();
    });
    canvas.addEventListener('webglcontextlost', function (e) {
      e.preventDefault();
      pause();
      canvas.classList.add('dot-grid--static');
    });

    var onMotionChange = function (e) {
      reduced = e.matches;
      if (reduced) { pause(); draw(last); } else { play(); }
    };
    if (motionQuery.addEventListener) motionQuery.addEventListener('change', onMotionChange);
    else if (motionQuery.addListener) motionQuery.addListener(onMotionChange);

    resize();
    play();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start);
  } else {
    start();
  }
})();
