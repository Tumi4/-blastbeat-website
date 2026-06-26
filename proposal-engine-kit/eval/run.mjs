/**
 * Eval harness — grades a verifier function against the red-team + golden sets.
 *
 * Usage:
 *   node eval/run.mjs                 # uses the stub verifier (extractor only)
 *   node eval/run.mjs --report=md     # markdown report
 *
 * To plug in your real verifier:
 *   import { extractClaims } from '../extractor.mjs';
 *   import { runEval } from './run.mjs';
 *   await runEval(async ({ prompt, draft, facts }) => {
 *     // call YOUR pipeline here. Return { final_text, flags, classifications }.
 *   });
 */
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { extractClaims, isInsideTargetClause, COUNTRIES_NEVER } from '../extractor.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));

// ---------------------------------------------------------------------------
// Load eval data
// ---------------------------------------------------------------------------
const facts    = JSON.parse(readFileSync(join(__dirname, '..', 'facts.seed.json'), 'utf8'));
const redTeam  = JSON.parse(readFileSync(join(__dirname, 'red-team.json'),         'utf8'));
const golden   = JSON.parse(readFileSync(join(__dirname, 'golden.json'),           'utf8'));

// ---------------------------------------------------------------------------
// Stub verifier — extractor-only. No LLM. Catches everything the deterministic
// layer can catch. Phase 1 will swap this for the real two-pass pipeline.
// ---------------------------------------------------------------------------
function stubVerifier({ draft, facts }) {
  const claims = extractClaims(draft);

  // Build a value index for fast verified-fact lookup
  const verifiedNumbers = new Set();
  for (const f of facts.verified) {
    if (typeof f.canonical_value === 'number') verifiedNumbers.add(f.canonical_value);
    if (f.canonical_value && typeof f.canonical_value === 'object') {
      for (const v of Object.values(f.canonical_value)) {
        if (typeof v === 'number') verifiedNumbers.add(v);
      }
    }
  }
  const targetNumbers = new Set();
  for (const f of facts.target) {
    if (typeof f.canonical_value === 'number') targetNumbers.add(f.canonical_value);
  }

  /** @type {Array<{kind:string, text:string, status:string, reason:string}>} */
  const classifications = [];
  const flags = [];

  for (const c of claims) {
    // High-risk patterns always flag
    if (c.kind === 'high_risk_pattern') {
      classifications.push({ kind: c.kind, text: c.text, status: 'flagged', reason: c.reason || 'high-risk pattern' });
      flags.push({ severity: 'critical', claim: c.text, reason: c.reason });
      continue;
    }

    if (c.kind === 'number' || c.kind === 'currency') {
      const n = c.value?.num ?? c.value?.amount;
      if (verifiedNumbers.has(n)) {
        classifications.push({ kind: c.kind, text: c.text, status: 'verified' });
      } else if (targetNumbers.has(n)) {
        const labelled = isInsideTargetClause(draft, c.start, c.end);
        if (labelled) {
          classifications.push({ kind: c.kind, text: c.text, status: 'target_labelled' });
        } else {
          classifications.push({ kind: c.kind, text: c.text, status: 'target_unlabelled', reason: 'target fact stated as achievement' });
          flags.push({ severity: 'high', claim: c.text, reason: 'target stated as achievement' });
        }
      } else if (n != null) {
        classifications.push({ kind: c.kind, text: c.text, status: 'unverified', reason: 'no matching fact' });
        flags.push({ severity: 'medium', claim: c.text, reason: 'no matching fact' });
      }
    }
  }

  return { final_text: draft, classifications, flags };
}

