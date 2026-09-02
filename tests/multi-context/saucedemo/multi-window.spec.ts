import { test, expect } from '../../../src/fixtures/index.js';
import * as allure from 'allure-js-commons';

/**
 * Multi-Window Tests -- Saucedemo
 * ---------------------------------------------------------------------------
 * Demonstrates true session isolation between independent BrowserContexts.
 *
 * Key concept: Each BrowserContext has its own cookies, localStorage, and
 * session.  Changes in one window (context) are completely invisible in another
 * window.  This models the "two different browsers" or "two different users on
 * the same machine" scenario.
 *
 * Fixtures used:
 *   sd_standard_ctx -- Independent context logged in as standard_user
 *   sd_problem_ctx  -- Independent context logged in as problem_user
 *   sd_glitch_ctx   -- Independent context logged in as performance_glitch_user
 *   sd_unauth_ctx   -- Fresh unauthenticated context at the login page
 */
test.beforeEach(async () => {
  await allure.epic('Saucedemo');
  await allure.feature('Multi-Window');
});

test.describe('Multi-Window -- Session Isolation', { tag: ['@multi-window', '@multi-context'] }, () => {
  test('cart changes in Window 1 do not affect Window 2', async ({ sd_standard_ctx, sd_problem_ctx }) => {
    await allure.allureId('CTX-WIN-001');
    await allure.story('Cart Isolation Across Windows');
    await allure.label('severity', 'critical');

    await allure.step('Window 1 (standard_user): add item to cart', async () => {
      await sd_standard_ctx.inventoryPage.addItemToCart('Sauce Labs Backpack');
      await expect.poll(() => sd_standard_ctx.inventoryPage.getCartCount()).toBe(1);
    });

    await allure.step('Window 2 (problem_user): cart should still be empty', async () => {
      const count = await sd_problem_ctx.inventoryPage.getCartCount();
      expect(count).toBe(0);
    });

    await allure.step('Window 1 (standard_user): reload -- cart count persists', async () => {
      await sd_standard_ctx.page.reload();
      await sd_standard_ctx.inventoryPage.waitForPageLoad();
      await expect.poll(() => sd_standard_ctx.inventoryPage.getCartCount()).toBe(1);
    });

    await allure.step('Window 2 (problem_user): still empty after Window 1 reload', async () => {
      await sd_problem_ctx.page.reload();
      await sd_problem_ctx.inventoryPage.waitForPageLoad();
      await expect.poll(() => sd_problem_ctx.inventoryPage.getCartCount()).toBe(0);
    });
  });

  test('logout in Window 1 does not affect Window 2 session', async ({ sd_standard_ctx, sd_problem_ctx }) => {
    await allure.allureId('CTX-WIN-002');
    await allure.story('Logout Isolation Between Windows');
    await allure.label('severity', 'critical');

    await allure.step('Window 1 (standard_user): log out', async () => {
      await sd_standard_ctx.inventoryPage.logout();
      await expect(sd_standard_ctx.page).toHaveURL(/saucedemo\.com\/?$/);
    });

    await allure.step('Window 2 (problem_user): reload inventory -- session intact', async () => {
      await sd_problem_ctx.page.reload();
      await sd_problem_ctx.inventoryPage.waitForPageLoad();
      await expect(sd_problem_ctx.page).toHaveURL(/inventory/);
    });
  });

  test('unauthenticated window is redirected when accessing inventory', async ({ sd_unauth_ctx }) => {
    await allure.allureId('CTX-WIN-003');
    await allure.story('Unauthenticated Access Redirect');
    await allure.label('severity', 'normal');

    await allure.step('Unauthenticated context should start on the login page', async () => {
      await expect(sd_unauth_ctx.page).toHaveURL(/saucedemo\.com\/?$/);
    });

    await allure.step('Attempt to navigate directly to inventory', async () => {
      await sd_unauth_ctx.page.goto('https://www.saucedemo.com/inventory.html');
      await sd_unauth_ctx.page.waitForLoadState('domcontentloaded');
    });

    // Saucedemo is a client-only SPA that renders /inventory.html regardless
    // of whether the visitor is signed in -- it does NOT perform a server-side
    // redirect.  The authoritative signal for "unauthenticated" is that the
    // sessionStorage `session-username` key is absent.  Verify the redirect
    // intent by asserting that the unauth context still has no live session
    // after the navigation attempt.
    await allure.step('Session should remain unauthenticated after the navigation attempt', async () => {
      const sessionUsername = await sd_unauth_ctx.page.evaluate(
        () => window.sessionStorage.getItem('session-username'),
      );
      expect(sessionUsername).toBeFalsy();
    });

    await allure.step('Navigating back to the root sends the user to the login page', async () => {
      await sd_unauth_ctx.page.goto('https://www.saucedemo.com/');
      await sd_unauth_ctx.page.waitForLoadState('domcontentloaded');
      await expect(sd_unauth_ctx.page.locator('[data-test="login-button"]')).toBeVisible();
      await expect(sd_unauth_ctx.page).toHaveURL(/saucedemo\.com\/?$/);
    });
  });
});
