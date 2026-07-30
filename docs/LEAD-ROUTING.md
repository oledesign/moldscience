# Lead routing for the Profit Building App form

The form at `/calculator` posts to `/api/get-app`. That function does not care
which automation tool you use — it POSTs the lead as JSON to whatever URL is in
`LEAD_WEBHOOK_URL`. Zapier, Pabbly, n8n, Make, or Rolldog's own API all work.

## Payload sent to the webhook

```json
{
  "source": "moldsciencetechnologies.com — Profit Building App",
  "submittedAt": "2026-07-30T16:55:12.000Z",
  "name": "Jane Contractor",
  "email": "jane@example.com",
  "phone": "555-123-4567"
}
```

`Content-Type: application/json`. If `LEAD_WEBHOOK_TOKEN` is set it is sent as
`Authorization: Bearer <token>`.

## Environment variables (Vercel → Project → Settings → Environment Variables)

| Variable | Needed | Purpose |
|---|---|---|
| `LEAD_WEBHOOK_URL` | for CRM routing | Where the lead JSON is POSTed |
| `LEAD_WEBHOOK_TOKEN` | optional | Bearer token, if your endpoint wants one |
| `RESEND_API_KEY` + `MAIL_FROM` | optional | Email channel: sends the app to the prospect and notifies the team |
| `APP_LINK_IOS`, `APP_LINK_ANDROID` | recommended | Put in the prospect's email so the app is genuinely automatic |
| `BOOKLET_URL`, `MAIL_TO` | optional | Extra download; override the notification recipient |

At least one of `LEAD_WEBHOOK_URL` or `RESEND_API_KEY` must be set. If both are,
both fire, and the submission only fails when every channel fails — a CRM
outage must never cost a lead.

## Recommended: n8n

Import `docs/n8n-lead-workflow.json`. It gives you:

1. **Website form** — a Webhook node. Copy its *production* URL into
   `LEAD_WEBHOOK_URL`.
2. **Valid lead?** — a second validation pass behind the site's own honeypot,
   timing check and not-a-robot box.
3. **Create Rolldog lead** — an HTTP Request node, left as a **placeholder**.
   Rolldog publishes an open API but not a public web-to-lead endpoint, so ask
   Rolldog support for the create-lead URL and auth header, then fill it in.
   Set to continue on error so a Rolldog failure still lets the app go out.
4. **Email the app** and **Notify Greg** — replace the two app links.
5. **200 OK** — the site shows its success message when this returns.

Self-hosted n8n must be reachable from Vercel. On a VPS that is automatic; on a
laptop you need a tunnel, so a hosted instance is simpler for production.

Pabbly Connect works identically: start with its webhook trigger and use an
API/HTTP action for Rolldog.

## Once Rolldog is live

Remove `RESEND_API_KEY` and the email channel stops; the webhook becomes the
only path, and n8n owns the app delivery and notifications.

## Not yet automatic

The form copy promises delivery "directly to your cell phone". Today the cell
number reaches the CRM and a person texts the link. For real auto-SMS add a
Twilio node to the n8n workflow — roughly US$0.008 per message.
