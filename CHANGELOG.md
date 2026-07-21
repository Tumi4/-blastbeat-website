# Changelog

All notable changes to the Blastbeat website and admin. Newest first.

The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).
Versions correspond to commit ranges on the `claude/polish-license-sponsor-pages-GOWlf` branch.

---

## 2026-07-19 — Apply form: start month instead of school terms

### Changed
- **"Preferred Start Term" → "Preferred Start Month".** Term numbering
  differs between northern- and southern-hemisphere school years, so
  the apply form now asks for a plain month (January–December, plus
  "Flexible — advise us") with no year attached.

## 2026-07-19 — One price, one email (Robert's simplification)

### Changed
- **Pricing simplified to €1,250 / 6-month pilot, all three verticals.**
  Every rand amount removed from public pricing displays (homepage
  bundle + single-vertical tiers, for-schools, partners founding rate,
  stats and per-student maths, adopt-a-school tiers now €1,250 /
  €5,625 / €10,625 with the same 10/15% multi-school discounts,
  media kit, licence page incl. Product JSON-LD offer and example
  credential). "R0 Upfront" / "R0 to School" cards renamed "No Fees
  Upfront" / "No Cost to School". Beat chatbot's pricing knowledge and
  canned answers updated to match.
- **One public email everywhere: robert@climateactionsnow.org.**
  All @blastbeat.education addresses (which cannot receive mail — no
  MX) replaced across 26 public pages, the Beat chatbot (prompt +
  offline fallbacks), and the form team-alert defaults
  (robert@climateactionsnow.org + ttncube01@gmail.com). Duplicate
  email cards on the contact and apply pages collapsed into a single
  "Email — All Enquiries" card.

### Notes
- The student profit calculator ("R0 to R45K") is untouched — that's
  event proceeds students can earn, not licence pricing.
- Four blog articles still discuss the old R45,000/yr rate
  editorially (incl. "The R45K Question") — flagged for an editorial
  rewrite rather than silently altered.

## 2026-07-18 — Robert's review round + LinkedIn campaign stack

### Fixed
- **Untrue "BlastBeat West Coast" story removed** from the CAN page
  (34 participants / 85% unemployment / provincial-department support —
  none of it verified). Replaced with a truthful "The Shows Themselves"
  card linking Robert's three real gig videos (incl. the Cape Academy
  show), with VideoObject schema.
- **Readability: site-wide contrast lift.** Low-contrast text colours
  (white at 45–79% opacity) raised to a 72–86% floor across all public
  pages and stylesheets — text-colour declarations only; borders and
  backgrounds untouched. ~1,100 declarations audited.

### Added
- **UK, France, US and Canada** added to the apply form's priority
  territories (after South Africa and Ireland).
- **LinkedIn campaign stack** (`linkedin-main-2026`): seven memorable
  `/go/li-…` endpoints (profile, schools, apply, sponsors, patrons,
  invest, demo), each expanding to the right page with full UTMs per
  docs/UTM-CONVENTIONS.md **plus a ref code**, so campaign leads arrive
  in Admin → Leads tagged `REF li-…` — attribution works with or
  without GA. Hidden `referral` fields added to the apply, contact and
  partner forms so the stamp survives every funnel. Playbook:
  `docs/LINKEDIN-CAMPAIGN.md`.

### Known issues (not code)
- **blastbeat.education has no MX records** — info@/partners@/robert@
  cannot receive email anywhere; messages bounce. Needs mail hosting or
  forwarding (e.g. ImprovMX/Google Workspace) + MX records in DNS, and
  `RESEND_API_KEY` for outbound auto-replies. Site forms are unaffected
  (they land in Admin → Leads).

## 2026-07-12 — Lead categories + licence-page example anonymised

### Added
- **Expanded lead categories.** Leads can now be typed as Investor,
  Financial partner, Marketing, Media / Press or Government alongside
  School, Sponsor, Partner, Ambassador, Demo and Contact — in the edit
  form and (automatically) as filter chips.
