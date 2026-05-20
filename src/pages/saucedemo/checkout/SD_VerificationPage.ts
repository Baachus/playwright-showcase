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
  readonly cancelBtn: Locator;
  readonly paymentInformationLabel: Locator;
  readonly paymentInformation: Locator;
  readonly shippingInformationLabel: Locator;
  readonly shippingInformation: Locator;
  readonly priceLabel: Locator;
  readonly itemTotal: Locator;
  readonly tax: Locator;
  readonly total: Locator;
  
  // Items
  readonly inventoryItem: Locator;

  constructor(page: Page) {
    super(page);

    this.checkoutTitle  = page.locator('[data-test="title"]');
    this.finishBtn = page.locator('[data-test="finish"]');
    this.cancelBtn = page.locator('[data-test="cancel"]');
    this.paymentInformationLabel = page.locator('[data-test="payment-info-label"]');
    this.paymentInformation = page.locator('[data-test="payment-info-value"]');
    this.shippingInformationLabel = page.locator('[data-test="shipping-info-label"]');
    this.shippingInformation = page.locator('[data-test="shipping-info-value"]');
    this.priceLabel = page.locator('[data-test="total-info-label"]')
    this.itemTotal = page.locator('[data-test="subtotal-label"]');
    this.tax = page.locator('[data-test="tax-label"]');
    this.total = page.locator('[data-test="total-label"]');

    // Items
    this.inventoryItem = page.locator('[data-test="inventory-item"]');
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
  async getInventoryInformation(count: number): Promise<Locator> {
    return await this.inventoryItem.nth(count);
  }

  // ── Assertions ──────────────────────────────────────────────────────────────
  async assertOnLoginPage(): Promise<void> {
    await expect(this.checkoutTitle).toBeVisible();
    await expect(this.page).toHaveURL('/checkout-step-two.html');
  }
}