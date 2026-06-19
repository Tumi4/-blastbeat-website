# BlastBeat V2 — Programme Data Update · Claude Code Handoff

**Purpose:** give Claude Code (connected to the BlastBeat repo) everything it needs to replace the
invented placeholder data with the **real schools, sponsors, pipeline, pricing and worked example**,
across the whole stack — dashboards, the sponsor console, and the licence templates.

> **TL;DR for Claude Code:** `programme-data.json` (in this folder) is the single source of truth.
> Make every dashboard, console and licence template read from it (or match it exactly). Delete the
> old worked example (**Ikageng Secondary / Meridian Foundation / Greenfield Community College**)
> everywhere. The real worked example is **Tekkers funds Rhodes High School, Puma co-sponsors,
> twinning the Makhulong cohort (Limpopo).**

---

## 1. What changed and why

The repo shipped with two data sets:

| | Old (placeholder) | New (real) |
|---|---|---|
| Schools | Ikageng, Makoko, Kibera, Accra Ridge, Kampala… (invented, pan-African) | The real cohort: 9 Western Cape **heritage** schools, 3 **SA pilot** (BLASC, CAMST, Rhodes), 4 **Namibia** districts, 5 **Black Coffee** proposal schools |
| Sponsors | Meridian Foundation, Savannah Telecom, Gold Coast Ventures… (invented) | Tekkers, Puma, Eduponics, FootBeat, NIPDB/Brand Namibia, Black Coffee Foundation + a full pipeline universe (legacy, SA corporate, SA foundations, Namibia, Ireland grants, connectors) |
| Worked example | Greenfield (UK) ↔ Ikageng (SA), sponsor Meridian | **Tekkers → Rhodes High School** (Mowbray, Cape Town), co-sponsor **Puma**, twin **Makhulong cohort** (Limpopo) |
| Currency | €1,250 (mixed) | **ZAR R12,225** SA founding rate (ops/console). €1,250 stays ONLY on outward marketing as the Africa-pilot 50% rate |

**Two prices are both correct — do not merge them.**
- **R12,225 (ZAR)** — the founding SA *licence* rate. Used by the operations dashboard, sponsor console, and all licence/credential documents.
- **€1,250 (EUR)** — the Africa-pilot *marketing* rate (50% off €2,500). Used ONLY on outward marketing (flyer, magazine, posters). Leave those as-is.

---

## 2. The canonical data file

**`programme-data.json`** (this folder) contains, fully populated:

- `org` — Climate Actions Now entities (UK charity 1113530, RSA, Irish reg), 23 yrs / 360k+ / 19 countries.
- `pricing` — licence R12,225, prize from R2,500, event from R10,000, TwinAid from R12,225/cohort, ambassador 25%. Plus the separate `africa_pilot_marketing` €1,250 note.
- `issuing_entity_by_region` — SA & Namibia → Climate Actions Now RSA; UK → UK charity.
- `schools` (21) — each `{id, name, area, region, group, note, lead?}`. Groups: `heritage` (9), `pilot` (3), `namibia` (4), `proposal` (5).
- `school_groups` — labels/blurbs/tones for the four groups.
- `sponsors` (8) — `{id, name, brand, region, roles[], journey, note, founding?}`.
- `licences` (9) — `{seq, credentialId, sponsorId, schoolId, role, tier, amount, status, validFrom, validUntil, twinCohort, twinLoc}`.
- `cohort_target` — 20 (Pilot cohort target).
- `tiers` (5) — medallion tiers, ids align with `licence/bb-medallion.js`.
- `ambassadors` — referral ledger (25% share).
- `sponsor_pipeline` — `categories` + `entries` (the full funder universe: legacy, sa-corp, sa-found, namibia, ireland, connector).
- `activity` — recent activity feed.

IDs are stable keys — use them for joins (`licences[].schoolId` → `schools[].id`, `licences[].sponsorId` → `sponsors[].id`).

---

## 3. Where the data is consumed in the repo (update all of these)

| File | Role | What to do |
|---|---|---|
| `programme-console/dashboard/data.js` | **MASTER** — already the real data as a JS module (`window.BB_PROGRAMME`) | Keep as the runtime source, or regenerate it from `programme-data.json`. They already match. Wire to the live credential API in production (field names map 1:1). |
| `styles/dashboard-data.js` | Root **Programme Operations** dashboard roster + renderers | Now mirrors the real 9-licence roster in ZAR. Long-term: have it import the same JSON instead of a hand-kept `ROSTER` array. |
| `programme-dashboard.html` | Root dashboard shell | Header, activity feed and twinning panel now use real names. Counts come from `dashboard-data.js`. |
| `programme-console/dashboard/index.html` + `app.js` | Sponsor console (overview, sponsors, licences, twinaid, benefits, ambassadors, schools, assets) | Already reads `BB_PROGRAMME`. No placeholder data here — it was always real. |
| `licence/*.html` | Credential + document templates | Worked example swapped to **Tekkers · Rhodes High · Puma · Makhulong cohort**. Fields tagged `.var` / `data-field="…"` are the merge points — wire to live credential data. |

### Licence template merge fields (drive from the credential API, not hard-coded)
`schoolName`, `schoolLocation`, `sponsorName`, `tier`, `validFrom`, `validUntil`, `credentialId`,
`twinCohort`, `twinLoc`, `amount` (ZAR). The verify route has three states (valid / expired / not-found) —
see `design_handoff_blastbeat_v2/README.md` §5 for the spec; remove the dev preview switcher in prod.

---

## 4. Suggested Claude Code prompt

> "Read `claude-code-handoff/README.md` and `claude-code-handoff/programme-data.json`.
> 1. Make `programme-data.json` the single source of truth for programme data in our app. Generate the
>    dashboard/console data module from it (or load the JSON directly) so there is no hand-kept roster.
> 2. Confirm no placeholder names remain anywhere in the repo: search for `Ikageng`, `Meridian`,
>    `Greenfield`, `Savannah Telecom`, `Gold Coast Ventures`, `Makoko`, `Kampala Innovators`,
>    `Accra Ridge`, `Bristol` — there should be zero hits.
> 3. Wire the licence/credential templates' merge fields to our live credential API; keep ZAR R12,225 as
>    the licence rate and leave the €1,250 Africa-pilot rate only on outward marketing.
> 4. Keep the two design systems separate (marketing neon vs credential institutional-blue) per
>    `design_handoff_blastbeat_v2/README.md`."

---

## 5. Open items / decisions for Robert

- [ ] **Namibia schools** — 4 districts agreed in principle, schools not yet named (subject to MoE). Names are `Windhoek District 1–4 — school TBC` until confirmed.
- [ ] **Black Coffee Foundation** — 5 KZN / Eastern Cape schools are **proposal stage, not confirmed**. Flagged as `group: "proposal"`.
- [ ] **Heritage 9** — warm/alumni relationships, not yet re-signed. Only Camps Bay has a (re-engagement) licence row so far.
- [ ] **Pricing confirm** — R12,225 founding rate vs €1,250 marketing rate: confirm the FX/positioning story before the conference.
- [ ] **Twin cohorts** — Makhulong (Limpopo), Tukwini (Eastern Cape), Soweto (Gauteng), Katutura (Windhoek), Mthatha (Eastern Cape) — confirm these are the real intended twins.
- [ ] **Signing authority** on certificates — currently "Robert Stephenson FRSA, Founder & CEO". Confirm.

---

*Generated for the BlastBeat V2 launch · Climate Actions Now · UK Reg. Charity 1113530 · blastbeat.education*
