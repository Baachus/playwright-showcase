import { defineConfig, devices } from '@playwright/test';


/**
 * Playwright Configuration
 * Multi-project setup covering desktop, mobile, API, visual regression, network mocking,
 * component-level testing, multi-context testing, and WebSocket / realtime testing.
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
    {
      name: 'Playwright.dev Chromium',
      testDir: './tests',
      use: { ...devices['Desktop Chrome'], storageState: '.auth/playwrightdev.json' },
      dependencies: ['setup-playwrightdev'],
      testIgnore: ['**/saucedemo/**', '**/visual/**', '**/mocking/**', '**/components/**', '**/multi-context/**', '**/websocket/**'],
    },
    {
      name: 'Playwright.dev Firefox',
      testDir: './tests',
      use: { ...devices['Desktop Firefox'], storageState: '.auth/playwrightdev.json' },
      dependencies: ['setup-playwrightdev'],
      testIgnore: ['**/saucedemo/**', '**/performance/**', '**/visual/**', '**/mocking/**', '**/components/**', '**/multi-context/**', '**/websocket/**'],
    },
    {
      name: 'Playwright.dev Webkit',
      testDir: './tests',
      use: { ...devices['Desktop Safari'], storageState: '.auth/playwrightdev.json' },
      dependencies: ['setup-playwrightdev'],
      testIgnore: ['**/saucedemo/**', '**/performance/**', '**/visual/**', '**/mocking/**', '**/components/**', '**/multi-context/**', '**/websocket/**'],
    },

    // ---- Playwright.dev - Mobile ----
    {
      name: 'Playwright.dev Mobile-chrome',
      testDir: './tests',
      use: { ...devices['Pixel 5'], storageState: '.auth/playwrightdev.json' },
      dependencies: ['setup-playwrightdev'],
      testIgnore: ['**/saucedemo/**', '**/performance/**', '**/visual/**', '**/mocking/**', '**/components/**', '**/multi-context/**', '**/websocket/**'],
    },
    {
      name: 'Playwright.dev Mobile-safari',
      testDir: './tests',
      use: { ...devices['iPhone 13'], storageState: '.auth/playwrightdev.json' },
      dependencies: ['setup-playwrightdev'],
      testIgnore: ['**/saucedemo/**', '**/performance/**', '**/visual/**', '**/mocking/**', '**/components/**', '**/multi-context/**', '**/websocket/**'],
    },

    // ---- Component Testing ----
    // Isolated component-focused tests targeting specific UI sections of playwright.dev.
    // Runs on Chromium only; components are browser-agnostic by design.
    // Tags: @component (all), @smoke (critical subset).
    // Run: npx playwright test --project=Components
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
    // a single test, using distinct Saucedemo user personas.
    // Run: npx playwright test --project=Multi-Context
    // Run by tag: npx playwright test --project=Multi-Context --grep @multi-tab
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

    // ---- WebSocket -- Mock ----
    // Tests that use page.routeWebSocket() to intercept and control WS traffic
    // with zero network dependency. Simulates a realtime price-update feature
    // layered on top of the Saucedemo inventory page.
    // Run: npx playwright test --project=WebSocket-Mock
    // Tag: @ws-mock
    {
      name: 'WebSocket-Mock',
      testMatch: '**/websocket/**/ws-mock.spec.ts',
      testDir: './tests',
      dependencies: ['setup-saucedemo'],
      use: {
        ...devices['Desktop Chrome'],
        baseURL: 'https://www.saucedemo.com',
        storageState: '.auth/saucedemo.json',
      },
    },

    // ---- WebSocket -- Realtime ----
    // Tests that open real WebSocket connections to a public echo server and
    // observe frames via Playwright's page.on('websocket') API.
    // Requires network access to wss://echo.websocket.events
    // Run: npx playwright test --project=WebSocket-Realtime
    // Tag: @ws-realtime
    {
      name: 'WebSocket-Realtime',
      testMatch: '**/websocket/**/ws-realtime.spec.ts',
      testDir: './tests',
      dependencies: ['setup-saucedemo'],
      use: {
        ...devices['Desktop Chrome'],
        baseURL: 'https://www.saucedemo.com',
        storageState: '.auth/saucedemo.json',
      },
    },

    // ---- Visual Regression ----
    // Chromium only for consistent pixel baselines.
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
    {
      name: 'Mocking',
      testMatch: '**/mocking/**/*.spec.ts',
      testDir: './tests',
      use: { ...devices['Desktop Chrome'], baseURL: 'https://playwright.dev' },
    },

    // ---- Performance ----
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
