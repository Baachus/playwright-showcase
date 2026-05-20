import { test as base, expect, BrowserContext, Page } from '@playwright/test';
// Playwright.dev - Pages
import { PD_HomePage } from '../pages/playwrightdev/PD_HomePage.js';
import { PD_DocsPage } from '../pages/playwrightdev/PD_DocsPage.js';
// Playwright.dev - Components
import { PD_NavbarComponent } from '../components/playwrightdev/PD_NavbarComponent.js';
import { PD_SearchComponent } from '../components/playwrightdev/PD_SearchComponent.js';
import { PD_CodeBlockComponent } from '../components/playwrightdev/PD_CodeBlockComponent.js';
import { PD_LanguageSelectorComponent } from '../components/playwrightdev/PD_LanguageSelectorComponent.js';
import { PD_FooterComponent } from '../components/playwrightdev/PD_FooterComponent.js';
// Saucedemo - Pages
import { SD_LoginPage } from '../pages/saucedemo/SD_LoginPage.js';
import { SD_InventoryPage } from '../pages/saucedemo/SD_InventoryPage.js';
import { SD_CartPage } from '@pages/saucedemo/SD_CartPage.js';
import { SD_ConfirmationPage } from '@pages/saucedemo/checkout/SD_ConfirmationPage.js';
import { SD_InfoPage } from '@pages/saucedemo/checkout/SD_InfoPage.js';
import { SD_VerificationPage } from '@pages/saucedemo/checkout/SD_VerificationPage.js';
// Multi-context utilities
import { MultiContextHelper } from '../utils/multi-context.utils.js';
import { getSaucedemoAuthFile } from '../utils/authentication.utils.js';
// WebSocket utilities
import { startLocalEchoServer, type LocalEchoServer } from '../utils/websocket.utils.js';
// Email - Pages
import { LocalEmailAppPage } from '../pages/email/LocalEmailAppPage.js';
import { Mailinator_PublicInboxPage } from '../pages/mailinator/Mailinator_PublicInboxPage.js';
import { mintInboxName, inboxToAddress } from '../utils/mailinator.utils.js';

/**
 * Custom Fixtures
 * ---------------------------------------------------------------------------
 * Extends Playwright's base `test` with pre-instantiated Page Object Models,
 * Component Object Models, and multi-context helpers.
 * Tests import `{ test, expect }` from this file instead of `@playwright/test`.
 *
 * Benefits:
 *  - No `new HomePage(page)` boilerplate in every test
 *  - Each fixture is scoped to the test -- fully isolated
 *  - Easy to add new pages/components without touching existing tests
 */

/** 
 * ---- Multi-context fixture types ----
 * sd_tab2: a second Page in the SAME BrowserContext (shared session/cookies)
 * sd_standard_ctx: an independent BrowserContext logged in as standard_user
 * sd_problem_ctx: an independent BrowserContext logged in as problem_user
 * sd_glitch_ctx: an independent BrowserContext logged in as performance_glitch_user
 * sd_unauth_ctx: a fresh unauthenticated BrowserContext at the login page 
*/
type MultiContextFixtures = {
  sd_multiContextHelper: MultiContextHelper;
  sd_tab2: Page;
  sd_standard_ctx: { context: BrowserContext; page: Page; inventoryPage: SD_InventoryPage };
  sd_problem_ctx: { context: BrowserContext; page: Page; inventoryPage: SD_InventoryPage };
  sd_glitch_ctx: { context: BrowserContext; page: Page; inventoryPage: SD_InventoryPage };
  sd_unauth_ctx: { context: BrowserContext; page: Page; loginPage: SD_LoginPage };
};

// Define the shape of our custom fixtures
type PageFixtures = {
  // Playwright.dev - Pages
  pd_homePage: PD_HomePage;
  pd_docsPage: PD_DocsPage;

  // Playwright.dev - Components
  // Each component fixture navigates to its natural host page before yielding.
  pd_navbar: PD_NavbarComponent;
  pd_search: PD_SearchComponent;
  pd_codeBlock: PD_CodeBlockComponent;
  pd_languageSelector: PD_LanguageSelectorComponent;
  pd_footer: PD_FooterComponent;

  // Saucedemo - Standard pages
  sd_inventoryPage: SD_InventoryPage;
  sd_loginPage: SD_LoginPage;
  sd_cartPage: SD_CartPage;
  sd_confirmationPage: SD_ConfirmationPage;
  sd_infoPage: SD_InfoPage;
  sd_verificationPage: SD_VerificationPage;

  // WebSocket -- shared local echo server
  echoServer: LocalEchoServer;

  // Email -- local sender app + Mailinator public inbox
  /** A unique Mailinator public-inbox name minted per test (no collisions). */
  emailInbox: string;
  /** Full mailbox address for `emailInbox` (e.g. <inbox>@mailinator.com). */
  emailAddress: string;
  /** Page Object for the local email-sender helper service. */
  emailApp: LocalEmailAppPage;
  /** Page Object for the Mailinator public inbox UI, scoped to `emailInbox`. */
  mailinatorInbox: Mailinator_PublicInboxPage;
} & MultiContextFixtures;

