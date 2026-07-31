# Annexure A — Technical IP Schedule

**Repository:** `Tumi4/-blastbeat-website` (github.com/Tumi4/-blastbeat-website)
**Schedule date:** 2026-07-21 · **Prepared from:** commit `a0e8aec` (branch `main`)
**Register:** factual technical record. Contains no valuations, effort estimates, or opinions.

---

## Part 1 — Summary table

| Asset area | Count | Description |
|---|---|---|
| Public pages | 51 HTML documents | 35 site pages (incl. 3 private invite pages), 15 blog documents, 1 admin dashboard |
| Serverless API endpoints | 4 functions / 7 routes | AI chat proxy, admin auth + state API, public licence registry, form-submission processor |
| Data stores | 1 Netlify Blobs store (2 key families) + browser localStorage | Admin dashboard state with revision control; leads inbox (one blob per message) |
| Client JavaScript modules | 14 files | Admin application, analytics/attribution, chatbot, currency, calculators, UI behaviours |
| Stylesheets | 5 files | Design system, theme, blog, hero, mobile |
| Netlify Forms | 6 forms | Application, demo access, sponsorship, partner, ambassador acceptance, contact |
| Email templates | 6 auto-reply + 6 team-alert routes | Inline HTML templates in the form-submission function |
| Redirect/rewrite rules | 22 | Clean URLs, campaign endpoints, internal-file fences, verify routing |
| Third-party integrations | 7 active call targets | Anthropic API, Resend, Netlify (Forms/Blobs/Functions), YouTube, Google Fonts, external QR service, WhatsApp deep links |
| Custom logic modules | 10 identified | Credential engine, registry, sync engine, attribution pipeline, commission logic, others (§9) |
| Test suites | 7 Playwright specs · 27 node tests · 18-check static auditor · video probe | Run in 4-job CI pipeline |
| Documentation | 15 Markdown documents | Runbooks, conventions, handoffs, changelog |

## Part 2 — Authorship summary

### 2.1 Contributors (`git shortlog -sne` on `main`; 82 commits total)

| Author (as recorded in git) | Commits | First commit | Last commit | Lines added | Lines removed |
|---|---|---|---|---|---|
| Claude \<noreply@anthropic.com\> | 49 | 2026-05-09 | 2026-07-04 | 39,961 | 3,940 |
| tumel \<ttncube01@gmail.com\> | 18 | 2026-03-27 | 2026-05-03 | 17,266 | 1,665 |
| Tumi4 \<108390290+Tumi4@users.noreply.github.com\> | 15 | 2026-06-26 | 2026-07-21 | 3,643 | 1,054 |

Line counts exclude `package-lock.json`, the generated `assets/js/programme-data.js`, and binary files (uniform filter; see Part 4). The authors `tumel` and `Tumi4` record the same GitHub account (Tumi4 / ttncube01@gmail.com) under local-git and web-UI identities respectively.

### 2.2 Commit activity by month

| Month | Claude | tumel | Tumi4 | Total |
|---|---|---|---|---|
| 2026-03 | 0 | 6 | 0 | 6 |
| 2026-04 | 0 | 0 | 0 | 0 |
| 2026-05 | 24 | 12 | 0 | 36 |
| 2026-06 | 23 | 0 | 3 | 26 |
| 2026-07 | 2 | 0 | 12 | 14 |

### 2.3 Author / committer divergence

15 commits are authored by `Tumi4` and committed by `GitHub <noreply@github.com>`. These are squash-merges of pull requests #1–#15 performed through the GitHub web interface/API; the squash commit takes the merging account as author and GitHub's server as committer.

### 2.4 Co-authored commits

