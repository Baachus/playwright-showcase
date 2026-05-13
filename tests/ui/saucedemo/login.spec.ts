import { test, expect } from '../../../src/fixtures/index.js';
import { SD_LoginPage } from '../../../src/pages/saucedemo/SD_LoginPage.js'
import * as allure from 'allure-js-commons';

test.describe('Saucedemo – Authentication', { tag: ['@ui'] }, () => {
  test.beforeEach(async ({}, testInfo) => {
    testInfo.annotations.push({ type: 'epic', description: 'UI Testing' });
    testInfo.annotations.push({ type: 'feature', description: 'Login Page' });
    testInfo.annotations.push({ type: 'owner', description: 'Playwright Showcase' });
  });

  test('is logged in via saved auth state', { annotation: [{ type: 'story', description: 'Purchase' }, { type: 'severity', description: 'critical' }], tag: ['@smoke'] }, async ({ page }) => {
    await page.goto('/inventory.html');
    await expect(page).toHaveURL(/inventory/);
    await expect(page.locator('.inventory_list')).toBeVisible();
  });

  test('shows error for invalid credentials', { annotation: [{ type: 'story', description: 'Purchase' }, { type: 'severity', description: 'critical' }] }, async ({ browser }) => {
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

  test('clears error when dismissed', { annotation: [{ type: 'story', description: 'Purchase' }, { type: 'severity', description: 'critical' }] }, async ({ browser }) => {
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
});