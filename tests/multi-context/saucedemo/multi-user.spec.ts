import { test, expect } from '../../../src/fixtures/index.js';
import { BrowserContext, Page } from '@playwright/test';
import { MultiContextHelper } from '../../../src/utils/multi-context.utils.js';
import { SD_InventoryPage } from '../../../src/pages/saucedemo/SD_InventoryPage.js';
import * as allure from 'allure-js-commons';

/**
 * Multi-User Tests -- Saucedemo
 * ---------------------------------------------------------------------------
 * Exercises Saucedemo's distinct user personas and their differing behaviors.
 *
 * User breakdown:
 *   standard_user           -- normal experience; baseline for comparisons
 *   locked_out_user         -- cannot log in; tests rejection flow
 *   problem_user            -- broken product images; wrong items added to cart
 *   performance_glitch_user -- artificial load delays; still logs in successfully
 *   error_user              -- random errors on cart/checkout interactions
 *   visual_user             -- visual glitches (button misplacement, wrong images)
 *
 * Fixtures used:
 *   sd_standard_ctx  -- pre-authenticated window for standard_user
 *   sd_problem_ctx   -- pre-authenticated window for problem_user
 *   sd_glitch_ctx    -- pre-authenticated window for performance_glitch_user
 *   sd_unauth_ctx    -- fresh unauthenticated window (for rejection tests)
 *   sd_multiContextHelper -- browser-scoped helper for ad-hoc context creation
 */
test.beforeEach(async () => {
  await allure.epic('Saucedemo');
  await allure.feature('Multi-User');
});

