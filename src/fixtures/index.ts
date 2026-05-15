import { test as base, expect } from '@playwright/test';
// Playwright.dev - Pages
import { PD_HomePage } from '../pages/playwrightdev/PD_HomePage.js';
import { PD_DocsPage } from '../pages/playwrightdev/PD_DocsPage.js';
// Playwright.dev - Components
import { PD_NavbarComponent } from '../components/playwrightdev/PD_NavbarComponent.js';
import { PD_SearchComponent } from '../components/playwrightdev/PD_SearchComponent.js';
import { PD_CodeBlockComponent } from '../components/playwrightdev/PD_CodeBlockComponent.js';
import { PD_LanguageSelectorComponent } from '../components/playwrightdev/PD_LanguageSelectorComponent.js';
import { PD_FooterComponent } from '../components/playwrightdev/PD_FooterComponent.js';
// Saucedemo
import { SD_LoginPage } from '../pages/saucedemo/SD_LoginPage.js';
import { SD_InventoryPage } from '../pages/saucedemo/SD_InventoryPage.js';
import { SD_CartPage } from '@pages/saucedemo/SD_CartPage.js';
import { SD_ConfirmationPage } from '@pages/saucedemo/checkout/SD_ConfirmationPage.js';
import { SD_InfoPage } from '@pages/saucedemo/checkout/SD_InfoPage.js';
import { SD_VerificationPage } from '@pages/saucedemo/checkout/SD_VerificationPage.js';

/**
 * Custom Fixtures
 * ---------------------------------------------------------------------------
 * Extends Playwright's base `test` with pre-instantiated Page Object Models
 * AND Component Object Models.
 * Tests import `{ test, expect }` from this file instead of `@playwright/test`.
 *
 * Benefits:
 *  - No `new HomePage(page)` boilerplate in every test
 *  - Each fixture is scoped to the test -- fully isolated
 *  - Easy to add new pages/components without touching existing tests
 */

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

  // Saucedemo
  sd_inventoryPage: SD_InventoryPage;
  sd_loginPage: SD_LoginPage;
  sd_cartPage: SD_CartPage;
  sd_confirmationPage: SD_ConfirmationPage;
  sd_infoPage: SD_InfoPage;
  sd_verificationPage: SD_VerificationPage;
};

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