export const test = base.extend<PageFixtures>({
  // ---- Playwright.dev - Pages ----
  /** HomePage fixture -- navigates to home and waits for load before yielding. */
  pd_homePage: async ({ page }, use) => {
    const pd_homePage = new PD_HomePage(page);
    await pd_homePage.goto();
    await use(pd_homePage);
  },

  /** DocsPage fixture -- navigates to /docs/intro before yielding. */
  pd_docsPage: async ({ page }, use) => {
    const pd_docsPage = new PD_DocsPage(page);
    await pd_docsPage.goto();
    await use(pd_docsPage);
  },

  // ---- Playwright.dev - Components ----
  /**
   * Navbar component -- navigates to the home page so the navbar is rendered,
   * then yields a PD_NavbarComponent scoped to nav.navbar.
   */
  pd_navbar: async ({ page }, use) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    const component = new PD_NavbarComponent(page);
    await component.waitForVisible();
    await use(component);
  },

  /**
   * Search component -- navigates to the home page (search is always available).
   * The modal itself is not opened automatically; tests call component.open().
   */
  pd_search: async ({ page }, use) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    const component = new PD_SearchComponent(page);
    await use(component);
  },

  /**
   * CodeBlock component -- navigates to /docs/intro which is guaranteed to have
   * code blocks, then yields a PD_CodeBlockComponent targeting the first block.
   */
  pd_codeBlock: async ({ page }, use) => {
    await page.goto('/docs/intro');
    await page.waitForLoadState('domcontentloaded');
    const component = new PD_CodeBlockComponent(page, 0);
    await use(component);
  },

  /**
   * LanguageSelector component -- navigates to the home page where the navbar
   * language tabs (Node.js / Python / Java / .NET) are present.
   */
  pd_languageSelector: async ({ page }, use) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    const component = new PD_LanguageSelectorComponent(page);
    await component.waitForVisible();
    await use(component);
  },

  /**
   * Footer component -- navigates to the home page then yields a PD_FooterComponent.
   * Note: the footer is off-screen by default; helpers call scrollIntoView() as needed.
   */
  pd_footer: async ({ page }, use) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    const component = new PD_FooterComponent(page);
    await use(component);
  },

  // ---- Saucedemo - Standard pages ----
  sd_inventoryPage: async ({ page }, use) => {
    const sd_inventoryPage = new SD_InventoryPage(page);
    await sd_inventoryPage.goto();
    await use(sd_inventoryPage);
  },

  sd_loginPage: async ({ page }, use) => {
    const sd_loginPage = new SD_LoginPage(page);
    await sd_loginPage.goto();
    await use(sd_loginPage);
  },

  sd_cartPage: async ({ page }, use) => {
    const sd_cartPage = new SD_CartPage(page);
    await sd_cartPage.goto();
    await use(sd_cartPage);
  },

  sd_confirmationPage: async ({ page }, use) => {
    const sd_confirmationPage = new SD_ConfirmationPage(page);
    await sd_confirmationPage.goto();
    await use(sd_confirmationPage);
  },

  sd_infoPage: async ({ page }, use) => {
    const sd_infoPage = new SD_InfoPage(page);
    await sd_infoPage.goto();
    await use(sd_infoPage);
  },

  sd_verificationPage: async ({ page }, use) => {
    const sd_verificationPage = new SD_VerificationPage(page);
    await sd_verificationPage.goto();
    await use(sd_verificationPage);
  },

  /**
   * echoServer -- per-test in-process WebSocket echo server bound to
   * ws://127.0.0.1:<random>.  Replaces the unreliable public
   * wss://echo.websocket.events used by ws-realtime tests.  Sends a welcome
   * line on connect containing "echo.websocket.events" so the existing test
   * filters that skip the welcome message continue to work, and echoes every
   * frame the client sends.  The server is torn down at test end.
   */
  echoServer: async ({}, use) => {
    const server = await startLocalEchoServer();
    await use(server);
    await server.close();
  },

  // ---- Email -- local sender + Mailinator ----
  /**
   * emailInbox -- a fresh public-inbox name minted per test.  Mailinator's
   * public inboxes are world-readable, so we never reuse a fixed name -- a
   * unique one per test prevents any chance of collision.
   */
  emailInbox: async ({}, use) => {
    await use(mintInboxName('pwshowcase'));
  },

  /** Full `<inbox>@mailinator.com` address derived from `emailInbox`. */
  emailAddress: async ({ emailInbox }, use) => {
    await use(inboxToAddress(emailInbox));
  },

  /**
   * emailApp -- LocalEmailAppPage bound to the running helper service.
   * The service URL comes from the EMAIL_APP_BASE_URL env var (set by the
   * `webServer` block in playwright.config.ts), defaulting to localhost:4310.
   * The fixture resets the server's in-memory state before each test.
   */
  emailApp: async ({ page }, use) => {
    const baseURL = process.env.EMAIL_APP_BASE_URL ?? 'http://localhost:4310';
    const app = new LocalEmailAppPage(page, baseURL);
    await app.reset();
    await use(app);
  },

  /**
   * mailinatorInbox -- Mailinator_PublicInboxPage scoped to this test's
   * unique inbox.  Does NOT navigate by default -- the test triggers a
   * send first and then calls .goto() to start polling.
   */
  mailinatorInbox: async ({ page, emailInbox }, use) => {
    await use(new Mailinator_PublicInboxPage(page, emailInbox));
  },

  // ---- Saucedemo - Multi-context fixtures ----
  /**
   * MultiContextHelper -- wraps the browser object and exposes helpers for
   * creating extra tabs (same session) and windows (independent sessions).
   * Available in all multi-context tests via fixture injection.
   */
  sd_multiContextHelper: async ({ browser }, use) => {
    await use(new MultiContextHelper(browser));
  },

  /**
   * sd_tab2 -- A second Page opened inside the DEFAULT test context.
   * Because it shares the same context as `page`, it inherits the same
   * cookies / localStorage (i.e. the same logged-in session).
   * Useful for verifying that cart state, navigation, etc. persist across tabs.
   */
  sd_tab2: async ({ context }, use) => {
    const tab2 = await context.newPage();
    await tab2.goto('https://www.saucedemo.com/inventory.html');
    await tab2.waitForLoadState('domcontentloaded');
    await use(tab2);
    await tab2.close();
  },

  /**
   * sd_standard_ctx -- An INDEPENDENT BrowserContext logged in as standard_user.
   * Use alongside sd_problem_ctx to run two users simultaneously in separate windows.
   * The context is closed automatically after the test.
   */
  sd_standard_ctx: async ({ browser }, use) => {
    const context = await browser.newContext({
      baseURL: 'https://www.saucedemo.com',
      storageState: getSaucedemoAuthFile('standard_user'),
    });
    const page = await context.newPage();
    await page.goto('https://www.saucedemo.com/inventory.html');
    const inventoryPage = new SD_InventoryPage(page);
    await inventoryPage.waitForPageLoad();
    await use({ context, page, inventoryPage });
    await context.close();
  },

  /**
   * sd_problem_ctx -- An INDEPENDENT BrowserContext logged in as problem_user.
   * problem_user sees broken images on all inventory items -- good for
   * comparing rendering differences between user sessions.
   */
  sd_problem_ctx: async ({ browser }, use) => {
    const context = await browser.newContext({
      baseURL: 'https://www.saucedemo.com',
      storageState: getSaucedemoAuthFile('problem_user'),
    });
    const page = await context.newPage();
    await page.goto('https://www.saucedemo.com/inventory.html');
    const inventoryPage = new SD_InventoryPage(page);
    await inventoryPage.waitForPageLoad();
    await use({ context, page, inventoryPage });
    await context.close();
  },

  /**
   * sd_glitch_ctx -- An INDEPENDENT BrowserContext logged in as performance_glitch_user.
   * performance_glitch_user experiences artificial load delays -- useful for
   * demonstrating that independent contexts do not interfere with each other's timing.
   */
  sd_glitch_ctx: async ({ browser }, use) => {
    const context = await browser.newContext({
      baseURL: 'https://www.saucedemo.com',
      storageState: getSaucedemoAuthFile('performance_glitch_user'),
    });
    const page = await context.newPage();
    await page.goto('https://www.saucedemo.com/inventory.html');
    const inventoryPage = new SD_InventoryPage(page);
    await inventoryPage.waitForPageLoad();
    await use({ context, page, inventoryPage });
    await context.close();
  },

  /**
   * sd_unauth_ctx -- A fresh UNAUTHENTICATED BrowserContext at the login page.
   * Use for testing login rejection flows (e.g. locked_out_user) in isolation
   * without touching the default test session.
   */
  sd_unauth_ctx: async ({ browser }, use) => {
    const context = await browser.newContext({ baseURL: 'https://www.saucedemo.com' });
    const page = await context.newPage();
    const loginPage = new SD_LoginPage(page);
    await loginPage.goto();
    await use({ context, page, loginPage });
    await context.close();
  },
});

export { expect };
