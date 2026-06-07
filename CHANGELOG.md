# Changelog

All notable changes to the Blastbeat website and admin. Newest first.

The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).
Versions correspond to commit ranges on the `claude/polish-license-sponsor-pages-GOWlf` branch.

---

## 2026-06-05 — Admin polish + handover

### Added
- **Admin tour bumped 6 → 8 steps.** New steps walk through the PDF
  certificate and the partner Kit/Welcome buttons. Tour key is now
  versioned (`bb-admin-tour-done-v2`) so existing users see the new
  tour once on next login.
- **Partner attribution end-to-end.** Optional partner field on the
  licence issue modal (datalist-backed from the partners table); on
  match, the partner's `signed` + `owed` auto-update. `referredBy`
  stamped into the VC and locked into the SHA-256 proof.
- **Per-partner referral-code rotation.** New 🔄 button in the
  partners table; confirms before invalidating the old kit URL.
- **Welcome mailto validation.** Toast + abort if the partner has no
  email saved.
- **Bulk-export partner kits (CSV).** New Settings card. CSV includes
  id, name, email, type, refCode, status, signed, owed, kit_url,
  welcome subject.
- **Multi-currency commission calculator** on `partner-resources.html`
  — EUR / ZAR / GBP / USD / NAD with FX rates matching the site-wide
  currency converter.
- **Verify-page admin shortcut** — when `/verify/<id>` loads on a
  browser holding the admin store, the licence is auto-loaded and
  verification runs immediately. Same-origin localStorage means
  sponsors get the manual paste flow unchanged.
- **Overview gets a new stat** — "Licences this month" + sub-line
  "N via partner referrals". Cryptographically attributable.

### Changed
- `proposal-engine-kit/facts.seed.json` — `_meta` expanded with
  source_url conventions and review cadence. Sprint-duration ambiguity
  sharpened: now lists three explicit Tumelo decision options rather
  than just flagging the conflict.
- Verified `Climate Actions Now Ltd` (UK Charity 1113530) now links
  directly to the Charity Commission's deep-link page rather than the
  search index.

### Added (proposal engine kit)
- **Five `DRAFT-READY` framework entries** in `government_frameworks`:
  South Africa NDP 2030, South Africa CAPS, UN SDGs, AU Agenda 2063,
  Namibia NDP6.
- **Four `STUB-AUTHOR-REQUIRED` framework entries**: Rwanda Vision
  2050, Ghana Beyond Aid, Nigeria NDP 2025, Japan Society 5.0. Each
  has `candidate_sources` pointing at the right ministries. The
  verifier `verifier_action: "refuse"` until a human author + reviewer
  fills in the mapping — alignment claims for those countries are
  blocked at the engine level.

### Docs
- New `docs/SETUP.md` — consolidates every external-action handover
  item into one copy-paste-ready guide.
- New `CHANGELOG.md` (this file).

---

## 2026-06-04 — Verify route + conversion events + partner cross-links

### Added
- **`/pages/verify.html` + `/verify/*` redirect.** Public verification
  page. Sponsor pastes the licence JSON (or drops the file), browser
  recomputes the SHA-256 of the canonicalised credential body, reports
  ✓ Verified or ✗ Tampered. Self-contained — no network, no upload.
  "Try a sample" button for visitors who want to see the model work.
  Plain-English explainer of the cryptographic chain and the 2027
  roadmap to Ed25519 signatures.
- **`bbTrack('licence_issued', { tier, region, value, currency })`**
  on the admin issue handler — the headline revenue metric.
- **`bbTrack('partner_application_completed', { region, category })`**
  on the partner-program apply form.
- **Cross-links** between corporate Partners page and Reseller Program
  page so visitors who land on the wrong one have a one-tap path.

### Fixed
- `analytics.js` is now loaded in `admin/index.html` so admin events
  reach `dataLayer`.

---

## 2026-06-04 (earlier) — Admin: one-step licence issue + PDF certificate + partner cohort

### Added
- **One-step licence issue.** Issue modal's school `<select>` replaced
  with `<input list=>` + `<datalist>`. Robert types the school name;
  if it's new, the school record is auto-created on submit. Same for
  sponsor. Cuts the post-clear-samples flow from two-step to one-step.
- **PDF certificate button** in the licence preview modal. Opens a
  gold-on-cream A4 certificate (school, sponsor, tier, validity,
  issuer, QR pointing at /verify/<id>, first 16 chars of the SHA-256
  proof, signature line). Browser print → Save as PDF. No library
  dependency.
- **`/pages/partner-program.html`** — public sales page. Hero, the
  offer, five-step flow, full commission table, ideal-partner
  archetypes, FAQ, Netlify-Forms apply form with honeypot.
- **`/pages/partner-resources.html`** — private URL-personalised kit
  (noindex). Reads `?code=&name=&email=`. Generates the partner's
  six pre-tagged links, four sales scripts (cold-email × 2, WhatsApp,
  LinkedIn), live commission calculator, brand assets, printable A4
  cheatsheet.
