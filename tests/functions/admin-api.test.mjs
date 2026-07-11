/* Node test-runner suite for the admin backend function.
   Run: npm run test:functions
   The handler takes web-standard Request/Response, so we call it
   directly with an injected in-memory store — no Netlify emulator. */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { handle } from '../../netlify/functions/admin-api.mjs';

const ENV = { ADMIN_ACCESS_CODE: 'test-code-123', ADMIN_SESSION_SECRET: 'test-secret' };
const BASE = 'https://www.blastbeat.education/api/admin';
const ORIGIN = 'https://www.blastbeat.education';

// Mirrors the etag-conditional Blobs interface in admin-api.mjs realStore().
function memStore(initial = {}) {
  let state = initial.state ?? null;
  let tag = state ? 'v1' : null;
  let tagCounter = 1;
  let raceArmed = false;
  const inbox = new Map((initial.inbox ?? []).map((m) => [m.id, m]));
  return {
    getStateWithTag: async () => ({ state, etag: tag }),
    setStateIf: async (v, etag) => {
      if (raceArmed) {
        // Simulated concurrent write landing between the handler's read
        // and its conditional write — the precondition fails.
        raceArmed = false;
        tag = 'v' + (++tagCounter);
        state = { rev: (state ? state.rev : 0) + 1, data: { ...STATE }, updatedAt: 'race', updatedBy: 'other' };
        return false;
      }
      if (etag !== tag) return false;
      state = v;
      tag = 'v' + (++tagCounter);
      return true;
    },
    listInbox: async () => [...inbox.values()],
    deleteInbox: async (ids) => { ids.forEach((id) => inbox.delete(id)); },
    dump: () => ({ state, inbox: [...inbox.values()] }),
    armRace: () => { raceArmed = true; },
  };
}

let ipCounter = 0;
function req(path, { method = 'GET', body, cookie, origin = ORIGIN, ip } = {}) {
  const headers = { 'content-type': 'application/json' };
  if (origin) headers.origin = origin;
  if (cookie) headers.cookie = cookie;
  headers['x-nf-client-connection-ip'] = ip || `10.0.0.${++ipCounter}`;
  return new Request(BASE + path, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
  });
}

async function login(store, env = ENV) {
  const res = await handle(req('/login', { method: 'POST', body: { code: env.ADMIN_ACCESS_CODE, who: 'robert' } }), { store, env });
  assert.equal(res.status, 200);
  const setCookie = res.headers.get('set-cookie');
  assert.ok(setCookie && setCookie.includes('bb_admin='), 'session cookie set');
  assert.ok(setCookie.includes('HttpOnly'), 'cookie is HttpOnly');
  assert.ok(setCookie.includes('SameSite=Strict'), 'cookie is SameSite=Strict');
  return setCookie.split(';')[0];
}

const STATE = { schools: [], sponsors: [], partners: [], leads: [], licences: [], audit: [] };

test('501 when ADMIN_ACCESS_CODE is not configured', async () => {
  const res = await handle(req('/login', { method: 'POST', body: { code: 'x' } }), { store: memStore(), env: {} });
  assert.equal(res.status, 501);
  assert.equal((await res.json()).error, 'not_configured');
});

test('login rejects a wrong code', async () => {
  const res = await handle(req('/login', { method: 'POST', body: { code: 'wrong' } }), { store: memStore(), env: ENV });
  assert.equal(res.status, 401);
});

test('login rejects a cross-site origin', async () => {
  const res = await handle(req('/login', { method: 'POST', body: { code: ENV.ADMIN_ACCESS_CODE }, origin: 'https://evil.example' }), { store: memStore(), env: ENV });
  assert.equal(res.status, 403);
});

test('login rate-limits after 8 attempts from one IP', async () => {
  const store = memStore();
  const ip = '192.0.2.99';
  for (let i = 0; i < 8; i++) {
    const r = await handle(req('/login', { method: 'POST', body: { code: 'wrong' }, ip }), { store, env: ENV });
    assert.equal(r.status, 401);
  }
  const r9 = await handle(req('/login', { method: 'POST', body: { code: 'wrong' }, ip }), { store, env: ENV });
  assert.equal(r9.status, 429);
});

test('state requires a session', async () => {
  const res = await handle(req('/state'), { store: memStore(), env: ENV });
  assert.equal(res.status, 401);
});

test('state rejects a forged session cookie', async () => {
  const forged = `bb_admin=v1.robert.${Date.now() + 3600_000}.deadbeef`;
  const res = await handle(req('/state', { cookie: forged }), { store: memStore(), env: ENV });
  assert.equal(res.status, 401);
});

test('full round-trip: login → empty state → PUT → GET', async () => {
  const store = memStore();
  const cookie = await login(store);

  const empty = await handle(req('/state', { cookie }), { store, env: ENV });
  assert.equal(empty.status, 200);
  const emptyBody = await empty.json();
  assert.equal(emptyBody.rev, 0);
  assert.equal(emptyBody.data, null);
  assert.equal(emptyBody.who, 'robert');

  const data = { ...STATE, schools: [{ id: 1, name: 'Test High' }] };
  const put = await handle(req('/state', { method: 'PUT', body: { rev: 0, data } }), { store, env: ENV });
  assert.equal(put.status, 401, 'PUT without cookie is rejected');

  const put2 = await handle(req('/state', { method: 'PUT', body: { rev: 0, data }, cookie }), { store, env: ENV });
  assert.equal(put2.status, 200);
  assert.equal((await put2.json()).rev, 1);

  const got = await handle(req('/state', { cookie }), { store, env: ENV });
  const gotBody = await got.json();
  assert.equal(gotBody.rev, 1);
  assert.equal(gotBody.data.schools[0].name, 'Test High');
  assert.equal(gotBody.updatedBy, 'robert');
});

