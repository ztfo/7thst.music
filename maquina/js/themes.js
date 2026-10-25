// The palettes `theme` switches between: one accent each, all blues for now.
export const THEMES = {
  azul: '#5b9cff',
  cobalto: '#3d7bff',
  cielo: '#7cc4ff',
  lavanda: '#a3b8ff',
};
const DEFAULT_THEME = 'azul';

const KEY = 'maq-theme';
export function savedTheme() {
  try { const t = localStorage.getItem(KEY); if (t && THEMES[t]) return t; } catch {}
  return DEFAULT_THEME;
}
export function applyTheme(name) {
  document.documentElement.style.setProperty('--accent', THEMES[name]);
  try { localStorage.setItem(KEY, name); } catch {}
}