test.describe('Multi-User -- User Behavior Differences', { tag: ['@multi-user', '@multi-context'] }, () => {

  // --locked_out_user-------------------------------------------------------------- 
  test.describe('locked_out_user -- Login Rejection', { tag: ['@smoke'] }, () => {

    test('locked_out_user should be rejected at login with an error message', async ({ sd_unauth_ctx }) => {
      await allure.allureId('CTX-USR-001');
      await allure.story('Locked-Out User Rejection');
      await allure.label('severity', 'critical');

      await allure.step('Attempt to log in as locked_out_user', async () => {
        const errorText = await MultiContextHelper.loginExpectRejected(
          sd_unauth_ctx.page,
          'locked_out_user',
        );

        await allure.step('Assert the error message mentions being locked out', async () => {
          expect(errorText.toLowerCase()).toContain('locked out');
        });
      });

      await allure.step('Assert the user remains on the login page', async () => {
        await expect(sd_unauth_ctx.page).toHaveURL(/saucedemo\.com\/?$/);
      });
    });

    test('locked_out_user error banner should be dismissible', async ({ sd_unauth_ctx }) => {
      await allure.allureId('CTX-USR-002');
      await allure.story('Error Banner Dismissal');
      await allure.label('severity', 'normal');

      await allure.step('Trigger the locked-out error', async () => {
        await MultiContextHelper.loginExpectRejected(sd_unauth_ctx.page, 'locked_out_user');
      });

      await allure.step('Click the error close button', async () => {
        await sd_unauth_ctx.page.locator('[data-test="error-button"]').click();
      });

      await allure.step('Assert error banner is no longer visible', async () => {
        await expect(sd_unauth_ctx.page.locator('[data-test="error"]')).toBeHidden();
      });
    });
  });

  // --standard_user vs problem_user-------------------------------------------------------------- 
  test.describe('standard_user vs problem_user -- Side-by-Side Comparison', () => {

    test('both users see the same product names on the inventory page', async ({ sd_standard_ctx, sd_problem_ctx }) => {
      await allure.allureId('CTX-USR-003');
      await allure.story('Product Catalogue Consistency');
      await allure.label('severity', 'normal');

      await allure.step('Collect product names from both user sessions', async () => {
        const [standardNames, problemNames] = await Promise.all([
          sd_standard_ctx.inventoryPage.getItemNames(),
          sd_problem_ctx.inventoryPage.getItemNames(),
        ]);

        await allure.step('Product names should be identical across users', async () => {
          expect(standardNames).toEqual(problemNames);
        });
      });
    });

    test('both users see the same product prices', async ({ sd_standard_ctx, sd_problem_ctx }) => {
      await allure.allureId('CTX-USR-004');
      await allure.story('Price Consistency Across Users');
      await allure.label('severity', 'normal');

      await allure.step('Collect prices from both user sessions', async () => {
        const [standardPrices, problemPrices] = await Promise.all([
          sd_standard_ctx.inventoryPage.getItemPrices(),
          sd_problem_ctx.inventoryPage.getItemPrices(),
        ]);

        await allure.step('Prices should be identical for all items', async () => {
          expect(standardPrices).toEqual(problemPrices);
        });
      });
    });

    test('standard_user can sort inventory by price; problem_user cart behaves differently', async ({ sd_standard_ctx, sd_problem_ctx }) => {
      await allure.allureId('CTX-USR-005');
      await allure.story('Sort and Cart Differences');
      await allure.label('severity', 'normal');

      await allure.step('standard_user: sort by price low to high and assert order', async () => {
        await sd_standard_ctx.inventoryPage.sortBy('lohi');
        await sd_standard_ctx.inventoryPage.assertSortedLowToHigh();
      });

      await allure.step('problem_user: add item -- note problem_user adds wrong items (known bug)', async () => {
        // problem_user is a buggy persona -- adding "Sauce Labs Backpack" may
        // result in a different item appearing in the cart.  We just verify the
        // cart count increases to demonstrate the user is functional but buggy.
        await sd_problem_ctx.inventoryPage.addItemToCart('Sauce Labs Backpack');
        const count = await sd_problem_ctx.inventoryPage.getCartCount();
        expect(count).toBeGreaterThan(0);
      });
    });
  });

  // --performance_glitch_user-------------------------------------------------------------- 
  test.describe('performance_glitch_user -- Slow but Functional', () => {

    test('performance_glitch_user can log in and reach the inventory page', async ({ sd_glitch_ctx }) => {
      await allure.allureId('CTX-USR-006');
      await allure.story('Glitch User Authentication');
      await allure.label('severity', 'normal');

      await allure.step('Assert glitch user is authenticated and on inventory', async () => {
        await expect(sd_glitch_ctx.page).toHaveURL(/inventory/);
        await sd_glitch_ctx.inventoryPage.assertOnInventoryPage();
      });
    });

    test('performance_glitch_user sees the same product catalogue as standard_user', async ({ sd_standard_ctx, sd_glitch_ctx }) => {
      await allure.allureId('CTX-USR-007');
      await allure.story('Glitch User Catalogue Consistency');
      await allure.label('severity', 'normal');

      await allure.step('Fetch catalogues from both users', async () => {
        const [standardNames, glitchNames] = await Promise.all([
          sd_standard_ctx.inventoryPage.getItemNames(),
          sd_glitch_ctx.inventoryPage.getItemNames(),
        ]);

        await allure.step('Catalogues should match', async () => {
          expect(glitchNames).toEqual(standardNames);
        });
      });
    });

    test('performance_glitch_user can add items to cart', async ({ sd_glitch_ctx }) => {
      await allure.allureId('CTX-USR-008');
      await allure.story('Glitch User Cart Interaction');
      await allure.label('severity', 'normal');

      await allure.step('Add an item and assert the cart badge increments', async () => {
        await sd_glitch_ctx.inventoryPage.addItemToCart('Sauce Labs Fleece Jacket');
        const count = await sd_glitch_ctx.inventoryPage.getCartCount();
        expect(count).toBe(1);
      });
    });
  });

  // --three users concurrently-------------------------------------------------------------- 
  test.describe('Three Users -- Concurrent Session Comparison', () => {

    test('three users are all authenticated and independent simultaneously', async ({ sd_standard_ctx, sd_problem_ctx, sd_glitch_ctx }) => {
      await allure.allureId('CTX-USR-009');
      await allure.story('Three Concurrent User Sessions');
      await allure.label('severity', 'critical');

      await allure.step('Assert all three user sessions are on the inventory page', async () => {
        await Promise.all([
          expect(sd_standard_ctx.page).toHaveURL(/inventory/),
          expect(sd_problem_ctx.page).toHaveURL(/inventory/),
          expect(sd_glitch_ctx.page).toHaveURL(/inventory/),
        ]);
      });

      await allure.step('Verify each user starts with an empty cart', async () => {
        const [c1, c2, c3] = await Promise.all([
          sd_standard_ctx.inventoryPage.getCartCount(),
          sd_problem_ctx.inventoryPage.getCartCount(),
          sd_glitch_ctx.inventoryPage.getCartCount(),
        ]);
        expect(c1).toBe(0);
        expect(c2).toBe(0);
        expect(c3).toBe(0);
      });

      await allure.step('Each user adds a different number of items', async () => {
        await sd_standard_ctx.inventoryPage.addItemToCart('Sauce Labs Backpack');

        await sd_problem_ctx.inventoryPage.addItemToCart('Sauce Labs Backpack');
        await sd_problem_ctx.inventoryPage.addItemToCart('Sauce Labs Bike Light');

        await sd_glitch_ctx.inventoryPage.addItemToCart('Sauce Labs Backpack');
        await sd_glitch_ctx.inventoryPage.addItemToCart('Sauce Labs Bike Light');
        await sd_glitch_ctx.inventoryPage.addItemToCart('Sauce Labs Bolt T-Shirt');
      });

      await allure.step('Assert cart counts are independent and correct', async () => {
        const [c1, c2, c3] = await Promise.all([
          sd_standard_ctx.inventoryPage.getCartCount(),
          sd_problem_ctx.inventoryPage.getCartCount(),
          sd_glitch_ctx.inventoryPage.getCartCount(),
        ]);
        expect(c1).toBe(1);
        expect(c2).toBe(2);
        expect(c3).toBe(3);
      });
    });

    test('ad-hoc context created via MultiContextHelper is fully independent', async ({ sd_multiContextHelper, sd_standard_ctx }) => {
      await allure.allureId('CTX-USR-010');
      await allure.story('Ad-Hoc Context Independence');
      await allure.label('severity', 'normal');

      // Explicitly typed so TypeScript tracks the variable through async callbacks
      type WindowResult = { context: BrowserContext; page: Page; inventoryPage: SD_InventoryPage };
      let adhocCtx: WindowResult | undefined;

      try {
        adhocCtx = await sd_multiContextHelper.newWindow('problem_user');

        await allure.step('Create an ad-hoc problem_user window', async () => {
          await expect(adhocCtx!.page).toHaveURL(/inventory/);
        });

        await allure.step('standard_user adds to cart; ad-hoc context cart stays empty', async () => {
          await sd_standard_ctx.inventoryPage.addItemToCart('Sauce Labs Onesie');
          await expect.poll(() => sd_standard_ctx.inventoryPage.getCartCount()).toBe(1);
          await expect.poll(() => adhocCtx!.inventoryPage.getCartCount()).toBe(0);
        });
      } finally {
        await adhocCtx?.context.close();
      }
    });
  });

  // --wrong credentials-------------------------------------------------------------- 
  test.describe('Invalid Credentials -- Edge Cases', () => {

    test('empty username should show a validation error', async ({ sd_unauth_ctx }) => {
      await allure.allureId('CTX-USR-011');
      await allure.story('Empty Username Validation');
      await allure.label('severity', 'normal');

      await allure.step('Submit login form with empty fields', async () => {
        await sd_unauth_ctx.page.locator('[data-test="login-button"]').click();
      });

      await allure.step('Assert an error message is displayed', async () => {
        const error = sd_unauth_ctx.page.locator('[data-test="error"]');
        await expect(error).toBeVisible();
        const text = await error.innerText();
        expect(text.toLowerCase()).toContain('username');
      });
    });

    test('wrong password for standard_user should show a validation error', async ({ sd_unauth_ctx }) => {
      await allure.allureId('CTX-USR-012');
      await allure.story('Wrong Password Validation');
      await allure.label('severity', 'normal');

      await allure.step('Attempt login with wrong password', async () => {
        await MultiContextHelper.loginExpectRejected(
          sd_unauth_ctx.page,
          'standard_user',
          'wrong_password_123',
        );
      });

      await allure.step('Assert user remains on the login page', async () => {
        await expect(sd_unauth_ctx.page).toHaveURL(/saucedemo\.com\/?$/);
      });
    });
  });
});
