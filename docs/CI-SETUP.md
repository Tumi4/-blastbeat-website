# Blastbeat — CI / Test Setup

How the test stack is wired, how to run it locally, and how to plug in
real-device cloud testing when you're ready.

---

## Stack at a glance

```
tests/audit.py                 — 14-test static-analysis suite (Python). No browser.
tests/perf.spec.ts             — Playwright perf + a11y smoke per page.
tests/screenshots.spec.ts      — Playwright visual-regression baseline.
playwright.config.ts           — device matrix (iPhone SE, iPhone 13, Pixel 7, iPad, desktop, FHD).
lighthouserc.json              — Lighthouse CI assertions (perf >=85, a11y >=90, SEO >=95).
.github/workflows/ci.yml       — Wires all of the above on every push + PR.
```

---

## Local commands

```bash
# Static audit only — fastest, runs in 1-2 seconds.
python3 tests/audit.py

# Full Playwright pass on all 6 device profiles. Boots the local server.
npx playwright test

# Just one project:
npx playwright test --project=iphone-13

# Update screenshot baselines after intentional UI changes:
npx playwright test --update-snapshots

# Lighthouse CI locally:
npx lhci autorun
```

`package.json` shortcuts:

```bash
npm run test:audit         # python audit
npm test                   # playwright (all projects)
npm run test:perf          # just perf tests
npm run test:screenshots   # just screenshots
npm run lhci               # lighthouse
```

---

## What runs on every push

GitHub Actions (`.github/workflows/ci.yml`) runs three jobs in order:

1. **audit** — `python3 tests/audit.py`. Fails on any of the 14 checks
   regressing (HTML balance, SEO, link integrity, schema coverage, etc.).
2. **playwright** — boots a local server, runs all specs across the device
   matrix. Visual diffs over 2% fail the build. Perf budgets fail if any
   page blows past its FCP / load / transfer-size cap.
3. **lighthouse** — runs LHCI against 7 key pages, 3 runs each, fails if
   any category score drops below the thresholds in `lighthouserc.json`.

Reports are uploaded as workflow artifacts (`playwright-report/`).

---

## Real-device cloud testing (BrowserStack / LambdaTest / Sauce Labs)

The Playwright device list (`devices['iPhone 13']` etc.) is virtual — accurate
viewport, user agent, touch emulation, but not a real iOS Safari or Chrome
for Android. For final QA on actual hardware, plug in a cloud grid.

### BrowserStack — quickest setup

1. Get an account: <https://www.browserstack.com>. The Automate plan gives
   you Playwright + real iOS/Android devices.
2. From the BrowserStack dashboard, grab `BROWSERSTACK_USERNAME` and
   `BROWSERSTACK_ACCESS_KEY`.
3. Add them as repo secrets in GitHub (Settings → Secrets → Actions).
4. In `playwright.config.ts`, uncomment the `connectOptions` block and set
   the desired device caps. The same specs in `tests/` will then run on
   real hardware.
5. Optional: add a new job to `.github/workflows/ci.yml` that runs the
   BrowserStack matrix nightly (not on every PR — real-device runs cost
   per-minute):

```yaml
  browserstack-nightly:
    runs-on: ubuntu-latest
    if: github.event.schedule == '0 2 * * *'
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: '22' }
      - run: npm install && npx playwright test --project=browserstack-ios-safari
        env:
          BROWSERSTACK_USERNAME: ${{ secrets.BROWSERSTACK_USERNAME }}
          BROWSERSTACK_ACCESS_KEY: ${{ secrets.BROWSERSTACK_ACCESS_KEY }}
```

Add a corresponding `schedule:` trigger at the top of the workflow:

```yaml
on:
  schedule:
    - cron: '0 2 * * *'   # 02:00 UTC daily
  push: ...
```

### Alternative: LambdaTest

LambdaTest's HyperExecute supports Playwright natively. Use the same
`connectOptions` pattern with their CDP endpoint.

---

## Lighthouse CI — first run

The first run needs no setup. Subsequent runs benefit from a GitHub App
token for inline PR comments:

1. Install the Lighthouse CI app: <https://github.com/apps/lighthouse-ci>.
2. Authorise it on this repo.
3. Add the resulting token as `LHCI_GITHUB_APP_TOKEN` in repo secrets.
4. Workflow re-runs will now post a Lighthouse summary on each PR.

To upload to a long-lived dashboard (instead of LHCI's temporary public
storage), swap `lighthouserc.json` → `ci.upload.target` to
`"lhci"` and provide `LHCI_SERVER_BASE_URL` + `LHCI_TOKEN`.

---

## Netlify build hook (alternative to GitHub Actions)

If you'd rather gate Netlify deploys instead of GitHub PRs, add to
`netlify.toml`:

```toml
[build]
  publish = "."
  command = "python3 tests/audit.py"
```

Netlify will fail the deploy on any audit regression. Add Playwright /
Lighthouse here too if you want, but keep an eye on build minutes —
they run against a build container, not your live URL.

---

## Updating the test budget

Edit `tests/perf.spec.ts` `BUDGETS` array or `lighthouserc.json`
`assertions` section. Both are versioned with the repo so the budget
evolves alongside the site.
