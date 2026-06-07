# Blastbeat — One-Page Setup Guide

Every external-action item from the audit handover, in one place. Copy-paste
commands where possible. Owned by Tumi unless stated otherwise.

---

## 🔴 Week 1 — unblocks measurement and credibility

### 1. Wire Google Tag Manager → GA4

**Why:** without this, every conversion event we've shipped sits in `dataLayer`
silently. Robert's first sale is invisible in GA4. Partner attribution is
invisible.

**Steps (≈30 min in browser, 5 min in code):**

```bash
# 1. Create GA4 property (Google Analytics → Admin → Create Property)
# 2. Create GTM container (Google Tag Manager → Create Account/Container)
# 3. Note the GTM-XXXXXXX container ID
# 4. Open assets/js/analytics.js line 22:
#       var GTM_ID = 'GTM-XXXXXXX';   ← swap for the real ID
# 5. Commit + push:
git add assets/js/analytics.js
git commit -m "analytics: wire GTM container"
git push
```

In GTM admin, add one GA4 Configuration tag firing on All Pages. For each
event in `docs/UTM-CONVENTIONS.md` §5, add a Custom Event trigger + GA4 Event
tag. Mark `apply_completed`, `sponsorship_enquiry`, `contact_submitted`,
`licence_issued`, `partner_application_completed` as **Key Events**.

### 2. Resolve the sprint-duration ambiguity

**Why:** `proposal-engine-kit/facts.seed.json` → `v.programme.duration` is
flagged `status_pending_human_confirmation`. The original audit prompt said
both "90-day" and "16-week" sprints (90 days ≈ 12.8 weeks, not 16). Three
options:

```
A. 12 weeks  — one SA school term, matches CAPS
B. 16 weeks  — extended track with prep + reporting
C. BOTH      — two distinct facts (sprint vs extended)
```

Pick one. Edit `v.programme.duration`: set `canonical_value`, set
`status_pending_human_confirmation: false`, set `last_verified_at`, set the
real `source_url`. Five minutes.

### 3. Refresh stale Japan figures

`v.japan` is dated `2025-12-01`. Get the latest from the Japan chapter
(alumni count, institution count, years operating). Replace
`source_url: "PENDING:..."` with the URL to the latest Japan annual report
and update `last_verified_at`.

### 4. Backfill every `INTERNAL: …` source_url with the real internal document name

Most `verified` facts cite an internal doc. Make sure the doc actually
exists and the reference is precise (file name, section number) so any
auditor can request it. The kit is structured to make this a batch task.

---

## 🟡 Month 1 — unlocks the next layer

### 5. Spin up the Proposal Engine repo

```bash
# In GitHub: create a new private repo, e.g. blastbeat-proposal-engine.
# Clone it locally next to this repo.
cd /path/to/blastbeat-proposal-engine

# Move the kit in
git mv ../-blastbeat-website/proposal-engine-kit/* .
git commit -m "chore: import verifier kit from website repo"
git push

# Then in the website repo, remove the kit (it's been migrated):
cd ../-blastbeat-website
git rm -r proposal-engine-kit
git commit -m "chore: kit migrated to blastbeat-proposal-engine"
git push
```

Build Phase 1 against `eval/methodology.md`. Ship gate: ≥95% red-team
recall, 0% golden false-positive rate.

### 6. Author the four government-framework stubs

`proposal-engine-kit/facts.seed.json` → `government_frameworks` has four
entries marked `STUB-AUTHOR-REQUIRED`:

- `gf.rw.vision2050` (Rwanda — Vision 2050, NST)
- `gf.gh.beyond-aid` (Ghana — Beyond Aid, Education Strategic Plan)
- `gf.ng.ndp-2025` (Nigeria — NDP 2021-2025)
- `gf.jp.society5` (Japan — Society 5.0)

Each has `candidate_sources` pointing at the right ministries. For each:
1. Read the framework
2. Fill in `blastbeat_mapping` (1–3 sentences, factual, no overclaim)
3. Set `blastbeat_mapping_status: "DRAFT-READY"`
4. Set `verifier_action: "allow"`
5. Add `authored_by` + `reviewed_by` (different humans where possible)

**Until done, the verifier refuses any "aligned with [framework]" claim for
that country.** That's the safety rail — no work, no claim.

### 7. Move admin storage from localStorage → Trixta / Supabase

When BBV2 lives on Trixta, migrate:

- `bb-admin-data-v1` localStorage → Supabase tables (`schools`, `sponsors`,
  `partners`, `leads`, `licences`, `audit`)
- Access code → real Netlify Identity / Supabase Auth
- `/verify/<id>` page → real Supabase lookup (not just admin-device
  localStorage shortcut)
