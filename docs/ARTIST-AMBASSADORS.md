# CAN Music Artist Ambassadors — how the programme runs

An invitation-only ambassador track for artists in the CAN Music family.
Robert issues every invitation personally; every ambassadorship is tied to
a live music campaign with a sales goal; commission is **25% of every
founding licence raised** (the canonical ambassador rate — same as the
Tekkers→Puma ledger entry: R3,056 = 25% of R12,225).

## The integrity rule (non-negotiable)

**Nobody is named publicly as an ambassador until they have accepted AND
Robert has countersigned.** Invite pages are private (noindex, sent by
URL); the public programme page names no artists. This is the same rule
that governs school naming — no claims before consent.

## The pieces

| Piece | Where | Status |
|---|---|---|
| Public programme page | `/pages/artist-ambassadors.html` (clean URL `/artist-ambassadors`) | Live, indexable, names nobody |
| Private invite pages | `/pages/invites/<slug>.html` (clean URL `/invite/<slug>`) | noindex — Robert sends the URL personally |
| Trackable links | `/r/<slug>` → partners page with `?ref=<slug>` + UTM | Live for any slug, no per-artist setup |
| Attribution | `analytics.js` stores the ref 30 days, stamps it into any form with `input[name="referral"]` (demo + sponsorship forms carry one) | Live |
| Acceptance flow | Netlify form `artist-ambassador-accept` → auto-reply + team alert via `submission-created.mjs` | Live (sends once RESEND_API_KEY is set) |
| Private dashboards | Blastbeat V2 app (Trixta) | Later — static site only ever shows public-safe numbers |

## Founding cohort (invites drafted, NOT yet public)

| Artist | Invite URL | Reserved link |
|---|---|---|
| Sir Kisoro | `/invite/sir-kisoro` | `/r/sir-kisoro` |
| TIA Kids | `/invite/tia-kids` | `/r/tia-kids` |
| Shack | `/invite/shack` | `/r/shack` |

Robert sends each invite URL personally (WhatsApp or email — his voice,
not a blast). The page carries the terms; the accept form captures their
campaign, goal, and consent to be announced.

## When an artist accepts

1. Team alert lands (subject: "ARTIST AMBASSADOR ACCEPTED — ... — needs
   Robert's countersign").
2. **Robert countersigns** — a short personal reply from him makes it real.
3. Tumelo adds them to `data/programme-data.json` → `ambassadors` with
   their campaign + goal, and runs `node scripts/gen-programme-data.mjs`
   (they only enter the public bundle AFTER countersign — the generator's
   leak check protects everything else).
4. Publish their **public campaign page** (campaign story, goal meter,
   their `/r/` link) — public by design, so no privacy issue.
5. Announce — now, and only now, they can appear on
   `artist-ambassadors.html` as founding ambassadors.

## Adding a new artist later

1. Copy any file in `pages/invites/`, personalise name/intro/campaign
   hint/slug (keep `noindex` and the honeypot).
2. Their `/r/<new-slug>` and `/invite/<new-slug>` URLs work immediately —
   the redirects are wildcards.
3. Send Robert the invite URL to pass on.

## Why dashboards wait for the V2 app

The site is static: anything a page loads is world-readable (see the
launch-audit finding on programme-data). So per-artist private dashboards
need real auth — that's the Trixta V2 app. Until then artists get their
public campaign page (shareable, which they want anyway) and the ledger
lives in /admin.
