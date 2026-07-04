import { test, expect } from '@playwright/test';

// End-to-end referral attribution: land with ?ref → stored → stamped into
// the demo form's hidden referral field.
test('ref lands in the demo form', async ({ page }) => {
  await page.goto('/pages/partners.html?ref=sir-kisoro&utm_source=ambassador', { waitUntil: 'domcontentloaded' });
  await page.goto('/pages/demo.html', { waitUntil: 'domcontentloaded' });
  await expect(page.locator('input[name="referral"]')).toHaveValue('sir-kisoro');
});

// Invite pages render with personalization + working accept form.
for (const slug of ['sir-kisoro', 'tia-kids', 'shack']) {
  test(`invite page renders — ${slug}`, async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', e => errors.push(e.message));
    await page.goto(`/pages/invites/${slug}.html`, { waitUntil: 'domcontentloaded' });
    await expect(page.locator('form[name="artist-ambassador-accept"]')).toBeVisible();
    await expect(page.locator(`input[name="slug"]`)).toHaveValue(slug);
    const robots = await page.locator('meta[name="robots"]').getAttribute('content');
    expect(robots).toContain('noindex');
    expect(errors).toEqual([]);
  });
}

test('programme page renders, names no artists', async ({ page }) => {
  await page.goto('/pages/artist-ambassadors.html', { waitUntil: 'domcontentloaded' });
  await expect(page.locator('h1')).toContainText('CAN Music artists');
  const body = await page.locator('body').innerText();
  for (const name of ['Sir Kisoro', 'TIA Kids', 'Kisoro', 'Shack']) {
    expect(body, `${name} must not be publicly named before countersign`).not.toContain(name);
  }
});
