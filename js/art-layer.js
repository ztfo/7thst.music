// Mis dibujos over the table. On the home page a click on "arte" opens art.html in a frame laid
// over the table instead of loading it, so the song (or the sketch) keeps playing, and the mini
// player stays along the bottom. The address still changes to art.html and the back button closes
// it. art.html is still a page of its own for links, new tabs, reloads and search.
const $ = (s, r = document) => r.querySelector(s);
const ARTS = /(^|\/)art\.html$/;

// onOpen and onClose: the home page shows or hides the mini player
// onLang(lang): the language was switched inside the layer
export function artLayer({ lang, onOpen, onClose, onLang }) {
  const isArt = (u) => ARTS.test(u.pathname);
  const shown = [$('main'), $('footer.foot')].filter(Boolean);
  let el = null;
  let frame = null;
  let from = null;
  let goTo = '';
  const layer = { open: false };

  // the frame is made once, on the first hover or press of the link, and kept for the next visit
  function prepare() {
    if (el) return;
    el = document.createElement('div');
    el.className = 'art-layer';
    el.hidden = true;
    frame = document.createElement('iframe');
    frame.title = 'Mis dibujos · llü';
    frame.src = `art.html?layer=1&lang=${lang()}`;
    frame.addEventListener('load', () => {
      el.classList.add('is-ready');
      try { frame.title = frame.contentDocument.title || frame.title; } catch {}
      if (layer.open) frame.focus();
    });
    el.appendChild(frame);
    document.body.appendChild(el);
  }
  const say = (msg) => { try { frame.contentWindow.postMessage({ llu: 'art', ...msg }, location.origin); } catch {} };

  function show() {
    prepare();
    layer.open = true;
    el.hidden = false;
    document.documentElement.classList.add('art-open');
    document.body.classList.add('art-open');
    shown.forEach((n) => { n.inert = true; });
    say({ act: 'lang', lang: lang() });
    if (el.classList.contains('is-ready')) frame.focus();
    onOpen?.();
  }
  function hide() {
    if (!layer.open) return;
    layer.open = false;
    el.hidden = true;
    document.documentElement.classList.remove('art-open');
    document.body.classList.remove('art-open');
    shown.forEach((n) => { n.inert = false; });
    onClose?.();
    const target = goTo && document.getElementById(goTo);
    goTo = '';
    // after the browser puts the table's own scroll back
    if (target) requestAnimationFrame(() => requestAnimationFrame(() => target.scrollIntoView({ block: 'start' })));
    else from?.focus({ preventScroll: true });
  }

  // plain clicks only: a new tab, a new window or a download still gets the real page
  document.addEventListener('click', (e) => {
    const a = e.target.closest?.('a[href]');
    if (!a || e.defaultPrevented || e.button || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    if (a.target && a.target !== '_self') return;
    const url = new URL(a.href, location.href);
    if (url.origin !== location.origin || !isArt(url)) return;
    e.preventDefault();
    from = a;
    if (layer.open) return;
    // analytics counts this view from the address change; the frame doesn't count its own
    history.pushState({ art: true }, '', url.pathname + url.search);
    show();
  });
  document.addEventListener('pointerover', (e) => {
    const a = e.target.closest?.('a[href]');
    if (a && isArt(new URL(a.href, location.href))) prepare();
  }, { passive: true });

  addEventListener('popstate', (e) => {
    if (e.state?.art) show();
    else hide();
  });

  // the frame asks to go home (the back link, the mark, música, en proceso, seguir) or says its
  // language changed; only this site's own art page is listened to
  addEventListener('message', (e) => {
    if (!frame || e.source !== frame.contentWindow || e.origin !== location.origin) return;
    const m = e.data;
    if (!m || m.llu !== 'art') return;
    if (m.act === 'lang' && (m.lang === 'es' || m.lang === 'en')) onLang?.(m.lang);
    if (m.act === 'home') {
      goTo = typeof m.hash === 'string' ? decodeURIComponent(m.hash.slice(1)) : '';
      // the layer always sits on an entry of its own, so going home is going back
      if (history.state?.art) history.back();
      else hide();
    }
  });

  return layer;
}
