import { test, expect } from '@playwright/test';
import { LoginPage } from '@pages/saucedemo/LoginPage';

test.describe('Saucedemo – Authentication', { tag: ['@ui'] }, () => {

  test('is logged in via saved auth state', async ({ page }) => {
    await page.goto('/inventory.html');
    await expect(page).toHaveURL(/inventory/);
    await expect(page.locator('.inventory_list')).toBeVisible();
  });

  test('shows error for invalid credentials', async ({ browser }) => {
    const context = await browser.newContext();
    const page = await context.newPage();
    const loginPage = new LoginPage(page);

    await loginPage.goto();
    await loginPage.login('bad_user', 'bad_pass');

    await loginPage.assertErrorVisible('Username and password do not match');

    await context.close();
  });

  test('clears error when dismissed', async ({ browser }) => {
    const context = await browser.newContext();
    const page = await context.newPage();
    const loginPage = new LoginPage(page);

    await loginPage.goto();
    await loginPage.login('bad_user', 'bad_pass');
    await loginPage.assertErrorVisible();
    await loginPage.closeError();
    await loginPage.assertErrorHidden();

    await context.close();
  });

});