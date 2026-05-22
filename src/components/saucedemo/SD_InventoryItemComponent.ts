import { Page, Locator, expect } from '@playwright/test';
import { BaseComponent } from '../BaseComponent.js';

/**
 * InventoryItem
 * ---------------------------------------------------------------------------
 * Shared data snapshot for a single inventory item card.
 * Returned by SD_InventoryItemComponent.getData and used across the
 * inventory, cart, and checkout pages.
 */
export interface InventoryItem {
  name: string;
  description: string;
  price: number;
  /** Raw price string as displayed in the UI, e.g. "$29.99". */
  priceText: string;
  /** Quantity value - present on cart / verification pages, absent on inventory. */
  quantity?: number;
  /** Zero-based position of this card in the list. */
  index: number;
}

/**
 * SD_InventoryItemComponent
 * ---------------------------------------------------------------------------
 * Component Object Model for a single inventory item card.
 *
 * The same card markup appears on three pages:
 *   - Inventory  (`/inventory.html`)         has Add-to-cart; no quantity
 *   - Cart       (`/cart.html`)              has Remove button and quantity
 *   - Verification (`/checkout-step-two.html`) has Remove button and quantity
 *
 * Extends BaseComponent so every child locator is automatically scoped to
 * the card's root element regardless of which page it appears on.
 */
export class SD_InventoryItemComponent extends BaseComponent {

  /** Zero-based position of this card in the parent list. */
  readonly index: number;

  // Child locators
  readonly name: Locator;
  readonly description: Locator;
  readonly priceLabel: Locator;

  /**
   * Quantity badge - only rendered on cart / verification pages.
   * Call getQuantity for a safe, optional read.
   */
  readonly quantity: Locator;

  /**
   * "Remove" button - present on inventory page (after adding to cart)
   * and on the cart / verification pages.
   */
  readonly removeButton: Locator;

  /**
   * The product image element for this inventory card.
   * problem_user sees a dog picture here instead of the real product image.
   */
  readonly image: Locator;

  // Constructor
  constructor(page: Page, root: Locator, index: number) {
    super(page, root);
    this.index        = index;
    this.name         = root.locator('.inventory_item_name');
    this.description  = root.locator('.inventory_item_desc');
    this.priceLabel   = root.locator('.inventory_item_price');
    this.quantity     = root.locator('.cart_quantity');
    this.removeButton = root.locator('button[data-test^="remove"]');
    this.image        = root.locator('img');
  }

  // Data helpers
  /** Read the item name text. */
  async getName(): Promise<string> {
    return this.name.innerText();
  }

  /** Read the item description text. */
  async getDescription(): Promise<string> {
    return this.description.innerText();
  }

  /** Read the raw price string, e.g. "$29.99". */
  async getPriceText(): Promise<string> {
    return this.priceLabel.innerText();
  }

  /** Parse the price to a number. */
  async getPrice(): Promise<number> {
    const text = await this.getPriceText();
    return parseFloat(text.replace('$', ''));
  }

  /**
   * Read the quantity value if the element is present, otherwise undefined.
   * Safe to call on any page - returns undefined when the badge is absent.
   */
  async getQuantity(): Promise<number | undefined> {
    if (!(await this.quantity.isVisible())) return undefined;
    const text = await this.quantity.innerText();
    return parseInt(text, 10);
  }

  /**
   * Return the src attribute of the product image, or an empty string if
   * the attribute is absent.
   * For problem_user all six items return the same dog-picture URL instead of
   * the real product image.
   */
  async getImageSrc(): Promise<string> {
    return (await this.image.getAttribute('src')) ?? '';
  }

  /**
   * Snapshot all readable fields into a plain InventoryItem record.
   */
  async getData(): Promise<InventoryItem> {
    const priceText = await this.getPriceText();
    const price     = parseFloat(priceText.replace('$', ''));
    const quantity  = await this.getQuantity();

    return {
      name:        await this.getName(),
      description: await this.getDescription(),
      price,
      priceText,
      quantity,
      index:       this.index,
    };
  }

  // Actions
  /**
   * Click the Remove button.
   * Only valid when the button is rendered (cart / verification pages, or
   * inventory page after the item has been added to cart).
   */
  async remove(): Promise<void> {
    await this.removeButton.click();
  }

  // Assertions
  /** Assert the displayed item name matches the expected string. */
  async assertName(expected: string): Promise<void> {
    await expect(this.name).toHaveText(expected);
  }

  /** Assert the displayed price matches the expected string (e.g. "$9.99"). */
  async assertPrice(expected: string): Promise<void> {
    await expect(this.priceLabel).toHaveText(expected);
  }

  /** Assert the quantity badge shows the expected value. */
  async assertQuantity(expected: number): Promise<void> {
    await expect(this.quantity).toHaveText(String(expected));
  }
}
