import { test, expect, Page } from '@playwright/test';

/**
 * Admin dashboard — local (prototype) mode.
 *
 * The static test server has no functions, so /api/admin/login answers
 * 501 and the dashboard falls back to browser-local mode with the demo
 * code. Server mode's handler logic is covered by tests/functions/.
 */

const DEMO_CODE = 'blastbeat2026';

async function loginLocal(page: Page) {
  // Pre-mark the Beat tour as done — its full-screen overlay would
  // otherwise swallow every click 600ms after unlock.
  await page.addInitScript(() => localStorage.setItem('bb-admin-tour-done-v2', '1'));
  await page.goto('/admin/', { waitUntil: 'networkidle' });
  await page.fill('#gate-pass', DEMO_CODE);
  await page.click('.gate-btn');
  await expect(page.locator('#shell')).toBeVisible();
}

test('wrong code is rejected, right code unlocks in local mode', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('bb-admin-tour-done-v2', '1'));
  await page.goto('/admin/', { waitUntil: 'networkidle' });
  await page.fill('#gate-pass', 'not-the-code');
  await page.click('.gate-btn');
  await expect(page.locator('#gate-err')).toHaveText(/wrong access code/i);
  await expect(page.locator('#shell')).toBeHidden();

  await page.fill('#gate-pass', DEMO_CODE);
  await page.click('.gate-btn');
  await expect(page.locator('#shell')).toBeVisible();
  // Local mode is clearly signposted — banner + sidebar badge.
  await expect(page.locator('#mode-banner')).toBeVisible();
  await expect(page.locator('#sync-badge')).toHaveClass(/local/);
});

test('add and edit a school through the record modal', async ({ page }) => {
  await loginLocal(page);
  await page.click('[data-view="pilot"]');
  const before = await page.locator('#tbl-pilot tbody tr').count();

  await page.click('[data-add="school"]');
  await expect(page.locator('#record-modal')).toBeVisible();
  await page.fill('#record-form [name="name"]', 'Playwright Secondary');
  await page.fill('#record-form [name="country"]', 'Cape Town · South Africa');
  await page.click('#record-save');
  await expect(page.locator('#record-modal')).toBeHidden();
  await expect(page.locator('#tbl-pilot tbody tr')).toHaveCount(before + 1);
  await expect(page.locator('#tbl-pilot')).toContainText('Playwright Secondary');

  // Edit the school we just added (its row is last).
  const row = page.locator('#tbl-pilot tbody tr', { hasText: 'Playwright Secondary' });
  await row.locator('[data-edit="schools"]').click();
  await expect(page.locator('#record-modal')).toBeVisible();
  await page.fill('#record-form [name="twin"]', 'Test Sponsor Ltd');
  await page.click('#record-save');
  await expect(row).toContainText('Test Sponsor Ltd');

  // Both actions are on the audit log, attributed to the signed-in
  // identity (the gate's who-select defaults to Robert).
  await page.click('[data-view="audit"]');
  await expect(page.locator('#tbl-audit')).toContainText('create');
  await expect(page.locator('#tbl-audit')).toContainText('edit');
  await expect(page.locator('#tbl-audit')).toContainText('robert');
});

test('search filters the schools table', async ({ page }) => {
  await loginLocal(page);
  await page.click('[data-view="pilot"]');
  const all = await page.locator('#tbl-pilot tbody tr').count();
  expect(all).toBeGreaterThan(3);

  await page.fill('[data-tbl="schools"]', 'rhodes');
  const filtered = await page.locator('#tbl-pilot tbody tr').count();
  expect(filtered).toBeLessThan(all);
  await expect(page.locator('#tbl-pilot')).toContainText(/rhodes/i);

  await page.fill('[data-tbl="schools"]', 'zzz-no-match');
  await expect(page.locator('#tbl-pilot tbody')).toContainText(/no schools match/i);
});

