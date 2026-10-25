// A small tick under the finger, where the phone can give one.
// Android has the Vibration API. iPhones don't, but Safari (17.4 and up) ticks when a finger
// toggles a switch input, so a tap target gets an invisible one laid over it. Since iOS 26.5
// only a real tap does it, never code: on iPhones there are ticks on taps and nowhere else.

const coarse = matchMedia('(pointer: coarse)').matches;
export const canBuzz = coarse && 'vibrate' in navigator;
const overlay = coarse && !canBuzz;

export function tick(ms = 8) {
  if (canBuzz) try { navigator.vibrate(ms); } catch {}
}

// lays the switch over a button; never over a link, whose own click it would take
export function arm(el) {
  if (!overlay || !el || el.querySelector(':scope > .tick')) return;
  const s = document.createElement('input');
  s.type = 'checkbox';
  s.setAttribute('switch', '');
  s.className = 'tick';
  s.tabIndex = -1;
  s.setAttribute('aria-hidden', 'true');
  el.appendChild(s);
}
