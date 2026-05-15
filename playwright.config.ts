import { defineConfig, devices } from '@playwright/test';


/**
 * Playwright Configuration
 * Multi-project setup covering desktop, mobile, API, visual regression, and network mocking.
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
    // Setup
    { name: 'setup-saucedemo',     testMatch: /.*saucedemo\.setup\.ts/    },
    { name: 'setup-playwrightdev', testMatch: /.*playwrightdev\.setup\.ts/ },

    // Playwright.dev - Desktop
    {
      name: 'Playwright.dev Chromium',
      testDir: './tests',
      use: { ...devices['Desktop Chrome'], storageState: '.auth/playwrightdev.json' },
      dependencies: ['setup-playwrightdev'],
      testIgnore: ['**/saucedemo/**', '**/visual/**', '**/mocking/**'],
    },
    {
      name: 'Playwright.dev Firefox',
      testDir: './tests',
      use: { ...devices['Desktop Firefox'], storageState: '.auth/playwrightdev.json' },
      dependencies: ['setup-playwrightdev'],
      testIgnore: ['**/saucedemo/**', '**/performance/**', '**/visual/**', '**/mocking/**'],
    },
    {
      name: 'Playwright.dev Webkit',
      testDir: './tests',
      use: { ...devices['Desktop Safari'], storageState: '.auth/playwrightdev.json' },
      dependencies: ['setup-playwrightdev'],
      testIgnore: ['**/saucedemo/**', '**/performance/**', '**/visual/**', '**/mocking/**'],
    },

    // Playwright.dev - Mobile
    {
      name: 'Playwright.dev Mobile-chrome',
      testDir: './tests',
      use: { ...devices['Pixel 5'], storageState: '.auth/playwrightdev.json' },
      dependencies: ['setup-playwrightdev'],
      testIgnore: ['**/saucedemo/**', '**/performance/**', '**/visual/**', '**/mocking/**'],
    },
    {
      name: 'Playwright.dev Mobile-safari',
      testDir: './tests',
      use: { ...devices['iPhone 13'], storageState: '.auth/playwrightdev.json' },
      dependencies: ['setup-playwrightdev'],
      testIgnore: ['**/saucedemo/**', '**/performance/**', '**/visual/**', '**/mocking/**'],
    },

    // API
    {
      name: 'API',
      testMatch: '**/api/**/*.spec.ts',
      testDir: './tests',
      use: { baseURL: 'https://playwright.dev', extraHTTPHeaders: { Accept: 'application/json' } },
    },

    // Saucedemo
    {
      name: 'Saucedemo Chromium',
      testMatch: '**/saucedemo/**/*.spec.ts',
      testDir: './tests',
      dependencies: ['setup-saucedemo'],
      use: { ...devices['Desktop Chrome'], baseURL: 'https://www.saucedemo.com', storageState: '.auth/saucedemo.json' },
    },

    // Visual Regression
    // Runs on Chromium only for consistent pixel baselines.
    // Snapshots stored in tests/visual/**/__snapshots__/ and committed to VCS.
    // First run creates baselines automatically; subsequent runs diff against them.
    // To update baselines: npm run test:visual:update
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

    // Network Mocking
    // Tests that intercept and control network traffic via page.route().
    // Single browser keeps the suite fast; mocking behaviour is browser-agnostic.
    {
      name: 'Mocking',
      testMatch: '**/mocking/**/*.spec.ts',
      testDir: './tests',
      use: {
        ...devices['Desktop Chrome'],
        baseURL: 'https://playwright.dev',
      },
    },
  ],
});
