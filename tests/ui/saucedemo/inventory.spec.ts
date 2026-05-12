import { test, expect } from '../../../src/fixtures/index.js';
import * as allure from 'allure-js-commons';

/**
 * Inventory Page Tests
 * ─────────────────────────────────────────────────────────────────────────────
 * High-level behavioral tests for the Saucedemo inventory page.
 * Auth state is pre-loaded from storageState so tests start already logged in,
 * following the same pattern as the other saucedemo specs.
 */

const TOTAL_ITEMS = 6; // Saucedemo always shows 6 products

test.describe('Inventory Page', { tag: ['@ui'] }, () => {

  // ── Navigate directly — auth state is injected via playwright.config.ts ───
  test.beforeEach(async ({ page }) => {
  });

  // ── Page load & structure ──────────────────────────────────────────────────

  test('should display the inventory page with the "Products" title', async ({ inventoryPage }) => {
    await allure.step('Verify Authentication and Inventory Landing Page', async()=>{
      await inventoryPage.assertOnInventoryPage();
    });
  });

  test(`should display exactly ${TOTAL_ITEMS} inventory items`, async ({ inventoryPage }) => {
    await allure.step('Verify Max Item Displays', async()=>{
      const count = await inventoryPage.getItemCount();
      expect(count).toBe(TOTAL_ITEMS);
    });
  });

  test('should display a name, description, and price for every item', async ({ inventoryPage }) => {
    await allure.step('Verify Every Item has name, description, and price', async()=>{
      const items = await inventoryPage.getAllItems();

      for (const item of items) {
        expect(item.name.length,        `item ${item.index} missing name`).toBeGreaterThan(0);
        expect(item.description.length, `item ${item.index} missing description`).toBeGreaterThan(0);
        expect(item.price,              `item ${item.index} has invalid price`).toBeGreaterThan(0);
      }
    });
  });

  // ── Sorting ────────────────────────────────────────────────────────────────

  test('should sort items by name A → Z', async ({ inventoryPage }) => {
    await allure.step('Verify Sorting by A-Z', async()=>{
      await inventoryPage.sortBy('az');
      await inventoryPage.assertSortedAtoZ();
    });
  });

  test('should sort items by name Z → A', async ({ inventoryPage }) => {
    await allure.step('Verify Sorting by Z-A', async()=>{
      await inventoryPage.sortBy('za');
      await inventoryPage.assertSortedZtoA();
    });
  });

  test('should sort items by price low → high', async ({ inventoryPage }) => {
    await allure.step('Verify Sorting Low to High', async()=>{
      await inventoryPage.sortBy('lohi');
      await inventoryPage.assertSortedLowToHigh();
    });
  });

  test('should sort items by price high → low', async ({ inventoryPage }) => {
    await allure.step('Verify Sorting High to Low', async()=>{
      await inventoryPage.sortBy('hilo');
      await inventoryPage.assertSortedHighToLow();
    });
  });

  // ── Cart interactions ──────────────────────────────────────────────────────

  test('should add a single item to the cart and update the badge', async ({ inventoryPage }) => {
    await allure.step('Add Item to Cart and Verify Badge', async()=>{
      const [firstItem] = await inventoryPage.getAllItems();
      await inventoryPage.addItemToCart(firstItem.name);

      const count = await inventoryPage.getCartCount();
      expect(count).toBe(1);
    });
  });

  test('should add multiple items and reflect the correct cart count', async ({ inventoryPage }) => {
    await allure.step('Add Multiple Items to Cart and Verify Badge with Item Count', async()=>{
      const items = await inventoryPage.getAllItems();

      // Add first three items
      for (const item of items.slice(0, 3)) {
        await inventoryPage.addItemToCart(item.name);
      }

      const count = await inventoryPage.getCartCount();
      expect(count).toBe(3);
    });
  });

  test('should remove an item from the cart and decrement the badge', async ({ inventoryPage }) => {
    const [firstItem] = await inventoryPage.getAllItems();

    await allure.step('Add Item to Cart', async()=>{
      await inventoryPage.addItemToCart(firstItem.name);
      expect(await inventoryPage.getCartCount()).toBe(1);
    });
    

    await allure.step('Remove Item From Cart and Verify Cart Count', async()=>{
      await inventoryPage.removeItemFromCart(firstItem.name);
      expect(await inventoryPage.getCartCount()).toBe(0);
    });
  });

  // ── Navigation ─────────────────────────────────────────────────────────────

  test('should navigate to the item detail page on name click', async ({ page, inventoryPage }) => {
    await allure.step('Navigate to First Item from Name', async()=>{
      const [firstItem] = await inventoryPage.getAllItems();
      await inventoryPage.openItemDetail(firstItem.name);

      await expect(page).toHaveURL(/inventory-item\.html/);
    });
  });

  test('should navigate to the cart page when the cart icon is clicked', async ({ page, inventoryPage }) => {
    await allure.step('Navigate to Cart', async()=>{
      await inventoryPage.goToCart();
      await expect(page).toHaveURL(/cart\.html/);
    });
  });

  test('should log the user out via the burger menu', async ({ page, inventoryPage }) => {
    const BASE_URL    = 'https://www.saucedemo.com';
    await allure.step('Logout and Verify Logged Out', async()=>{
      await inventoryPage.logout();
      await expect(page).toHaveURL(BASE_URL + '/');
    });
  });

  // ── Social Media Links ─────────────────────────────────────────────────────────────
  test('should navigate to facebook on icon click', async ({ page, inventoryPage }) => {
    await allure.step('Click Facebook Link and Verify Navigation', async()=>{
      const page2Promise = page.waitForEvent('popup');
      inventoryPage.clickSocialIcon('facebook');
      const page2 = await page2Promise;
      await expect(page2.getByText('See more from Sauce Labs').first()).toBeVisible();
    });
  });

  test('should navigate to twitter on icon click', async ({ page, inventoryPage }) => {
    await allure.step('Click Twitter Link and Verify Navigation', async()=>{
      const page2Promise = page.waitForEvent('popup');
      inventoryPage.clickSocialIcon('twitter');
      const page2 = await page2Promise;
      await expect(page2.getByText('Sauce Labs helps').first()).toBeVisible();
    });
  });

  test('should navigate to indeed on icon click', async ({ page, inventoryPage }) => {
    await allure.step('Click Indeed Link and Verify Navigation', async()=>{
      const page2Promise = page.waitForEvent('popup');
      inventoryPage.clickSocialIcon('indeed');
      const page2 = await page2Promise;
      await expect(page2.getByRole('heading', { name: 'Sign in to see who you' }).first()).toBeVisible();
    });
  });
});