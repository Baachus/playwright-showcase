import { defineConfig, devices } from '@playwright/test';
import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Playwright Configuration
 * Multi-project setup covering desktop, mobile, and API testing.
 * @see https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
  // Run all tests in parallel
  fullyParallel: true,

  // Fail the build on CI if test.only is accidentally left in
  forbidOnly: !!process.env.CI,

  // Retry on CI only
  retries: process.env.CI ? 2 : 0,

  // Opt out of parallel tests on CI for stability
  workers: process.env.CI ? 2 : undefined,

  // Global timeout per test
  timeout: 30_000,

  // Expect timeout for assertions
  expect: {
    timeout: 5_000,
  },

  // Reporter configuration - supports both HTML and Allure
  reporter: [
    ['html', { outputFolder: 'reports/html', open: 'never' }],
    [
      'allure-playwright',
      {
        resultsDir: 'allure-results',
        suiteTitle: false,
        // Groups tests by Epic → Feature → Story in the Allure sidebar
        categories: [
          {
            name: 'Test Failures',
            matchedStatuses: ['failed'],
          },
          {
            name: 'Broken Tests',
            matchedStatuses: ['broken'],
          },
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

  // Shared settings for all projects
  use: {
    // Base URL for playwright.dev tests
    baseURL: 'https://playwright.dev',

    // Collect trace on first retry
    trace: 'on-first-retry',

    // Screenshot on failure
    screenshot: 'only-on-failure',

    // Video on first retry
    video: 'on-first-retry',

    // Viewport
    viewport: { width: 1280, height: 720 },
  },

  // Output directory for test artifacts
  outputDir: 'test-results',

  // Projects - multi-browser + mobile + API
  projects: [
    // ── Setup Projects ────────────────────────────────────────────────
    {
      name: 'setup-saucedemo',
      testMatch: /.*saucedemo\.setup\.ts/,
    },
    {
      name: 'setup-playwrightdev',
      testMatch: /.*playwrightdev\.setup\.ts/,
    },

    // ── Playwright.dev — Desktop Browsers ────────────────────────────
    {
      name: 'Playwright.dev Chromium',
      testDir: './tests',
      use: {
        ...devices['Desktop Chrome'],
        storageState: '.auth/playwrightdev.json',
      },
      dependencies: ['setup-playwrightdev'],
      testIgnore: '**/saucedemo/**',
    },
    {
      name: 'Playwright.dev Firefox',
      testDir: './tests',
      use: {
        ...devices['Desktop Firefox'],
        storageState: '.auth/playwrightdev.json',
      },
      dependencies: ['setup-playwrightdev'],
      testIgnore: ['**/saucedemo/**', '**/performance/**'],
    },
    {
      name: 'Playwright.dev Webkit',
      testDir: './tests',
      use: {
        ...devices['Desktop Safari'],
        storageState: '.auth/playwrightdev.json',
      },
      dependencies: ['setup-playwrightdev'],
      testIgnore: ['**/saucedemo/**', '**/performance/**'],
    },

    // ── Playwright.dev — Mobile ───────────────────────────────────────
    {
      name: 'Playwright.dev Mobile-chrome',
      testDir: './tests',
      use: {
        ...devices['Pixel 5'],
        storageState: '.auth/playwrightdev.json',
      },
      dependencies: ['setup-playwrightdev'],
      testIgnore: ['**/saucedemo/**', '**/performance/**'],
    },
    {
      name: 'Playwright.dev Mobile-safari',
      testDir: './tests',
      use: {
        ...devices['iPhone 13'],
        storageState: '.auth/playwrightdev.json',
      },
      dependencies: ['setup-playwrightdev'],
      testIgnore: ['**/saucedemo/**', '**/performance/**'],
    },

    // ── API ───────────────────────────────────────────────────────────
    {
      name: 'API',
      testMatch: '**/api/**/*.spec.ts',
      testDir: './tests',
      use: {
        baseURL: 'https://playwright.dev',
        extraHTTPHeaders: { Accept: 'application/json' },
      },
    },

    // ── Saucedemo ─────────────────────────────────────────────────────
    {
      name: 'Saucedemo Chromium',
      testMatch: '**/saucedemo/**/*.spec.ts',
      testDir: './tests',
      dependencies: ['setup-saucedemo'],
      use: {
        ...devices['Desktop Chrome'],
        baseURL: 'https://www.saucedemo.com',
        storageState: '.auth/saucedemo.json',
      },
    },
  ],
});