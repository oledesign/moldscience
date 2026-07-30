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

// Stamp when the form became available. The API rejects submissions that arrive
// implausibly fast, which catches scripted fillers without troubling a human.
document.querySelectorAll('form[data-async] input[name="_started"]').forEach((el) => {
  el.value = String(Date.now());
});
