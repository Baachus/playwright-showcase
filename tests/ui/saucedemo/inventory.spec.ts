import { test, expect } from '../../../src/fixtures/index.js';
import * as allure from 'allure-js-commons';


/**
 * UI Tests – Inventory Page
 */

const TOTAL_ITEMS = 6; // Saucedemo always shows 6 products

test.beforeEach(async()=>{
    await allure.epic('Saucedemo');
    await allure.feature('Inventory');
});

test.describe('Inventory Page', { tag: ['@ui'] }, () => {
  // ── Page load & structure ──────────────────────────────────────────────────
  test('should display the inventory page with the "Products" title', async ({ sd_inventoryPage }) => {
    await allure.story('Products Title');
    await allure.label('severity', 'normal');
    
    await allure.step('Verify Authentication and Inventory Landing Page', async()=>{
        await sd_inventoryPage.assertOnInventoryPage();
    });
  });

  test(`should display exactly ${TOTAL_ITEMS} inventory items`, async ({ sd_inventoryPage }) => {
    await allure.story('Products Count');
    await allure.label('severity', 'normal');
    
    await allure.step('Verify Max Item Displays', async()=>{
      const count = await sd_inventoryPage.getItemCount();
      expect(count).toBe(TOTAL_ITEMS);
    });
  });

  test('should display a name, description, and price for every item', async ({ sd_inventoryPage }) => {
    await allure.story('Product Details');
    await allure.label('severity', 'normal');
    
    await allure.step('Verify Every Item has name, description, and price', async()=>{
      const items = await sd_inventoryPage.getAllItems();

      for (const item of items) {
        expect(item.name.length,        `item ${item.index} missing name`).toBeGreaterThan(0);
        expect(item.description.length, `item ${item.index} missing description`).toBeGreaterThan(0);
        expect(item.price,              `item ${item.index} has invalid price`).toBeGreaterThan(0);
      }
    });
  });

  // ── Sorting ────────────────────────────────────────────────────────────────

  test('should sort items by name A → Z', async ({ sd_inventoryPage }) => {
    await allure.story('Sorting A-Z');
    await allure.label('severity', 'normal');
    
    await allure.step('Verify Sorting by A-Z', async()=>{
      await sd_inventoryPage.sortBy('az');
      await sd_inventoryPage.assertSortedAtoZ();
    });
  });

  test('should sort items by name Z → A', async ({ sd_inventoryPage }) => {
    await allure.story('Sorting Z-A');
    await allure.label('severity', 'normal');

    await allure.step('Verify Sorting by Z-A', async()=>{
      await sd_inventoryPage.sortBy('za');
      await sd_inventoryPage.assertSortedZtoA();
    });
  });

  test('should sort items by price low → high', async ({ sd_inventoryPage }) => {
    await allure.story('Sorting low-high');
    await allure.label('severity', 'normal');
    
    await allure.step('Verify Sorting Low to High', async()=>{
      await sd_inventoryPage.sortBy('lohi');
      await sd_inventoryPage.assertSortedLowToHigh();
    });
  });

  test('should sort items by price high → low', async ({ sd_inventoryPage }) => {
    await allure.story('Sorting high-low');
    await allure.label('severity', 'normal');
    
    await allure.step('Verify Sorting High to Low', async()=>{
      await sd_inventoryPage.sortBy('hilo');
      await sd_inventoryPage.assertSortedHighToLow();
    });
  });

  // ── Cart interactions ──────────────────────────────────────────────────────

  test('should add a single item to the cart and update the badge', async ({ sd_inventoryPage }) => {
    await allure.story('Single Item Cart');
    await allure.label('severity', 'normal');

    await allure.step('Add Item to Cart and Verify Badge', async()=>{
      const [firstItem] = await sd_inventoryPage.getAllItems();
      await sd_inventoryPage.addItemToCart(firstItem.name);

      const count = await sd_inventoryPage.getCartCount();
      expect(count).toBe(1);
    });
  });

  test('should add multiple items and reflect the correct cart count', async ({ sd_inventoryPage }) => 
  {
    await allure.story('Multiple Item Cart');
    await allure.label('severity', 'normal');

    await allure.step('Add Multiple Items to Cart and Verify Badge with Item Count', async()=>{
      const items = await sd_inventoryPage.getAllItems();

      // Add first three items
      for (const item of items.slice(0, 3)) {
        await sd_inventoryPage.addItemToCart(item.name);
      }

      const count = await sd_inventoryPage.getCartCount();
      expect(count).toBe(3);
    });
  });

  test('should remove an item from the cart and decrement the badge', async ({ sd_inventoryPage }) => 
  {
    await allure.story('Remove Item From Cart');
    await allure.label('severity', 'normal');
    const [firstItem] = await sd_inventoryPage.getAllItems();

    await allure.step('Add Item to Cart', async()=>{
      await sd_inventoryPage.addItemToCart(firstItem.name);
      expect(await sd_inventoryPage.getCartCount()).toBe(1);
    });
    
    await allure.step('Remove Item From Cart and Verify Cart Count', async()=>{
      await sd_inventoryPage.removeItemFromCart(firstItem.name);
      expect(await sd_inventoryPage.getCartCount()).toBe(0);
    });
  });

  // ── Navigation ─────────────────────────────────────────────────────────────

  test('should navigate to the item detail page on name click', async ({ page, sd_inventoryPage }) => 
  {
    await allure.story('Name Navigation');
    await allure.label('severity', 'normal');

    await allure.step('Navigate to First Item from Name', async()=>{
      const [firstItem] = await sd_inventoryPage.getAllItems();
      await sd_inventoryPage.openItemDetail(firstItem.name);

      await expect(page).toHaveURL(/inventory-item\.html/);
    });
  });

  test('should navigate to the cart page when the cart icon is clicked', async ({ page, sd_inventoryPage }) => 
  {
    await allure.story('Cart Navigation');
    await allure.label('severity', 'normal');

    await allure.step('Navigate to Cart', async()=>{
      await sd_inventoryPage.goToCart();
      await expect(page).toHaveURL(/cart\.html/);
    });
  });

  test('should log the user out via the burger menu', async ({ page, sd_inventoryPage }) => 
  {
    await allure.story('Log Out');
    await allure.label('severity', 'normal');
    const BASE_URL    = 'https://www.saucedemo.com';

    await allure.step('Logout and Verify Logged Out', async()=>{
      await sd_inventoryPage.logout();
      await expect(page).toHaveURL(BASE_URL + '/');
    });
  });

  // ── Social Media Links ─────────────────────────────────────────────────────────────
  test('should navigate to facebook on icon click', async ({ page, sd_inventoryPage }) => 
  {
    await allure.story('Facebook Icon');
    await allure.label('severity', 'minor');

    await allure.step('Click Facebook Link and Verify Navigation', async()=>{
      const page2Promise = page.waitForEvent('popup');
      sd_inventoryPage.clickSocialIcon('facebook');
      const page2 = await page2Promise;
      await expect(page2.getByText('See more from Sauce Labs').first()).toBeVisible();
    });
  });

  test('should navigate to twitter on icon click', async ({ page, sd_inventoryPage }) => 
  {
    await allure.story('Twitter Icon');
    await allure.label('severity', 'minor');

    await allure.step('Click Twitter Link and Verify Navigation', async()=>{
      const page2Promise = page.waitForEvent('popup');
      sd_inventoryPage.clickSocialIcon('twitter');
      const page2 = await page2Promise;
      await expect(page2.getByText('Sauce Labs helps').first()).toBeVisible();
    });
  });

  test('should navigate to indeed on icon click', async ({ page, sd_inventoryPage }) => 
  {
    await allure.story('Indeed Icon');
    await allure.label('severity', 'minor');

    await allure.step('Click Indeed Link and Verify Navigation', async()=>{
      const page2Promise = page.waitForEvent('popup');
      sd_inventoryPage.clickSocialIcon('indeed');
      const page2 = await page2Promise;
      await expect(page2.getByRole('heading', { name: 'Sign in to see who you' }).first()).toBeVisible();
    });
  });
});

