import { test as base, expect } from '@playwright/test';
import { HomePage } from '../pages/playwrightdev/HomePage.js';
import { DocsPage } from '../pages/playwrightdev/DocsPage.js';
import { LoginPage } from '../pages/saucedemo/LoginPage.js';
import { InventoryPage } from '../pages/saucedemo/InventoryPage.js';

/**
 * Custom Fixtures
 * ─────────────────────────────────────────────────────────────────────────────
 * Extends Playwright's base `test` with pre-instantiated Page Object Models.
 * Tests import `{ test, expect }` from this file instead of `@playwright/test`.
 *
 * Benefits:
 *  - No `new HomePage(page)` boilerplate in every test
 *  - Each fixture is scoped to the test – fully isolated
 *  - Easy to add new pages without touching existing tests
 */

// Define the shape of our custom fixtures
type PageFixtures = {
  // Playwright.dev
  homePage: HomePage;
  docsPage: DocsPage;

  // Saucedemo
  inventoryPage: InventoryPage;
  loginPage: LoginPage;
};

export const test = base.extend<PageFixtures>({
  // ---- Playwright.dev ----
  /**
   * HomePage fixture – navigates to home and waits for load before yielding.
   */
  homePage: async ({ page }, use) => {
    const homePage = new HomePage(page);
    await homePage.goto();
    await use(homePage);
  },

  /**
   * DocsPage fixture – navigates to /docs/intro before yielding.
   */
  docsPage: async ({ page }, use) => {
    const docsPage = new DocsPage(page);
    await docsPage.goto();
    await use(docsPage);
  },

  // ---- Saucedemo ----
  inventoryPage: async ({ page }, use) => {
    const inventoryPage = new InventoryPage(page);
    await inventoryPage.goto();
    await use(inventoryPage);
  },

  loginPage: async ({ page }, use) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await use(loginPage);
  },
});

// Re-export expect so tests only need one import
export { expect };