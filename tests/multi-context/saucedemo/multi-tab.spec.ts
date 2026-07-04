import { test, expect, ensureSaucedemoInventory } from '../../../src/fixtures/index.js';
import { SD_InventoryPage } from '../../../src/pages/saucedemo/SD_InventoryPage.js';
import * as allure from 'allure-js-commons';

/**
 * Multi-Tab Tests -- Saucedemo
 * ---------------------------------------------------------------------------
 * Demonstrates tab-level isolation and session sharing.
 *
 * Key concept: Two pages opened in the SAME BrowserContext share cookies and
 * localStorage.  Any cart changes made in Tab 1 are immediately visible in
 * Tab 2 after a navigation or reload -- because both tabs operate on the same
 * logged-in session.
 *
 * Fixtures used:
 *   page   -- the primary tab (default, pre-loaded to /inventory.html via storageState)
 *   sd_tab2 -- a second tab opened in the same context, also navigated to /inventory.html
 */
test.beforeEach(async ({ page }) => {
  await allure.epic('Saucedemo');
  await allure.feature('Multi-Tab');

  // The default `page` fixture inherits the project-level storageState
  // (cookies / localStorage), but Playwright does NOT auto-navigate -- the
  // tab starts on `about:blank`.  Multi-tab tests need Tab 1 to actually be
  // on the inventory page so that POM helpers (cart buttons, badge, menu) work.
  await ensureSaucedemoInventory(page, 'standard_user');
  const inventoryPage = new SD_InventoryPage(page);
  await inventoryPage.waitForPageLoad();
});

test.describe('Multi-Tab -- Shared Session', { tag: ['@multi-tab', '@multi-context'] }, () => {

  test('both tabs should be on the inventory page under the same session', async ({ page, sd_tab2 }) => {
    await allure.allureId('CTX-TAB-001');
    await allure.story('Session Sharing');
    await allure.label('severity', 'critical');

    await allure.step('Assert Tab 1 is on the inventory page', async () => {
      await expect(page).toHaveURL(/inventory/);
    });

    await allure.step('Assert Tab 2 is on the inventory page', async () => {
      await expect(sd_tab2).toHaveURL(/inventory/);
    });

    await allure.step('Assert both tabs share the same origin', async () => {
      const url1 = new URL(page.url());
      const url2 = new URL(sd_tab2.url());
      expect(url1.origin).toBe(url2.origin);
    });
  });

  test('cart item added in Tab 1 is visible in Tab 2 after reload', async ({ page, sd_tab2 }) => {
    await allure.allureId('CTX-TAB-002');
    await allure.story('Shared Cart State');
    await allure.label('severity', 'critical');

    const tab1Inventory = new SD_InventoryPage(page);
    const tab2Inventory = new SD_InventoryPage(sd_tab2);

    await allure.step('Tab 1: add Sauce Labs Backpack to cart', async () => {
      await tab1Inventory.addItemToCart('Sauce Labs Backpack');
      const count = await tab1Inventory.getCartCount();
      expect(count).toBe(1);
    });

    await allure.step('Tab 2: reload the page', async () => {
      await sd_tab2.reload();
      await tab2Inventory.waitForPageLoad();
    });

    await allure.step('Tab 2: cart badge should reflect Tab 1 addition', async () => {
      const count = await tab2Inventory.getCartCount();
      expect(count).toBe(1);
    });
  });

  test('cart item removed in Tab 2 is gone in Tab 1 after reload', async ({ page, sd_tab2 }) => {
    await allure.allureId('CTX-TAB-003');
    await allure.story('Cart Removal Shared Across Tabs');
    await allure.label('severity', 'normal');

    const tab1Inventory = new SD_InventoryPage(page);
    const tab2Inventory = new SD_InventoryPage(sd_tab2);

    await allure.step('Tab 1: add two items', async () => {
      await tab1Inventory.addItemToCart('Sauce Labs Backpack');
      await tab1Inventory.addItemToCart('Sauce Labs Bike Light');
      await expect.poll(() => tab1Inventory.getCartCount()).toBe(2);
    });

    await allure.step('Tab 2: reload and remove one item', async () => {
      await sd_tab2.reload();
      await tab2Inventory.waitForPageLoad();
      await tab2Inventory.removeItemFromCart('Sauce Labs Backpack');
      await expect.poll(() => tab2Inventory.getCartCount()).toBe(1);
    });

    await allure.step('Tab 1: reload and verify one item remains', async () => {
      await page.reload();
      await tab1Inventory.waitForPageLoad();
      const count = await tab1Inventory.getCartCount();
      expect(count).toBe(1);
    });
  });

  test('navigation in Tab 2 does not affect the URL of Tab 1', async ({ page, sd_tab2 }) => {
    await allure.allureId('CTX-TAB-004');
    await allure.story('Tab Navigation Independence');
    await allure.label('severity', 'normal');

    const tab1UrlBefore = page.url();

    await allure.step('Tab 2: navigate to the cart page', async () => {
      await sd_tab2.goto('https://www.saucedemo.com/cart.html');
      await sd_tab2.waitForLoadState('domcontentloaded');
    });

    await allure.step('Assert Tab 1 URL is unchanged', async () => {
      expect(page.url()).toBe(tab1UrlBefore);
    });

    await allure.step('Assert Tab 2 is now on the cart page', async () => {
      await expect(sd_tab2).toHaveURL(/cart/);
    });
  });

  test('multiple tabs can read the same inventory item count', async ({ page, sd_tab2 }) => {
    await allure.allureId('CTX-TAB-005');
    await allure.story('Concurrent Inventory Read');
    await allure.label('severity', 'normal');

    const tab1Inventory = new SD_InventoryPage(page);
    const tab2Inventory = new SD_InventoryPage(sd_tab2);

    await allure.step('Read item count from both tabs concurrently', async () => {
      const [count1, count2] = await Promise.all([
        tab1Inventory.getItemCount(),
        tab2Inventory.getItemCount(),
      ]);

      await allure.step('Assert both tabs report the same inventory size', async () => {
        expect(count1).toBe(count2);
        expect(count1).toBeGreaterThan(0);
      });
    });
  });

  test('logout in Tab 1 should affect the session visible in Tab 2', async ({ page, sd_tab2 }) => {
    test.slow();
    
    await allure.allureId('CTX-TAB-006');
    await allure.story('Logout Propagation');
    await allure.label('severity', 'critical');

    const tab1Inventory = new SD_InventoryPage(page);

    await allure.step('Tab 1: log out', async () => {
      await tab1Inventory.logout();
      await expect(page).toHaveURL(/saucedemo\.com\/?$/);
    });

    await allure.step('Tab 2: navigate to inventory -- should be redirected to login', async () => {
      await sd_tab2.goto('https://www.saucedemo.com/inventory.html');
      // Session is gone; Saucedemo redirects unauthenticated requests to the root login page
      await expect(sd_tab2).toHaveURL(/saucedemo\.com\/?$/);
    });
  });
});
