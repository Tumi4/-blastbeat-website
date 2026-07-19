# LinkedIn Main Campaign 2026 — the link stack

**Campaign:** `linkedin-main-2026` · **Owner:** Tumi · **Posts:** Robert's personal LinkedIn
(per docs/UTM-CONVENTIONS.md, `utm_source=linkedin`, `utm_medium=social`)

## The rule

**Never paste a bare page URL into LinkedIn.** Always use one of the `/go/…`
links below. Each one expands to the right page with the full UTM set *and* a
`ref` code, so every enquiry that follows carries a **REF li-…** tag straight
into the admin **Leads** view — attribution works today, with or without
Google Analytics.

## The links

| Use it for | Short link | Lands on | Lead tag |
|---|---|---|---|
| LinkedIn profile "website" field | `blastbeat.education/go/li` | Homepage | `li-profile` |
| Posts aimed at principals / teachers | `blastbeat.education/go/li-schools` | For Schools | `li-schools` |
| "Apply now" call-to-action | `blastbeat.education/go/li-apply` | Apply form | `li-apply` |
| Posts aimed at corporate sponsors / CSR | `blastbeat.education/go/li-sponsors` | 2winAid | `li-sponsors` |
| Founders' Circle / patron posts | `blastbeat.education/go/li-patrons` | Patrons | `li-patrons` |
| Investor / funder conversations | `blastbeat.education/go/li-invest` | Pitch | `li-invest` |
| "See it live" demo call-to-action | `blastbeat.education/go/li-demo` | Demo access | `li-demo` |

(Underneath: 302 redirects in `netlify.toml`. `https://` and `www.` both work.)

## How the tracking flows

1. Someone clicks a `/go/li-…` link in a LinkedIn post.
2. The site stores the `ref` code for 30 days (`assets/js/analytics.js`).
3. Whatever form they eventually submit — apply, demo, sponsorship, partner,
   contact — carries that code (`referral` field, every main form has one).
4. The lead appears in **Admin → Leads** with a **REF li-…** chip, typed by
   audience (Sponsor / Investor / School / …), and in the team-alert email.
5. When GA4/GTM goes live (set `GTM_ID` in `assets/js/analytics.js`), the same
   UTMs light up there retroactively-consistent — no relinking needed.

So: **which post produced which lead** is answerable from the Leads tab alone.

## Optional: Bitly overlay

For click *counts* (before anyone fills a form), wrap the `/go/…` links in
Bitly. Keep the `/go/…` link as the destination so UTM + ref survive. The
short links created for this campaign are listed at the bottom of this doc
once minted.

## Measuring

- **Clicks** → Bitly dashboard (if used) or Netlify Analytics.
- **Leads by post audience** → Admin → Leads, filter chips + REF tags.
- **Signed deals from the campaign** → issue the licence with the partner
  field blank but keep the lead's REF trail in notes; or, for ambassador
  deals, the existing `/r/<slug>` flow is untouched and takes precedence
  (a later `/r/` click overwrites the stored `li-…` ref, correctly crediting
  the human closer over the ad click).
