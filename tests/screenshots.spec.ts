import { test, expect } from '@playwright/test';

/**
 * Visual regression baseline — screenshots every key page on every project
 * (device) declared in playwright.config.ts.
 *
 * First run: `npx playwright test --update-snapshots` to set the baseline.
 * Subsequent runs: any visual diff over the tolerance fails the build.
 */

const PAGES = [
  { name: 'home',         url: '/' },
  { name: 'programme',    url: '/pages/programme.html' },
  { name: 'for-schools',  url: '/pages/for-schools.html' },
  { name: 'licence',      url: '/pages/licence.html' },
  { name: 'about',        url: '/pages/about.html' },
  { name: 'apply',        url: '/pages/apply.html' },
  { name: 'pitch',        url: '/pitch.html' },
];

for (const p of PAGES) {
  test(`screenshot — ${p.name}`, async ({ page }) => {
    await page.goto(p.url, { waitUntil: 'networkidle' });
    // Wait one frame so any reveal animations settle
    await page.waitForTimeout(400);
    await expect(page).toHaveScreenshot(`${p.name}.png`, {
      fullPage: false,
      maxDiffPixelRatio: 0.02,
      animations: 'disabled',
    });
  });
}
