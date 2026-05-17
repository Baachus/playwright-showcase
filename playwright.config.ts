import { defineConfig, devices } from '@playwright/test';


/**
 * Playwright Configuration
 * Multi-project setup covering desktop, mobile, API, visual regression, network mocking,
 * component-level testing, and multi-context (multi-tab / multi-window / multi-user) testing.
 * @see https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 2 : undefined,
  timeout: 30_000,

  expect: {
    timeout: 5_000,
    toHaveScreenshot: {
      maxDiffPixelRatio: 0.02,
      animations: 'disabled',
    },
  },

  reporter: [
    ['html', { outputFolder: 'reports/html', open: 'never' }],
    [
      'allure-playwright',
      {
        resultsDir: 'allure-results',
        suiteTitle: false,
        categories: [
          { name: 'Test Failures', matchedStatuses: ['failed'] },
          { name: 'Broken Tests',  matchedStatuses: ['broken'] },
        ],
        environmentInfo: {
          Framework: 'Playwright',
          Language: 'TypeScript',
          Target: 'https://playwright.dev',
          'Node Version': process.version,
          Platform: process.platform,
        },
      },
    ],
    ['list'],
    ...(process.env.CI ? [['github'] as ['github']] : []),
  ],

  use: {
    baseURL: 'https://playwright.dev',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'on-first-retry',
    viewport: { width: 1280, height: 720 },
  },

  outputDir: 'test-results',

  projects: [
    // ---- Setup ----
    { name: 'setup-saucedemo',            testMatch: /.*saucedemo\.setup\.ts/           },
    { name: 'setup-saucedemo-multiuser',  testMatch: /.*saucedemo-multiuser\.setup\.ts/ },
    { name: 'setup-playwrightdev',        testMatch: /.*playwrightdev\.setup\.ts/       },

    // ---- Playwright.dev - Desktop ----
    // Component tests live in tests/components/ and are excluded here so they
    // only run once under the dedicated Components project below.
    {
      name: 'Playwright.dev Chromium',
      testDir: './tests',
      use: { ...devices['Desktop Chrome'], storageState: '.auth/playwrightdev.json' },
      dependencies: ['setup-playwrightdev'],
      testIgnore: ['**/saucedemo/**', '**/visual/**', '**/mocking/**', '**/components/**', '**/multi-context/**'],
    },
    {
      name: 'Playwright.dev Firefox',
      testDir: './tests',
      use: { ...devices['Desktop Firefox'], storageState: '.auth/playwrightdev.json' },
      dependencies: ['setup-playwrightdev'],
      testIgnore: ['**/saucedemo/**', '**/performance/**', '**/visual/**', '**/mocking/**', '**/components/**', '**/multi-context/**'],
    },
    {
      name: 'Playwright.dev Webkit',
      testDir: './tests',
      use: { ...devices['Desktop Safari'], storageState: '.auth/playwrightdev.json' },
      dependencies: ['setup-playwrightdev'],
      testIgnore: ['**/saucedemo/**', '**/performance/**', '**/visual/**', '**/mocking/**', '**/components/**', '**/multi-context/**'],
    },

    // ---- Playwright.dev - Mobile ----
    {
      name: 'Playwright.dev Mobile-chrome',
      testDir: './tests',
      use: { ...devices['Pixel 5'], storageState: '.auth/playwrightdev.json' },
      dependencies: ['setup-playwrightdev'],
      testIgnore: ['**/saucedemo/**', '**/performance/**', '**/visual/**', '**/mocking/**', '**/components/**', '**/multi-context/**'],
    },
    {
      name: 'Playwright.dev Mobile-safari',
      testDir: './tests',
      use: { ...devices['iPhone 13'], storageState: '.auth/playwrightdev.json' },
      dependencies: ['setup-playwrightdev'],
      testIgnore: ['**/saucedemo/**', '**/performance/**', '**/visual/**', '**/mocking/**', '**/components/**', '**/multi-context/**'],
    },

    // ---- Component Testing ----
    // Isolated component-focused tests targeting specific UI sections of playwright.dev.
    // Runs on Chromium only to keep the suite fast; components are browser-agnostic by design.
    // Tags: @component (all), @smoke (critical subset).
    // Run just this project: npx playwright test --project=Components
    {
      name: 'Components',
      testMatch: '**/components/**/*.spec.ts',
      testDir: './tests',
      use: {
        ...devices['Desktop Chrome'],
        baseURL: 'https://playwright.dev',
        storageState: '.auth/playwrightdev.json',
      },
      dependencies: ['setup-playwrightdev'],
    },

    // ---- API ----
    {
      name: 'API',
      testMatch: '**/api/**/*.spec.ts',
      testDir: './tests',
      use: { baseURL: 'https://playwright.dev', extraHTTPHeaders: { Accept: 'application/json' } },
    },

    // ---- Saucedemo ----
    {
      name: 'Saucedemo Chromium',
      testMatch: '**/ui/saucedemo/**/*.spec.ts',
      testDir: './tests',
      dependencies: ['setup-saucedemo'],
      use: { ...devices['Desktop Chrome'], baseURL: 'https://www.saucedemo.com', storageState: '.auth/saucedemo.json' },
    },

    // ---- Multi-Context (Multi-Tab / Multi-Window / Multi-User) ----
    // Tests that exercise multiple BrowserContexts and/or multiple Pages within
    // a single test, covering shared-session tab scenarios and independent-session
    // window scenarios using distinct Saucedemo user personas.
    //
    // The storageState here pre-loads standard_user as the default session for
    // multi-tab tests.  Multi-window fixtures load their own per-user auth files.
    //
    // Run just this project: npx playwright test --project=Multi-Context
    // Run by tag:            npx playwright test --project=Multi-Context --grep @multi-tab
    //                        npx playwright test --project=Multi-Context --grep @multi-window
    //                        npx playwright test --project=Multi-Context --grep @multi-user
    {
      name: 'Multi-Context',
      testMatch: '**/multi-context/**/*.spec.ts',
      testDir: './tests',
      dependencies: ['setup-saucedemo-multiuser'],
      use: {
        ...devices['Desktop Chrome'],
        baseURL: 'https://www.saucedemo.com',
        storageState: '.auth/sd_standard_user.json',
      },
    },

    // ---- Visual Regression ----
    // Runs on Chromium only for consistent pixel baselines.
    // Snapshots stored in tests/visual/**/__snapshots__/ and committed to VCS.
    // First run creates baselines automatically; subsequent runs diff against them.
    // To update baselines: npx playwright test --project=Visual --update-snapshots
    {
      name: 'Visual',
      testMatch: '**/visual/**/*.spec.ts',
      testDir: './tests',
      use: {
        ...devices['Desktop Chrome'],
        baseURL: 'https://playwright.dev',
        screenshot: 'only-on-failure',
        viewport: { width: 1280, height: 720 },
      },
    },

    // ---- Network Mocking ----
    // Tests that intercept and control network traffic via page.route().
    // Single browser keeps the suite fast; mocking behavior is browser-agnostic.
    {
      name: 'Mocking',
      testMatch: '**/mocking/**/*.spec.ts',
      testDir: './tests',
      use: { ...devices['Desktop Chrome'], baseURL: 'https://playwright.dev' },
    },

    // ---- Performance ----
    // Chromium only; measures Core Web Vitals and custom timing budgets.
    {
      name: 'Performance',
      testMatch: '**/performance/**/*.spec.ts',
      testDir: './tests',
      use: { ...devices['Desktop Chrome'], baseURL: 'https://playwright.dev' },
    },

    // ---- Security ----
    {
      name: 'Security',
      testMatch: '**/security/**/*.spec.ts',
      testDir: './tests',
      use: { ...devices['Desktop Chrome'], baseURL: 'https://playwright.dev' },
    },

    // ---- Accessibility ----
    {
      name: 'Accessibility',
      testMatch: '**/accessibility/**/*.spec.ts',
      testDir: './tests',
      use: { ...devices['Desktop Chrome'], baseURL: 'https://playwright.dev' },
    },
  ],
});