- **Smarter form intake.** Demo requests are classified by their
  audience answer: Foundation/Funder → Investor, Sponsor/CSR → Sponsor,
  Government/Ministry → Government, Journalist → Media / Press,
  Education consultant → Partner. Investors no longer arrive as "Demo".

### Fixed
- **Public licence page no longer names a real school.** The example
  certificate and example credential JSON presented Wynberg Girls' High
  School as holding a 2026 sponsor-funded licence (dates + R45,000
  value) — implying a current commercial relationship that doesn't
  exist. Both now use a clearly fictional school marked "illustrative
  example".

## 2026-07-12 — Admin clarity pass (designed for Robert)

### Fixed
- **Invisible dropdown text.** Native `<select>` lists rendered white with
  near-white text on Windows. `color-scheme: dark` now tells the browser
  the page is dark (fixes dropdowns, date pickers and scrollbars), with
  explicit dark option styling as fallback. Regression-tested.
- **Modal horizontal scrollbar.** Form fields could overflow the issue /
  edit modals sideways; fields now shrink properly (`min-width: 0`) and
  modal bodies clip horizontal overflow.

### Changed
- **Forms you can actually read.** Labels are sentence-case DM Sans at
  ~0.92rem (was 0.66rem uppercase mono), inputs are 1rem with more
  padding, clearer borders, hover states and a stronger focus ring;
  placeholder contrast raised.
- **Calmer, roomier tables.** Bigger row padding, subtle zebra striping,
  row hover highlight, friendlier column headers.

### Added
- **Filter chips on every list** — one-tap status filters with live
  counts (Schools by status, Sponsors by stage, Partners by programme,
  Leads by status, Licences by Credentialed / Roster / Revoked). "All"
  resets; chips build themselves from the data so they never show empty
  categories.
- **Beat help button — always there.** A floating "🎤 Help" button opens
  a panel with plain-language guidance for whichever page is open
  (3 steps, big type), plus one-tap actions: replay the guided tour,
  toggle big text, or WhatsApp Tumi. Topic follows you as you switch
  tabs.
- **"Aa Big text" toggle in the sidebar** — the accessibility mode is now
  one tap from anywhere, not buried in Settings (both stay in sync).

## 2026-07-11 — Admin backend goes real (launch-ready)

### Added
- **Server-side auth for /admin.** New Netlify Function
  `admin-api.mjs`: the access code is checked on the server against
  the `ADMIN_ACCESS_CODE` env var (never shipped in JS), issuing a
  12-hour HttpOnly `SameSite=Strict` session cookie (HMAC-signed).
  Login is rate-limited (8 attempts / 15 min / IP) with a
  constant-time code comparison.
- **Real data store.** Dashboard state (schools, sponsors, partners,
  leads, licences, audit) now persists in the site's private Netlify
  Blobs store with a revision counter — two devices can't silently
  overwrite each other (409 → the dashboard adopts the newer copy).
  localStorage remains as the offline cache; a sidebar badge shows
  Synced / Saving / Offline / Local mode at all times.
- **Public licence registry.** New function `verify-licence.mjs`
  serving `GET /api/verify/<id>`. The QR on every printed certificate
  now resolves to a live answer — valid / revoked / expired /
  roster / not-found — instead of "ask the issuer for the JSON file".
  Returns only what's already printed on the certificate; the
  verify page shows the registry verdict alongside the offline
  SHA-256 hash check.
- **Leads intake from the site forms.** `submission-created.mjs` now
  also appends every form submission (demo, apply, sponsorship,
  partner, ambassador, contact) to a server-side inbox; the dashboard
  pulls them into the Leads view automatically, tagged with form,
  contact details, and ambassador referral code.
- **Edit everything.** New record modal for schools, sponsors,
  partners and leads (window.prompt() flows retired). Leads carry the
  full original form submission read-only plus a reply-by-email
  button, and a one-click **Convert → school** action.
