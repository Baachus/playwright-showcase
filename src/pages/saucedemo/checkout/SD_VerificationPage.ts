import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from '../../BasePage.js';

/**
 * SD_VerificationPage
 * ─────────────────────────────────────────────────────────────────────────────
 * Represents the Saucedemo cart page.
 */
export class SD_VerificationPage extends BasePage {
  // ── Locators ────────────────────────────────────────────────────────────────
  readonly checkoutTitle: Locator;
  readonly finishBtn: Locator;

  constructor(page: Page) {
    super(page);

    this.checkoutTitle  = page.locator('[data-test="title"]');
    this.finishBtn = page.locator('[data-test="finish"]');
  }

  // ── Navigation ──────────────────────────────────────────────────────────────

  async goto(): Promise<void> {
    await this.page.goto('/checkout-step-two.html');
    await this.waitForPageLoad();
  }

  async waitForPageLoad(): Promise<void> {
    await this.checkoutTitle.waitFor({ state: 'visible' });
  }

  // ── Actions ─────────────────────────────────────────────────────────────────


  // ── Assertions ──────────────────────────────────────────────────────────────

  async assertOnLoginPage(): Promise<void> {
    await expect(this.checkoutTitle).toBeVisible();
    await expect(this.page).toHaveURL('/checkout-step-two.html');
  }
}