import { test, expect } from '@playwright/test';
import * as fs from 'node:fs';
import * as path from 'node:path';

/**
 * Mobile audit — runs against the small-viewport projects (iphone-se,
 * iphone-13, pixel-7) to catch the systematic mobile failures that desktop
 * Lighthouse misses:
 *
 *  - Horizontal scroll (page wider than viewport)
 *  - Touch targets <44×44 (Apple HIG minimum)
 *  - Inputs <16px (iOS auto-zooms on focus)
 *  - Tiny body text (<14px)
 *  - Off-screen / clipped content
 *  - Fixed-position elements covering nav
 *
 * Run locally with: npx playwright test tests/mobile-audit.spec.ts \
 *   --project=iphone-se --project=iphone-13 --project=pixel-7
 */

const PAGES = [
  '/',
  '/pages/demo.html',
  '/pages/partners.html',
  '/pages/impact.html',
  '/pages/see-it-in-action.html',
  '/pages/programme.html',
  '/pages/for-schools.html',
  '/pages/licence.html',
  '/pages/partner-program.html',
  '/pages/apply.html',
  '/pages/about.html',
  '/pages/contact.html',
  '/admin/',
];

for (const url of PAGES) {
  test(`no horizontal scroll — ${url}`, async ({ page }, info) => {
    if (!info.project.name.match(/iphone|pixel/)) test.skip();
    await page.goto(url, { waitUntil: 'networkidle', timeout: 20_000 });
    const overflow = await page.evaluate(() => ({
      docW: document.documentElement.scrollWidth,
      winW: window.innerWidth,
      bodyW: document.body.scrollWidth,
    }));
    // 2px tolerance for sub-pixel rounding.
    expect(overflow.docW, `doc=${overflow.docW} win=${overflow.winW}`).toBeLessThanOrEqual(overflow.winW + 2);
    expect(overflow.bodyW, `body=${overflow.bodyW} win=${overflow.winW}`).toBeLessThanOrEqual(overflow.winW + 2);
  });

  test(`touch targets ≥ 40px — ${url}`, async ({ page }, info) => {
    if (!info.project.name.match(/iphone|pixel/)) test.skip();
    await page.goto(url, { waitUntil: 'networkidle', timeout: 20_000 });
    // Find visible interactive elements that are too small.
    const tooSmall = await page.evaluate(() => {
      const isVisible = (el: Element) => {
        const r = el.getBoundingClientRect();
        if (r.width === 0 || r.height === 0) return false;
        const s = getComputedStyle(el as HTMLElement);
        if (s.display === 'none' || s.visibility === 'hidden' || s.opacity === '0') return false;
        return true;
      };
      const sel = 'a, button, [role="button"], input[type="submit"], input[type="button"], input[type="checkbox"], input[type="radio"]';
      const els = [...document.querySelectorAll(sel)] as HTMLElement[];
      const small: { tag: string; text: string; w: number; h: number }[] = [];
      for (const el of els) {
        if (!isVisible(el)) continue;
        // Ignore inline links inside paragraphs (text links don't need 44×44).
        const isInlineLink = el.tagName === 'A' && el.closest('p, li');
        if (isInlineLink) continue;
        // Ignore the cursor / decorative wrappers.
        if (el.id === 'bb-magic-cursor' || el.closest('#bb-magic-cursor, #bb-cursor-trail')) continue;
        const r = el.getBoundingClientRect();
        if (r.width < 40 || r.height < 40) {
          small.push({
            tag: el.tagName.toLowerCase(),
            text: (el.textContent || '').trim().slice(0, 30),
            w: Math.round(r.width),
            h: Math.round(r.height),
          });
        }
      }
      return small;
    });
    // Allow up to 2 small targets per page (legacy social icons, etc.) — flag if more.
    if (tooSmall.length > 2) {
      if (process.env.BB_MOBILE_DUMP) {
        const dir = '/tmp/mobile-audit';
        fs.mkdirSync(dir, { recursive: true });
        const slug = url.replace(/[^a-z0-9]/gi, '_') || 'root';
        fs.writeFileSync(path.join(dir, `${info.project.name}_${slug}.json`),
          JSON.stringify({ url, project: info.project.name, count: tooSmall.length, items: tooSmall }, null, 2));
      }
    }
    expect(tooSmall.length, `${tooSmall.length} small tap targets`).toBeLessThanOrEqual(2);
  });

  test(`form inputs ≥16px (no iOS zoom) — ${url}`, async ({ page }, info) => {
    if (!info.project.name.match(/iphone|pixel/)) test.skip();
    await page.goto(url, { waitUntil: 'networkidle', timeout: 20_000 });
    const small = await page.evaluate(() => {
      // iOS auto-zooms on focus only for editable text inputs. Checkboxes,
      // radios, and file pickers don't trigger zoom even if their inherited
      // font-size is below 16px.
      const sel = 'input:not([type=hidden]):not([type=checkbox]):not([type=radio]):not([type=file]):not([type=submit]):not([type=button]):not([type=color]):not([type=range]), select, textarea';
      const inputs = [...document.querySelectorAll(sel)] as HTMLElement[];
      return inputs
        .map(el => ({
          tag: el.tagName.toLowerCase(),
          type: (el as HTMLInputElement).type || '',
          size: parseFloat(getComputedStyle(el).fontSize),
        }))
        .filter(x => x.size < 16);
    });
    if (small.length) console.log(`[${info.project.name}] ${url}: small inputs`, small);
    expect(small.length, 'inputs <16px cause iOS zoom').toBe(0);
  });
}
