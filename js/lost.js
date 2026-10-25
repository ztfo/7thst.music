// The 404 page's terminal. It knows a handful of commands and only ever prints text or goes
// to one of the site's own pages; what's typed is matched, never run. `ls -a` shows the
// hidden folder, and that's the way into La Máquina.
(() => {
  const $ = (s) => document.querySelector(s);
  const out = $('#out'), cmd = $('#cmd');
  let path = location.pathname;
  try { path = decodeURIComponent(path); } catch {}
  path = path.slice(0, 60);
  $('#path').textContent = path;
  $('#path-2').textContent = path;

  function line(text, cls) {
    const p = document.createElement('p');
    if (cls) p.className = cls;
    p.textContent = text;
    out.append(p);
    p.scrollIntoView({ block: 'nearest' });
  }
  function echo(text) {
    const p = document.createElement('p');
    p.innerHTML = '<span class="ps">llü@7thst<i>:~$</i></span> ';
    p.append(text);
    out.append(p);
  }
  const go = (href) => { setTimeout(() => { location.href = href; }, 200); };
  const fold = (s) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();

  const DIRS = { baraja: '/', deck: '/', '..': '/', '~': '/', '/': '/', arte: '/art.html', art: '/art.html', '.maquina': '/maquina/?via=404', maquina: '/maquina/?via=404' };
  function run(raw) {
    const text = raw.trim().slice(0, 120);
    echo(text);
    if (!text) return;
    const [word, ...rest] = fold(text).split(/\s+/);
    const arg = rest.join(' ').replace(/\/$/, '');
    if (word === 'help' || word === 'ayuda') {
      line('  baraja · deck     las cartas · the cards', 'd');
      line('  arte · art        mis dibujos · my art', 'd');
      line('  ls                lo que hay · what’s here', 'd');
      line('  cd <dir>          ir · go', 'd');
      line('  (ls -a, si tienes curiosidad · if you’re curious)', 'd');
    } else if (word === 'ls' || word === 'dir') {
      line(arg === '-a' || arg === '-la' || arg === '-al' ? '  .  ..  .maquina/  baraja/  arte/' : '  baraja/  arte/');
    } else if (word === 'cd' && DIRS[arg]) {
      go(DIRS[arg]);
    } else if (DIRS[word] && word !== '..' && word !== '/' && word !== '~') {
      go(DIRS[word]);
    } else if (word === 'sudo') {
      line('buen intento · nice try', 'd');
    } else if (word === 'cd') {
      line(`bash: cd: ${arg}: esta carta no está · not in the deck`, 'e');
    } else {
      line(`${word}: no conozco ese comando · command not found. help`, 'e');
    }
  }

  $('#prompt').addEventListener('submit', (e) => { e.preventDefault(); run(cmd.value); cmd.value = ''; });
})();
