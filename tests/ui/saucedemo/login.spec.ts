import { test, expect } from '../../../src/fixtures/index.js';
import { SD_LoginPage } from '../../../src/pages/saucedemo/SD_LoginPage.js'
import * as allure from 'allure-js-commons';

/**
 * UI Tests – Login Page
 */

test.describe('Saucedemo – Authentication', { tag: ['@ui'] }, () => {
  test.beforeEach(async ({}, testInfo) => {
    testInfo.annotations.push({ type: 'epic', description: 'UI Testing' });
    testInfo.annotations.push({ type: 'feature', description: 'Login Page' });
    testInfo.annotations.push({ type: 'owner', description: 'Playwright Showcase' });
  });

  // ── Valid Login ──────────────────────────────────────────────────
  test('is logged in via saved auth state', { 
    annotation: [{ type: 'story', description: 'Valid Login' }, 
      { type: 'severity', description: 'critical' }], 
      tag: ['@smoke'] }, 
      async ({ page }) => {
    await allure.label('severity', 'critical');
    await page.goto('/inventory.html');
    await expect(page).toHaveURL(/inventory/);
    await expect(page.locator('.inventory_list')).toBeVisible();
  });

  test('shows user can login with error user', { 
    annotation: [{ type: 'story', description: 'Valid Login' }, 
      { type: 'severity', description: 'minor' }] }, 
      async ({ browser }) => {
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

  test('shows user can login for visual user', { 
    annotation: [{ type: 'story', description: 'Valid Login' }, 
      { type: 'severity', description: 'minor' }] }, 
      async ({ browser }) => {
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

  test('show user can login with performance glitch user', { 
    annotation: [{ type: 'story', description: 'Valid Login' }, 
      { type: 'severity', description: 'minor' }] }, 
      async ({ browser }) => {
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

  test('shows user can login for problem user', { 
    annotation: [{ type: 'story', description: 'Invalid Login' }, 
      { type: 'severity', description: 'minor' }] }, 
      async ({ browser }) => {
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
  test('shows error for invalid credentials', { 
    annotation: [{ type: 'story', description: 'Invalid Login' }, 
      { type: 'severity', description: 'critical' }] }, 
      async ({ browser }) => {
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

  test('clears error when dismissed', { 
    annotation: [{ type: 'story', description: 'Invalid Login' }, 
      { type: 'severity', description: 'critical' }] }, 
      async ({ browser }) => {
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

  test('shows error for locked out user', { 
    annotation: [{ type: 'story', description: 'Invalid Login' }, 
      { type: 'severity', description: 'critical' }] }, 
      async ({ browser }) => {
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