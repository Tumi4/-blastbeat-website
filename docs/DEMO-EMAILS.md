# Demo signup — email flow

The signup form at **blastbeat.education/demo** drops submissions into the
Netlify Forms inbox. From there two emails fire automatically (see
`netlify/functions/submission-created.mjs`):

1. **Auto-reply to the submitter** — confirms the request, sets the
   one-business-day expectation, and (audience-aware) hints what kind of
   demo we'll send them into.
2. **Team alert to Robert + Tumelo** — a structured summary with the
   audience tag and the submitter's focus, so the right person can pick
   it up.

Robert or Tumelo then send the **welcome-with-code** email (templates
below) personally, including the actual access code Trixta has issued.

## Setup checklist (one-time, 10 minutes)

These are the only steps that have to happen outside the codebase.

### 1. Resend account + DNS

[resend.com](https://resend.com) → sign up → add domain
`blastbeat.education`. They give you a CNAME (and optionally TXT records
for SPF/DKIM). Add them at your DNS provider. Verify the domain in
Resend (one click once DNS propagates, usually under 10 min).

### 2. Set Netlify env vars

Site settings → Environment variables → add:

| Key | Value |
|---|---|
| `RESEND_API_KEY` | The key from Resend → API Keys (starts `re_...`) |
| `RESEND_FROM` | `Blastbeat <noreply@blastbeat.education>` (optional, this is the default) |
| `TEAM_NOTIFY_EMAILS` | `robert@blastbeat.education,tumelo@blastbeat.education` (CSV, optional, this is the default) |

Redeploy (Netlify → Deploys → Trigger deploy). The function picks up the
env vars on the next cold start.

### 3. Confirm Netlify Forms is set up

Site settings → Forms. Confirm `demo-access-request` is listed (it should
appear automatically after the first successful submission). You can
test by submitting the form on the deploy preview.

### 4. Belt-and-braces: built-in Netlify notification

Netlify also offers built-in email notifications, in case the function
ever fails. Site settings → Forms → Form notifications → Add notification
→ Email → set the trigger to `demo-access-request` and the recipient to
`robert@blastbeat.education`. This is redundant by design; it costs
nothing and guarantees Robert sees every submission.

## What the auto-reply says (per audience)

The function picks one of these flavours based on the audience dropdown:

| Audience | Flavour line |
|---|---|
| Principal / Head Teacher | "We'll send a code that opens the educator side so you can see what the cohort actually sees." |
| HOD / Curriculum lead | "We'll send a code that surfaces the role-and-curriculum map first." |
| Teacher / Facilitator | "...drops you into the cohort dashboard the way a facilitator uses it." |
| Sports club / Federation | "...the FootBeat lane so you can walk the tournament + business side." |
| Sponsor / CSR / ESG | "...highlights the credential, the impact report and the 75/25 climate split." |
| Foundation / Funder | "...highlights the audit trail, the verifiable credential and the climate ring-fence." |
| Government / Ministry | "...highlights the framework alignment and the SDG mapping." |
| Journalist / Researcher | "...a code and a short brief covering history, real numbers and a few case studies." |
| Education consultant | "...a short brief on the curriculum mapping you can show your clients." |
| Parent | "...a short note explaining what your child would actually do, week by week." |
| Student (18+) | "...straight into the student view." |
| Other | "...with a short note about what we think will be most useful." |

Robert/Tumelo can edit any of these by editing
`netlify/functions/submission-created.mjs` — the `flavour` map.

## Welcome-with-code templates (Robert / Tumelo, manual)

These are sent AFTER the auto-reply, by hand, with the real code. Pick
the one that matches the audience.

### Template A — Principal / HOD / Teacher

Subject: **Your Blastbeat V2 access — code inside**

> Hi {First name},
>
> Welcome — your access code is **{CODE}**.
>
> Log in at **demo.blastbeat.com** with that code. You're in as an Educator,
> which means you can also switch to a Student view to see what your cohort
> would see. The demo cohort is a real anonymised team running a real event;
> nothing is faked.
>
> A few things to look at first:
> 1. The cohort dashboard — what your week looks like.
> 2. The 14 student roles — pick a Content Creator and walk their view.
> 3. The climate ring-fence (25%) — see how a team chooses a project.
>
> No time limit. Take it at your pace.
>
> If you'd like one of us to walk you through it on Zoom, I'm happy to book
> 20 minutes — reply with two times that work in your week.
>
> Warmly,
> Robert / Tumelo

### Template B — Sponsor / CSR / Foundation

Subject: **Your Blastbeat V2 access — code inside**

> Hi {First name},
>
> Welcome — your access code is **{CODE}**.
>
> Log in at **demo.blastbeat.com**. You're in as an Educator (so you can
> see everything), but I'd start at the **credential** screen — every cohort
> sits inside a W3C Verifiable Credential issued by Climate Actions Now.
> Scan the QR or open verify.blastbeat.education/{credential-id} to see
> the audit trail.
>
> From a CSR/ESG point of view: the **75/25 climate ring-fence** view and
> the **impact report** are the screens that map cleanly onto ESG narrative
> packs (SDG 4, 8, 13 directly).
>
> If you'd like Robert or me to walk you through it on a 20-minute Zoom —
> say so and we'll book.
>
> Warmly,
> Robert / Tumelo