- **Search** on the schools, sponsors, partners, leads and licences
  tables.
- **Licence expiry tracking.** "Renews in Xd" chips (≤60 days), a
  "Renewals due" stat, and a "Needs attention" card on Overview
  (renewals + new leads).
- **Sign-in identity for the audit trail.** The gate asks who's
  signing in (Robert / Tumi / Guest); every audit entry and each
  server revision is stamped with that identity. Audit log gains a
  Who column.
- **Import / restore.** Settings card to load a full-state export
  back in (auto-downloads a safety backup of current data first).
- **Function test suite.** `npm run test:functions` — 22 node tests
  covering auth, sessions, forged cookies, rate limiting, conflict
  handling, inbox consumption, registry lookup and public-view
  privacy. New `tests/admin.spec.ts` Playwright spec covers the gate,
  record modals, search, issue → revoke, lead convert and reload
  across the device matrix.
- **Runbook.** `docs/ADMIN-BACKEND.md` — env vars, modes, rotation,
  backups, lifecycle.

### Fixed
- **Launch-day 404 on /api/admin/login.** The "belt-and-suspenders"
  redirects for the new functions force-rewrote `/api/admin/*` and
  `/api/verify/*` to `/.netlify/functions/<name>/…` — but a function
  that declares `config.path` is *only* reachable at that path, so the
  redirect intercepted every request and manufactured a 404 (the
  dashboard then fell back to local mode and rejected the real access
  code). Removed both rules; the functions' native routes handle it.
- **Two-device concurrency made safe** (caught by the pre-push
  adversarial review). State writes are etag-conditional on top of the
  rev check, so a race between two saves yields a clean conflict
  instead of a silent overwrite; inbox messages live one-per-key so a
  form submission arriving mid-save can never be clobbered; a 409
  conflict clears pending inbox-consume ids and re-syncs, so an
  inbound lead can no longer be consumed out of existence; re-login
  after session expiry pushes unsaved edits instead of pulling over
  them; the focus re-sync only adopts strictly newer revisions.
- **Referral-code integrity.** Record ids are monotonic (deleting the
  newest partner no longer recycles their id into a new partner's
  referral code); code rotation checks uniqueness across all partners;
  the licence-issue partner field now matches referral codes as well
  as names, as its placeholder promises; commission can be reversed
  when a referred licence is revoked.
- **Verify verdict honesty.** The green result no longer says
  "authentic" for any self-consistent hash — it reports "hash intact"
  and cross-checks the Blastbeat register (same id + same proof, not
  revoked) before calling a credential authentic; page copy updated to
  match. The registry endpoint requires the full 8-char short id and
  refuses ambiguous prefixes; malformed ids answer gracefully.
- **Issue flow ordering.** The credential is built before any
  school/sponsor auto-create, so a failure can't leave half-committed
  records; duplicate detection is case/whitespace/punctuation
  insensitive; partner-kit CSV header now says `owed_zar` (the values
  were always ZAR); the sponsor email no longer claims an attachment
  that mailto can't add and now carries the live verify link.
- **Revoke no longer deletes.** Revoked licences stay on the register
  marked `revoked` (matching what the confirm dialog always claimed),
  render struck-through, are excluded from programme-value totals,
  and the public registry reports them revoked.
- **Deletes are audited** and ask for confirmation; every mutation now
  lands in the audit log.
- **Mobile zoom-out bug.** `.main` (a grid item) had `min-width:auto`,
  so any wide table blew the phone layout viewport out to ~930px and
  the whole admin loaded zoomed-out. `min-width: 0` keeps tables
  scrolling inside their cards.
- **verify.html read a stale store key** (`bb-admin-data-v1`) for the
  admin-device shortcut; now reads v2 with v1 fallback.
- **Certificate validity arithmetic** uses calendar-safe month adds
  (31 Aug + 6 months no longer lands in March).
- **/admin is never cached or indexed** (`Cache-Control: no-store`,
  `X-Robots-Tag: noindex` headers).

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
