// The step grid: five drums by sixteen steps, for thumbs more than keyboards. The grid and
// the code are the same thing: a grid pattern is code in one exact shape (gridCode below),
// tapping a step rewrites the code, and code in that shape reads back into the grid. Code
// edited out of that shape is no longer a grid, and the grid offers to start a new one.

// the rows' names are in strings.js (gridRows), in this order
export const ROWS = [{ s: 'bd' }, { s: 'cp' }, { s: 'hh' }, { s: 'oh' }, { s: 'rim' }];
export const STEPS = 16;
const BANK = 'RolandTR909';
const HEAD = '// grid · tap the steps, or edit the code';

export const emptySteps = () => ROWS.map(() => Array(STEPS).fill(false));
export function starterSteps() {
  const on = (row, ...at) => at.forEach((i) => { steps[row][i] = true; });
  const steps = emptySteps();
  on(0, 0, 4, 8, 12);
  on(1, 4, 12);
  on(2, 2, 6, 10, 14);
  on(3, 15);
  return steps;
}

export function gridCode(steps, bpm) {
  const rows = ROWS.map((r, k) => `  s("${steps[k].map((x) => (x ? r.s : '~')).join(' ')}").bank("${BANK}")`);
  return `${HEAD}\nsetcps(${bpm}/60/4)\n\nstack(\n${rows.join(',\n')}\n)`;
}

// the grid in this code, or null when the code isn't in the grid's shape
export function readGrid(code) {
  const bpm = Number(code.match(/^setcps\((\d{2,3})\/60\/4\)$/m)?.[1]);
  if (!bpm) return null;
  const steps = ROWS.map((r) => {
    const m = code.match(new RegExp(`^  s\\("((?:(?:${r.s}|~) ){${STEPS - 1}}(?:${r.s}|~))"\\)\\.bank\\("${BANK}"\\),?$`, 'm'));
    return m ? m[1].split(' ').map((t) => t === r.s) : null;
  });
  if (steps.includes(null)) return null;
  // only code exactly as the grid writes it; anything added by hand means it's code now
  return gridCode(steps, bpm) === code.trim() ? { steps, bpm } : null;
}

export const bpmOf = (code) => Math.min(180, Math.max(60, Number(code.match(/setcps\((\d{2,3})\/60\/4\)/)?.[1]) || 132));
