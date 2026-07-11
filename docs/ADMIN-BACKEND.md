# Admin backend — how it works and how to run it

The admin dashboard (`/admin`) is no longer a browser-only prototype. It has
a real backend built from two Netlify Functions and a private Netlify Blobs
store — no extra services, no separate database account, deployed with the
site like everything else.

## The pieces

| Piece | File | Job |
|---|---|---|
| Admin API | `netlify/functions/admin-api.mjs` | Login (server-side code check → HttpOnly session cookie, 12 h), load/save the dashboard state, hand over the leads inbox |
| Licence registry | `netlify/functions/verify-licence.mjs` | Public `GET /api/verify/<id>` — answers valid / revoked / expired / roster for the QR code on every printed certificate |
| Leads intake | `netlify/functions/submission-created.mjs` | Already sent the emails; now ALSO appends every form submission to the leads inbox the dashboard pulls in |
| Store | Netlify Blobs, store `bb-admin` | `state` = the whole dashboard (schools, sponsors, partners, leads, licences, audit) with a `rev` counter; `inbox` = form submissions not yet pulled into Leads |
| Front-end | `assets/js/admin.js` | Logs in against the API, syncs state (debounced save, conflict-safe via `rev`), merges the inbox into Leads, shows sync status in the sidebar |

## Environment variables (Site settings → Environment variables)

| Var | Required | What it does |
|---|---|---|
| `ADMIN_ACCESS_CODE` | **Yes — this is the switch** | The access code Robert/Tumi type at `/admin`. Checked **server-side only**; it never ships in any JS bundle. While unset, the API answers `501 not_configured` and the dashboard runs in local prototype mode. |
| `ADMIN_SESSION_SECRET` | Recommended | HMAC key for session cookies. If unset it's derived from the access code (then rotating the code also logs everyone out). |

**Pick a long access code** (a 4–5 word passphrase). The rate limit
(8 attempts / 15 min / IP, per warm function instance) stops casual brute
force, but the code's strength is the real lock.

### Rotating the code
Change `ADMIN_ACCESS_CODE` in Netlify and redeploy (env vars need a new
deploy to reach functions). If `ADMIN_SESSION_SECRET` is unset, all existing
sessions die immediately — that's usually what you want.

## Two modes, one dashboard

- **Server mode** (env var set, functions reachable): the code is checked by
  the server; data lives in the private Blobs store; every signed-in device
  sees the same records; site form submissions appear in Leads automatically;
  the sidebar badge shows "Synced to secure store".
- **Local mode** (no env var, deploy previews without Blobs, or `npm run
  serve` static dev): the old prototype behaviour — demo code
  (`blastbeat2026`), data in that browser's localStorage, amber banner +
  "Local mode" badge so nobody mistakes it for the real thing. The demo code
  gates nothing sensitive: a fresh local store starts from the public seed
  roster (`assets/js/programme-data.js`, which is already scrubbed by
  `scripts/gen-programme-data.mjs`).

## Multi-device safety

Every save sends the last-seen `rev`. If someone else saved first the server
answers `409` with the newer copy, and the dashboard adopts it instead of
overwriting ("Updated from another device"). Returning to the tab also picks
up remote changes when there's nothing unsaved locally.

## The audit trail

Every create / edit / delete / issue / revoke / import lands in the audit
log with an ISO timestamp and **who** did it (picked at sign-in — Robert /
Tumi / Guest). The server additionally stamps `updatedBy` + `updatedAt` on
each saved revision. The log is capped at 5,000 entries server-side; export
it any time (Audit Log → Export, or the legal bundle).

## Licence lifecycle

- **Issue** — Licences → "+ Issue new licence" (or "Stamp" on a roster
  line). Builds the W3C-style credential, SHA-256 proof, certificate PDF.
- **Revoke** — the record STAYS on the register marked `revoked`; the
  public registry then reports it revoked. Nothing is deleted.
- **Expiry** — licences within 60 days of `validUntil` get a "renews in Xd"
  chip and roll into the "Needs attention" stat on Overview.
- **Verify** — the QR on every certificate hits
  `blastbeat.education/verify/<short-id>` → the page asks
  `/api/verify/<id>` and shows valid / revoked / expired / not-found from
  the live registry, plus the offline cryptographic hash check (paste the
  credential JSON).

## Backups

Settings → "Export full state" any time; "Restore from backup" imports it
back (and auto-downloads a safety copy of what you're replacing first).
The server store is the source of truth in server mode; the browser copy is
an offline cache.

## Tests

- `npm run test:functions` — node test suite for both functions (auth,
  sessions, rate limit, conflict handling, inbox consume, registry lookup,
  public-view privacy).
- `npx playwright test tests/admin.spec.ts` — dashboard flows in local mode
  (gate, add/edit modals, search, issue → revoke, lead convert, reload).
