import { test, expect } from '@playwright/test';
import { LoginPage } from '../../../src/pages/saucedemo/LoginPage.js'
import * as allure from 'allure-js-commons';

test.describe('Saucedemo – Authentication', { tag: ['@ui'] }, () => {

  test('is logged in via saved auth state', { tag: ['@smoke'] }, async ({ page }) => {
    await page.goto('/inventory.html');
    await expect(page).toHaveURL(/inventory/);
    await expect(page.locator('.inventory_list')).toBeVisible();
  });

  test('shows error for invalid credentials', async ({ browser }) => {
    const context = await browser.newContext();
    const page = await context.newPage();
    const loginPage = new LoginPage(page);

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
    const context = await browser.newContext();
    const page = await context.newPage();
    const loginPage = new LoginPage(page);

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
});