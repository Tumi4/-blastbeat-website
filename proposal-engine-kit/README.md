# BlastBeat Proposal Engine — Verification Kit

**Pre-code safety harness for the Proposal & Grant Engine.** Build Phase 1
against this. The kit defines, in code, what "verified" actually means
and gives you a way to measure whether a verifier is shipping or not.

## Contents

```
facts.seed.json              The three-tier facts list (verified / target /
                             needs_confirmation) + known-false patterns.
                             Tumelo-curated. Robert read-only.
extractor.mjs                Deterministic pre-LLM claim extractor. Numbers,
                             percentages, durations, currencies, countries,
                             organisations, frameworks, registrations,
                             high-risk patterns.
extractor.test.mjs           25 unit tests for the extractor. Catches the
                             long tail. Run: node extractor.test.mjs.
eval/red-team.json           15 adversarial prompts the verifier MUST catch.
eval/golden.json             5 honest prompts the verifier must NOT mis-flag.
eval/run.mjs                 Grading harness. Plug in your real verifier;
                             the harness scores precision and recall.
eval/methodology.md          How to use, when to add prompts, what the
                             ship gates are.
```

## Start here

```bash
cd proposal-engine-kit

# 1) Confirm the extractor passes its own unit tests.
node extractor.test.mjs            # expect 25/25 (100.0%)

# 2) Run the eval baseline (stub verifier = extractor only, no LLM).
node eval/run.mjs                  # red-team 7/15, golden 5/5 — known baseline

# 3) Build Phase 1's verifier against the eval/methodology.md plug-in interface.
#    Ship gate: ≥95% red-team recall, 0% golden false-positive rate.
```

## Why this is the first thing to build

The whole product proposition is *"nothing reaches a document unverified."*
That promise has to be **measurable** or it's marketing. The eval set
exists so that the team building Phase 1 can answer two questions every
day:

1. **Does the verifier catch the lies?** (red-team recall)
2. **Does the verifier respect the truths?** (golden false-positive rate)

Without that measurement, the team will ship on vibes and a single missed
fabrication will burn the trust the product was built to deliver.

## What "verified" means here

The facts model has three tiers, each with strict semantics:

| Tier | Output rule |
|---|---|
| `verified` | Assertable as fact. Has `source_url` and `last_verified_at` within 12 months. |
| `target` | Must appear ONLY inside a target/projected/by-2030 clause. Verifier rewrites if needed. |
| `needs_confirmation` | Must be replaced with `placeholder_output` string and flagged for Tumelo. |
| _no match_ | Removed from document. Never silently asserted. |

See `facts.seed.json` for examples and the seed data the team starts with.

## What this kit deliberately doesn't do

- It does **not** call an LLM. The eval is reproducible offline at zero
  cost. The real LLM verifier slots in via `eval/run.mjs runEval(verifier)`.
- It does **not** ship a UI. Phase 1 builds Robert's UI separately.
- It does **not** include `government-frameworks` content for Rwanda,
  Ghana, Nigeria or Japan. Those stubs are flagged in `facts.seed.json`;
  filling them is a human policy-expertise task, not an AI task.
- It does **not** auto-generate the `simulated_draft` fields in the eval.
  Those were authored by hand because the eval should grade a specific
  realistic lie, not a moving target.

## Porting to the new repo

The kit is self-contained. When the new proposal-engine repo is created:

```bash
git mv proposal-engine-kit/ /path/to/new-repo/
# or
cp -r proposal-engine-kit/ /path/to/new-repo/lib/verification/
```

`extractor.mjs` has zero dependencies and can be imported directly into
a Netlify Function. The eval harness uses only Node built-ins.

## What still needs doing before Phase 1 starts

Per the audit notes:

- [ ] **Confirm every seed fact has a `source_url` and `last_verified_at`** —
      the placeholder `INTERNAL: ...` entries need real URLs or document
      references before they count as verified.
- [ ] **Resolve the "12 vs 16-week sprint" contradiction** flagged in
      `facts.seed.json` → `v.programme.duration`. Tumelo to confirm.
- [ ] **Refresh Japan figures.** `v.japan` is stale > 6 months.
- [ ] **Author Rwanda / Ghana / Nigeria / Japan framework entries**, or
      explicitly DISABLE alignment claims for those geographies until
      filled.
- [ ] **Add at least one paraphrase-drift prompt per audience.** The current
      set covers investor/press/funder/government well, but parent and
      student audiences are thin.

Without these, "verified" still rests partly on hope. With them, the
trust-and-send promise becomes defensible.