- **Admin Partners view: Kit + Welcome buttons.** Kit generates a
  stable referral code, opens the partner's resources URL, copies to
  clipboard. Welcome opens a templated mailto with the personalised
  URL.

---

## 2026-06-04 (earlier) — Verifier eval set + deterministic extractor

### Added
- **`proposal-engine-kit/`** — self-contained safety harness for the
  Proposal & Grant Engine, ready to `git mv` to the new repo:
  - `facts.seed.json` — three-tier facts (verified/target/needs_confirmation)
  - `extractor.mjs` — deterministic claim extractor (numbers, currency,
    percentages, countries, frameworks, registrations, high-risk patterns)
  - `extractor.test.mjs` — 25 unit tests, all passing
  - `eval/red-team.json` — 15 adversarial prompts the verifier MUST catch
  - `eval/golden.json` — 5 honest prompts the verifier must NOT mis-flag
  - `eval/run.mjs` — grading harness; stub baseline catches 7/15
  - `eval/methodology.md` — ship gates: ≥95% red-team recall, 0% FPR

---

## 2026-06-04 (earlier) — Nice-to-have batch: AVIF + picture, hreflang, CI

### Added
- AVIF variants of all 10 hot images (≈424 KB additional saving per
  cold visit on top of the WebP work). 23 `<img src="*.webp">` wrapped
  in `<picture>` with AVIF source.
- hreflang alternates on all 38 public pages (en-gb, en-ie, en-za,
  en, x-default).
- Playwright config + device matrix (iPhone SE, iPhone 13, Pixel 7,
  iPad Pro, desktop, FHD). BrowserStack `connectOptions` ready to
  uncomment.
- Lighthouse CI config + GitHub Actions workflow.
- `tests/audit.py` — the 14-test static suite; `tests/perf.spec.ts`
  and `tests/screenshots.spec.ts`.
- `docs/CI-SETUP.md`, `docs/UTM-CONVENTIONS.md`.

---

## 2026-06-04 (earlier) — High-value batch: CLS fix + lazy-load + structured data

### Added
- VideoObject schema on every page with a YouTube embed.
- FAQPage schema on `pages/licence.html` (parsed from existing markup).
- BreadcrumbList schema on all 37 non-home pages.
- Conversion-event wiring on apply/contact/sponsorship/pitch forms.

### Fixed
- About + licence pages: 15 images now have explicit width/height
  (CLS fix).
- 50 below-the-fold images flipped to `loading="lazy"` across 20 pages.

---

## 2026-06-04 (earlier) — RED-checklist: perf + analytics + bot defence

### Added
- `assets/js/analytics.js` — Google Consent Mode v2 with stub GTM gate.
  Self-deactivates while `GTM_ID === 'GTM-XXXXXXX'`.
- Cookie banner upgraded to Accept + Reject (GDPR-compliant) dispatching
  `bb:consent` events.
- `data-netlify-honeypot="bot-field"` on the three Netlify forms.
- HSTS + `upgrade-insecure-requests` in the CSP. CSP allowlist extended
  for GTM + GA endpoints.

### Changed
- 10 hot images converted to WebP at 1600px max edge, q=80. ≈2.5 MB
  saved per cold visit.
- 3.7 MB unused `blastbeat-banner.png` deleted.

### Fixed
- Three unescaped apostrophes in `beat-bot.js` "What's included?" chips
  were breaking the bot. Now valid.

---

## 2026-06-04 (earlier) — SEO + landing: tight hero + audience paths

### Changed
- Homepage hero deck collapsed from two paragraphs to one keyword-rich
  line. New chip row under the CTAs: "I'm a School / I'm a Sponsor /
  I'm a Student".
- Homepage title trimmed 97 → 60 chars.
- 18 pages had over-long meta descriptions; all rewritten to ≤155 chars.

### Fixed
- `pages/impact.html` — empty Flourish iframe removed (was firing
  spurious request).
- `pages/see-it-in-action.html` — dynamic video thumbnail alt now
  derived from `v.title`.
- `pages/licence.html` — hero portrait got a real alt; four repeating
  decorative logos got `aria-hidden="true"`.

---

## 2026-06-04 (earlier) — Admin: SAMPLE-data clarification + Beat tour

### Added
- All seed records marked `_sample: true`. Striped row class + orange
  SAMPLE pill rendered next to every sample entity name.
- Sticky gold banner at top of admin: "Heads up — everything here is
  sample data."
- Beat tour modal — 6-step state machine. Auto-launches on first
  authenticated visit. Replayable from Settings.
- `clearSamples()` writes a `clear` audit entry, persists, re-renders,
  toasts the count removed.

---

## How to read this changelog

Every change above is locked in by `python3 tests/audit.py` (14 tests,
1,215 checks at last count). If a future PR breaks any of it, the suite
fails — by design. See `docs/CI-SETUP.md` for the test harness.
