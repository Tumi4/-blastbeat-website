/*!
 * Video health check — verifies every YouTube embed across the site is alive.
 *
 * Why this exists
 *   YouTube videos go down for many reasons (deletion, channel takedown,
 *   privacy change, copyright claim). The site embeds 50+ videos. Without
 *   this check we discover a dead embed only when Robert or a sponsor
 *   does, which is the wrong order.
 *
 * What it does
 *   - Scans every .html and can-videos.json for YouTube video IDs.
 *   - Probes the YouTube oEmbed endpoint for each one.
 *   - oEmbed returns 200 + JSON for public videos, 401 for private,
 *     404 for deleted. Anything other than 200 is a dead embed.
 *   - Prints a report; exits 1 if anything is dead.
 *
 * Where it runs
 *   - CI (GitHub Actions on a clean network) — every push.
 *   - Tumi's / Robert's machine — `node tests/video-health.mjs`.
 *   - NOT this sandbox — YouTube blocks our exit IP, so the check is
 *     useless here. CI is the right place for it.
 *
 * If oEmbed becomes unreliable later we can swap to the noembed.com
 * proxy or YouTube Data API v3 with a key.
 */
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

const root = new URL('..', import.meta.url).pathname;

function walk(dir, hits = []) {
  for (const name of readdirSync(dir)) {
    if (name === 'node_modules' || name === '.git' || name === 'test-results' || name === 'playwright-report') continue;
    const p = join(dir, name);
    const st = statSync(p);
    if (st.isDirectory()) walk(p, hits);
    else if (/\.(html|json)$/.test(name)) hits.push(p);
  }
  return hits;
}

const PATTERNS = [
  /youtube(?:-nocookie)?\.com\/embed\/([A-Za-z0-9_-]{11})/g,
  /youtube\.com\/watch\?v=([A-Za-z0-9_-]{11})/g,
  /youtu\.be\/([A-Za-z0-9_-]{11})/g,
  /youtu\.be%2F([A-Za-z0-9_-]{11})/g,
  /i\.ytimg\.com\/vi\/([A-Za-z0-9_-]{11})\//g,
];

const idToFiles = new Map();
for (const file of walk(root)) {
  let s;
  try { s = readFileSync(file, 'utf8'); } catch { continue; }
  for (const pat of PATTERNS) {
    for (const m of s.matchAll(pat)) {
      const id = m[1];
      // Skip the known sentinel that isn't a real video ID
      if (id === 'videoseri' || id.startsWith('UU_')) continue;
      if (!idToFiles.has(id)) idToFiles.set(id, new Set());
      idToFiles.get(id).add(file.replace(root, ''));
    }
  }
}

const ids = [...idToFiles.keys()].sort();
if (ids.length === 0) {
  console.log('No YouTube IDs found. Nothing to check.');
  process.exit(0);
}

console.log(`Probing ${ids.length} YouTube IDs via oEmbed...\n`);

const dead = [];
const limit = 6; // soft concurrency limit
let i = 0;
const results = await Promise.all(
  Array.from({ length: limit }, async () => {
    const out = [];
    while (i < ids.length) {
      const id = ids[i++];
      const url = `https://www.youtube.com/oembed?url=${encodeURIComponent('https://youtu.be/' + id)}&format=json`;
      try {
        const r = await fetch(url, { headers: { 'User-Agent': 'BlastbeatVideoHealth/1.0' } });
        if (r.status === 200) {
          const data = await r.json();
          out.push({ id, ok: true, title: data.title, author: data.author_name });
        } else {
          out.push({ id, ok: false, status: r.status, reason: r.statusText });
        }
      } catch (e) {
        out.push({ id, ok: false, status: 'ERR', reason: e.message });
      }
    }
    return out;
  })
);

const flat = results.flat().sort((a, b) => a.id.localeCompare(b.id));
for (const r of flat) {
  if (!r.ok) {
    dead.push(r);
    const files = [...idToFiles.get(r.id)].sort().join(', ');
    console.log(`  DEAD  ${r.id}  [${r.status} ${r.reason || ''}]  in: ${files}`);
  }
}

const alive = flat.length - dead.length;
console.log(`\n${alive}/${flat.length} videos alive  |  ${dead.length} dead\n`);

if (dead.length > 0) {
  console.log('Replace or remove the dead embeds. Exit code 1.');
  process.exit(1);
}
console.log('All videos OK.');
process.exit(0);
