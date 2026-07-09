import { defineConfig, devices } from '@playwright/test';

const EMAIL_APP_PORT = Number(process.env.EMAIL_APP_PORT ?? 4310);
const EMAIL_APP_BASE_URL = process.env.EMAIL_APP_BASE_URL ?? `http://localhost:${EMAIL_APP_PORT}`;

// Local Mailpit capture server (SMTP sink + REST API).  The email-sender app
// relays mail here over SMTP; the specs read it back via the REST API.
const MAILPIT_SMTP_HOST = process.env.MAILPIT_SMTP_HOST ?? '127.0.0.1';
const MAILPIT_SMTP_PORT = Number(process.env.MAILPIT_SMTP_PORT ?? 1025);
const MAILPIT_HTTP_HOST = process.env.MAILPIT_HTTP_HOST ?? '127.0.0.1';
const MAILPIT_HTTP_PORT = Number(process.env.MAILPIT_HTTP_PORT ?? 8025);
const MAILPIT_API_BASE = process.env.MAILPIT_API_BASE ?? `http://${MAILPIT_HTTP_HOST}:${MAILPIT_HTTP_PORT}`;

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
          // Mailpit -- start first so the SMTP sink is ready for the sender.
          command: 'node tools/mailpit/run.mjs',
          url: `${MAILPIT_API_BASE}/api/v1/info`,
          reuseExistingServer: !process.env.CI,
          timeout: 60_000, // first run may download the Mailpit binary
          stdout: 'pipe',
          stderr: 'pipe',
          env: {
            MAILPIT_SMTP_ADDR: `${MAILPIT_SMTP_HOST}:${MAILPIT_SMTP_PORT}`,
            MAILPIT_HTTP_ADDR: `${MAILPIT_HTTP_HOST}:${MAILPIT_HTTP_PORT}`,
          },
        },
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
            // Relay all mail to the local Mailpit SMTP sink.  External SMTP /
            // capture-mode overrides still work if explicitly provided.
            EMAIL_CAPTURE: process.env.EMAIL_CAPTURE ?? '0',
            SMTP_HOST: process.env.SMTP_HOST ?? MAILPIT_SMTP_HOST,
            SMTP_PORT: process.env.SMTP_PORT ?? String(MAILPIT_SMTP_PORT),
            ...(process.env.SMTP_USER    ? { SMTP_USER: process.env.SMTP_USER }    : {}),
            ...(process.env.SMTP_PASS    ? { SMTP_PASS: process.env.SMTP_PASS }    : {}),
            ...(process.env.SMTP_SECURE  ? { SMTP_SECURE: process.env.SMTP_SECURE } : {}),
          },
        },
      ]
    : undefined,
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  // One local retry absorbs transient blips from the live external targets
  // (playwright.dev, saucedemo, the-internet) without hiding real failures.
  retries: process.env.CI ? 2 : 1,
  workers: process.env.CI ? 2 : undefined,
  // Live-site navigations occasionally take >30s under load; 45s keeps slow
  // runs from flaking while still catching genuine hangs.
  timeout: 45_000,
  expect: {
    // 5s is tight for assertions that follow live-site navigations.
    timeout: 10_000,
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
    // Bounded waits everywhere: without actionTimeout, actions and
    // waitForEvent() default to unlimited and can hang a worker until the
    // test timeout (or forever, in WebKit's case — see that project's note).
    actionTimeout: 15_000,
    navigationTimeout: 30_000,
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
      testIgnore: ['**/saucedemo/**','**/visual/**','**/mocking/**','**/components/**','**/multi-context/**','**/websocket/**','**/ui/the-internet/**','**/email/**'],
    },
    {
      name: 'Playwright.dev Firefox', testDir: './tests',
      use: { ...devices['Desktop Firefox'], storageState: '.auth/playwrightdev.json' },
      dependencies: ['setup-playwrightdev'],
      testIgnore: ['**/saucedemo/**','**/performance/**','**/visual/**','**/mocking/**','**/components/**','**/multi-context/**','**/websocket/**','**/ui/the-internet/**','**/email/**'],
    },
    {
      name: 'Playwright.dev Webkit', testDir: './tests',
      use: { ...devices['Desktop Safari'], storageState: '.auth/playwrightdev.json' },
      dependencies: ['setup-playwrightdev'],
      testIgnore: ['**/saucedemo/**','**/performance/**','**/visual/**','**/mocking/**','**/components/**','**/multi-context/**','**/websocket/**','**/ui/the-internet/**','**/email/**'],
    },
    {
      name: 'Playwright.dev Mobile-chrome', testDir: './tests',
      use: { ...devices['Pixel 5'], storageState: '.auth/playwrightdev.json' },
      dependencies: ['setup-playwrightdev'],
      testIgnore: ['**/saucedemo/**','**/performance/**','**/visual/**','**/mocking/**','**/components/**','**/multi-context/**','**/websocket/**','**/ui/the-internet/**','**/email/**'],
    },
    {
      name: 'Playwright.dev Mobile-safari', testDir: './tests',
      use: { ...devices['iPhone 13'], storageState: '.auth/playwrightdev.json' },
      dependencies: ['setup-playwrightdev'],
      testIgnore: ['**/saucedemo/**','**/performance/**','**/visual/**','**/mocking/**','**/components/**','**/multi-context/**','**/websocket/**','**/ui/the-internet/**','**/email/**'],
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
      name: 'Crawler', testMatch: '**/crawler/**/*.spec.ts', testDir: './tests',
      // A full-site BFS crawl issues dozens of sequential HTTP requests;
      // 45s (the global default) is too tight under load, so give it room.
      timeout: 90_000,
      use: { baseURL: 'https://the-internet.herokuapp.com' },
    },
    {
      name: 'The Internet Chromium', testMatch: '**/ui/the-internet/**/*.spec.ts', testDir: './tests',
      use: { ...devices['Desktop Chrome'], baseURL: 'https://the-internet.herokuapp.com' },
    },
    {
      name: 'The Internet Firefox', testMatch: '**/ui/the-internet/**/*.spec.ts', testDir: './tests',
      use: { ...devices['Desktop Firefox'], baseURL: 'https://the-internet.herokuapp.com' },
    },
    {
      name: 'The Internet Webkit', testMatch: '**/ui/the-internet/**/*.spec.ts', testDir: './tests',
      use: {
        ...devices['Desktop Safari'],
        baseURL: 'https://the-internet.herokuapp.com',
        // Without actionTimeout, waitForEvent() calls default to no limit (0).
        // In WebKit, events like 'page' and 'download' can silently never fire,
        // leaving unresolved promises that prevent the browser process from
        // closing cleanly and cause workers to hang for 5 minutes until force-killed.
        actionTimeout: 15_000,
      },
    },
    {
      name: 'Email', testMatch: '**/email/**/*.spec.ts', testDir: './tests',
      // baseURL points at the local email-sender app so emailApp.goto() and
      // /verify/:token links work directly via page.goto(...).  Tests read the
      // resulting mail from the local Mailpit REST API.  The email-sender app
      // marks elements with data-test=..., so set the matching testIdAttribute.
      use: {
        ...devices['Desktop Chrome'],
        baseURL: EMAIL_APP_BASE_URL,
        testIdAttribute: 'data-test',
      },
    },
  ],
});
