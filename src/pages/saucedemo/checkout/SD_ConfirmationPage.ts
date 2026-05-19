import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from '../../BasePage.js';

/**
 * SD_ConfirmationPage
 * ─────────────────────────────────────────────────────────────────────────────
 * Represents the Saucedemo cart page.
 */
export class SD_ConfirmationPage extends BasePage {
  // ── Locators ────────────────────────────────────────────────────────────────
  readonly thankYouLabel: Locator;
  readonly backHomeBtn: Locator;

  constructor(page: Page) {
    super(page);

    this.thankYouLabel  = page.locator('[data-test="complete-header"]');
    this.backHomeBtn = page.locator('[data-test="back-to-products"]');
  }

  // ── Navigation ──────────────────────────────────────────────────────────────
  async goto(): Promise<void> {
    await this.page.goto('/checkout-complete.html');
    await this.waitForPageLoad();
  }

  async waitForPageLoad(): Promise<void> {
    await this.thankYouLabel.waitFor({ state: 'visible' });
  }

  // ── Actions ─────────────────────────────────────────────────────────────────


  // ── Assertions ──────────────────────────────────────────────────────────────
  async assertOnLoginPage(): Promise<void> {
    await expect(this.thankYouLabel).toBeVisible();
    await expect(this.page).toHaveURL('/checkout-complete.html');
  }
}