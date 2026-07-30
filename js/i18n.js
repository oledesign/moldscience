// Site language runtime: EN (source) / FR (Canadian French) / ES (North American Spanish).
//
// English lives in the HTML itself, so the page is fully readable before this
// script runs and stays readable if it never does. Switching to another
// language swaps text in place from i18n/<lang>.json.
//
// Keys are stamped on elements by the extractor:
//   data-i18n          -> replace textContent
//   data-i18n-html     -> replace innerHTML (value carries inline tags)
//   data-i18n-content  -> replace the content attribute (meta description)
// A key missing from a dictionary simply keeps its English text.
(function () {
  const SUPPORTED = ['en', 'fr', 'es'];
  const STORAGE_KEY = 'mst-lang';
  const DEFAULT = 'en';

  function requested() {
    const q = new URLSearchParams(location.search).get('lang');
    if (q && SUPPORTED.includes(q)) return q;
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved && SUPPORTED.includes(saved)) return saved;
    } catch (e) { /* private browsing — fall through to default */ }
    return DEFAULT;
  }

  function markSwitcher(lang) {
    document.querySelectorAll('[data-lang-set]').forEach((btn) => {
      const on = btn.getAttribute('data-lang-set') === lang;
      btn.classList.toggle('is-active', on);
      btn.setAttribute('aria-pressed', String(on));
    });
  }

  // carry the language across internal navigation
  function decorateLinks(lang) {
    document.querySelectorAll('a[href]').forEach((a) => {
      const href = a.getAttribute('href');
      if (!href || /^(https?:|mailto:|tel:|#)/i.test(href)) return;
      if (a.hasAttribute('download')) return;
      try {
        const url = new URL(href, location.origin);
        if (url.origin !== location.origin) return;
        if (lang === DEFAULT) url.searchParams.delete('lang');
        else url.searchParams.set('lang', lang);
        a.setAttribute('href', url.pathname + url.search + url.hash);
      } catch (e) { /* leave odd hrefs alone */ }
    });
  }

  function apply(dict, lang) {
    document.querySelectorAll('[data-i18n]').forEach((el) => {
      const v = dict[el.getAttribute('data-i18n')];
      if (typeof v === 'string' && v) el.textContent = v;
    });
    document.querySelectorAll('[data-i18n-html]').forEach((el) => {
      const v = dict[el.getAttribute('data-i18n-html')];
      if (typeof v === 'string' && v) el.innerHTML = v;
    });
    document.querySelectorAll('[data-i18n-content]').forEach((el) => {
      const v = dict[el.getAttribute('data-i18n-content')];
      if (typeof v === 'string' && v) el.setAttribute('content', v);
    });
    document.documentElement.setAttribute('lang', lang === 'fr' ? 'fr-CA' : lang);
  }

  let cache = {};
  function load(lang) {
    if (lang === DEFAULT) return Promise.resolve(null); // English is already in the DOM
    if (cache[lang]) return Promise.resolve(cache[lang]);
    return fetch(`/i18n/${lang}.json`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => { if (d) cache[lang] = d; return d; })
      .catch(() => null); // network failure -> stay in English
  }

  // English source strings, captured before any swap, so switching back works
  let english = null;
  function captureEnglish() {
    if (english) return;
    english = { text: new Map(), html: new Map(), content: new Map() };
    document.querySelectorAll('[data-i18n]').forEach((el) =>
      english.text.set(el, el.textContent));
    document.querySelectorAll('[data-i18n-html]').forEach((el) =>
      english.html.set(el, el.innerHTML));
    document.querySelectorAll('[data-i18n-content]').forEach((el) =>
      english.content.set(el, el.getAttribute('content')));
  }

  function restoreEnglish() {
    if (!english) return;
    english.text.forEach((v, el) => { el.textContent = v; });
    english.html.forEach((v, el) => { el.innerHTML = v; });
    english.content.forEach((v, el) => { el.setAttribute('content', v); });
    document.documentElement.setAttribute('lang', 'en');
  }

  function setLang(lang, persist) {
    captureEnglish();
    if (persist) {
      try { localStorage.setItem(STORAGE_KEY, lang); } catch (e) { /* ignore */ }
    }
    markSwitcher(lang);
    decorateLinks(lang);
    if (lang === DEFAULT) { restoreEnglish(); return Promise.resolve(); }
    return load(lang).then((dict) => { if (dict) apply(dict, lang); });
  }

  function init() {
    captureEnglish();
    document.querySelectorAll('[data-lang-set]').forEach((btn) => {
      btn.addEventListener('click', () => {
        setLang(btn.getAttribute('data-lang-set'), true);
      });
    });
    setLang(requested(), false);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
