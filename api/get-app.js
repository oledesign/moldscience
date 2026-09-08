// Profit Building App request — captures name, company, email and cell, then delivers the
// lead and sends the app to the prospect.
//
// Delivery is pluggable so the CRM can change without touching this file:
//
//   LEAD_WEBHOOK_URL  If set, the lead is POSTed as JSON here. This is the path
//                     for Rolldog: point it at a Zapier/Make catch hook wired to
//                     Rolldog's "Create Lead" action, or at Rolldog's own API
//                     gateway. Optional bearer via LEAD_WEBHOOK_TOKEN.
//   RESEND_API_KEY    If set (with MAIL_FROM), emails the app to the prospect and
//                     notifies the team. Used alone, or alongside the webhook.
//
// At least one must be configured. If both are, both run, and the request only
// fails when every configured channel fails — a CRM outage must not cost a lead.
//
// Optional: APP_LINK_IOS, APP_LINK_ANDROID, BOOKLET_URL, MAIL_TO.

const esc = (s = '') =>
  String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

const LEAD_TO = 'gkochuk@moldsciencetechnologies.com';
const MIN_FILL_MS = 2500; // a human cannot read the form and submit faster than this

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { name, company, email, phone, human, _gotcha, _started } = req.body || {};

  // --- bot gates -----------------------------------------------------------
  // 1. honeypot: a hidden field only an automated filler would populate
  if (_gotcha) return res.status(200).json({ ok: true }); // pretend success
  // 2. submission speed
  const started = Number(_started);
  if (started && Date.now() - started < MIN_FILL_MS) {
    return res.status(200).json({ ok: true });
  }
  // 3. the explicit "I am not a robot" confirmation
  if (!human) return res.status(400).json({ error: 'Please confirm you are not a robot.' });

  if (!name || !company || !email || !phone) {
    return res.status(400).json({ error: 'Missing required fields' });
  }
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(String(email))) {
    return res.status(400).json({ error: 'Please enter a valid email address.' });
  }

  const lead = {
    source: 'moldsciencetechnologies.com — Profit Building App',
    submittedAt: new Date().toISOString(),
    name: String(name).slice(0, 200),
    company: String(company).slice(0, 200),
    email: String(email).slice(0, 200),
    phone: String(phone).slice(0, 60),
  };

  const results = [];

  // --- 1. CRM webhook (Rolldog via Zapier/Make, or any JSON endpoint) -------
  if (process.env.LEAD_WEBHOOK_URL) {
    try {
      const headers = { 'Content-Type': 'application/json' };
      if (process.env.LEAD_WEBHOOK_TOKEN) {
        headers.Authorization = `Bearer ${process.env.LEAD_WEBHOOK_TOKEN}`;
      }
      const r = await fetch(process.env.LEAD_WEBHOOK_URL, {
        method: 'POST',
        headers,
        body: JSON.stringify(lead),
      });
      results.push({ channel: 'webhook', ok: r.ok });
      if (!r.ok) console.error('get-app: webhook rejected', r.status, await r.text());
    } catch (err) {
      results.push({ channel: 'webhook', ok: false });
      console.error('get-app: webhook failed', err);
    }
  }

  // --- 2. email: deliver the app, and notify the team -----------------------
  if (process.env.RESEND_API_KEY && process.env.MAIL_FROM) {
    const ios = process.env.APP_LINK_IOS;
    const android = process.env.APP_LINK_ANDROID;
    const booklet = process.env.BOOKLET_URL;

    const links =
      ios || android
        ? `<p><strong>Install the app on your phone:</strong></p>
           <ul>
             ${ios ? `<li><a href="${esc(ios)}">iPhone (App Store)</a></li>` : ''}
             ${android ? `<li><a href="${esc(android)}">Android (Google Play)</a></li>` : ''}
           </ul>
           ${booklet ? `<p><a href="${esc(booklet)}">Download the best-practices booklet (PDF)</a></p>` : ''}`
        : `<p>One of our team will text the install link to ${esc(lead.phone)} shortly.</p>`;

    const send = (payload) =>
      fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

    try {
      const [toProspect, toTeam] = await Promise.all([
        send({
          from: process.env.MAIL_FROM,
          to: [lead.email],
          subject: 'Your free MoldScience Profit Building App',
          html: `
            <h2>Thanks, ${esc(lead.name)}!</h2>
            <p>Here is your free Profit Building App from Mold Science Technologies.</p>
            ${links}
            <p>Questions? Call us at (888) 770-3130 or just reply to this email.</p>
            <p style="color:#666;font-size:12px">You are receiving this because you requested the app at
            moldsciencetechnologies.com. We do not share your details with anyone.</p>
          `,
        }),
        send({
          from: process.env.MAIL_FROM,
          to: [process.env.MAIL_TO || LEAD_TO],
          reply_to: lead.email,
          subject: `Profit Calculator lead — ${lead.name} (${lead.company})`,
          html: `
            <h2>New Profit Building App request</h2>
            <p><strong>Name:</strong> ${esc(lead.name)}</p>
            <p><strong>Company:</strong> ${esc(lead.company)}</p>
            <p><strong>Email:</strong> ${esc(lead.email)}</p>
            <p><strong>Cell:</strong> ${esc(lead.phone)}</p>
            <p>Please text the app link to this contractor and follow up.</p>
          `,
        }),
      ]);
      results.push({ channel: 'email', ok: toProspect.ok && toTeam.ok });
      if (!toProspect.ok || !toTeam.ok) {
        console.error('get-app: resend error', toProspect.status, toTeam.status);
      }
    } catch (err) {
      results.push({ channel: 'email', ok: false });
      console.error('get-app: resend failed', err);
    }
  }

  if (!results.length) {
    console.error('get-app: no delivery channel configured (set LEAD_WEBHOOK_URL and/or RESEND_API_KEY)');
    return res.status(500).json({ error: 'Not configured' });
  }
  if (!results.some((r) => r.ok)) {
    return res.status(502).json({ error: 'Send failed' });
  }
  return res.status(200).json({ ok: true });
}
