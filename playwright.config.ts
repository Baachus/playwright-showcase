import { defineConfig, devices } from '@playwright/test';
import path from 'path';

/**
 * Playwright Configuration
 * Multi-project setup covering desktop, mobile, and API testing.
 * @see https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
  // Root directory for test discovery
  testDir: './tests',

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
    ['allure-playwright', { outputFolder: 'allure-results', suiteTitle: false }],
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
    // ── Setup project (global auth / state) ──────────────────────────
    {
      name: 'setup',
      testMatch: '**/fixtures/global.setup.ts',
    },

    // ── Desktop Browsers ─────────────────────────────────────────────
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
      dependencies: ['setup'],
      // Chromium runs everything including Lighthouse performance tests
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
      dependencies: ['setup'],
      // Lighthouse requires Chrome — skip performance tests on other browsers
      testIgnore: '**/performance/**',
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
      dependencies: ['setup'],
      testIgnore: '**/performance/**',
    },

    // ── Mobile Viewports ─────────────────────────────────────────────
    {
      name: 'mobile-chrome',
      use: { ...devices['Pixel 5'] },
      dependencies: ['setup'],
      testIgnore: '**/performance/**',
    },
    {
      name: 'mobile-safari',
      use: { ...devices['iPhone 13'] },
      dependencies: ['setup'],
      testIgnore: '**/performance/**',
    },

    // ── API Testing (no browser) ──────────────────────────────────────
    {
      name: 'api',
      testMatch: '**/api/**/*.spec.ts',
      use: {
        baseURL: 'https://playwright.dev',
        extraHTTPHeaders: {
          Accept: 'application/json',
        },
      },
    },
  ],
});