import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from '../BasePage.js';
import { SD_InventoryItemComponent } from '../../components/saucedemo/SD_InventoryItemComponent.js';

/**
 * SD_CartPage
 * ─────────────────────────────────────────────────────────────────────────────
 * Represents the Saucedemo cart page.
 */
export class SD_CartPage extends BasePage {
  // ── Locators ────────────────────────────────────────────────────────────────
  readonly checkoutBtn: Locator;
  readonly continueShoppingBtn: Locator;

  // Item in Cart
  readonly inventoryItem: Locator;

  constructor(page: Page) {
    super(page);

    this.checkoutBtn  = page.locator('[data-test="checkout"]');
    this.continueShoppingBtn = page.locator('[data-test="continue-shopping"]');

    // Item in Cart
    this.inventoryItem = page.locator('[data-test="inventory-item"]');
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
  /**
   * Return the raw Locator for a cart item card at the given index.
   */
  async getInventoryInformation(index: number): Promise<Locator> {
    return this.inventoryItem.nth(index);
  }

  /**
   * Return an {@link SD_InventoryItemComponent} for the card at position `index`.
   */
  getItemComponent(index: number): SD_InventoryItemComponent {
    return new SD_InventoryItemComponent(this.page, this.inventoryItem.nth(index), index);
  }

  // ── Assertions ──────────────────────────────────────────────────────────────
  async assertOnCartPage(): Promise<void> {
    await expect(this.checkoutBtn).toBeVisible();
    await expect(this.page).toHaveURL('/cart.html');
  }
}
