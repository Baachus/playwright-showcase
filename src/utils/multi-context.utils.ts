import { Browser, BrowserContext, Page, expect } from '@playwright/test';
import { SD_PASSWORD, getSaucedemoAuthFile, SaucedemoUser } from './authentication.utils.js';
import { SD_InventoryPage } from '@pages/saucedemo/SD_InventoryPage.js';
import { SD_LoginPage } from '@pages/saucedemo/SD_LoginPage.js';

const BASE_URL = 'https://www.saucedemo.com';

/**
 * MultiContextHelper
 * ---------------------------------------------------------------------------
 * Utilities for spawning additional tabs and windows in multi-context tests.
 *
 * Terminology used throughout:
 *   Tab    - A new Page inside the SAME BrowserContext (shared session / cookies)
 *   Window - A new BrowserContext on the SAME Browser (independent session)
 *
 * Usage in tests:
 *   const helper = new MultiContextHelper(browser);
 *   const tab2   = await helper.newTab(context);
 *   const win    = await helper.newWindow('problem_user');
 */
export class MultiContextHelper {
  private readonly browser: Browser;

  constructor(browser: Browser) {
    this.browser = browser;
  }

  // --Tabs------------------------------------------------------------------
  /**
   * Open a second tab inside an existing context and navigate it to the
   * Saucedemo inventory page (it inherits the session already set on the context).
   *
   * @param context  The existing BrowserContext (e.g. the default test context).
   * @param path     Optional path to navigate to (defaults to /inventory.html).
   */
  async newTab(context: BrowserContext, path = '/inventory.html'): Promise<Page> {
    const tab = await context.newPage();
    await tab.goto(`${BASE_URL}${path}`);
    await tab.waitForLoadState('domcontentloaded');
    return tab;
  }

  // --Windows--------------------------------------------------------------
  /**
   * Create a brand-new BrowserContext pre-loaded with the saved auth state for
   * the given user, then open the inventory page in that context.
   *
   * The caller is responsible for closing the context after the test:
   *   await ctx.close();
   *
   * @param user  A Saucedemo user (not locked_out_user -- they have no auth file).
   */
  async newWindow(
    user: Exclude<SaucedemoUser, 'locked_out_user'>,
  ): Promise<{ context: BrowserContext; page: Page; inventoryPage: SD_InventoryPage }> {
    const authFile = getSaucedemoAuthFile(user);
    const context  = await this.browser.newContext({
      baseURL: BASE_URL,
      storageState: authFile,
    });
    const page = await context.newPage();
    await page.goto(`${BASE_URL}/inventory.html`);
    const inventoryPage = new SD_InventoryPage(page);
    await inventoryPage.waitForPageLoad();
    return { context, page, inventoryPage };
  }

  /**
   * Create an unauthenticated BrowserContext and navigate to the Saucedemo
   * login page -- useful for testing the login rejection flow inside a
   * multi-window scenario without polluting the default test session.
   */
  async newUnauthenticatedWindow(): Promise<{ context: BrowserContext; page: Page; loginPage: SD_LoginPage }> {
    const context   = await this.browser.newContext({ baseURL: BASE_URL });
    const page      = await context.newPage();
    const loginPage = new SD_LoginPage(page);
    await loginPage.goto();
    return { context, page, loginPage };
  }

  // --Login utils-------------------------------------------------------------
  /**
   * Log a user in from scratch on the given page (no storageState).
   * Returns an SD_InventoryPage ready to use.
   */
  static async loginAs(page: Page, username: string, password = SD_PASSWORD): Promise<SD_InventoryPage> {
    await page.goto(`${BASE_URL}/`);
    await page.locator('[data-test="username"]').fill(username);
    await page.locator('[data-test="password"]').fill(password);
    await page.locator('[data-test="login-button"]').click();
    await expect(page).toHaveURL(/inventory/);
    const inventoryPage = new SD_InventoryPage(page);
    await inventoryPage.waitForPageLoad();
    return inventoryPage;
  }

  /**
   * Attempt a login that is expected to be REJECTED (e.g. locked_out_user).
   * Asserts the error banner is visible and returns its text.
   */
  static async loginExpectRejected(page: Page, username: string, password = SD_PASSWORD): Promise<string> {
    await page.goto(`${BASE_URL}/`);
    await page.locator('[data-test="username"]').fill(username);
    await page.locator('[data-test="password"]').fill(password);
    await page.locator('[data-test="login-button"]').click();
    const error = page.locator('[data-test="error"]');
    await expect(error).toBeVisible();
    return error.innerText();
  }
}
