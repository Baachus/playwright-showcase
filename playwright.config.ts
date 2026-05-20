import { defineConfig, devices } from '@playwright/test';

const EMAIL_APP_PORT = Number(process.env.EMAIL_APP_PORT ?? 4310);
const EMAIL_APP_BASE_URL = process.env.EMAIL_APP_BASE_URL ?? `http://localhost:${EMAIL_APP_PORT}`;

/**
 * Detect whether the Email project is in scope for this run.  The local
 * email-sender helper only needs to boot when we're actually going to run
 * email specs -- otherwise plain `npm run test:ui` would fail before its
 * deps (tsx, express, nodemailer) are installed.
 */
const EMAIL_TESTS_REQUESTED =
  process.env.PW_EMAIL_SERVER === '1' ||
  process.argv.some(a => a.includes('--project=Email')) ||
  process.argv.some(a => a.includes('tests/email')) ||
  // Full-suite invocations (`playwright test` with no filters) also need it.
  (!process.argv.some(a => a.startsWith('--project=')) &&
   !process.argv.some(a => /tests[\\/]/.test(a)));

/**
 * Playwright Configuration
 */
export default defineConfig({
  /**
   * Local helper services started before any test runs.  The Email project
   * relies on the local email-sender app (tools/email-sender/server.ts) -- it
   * boots here once and is shut down when the test run ends.  The webServer
   * entry is only emitted when an email run is actually requested so that
   * other suites don't pay the boot cost or require email deps.
   */
  webServer: EMAIL_TESTS_REQUESTED
    ? [
        {
          command: 'npx tsx tools/email-sender/server.ts',
          url: `${EMAIL_APP_BASE_URL}/healthz`,
          reuseExistingServer: !process.env.CI,
          timeout: 30_000,
          stdout: 'pipe',
          stderr: 'pipe',
          env: {
            EMAIL_APP_PORT: String(EMAIL_APP_PORT),
            EMAIL_APP_BASE_URL,
            // Default to real delivery.  The specs read from the live
            // Mailinator public-inbox UI, so capture mode would leave the
            // inbox empty and time out every wait-for-message poll.  When no
            // SMTP relay is configured we fall through to nodemailer's direct
            // MX transport (requires outbound port 25); set SMTP_HOST/... to
            // route through a relay if port 25 is blocked.  Opt into capture
            // mode explicitly with EMAIL_CAPTURE=1 -- it's only useful for
            // unit-style runs that read from /captured rather than Mailinator.
            EMAIL_CAPTURE: process.env.EMAIL_CAPTURE ?? '0',
            ...(process.env.SMTP_HOST    ? { SMTP_HOST: process.env.SMTP_HOST }    : {}),
            ...(process.env.SMTP_PORT    ? { SMTP_PORT: process.env.SMTP_PORT }    : {}),
            ...(process.env.SMTP_USER    ? { SMTP_USER: process.env.SMTP_USER }    : {}),
            ...(process.env.SMTP_PASS    ? { SMTP_PASS: process.env.SMTP_PASS }    : {}),
            ...(process.env.SMTP_SECURE  ? { SMTP_SECURE: process.env.SMTP_SECURE } : {}),
          },
        },
      ]
    : undefined,
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 2 : undefined,
  timeout: 30_000,
  expect: {
    timeout: 5_000,
    toHaveScreenshot: { maxDiffPixelRatio: 0.02, animations: 'disabled' },
  },
  reporter: [
    ['html', { outputFolder: 'reports/html', open: 'never' }],
    ['allure-playwright', {
      resultsDir: 'allure-results',
      suiteTitle: false,
      categories: [
        { name: 'Test Failures', matchedStatuses: ['failed'] },
        { name: 'Broken Tests',  matchedStatuses: ['broken'] },
      ],
      environmentInfo: {
        Framework: 'Playwright', Language: 'TypeScript',
        Target: 'https://playwright.dev',
        'Node Version': process.version, Platform: process.platform,
      },
    }],
    ['list'],
    ...(process.env.CI ? [['github'] as ['github']] : []),
  ],
  use: {
    baseURL: 'https://playwright.dev',
    trace: 'on-first-retry', screenshot: 'only-on-failure',
    video: 'on-first-retry', viewport: { width: 1280, height: 720 },
  },
  outputDir: 'test-results',
  projects: [
    { name: 'setup-saucedemo',           testMatch: /.*saucedemo\.setup\.ts/ },
    { name: 'setup-saucedemo-multiuser', testMatch: /.*saucedemo-multiuser\.setup\.ts/ },
    { name: 'setup-playwrightdev',       testMatch: /.*playwrightdev\.setup\.ts/ },
    {
      name: 'Unit Tests',
      testMatch: '**/unit/**/*.unit.ts',
      testDir: './tests',
      // browserName is set so tests that use the `page` fixture (e.g.
      // accessibility tests running real axe scans) get a browser.
      // Tests that don't use any browser fixture still run without launching one.
      use: { browserName: 'chromium' },
    },
    {
      name: 'Playwright.dev Chromium', testDir: './tests',
      use: { ...devices['Desktop Chrome'], storageState: '.auth/playwrightdev.json' },
      dependencies: ['setup-playwrightdev'],
      testIgnore: ['**/saucedemo/**','**/visual/**','**/mocking/**','**/components/**','**/multi-context/**','**/websocket/**','**/email/**'],
    },
    {
      name: 'Playwright.dev Firefox', testDir: './tests',
      use: { ...devices['Desktop Firefox'], storageState: '.auth/playwrightdev.json' },
      dependencies: ['setup-playwrightdev'],
      testIgnore: ['**/saucedemo/**','**/performance/**','**/visual/**','**/mocking/**','**/components/**','**/multi-context/**','**/websocket/**','**/email/**'],
    },
    {
      name: 'Playwright.dev Webkit', testDir: './tests',
      use: { ...devices['Desktop Safari'], storageState: '.auth/playwrightdev.json' },
      dependencies: ['setup-playwrightdev'],
      testIgnore: ['**/saucedemo/**','**/performance/**','**/visual/**','**/mocking/**','**/components/**','**/multi-context/**','**/websocket/**','**/email/**'],
    },
    {
      name: 'Playwright.dev Mobile-chrome', testDir: './tests',
      use: { ...devices['Pixel 5'], storageState: '.auth/playwrightdev.json' },
      dependencies: ['setup-playwrightdev'],
      testIgnore: ['**/saucedemo/**','**/performance/**','**/visual/**','**/mocking/**','**/components/**','**/multi-context/**','**/websocket/**','**/email/**'],
    },
    {
      name: 'Playwright.dev Mobile-safari', testDir: './tests',
      use: { ...devices['iPhone 13'], storageState: '.auth/playwrightdev.json' },
      dependencies: ['setup-playwrightdev'],
      testIgnore: ['**/saucedemo/**','**/performance/**','**/visual/**','**/mocking/**','**/components/**','**/multi-context/**','**/websocket/**','**/email/**'],
    },
    {
      name: 'Components', testMatch: '**/components/**/*.spec.ts', testDir: './tests',
      use: { ...devices['Desktop Chrome'], baseURL: 'https://playwright.dev', storageState: '.auth/playwrightdev.json' },
      dependencies: ['setup-playwrightdev'],
    },
    {
      name: 'API', testMatch: '**/api/**/*.spec.ts', testDir: './tests',
      use: { baseURL: 'https://playwright.dev', extraHTTPHeaders: { Accept: 'application/json' } },
    },
    {
      name: 'Saucedemo Chromium', testMatch: '**/ui/saucedemo/**/*.spec.ts', testDir: './tests',
      dependencies: ['setup-saucedemo'],
      use: { ...devices['Desktop Chrome'], baseURL: 'https://www.saucedemo.com', storageState: '.auth/saucedemo.json' },
    },
    {
      name: 'Multi-Context', testMatch: '**/multi-context/**/*.spec.ts', testDir: './tests',
      dependencies: ['setup-saucedemo-multiuser'],
      use: { ...devices['Desktop Chrome'], baseURL: 'https://www.saucedemo.com', storageState: '.auth/sd_standard_user.json' },
    },
    {
      name: 'WebSocket-Mock', testMatch: '**/websocket/**/ws-mock.spec.ts', testDir: './tests',
      dependencies: ['setup-saucedemo'],
      use: { ...devices['Desktop Chrome'], baseURL: 'https://www.saucedemo.com', storageState: '.auth/saucedemo.json' },
    },
    {
      name: 'WebSocket-Realtime', testMatch: '**/websocket/**/ws-realtime.spec.ts', testDir: './tests',
      dependencies: ['setup-saucedemo'],
      use: { ...devices['Desktop Chrome'], baseURL: 'https://www.saucedemo.com', storageState: '.auth/saucedemo.json' },
    },
    {
      name: 'Visual', testMatch: '**/visual/**/*.spec.ts', testDir: './tests',
      use: { ...devices['Desktop Chrome'], baseURL: 'https://playwright.dev', screenshot: 'only-on-failure', viewport: { width: 1280, height: 720 } },
    },
    {
      name: 'Mocking', testMatch: '**/mocking/**/*.spec.ts', testDir: './tests',
      use: { ...devices['Desktop Chrome'], baseURL: 'https://playwright.dev' },
    },
    {
      name: 'Performance', testMatch: '**/performance/**/*.spec.ts', testDir: './tests',
      use: { ...devices['Desktop Chrome'], baseURL: 'https://playwright.dev' },
    },
    {
      name: 'Security', testMatch: '**/security/**/*.spec.ts', testDir: './tests',
      use: { ...devices['Desktop Chrome'], baseURL: 'https://playwright.dev' },
    },
    {
      name: 'Accessibility', testMatch: '**/accessibility/**/*.spec.ts', testDir: './tests',
      use: { ...devices['Desktop Chrome'], baseURL: 'https://playwright.dev' },
    },
    {
      name: 'Email', testMatch: '**/email/**/*.spec.ts', testDir: './tests',
      // baseURL points at the local email-sender app so emailApp.goto() and
      // /verify/:token links work directly via page.goto(...).  Tests still
      // navigate to https://www.mailinator.com/... explicitly when reading
      // the inbox.  The email-sender app marks elements with data-test=...,
      // so set the matching testIdAttribute for getByTestId(...).
      use: {
        ...devices['Desktop Chrome'],
        baseURL: EMAIL_APP_BASE_URL,
        testIdAttribute: 'data-test',
      },
    },
  ],
});
