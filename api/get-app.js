// Calculator email gate → sends the prospect the app install links + best-practices
// booklet, and notifies info@ of the new lead.
// Required env: RESEND_API_KEY, MAIL_FROM
// Optional env: MAIL_TO (lead notifications, default info@moldsciencetechnologies.com),
//   APP_LINK_IOS, APP_LINK_ANDROID, BOOKLET_URL — until set, the prospect email says
//   the team will follow up with the install link.

const esc = (s = '') =>
  String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { name, email, _gotcha } = req.body || {};
  if (_gotcha) return res.status(200).json({ ok: true });
  if (!name || !email) return res.status(400).json({ error: 'Missing required fields' });

  if (!process.env.RESEND_API_KEY || !process.env.MAIL_FROM) {
    console.error('get-app: RESEND_API_KEY / MAIL_FROM not configured');
    return res.status(500).json({ error: 'Mail not configured' });
  }

  const ios = process.env.APP_LINK_IOS;
  const android = process.env.APP_LINK_ANDROID;
  const booklet = process.env.BOOKLET_URL;

  const linksHtml =
    ios || android
      ? `<p><strong>Install the app:</strong></p>
         <ul>
           ${ios ? `<li><a href="${esc(ios)}">iPhone (App Store)</a></li>` : ''}
           ${android ? `<li><a href="${esc(android)}">Android (Google Play)</a></li>` : ''}
         </ul>
         ${booklet ? `<p><a href="${esc(booklet)}">Download the best-practices booklet (PDF)</a></p>` : ''}`
      : `<p>Our team will follow up shortly with your install link for iPhone or Android and our best-practices booklet.</p>`;

  const send = (payload) =>
    fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

  // 1) deliver the app to the prospect
  const toProspect = await send({
    from: process.env.MAIL_FROM,
    to: [email],
    subject: 'Your free MoldScience Profit Building App',
    html: `
      <h2>Thanks, ${esc(name)}!</h2>
      <p>Here's your free Profit Building App from Mold Science Technologies.</p>
      ${linksHtml}
      <p>Questions? Call us at (888) 770-3130 or reply to this email.</p>
    `,
  });

  // 2) notify the team of the lead
  const toTeam = await send({
    from: process.env.MAIL_FROM,
    to: [process.env.MAIL_TO || 'info@moldsciencetechnologies.com'],
    reply_to: email,
    subject: `Profit app lead — ${name}`,
    html: `<p><strong>${esc(name)}</strong> (${esc(email)}) requested the Profit Building App via the website.</p>`,
  });

  if (!toProspect.ok || !toTeam.ok) {
    console.error('get-app: resend error', toProspect.status, toTeam.status);
    return res.status(502).json({ error: 'Send failed' });
  }
  return res.status(200).json({ ok: true });
}
