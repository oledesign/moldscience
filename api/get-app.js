// Calculator phone gate → emails one Profit Building App lead notification via Resend.
// The sales representative follows up with the contractor using the submitted phone number.
// Required env: RESEND_API_KEY, MAIL_FROM

const esc = (s = '') =>
  String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { name, phone, _gotcha } = req.body || {};
  if (_gotcha) return res.status(200).json({ ok: true }); // honeypot: pretend success
  if (!name || !phone) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  if (!process.env.RESEND_API_KEY || !process.env.MAIL_FROM) {
    console.error('get-app: RESEND_API_KEY / MAIL_FROM not configured');
    return res.status(500).json({ error: 'Mail not configured' });
  }

  const r = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: process.env.MAIL_FROM,
      to: ['gkochuk@moldsciencetechnologies.com'],
      subject: 'Profit Calculator lead — ' + name,
      html: `
        <h2>New Profit Calculator lead</h2>
        <p><strong>Name:</strong> ${esc(name)}</p>
        <p><strong>Phone:</strong> ${esc(phone)}</p>
        <p>Please follow up with this contractor about the Profit Building App.</p>
      `,
    }),
  });

  if (!r.ok) {
    console.error('get-app: resend error', r.status, await r.text());
    return res.status(502).json({ error: 'Send failed' });
  }
  return res.status(200).json({ ok: true });
}
