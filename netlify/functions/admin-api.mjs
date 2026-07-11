/* ============================================================
   Netlify Function: /api/admin/*  — the real admin backend.

   Replaces the client-side prototype gate + localStorage store with:
     - server-side login (access code checked HERE, never shipped in JS)
     - HMAC-signed HttpOnly session cookie (12h)
     - dashboard state persisted in Netlify Blobs (store "bb-admin")
     - optimistic concurrency via a rev counter (two devices can't
       silently overwrite each other)
     - a leads inbox fed by submission-created.mjs, consumed by the
       dashboard on save

   Routes (all same-origin; the dashboard fetches with credentials):
     POST /api/admin/login   {code, who}     -> sets session cookie
     POST /api/admin/logout                  -> clears cookie
     GET  /api/admin/state                   -> {rev, data, inbox, who, updatedAt, updatedBy}
     PUT  /api/admin/state   {rev, data, consumeInbox?} -> {ok, rev} | 409 {rev, data}

   Env vars (Site settings → Environment variables):
     ADMIN_ACCESS_CODE     required. The shared access code Robert/Tumi type.
                           If unset, every route answers 501 not_configured and
                           the dashboard falls back to local prototype mode.
     ADMIN_SESSION_SECRET  optional. HMAC key for session tokens. If unset,
                           derived from ADMIN_ACCESS_CODE (rotating the code
                           then also invalidates existing sessions).

   Security model: single shared code, identity ("who") is self-declared at
   login purely for the audit trail. SameSite=Strict cookie + Origin check on
   mutations covers CSRF. Rate limit is per warm instance (same approach as
   beat.mjs) — good enough to stop dumb brute force; the code itself must be
   strong.
   ============================================================ */

import { createHmac, createHash, timingSafeEqual } from 'node:crypto';
import { getStore } from '@netlify/blobs';

const COOKIE_NAME = 'bb_admin';
const SESSION_HOURS = 12;
const MAX_BODY_BYTES = 1_500_000;   // full dashboard state stays well under this
const MAX_AUDIT_ENTRIES = 5000;     // server-side cap so the log can't grow unbounded
const ENTITY_KEYS = ['schools', 'sponsors', 'partners', 'leads', 'licences', 'audit'];

// ----- Rate limit (per IP, best-effort across same warm instance) -----
const LOGIN_LIMIT = 8;
const LOGIN_WINDOW_MS = 15 * 60_000;
const loginBuckets = new Map();
function loginAllowed(ip) {
  const now = Date.now();
  const recent = (loginBuckets.get(ip) || []).filter((t) => now - t < LOGIN_WINDOW_MS);
  if (recent.length >= LOGIN_LIMIT) return false;
  recent.push(now);
  loginBuckets.set(ip, recent);
  if (loginBuckets.size > 5000) loginBuckets.clear(); // memory guard
  return true;
}

// ----- Session tokens: v1.<who>.<exp>.<hmac> -----
function sessionSecret(env) {
  if (env.ADMIN_SESSION_SECRET) return env.ADMIN_SESSION_SECRET;
  return createHash('sha256').update('bb-session::' + (env.ADMIN_ACCESS_CODE || '')).digest('hex');
}
function signToken(who, exp, env) {
  const payload = `v1.${who}.${exp}`;
  const mac = createHmac('sha256', sessionSecret(env)).update(payload).digest('hex');
  return `${payload}.${mac}`;
}
function verifyToken(token, env) {
  if (typeof token !== 'string') return null;
  const parts = token.split('.');
  if (parts.length !== 4 || parts[0] !== 'v1') return null;
  const [, who, expStr, mac] = parts;
  const exp = parseInt(expStr, 10);
  if (!Number.isFinite(exp) || exp < Date.now()) return null;
  const expected = createHmac('sha256', sessionSecret(env)).update(`v1.${who}.${expStr}`).digest();
  const given = Buffer.from(mac, 'hex');
  if (given.length !== expected.length || !timingSafeEqual(given, expected)) return null;
  return { who, exp };
}
function safeEqual(a, b) {
  // Hash both sides first so length differences don't leak timing.
  const ha = createHash('sha256').update(String(a)).digest();
  const hb = createHash('sha256').update(String(b)).digest();
  return timingSafeEqual(ha, hb);
}

