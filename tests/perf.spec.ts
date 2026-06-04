import { test, expect } from '@playwright/test';

/**
 * Browser-side performance & accessibility smoke.
 * Asserts a budget per page. Numbers are local-network bounds; real-world
 * Core Web Vitals are tracked separately via Lighthouse CI.
 */

const BUDGETS = [
  { name: 'home',        url: '/',                          maxFcp: 1500, maxLoad: 3000, maxTransferKb: 2500 },
  { name: 'pitch',       url: '/pitch.html',                maxFcp: 800,  maxLoad: 1500, maxTransferKb: 600 },
  { name: 'apply',       url: '/pages/apply.html',          maxFcp: 1500, maxLoad: 3000, maxTransferKb: 600 },
  { name: 'for-schools', url: '/pages/for-schools.html',    maxFcp: 1800, maxLoad: 3500, maxTransferKb: 3500 },
];

for (const p of BUDGETS) {
  test(`perf budget — ${p.name}`, async ({ page }) => {
    await page.goto(p.url, { waitUntil: 'networkidle', timeout: 15000 });

    const metrics = await page.evaluate(() => {
      const nav = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      const fcp = performance.getEntriesByType('paint').find(p => p.name === 'first-contentful-paint');
      const resources = performance.getEntriesByType('resource') as PerformanceResourceTiming[];
      const bytes = resources.reduce((s, r) => s + (r.transferSize || r.encodedBodySize || 0), 0);
      return {
        fcp: fcp ? Math.round(fcp.startTime) : null,
        load: Math.round(nav.loadEventEnd),
        transferKb: Math.round(bytes / 1024),
        resources: resources.length,
      };
    });

    expect(metrics.fcp).toBeLessThan(p.maxFcp);
    expect(metrics.load).toBeLessThan(p.maxLoad);
    expect(metrics.transferKb).toBeLessThan(p.maxTransferKb);
  });

  test(`a11y smoke — ${p.name}`, async ({ page }) => {
    await page.goto(p.url, { waitUntil: 'networkidle' });
    const a11y = await page.evaluate(() => {
      const imgs = [...document.querySelectorAll('img')];
      return {
        h1Count: document.querySelectorAll('h1').length,
        lang: document.documentElement.lang,
        viewport: !!document.querySelector('meta[name="viewport"]'),
        imgsNoAlt: imgs.filter(i => !i.hasAttribute('alt') && !i.hasAttribute('aria-hidden')).length,
        focusable: document.querySelectorAll('a,button,input,select,textarea,[tabindex]:not([tabindex="-1"])').length,
      };
    });
    expect(a11y.h1Count).toBe(1);
    expect(a11y.lang).toBeTruthy();
    expect(a11y.viewport).toBe(true);
    expect(a11y.imgsNoAlt).toBe(0);
  });
}
