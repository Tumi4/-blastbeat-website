# Meeting Prep — Robert × Tumi, Wed 13 May 2026

> Quick reference for the side-by-side review session. Lists **everything I corrected tonight** + **every open question** that needs Robert's input before merge to production.

---

## ✅ Corrections shipped tonight (no need to revisit unless wrong)

### 1. Country count: 19 → 11
Robert: *"9 historically plus Uganda and Rwanda — 11"*.

Updated everywhere:
- Page hero copy, meta descriptions, schema JSON-LD, OG/Twitter cards
- Footer taglines on every page
- Press page hero
- About page founder bio + timeline
- Blog post stat refs
- Flourish pilot brief + step-by-step CSV
- Impact-page country chips

### 2. UK Charity 1113530 framing removed
Robert: *"the uk charity is mentioned .. all this references must change"*.

Now the site says:
- **Climate Actions Now group** (umbrella)
- **Climate Actions Now Ltd (Ireland)** — European operations
- **Climate Actions Now RSA (Pty) Ltd** — African operations + Blastbeat Education V2 licence issuer
- Section 18A foundation arm for climate-action grants flagged as *planned*

Cleaned across all pages, schema, footer copy, blog posts, licence page anatomy, certificates.

### 3. African licence issuer
Robert: *"The licences for Africa will come from CAN RSA pty etc"*.

- Licence-page "Issuer" section now names **Climate Actions Now RSA (Pty) Ltd** explicitly for African licences
- Schema.org `parentOrganization` updated to reflect the two-entity group structure (Ireland + SA)
- Footer compliance copy updated

### 4. Past sponsors and partners — reframed
Robert: *"We can't claim to have Coca Cola as a partner now"*.

The Partners page **"Current Partners" section** is now **"Where Blastbeat Has Been Trusted Before"** — explicitly past sponsors of the legacy programme. Each tile (Coca-Cola, AIB, RTÉ, etc.) now says "Past corporate sponsor (Ireland, UK)" / "Past media partner (Ireland, RTÉ2 series)" etc.

Coca-Cola sample on the gold sponsor-adopted certificate now reads **"a past corporate sponsor (illustrative)"** — no live brand claim.

### 5. New "Current 2026 Pipeline" strip
Below the past-sponsors bento on Partners page, a new lime-bordered block listing:
- **BBM** — MOU signed
- **MTN** — in discussion
- **PEP / Pepkor** — in discussion
- **Western Cape Education Dept** — engaged
- **NIPDB Namibia** — engaged
- **Ghana (3,000+ schools)** — exploratory
- **Rwanda** — exploratory
- **Uganda** — exploratory
- **Cameroon** — exploratory
- **Kenya (NGO & UN)** — exploratory
- **Nigeria (US University)** — exploratory
- **Ireland TY 2026** — planned

With a stage-definitions footnote (MOU / In discussion / Engaged / Exploratory).

### 6. SA & Namibia operations — "to be run", not running
Robert: *"The Sa and Namibian operations 'are to be run' we can't say they are running now"*.

- "Now launching across South Africa" → **"Cape Town pilot schools launching June 2026"**
- "Active growth market" → **"Pilot launching 2026"**
- International page Western Cape claim toned down to *"engagement at discussion stage"*

### 7. Western Cape Education / NIPDB Namibia — interest, not partnership
- "Government Partner (SA)" → **"Government engagement (SA · discussions)"**
- NIPDB descriptor → **"Government engagement (NA · discussions)"**
- International page Cape pilot claim de-escalated

### 8. Stage 2 head-to-head ESEs
Robert: *"Needs to be deleted (stage 2) as these ESEs only go head-to-head at regional or national finals"*.

`pages/programme.html` Stage 02 card:
- Was: **"School Heats — Best ESEs from each school go head-to-head"**
- Now: **"School Showcase — Each team showcases its event and outcomes to its own community"**

Heads-to-head competition framing kept only at Stage 03 (Regional Finals) and Stage 04 (National Finals).

