import { defineConfig, devices } from '@playwright/test';

/**
 * Blastbeat Education — Playwright config.
 *
 * Boots a local static server on :8765, then runs every spec in /tests/
 * across a real device matrix (iPhone 13, Pixel 7, iPad Pro, MacBook).
 *
 * For real-device cloud testing (BrowserStack, LambdaTest, Sauce Labs):
 * set the BROWSERSTACK_USERNAME and BROWSERSTACK_ACCESS_KEY env vars and
 * uncomment the `connectOptions` block below. The same specs then run on
 * real iOS Safari, Android Chrome, etc.
 */
export default defineConfig({
  testDir: './tests',
  timeout: 60_000,
  expect: { timeout: 10_000 },
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 2 : undefined,
  reporter: process.env.CI ? [['github'], ['html', { open: 'never' }]] : 'list',

  use: {
    baseURL: process.env.BB_BASE_URL || 'http://127.0.0.1:8765',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    // BrowserStack / real-device cloud (uncomment + set env vars):
    // connectOptions: {
    //   wsEndpoint: `wss://cdp.browserstack.com/playwright?caps=${encodeURIComponent(JSON.stringify({
    //     'browserstack.username': process.env.BROWSERSTACK_USERNAME,
    //     'browserstack.accessKey': process.env.BROWSERSTACK_ACCESS_KEY,
    //     'browser': 'chrome',
    //     'os': 'osx',
    //     'os_version': 'Sonoma',
    //     'name': 'Blastbeat smoke',
    //   }))}`,
    // },
  },

  webServer: {
    command: 'python3 -m http.server 8765',
    url: 'http://127.0.0.1:8765/',
    reuseExistingServer: !process.env.CI,
    timeout: 30_000,
  },

  // Device matrix — virtual but realistic. Use real-device cloud (above) for final QA.
  projects: [
    { name: 'iphone-se',  use: { ...devices['iPhone SE'] } },
    { name: 'iphone-13',  use: { ...devices['iPhone 13'] } },
    { name: 'pixel-7',    use: { ...devices['Pixel 7'] } },
    { name: 'ipad',       use: { ...devices['iPad Pro 11'] } },
    { name: 'desktop',    use: { ...devices['Desktop Chrome'], viewport: { width: 1280, height: 800 } } },
    { name: 'desktop-fhd',use: { ...devices['Desktop Chrome'], viewport: { width: 1920, height: 1080 } } },
  ],
});
