import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from '../BasePage.js';
import { InventoryItem, SD_InventoryItemComponent } from '../../components/saucedemo/SD_InventoryItemComponent.js';

export type { InventoryItem };

/**
 * SortOption
 * ─────────────────────────────────────────────────────────────────────────────
 * Mirrors the sort-dropdown values on the Saucedemo inventory page.
 */
export type SortOption =
  | 'az'   // Name (A to Z)
  | 'za'   // Name (Z to A)
  | 'lohi' // Price (low to high)
  | 'hilo' // Price (high to low)
  ;

/**
 * SD_InventoryPage
 * ─────────────────────────────────────────────────────────────────────────────
 * Page Object for https://www.saucedemo.com/inventory.html
 *
 * Extends BasePage to reuse shared navigation helpers, screenshot, and wait
 * utilities, following the same pattern used in the playwrightdev page objects.
 */
export class SD_InventoryPage extends BasePage {

  // ── URL ─────────────────────────────────────────────────────────────────────
  private static readonly PATH = '/inventory.html';

  // ── Locators ────────────────────────────────────────────────────────────────
  /** The primary container that confirms we are on the inventory page. */
  readonly inventoryContainer: Locator;

  /** Every inventory card on the page. */
  readonly inventoryItems: Locator;

  /** The page-level title label ("Products"). */
  readonly pageTitle: Locator;

  /** The sort dropdown. */
  readonly sortDropdown: Locator;

  /** The shopping cart icon / badge wrapper. */
  readonly cartIcon: Locator;

  /** The cart item-count badge (only present when cart is non-empty). */
  readonly cartBadge: Locator;

  /** The burger / hamburger menu button. */
  readonly menuButton: Locator;

  /** The social media links */
  readonly facebookIcon: Locator;
  readonly twitterIcon: Locator;
  readonly indeedIcon: Locator;

  // ── Constructor ─────────────────────────────────────────────────────────────
  constructor(page: Page) {
    super(page);

    this.inventoryContainer = page.locator('[data-test="inventory-container"]');
    this.inventoryItems     = page.locator('.inventory_item');
    this.pageTitle          = page.locator('.title');
    this.sortDropdown       = page.locator('[data-test="product-sort-container"]');
    this.cartIcon           = page.locator('.shopping_cart_link');
    this.cartBadge          = page.locator('.shopping_cart_badge');
    this.menuButton         = page.locator('#react-burger-menu-btn');
    this.facebookIcon       = page.locator('[data-test="social-facebook"]');
    this.twitterIcon        = page.locator('[data-test="social-twitter"]');
    this.indeedIcon         = page.locator('[data-test="social-linkedin"]');
  }

  // ── BasePage implementation ──────────────────────────────────────────────────
  async goto(): Promise<void> {
    await this.page.goto(`https://www.saucedemo.com${SD_InventoryPage.PATH}`);
    await this.waitForPageLoad();
  }

  async waitForPageLoad(): Promise<void> {
    await this.inventoryContainer.waitFor({ state: 'visible' });
  }

  // ── Item helpers ─────────────────────────────────────────────────────────────
  /**
   * Return the number of inventory cards currently displayed.
   */
  async getItemCount(): Promise<number> {
    return this.inventoryItems.count();
  }

  /**
   * Return an {@link SD_InventoryItemComponent} for the card at position `index`.
   */
  getItemComponent(index: number): SD_InventoryItemComponent {
    return new SD_InventoryItemComponent(this.page, this.inventoryItems.nth(index), index);
  }

  /**
   * Collect name, description, price, priceText, and positional index for every item.
   */
  async getAllItems(): Promise<InventoryItem[]> {
    const count = await this.getItemCount();
    const items: InventoryItem[] = [];

    for (let i = 0; i < count; i++) {
      items.push(await this.getItemComponent(i).getData());
    }

    return items;
  }

  /**
   * Return the names of all displayed items in DOM order.
   */
  async getItemNames(): Promise<string[]> {
    return this.inventoryItems.locator('.inventory_item_name').allInnerTexts();
  }

  /**
   * Return the prices of all displayed items in DOM order.
   */
  async getItemPrices(): Promise<number[]> {
    const rawPrices = await this.inventoryItems
      .locator('.inventory_item_price')
      .allInnerTexts();
    return rawPrices.map(p => parseFloat(p.replace('$', '')));
  }