function parseCookies(header) {
  const out = {};
  for (const part of String(header || '').split(';')) {
    const i = part.indexOf('=');
    if (i > 0) out[part.slice(0, i).trim()] = part.slice(i + 1).trim();
  }
  return out;
}
function sessionCookie(value, maxAgeSeconds) {
  return `${COOKIE_NAME}=${value}; Path=/; Max-Age=${maxAgeSeconds}; HttpOnly; Secure; SameSite=Strict`;
}

// Origin allow-list for mutating requests (belt & suspenders on top of
// SameSite=Strict). No-Origin requests pass — a cross-site browser POST
// always carries Origin, and non-browser callers don't have the cookie.
function originOk(origin) {
  if (!origin) return true;
  if (/^https:\/\/(www\.)?blastbeat\.education$/.test(origin)) return true;
  if (/^https:\/\/[a-z0-9-]+--blastbeat-education\.netlify\.app$/.test(origin)) return true;
  if (/^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)) return true;
  return false;
}

function json(status, body, extraHeaders = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store', ...extraHeaders },
  });
}

// ----- Blobs-backed store, injectable for tests -----
// Concurrency model:
//   - `state` is one blob guarded by BOTH the app-level rev counter AND an
//     etag-conditional write (onlyIfMatch), so two devices that pass the rev
//     check simultaneously can't both win — the loser gets a 409.
//   - inbox messages live one-per-key under `inbox/<id>` so form submissions
//     append atomically and consuming one message can never clobber another
//     arriving concurrently (the old single-array design lost that race).
function realStore() {
  const store = getStore({ name: 'bb-admin', consistency: 'strong' });
  return {
    // -> { state, etag } ; etag null when the blob doesn't exist yet
    getStateWithTag: async () => {
      const res = await store.getWithMetadata('state', { type: 'json' });
      return res ? { state: res.data, etag: res.etag || null } : { state: null, etag: null };
    },
    // Conditional write. Returns false when someone else wrote in between.
    setStateIf: async (v, etag) => {
      const res = await store.setJSON('state', v, etag ? { onlyIfMatch: etag } : { onlyIfNew: true });
      return !!(res && res.modified);
    },
    listInbox: async () => {
      const { blobs } = await store.list({ prefix: 'inbox/' });
      const msgs = await Promise.all(blobs.map((b) => store.get(b.key, { type: 'json' })));
      return msgs.filter(Boolean);
    },
    deleteInbox: (ids) => Promise.all(ids.map((id) => store.delete('inbox/' + id))),
  };
}

function validState(data) {
  if (!data || typeof data !== 'object' || Array.isArray(data)) return false;
  return ENTITY_KEYS.every((k) => Array.isArray(data[k]));
}