28 commits carry `Co-authored-by` trailers. Distinct trailer values recorded in history: `Claude <noreply@anthropic.com>`, `Claude Opus 4.6 (1M context) <noreply@anthropic.com>`, `Claude Sonnet 4.6 <noreply@anthropic.com>`. All squash-merge commits (#1–#15) additionally carry `Co-authored-by: Claude <noreply@anthropic.com>`.

### 2.5 History completeness

The repository contains **two root commits** (unrelated histories later merged):

1. `d602953` — 2026-03-27, author tumel, message "Initial build: Blastbeat Education website (Duda → Netlify migration)", 27 files, 6,969 insertions. The message and the image URLs still referenced in the codebase (`irp.cdn-website.com`, Duda's CDN) record that the site content was migrated from a prior Duda-hosted website.
2. `d5f68a6` — 2026-05-09, author Claude, message "polish: pre-Robert pass — clean rough edges + friendly Flourish guide", 90 files, 22,728 insertions. This root's size indicates work squashed/imported from outside the repository's own history at that point.

Accordingly, per-author line totals measure changes recorded in this repository's history only; work performed before either root commit is not individually attributable from git data.

---

## Part 3 — Full detail

### 3. Application structure

Static multi-page site (no client-side router). Every HTML document with its own `<title>`:

| File | Title (as declared by the page) |
|---|---|
| `index.html` | Blastbeat Education — Students Become Founders. Real Events. |
| `pitch.html` | Blastbeat V2 — The 20-School Pilot / Sponsorship Pitch |
| `thank-you.html` | Thank You |
| `demo-thank-you.html` | You're in — launch the Blastbeat V2 demo |
| `404.html` | Page Not Found |
| `pages/2winaid.html` | 2winAid — Twin a School, Fund a Future |
| `pages/about.html` | About Us |
| `pages/accessibility.html` | Accessibility |
| `pages/ambassadors.html` | Ambassadors, Affiliates & Referrals |
| `pages/app.html` | The Blastbeat V2 App — AI-Mentored ESE Platform |
| `pages/apply.html` | Apply for Your School (school-application form) |
| `pages/artist-ambassadors.html` | CAN Music Artist Ambassadors |
| `pages/can.html` | CAN — Climate Actions Now |
| `pages/contact.html` | Contact Us (contact form) |
| `pages/demo-guide.html` | Live Demo Guide (internal presenter run-sheet, noindex) |
| `pages/demo.html` | Request a Blastbeat V2 demo (demo-access-request form) |
| `pages/footbeat.html` | FootBeat — Sports Enterprise |
| `pages/for-schools.html` | For Schools |
| `pages/impact.html` | Impact |
| `pages/international.html` | International |
| `pages/licence.html` | The Blastbeat Licence — Product 01 |
| `pages/macc.html` | MACC — Music & Arts Climate Challenge |
| `pages/media.html` | Press & Media Room |
| `pages/partner-program.html` | Partner / Reseller Program (partner-application form) |
| `pages/partner-resources.html` | Your Partner Kit (URL-parameterised per-partner resource page) |
| `pages/partners.html` | Partners & Sponsorship (sponsorship-enquiry form) |
| `pages/patrons.html` | The Founders' Circle |
| `pages/privacy-policy.html` | Privacy Policy |
| `pages/programme.html` | The ESE Programme |
| `pages/projects.html` | Projects & Use Cases |
| `pages/see-it-in-action.html` | See It In Action (video library) |
| `pages/student-journey.html` | Your Journey |
| `pages/terms-of-use.html` | Terms of Use |
| `pages/verify.html` | Verify a Blastbeat Licence (public credential verification) |
| `pages/invites/shack.html` | Shack — personal ambassador invitation (noindex; artist-ambassador-accept form) |
| `pages/invites/sir-kisoro.html` | Sir Kisoro — personal ambassador invitation (noindex) |
| `pages/invites/tia-kids.html` | TIA Kids — personal ambassador invitation (noindex) |
| `blog/index.html` | Blog index |
| `blog/14-ese-roles-principal-guide.html` | The 14 ESE Roles — A Principal's Guide |
| `blog/caps-aligned-ese-case.html` | The CAPS-Aligned Case for ESE in 2026 |
| `blog/r45k-question-csr.html` | The R45,000 Question (legacy pricing; flagged in CHANGELOG for rewrite) |
| `blog/sponsor-compliance-cheatsheet.html` | ESG, BBBEE, Section 18A — Sponsor's Compliance Cheatsheet |
| `blog/stage-to-cv.html` | From Stage to CV |
| `blog/student-profit-calculator.html` | The Student Profit Calculator |
| `blog/teacher-role-during-the-year.html` | What Teachers Actually Do During a Blastbeat Year |
| `blog/dublin-to-cape-town.html`, `blog/macc-effect-climate.html`, `blog/the-licence-product-01.html`, `blog/why-i-built-blastbeat.html`, `blog/youth-enterprise-sdgs-2030.html` | Retired posts ("Post retired — pending review" placeholders) |
| `admin/index.html` | Admin Dashboard (login-gated single-page application) |

**Layouts/templates:** no templating engine; shared structure is repeated per page (common nav, footer, meta blocks). Shared behaviour and styling are centralised in `assets/js/` and `assets/css/`.

**Navigation:** header nav (Programme, For Schools, Licence, About, Impact, Partners + Contact/Apply actions) with mobile drawer (`assets/js/navigation.js`); footer link groups per page.

**Route guards:** `/admin` is gated by server-checked access code (§6). `netlify.toml` force-404 fences prevent CDN serving of `/data/*`, `/docs/*`, `/tests/*`, `/scripts/*`, `/netlify/*`, `/proposal-engine-kit/*`, and `/IP_SCHEDULE.md`. Invite pages and the demo guide are `noindex`.

### 4. API surface

Netlify Functions (runtime v2, Node 22, esbuild bundling), all in `netlify/functions/`:

| Endpoint | Method | File | Purpose |
|---|---|---|---|
| `/api/beat` | POST | `beat.mjs` | Proxies the on-page Beat chatbot to the Anthropic API (model `claude-haiku-4-5`, cached system prompt). Request: `{message, history[]}`. Response: `{reply, usage, stop_reason}` or typed error (`rate_limited`, `ai_offline`, `ai_upstream`). Per-IP rate limit 12/min. CORS restricted to production + deploy-preview origins. |
| `/api/admin/login` | POST | `admin-api.mjs` | Verifies access code (constant-time) against env; issues 12-hour HMAC-signed `HttpOnly; Secure; SameSite=Strict` session cookie. Request: `{code, who}`. Response: `{ok, who, exp}` / 401 / 429 (8 attempts / 15 min / IP) / 501 when unconfigured. Origin allow-list enforced. |
| `/api/admin/logout` | POST | `admin-api.mjs` | Clears the session cookie. |
| `/api/admin/state` | GET | `admin-api.mjs` | Returns `{rev, data, updatedAt, updatedBy, inbox[], who}` from the Blobs store. Session required. |
| `/api/admin/state` | PUT | `admin-api.mjs` | Writes full dashboard state. Request: `{rev, data, consumeInbox[]}`. Optimistic concurrency: app-level `rev` check **and** etag-conditional write; conflict → 409 with authoritative copy. Consumed inbox messages deleted per-key. Body ≤ 1.5 MB; audit log capped at 5,000 entries; state shape validated. |
| `/api/verify/:id` | GET | `verify-licence.mjs` | Public licence registry. Matches full credential URN, 8+-hex-char short-id prefix (ambiguous prefix → no match), or exact roster id. Response: certificate-public fields only (`status` valid/revoked/expired/roster, school, sponsor name, tier, dates, issuer, proof hash). 30 req/min/IP. |
| *(event)* `submission-created` | Netlify Forms trigger | `submission-created.mjs` | Fires on every form submission (inbound webhook from Netlify Forms). Appends a lead to the Blobs inbox (atomic per-key write) with audience-based type classification; sends auto-reply to the submitter and team alert via Resend when configured. |

No GraphQL. No scheduled/cron functions. No outbound webhooks (outbound calls are to the Anthropic and Resend HTTPS APIs).

### 5. Data layer

No SQL database. Persistence:

**Netlify Blobs store `bb-admin`** (site-scoped, strong consistency):

| Key | Shape |
|---|---|
| `state` | `{rev: int, updatedAt: ISO, updatedBy: string, data: {schools[], sponsors[], partners[], leads[], licences[], audit[], seq{}}}` — the entire admin dataset. Record fields: schools `{id, key?, name, group?, area?, region?, country, note, twin, status, progress, start, contact?}`; sponsors `{id, key?, company, brand?, roles[]?, tier, value, currency, twin, status, contact, founding?}`; partners `{id, name, type, email, refCode, link, referred, signed, owed, currency?, status, note?}`; leads `{id, inboxId?, name, org, email, phone, type, source, referral?, raw?, date, status}`; licences `{id, seq?, source?, school, sponsor, tier, role?, amount, currency, status, region, validFrom, validUntil, partner?, partnerCode?, proofHash, revokedAt?, vc}`; audit `{timestamp, action, entity, who, detail}` (append-only in application flow; server-capped at 5,000). `seq` holds per-collection id high-water marks (ids are never reused after deletion). |
| `inbox/<uuid>` | One blob per inbound form submission: `{id, form, type, name, org, email, phone, referral, date, raw{≤40 keys, values ≤2,000 chars}}`. Deleted individually when consumed by a saved dashboard state. |

Write-concurrency rules: `state` writes require matching `rev` and matching etag (`onlyIfMatch`; `onlyIfNew` for first write). Inbox appends/deletes are per-key and cannot conflict with each other.

**Browser storage (client):** `localStorage` — `bb-admin-data-v2` (offline cache of dashboard state), `bb-admin-bigtext`, `bb-admin-savetoast`, `bb-admin-samples-dismissed`, `bb-admin-tour-done-v2`, `bb-ref` (30-day referral attribution `{ref, at}`), cookie-consent choice. `sessionStorage` — `bb-admin-ok`, `bb-admin-mode`, `bb-admin-who`.

Migrations, RLS policies, stored procedures, views, storage buckets: **Not applicable.**

### 6. Authentication, authorisation and roles

- **Method:** single shared access code for `/admin`, verified server-side against `ADMIN_ACCESS_CODE` (never shipped to the client), SHA-256-normalised constant-time comparison.
- **Session:** stateless token `v1.<who>.<exp>.<HMAC-SHA256>` in an `HttpOnly; Secure; SameSite=Strict` cookie, 12-hour expiry; secret from `ADMIN_SESSION_SECRET` (or derived from the access code). No refresh flow — re-login on expiry (client preserves unsaved edits and pushes them after re-login).
- **Roles:** sign-in identity is self-declared (`robert` / `tumi` / `guest`) and used solely for audit-trail attribution (`who` on every audit entry, `updatedBy` on every saved revision). All authenticated sessions have identical permissions (full dashboard read/write). The public registry endpoint is unauthenticated read-only by design.
- **CSRF:** SameSite=Strict cookie plus Origin allow-list on mutating routes.
- **Fallback mode:** when the backend is unconfigured (501), the dashboard runs in explicitly-labelled local prototype mode against a demo code; it gates only browser-local seed data.
- **Consent flows:** POPIA consent checkbox (required) on the school application; cookie-consent banner (`assets/js/cookie-consent.js`) — analytics/ad cookies off until accepted, choice persisted, consent-mode update pushed to `dataLayer`.
- **Age gating:** demo audience option "Student (18+)" labels the intended audience; no programmatic age verification is implemented.

### 7. Components and features

**Admin dashboard** (`admin/index.html` + `assets/js/admin.js`, ~1,900 lines): login gate with identity select; server-sync engine with status badge (Synced/Saving/Offline/Local); eight views — Overview (stats incl. "Needs attention"), Pilot Schools, 2winAid Sponsors, Licences & Verifiable Credentials, Ambassadors & Affiliates, Leads, Audit Log, Settings; per-list search inputs and data-driven filter chips with counts; generic add/edit record modal (schools/sponsors/partners/leads); licence issuance modal with datalist autocomplete and roster "Stamp" flow; credential preview (JSON view, download, mailto, print-certificate window with QR); revoke-with-commission-reversal; lead→school conversion; partner kit URL/welcome-email/code-rotation actions; CSV partner-kit export; JSON exports (legal bundle, audit, full state) and import-with-safety-backup; Beat help panel (per-view guidance, tour replay, big-text, WhatsApp); 8-step guided tour; big-text accessibility mode (sidebar toggle + setting); danger-zone local reset.

**Site-wide client modules** (`assets/js/`): `analytics.js` (GTM/GA4 stub + `bbTrack` API + referral persistence/stamping), `navigation.js`, `animations.js`, `cookie-consent.js`, `currency.js` (multi-currency price display), `beat-bot.js` (chat widget with canned fallbacks + `/api/beat` calls), `whatsapp.js` (floating contact), `profit-calculator.js` (student event-profit interactive), `student-tools.js`, `interactive-data.js`, `magic-cursor.js`, `can-gallery.js` (custom element rendering CAN gallery items), `programme-data.js` (generated public roster dataset), `admin.js`.

**Forms → destinations:** all 6 forms POST to Netlify Forms (dashboard + email notifications) and are mirrored into the admin Leads inbox by `submission-created.mjs`. Hidden `referral` fields on apply/contact/partner/demo/sponsorship forms carry attribution.

**Email/messaging surfaces:** 6 auto-reply and 6 team-alert inline-HTML templates in `submission-created.mjs` (demo, school application, sponsorship, partner, ambassador acceptance, contact); client-side `mailto:` compositions (partner welcome, licence-to-sponsor); WhatsApp deep links.

**State stores:** admin dashboard in-memory `data` object synced to Blobs/localStorage (§5); no framework state library.

### 8. Integrations and third-party services

| Service | Purpose | Client/SDK | Account holder (as determinable from code/config) |
|---|---|---|---|
| Anthropic API | Beat chatbot completions (`claude-haiku-4-5`) | `@anthropic-ai/sdk` 0.32.1 | Key via `ANTHROPIC_API_KEY`; holder not recorded in code |
| Netlify (hosting, Functions, Forms, Blobs) | Hosting/CDN, serverless runtime, form capture, data store | `@netlify/blobs` 10.7.9 | Site `blastbeat-education` on a Netlify Pro team |
| Resend | Outbound transactional email (optional; inactive until `RESEND_API_KEY` set) | Plain `fetch` | Not configured at schedule date |
| Google Fonts | Space Grotesk, DM Sans, IBM Plex Mono | `<link>` CSS | n/a |
| YouTube (`youtube-nocookie.com` embeds, `i.ytimg.com` thumbnails, oEmbed in CI probe) | Video library and gig footage | none | Channels owned by third parties/programme |
| goqr (`api.qrserver.com`) | QR image on printed licence certificates | none | n/a (unauthenticated) |
| WhatsApp (`wa.me`) | Human contact deep links | none | Number +27 73 804 8409 |
| Google Tag Manager / GA4 | Analytics — **stub**: inactive until the `GTM-XXXXXXX` placeholder in `analytics.js` is replaced | inline loader | Not configured at schedule date |
| Duda CDN (`irp.cdn-website.com`) | Residual image hosting from the pre-migration site (CAN page cards) | none | Legacy account, not managed in this repo |
| Trixta (`trx-3675.devspace.trixta.io`) | External Blastbeat V2 application the site links to (demo hand-off) | none | Separate platform; not part of this repository |

**Environment variables (names and purpose only):** `ANTHROPIC_API_KEY` (Beat), `BEAT_DEBUG` (verbose logging), `ADMIN_ACCESS_CODE` (admin login), `ADMIN_SESSION_SECRET` (session HMAC), `RESEND_API_KEY` / `RESEND_FROM` / `TEAM_NOTIFY_EMAILS` (outbound email), `FUNCTION_DEBUG` (form-function logging), `DEMO_APP_URL` (demo hand-off target). Test/CI-only: `BB_BASE_URL`, `BB_CHROMIUM_EXEC`, `BB_MOBILE_DUMP`, `CI`, `BROWSERSTACK_USERNAME`, `BROWSERSTACK_ACCESS_KEY`, `LHCI_GITHUB_APP_TOKEN`.

### 9. Custom logic and algorithms

All items below are written in this repository (no library or template ancestry beyond the platform SDKs), except where noted.

1. **Verifiable-credential engine** — `assets/js/admin.js` (`buildCredential`, `canonicalize`, `sha256Hex`). Builds W3C-VC-style JSON-LD licence credentials; deterministic recursive key-sorted canonicalisation; SHA-256 content proof (`Sha256Stamp2026`); calendar-safe validity arithmetic; regional issuer selection (ZA/NA/UK/IE entities). Written from scratch (Web Crypto API).
2. **Public licence registry** — `netlify/functions/verify-licence.mjs`. Short-id prefix matching with ambiguity rejection, revoked/expired/roster status derivation, certificate-public field projection. From scratch.
3. **Two-sided verification model** — `pages/verify.html`. Client-side proof recomputation (identical canonicalisation) cross-checked against the registry (same id + same proof + not revoked) before an authenticity verdict. From scratch.
4. **State sync engine** — `assets/js/admin.js` + `netlify/functions/admin-api.mjs`. Revision counter plus etag-conditional writes; 409 conflict adoption with inbox-consume protection; offline cache and retry; focus re-sync accepting strictly newer revisions only; dirty-state preservation across session expiry. From scratch.
5. **Referral attribution pipeline** — `assets/js/analytics.js`, `netlify.toml`, form fields, `submission-created.mjs`, admin Leads. `/r/<slug>` and `/go/li-*` links → 30-day persisted `ref` → auto-stamped into form submissions → lead records tagged for source attribution. From scratch.
6. **Ambassador commission logic** — `assets/js/admin.js`. Referral-code generation (`refCodeFor`), uniqueness-checked rotation, 25% commission accrual on issuance, prompted reversal on revocation, monotonic id allocation protecting code identity. From scratch.
7. **Lead classification** — `submission-created.mjs`. Form→type mapping with audience-based reclassification of demo requests (funder→Investor, ministry→Government, journalist→Media/Press, etc.). From scratch.
8. **Beat prompt engineering** — `netlify/functions/beat.mjs`. Frozen cache-stable system prompt encoding programme facts, pricing, tone-per-audience rules and hard guardrails; history sanitisation (role alternation, length caps); typed error surface. From scratch on the Anthropic SDK.
9. **Static quality auditor** — `tests/audit.py`. 18 bespoke site-wide checks (structured-data presence, honeypots, viewport/tap-target rules, internal-data leak guard, dead-embed patterns, image dimensions, hreflang). From scratch.
10. **Public-build generator** — `scripts/gen-programme-data.mjs`. Strips CRM-grade fields from the internal programme dataset into the public `programme-data.js`, with a hard leak-check of named terms. From scratch.
Also: multi-currency display (`currency.js`), student profit calculator (`profit-calculator.js`), CAN gallery custom element (`can-gallery.js`) — all bespoke.

### 10. Testing, tooling and infrastructure

- **Playwright** (`@playwright/test`, config `playwright.config.ts`): 7 specs — `smoke`, `admin` (9 scenarios), `mobile-audit` (viewport/tap/16px checks across pages), `perf` (per-page budgets), `ambassador`, `screenshots` (local visual tool), plus `video-health.mjs` probe. Device matrix: iPhone SE/13, Pixel 7, iPad Pro 11, two desktop profiles.
- **Node test runner:** `tests/functions/` — 27 tests over the admin API (auth, forged cookies, rate limiting, conflict/race behaviour, inbox consumption sanitisation) and registry (matching, ambiguity, privacy projection, malformed input).
- **Static auditor:** `tests/audit.py` — 1,395 assertions at schedule date, 100% passing.
- **CI (GitHub Actions, `.github/workflows/ci.yml`):** jobs — Static audit; Function tests; Playwright (perf + a11y + mobile, desktop + Pixel 7); Video health (informational); Lighthouse CI (informational, `lighthouserc.json`). Netlify deploy checks (redirect/header rules, deploy preview) run per PR.
- **Hosting:** Netlify Pro; configuration as code in `netlify.toml` (publish root, functions dir, esbuild, 22 redirect rules, security headers incl. CSP/HSTS, cache policy, admin no-store/noindex). DNS on Netlify DNS. No IaC beyond `netlify.toml`/`_redirects`.
- **Monitoring/error tracking:** function `console` logging (Netlify function logs); no external APM.

### 11. Documentation present in the repository

Root: `CHANGELOG.md` (dated, Keep-a-Changelog format, launch history), `FLOURISH-PILOT-BRIEF.md`, `FLOURISH-PLAN.md`, `FLOURISH-STEP-BY-STEP.md`, `MEETING-PREP.md`, `NAVIGATION-GUIDE.md`. `docs/`: `ADMIN-BACKEND.md` (backend runbook), `EMAIL-SETUP.md` (mail/DNS runbook), `LINKEDIN-CAMPAIGN.md` (campaign link playbook), `UTM-CONVENTIONS.md`, `CI-SETUP.md`, `SETUP.md`, `DEMO-EMAILS.md`, `ARTIST-AMBASSADORS.md`, `programme-data-handoff.md`. No README.md. Inline documentation: block-comment headers on all four functions and major `admin.js` sections describing contracts and failure modes; comment density is high in serverless/admin code, low in page HTML.

### 12. Derivation and provenance

- **Prior-product migration:** the initial commit is titled "Duda → Netlify migration"; residual Duda CDN image URLs (`irp.cdn-website.com`) remain on the CAN page. Content (copy/imagery) predating 2026-03-27 originates from the prior Duda-hosted site.
- **Second-root import:** commit `d5f68a6` (2026-05-09, 90 files) introduced work not individually recorded in this repository's history (§2.5).
- **No starter kit/boilerplate:** no framework scaffold detected; pages are hand-authored HTML/CSS/JS.
- **Dependency licences:** `@anthropic-ai/sdk` 0.32.1 — MIT; `@netlify/blobs` 10.7.9 — MIT; dev: `@playwright/test` — Apache-2.0; `@lhci/cli` — Apache-2.0. **No copyleft (GPL/AGPL) or commercially restrictive licences in the dependency tree's direct manifest.** Google Fonts served under the Open Font License from Google's CDN.
- **Third-party embedded content:** YouTube videos (rights with their channel owners); photographs include programme photography and legacy Duda-CDN assets.
- **Generated artefact:** `assets/js/programme-data.js` is machine-generated from `data/programme-data.json` by `scripts/gen-programme-data.mjs` (both in-repo).

---

## Part 4 — Verification notes

Every figure above is reproducible from a clone of the repository at commit `a0e8aec`:

| Figure | Command / source |
|---|---|
| First/last commit, count | `git log --reverse --date=iso` (head), `git log -1 --date=iso`, `git rev-list --count HEAD` |
| Contributors table | `git shortlog -sne` on `main`; per author `git log --author=… --reverse --format='%ad'` (first), `git log --author=… -1` (last), `git rev-list --count HEAD --author=…` |
| Lines added/removed | `git log --author=… --pretty=tformat: --numstat` aggregated in awk, skipping binary rows (`$1=="-"`) and the files `package-lock.json`, `assets/js/programme-data.js` |
| Monthly activity | `git log --date=format:'%Y-%m' --pretty='%ad %an'` aggregated |
| Author≠committer | `git log --format='%h\|%an\|%cn'` filtered on inequality |
| Co-author trailers | `git log --format='%(trailers:key=Co-authored-by,valueonly)'` |
| Root commits | `git rev-list --max-parents=0 HEAD`; per-root `git show --stat` |
| Tracked files / LOC | `git ls-files \| wc -l`; LOC via `git ls-files` filtered of lockfile, generated JS and binary extensions, piped to `wc -l` (38,372 lines at schedule date) |
| Page inventory | `<title>` elements extracted from each tracked `*.html` |
| Endpoints, data shapes, auth, logic | Direct inspection of `netlify/functions/*.mjs`, `assets/js/admin.js`, `netlify.toml`; request/response shapes as implemented in code and exercised by `tests/functions/*.test.mjs` |
| Env var names | `grep -ro "process\.env\.[A-Z_]*"` plus documented vars in function headers (`ADMIN_ACCESS_CODE`, `ADMIN_SESSION_SECRET` are read via an injectable env object) |
| Forms | `grep -r 'form name="' pages/` |
| Dependency licences | `license` field of each installed package's `package.json` |
| Test/audit counts | `npm run test:functions` (27 passing), `python3 tests/audit.py` (1,395/1,395), spec files under `tests/` |

This schedule intentionally excludes: monetary values, effort estimates, quality opinions, and any characterisation of working relationships. Non-code assets are recorded separately in Annexure B.
