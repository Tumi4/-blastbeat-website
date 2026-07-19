# Email for blastbeat.education — setup runbook

**Status (2026-07-19):** the domain has **no MX records**, so
`info@` / `partners@` / `robert@blastbeat.education` have never been able to
receive mail — every message bounces ("recipient server did not accept").
Confirmed by DNS lookup and by the bounce notices in the team's own Gmail
threads. Website forms are unaffected (they land in Admin → Leads).

DNS is hosted on **Netlify DNS** (nameservers `dns1–4.p09.nsone.net`), so all
records below are added at **app.netlify.com → Domains → blastbeat.education**.

---

## Phase 1 — inbound mail via ImprovMX (free, ~30 min)

ImprovMX forwards mail for the domain to existing Gmail inboxes. No new
mailboxes to manage, free tier is fine for our volume.

### 1. Create the ImprovMX account
Go to improvmx.com → sign up (use ttncube01@gmail.com) → add domain
`blastbeat.education`.

### 2. Add the aliases

| Alias | Forwards to |
|---|---|
| `info@` | ttncube01@gmail.com |
| `partners@` | ttncube01@gmail.com |
| `tumelo@` | ttncube01@gmail.com |
| `robert@` | rilstephenson@gmail.com |
| `*@` (catch-all) | ttncube01@gmail.com |

(The catch-all means a typo like `partner@` still reaches a human.)

### 3. Add the DNS records in Netlify
app.netlify.com → **Domains** → blastbeat.education → **DNS records** →
Add record:

| Type | Name | Value | Priority | TTL |
|---|---|---|---|---|
| MX | `@` | `mx1.improvmx.com` | 10 | default |
| MX | `@` | `mx2.improvmx.com` | 20 | default |
| TXT | `@` | `v=spf1 include:spf.improvmx.com ~all` | — | default |

> If a `v=spf1 …` TXT record already exists, don't add a second one — merge
> the `include:` into the existing record instead. Two SPF records = SPF
> broken for everyone.

### 4. Verify + test
- ImprovMX dashboard should show the domain green ("MX records OK") within
  ~15–60 minutes.
- Send a test from any outside account to `info@blastbeat.education` and
  `robert@blastbeat.education`; both must arrive.
- Only after both tests pass may the addresses go on printed material.

### 5. Optional — replying *as* the domain
ImprovMX (Settings → SMTP) gives free SMTP credentials (25 emails/day).
In Gmail: Settings → Accounts → "Send mail as" → add
`robert@blastbeat.education` with ImprovMX's SMTP server. Then replies come
*from* the brand address instead of the personal Gmail.

---

## Phase 2 — outbound auto-replies from the website (later)

`netlify/functions/submission-created.mjs` can auto-reply to every form
submission and alert the team, but only when `RESEND_API_KEY` is set. That
needs:

1. A resend.com account, domain `blastbeat.education` verified there
   (Resend gives its own DNS records — DKIM on a subdomain, safe alongside
   Phase 1).
2. Site env vars (see docs/ADMIN-BACKEND.md for the env-var gotcha —
   standard vars, **not** "secret"):
   - `RESEND_API_KEY` — from the Resend dashboard.
   - `TEAM_NOTIFY_EMAILS` — set to working inboxes, e.g.
     `ttncube01@gmail.com,rilstephenson@gmail.com` (the defaults point at
     @blastbeat.education, which is exactly what Phase 1 fixes — but set
     this explicitly anyway).
3. A redeploy (any merge to main).

Until Phase 2, form submitters get no auto-reply, but every submission is
still captured in Admin → Leads and the Netlify Forms dashboard.
