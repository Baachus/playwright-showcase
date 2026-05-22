import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright Configuration
 */
export default defineConfig({
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
      testIgnore: ['**/saucedemo/**','**/visual/**','**/mocking/**','**/components/**','**/multi-context/**','**/websocket/**','**/ui/the-internet/**'],
    },
    {
      name: 'Playwright.dev Firefox', testDir: './tests',
      use: { ...devices['Desktop Firefox'], storageState: '.auth/playwrightdev.json' },
      dependencies: ['setup-playwrightdev'],
      testIgnore: ['**/saucedemo/**','**/performance/**','**/visual/**','**/mocking/**','**/components/**','**/multi-context/**','**/websocket/**','**/ui/the-internet/**'],
    },
    {
      name: 'Playwright.dev Webkit', testDir: './tests',
      use: { ...devices['Desktop Safari'], storageState: '.auth/playwrightdev.json' },
      dependencies: ['setup-playwrightdev'],
      testIgnore: ['**/saucedemo/**','**/performance/**','**/visual/**','**/mocking/**','**/components/**','**/multi-context/**','**/websocket/**','**/ui/the-internet/**'],
    },
    {
      name: 'Playwright.dev Mobile-chrome', testDir: './tests',
      use: { ...devices['Pixel 5'], storageState: '.auth/playwrightdev.json' },
      dependencies: ['setup-playwrightdev'],
      testIgnore: ['**/saucedemo/**','**/performance/**','**/visual/**','**/mocking/**','**/components/**','**/multi-context/**','**/websocket/**','**/ui/the-internet/**'],
    },
    {
      name: 'Playwright.dev Mobile-safari', testDir: './tests',
      use: { ...devices['iPhone 13'], storageState: '.auth/playwrightdev.json' },
      dependencies: ['setup-playwrightdev'],
      testIgnore: ['**/saucedemo/**','**/performance/**','**/visual/**','**/mocking/**','**/components/**','**/multi-context/**','**/websocket/**','**/ui/the-internet/**'],
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
      name: 'The Internet Chromium', testMatch: '**/ui/the-internet/**/*.spec.ts', testDir: './tests',
      use: { ...devices['Desktop Chrome'], baseURL: 'https://the-internet.herokuapp.com' },
    },
    {
      name: 'The Internet Firefox', testMatch: '**/ui/the-internet/**/*.spec.ts', testDir: './tests',
      use: { ...devices['Desktop Firefox'], baseURL: 'https://the-internet.herokuapp.com' },
    },
    {
      name: 'The Internet Webkit', testMatch: '**/ui/the-internet/**/*.spec.ts', testDir: './tests',
      use: { ...devices['Desktop Safari'], baseURL: 'https://the-internet.herokuapp.com' },
    },
  ],
});
