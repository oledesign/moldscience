// Mobile nav toggle
document.querySelectorAll('.nav').forEach((nav) => {
  const toggle = nav.querySelector('.nav-toggle');
  if (!toggle) return;
  toggle.addEventListener('click', () => {
    const open = nav.classList.toggle('is-open');
    toggle.setAttribute('aria-expanded', String(open));
  });
});

// Forms: POST as JSON to the form's action (/api/contact, /api/get-app),
// then swap in the success/error callout.
document.querySelectorAll('form[data-async]').forEach((form) => {
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = form.querySelector('button[type="submit"]');
    const status = form.querySelector('.form-status');
    const data = Object.fromEntries(new FormData(form).entries());
    if (data._gotcha) return; // honeypot
    // Anti-bot proof: _started was stamped at page load; _token is derived from
    // it here, at submit time, so neither a scraped copy of the HTML nor a
    // direct API post can reproduce the pair. Must stay in sync with api/_guard.js.
    data._started = form.dataset.t0;
    data._token = tok(data._started);
    btn.disabled = true;
    const label = btn.textContent;
    btn.textContent = 'Sending…';
    try {
      const res = await fetch(form.action, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error('send failed');
      form.reset();
      // A form that names a success panel is replaced wholesale — fields and
      // button go away and the panel (logo + thank-you) takes their place.
      const panel = form.dataset.successPanel && document.getElementById(form.dataset.successPanel);
      if (panel) {
        form.hidden = true;
        panel.hidden = false;
        return;
      }
      status.className = 'form-status callout callout--positive';
      status.textContent = form.dataset.success;
    } catch (err) {
      status.className = 'form-status callout callout--negative';
      status.textContent = 'Something went wrong sending your message. Please email info@moldsciencetechnologies.com or call (888) 770-3130.';
    } finally {
      status.hidden = false;
      btn.disabled = false;
      btn.textContent = label;
    }
  });
});

// Stamp when each form became available. The API rejects submissions that
// arrive implausibly fast (or without the stamp at all), which catches
// scripted fillers without troubling a human.
document.querySelectorAll('form[data-async]').forEach((form) => {
  form.dataset.t0 = String(Date.now());
});

// Must stay in sync with tokenFor() in api/_guard.js.
function tok(started) {
  const s = 'msct:' + started;
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h.toString(36);
}
