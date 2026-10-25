// The phone's own movement, for the sentir switch: how it's tilted, and a shake.
// iPhones ask the visitor first, and only inside a tap; Android just answers.

export const needsAsk = typeof DeviceOrientationEvent !== 'undefined' && typeof DeviceOrientationEvent.requestPermission === 'function';

// call it inside the tap itself; true once the phone says yes. One answer on an iPhone
// covers both tilt and motion, so the second request is sent along but not waited on.
export function ask() {
  if (!needsAsk) return Promise.resolve(true);
  const asked = DeviceOrientationEvent.requestPermission();
  try { DeviceMotionEvent.requestPermission?.().catch(() => {}); } catch {}
  return asked.then((r) => r === 'granted', () => false);
}

const clamp = (v) => Math.max(-1, Math.min(1, v));
// how far a tilt goes before it counts in full, in degrees
const RANGE = 20;
// the rest pose follows however the phone is held, over a few seconds
const SETTLE = 2.5;
// a shake: three hard jolts within a moment, then a pause before the next one counts
const JOLT = 15, GAP = 120, WINDOW = 900, COOL = 1500;

let off = null;

// onTilt(x, y): -1..1 each way, measured from the rest pose; onShake(): once per shake
export function start({ onTilt, onShake, tilt = true }) {
  stop();
  const rest = { x: null, y: null, at: 0 };
  const grav = { x: 0, y: 0, z: 0 };
  const peaks = [];
  let last = 0, calm = 0;

  const orient = (e) => {
    if (e.beta == null || e.gamma == null) return;
    // read the tilt the way the page is drawn, even with the screen turned
    const a = ((screen.orientation?.angle ?? window.orientation ?? 0) * Math.PI) / 180;
    const x = e.gamma * Math.cos(a) + e.beta * Math.sin(a);
    const y = e.beta * Math.cos(a) - e.gamma * Math.sin(a);
    const now = e.timeStamp || performance.now();
    if (rest.x === null) Object.assign(rest, { x, y, at: now });
    const k = 1 - Math.exp(-Math.max(0, now - rest.at) / 1000 / SETTLE);
    rest.at = now;
    rest.x += (x - rest.x) * k;
    rest.y += (y - rest.y) * k;
    onTilt(clamp((x - rest.x) / RANGE), clamp((y - rest.y) / RANGE));
  };

  const motion = (e) => {
    let m;
    const a = e.acceleration;
    if (a && a.x != null) m = Math.hypot(a.x, a.y, a.z);
    else {
      // phones that only report gravity mixed in: follow the gravity slowly and take it out
      const g = e.accelerationIncludingGravity;
      if (!g || g.x == null) return;
      grav.x += (g.x - grav.x) * 0.1; grav.y += (g.y - grav.y) * 0.1; grav.z += (g.z - grav.z) * 0.1;
      m = Math.hypot(g.x - grav.x, g.y - grav.y, g.z - grav.z);
    }
    const now = e.timeStamp || performance.now();
    if (m < JOLT || now < calm || now - last < GAP) return;
    last = now;
    peaks.push(now);
    while (peaks.length && now - peaks[0] > WINDOW) peaks.shift();
    if (peaks.length < 3) return;
    peaks.length = 0;
    calm = now + COOL;
    onShake();
  };

  if (tilt) addEventListener('deviceorientation', orient);
  addEventListener('devicemotion', motion);
  off = () => {
    removeEventListener('deviceorientation', orient);
    removeEventListener('devicemotion', motion);
  };
}

export function stop() {
  off?.();
  off = null;
}