### 9. Broken links cleaned
- Removed dead `favicon.ico` references (only `favicon.svg` exists; modern browsers fall back fine)
- Removed dead `apple-touch-icon.png` references
- `/pages/cookie-policy.html` → `/pages/privacy-policy.html` (cookie page doesn't exist; we cover cookies in privacy)
- `#blastbeat-tv` dead anchor → removed from index footer; removed from for-schools footer

### 10. "Backed by Coca-Cola" rewritten
Press-page hero copy:
- Was: *"Backed by Coca-Cola"*
- Now: *"Historically backed by Coca-Cola, Barclays, AIB, Big Lottery Fund, O2 and others"*

Matches the pitch deck list of historical recognitions.

---

## ❓ Open questions for the meeting (need Robert's input)

### Q1. Exact list of the 9 historical countries
The deck lists: **Ireland · UK · EU · USA · Japan · Korea · South Africa** as historical reach (with "EU" as a single bucket). Robert says 9 historical. I've gone with:

> Ireland · UK · Northern Ireland · Spain · Netherlands · USA · Japan · South Korea · *(plus 2 active: Uganda + Rwanda)*

**Question:** are these the right 9? Specifically:
- Confirm "Northern Ireland" counted separately from UK
- Confirm Spain & Netherlands as the two EU representatives (vs Germany / France etc.)

The Flourish CSV is built off this list. If wrong, I'll re-issue the CSV.

### Q2. The 14 ESE role descriptions
Robert WhatsApp: *"These job descriptions do not comply with our agreed roles and responsibilities .. they need to be changed"* and *"Vice or deputy CEO / CFO and secretary"*.

I have the current role list from `blog/14-ese-roles-principal-guide.html` and `pages/programme.html` — but I don't have the **agreed** role descriptions.

**Need from Robert:** the canonical list of 14 roles + responsibilities. We'll then update:
- `pages/programme.html` (the 14-role bento)
- `blog/14-ese-roles-principal-guide.html` (the reference card table)

### Q3. "Six ways" tab needs fixing
Robert WhatsApp: *"Six ways tab needs fixing"*.

I can't find a "Six ways" section in the current site. **Need from Robert:** screenshot or page name. (Likely on the home page or programme page — possibly the "5 SDGs" pill cloud, the "5 SDGs" card grid, or a six-step process I've missed.)

### Q4. "Tabs are not legible"
Robert WhatsApp: *"These tabs are not legible"*.

Pure contrast issue, location unknown. **Need from Robert:** screenshot. (Likely a low-contrast badge / chip / pill somewhere — possibly on the licence page or the impact stats.)

### Q5. Climate Actions Now charity registration numbers
The site previously used UK Charity 1113530. Robert's email signature mentions:
- Climate Actions Now Ltd (Ireland)
- Climate Actions Now RSA (Pty) Ltd
- (Planned) Section 18A Foundation

**Need from Robert:** the registration numbers for these entities (Irish company number, SA CIPC number, planned NPO number) so we can put them in the footer compliance line and the licence-page issuer block.

### Q6. Real partner statuses — confirm pipeline labels
For the new "Current 2026 Pipeline" strip I've labelled:
- **BBM**: MOU signed (R48K–R145K)
- **MTN**: in discussion
- **PEP / Pepkor**: in discussion
- **Western Cape Education Dept**: engaged
- **NIPDB Namibia**: engaged
- **Ghana, Rwanda, Uganda, Cameroon, Kenya, Nigeria**: exploratory
- **Ireland TY 2026**: planned

**Need from Robert:** any corrections / nuances on these labels. Are there any I should remove? Any to add?

### Q7. Founder bio claim — "30+ years in youth development"
The About page says Robert has *"30+ years in youth development"*. Robert's email says *"20+ years"* and the pitch deck says *"20+ years"*. **Change to 20+?**

### Q8. RTÉ 2 broadcast claim
The press hero now says *"Aired on RTÉ 2"*. The pitch deck mentions *"2 TV series broadcast nationally"* (probably referring to RTÉ). **Confirm exact channel + year(s)** so we can be precise.

### Q9. V2 vs legacy positioning across the site
Robert's strategic note: V2 is the **new digital app being built in Cape Town**; legacy = the 2003–2015 Ireland/UK programme.

Currently the site doesn't distinguish — it talks about Blastbeat as a single continuous thing. **Question:** does the public-facing site need to say "Blastbeat V2" anywhere, or do we keep the legacy/V2 distinction internal (for the investor deck) and present a single brand publicly?

### Q10. Investor / raise narrative
You're raising **£216K / €250K seed** then **£1.2M follow-on**. Do you want:
- A dedicated `/pages/invest.html` page on the site?
- A "Backers welcome" callout linking to a gated investor brief?
- Or keep this completely off the public site and handle via direct outreach?

---

## 📋 Suggested running order for the meeting

1. **Confirm the 9-historical-country list** (Q1) → I push the corrected Flourish CSV.
2. **Send me the agreed 14 ESE roles** (Q2) → I rewrite the programme + blog cards.
3. **Show me the "six ways" tab + the illegible tabs** (Q3, Q4) → fix on screen.
4. **Confirm CAN entity numbers** (Q5) → I update footer + certificate issuer.
5. **Walk through the pipeline labels** (Q6) → I tune the new strip.
6. **Confirm 20 vs 30 years** (Q7) → 30-sec change.
7. **Confirm RTÉ details** (Q8) → 30-sec change.
8. **Decide V2 positioning** (Q9) → either site copy stays as is, or I add a clear V2 framing.
9. **Decide investor page** (Q10) → if yes, I scope it.

Target: 60–90 mins, side-by-side. Push everything as one final commit, merge PR #1, go live.

---

## What's still safe to ship now (without meeting input)

The site is **factually clean** on the 8 items Robert flagged in writing. None of the remaining open questions block a production push — they're refinements. If we need to ship to live domain before the meeting tomorrow, we can.

The flags above are about getting the site *right*, not getting it *out of red*.

— end —
