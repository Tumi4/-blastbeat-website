/* ============================================================
   Netlify Function: /api/verify/:id — public licence registry.

   Every printed certificate carries a QR pointing at
   blastbeat.education/verify/<short-id>. Before this endpoint existed
   the verify page could only say "ask the issuer for the JSON file".
   Now a sponsor scanning the QR gets a real registry answer: does this
   licence exist, is it valid / revoked / expired, who issued it.

   Returns ONLY what is already printed on the certificate itself
   (school, sponsor name, tier, dates, issuer, proof hash) — never
   internal notes, partner attribution or contact details.

   No auth (public by design), no cookies. Read-only. Backed by the
   same "bb-admin" Blobs store the dashboard writes to.
   ============================================================ */

import { getStore } from '@netlify/blobs';

const RATE_LIMIT = 30;
const WINDOW_MS = 60_000;
const buckets = new Map();
function allowed(ip) {
  const now = Date.now();
  const recent = (buckets.get(ip) || []).filter((t) => now - t < WINDOW_MS);
  if (recent.length >= RATE_LIMIT) return false;
  recent.push(now);
  buckets.set(ip, recent);
  if (buckets.size > 5000) buckets.clear();
  return true;
}

function json(status, body) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
  });
}

// Match "3F2A9C1B", "3f2a9c1b-...", full urn:uuid — case/hyphen-insensitive
// prefix match against issued credential ids, exact match on roster ids.
function normalise(s) {
  return String(s || '').toLowerCase().replace(/^urn:uuid:/, '').replace(/-/g, '');
}

export function findLicence(licences, rawId) {
  const list = licences || [];
  // Roster lines use programme ids like "LIC-2026-004" — exact match only.
  const exact = list.find((l) => String(l.id || '').toLowerCase() === String(rawId || '').toLowerCase());
  if (exact) return exact;
  // Prefix match needs at least the printed 8-char short id — shorter
  // needles could silently resolve to the wrong licence.
  const needle = normalise(rawId);
  if (!needle || needle.length < 8) return null;
  const hits = list.filter((l) => normalise(l.id).startsWith(needle));
  return hits.length === 1 ? hits[0] : null; // ambiguous prefix ⇒ no answer
}

export function publicView(l) {
  const now = Date.now();
  const vc = l.vc || null;
  const sub = (vc && vc.credentialSubject) || {};
  const validUntil = vc ? vc.validUntil : l.validUntil;
  let status = 'valid';
  if (l.status === 'revoked') status = 'revoked';
  else if (validUntil && Date.parse(validUntil) < now) status = 'expired';
  else if (!vc) status = 'roster'; // agreed pipeline line, credential not stamped yet
  return {
    found: true,
    status,
    credentialed: !!vc,
    id: l.id,
    school: sub.schoolName || l.school || '',
    sponsor: (sub.sponsor && sub.sponsor.name) || l.sponsor || '',
    tier: sub.tier || l.tier || '',
    region: sub.region || l.region || '',
    issuer: vc ? (vc.issuer && vc.issuer.name) : null,
    issuanceDate: vc ? vc.issuanceDate : null,
    validFrom: vc ? vc.validFrom : l.validFrom || null,
    validUntil: validUntil || null,
    proofHash: l.proofHash || (vc && vc.proof && vc.proof.proofValue) || null,
    revokedAt: l.revokedAt || null,
  };
}

export async function handle(req, deps = {}) {
  if (req.method !== 'GET') return json(405, { error: 'method_not_allowed' });

  const ip = req.headers.get('x-nf-client-connection-ip')
    || req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
  if (!allowed(ip)) return json(429, { error: 'rate_limited' });

  const url = new URL(req.url);
  const rawSegment = url.pathname.replace(/\/+$/, '').split('/').pop() || '';
  let id;
  try {
    id = decodeURIComponent(rawSegment);
  } catch {
    id = rawSegment; // malformed %-encoding: match on the raw text, don't 500
  }
  if (!id || id === 'verify') return json(400, { found: false, error: 'missing_id' });

  let state = null;
  try {
    const store = deps.store || getStore({ name: 'bb-admin', consistency: 'strong' });
    state = deps.store ? await store.getState() : await store.get('state', { type: 'json' });
  } catch (e) {
    console.log('registry unavailable:', e && e.message);
    return json(200, { found: false, registry: 'offline' });
  }

  const licences = state && state.data ? state.data.licences : [];
  const hit = findLicence(licences, id);
  if (!hit) return json(200, { found: false, registry: 'online' });
  return json(200, publicView(hit));
}

export default (req) => handle(req);

export const config = { path: ['/api/verify', '/api/verify/*'] };
