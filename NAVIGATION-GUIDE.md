# Robert's Quick Navigation Guide
**Blastbeat Education website** — what's where, what to know, and where to look first.

> Last updated: 7 May 2026 — alongside the licence + sponsor production pass.

---

## 1. The 60-second tour

| URL | Page | The one thing to know |
|---|---|---|
| `/` | **Home** (`index.html`) | The entry door. Hero, three pricing paths, what's in every licence, blastbeat TV. |
| `/pages/licence.html` | **The Licence (Product 01)** ⭐ NEW | Premium page. Three certificate frames. International standards. Use this with sponsors and auditors. |
| `/pages/partners.html` | **Partners & Sponsorship** | Adopt-A-School marketplace, Seed/Growth/Impact/Portfolio packages, sponsor enquiry form. |
| `/pages/for-schools.html` | **For Schools** | The school-side pitch — funding paths, what's included, FAQ for principals. |
| `/pages/apply.html` | **Apply** | The application form for schools. Founding cohort 25% off CTA. |
| `/pages/programme.html` | **Programme** | The 14 ESE roles, MACC, FootBeat. The "what does Blastbeat actually do" page. |
| `/pages/about.html` | **About** | Story, founder, team, charter. |
| `/pages/impact.html` | **Impact** | Numbers — 360K students, 19 countries, 23 years, SDG mapping. |
| `/pages/international.html` | **International** | Global footprint, regional partners (NIPDB Namibia etc). |
| `/pages/macc.html` | **MACC** | Climate action module standalone deep-dive. |
| `/pages/footbeat.html` | **FootBeat** | Sports module standalone deep-dive. |
| `/pages/can.html` | **CAN** | Climate Actions Now — the parent charity context. |
| `/pages/student-journey.html` | **Student Journey** | 12-month learner timeline. |
| `/pages/media.html` | **Press Room** | Press kit, logos, stats, downloadable assets. |
| `/pages/contact.html` | **Contact** | Direct enquiry form, your email + phone. |
| `/pages/partners.html#enquiry-form` | Sponsorship enquiry form | The one form sponsors fill out. Goes to Netlify Forms. |
| `/pages/privacy-policy.html` | Privacy | UK GDPR + POPIA compliant copy. |
| `/pages/terms-of-use.html` | Terms | Legal. |
| `/pages/accessibility.html` | Accessibility | WCAG 2.2 AA statement. |
| `/blog/` | Blog index | Currently a single landing — add posts here. |
| `/thank-you.html` | Form thank-you | Where Netlify forms redirect after submission. |
| `/404.html` | 404 page | Branded not-found. |

**Friendly short URLs (Netlify redirects):**
- `/licence` and `/license` → the licence page
- `/sponsor` and `/sponsors` → the partners page
- `/verify` → the certificate samples (placeholder for the future verify registry)

---

## 2. ⭐ The Licence page — the bit you asked me to make premium

**File:** `pages/licence.html`

**Positioning:** The licence is **Product 01**. The whole programme is sold as one verifiable digital credential per school per year. Everything else (MACC, FootBeat, sponsorship, impact reports) either feeds Product 01 or flows from it.

**What's on it (in order):**