// ---------------------------------------------------------------------------
// Grading
// ---------------------------------------------------------------------------
function gradePrompt(p, verifierOutput) {
  const result = { id: p.id, severity: p.severity, category: p._category, pass: true, scores: {}, notes: [] };

  if (p._category === 'red-team') {
    // Each must_flag claim should appear in flags or unverified/target_unlabelled classifications
    const flagged = new Set([
      ...verifierOutput.flags.map(f => f.claim.toLowerCase()),
      ...verifierOutput.classifications.filter(c => c.status === 'unverified' || c.status === 'target_unlabelled' || c.status === 'flagged').map(c => c.text.toLowerCase()),
    ]);

    let caught = 0;
    for (const need of p.must_flag || []) {
      const hit = [...flagged].some(f => need.claim.toLowerCase().split(' ').some(token => f.includes(token)));
      if (hit) caught++;
      else result.notes.push(`MISS: "${need.claim}" — ${need.reason}`);
    }
    result.scores.must_flag_recall = `${caught}/${(p.must_flag || []).length}`;
    if (caught < (p.must_flag || []).length) result.pass = false;
  }

  if (p._category === 'golden') {
    // Should be zero "flagged" or "unverified" entries for clean drafts
    const wrong = verifierOutput.flags.filter(f => f.severity === 'critical' || f.severity === 'high');
    const wrong_targets = verifierOutput.classifications.filter(c => c.status === 'target_unlabelled');
    result.scores.false_positive_flags = wrong.length;
    result.scores.target_unlabelled = wrong_targets.length;
    // For verified facts — were the canonical numbers found?
    if (p.expected_verified_facts) {
      const required = p.expected_verified_facts.length;
      const present = verifierOutput.classifications.filter(c => c.status === 'verified').length;
      result.scores.verified_present = `${present}/${required}`;
    }
    if (wrong.length > 0) result.pass = false;
  }

  return result;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
export async function runEval(verifier = stubVerifier) {
  const all = [];
  for (const p of redTeam.prompts) { p._category = 'red-team'; all.push(p); }
  for (const p of golden.prompts)  { p._category = 'golden';   all.push(p); }

  const results = [];
  for (const p of all) {
    const draft = p.simulated_draft;
    const out = await verifier({ prompt: p.prompt, draft, facts });
    results.push(gradePrompt(p, out));
  }
  return results;
}

function report(results) {
  const byCat = { 'red-team': [], 'golden': [] };
  for (const r of results) byCat[r.category].push(r);

  console.log('='.repeat(74));
  console.log('  BLASTBEAT VERIFIER EVAL — STUB VERIFIER (deterministic extractor only)');
  console.log('='.repeat(74));

  for (const cat of ['red-team', 'golden']) {
    console.log(`\n  ${cat.toUpperCase()}  (${byCat[cat].filter(r => r.pass).length} / ${byCat[cat].length} pass)`);
    console.log('  ' + '-'.repeat(70));
    for (const r of byCat[cat]) {
      const sym = r.pass ? 'PASS' : 'FAIL';
      const scoreLine = Object.entries(r.scores).map(([k, v]) => `${k}=${v}`).join('  ');
      console.log(`    [${sym}] ${r.id.padEnd(34)} ${scoreLine}`);
      if (r.notes.length && !r.pass) {
        for (const n of r.notes.slice(0, 3)) console.log(`           ${n}`);
        if (r.notes.length > 3) console.log(`           ...and ${r.notes.length - 3} more`);
      }
    }
  }

  const totalPass = results.filter(r => r.pass).length;
  console.log('\n' + '='.repeat(74));
  console.log(`  OVERALL  ${totalPass} / ${results.length}  (${(100*totalPass/results.length).toFixed(1)}%)`);
  console.log('='.repeat(74));
  console.log('\n  NOTE: This is the stub verifier (deterministic extractor only).');
  console.log('  Failures here are EXPECTED for prompts that require LLM-driven');
  console.log('  semantic checking (paraphrase detection, claim equivalence,');
  console.log('  context-aware target-labelling). The eval set\'s job is to');
  console.log('  define WHAT a real verifier must catch. Phase 1 implements the');
  console.log('  real two-pass pipeline that should close the gap.');
}

const isCli = import.meta.url === `file://${process.argv[1]}`;
if (isCli) {
  const results = await runEval(stubVerifier);
  report(results);
  process.exit(0);
}