test('stale rev gets 409 with the authoritative copy', async () => {
  const store = memStore();
  const cookie = await login(store);
  const dataA = { ...STATE, schools: [{ id: 1, name: 'Device A School' }] };
  const dataB = { ...STATE, schools: [{ id: 1, name: 'Device B School' }] };

  const putA = await handle(req('/state', { method: 'PUT', body: { rev: 0, data: dataA }, cookie }), { store, env: ENV });
  assert.equal(putA.status, 200);

  const putB = await handle(req('/state', { method: 'PUT', body: { rev: 0, data: dataB }, cookie }), { store, env: ENV });
  assert.equal(putB.status, 409);
  const conflict = await putB.json();
  assert.equal(conflict.rev, 1);
  assert.equal(conflict.data.schools[0].name, 'Device A School', 'server copy wins');
});

test('malformed state payloads are rejected', async () => {
  const store = memStore();
  const cookie = await login(store);
  for (const bad of [
    { rev: 0, data: { schools: 'nope' } },
    { rev: -1, data: STATE },
    { rev: 'x', data: STATE },
    { rev: 0, data: null },
  ]) {
    const res = await handle(req('/state', { method: 'PUT', body: bad, cookie }), { store, env: ENV });
    assert.equal(res.status, 400, JSON.stringify(bad));
  }
});

test('consumeInbox removes only the named messages', async () => {
  const store = memStore({ inbox: [{ id: 'a', name: 'Lead A' }, { id: 'b', name: 'Lead B' }] });
  const cookie = await login(store);

  const got = await handle(req('/state', { cookie }), { store, env: ENV });
  assert.equal((await got.json()).inbox.length, 2);

  const put = await handle(req('/state', { method: 'PUT', body: { rev: 0, data: STATE, consumeInbox: ['a'] }, cookie }), { store, env: ENV });
  assert.equal(put.status, 200);
  assert.deepEqual(store.dump().inbox.map((m) => m.id), ['b']);
});

test('consumeInbox ids are sanitised — no blob-key tricks', async () => {
  const store = memStore({ inbox: [{ id: 'good-id', name: 'Lead' }] });
  const cookie = await login(store);
  const put = await handle(req('/state', { method: 'PUT', body: { rev: 0, data: STATE, consumeInbox: ['../state', 'inbox/evil', 42, 'good-id'] }, cookie }), { store, env: ENV });
  assert.equal(put.status, 200);
  assert.deepEqual(store.dump().inbox, [], 'only the well-formed id was consumed');
});

test('concurrent write between read and write yields 409, not silent overwrite', async () => {
  const store = memStore();
  const cookie = await login(store);
  const put1 = await handle(req('/state', { method: 'PUT', body: { rev: 0, data: STATE }, cookie }), { store, env: ENV });
  assert.equal(put1.status, 200);

  store.armRace(); // another device writes after our rev check passes
  const mine = { ...STATE, schools: [{ id: 1, name: 'Mine' }] };
  const put2 = await handle(req('/state', { method: 'PUT', body: { rev: 1, data: mine }, cookie }), { store, env: ENV });
  assert.equal(put2.status, 409, 'etag precondition converts the race into a conflict');
  assert.notEqual(store.dump().state.updatedBy, 'robert', 'racer’s write survives');
});

test('null JSON body is a 400, not a crash', async () => {
  const store = memStore();
  const cookie = await login(store);
  const login400 = await handle(req('/login', { method: 'POST', body: null }), { store, env: ENV });
  assert.equal(login400.status, 400);
  const put400 = await handle(req('/state', { method: 'PUT', body: null, cookie }), { store, env: ENV });
  assert.equal(put400.status, 400);
});

test('audit log is capped server-side', async () => {
  const store = memStore();
  const cookie = await login(store);
  const audit = Array.from({ length: 5100 }, (_, i) => ({ timestamp: 't' + i, action: 'x', entity: 'y' }));
  const put = await handle(req('/state', { method: 'PUT', body: { rev: 0, data: { ...STATE, audit } }, cookie }), { store, env: ENV });
  assert.equal(put.status, 200);
  const stored = store.dump().state.data.audit;
  assert.equal(stored.length, 5000);
  assert.equal(stored[stored.length - 1].timestamp, 't5099', 'newest entries kept');
});

test('logout clears the cookie', async () => {
  const res = await handle(req('/logout', { method: 'POST' }), { store: memStore(), env: ENV });
  assert.equal(res.status, 200);
  assert.ok(res.headers.get('set-cookie').includes('Max-Age=0'));
});

test('unknown route is a 404', async () => {
  const store = memStore();
  const cookie = await login(store);
  const res = await handle(req('/nonsense', { cookie }), { store, env: ENV });
  assert.equal(res.status, 404);
});
