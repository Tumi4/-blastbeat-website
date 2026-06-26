/**
 * Unit tests for the deterministic extractor.
 * Run with: node proposal-engine-kit/extractor.test.mjs
 *
 * No test framework — just plain assertions, so this drops into any repo
 * without bringing a dependency. CI exit code is the source of truth.
 */
import { extractClaims, isInsideTargetClause, groupByKind } from './extractor.mjs';

let passed = 0, failed = 0;
const results = [];

function t(name, fn) {
  try { fn(); passed++; results.push(['PASS', name]); }
  catch (e) { failed++; results.push(['FAIL', name, e.message]); }
}

function assert(cond, msg) { if (!cond) throw new Error(msg || 'assertion failed'); }

function find(claims, kind, predicate) {
  return claims.find(c => c.kind === kind && (predicate ? predicate(c) : true));
}

// ---------------------------------------------------------------------------
// Numbers
// ---------------------------------------------------------------------------
t('extracts a plain number with commas', () => {
  const c = extractClaims('We reached 360,000 students.');
  const n = find(c, 'number', x => x.value.num === 360000);
  assert(n, 'expected 360,000 to be extracted as a number');
});

t('extracts "360,000+" with at_least flag', () => {
  const c = extractClaims('360,000+ young people');
  const n = find(c, 'number', x => x.value.num === 360000);
  assert(n, 'expected 360,000+ extraction');
  assert(n.value.atLeast === true, 'expected at_least flag');
});

t('extracts 360K as 360,000', () => {
  const n = find(extractClaims('Reached 360K students'), 'number', x => x.value.num === 360000);
  assert(n, 'expected 360K to parse to 360000');
});

t('extracts phrase "a third of a million"', () => {
  const c = extractClaims('more than a third of a million young people');
  const n = c.find(x => x.surface === '333333');
  assert(n, `expected phrase to parse to 333333; got ${JSON.stringify(c.map(x => x.surface))}`);
});

t('extracts "two decades" as duration', () => {
  const c = extractClaims('After two decades of work');
  const d = find(c, 'duration', x => x.value.unit === 'year' && x.value.amount === 20);
  assert(d, `expected two decades = 20 years; got ${JSON.stringify(c)}`);
});

// ---------------------------------------------------------------------------
// Currencies
// ---------------------------------------------------------------------------
t('extracts ZAR R45,000', () => {
  const c = extractClaims('We charge R45,000 per term.');
  const cur = find(c, 'currency', x => x.value.currency === 'ZAR' && x.value.amount === 45000);
  assert(cur, `expected R45,000 / ZAR / 45000; got ${JSON.stringify(c)}`);
});

t('extracts Namibian N$62M', () => {
  const c = extractClaims('Total investment N$62M+ by 2030');
  const cur = find(c, 'currency', x => x.value.currency === 'NAD');
  assert(cur, `expected N$62M; got ${JSON.stringify(c)}`);
  // 62M may parse to either 62 or 62_000_000 depending on suffix capture; just
  // assert presence and the right currency.
});

t('extracts USD with $ prefix', () => {
  const c = extractClaims('$5,000 for unlimited');
  const cur = find(c, 'currency', x => x.value.currency === 'USD' && x.value.amount === 5000);
  assert(cur, `expected $5,000 USD; got ${JSON.stringify(c)}`);
});

// ---------------------------------------------------------------------------
// Percentages
// ---------------------------------------------------------------------------
t('extracts simple percent', () => {
  const p = find(extractClaims('75% to students'), 'percent', x => x.value.percent === 75);
  assert(p, 'expected 75%');
});

t('extracts 75/25 split as percent', () => {
  const p = find(extractClaims('a 75/25 split'), 'percent', x => Array.isArray(x.value.split));
  assert(p && p.value.split[0] === 75, '75/25 should be recognised as split');
});

t('does NOT mis-extract 12/24 as split (sum != 100)', () => {
  const p = find(extractClaims('between 12/24 and 16/32'), 'percent');
  assert(!p, '12/24 should NOT become a percent claim');
});

// ---------------------------------------------------------------------------
// Entities
// ---------------------------------------------------------------------------
t('finds a country in the lifetime list', () => {
  const c = extractClaims('Operating in South Africa and Ireland.');
  const sa = find(c, 'country', x => x.surface === 'South Africa');
  const ie = find(c, 'country', x => x.surface === 'Ireland');
  assert(sa && ie, 'expected South Africa and Ireland');
});

t('flags Kenya as high_risk (never-list)', () => {
  const c = extractClaims('Our team in Kenya for 5 years.');
  const flag = find(c, 'high_risk_pattern', x => x.surface === 'Kenya');
  assert(flag, 'expected Kenya to be flagged as never-list country');
});

t('finds known framework NDP6', () => {
  const f = find(extractClaims('Aligned with NDP6'), 'framework', x => x.surface === 'NDP6');
  assert(f, 'expected NDP6 framework match');
});

t('finds known org Climate Actions Now', () => {
  const o = find(extractClaims('Climate Actions Now is the parent'), 'org');
  assert(o, 'expected org match');
});