- Per-row RLS so partners can only see their own licences

The current admin is a clean bridge — every record has a stable id and a
JSON schema. Migration is mostly a write-script.

### 8. Sign up for the Lighthouse CI GitHub App

```bash
# 1. https://github.com/apps/lighthouse-ci  →  Install
# 2. Authorise on the Tumi4/-blastbeat-website repo
# 3. Settings → Secrets → Actions → New repository secret
#       Name: LHCI_GITHUB_APP_TOKEN
#       Value: (provided by the app on install)
# 4. .github/workflows/ci.yml already references this secret —
#    next PR will get inline Lighthouse comments automatically.
```

---

## 🟢 Quarter 1 — quality of life

### 9. BrowserStack credentials (real-device testing)

```bash
# 1. https://www.browserstack.com → Automate plan
# 2. Account Settings → Username + Access Key
# 3. GitHub repo → Settings → Secrets → Actions → New:
#       BROWSERSTACK_USERNAME
#       BROWSERSTACK_ACCESS_KEY
# 4. In playwright.config.ts, uncomment the `connectOptions` block.
# 5. Add a nightly job to .github/workflows/ci.yml (template is in
#    docs/CI-SETUP.md §"BrowserStack — quickest setup")
```

### 10. WhatsApp Business number

Currently `partner-resources.html` and the Beat Bot reference Robert's
personal number (`27738048409`). For business volume + auto-replies:

```
1. Get a separate SIM / virtual number for Blastbeat Business
2. Register at https://business.whatsapp.com
3. Configure: opening message, business hours, auto-reply for off-hours
4. Search-replace 27738048409 → new number across the codebase:
    grep -rl "27738048409" --include="*.html" --include="*.js" . | xargs sed -i 's/27738048409/<NEW_NUMBER>/g'
5. Commit + push
```

### 11. Email auth on the sending domain (SPF / DKIM / DMARC)

If Robert's outbound or any programmatic sending goes via `blastbeat.education`
or `climateactionsnow.org`, configure DNS at your registrar:

```
TXT @ "v=spf1 include:_spf.google.com include:netlify.com ~all"
TXT default._domainkey "v=DKIM1; k=rsa; p=<your-DKIM-public-key>"
TXT _dmarc "v=DMARC1; p=quarantine; rua=mailto:dmarc@blastbeat.education; pct=100"
```

Test with [easyDMARC](https://easydmarc.com/tools/dmarc-record-check).

### 12. Audit Robert's first 10 real partner kit URLs

After the first 10 partner kits go out:
- Open each kit URL yourself, in incognito
- Check the scripts feel right for the partner's region
- Make sure the calculator currency matches their market
- Print the cheatsheet PDF and check it lands

Adjust copy based on what real partners actually use vs. ignore.

---

## ⚪ Long-term — roadmap items, no urgency

### 13. The /verify/<id> backend
Currently the QR works for the admin device only (localStorage shortcut). Full
public verification needs Supabase. Comes free with the Trixta migration.

### 14. Move skills + frameworks to RAG in the proposal engine
Loading every skill on every Claude call won't scale to 20-page government
proposals — needs retrieval, not full-include. Plan when Phase 2 starts.

### 15. Production observability dashboard
For the proposal engine, track:
- % generations with zero flags
- Tumelo false-positive rate on review
- Cost per document
Track from week 1 so you can prove the verifier is getting better, not worse.

### 16. Per-region content + hreflang
Currently every page is one English version pointing at UK/IE/ZA via hreflang
tags. If paid search opens in any one market, build region-specific copy +
URLs.

### 17. Ed25519 signatures on 2027 licences
Current `Sha256Stamp2026` is tamper-evident but not unforgeable. The verify
page (`pages/verify.html`) is ready to handle both proof types — just point
the issuer at the new signing routine when ready.

---

## What you do NOT need to set up

Locked in by tests; nothing in the codebase regresses without the suite
catching it:

- SEO (titles, descriptions, canonical, OG, Twitter, JSON-LD, sitemap)
- hreflang on every public page
- Structured data: EducationalOrganization, BreadcrumbList, VideoObject, FAQPage
- HTML balance, internal link integrity, image refs, JS syntax
- Image performance (WebP + AVIF with `<picture>`, lazy-loading)
- Accessibility (alt text, image dimensions on CLS-prone pages)
- Security headers (HSTS, CSP with `upgrade-insecure-requests`, X-Frame-Options)
- Form honeypots
- analytics.js installed on every page

Run `python3 tests/audit.py` any time. Three GitHub Actions jobs run the same
suite on every PR (audit, playwright, lighthouse).

---

*Last updated: 2026-06-05. See `CHANGELOG.md` for the build log this guide
is based on.*
