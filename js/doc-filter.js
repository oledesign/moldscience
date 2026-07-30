// Resource library language filter: All / EN / FR.
// Rows carry data-lang="en|fr"; rows without the attribute are language-neutral
// and stay visible under every filter. Sections whose rows all hide collapse too,
// so no orphan headings are left behind.
(function () {
  const filter = document.querySelector('.lang-filter');
  if (!filter) return;

  const buttons = Array.from(filter.querySelectorAll('[data-lang-filter]'));
  const rows = Array.from(document.querySelectorAll('.download-row'));
  const empty = document.querySelector('.lang-filter__empty');
  if (!buttons.length || !rows.length) return;

  // each row's owning section, so a section with nothing left can be hidden
  const sections = Array.from(
    new Set(rows.map((row) => row.closest('section')).filter(Boolean))
  );

  function apply(lang) {
    rows.forEach((row) => {
      const rowLang = row.getAttribute('data-lang');
      row.hidden = !(lang === 'all' || !rowLang || rowLang === lang);
    });

    let visible = 0;
    sections.forEach((section) => {
      const shown = section.querySelectorAll('.download-row:not([hidden])').length;
      section.hidden = shown === 0;
      visible += shown;
    });

    if (empty) empty.hidden = visible > 0;
  }

  buttons.forEach((btn) => {
    btn.addEventListener('click', () => {
      buttons.forEach((b) => {
        const on = b === btn;
        b.classList.toggle('is-active', on);
        b.setAttribute('aria-pressed', String(on));
      });
      apply(btn.getAttribute('data-lang-filter') || 'all');
    });
  });

  const initial = buttons.find((b) => b.classList.contains('is-active'));
  apply(initial ? initial.getAttribute('data-lang-filter') : 'all');
})();