### Template C — Government / Ministry

Subject: **Your Blastbeat V2 access — code inside**

> Hi {First name},
>
> Welcome — your access code is **{CODE}**.
>
> Log in at **demo.blastbeat.com**. You're in as an Educator. From your
> seat the most useful screens are likely:
>
> 1. The **framework alignment** view — how cohorts map to local
>    development plans and the UN SDGs (4, 8, 13).
> 2. The **safeguarding** layer — guardian consent, age band, data
>    jurisdiction the school controls.
> 3. The **impact report** — verifiable outcomes per cohort.
>
> If you'd like a walk-through on Zoom — and to include any officials you
> want present — say so and we'll book it in {your timezone}.
>
> Warmly,
> Robert / Tumelo

### Template D — Journalist / Researcher

Subject: **Your Blastbeat V2 access + press brief**

> Hi {First name},
>
> Welcome — your access code is **{CODE}**.
>
> The demo lives at **demo.blastbeat.com**. The short brief is below; the
> longer doc is attached.
>
> **The story in one sentence:** Twenty-three years of running real youth
> Event Social Enterprises across 11 countries; the V2 platform makes the
> licence verifiable on-chain (W3C VC, SHA-256), so the impact is auditable
> instead of marketed.
>
> Two case studies to look at in the demo: the Tekkers → Rhodes High
> founding licence (Cape Town), and the Japan chapter (independent NPO,
> 17 years, ~900 alumni, 122 mini music companies).
>
> Happy to do a 20-minute call. {two-times offer}
>
> Warmly,
> Robert / Tumelo

### Template E — Parent

Subject: **Your Blastbeat V2 access — code inside**

> Hi {First name},
>
> Welcome — your access code is **{CODE}**.
>
> Log in at **demo.blastbeat.com**. The clearest view of what your child
> would actually do, week by week, is in the **Student journey** screen —
> click any role to see what that student's term looks like.
>
> The 25% climate ring-fence is the bit most parents tell us they like —
> it's how the programme connects what their child learns to something the
> child cares about outside school.
>
> If anything's unclear, I'll happily walk you through it on a quick call.
>
> Warmly,
> Robert / Tumelo

---

## Future: GTM event → CRM

The submit handler also fires `bbTrack('demo_access_requested', { audience,
region, source })`. Once `GTM_ID` is set in `assets/js/analytics.js`, that
event will land in GA4 and (via GTM tags) any CRM destination we wire up
later. For now the Netlify Forms inbox is the persistent record.
