// The live editor: a plain textarea, its text made invisible, laid over a highlighted copy
// of the same text. The copy is built with escaped HTML from a small tokenizer, so the
// code is only ever shown here, never run; running it is the engine's job, in its sandbox.

const TOKENS = /(\/\/[^\n]*)|("(?:[^"\\\n]|\\.)*"?|'(?:[^'\\\n]|\\.)*'?|`(?:[^`\\]|\\.)*`?)|(\d*\.\d+|\d+)|([A-Za-z_$][\w$]*)/g;
const KIND = ['', 'k-c', 'k-s', 'k-n', 'k-f'];
const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

export function highlight(code) {
  let html = '', at = 0;
  for (const m of code.matchAll(TOKENS)) {
    html += esc(code.slice(at, m.index));
    const k = m.findIndex((g, i) => i > 0 && g !== undefined);
    html += `<span class="${KIND[k]}">${esc(m[0])}</span>`;
    at = m.index + m[0].length;
  }
  // a trailing space keeps the last line's height when it's empty
  return html + esc(code.slice(at)) + '\n ';
}

export function makeEditor({ ta, hl, nums, onRun, onChange }) {
  let lines = 0;
  const paint = () => {
    hl.innerHTML = highlight(ta.value);
    const n = ta.value.split('\n').length;
    if (n !== lines) { lines = n; nums.textContent = Array.from({ length: n }, (_, i) => i + 1).join('\n'); }
  };

  ta.addEventListener('input', () => { paint(); onChange?.(ta.value); });
  ta.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) { e.preventDefault(); onRun?.(); }
    else if (e.key === 'Enter' && !e.shiftKey && !e.altKey) {
      // keep the indent of the line above
      const before = ta.value.slice(0, ta.selectionStart);
      const indent = before.slice(before.lastIndexOf('\n') + 1).match(/^\s*/)[0];
      if (indent) { e.preventDefault(); insert('\n' + indent); }
    }
  });

  // types text at the cursor; a pair like "[]" lands with the cursor between
  function insert(text) {
    const pair = text.length === 2 && '[]<>()""'.includes(text);
    const { selectionStart: a, selectionEnd: b } = ta;
    const inner = ta.value.slice(a, b);
    ta.setRangeText(pair ? text[0] + inner + text[1] : text, a, b, 'end');
    if (pair) ta.setSelectionRange(a + 1, a + 1 + inner.length);
    paint();
    onChange?.(ta.value);
  }

  return {
    get value() { return ta.value; },
    set value(v) { ta.value = v; paint(); },
    insert,
    focus: () => ta.focus({ preventScroll: true }),
    paint,
  };
}
