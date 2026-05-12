import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from '../BasePage.js';

/**
 * SD_CartPage
 * ─────────────────────────────────────────────────────────────────────────────
 * Represents the Saucedemo cart page.
 */
export class SD_CartPage extends BasePage {
  // ── Locators ────────────────────────────────────────────────────────────────
  readonly checkoutBtn: Locator;

  constructor(page: Page) {
    super(page);

    this.checkoutBtn       = page.locator('[data-test="checkout"]');
  }

  // ── Navigation ──────────────────────────────────────────────────────────────

  async goto(): Promise<void> {
    await this.page.goto('/cart.html');
    await this.waitForPageLoad();
  }

  async waitForPageLoad(): Promise<void> {
    await this.checkoutBtn.waitFor({ state: 'visible' });
  }

  // ── Actions ─────────────────────────────────────────────────────────────────


  // ── Assertions ──────────────────────────────────────────────────────────────

  async assertOnCartPage(): Promise<void> {
    await expect(this.checkoutBtn).toBeVisible();
    await expect(this.page).toHaveURL('/cart.html');
  }
}