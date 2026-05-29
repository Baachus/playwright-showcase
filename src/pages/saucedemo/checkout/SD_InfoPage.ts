import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from '../../BasePage.js';

/**
 * SD_InfoPage
 * ─────────────────────────────────────────────────────────────────────────────
 * Represents the Saucedemo cart page.
 */
export class SD_InfoPage extends BasePage {
  // ── Locators ────────────────────────────────────────────────────────────────
  readonly firstName: Locator;
  readonly lastName: Locator;
  readonly zipCode: Locator;
  readonly checkoutBtn: Locator;
  readonly cancelBtn: Locator;
  readonly checkoutTitle: Locator;

  // Errors
  readonly errorAlert: Locator;
  readonly errorIcon: Locator;

  constructor(page: Page) {
    super(page);

    this.firstName  = page.locator('[data-test="firstName"]');
    this.lastName = page.locator('[data-test="lastName"]');
    this.zipCode  = page.locator('[data-test="postalCode"]');
    this.checkoutBtn = page.locator('[data-test="continue"]');
    this.cancelBtn = page.locator('[data-test="cancel"]');
    this.checkoutTitle = page.locator('[data-test="title"]');

    // Errors
    this.errorAlert = page.locator('[data-test="error"]');
    this.errorIcon = page.locator('svg');
  }

  // ── Navigation ──────────────────────────────────────────────────────────────
  async goto(): Promise<void> {
    await this.page.goto('/checkout-step-one.html');
    await this.waitForPageLoad();
  }

  async waitForPageLoad(): Promise<void> {
    await this.firstName.waitFor({ state: 'visible' });
  }

  // ── Actions ─────────────────────────────────────────────────────────────────


  // ── Assertions ──────────────────────────────────────────────────────────────
  async assertOnLoginPage(): Promise<void> {
    await expect(this.firstName).toBeVisible();
    await expect(this.page).toHaveURL('/checkout-step-one.html');
  }
}