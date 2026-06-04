/**
 * Deterministic claim extractor for the BlastBeat Proposal Engine.
 *
 * Pre-LLM safety layer. Given a draft document, returns every:
 *   - quantitative claim (numbers, percentages, durations, currency)
 *   - named entity (country, organisation, programme, framework, person)
 *   - high-risk pattern (endorsement, partnership, award, registration #)
 *
 * Why this exists:
 *   LLMs are bad at *complete* extraction of their own output. They miss
 *   implicit claims and paraphrases. A deterministic pass with regex +
 *   curated entity lists catches the long tail of numerical/factual
 *   claims BEFORE the LLM verifier sees them. The LLM then only has to
 *   judge structure/tone/coherence, not enumerate facts.
 *
 * Output: an array of Claim objects (see JSDoc below). Each has a stable
 * `kind` so the verifier can route it to the right matcher.
 *
 * @typedef {Object} Claim
 * @property {string} kind        'number' | 'percent' | 'duration' | 'currency' | 'year' | 'country' | 'org' | 'programme' | 'framework' | 'person' | 'registration' | 'high_risk_pattern'
 * @property {string} text        The raw matched text
 * @property {number} start       Character index in source
 * @property {number} end         Character index in source
 * @property {string} surface     The normalised surface form (for fact-matching)
 * @property {object} [value]     Structured value (e.g. { num: 360000 } or { amount: 45000, currency: 'ZAR' })
 * @property {string} [reason]    Why flagged (for high_risk_pattern)
 */

// ---------------------------------------------------------------------------
// Entity dictionaries — small, curated, maintained alongside facts.seed.json.
// Anything not in these lists that LOOKS like an entity should make the LLM
// verifier suspicious.
// ---------------------------------------------------------------------------

export const COUNTRIES_ACTIVE = new Set([
  'South Africa', 'Rwanda', 'Ghana', 'Nigeria', 'Ireland',
]);

// Known operating history. Kept tight on purpose — anything OUTSIDE this set
// in a draft should be treated as suspect by the verifier. Maintained by Tumelo
// against facts.seed.json `v.geography.countries`.
export const COUNTRIES_LIFETIME = new Set([
  ...COUNTRIES_ACTIVE,
  'United Kingdom', 'UK', 'United States', 'USA', 'Japan',
  'Belgium', 'Slovakia', 'Czechia', 'Korea', 'South Korea',
  'Uganda', 'Namibia',
]);

// Common LLM hallucination targets — countries we've never operated in.
// Surfacing one of these is a near-certain fabrication.
export const COUNTRIES_NEVER = new Set([
  'Kenya', 'Senegal', 'Ethiopia', 'Tanzania', 'Zimbabwe',
  'Brazil', 'Argentina', 'Mexico', 'Russia', 'France', 'Germany',
  'Spain', 'Italy', 'Egypt', 'Morocco', 'China', 'India', 'Australia',
]);

export const KNOWN_ORGS = new Set([
  'Climate Actions Now', 'Climate Actions Now Ltd', 'Climate Actions Now RSA',
  'BlastBeat', 'Blastbeat', 'BlastBeat Education', 'Eduponics', 'CAN Music', 'Can Music',
  'NIPDB', 'Brand Namibia', 'WCED', 'Western Cape Education Department',
  'The Ireland Funds', 'Rethink Ireland', 'QQI', 'EIIS',
]);

export const KNOWN_PROGRAMMES = new Set([
  'MACC', 'FootBeat', 'BlastBeat CAN', 'CAN', 'Music Arts Climate Challenge',
  'ESE', 'Event Social Enterprise',
]);

export const KNOWN_FRAMEWORKS = new Set([
  'NDP6', 'NDP 2030', 'NDP2030', 'Vision 2030', 'Brand Namibia',
  'CAPS', 'B-BBEE', 'BBBEE', 'POPIA', "Children's Act",
  'AU Agenda 2063', 'Agenda 2063', 'SDG', 'SDGs', 'UN SDG', 'UN SDGs',
  'QQI', 'EIIS', 'GDPR', 'EMIS', 'NPO',
]);

// Words that turn a fact into a target/projection. Used by the labeller.
export const TARGET_WORDS = [
  'target', 'targets', 'targeted', 'targeting',
  'projected', 'projection',
  'goal', 'aim', 'aiming', 'aim to',
  'by 20', 'will reach', 'plan to', 'planning to',
  'expected to', 'anticipated', 'forecast',
  'if funded', 'proposed', 'pathway',
];

