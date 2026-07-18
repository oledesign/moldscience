// Contact form → email notification to info@moldsciencetechnologies.com via Resend.
// Required env: RESEND_API_KEY, MAIL_FROM (verified sender, e.g. "MoldScience Website <noreply@moldsciencetechnologies.com>")
// Optional env: MAIL_TO (defaults to info@moldsciencetechnologies.com)

const esc = (s = '') =>
  String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { firstName, lastName, email, phone, company, topic, message, _gotcha } = req.body || {};
  if (_gotcha) return res.status(200).json({ ok: true }); // honeypot: pretend success
  if (!firstName || !lastName || !email || !message) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  if (!process.env.RESEND_API_KEY || !process.env.MAIL_FROM) {
    console.error('contact: RESEND_API_KEY / MAIL_FROM not configured');
    return res.status(500).json({ error: 'Mail not configured' });
  }

  const to = process.env.MAIL_TO || 'info@moldsciencetechnologies.com';
  const r = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: process.env.MAIL_FROM,
      to: [to],
      reply_to: email,
      subject: `Website contact — ${topic || 'General'} — ${firstName} ${lastName}`,
      html: `
        <h2>New contact form submission</h2>
        <p><strong>Name:</strong> ${esc(firstName)} ${esc(lastName)}</p>
        <p><strong>Email:</strong> ${esc(email)}</p>
        <p><strong>Phone:</strong> ${esc(phone || '—')}</p>
        <p><strong>Company:</strong> ${esc(company || '—')}</p>
        <p><strong>Topic:</strong> ${esc(topic || '—')}</p>
        <p><strong>Message:</strong></p>
        <p>${esc(message).replace(/\n/g, '<br>')}</p>
      `,
    }),
  });

  if (!r.ok) {
    console.error('contact: resend error', r.status, await r.text());
    return res.status(502).json({ error: 'Send failed' });
  }
  return res.status(200).json({ ok: true });
}