1. **Hero** — "Product 01" marker (lime + cyan badge), headline, the five trust chips (SKU, W3C VC, ISO 9001, UN SDG, UK Charity).
2. **Why this is Product 01** — split layout, with a **Product Catalogue** card showing 01–05 (the licence is 01, the modules are included, sponsorship is 04, the impact report is 05).
3. **Three Sample Certificates** — School (Class A), Sponsor-Adopted (Class B), International (Class C). Each has:
   - Holographic foil seal (top right, SVG-only)
   - Watermark text (BLASTBEAT / SPONSOR / INT'L) ghosted behind
   - Microtype / engine-turn border
   - Issuer block (CAN logo + UK Charity 1113530)
   - Class tag + unique licence ID `BBE-LIC-2026-{CLASS}-{NNNNN}`
   - Holder name & meta
   - 8-row metadata grid (Charter Ref, Issued ISO date, Valid Until, Renewable, Territory, Cohort, Modules, DID)
   - SDG + standard chips
   - Two signature lines (your name on the left, counter-signatory on the right)
   - Verify footer: QR-style block + verify URL + truncated SHA-style hash
4. **Anatomy** — 12 numbered credibility markers (Issuer, Class, Licence ID, Charter Ref, Holder, Dates, Territory, SDG, Signatures, Seal, DID+Hash, Verify URL).
5. **International standards** — W3C Verifiable Credentials, ISO 9001:2015, ISO/IEC 27001, UN SDG, UK Charity Commission, B-BBEE / SARS 18A, UK GDPR / POPIA, WCAG 2.2 AA.
6. **Verification flow** — six-step lifecycle (charter check → issuance → registry write → public verify → annual renewal → audit trail).
7. **Entitlements** — six glass cards covering ESE curriculum, platform, events, MACC+FootBeat, impact report, brand recognition.
8. **Two ways to get a licence** — direct (school-funded) or adopted (sponsor-funded), each linking to apply / partners.
9. **FAQ** — six questions (legal contract, verification, year-end, sponsor revocation rights, SA tax, why "Product 01").
10. **Final CTA** — Apply / Sponsor.

**A note on the metadata:** every ID, hash, DID and date on the sample certificates is **synthetic and clearly labelled "SAMPLE — FOR DISPLAY ONLY"** at the top of the section, plus a small disclaimer underneath. When you (or Climate Actions Now) actually issue real licences, you can replicate the same pattern with real registry data.

**Suggested licence ID format (I've used this throughout):**
```
BBE-LIC-{YEAR}-{CLASS}-{5-DIGIT-SEQ}
   e.g. BBE-LIC-2026-SCH-00142
        BBE-LIC-2026-SPN-00037
        BBE-LIC-2026-INT-00009
```

**Charter cross-reference (internal ledger):**
```
CAN/{YEAR}/{CLASS}/{5-DIGIT-SEQ}
   e.g. CAN/2026/SCH/00142
```

**DID (decentralized identifier, W3C VC compatible):**
```
did:bbe:{class}:{seq}
   e.g. did:bbe:sch:00142
```

---

## 3. The Sponsor page (`pages/partners.html`)

**Already strong — what I tightened in this pass:**
- Added **Licence** to the nav (so sponsors can see Product 01 in one click).
- Added a new lime-bordered callout block above the sponsorship packages: **"Each adoption issues one verified Blastbeat Licence"** with a CTA to the licence page sample.
- Added a third hero CTA: **"See the Licence"** alongside Adopt and Browse.
- Added "The Licence" to the footer Programme list.

**Sections in order:**
1. Hero — Sponsor a school, change a generation. R45,000 founding rate.
2. How Adopt-A-School works (3 steps)
3. **NEW: "What your sponsorship buys" callout → /pages/licence.html**
4. Sponsorship packages — Seed (R45K) / Growth (R202K, 5 schools) / Impact (R382K, 10 schools) / Portfolio (custom)
5. School marketplace — six demo school cards, one already "Fully Funded" by Coca-Cola
6. Why sponsor — BBBEE, Section 18A, verified impact, brand recognition, employee engagement, UN SDG
7. Legacy partnership tiers (Euro, Ireland/UK) — Gold / Silver / Community + In-Kind
8. Current partners bento — Coca-Cola, AIB, RTÉ, Western Cape Education, NIPDB Namibia
9. Sponsorship enquiry form (Netlify-wired, posts to `/thank-you.html`)
10. Final CTA strip

**To edit a school card:** see `pages/partners.html` ~lines 256–331. Each card is a `.school-card` block.

**To edit a package price:** see `pages/partners.html` ~lines 161–231 (`.adopt-tier-card` blocks).

---

## 4. Brand & design system — quick reference

**CSS files (all imported on every page):**
- `assets/css/blastbeat-design-system.css` — base tokens, typography, layout, buttons, forms, footer
- `assets/css/gen-z.css` — neon palette, glass cards, hero treatments, certificate-friendly utilities, school cards
- `assets/css/mobile.css` — responsive overrides

**Brand palette (from `gen-z.css`):**
| Token | Hex | Use |
|---|---|---|
| `--neon-pink` | `#FF2D78` | accent, alerts |
| `--neon-cyan` | `#00F5FF` | links, info |
| `--neon-lime` | `#B8FF00` | primary CTA accent, success |
| `--electric-purple` | `#A855F7` | premium accents |
| `--electric-blue` | `#6366F1` | brand primary |
| `--deep-navy` | `#0F0F1A` | dark background |

**Type:**
- **Headings:** `Space Grotesk` (700/800)
- **Body:** `DM Sans` (400/500/600)
- **Mono (licence IDs, codes):** `IBM Plex Mono` — newly imported on the licence page

**Reusable visual primitives:**
- `.bb-cert` — the certificate frame (scoped to `pages/licence.html`)
- `.glass-card` — frosted card
- `.gradient-border` — multicolor outline
- `.neo-tag` / `.neo-tag-pink` / `.neo-tag-cyan` — chunky tags
- `.text-chunky` — display headings
- `.text-gradient-vivid` / `.text-gradient-aurora` / `.text-gradient-sunset` — multi-stop text gradients
- `.orb` — soft blurred background blobs
- `.bg-mesh` — gradient mesh background
- `.adopt-tier-card`, `.school-card` — pricing/marketplace cards
- `.fab-badge` — bottom-right floating "Apply Now"

---

## 5. Forms — where do submissions go?

All forms are wired to **Netlify Forms** (`data-netlify="true"`):

| Form | Page | Form name |
|---|---|---|
| Sponsor enquiry | `pages/partners.html` | `sponsorship-enquiry` |
| School application | `pages/apply.html` | check the form name attribute |
| Contact | `pages/contact.html` | check the form name attribute |

To see submissions: log into Netlify → site → **Forms**.

All forms redirect to `/thank-you.html` on success.

---

## 6. Compliance & legal — what's already on the site

- **Issuer of record:** Climate Actions Now, UK Registered Charity No. **1113530**
- **Data protection:** UK GDPR + POPIA — copy in `pages/privacy-policy.html`
- **Terms:** `pages/terms-of-use.html` — covers brand IP for Blastbeat / MACC / FootBeat / CAN names
- **Accessibility:** `pages/accessibility.html` — WCAG 2.2 AA target
- **Cookies:** banner injected by `assets/js/cookie-consent.js`
- **Legal/compliance block on every page:** in the footer (charity number, GDPR/POPIA badge)

---

## 7. The "Product Catalogue" mental model

```
01  THE BLASTBEAT LICENCE              ← Flagship. Everything ladders here.
02  MACC Climate Action Module          ← Bundled inside 01
03  FootBeat Sports Module              ← Bundled inside 01
04  Adopt-A-School Sponsorship          ← Funds 01
05  Annual Impact & ESG Report          ← Output of 01
```

Reflected literally in the Product Catalogue card on `pages/licence.html`. Use this language with sponsors — it's far more legible than "the programme."

---

## 8. Things I noticed worth your attention (not changed — for your call)

These are observations from the pass, surfaced so nothing surprises you:

1. **`/verify` redirect** points to the licence sample section. There is **no real verification registry** yet. If a real sponsor or auditor scans a real licence's QR, they need a real verify endpoint. This is a future build (a `/pages/verify.html` lookup tool, or a serverless function reading a JSON registry). Worth scoping next.
2. **Real licence IDs are not yet minted** — the format is decided (`BBE-LIC-YYYY-CLASS-NNNNN`) but no source of truth exists. Recommend a simple Google Sheet or Airtable as the v1 registry, then promote to a database when volume warrants.
3. **Signatures on samples** are typeset, not actual handwriting. For the production version of *real* certificates, you may want to embed an SVG of your signature.
4. **Footer social links** on every page point to `#` (placeholders). LinkedIn / Instagram / X / YouTube URLs need filling in. Search the codebase for `aria-label="LinkedIn"` to find them quickly.
5. **`og:image`** uses a Netlify preview domain (`blastbeat-education.netlify.app`) on most pages. When the canonical domain `www.blastbeat.education` is live, replace with the canonical URL.
6. **Blog** has only an index — no posts yet. Worth at least one launch post that links the licence page from inside (Robert's POV: "Why I'm calling the licence Product 01").
7. **School marketplace cards** are hardcoded. Six schools listed. Becomes friction once real schools start applying — recommend moving to a JSON file the page renders from, then a CMS, then Netlify Identity for school self-edit.
8. **Verify QR codes** on the certificates are visual placeholders (CSS-only). Real QR generation (encoded with the licence's verify URL) is a one-line `qrcode.js` add when the registry is live.
9. **Robert's email** (`robert@blastbeat.education`) appears on the partners page but `info@blastbeat.education` is the general footer address. Both work; just flagging for consistency.
10. **Founding rate "until 31 December 2026"** is hardcoded on partners/for-schools. Add a calendar reminder for ~Q4 2026 to update or extend.

---

## 9. How to make common edits

### Update the founding-rate price
Search the codebase for `R45,000` / `R45K` / `€2,500`. Currently in: `index.html`, `pages/partners.html`, `pages/for-schools.html`, `pages/apply.html`, `pages/licence.html`.

### Add a new sponsored school to the marketplace
`pages/partners.html` — copy a `<div class="school-card">…</div>` block (~line 256) and edit name, location, learner count, status badge.

### Add a new partner logo to the bento
`pages/partners.html` — `.bento-item` blocks ~line 510. Each is a coloured div; replace with `<img>` once you have logos.

### Update the certificate samples
`pages/licence.html` — search for `BBE-LIC-2026-SCH-00142` (etc.) to find each certificate's metadata block.

### Change a price across the site
`grep -rn "R45,000" pages/ index.html` — quickest cross-page sweep.

### Add a new page to navigation
The nav block lives at the top of every HTML file (currently NOT a shared partial). To add a link to all pages, you'll need to edit each file's `<ul class="bb-nav-links">` and `<div class="bb-nav-mobile">` blocks. Long-term: extract to includes via Eleventy / Astro / a build step.

---

## 10. Deploy & preview

- **Host:** Netlify
- **Build:** static — no build step, just push and deploy
- **Branch deploys:** every branch gets a preview URL; Netlify will comment on the PR
- **Production branch:** `main` (verify in `netlify.toml`)
- **The current branch:** `claude/polish-license-sponsor-pages-GOWlf` — review the licence + sponsor work here before merging to main

---

## 11. One-liner for sponsors

> "Blastbeat is sold as one verifiable digital licence per school per year — issued by a UK Charity, mapped to the UN SDGs, and aligned with W3C Verifiable Credentials. Adopt-A-School lets a corporate sponsor cover the licence; the school never pays."

That's the elevator pitch the licence page is built around.

---

**Questions on any of this — or want anything restructured — say the word.**