test('issue a licence, then revoke keeps it on the register', async ({ page }) => {
  await loginLocal(page);
  await page.click('[data-view="licences"]');
  await page.click('#issue-licence-open');
  await expect(page.locator('#issue-modal')).toBeVisible();
  await page.fill('#f-school', 'Cred Test School');
  await page.fill('#f-sponsor', 'Cred Test Sponsor');
  await page.click('#issue-form button[type="submit"]');

  // Preview modal opens with the stamped credential.
  await expect(page.locator('#preview-modal')).toBeVisible();
  await expect(page.locator('#preview-json')).toContainText('BlastbeatLicenceCredential');
  await expect(page.locator('#preview-json')).toContainText('Sha256Stamp2026');
  await page.click('#preview-close');

  const row = page.locator('#tbl-licences tbody tr', { hasText: 'Cred Test School' });
  await expect(row).toBeAttached();
  const rowsBefore = await page.locator('#tbl-licences tbody tr').count();

  // Revoke — record must STAY, marked revoked (not silently deleted).
  page.on('dialog', (d) => d.accept());
  await row.locator('[data-licence-revoke]').click();
  await expect(page.locator('#tbl-licences tbody tr')).toHaveCount(rowsBefore);
  await expect(row).toHaveClass(/revoked-row/);
  await expect(row).toContainText(/revoked/i);
});

test('leads: manual add via modal and convert to school', async ({ page }) => {
  await loginLocal(page);
  await page.click('[data-view="leads"]');
  await page.click('[data-add="lead"]');
  await expect(page.locator('#record-modal')).toBeVisible();
  await page.fill('#record-form [name="name"]', 'Principal Test');
  await page.fill('#record-form [name="org"]', 'Convert High');
  await page.click('#record-save');
  const row = page.locator('#tbl-leads tbody tr', { hasText: 'Principal Test' });
  await expect(row).toBeAttached();

  page.on('dialog', (d) => d.accept());
  await row.locator('[data-lead-convert]').click();
  await expect(row).toContainText('Converted');
  await page.click('[data-view="pilot"]');
  await expect(page.locator('#tbl-pilot')).toContainText('Convert High');
});

test('native dropdowns render dark (no white-on-white options)', async ({ page }) => {
  await loginLocal(page);
  const scheme = await page.evaluate(() => getComputedStyle(document.documentElement).colorScheme);
  expect(scheme).toContain('dark');
  // Option styling is the fallback for platforms that ignore color-scheme.
  await page.click('[data-view="pilot"]');
  await page.click('[data-add="school"]');
  const optColors = await page.evaluate(() => {
    const opt = document.querySelector('#record-form select option') as HTMLOptionElement;
    const cs = getComputedStyle(opt);
    return { bg: cs.backgroundColor, fg: cs.color };
  });
  expect(optColors.bg).not.toBe('rgba(0, 0, 0, 0)');
  expect(optColors.bg).not.toBe('rgb(255, 255, 255)');
  await page.click('#record-cancel');
});

test('filter chips narrow the schools table and All resets', async ({ page }) => {
  await loginLocal(page);
  await page.click('[data-view="pilot"]');
  const chips = page.locator('[data-chips="schools"] .chip');
  expect(await chips.count()).toBeGreaterThan(2); // All + at least two statuses
  const all = await page.locator('#tbl-pilot tbody tr').count();

  await page.locator('[data-chips="schools"] .chip', { hasText: 'Proposal' }).click();
  const filtered = await page.locator('#tbl-pilot tbody tr').count();
  expect(filtered).toBeGreaterThan(0);
  expect(filtered).toBeLessThan(all);

  await page.locator('[data-chips="schools"] .chip', { hasText: 'All' }).click();
  expect(await page.locator('#tbl-pilot tbody tr').count()).toBe(all);
});

test('Beat help panel opens with page-specific guidance', async ({ page }) => {
  await loginLocal(page);
  await expect(page.locator('#beat-fab')).toBeVisible();
  await page.click('[data-view="licences"]');
  await page.click('#beat-fab');
  await expect(page.locator('#beat-panel')).toBeVisible();
  await expect(page.locator('#beat-panel-body')).toContainText(/stamp/i);
  // Switching tabs while open refreshes the topic.
  await page.click('[data-view="leads"]');
  await expect(page.locator('#beat-panel-body')).toContainText(/enquiry|convert/i);
  // Big-text action works from the panel.
  await page.click('#beat-bigtext-toggle');
  await expect(page.locator('body')).toHaveClass(/bigtext/);
  await page.click('#beat-panel-close');
  await expect(page.locator('#beat-panel')).toBeHidden();
});

test('session survives reload without console errors', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await loginLocal(page);
  await page.reload({ waitUntil: 'networkidle' });
  await expect(page.locator('#shell')).toBeVisible();
  await expect(page.locator('.stat .val').first()).not.toHaveText('');
  expect(errors, `page errors: ${errors.join(' | ')}`).toEqual([]);
});