  /**
   * Find a single item card by its exact display name.
   */
  getItemByName(name: string): Locator {
    return this.inventoryItems.filter({ hasText: name });
  }

  // ── Cart helpers ─────────────────────────────────────────────────────────────
  /**
   * Click the "Add to cart" button for a named item.
   */
  async addItemToCart(itemName: string): Promise<void> {
    const card      = this.getItemByName(itemName);
    const addButton = card.locator('button[data-test^="add-to-cart"]');
    await addButton.click();
  }

  /**
   * Click the "Remove" button for a named item (already in cart).
   */
  async removeItemFromCart(itemName: string): Promise<void> {
    const card         = this.getItemByName(itemName);
    const removeButton = card.locator('button[data-test^="remove"]');
    await removeButton.click();
  }

  /**
   * Return the numeric value shown on the cart badge, or 0 when the badge
   * is absent (empty cart).
   */
  async getCartCount(): Promise<number> {
    const visible = await this.cartBadge.isVisible();
    if (!visible) return 0;
    const text = await this.cartBadge.innerText();
    return parseInt(text, 10);
  }

  /**
   * Navigate to the cart page.
   */
  async goToCart(): Promise<void> {
    await this.cartIcon.click();
  }

  /**
   * Clicks social media icons depending on which is required
   */
  async clickSocialIcon(icon: 'facebook' | 'twitter' | 'indeed'): Promise<void> {
  const map = {
    facebook: this.facebookIcon,
    twitter: this.twitterIcon,
    indeed: this.indeedIcon,
  };
  await map[icon].click();
}

  // ── Sort helpers ─────────────────────────────────────────────────────────────
  /**
   * Select a sort order from the dropdown.
   *
   * @example
   * await InventoryPage.sortBy('lohi');
   */
  async sortBy(option: SortOption): Promise<void> {
    await this.sortDropdown.selectOption(option);
  }

  // ── Item detail navigation ───────────────────────────────────────────────────
  /**
   * Click an item's name link to navigate to its detail page.
   */
  async openItemDetail(itemName: string): Promise<void> {
    const card     = this.getItemByName(itemName);
    const nameLink = card.locator('.inventory_item_name');
    await nameLink.click();
  }

  // ── Menu helpers ─────────────────────────────────────────────────────────────
  /**
   * Open the side-nav burger menu.
   */
  async openMenu(): Promise<void> {
    await this.menuButton.click();
    await this.page.locator('.bm-menu-wrap').waitFor({ state: 'visible' });
  }

  /**
   * Click "Logout" from the burger menu and wait for the login page.
   */
  async logout(): Promise<void> {
    await this.openMenu();
    await this.page.locator('#logout_sidebar_link').click();
    await this.page.waitForURL('**/');
  }

  // ── Assertions ───────────────────────────────────────────────────────────────
  /**
   * Assert the page title label reads "Products".
   */
  async assertOnInventoryPage(): Promise<void> {
    await expect(this.pageTitle).toHaveText('Products');
  }

  /**
   * Assert all item prices are sorted low → high.
   */
  async assertSortedLowToHigh(): Promise<void> {
    const prices = await this.getItemPrices();
    const sorted = [...prices].sort((a, b) => a - b);
    expect(prices).toEqual(sorted);
  }

  /**
   * Assert all item prices are sorted high → low.
   */
  async assertSortedHighToLow(): Promise<void> {
    const prices = await this.getItemPrices();
    const sorted = [...prices].sort((a, b) => b - a);
    expect(prices).toEqual(sorted);
  }

  /**
   * Assert all item names are sorted A → Z.
   */
  async assertSortedAtoZ(): Promise<void> {
    const names  = await this.getItemNames();
    const sorted = [...names].sort((a, b) => a.localeCompare(b));
    expect(names).toEqual(sorted);
  }

  /**
   * Assert all item names are sorted Z → A.
   */
  async assertSortedZtoA(): Promise<void> {
    const names  = await this.getItemNames();
    const sorted = [...names].sort((a, b) => b.localeCompare(a));
    expect(names).toEqual(sorted);
  }
}