// Patterns that almost never appear in honest BlastBeat copy.
// Each match -> high_risk_pattern claim with reason.
export const HIGH_RISK_PATTERNS = [
  { regex: /\bendorsed by (?:the )?Minister\b/gi,           reason: 'Ministerial endorsement claim — no such endorsement is in facts list' },
  { regex: /\bRoyal patronage\b/gi,                          reason: 'Royal patronage claim — none verified' },
  { regex: /\b(?:awarded|won) (?:the )?[A-Z][A-Za-z ]{2,40}(?:Award|Prize|Medal)\b/g, reason: 'Award/prize claim — must be cross-checked against facts list' },
  { regex: /\b(?:partnership|partnered) with (Microsoft|Google|Apple|Amazon|Meta|World Bank|UNESCO|UNICEF)\b/gi, reason: 'Partnership claim with high-profile org — must be verified' },
  { regex: /\b(?:nominat\w+) for (?:the )?Nobel\b/gi,        reason: 'Nobel nomination claim — fabrication risk' },
  { regex: /\bTreasury (?:grant|funding|allocation)\b/gi,    reason: 'Government Treasury claim — must be verified' },
  { regex: /\b100% (?:safeguarding|compliance|success|graduation)\b/gi, reason: 'Absolute 100% claim — almost always overstated' },
];

// ---------------------------------------------------------------------------
// Number parsing — handles 360,000 / 360k / 360K / 360 000 / a third of a million
// ---------------------------------------------------------------------------

const NUM_WORDS = {
  'zero': 0, 'one': 1, 'two': 2, 'three': 3, 'four': 4, 'five': 5,
  'six': 6, 'seven': 7, 'eight': 8, 'nine': 9, 'ten': 10,
  'eleven': 11, 'twelve': 12, 'thirteen': 13, 'fourteen': 14, 'fifteen': 15,
  'sixteen': 16, 'seventeen': 17, 'eighteen': 18, 'nineteen': 19, 'twenty': 20,
  'thirty': 30, 'forty': 40, 'fifty': 50, 'sixty': 60, 'seventy': 70,
  'eighty': 80, 'ninety': 90, 'hundred': 100, 'thousand': 1000, 'million': 1_000_000,
};

function parseLooseNumber(s) {
  if (!s) return null;
  const cleaned = s.replace(/[,\s_]/g, '').trim();
  // 360k, 360K, 360M, 2.5M, 1.2bn
  let m = cleaned.match(/^(\d+(?:\.\d+)?)([kKmMbB]|bn|m|k)?\+?$/);
  if (m) {
    let n = parseFloat(m[1]);
    const suf = (m[2] || '').toLowerCase();
    if (suf === 'k') n *= 1_000;
    else if (suf === 'm') n *= 1_000_000;
    else if (suf === 'b' || suf === 'bn') n *= 1_000_000_000;
    return Math.round(n);
  }
  // Pure digits
  m = cleaned.match(/^\d+$/);
  if (m) return parseInt(cleaned, 10);
  return null;
}

function parseWordNumber(phrase) {
  if (!phrase) return null;
  const t = phrase.toLowerCase().replace(/[-]/g, ' ').trim();
  // Friendly aliases
  const aliases = {
    'a quarter of a million': 250_000,
    'one quarter of a million': 250_000,
    'a third of a million': 333_333,
    'one third of a million': 333_333,
    'more than a third of a million': 333_333,
    'half a million': 500_000,
    'half of a million': 500_000,
    'a million': 1_000_000,
    'two decades': 20,
    'two and a half decades': 25,
  };
  if (aliases[t] != null) return aliases[t];
  // Single compound: "twenty three", "three hundred and sixty thousand"
  const parts = t.split(/\s+(?:and\s+)?/);
  let total = 0, current = 0, ok = parts.length > 0;
  for (const p of parts) {
    if (NUM_WORDS[p] != null) {
      const v = NUM_WORDS[p];
      if (v === 100) current = (current || 1) * 100;
      else if (v === 1000 || v === 1_000_000) { total += (current || 1) * v; current = 0; }
      else current += v;
    } else { ok = false; break; }
  }
  return ok ? total + current : null;
}

// ---------------------------------------------------------------------------
// Main extractor
// ---------------------------------------------------------------------------

