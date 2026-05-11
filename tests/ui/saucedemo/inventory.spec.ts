import { test, expect } from '@playwright/test';
import { InventoryPage } from '../../../src/pages/index.js';

/**
 * Inventory Page Tests
 * ─────────────────────────────────────────────────────────────────────────────
 * High-level behavioral tests for the Saucedemo inventory page.
 * Auth state is pre-loaded from storageState so tests start already logged in,
 * following the same pattern as the other saucedemo specs.
 */

const BASE_URL    = 'https://www.saucedemo.com';
const TOTAL_ITEMS = 6; // Saucedemo always shows 6 products

test.describe('Inventory Page', () => {

  let inventoryPage: InventoryPage;

  // ── Navigate directly — auth state is injected via playwright.config.ts ───
  test.beforeEach(async ({ page }) => {
    inventoryPage = new InventoryPage(page);
    await inventoryPage.goto();
  });

  // ── Page load & structure ──────────────────────────────────────────────────

  test('should display the inventory page with the "Products" title', async () => {
    await inventoryPage.assertOnInventoryPage();
  });

  test(`should display exactly ${TOTAL_ITEMS} inventory items`, async () => {
    const count = await inventoryPage.getItemCount();
    expect(count).toBe(TOTAL_ITEMS);
  });

  test('should display a name, description, and price for every item', async () => {
    const items = await inventoryPage.getAllItems();

    for (const item of items) {
      expect(item.name.length,        `item ${item.index} missing name`).toBeGreaterThan(0);
      expect(item.description.length, `item ${item.index} missing description`).toBeGreaterThan(0);
      expect(item.price,              `item ${item.index} has invalid price`).toBeGreaterThan(0);
    }
  });

  // ── Sorting ────────────────────────────────────────────────────────────────

  test('should sort items by name A → Z', async () => {
    await inventoryPage.sortBy('az');
    await inventoryPage.assertSortedAtoZ();
  });

  test('should sort items by name Z → A', async () => {
    await inventoryPage.sortBy('za');
    await inventoryPage.assertSortedZtoA();
  });

  test('should sort items by price low → high', async () => {
    await inventoryPage.sortBy('lohi');
    await inventoryPage.assertSortedLowToHigh();
  });

  test('should sort items by price high → low', async () => {
    await inventoryPage.sortBy('hilo');
    await inventoryPage.assertSortedHighToLow();
  });

  // ── Cart interactions ──────────────────────────────────────────────────────

  test('should add a single item to the cart and update the badge', async () => {
    const [firstItem] = await inventoryPage.getAllItems();
    await inventoryPage.addItemToCart(firstItem.name);

    const count = await inventoryPage.getCartCount();
    expect(count).toBe(1);
  });

  test('should add multiple items and reflect the correct cart count', async () => {
    const items = await inventoryPage.getAllItems();

    // Add first three items
    for (const item of items.slice(0, 3)) {
      await inventoryPage.addItemToCart(item.name);
    }

    const count = await inventoryPage.getCartCount();
    expect(count).toBe(3);
  });

  test('should remove an item from the cart and decrement the badge', async () => {
    const [firstItem] = await inventoryPage.getAllItems();

    await inventoryPage.addItemToCart(firstItem.name);
    expect(await inventoryPage.getCartCount()).toBe(1);

    await inventoryPage.removeItemFromCart(firstItem.name);
    expect(await inventoryPage.getCartCount()).toBe(0);
  });

  // ── Navigation ─────────────────────────────────────────────────────────────

  test('should navigate to the item detail page on name click', async ({ page }) => {
    const [firstItem] = await inventoryPage.getAllItems();
    await inventoryPage.openItemDetail(firstItem.name);

    await expect(page).toHaveURL(/inventory-item\.html/);
  });

  test('should navigate to the cart page when the cart icon is clicked', async ({ page }) => {
    await inventoryPage.goToCart();
    await expect(page).toHaveURL(/cart\.html/);
  });

  test('should log the user out via the burger menu', async ({ page }) => {
    await inventoryPage.logout();
    await expect(page).toHaveURL(BASE_URL + '/');
  });
});