// Exported for tests: pass a fake deps.store and deps.env.
export async function handle(req, deps = {}) {
  const env = deps.env || process.env;
  const url = new URL(req.url);
  // Works both mounted at /api/admin/* and via the /.netlify/functions/
  // redirect — the route is just the last path segment.
  const route = url.pathname.replace(/\/+$/, '').split('/').pop();

  if (!env.ADMIN_ACCESS_CODE) {
    return json(501, { error: 'not_configured', hint: 'Set ADMIN_ACCESS_CODE in Netlify environment variables.' });
  }

  let store;
  try {
    store = deps.store || realStore();
  } catch (e) {
    console.log('blobs unavailable:', e && e.message);
    return json(501, { error: 'not_configured', hint: 'Netlify Blobs unavailable in this context.' });
  }

  const ip = req.headers.get('x-nf-client-connection-ip')
    || req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';

  // ---- POST /api/admin/login ----
  if (route === 'login' && req.method === 'POST') {
    if (!originOk(req.headers.get('origin'))) return json(403, { error: 'bad_origin' });
    if (!loginAllowed(ip)) return json(429, { error: 'rate_limited', hint: 'Too many attempts. Try again in 15 minutes.' });
    let body;
    try { body = await req.json(); } catch { return json(400, { error: 'invalid_json' }); }
    if (!body || typeof body !== 'object') return json(400, { error: 'invalid_json' });
    const code = typeof body.code === 'string' ? body.code : '';
    if (!code || !safeEqual(code, env.ADMIN_ACCESS_CODE)) {
      return json(401, { error: 'wrong_code' });
    }
    const who = /^[a-z0-9-]{1,24}$/.test(body.who || '') ? body.who : 'admin';
    const exp = Date.now() + SESSION_HOURS * 3600_000;
    return json(200, { ok: true, who, exp }, {
      'Set-Cookie': sessionCookie(signToken(who, exp, env), SESSION_HOURS * 3600),
    });
  }

  // ---- POST /api/admin/logout ----
  if (route === 'logout' && req.method === 'POST') {
    return json(200, { ok: true }, { 'Set-Cookie': sessionCookie('', 0) });
  }

  // ---- everything below requires a valid session ----
  const cookies = parseCookies(req.headers.get('cookie'));
  const session = verifyToken(cookies[COOKIE_NAME], env);
  if (!session) return json(401, { error: 'no_session' });

  if (route === 'state' && req.method === 'GET') {
    try {
      const [{ state }, inbox] = await Promise.all([store.getStateWithTag(), store.listInbox()]);
      inbox.sort((a, b) => String(a.date || '').localeCompare(String(b.date || '')));
      return json(200, {
        rev: state ? state.rev : 0,
        data: state ? state.data : null,
        updatedAt: state ? state.updatedAt : null,
        updatedBy: state ? state.updatedBy : null,
        inbox,
        who: session.who,
      });
    } catch (e) {
      console.log('state read failed:', e && e.message);
      return json(502, { error: 'store_read_failed' });
    }
  }

  if (route === 'state' && req.method === 'PUT') {
    if (!originOk(req.headers.get('origin'))) return json(403, { error: 'bad_origin' });
    const raw = await req.text();
    if (raw.length > MAX_BODY_BYTES) return json(413, { error: 'too_large' });
    let body;
    try { body = JSON.parse(raw); } catch { return json(400, { error: 'invalid_json' }); }
    if (!body || typeof body !== 'object') return json(400, { error: 'invalid_json' });
    if (!Number.isInteger(body.rev) || body.rev < 0 || !validState(body.data)) {
      return json(400, { error: 'bad_state' });
    }
    try {
      const { state: current, etag } = await store.getStateWithTag();
      const currentRev = current ? current.rev : 0;
      if (body.rev !== currentRev) {
        // Another device saved first — hand back the authoritative copy.
        return json(409, { error: 'conflict', rev: currentRev, data: current ? current.data : null });
      }
      const data = body.data;
      if (data.audit.length > MAX_AUDIT_ENTRIES) {
        data.audit = data.audit.slice(-MAX_AUDIT_ENTRIES);
      }
      const next = {
        rev: currentRev + 1,
        data,
        updatedAt: new Date().toISOString(),
        updatedBy: session.who,
      };
      // etag-conditional: if another device slipped a write in between our
      // read and this write, the precondition fails and THEY win.
      const written = await store.setStateIf(next, etag);
      if (!written) {
        const again = await store.getStateWithTag();
        return json(409, {
          error: 'conflict',
          rev: again.state ? again.state.rev : 0,
          data: again.state ? again.state.data : null,
        });
      }
      if (Array.isArray(body.consumeInbox) && body.consumeInbox.length) {
        // Per-key deletes: consuming these messages cannot clobber a form
        // submission arriving concurrently. Ids are sanitised — they name
        // blob keys.
        const ids = body.consumeInbox.filter((id) => typeof id === 'string' && /^[A-Za-z0-9-]{1,64}$/.test(id)).slice(0, 500);
        await store.deleteInbox(ids);
      }
      return json(200, { ok: true, rev: next.rev, updatedAt: next.updatedAt });
    } catch (e) {
      console.log('state write failed:', e && e.message);
      return json(502, { error: 'store_write_failed' });
    }
  }

  return json(404, { error: 'unknown_route' });
}

export default (req) => handle(req);

export const config = { path: ['/api/admin', '/api/admin/*'] };