/**
 * @param {string} text
 * @returns {Claim[]}
 */
export function extractClaims(text) {
  if (!text) return [];
  /** @type {Claim[]} */
  const claims = [];

  // ---- Currency (do FIRST so a number like "R45,000" isn't double-counted)
  // Symbols: R, ZAR, $, USD, US$, €, EUR, £, GBP, N$ (Namibian), NAD, ¥, JPY
  // Negative lookbehind: don't match inside a word ("USA45000" should not fire).
  const currencyRegex = /(?<![A-Za-z0-9])(US\$|N\$|ZAR|USD|EUR|GBP|NAD|JPY|R|\$|€|£|¥)\s?(\d[\d,. ]*\d|\d)(\s?(?:k|K|m|M|bn|million|billion))?/g;
  const sym2Iso = { 'R':'ZAR', 'ZAR':'ZAR', '$':'USD', 'USD':'USD', 'US$':'USD', '€':'EUR', 'EUR':'EUR', '£':'GBP', 'GBP':'GBP', 'N$':'NAD', 'NAD':'NAD', '¥':'JPY', 'JPY':'JPY' };
  for (const m of text.matchAll(currencyRegex)) {
    const sym = m[1];
    const amount = parseLooseNumber((m[2] || '') + (m[3] || '').trim());
    claims.push({
      kind: 'currency',
      text: m[0], surface: m[0].replace(/\s+/g, ' '),
      start: m.index, end: m.index + m[0].length,
      value: { amount, currency: sym2Iso[sym] || sym },
    });
  }

  // ---- Percentages — no trailing \b (the % itself is non-word and breaks boundary detection)
  const pctRegex = /\b(\d{1,3}(?:\.\d+)?)\s?(?:%|percent|per\s?cent)/gi;
  for (const m of text.matchAll(pctRegex)) {
    claims.push({
      kind: 'percent', text: m[0], surface: m[0],
      start: m.index, end: m.index + m[0].length,
      value: { percent: parseFloat(m[1]) },
    });
  }
  // ---- Profit split shorthand "75/25"
  for (const m of text.matchAll(/\b(\d{1,2})\s?\/\s?(\d{1,2})\b/g)) {
    const a = parseInt(m[1], 10), b = parseInt(m[2], 10);
    if (a + b === 100) {
      claims.push({
        kind: 'percent', text: m[0], surface: `${a}/${b} split`,
        start: m.index, end: m.index + m[0].length,
        value: { split: [a, b] },
      });
    }
  }

  // ---- Durations: "23 years", "16 weeks", "90 days", "two decades"
  const durRegex = /\b(\d+(?:\.\d+)?|[a-z]+(?:[\s-][a-z]+){0,3})[\s-]?(year|years|yr|month|months|week|weeks|day|days|decade|decades)\b/gi;
  for (const m of text.matchAll(durRegex)) {
    let n = parseLooseNumber(m[1]);
    if (n == null) n = parseWordNumber(m[1]);
    if (n == null) continue;
    const unit = m[2].toLowerCase().replace(/s$/, '');
    claims.push({
      kind: 'duration', text: m[0], surface: `${n} ${unit}${n === 1 ? '' : 's'}`,
      start: m.index, end: m.index + m[0].length,
      value: { amount: n, unit },
    });
  }

  // ---- Years (4-digit, 1900-2099)
  for (const m of text.matchAll(/\b(19\d{2}|20\d{2})\b/g)) {
    claims.push({
      kind: 'year', text: m[0], surface: m[0],
      start: m.index, end: m.index + m[0].length,
      value: { year: parseInt(m[1], 10) },
    });
  }

  // ---- Bare numbers (including +/k suffix) — skip if inside an already-claimed span
  const taken = (i) => claims.some(c => i >= c.start && i < c.end);
  const numRegex = /\b\d{1,3}(?:,\d{3})+(?:\+)?|\b\d+(?:\.\d+)?[kKmM]?\+?\b/g;
  for (const m of text.matchAll(numRegex)) {
    if (taken(m.index)) continue;
    const n = parseLooseNumber(m[0]);
    if (n == null) continue;
    claims.push({
      kind: 'number', text: m[0], surface: String(n) + (m[0].endsWith('+') ? '+' : ''),
      start: m.index, end: m.index + m[0].length,
      value: { num: n, atLeast: m[0].endsWith('+') },
    });
  }

  // ---- Friendly word-numbers ("a third of a million", "half a million", "two decades")
  const phrasePatterns = [
    /\b(?:more than |over |around |approximately |about )?(?:a |one )?(?:quarter|third|half) of a million\b/gi,
    /\bhalf a million\b/gi,
    /\ba million\b/gi,
    /\b(?:two|three|four|five) decades?\b/gi,
    /\b(?:twenty|thirty|forty|fifty|sixty|seventy|eighty|ninety)[\s-]?(?:one|two|three|four|five|six|seven|eight|nine)?[\s-]years?\b/gi,
  ];
  for (const re of phrasePatterns) {
    for (const m of text.matchAll(re)) {
      if (taken(m.index)) continue;
      const cleaned = m[0].toLowerCase().replace(/^(more than |over |around |approximately |about )/, '').trim();
      const n = parseWordNumber(cleaned) ?? parseWordNumber(cleaned.replace(' of', ''));
      if (n == null) continue;
      // Was the original phrase a duration?
      const isDuration = /year|decade/i.test(m[0]);
      claims.push({
        kind: isDuration ? 'duration' : 'number',
        text: m[0], surface: String(n),
        start: m.index, end: m.index + m[0].length,
        value: isDuration ? { amount: n, unit: 'year' } : { num: n },
      });
    }
  }

  // ---- Entity lookups (case-sensitive on first letter; the rest case-insensitive)
  function findEntities(set, kind) {
    for (const e of set) {
      const re = new RegExp(`\\b${e.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'g');
      for (const m of text.matchAll(re)) {
        claims.push({
          kind, text: m[0], surface: e,
          start: m.index, end: m.index + m[0].length,
        });
      }
    }
  }
  findEntities(COUNTRIES_LIFETIME, 'country');
  findEntities(KNOWN_ORGS, 'org');
  findEntities(KNOWN_PROGRAMMES, 'programme');
  findEntities(KNOWN_FRAMEWORKS, 'framework');

  // ---- Country in NEVER list = high-risk fabrication
  for (const c of COUNTRIES_NEVER) {
    const re = new RegExp(`\\b${c}\\b`, 'g');
    for (const m of text.matchAll(re)) {
      claims.push({
        kind: 'high_risk_pattern', text: m[0], surface: c,
        start: m.index, end: m.index + m[0].length,
        reason: `Country "${c}" is not in BlastBeat's lifetime operating list. Likely fabrication.`,
      });
    }
  }

  // ---- Registration numbers (Charity No., Reg No., Company No.)
  const regRe = /\b(Charity|Reg(?:istration)?|Company)\s*(?:No\.?|Number)\s*\.?\s*([A-Z]{0,3}\s?\d{4,10})\b/gi;
  for (const m of text.matchAll(regRe)) {
    claims.push({
      kind: 'registration', text: m[0], surface: m[0],
      start: m.index, end: m.index + m[0].length,
      value: { type: m[1], id: m[2].trim() },
    });
  }

  // ---- High-risk pattern sweep
  for (const { regex, reason } of HIGH_RISK_PATTERNS) {
    for (const m of text.matchAll(regex)) {
      claims.push({
        kind: 'high_risk_pattern', text: m[0], surface: m[0],
        start: m.index, end: m.index + m[0].length,
        reason,
      });
    }
  }

  // Stable sort by start index
  claims.sort((a, b) => a.start - b.start || a.end - b.end);
  return claims;
}

// ---------------------------------------------------------------------------
// Target-labelling check — does a sentence around a claim contain target words?
// Used by the verifier to decide whether a "target" tier fact is properly labelled.
// ---------------------------------------------------------------------------

/**
 * @param {string} text
 * @param {number} claimStart
 * @param {number} claimEnd
 * @returns {boolean}
 */
export function isInsideTargetClause(text, claimStart, claimEnd) {
  // Look at the surrounding sentence (back to . or start, forward to . or end)
  const sentStart = Math.max(0, text.lastIndexOf('.', claimStart - 1) + 1);
  const nextDot = text.indexOf('.', claimEnd);
  const sentEnd = nextDot === -1 ? text.length : nextDot;
  const window = text.slice(sentStart, sentEnd).toLowerCase();
  return TARGET_WORDS.some(w => window.includes(w));
}

// Convenience: group claims by kind
export function groupByKind(claims) {
  const out = {};
  for (const c of claims) (out[c.kind] ||= []).push(c);
  return out;
}
