// Shared bot gate for the lead endpoints. The spam hitting these forms POSTs
// the API directly with well-formed data (real-looking names, a fictional
// 555-01xx phone, honeypot left empty), so field-level tricks alone don't cut
// it. Every check here rejects with a FAKE 200 so the bot never learns which
// gate it tripped.
//
// Gates, in order:
//   1. JSON only          — the site submits JSON; generic form spammers post urlencoded.
//   2. Same-origin        — Origin/Referer must be this site. Direct API posts have neither.
//   3. Timing window      — _started is REQUIRED (missing = bot), and the fill
//                           time must be 2.5s–2h.
//   4. JS proof token     — _token is computed by js/site.js at submit time from
//                           _started; it exists nowhere in the HTML, so scrapers
//                           that replay the form's fields can't produce it.
//   5. Fictional phones   — the 555-01xx range (e.g. +1 202 555 0101) is reserved
//                           for fiction; no real contractor has one.
//   6. Rate limit         — max 3 submissions per IP per 10 minutes (best-effort,
//                           per warm serverless instance).

const MIN_FILL_MS = 2500;
const MAX_FILL_MS = 2 * 60 * 60 * 1000;

// Must stay in sync with tok() in js/site.js.
export function tokenFor(started) {
  const s = 'msct:' + started;
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h.toString(36);
}

const hits = new Map(); // ip -> [timestamps]

export function botReason(req) {
  const b = req.body || {};

  if (b._gotcha) return 'honeypot';

  if (!String(req.headers['content-type'] || '').includes('application/json')) {
    return 'not-json';
  }

  const src = String(req.headers.origin || req.headers.referer || '');
  let host = '';
  try { host = new URL(src).hostname; } catch { /* absent or malformed */ }
  const sameSite =
    host === 'moldsciencetechnologies.com' ||
    host.endsWith('.moldsciencetechnologies.com') ||
    host === 'moldsciencetechnologies.vercel.app' ||
    /^moldsciencetechnologies-[\w-]+\.vercel\.app$/.test(host) ||
    host === 'localhost' || host === '127.0.0.1';
  if (!sameSite) return 'origin';

  const started = Number(b._started);
  if (!started) return 'no-start';
  const age = Date.now() - started;
  if (age < MIN_FILL_MS || age > MAX_FILL_MS) return 'timing';

  if (b._token !== tokenFor(b._started)) return 'token';

  const digits = String(b.phone || '').replace(/\D/g, '');
  if (/55501\d{2}$/.test(digits)) return 'fictional-phone';

  const ip = String(req.headers['x-forwarded-for'] || '').split(',')[0].trim() || 'unknown';
  const now = Date.now();
  const recent = (hits.get(ip) || []).filter((t) => now - t < 10 * 60 * 1000);
  recent.push(now);
  hits.set(ip, recent);
  if (hits.size > 5000) hits.clear(); // crude memory cap
  if (recent.length > 3) return 'rate';

  return null;
}
