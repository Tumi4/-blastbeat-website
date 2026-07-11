/* Node test-runner suite for the public licence registry.
   Run: npm run test:functions */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { handle, findLicence, publicView } from '../../netlify/functions/verify-licence.mjs';

const UUID = '3f2a9c1b-7e64-4d21-9a55-1234567890ab';
const ISSUED = {
  id: 'urn:uuid:' + UUID,
  school: 'Rhodes High School',
  sponsor: 'Tekkers',
  tier: 'founding-pilot',
  region: 'ZA',
  status: 'valid',
  partner: 'Tekkers Rep',       // internal — must never appear in the public view
  partnerCode: 'TREP-001',      // internal
  proofHash: 'abc123def456',
  vc: {
    issuer: { name: 'Climate Actions Now RSA (Pty) Ltd' },
    issuanceDate: '2026-06-01T10:00:00.000Z',
    validFrom: '2026-06-01T00:00:00.000Z',
    validUntil: '2099-12-01T00:00:00.000Z',
    proof: { proofValue: 'abc123def456' },
    credentialSubject: {
      schoolName: 'Rhodes High School',
      tier: 'Founding Pilot — bronze',
      region: 'ZA',
      sponsor: { name: 'Tekkers', notes: 'private deal note' }, // notes internal
    },
  },
};
const ROSTER = { id: 'LIC-2026-004', school: 'BLASC Academy', sponsor: 'FootBeat', tier: 'founding-pilot', region: 'ZA', status: 'issued', validFrom: '2026-05-18', validUntil: '2026-11-18' };

function memStore(licences) {
  return { getState: async () => ({ rev: 1, data: { licences } }) };
}
function req(id, ip) {
  return new Request('https://www.blastbeat.education/api/verify/' + encodeURIComponent(id), {
    headers: { 'x-nf-client-connection-ip': ip || '10.1.1.' + Math.floor(Math.random() * 250) },
  });
}

test('finds an issued credential by 8-char short id, any case', () => {
  assert.ok(findLicence([ISSUED], '3F2A9C1B'));
  assert.ok(findLicence([ISSUED], '3f2a9c1b'));
  assert.ok(findLicence([ISSUED], UUID));
  assert.ok(findLicence([ISSUED], 'urn:uuid:' + UUID));
  assert.equal(findLicence([ISSUED], 'ffffffff'), null);
});

test('finds a roster licence by its programme id', () => {
  assert.ok(findLicence([ROSTER], 'LIC-2026-004'));
  assert.ok(findLicence([ROSTER], 'lic-2026-004'));
});

test('rejects needles shorter than the printed 8-char short id', () => {
  assert.equal(findLicence([ISSUED], '3f'), null);
  assert.equal(findLicence([ISSUED], '3f2a9c1'), null, '7 chars is not enough');
  assert.equal(findLicence([ISSUED], ''), null);
});

test('ambiguous prefixes resolve to nothing, not the wrong licence', () => {
  const twin = { ...ISSUED, id: 'urn:uuid:3f2a9c1b-ffff-4d21-9a55-000000000000' };
  assert.equal(findLicence([ISSUED, twin], '3f2a9c1b'), null, 'two matches ⇒ no answer');
  assert.ok(findLicence([ISSUED, twin], UUID), 'full id still resolves');
});

test('public view exposes certificate fields only', () => {
  const v = publicView(ISSUED);
  assert.equal(v.status, 'valid');
  assert.equal(v.school, 'Rhodes High School');
  assert.equal(v.sponsor, 'Tekkers');
  assert.equal(v.issuer, 'Climate Actions Now RSA (Pty) Ltd');
  assert.equal(v.proofHash, 'abc123def456');
  const flat = JSON.stringify(v);
  assert.ok(!flat.includes('TREP-001'), 'partner code stays internal');
  assert.ok(!flat.includes('Tekkers Rep'), 'partner name stays internal');
  assert.ok(!flat.includes('private deal note'), 'sponsor notes stay internal');
});

test('revoked and expired beat valid', () => {
  assert.equal(publicView({ ...ISSUED, status: 'revoked', revokedAt: '2026-07-01' }).status, 'revoked');
  const expired = { ...ISSUED, vc: { ...ISSUED.vc, validUntil: '2020-01-01T00:00:00.000Z' } };
  assert.equal(publicView(expired).status, 'expired');
});

test('roster lines (no vc) report status roster', () => {
  assert.equal(publicView({ ...ROSTER, validUntil: '2099-01-01' }).status, 'roster');
});

test('HTTP: found licence answers with public view', async () => {
  const res = await handle(req('3f2a9c1b'), { store: memStore([ISSUED]) });
  assert.equal(res.status, 200);
  const body = await res.json();
  assert.equal(body.found, true);
  assert.equal(body.status, 'valid');
});

test('HTTP: unknown id answers found:false with registry online', async () => {
  const res = await handle(req('deadbeef'), { store: memStore([ISSUED]) });
  const body = await res.json();
  assert.equal(body.found, false);
  assert.equal(body.registry, 'online');
});

test('HTTP: malformed percent-encoding answers gracefully, no 500', async () => {
  // Raw URL on purpose — req() would percent-encode the % away.
  const res = await handle(new Request('https://x/api/verify/100%zz', {
    headers: { 'x-nf-client-connection-ip': '10.9.9.9' },
  }), { store: memStore([ISSUED]) });
  assert.equal(res.status, 200);
  assert.equal((await res.json()).found, false);
});

test('HTTP: only GET is allowed', async () => {
  const res = await handle(new Request('https://x/api/verify/abc', { method: 'POST' }), { store: memStore([]) });
  assert.equal(res.status, 405);
});
