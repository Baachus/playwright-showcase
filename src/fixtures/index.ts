import { test as base, expect } from '@playwright/test';
// Playwright.dev
import { PD_HomePage } from '../pages/playwrightdev/PD_HomePage.js';
import { PD_DocsPage } from '../pages/playwrightdev/PD_DocsPage.js';
// Saucedemo
import { SD_LoginPage } from '../pages/saucedemo/SD_LoginPage.js';
import { SD_InventoryPage } from '../pages/saucedemo/SD_InventoryPage.js';
import { SD_CartPage } from '@pages/saucedemo/SD_CartPage.js';
import { SD_ConfirmationPage } from '@pages/saucedemo/checkout/SD_ConfirmationPage.js';
import { SD_InfoPage } from '@pages/saucedemo/checkout/SD_InfoPage.js';
import { SD_VerificationPage } from '@pages/saucedemo/checkout/SD_VerificationPage.js';

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
  pd_homePage: PD_HomePage;
  pd_docsPage: PD_DocsPage;

  // Saucedemo
  sd_inventoryPage: SD_InventoryPage;
  sd_loginPage: SD_LoginPage;
  sd_cartPage: SD_CartPage;
  sd_confirmationPage: SD_ConfirmationPage;
  sd_infoPage: SD_InfoPage;
  sd_verificationPage: SD_VerificationPage;
};

export const test = base.extend<PageFixtures>({
  // ---- Playwright.dev ----
  /**
   * HomePage fixture – navigates to home and waits for load before yielding.
   */
  pd_homePage: async ({ page }, use) => {
    const pd_homePage = new PD_HomePage(page);
    await pd_homePage.goto();
    await use(pd_homePage);
  },

  /**
   * DocsPage fixture – navigates to /docs/intro before yielding.
   */
  pd_docsPage: async ({ page }, use) => {
    const pd_docsPage = new PD_DocsPage(page);
    await pd_docsPage.goto();
    await use(pd_docsPage);
  },

  // ---- Saucedemo ----
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
});

// Re-export expect so tests only need one import
export { expect };