import { test, expect } from '../../../src/fixtures/index.js';
import { SD_LoginPage } from '../../../src/pages/saucedemo/SD_LoginPage.js'
import * as allure from 'allure-js-commons';

/**
 * UI Tests – Login Page
 */

test.beforeEach(async()=>{
    await allure.epic('Saucedemo');
    await allure.feature('Authentication');
});

test.describe('Saucedemo – Authentication', { tag: ['@ui'] }, () => {
  // ── Valid Login ──────────────────────────────────────────────────
  test('is logged in via saved auth state', { tag: ['@smoke'] }, async ({ page }) => {
    await allure.allureId('UI-LG-001');
    await allure.story('Valid User Login');
    await allure.label('severity', 'critical');
    await page.goto('/inventory.html');
    await expect(page).toHaveURL(/inventory/);
    await expect(page.locator('.inventory_list')).toBeVisible();
  });

  test('shows user can login with error user', async ({ browser }) => {
    await allure.allureId('UI-LG-002');
    await allure.story('Error User Login');
    await allure.label('severity', 'minor');
    const context = await browser.newContext();
    const page = await context.newPage();
    const loginPage = new SD_LoginPage(page);

    await allure.step('Navigate to login page without utilizing stored authentication', async()=>{
      await loginPage.goto();
    });

    await allure.step('Login with bad user and password and verify error', async()=>{
      await loginPage.login('error_user');
      await expect(page).toHaveURL(/inventory/);
      await expect(page.locator('.inventory_list')).toBeVisible();
      await context.close();
    });
  });

  test('shows user can login for visual user', async ({ browser }) => {
    await allure.allureId('UI-LG-003');
    await allure.story('Visual User Login');
    await allure.label('severity', 'minor');
    const context = await browser.newContext();
    const page = await context.newPage();
    const loginPage = new SD_LoginPage(page);

    await allure.step('Navigate to login page without utilizing stored authentication', async()=>{
      await loginPage.goto();
    });

    await allure.step('Login with bad user and password and verify error', async()=>{
      await loginPage.login('visual_user');
      await expect(page).toHaveURL(/inventory/);
      await expect(page.locator('.inventory_list')).toBeVisible();
      await context.close();
    });
  });

  test('show user can login with performance glitch user', async ({ browser }) => {
    await allure.allureId('UI-LG-004');
    await allure.story('Performance Glitch Login');
    await allure.label('severity', 'minor');
      const context = await browser.newContext();
      const page = await context.newPage();
      const loginPage = new SD_LoginPage(page);

      await allure.step('Navigate to login page without utilizing stored authentication', async()=>{
        await loginPage.goto();
      });

      await allure.step('Login with bad user and password and verify error', async()=>{
      await loginPage.login('performance_glitch_user');
      await expect(page).toHaveURL(/inventory/);
      await expect(page.locator('.inventory_list')).toBeVisible();
      await context.close();
    });
  });

  test('shows user can login for problem user', async ({ browser }) => {
    await allure.allureId('UI-LG-005');
    await allure.story('Problem User Login');
    await allure.label('severity', 'minor');
    const context = await browser.newContext();
    const page = await context.newPage();
    const loginPage = new SD_LoginPage(page);

    await allure.step('Navigate to login page without utilizing stored authentication', async()=>{
      await loginPage.goto();
    });

    await allure.step('Login with bad user and password and verify error', async()=>{
      await loginPage.login('problem_user');
      await expect(page).toHaveURL(/inventory/);
      await expect(page.locator('.inventory_list')).toBeVisible();
      await context.close();
    });
  });

  // ── Invalid Login ──────────────────────────────────────────────────
  test('shows error for invalid credentials', async ({ browser }) => {
    await allure.allureId('UI-LG-006');
    await allure.story('Invalid User');
    await allure.label('severity', 'critical');
    const context = await browser.newContext();
    const page = await context.newPage();
    const loginPage = new SD_LoginPage(page);

    await allure.step('Navigate to login page without utilizing stored authentication', async()=>{
      await loginPage.goto();
    });

    await allure.step('Login with bad user and password and verify error', async()=>{
      await loginPage.login('bad_user', 'bad_pass');
      await loginPage.assertErrorVisible('Username and password do not match');
      await context.close();
    });
  });

  test('clears error when dismissed', async ({ browser }) => {
    await allure.allureId('UI-LG-007');
    await allure.story('Dismiss Error');
    await allure.label('severity', 'critical');
    const context = await browser.newContext();
    const page = await context.newPage();
    const loginPage = new SD_LoginPage(page);

    await allure.step('Navigate to login page without utilizing stored authentication', async()=>{
      await loginPage.goto();
    });

    await allure.step('Login with bad user and password and verify error', async()=>{
      await loginPage.login('bad_user', 'bad_pass');
      await loginPage.assertErrorVisible();
    });

    await allure.step('Clear Error and Verify error is removed', async()=>{
        await loginPage.closeError();
        await loginPage.assertErrorHidden();
        await context.close();
    });
  });

  test('shows error for locked out user', async ({ browser }) => {
    await allure.allureId('UI-LG-008');
    await allure.story('Locked Out User');
    await allure.label('severity', 'critical');

    const context = await browser.newContext();
    const page = await context.newPage();
    const loginPage = new SD_LoginPage(page);

    await allure.step('Navigate to login page without utilizing stored authentication', async()=>{
      await loginPage.goto();
    });

    await allure.step('Login with bad user and password and verify error', async()=>{
      await loginPage.login('locked_out_user');
      await loginPage.assertErrorVisible('Epic sadface: Sorry, this user has been locked out.');
      await context.close();
    });
  });
});