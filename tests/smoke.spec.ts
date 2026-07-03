import { test, expect } from '@playwright/test';

// Regression repro for the launch-audit HIGH: admin bricked on reload while
// logged in (unlock() ran before `data` was initialised).
test('admin survives login → reload', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', e => errors.push(e.message));

  await page.goto('/admin/', { waitUntil: 'networkidle' });
  await page.fill('#gate-pass', 'blastbeat2026');
  await page.click('.gate-btn');
  await expect(page.locator('#shell')).toBeVisible();

  // The killer step: reload with the session flag set.
  await page.reload({ waitUntil: 'networkidle' });
  await expect(page.locator('#shell')).toBeVisible();
  // Overview stats must have rendered from the real roster (data initialised).
  const statVal = page.locator('.stat .val').first();
  await expect(statVal).toBeVisible();
  await expect(statVal).not.toHaveText('');
  // Schools table rendered rows (panel may be hidden — count, don't require visible).
  expect(await page.locator('#tbl-pilot tr').count()).toBeGreaterThan(1);
  expect(errors, `page errors: ${errors.join(' | ')}`).toEqual([]);
});

// Consent → analytics handshake (event name mismatch fix): after dispatching
// the same event cookie-consent.js fires, dataLayer must contain a consent
// update granting analytics_storage.
test('cookie accept grants analytics consent', async ({ page }) => {
  await page.goto('/', { waitUntil: 'networkidle' });
  const granted = await page.evaluate(() => {
    window.dispatchEvent(new CustomEvent('bb:consent', { detail: { choice: 'accepted' } }));
    const dl = (window as any).dataLayer || [];
    return [...dl].some((args: any) =>
      args && args[0] === 'consent' && args[1] === 'update' && args[2]?.analytics_storage === 'granted');
  });
  expect(granted).toBe(true);
});