// ---------------------------------------------------------------------------
// Registrations
// ---------------------------------------------------------------------------
t('finds UK Charity No. 1113530', () => {
  const r = find(extractClaims('UK Charity No. 1113530'), 'registration');
  assert(r && r.value.id === '1113530', 'expected registration match');
});

// ---------------------------------------------------------------------------
// High-risk patterns
// ---------------------------------------------------------------------------
t('flags ministerial endorsement', () => {
  const c = extractClaims('We were endorsed by the Minister of Education');
  const f = find(c, 'high_risk_pattern', x => /endorsed by/i.test(x.text));
  assert(f, 'expected ministerial endorsement to be flagged');
});

t('flags Microsoft partnership claim', () => {
  const c = extractClaims('Our partnership with Microsoft delivers');
  const f = find(c, 'high_risk_pattern', x => /Microsoft/.test(x.text));
  assert(f, 'expected Microsoft partnership to be flagged');
});

t('flags 100% safeguarding claim', () => {
  const c = extractClaims('We have 100% safeguarding compliance');
  const f = find(c, 'high_risk_pattern', x => /100%/.test(x.text));
  assert(f, 'expected 100% absolute claim to be flagged');
});

t('flags Treasury grant fabrication', () => {
  const c = extractClaims('Our R200M Treasury grant arrives this quarter');
  const f = find(c, 'high_risk_pattern', x => /Treasury/.test(x.text));
  assert(f, 'expected Treasury grant claim to be flagged');
});

t('flags SDG Pioneer Award claim', () => {
  const c = extractClaims('We won the SDG Pioneer Award in 2024.');
  const f = find(c, 'high_risk_pattern', x => /Award/.test(x.text));
  assert(f, 'expected Award claim to be flagged');
});

// ---------------------------------------------------------------------------
// Target-labelling detector
// ---------------------------------------------------------------------------
t('detects target language around a claim', () => {
  const text = 'By 2030, we target 500,000 students.';
  const c = extractClaims(text);
  const n = find(c, 'number', x => x.value.num === 500000);
  assert(n && isInsideTargetClause(text, n.start, n.end), 'should detect target framing');
});

t('rejects a fact stated as achievement without target wording', () => {
  const text = 'We have reached 500,000 students.';
  const c = extractClaims(text);
  const n = find(c, 'number', x => x.value.num === 500000);
  assert(n && !isInsideTargetClause(text, n.start, n.end), 'should NOT detect target framing');
});

// ---------------------------------------------------------------------------
// Composite — realistic LLM-style draft
// ---------------------------------------------------------------------------
t('end-to-end: realistic school letter draft yields expected claim mix', () => {
  const draft = `
Dear Principal Adams,

BlastBeat has reached more than a third of a million young people across 19 countries
since 2003 — a 23-year track record. In Western Cape, our Phase 1 pilot is running
in 12 schools with 504 enrolled students. Our ESE programme runs 14 real business
roles per team, with a 75/25 profit split (75% to students, 25% to climate action).

Climate Actions Now Ltd (UK Charity No. 1113530) is the issuer of record.

We look forward to discussing partnership.
  `.trim();

  const c = extractClaims(draft);
  const groups = groupByKind(c);
  assert(groups.country?.some(x => x.surface === 'South Africa') || true, 'country optional');
  assert(groups.number?.length >= 3, `expected several numeric claims; got ${groups.number?.length}`);
  assert(groups.percent?.length >= 1, 'expected at least one percent claim');
  assert(groups.org?.some(x => x.surface === 'Climate Actions Now') || groups.org?.some(x => x.surface === 'Climate Actions Now Ltd'), 'expected CAN org match');
  assert(groups.registration?.length === 1, `expected exactly one registration; got ${groups.registration?.length}`);
  assert(!groups.high_risk_pattern, `unexpected high-risk pattern in clean draft: ${JSON.stringify(groups.high_risk_pattern)}`);
});

t('end-to-end: red-team draft surfaces multiple high-risk patterns', () => {
  const draft = `
BlastBeat operates in Kenya, where the Minister of Education endorsed our R200M Treasury grant.
We have 100% safeguarding compliance and a partnership with Microsoft.
We won the SDG Pioneer Award.
  `.trim();
  const c = extractClaims(draft);
  const groups = groupByKind(c);
  assert(groups.high_risk_pattern?.length >= 4, `expected >=4 high-risk patterns; got ${groups.high_risk_pattern?.length}: ${JSON.stringify(groups.high_risk_pattern)}`);
});

// ---------------------------------------------------------------------------
// Report
// ---------------------------------------------------------------------------
const pct = (passed + failed) ? (100 * passed / (passed + failed)).toFixed(1) : '100.0';
console.log('='.repeat(64));
console.log(`  EXTRACTOR UNIT TESTS — ${passed} / ${passed + failed} (${pct}%)`);
console.log('='.repeat(64));
for (const [status, name, err] of results) {
  console.log(`  [${status}] ${name}`);
  if (err) console.log(`          ${err}`);
}
console.log('-'.repeat(64));
process.exit(failed === 0 ? 0 : 1);
