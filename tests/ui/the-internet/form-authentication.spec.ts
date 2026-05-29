import { test, expect } from '../../../src/fixtures/index.js';
import { TI_FormAuthenticationPage } from '../../../src/pages/the-internet/TI_FormAuthenticationPage.js';
import * as allure from 'allure-js-commons';

test.beforeEach(async () => {
  await allure.epic('The Internet');
  await allure.feature('Form Authentication');
});

test.describe('The Internet – Form Authentication', { tag: ['@ui', '@theinternethero', '@form-auth'] }, () => {

  test('page loads with login form', { tag: ['@smoke'] }, async ({ page }) => {
    await allure.allureId('TI-FA-001');
    await allure.story('Page Load');
    await allure.label('severity', 'critical');

    const faPage = new TI_FormAuthenticationPage(page);
    await faPage.goto();

    await allure.step('Assert on login URL', async () => {
      await faPage.assertOnLoginPage();
    });

    await allure.step('Assert login form is visible', async () => {
      await expect(faPage.usernameInput).toBeVisible();
      await expect(faPage.passwordInput).toBeVisible();
      await expect(faPage.loginButton).toBeVisible();
    });
  });

  test('valid credentials log in and redirect to secure area', { tag: ['@smoke'] }, async ({ page }) => {
    await allure.allureId('TI-FA-002');
    await allure.story('Valid Login');
    await allure.label('severity', 'critical');

    const faPage = new TI_FormAuthenticationPage(page);
    await faPage.goto();

    await allure.step('Log in with valid credentials', async () => {
      await faPage.validLogin();
    });

    await allure.step('Assert redirected to secure area', async () => {
      await faPage.assertOnSecurePage();
    });

    await allure.step('Assert success flash message', async () => {
      await faPage.assertLoginSuccessful();
    });
  });

  test('invalid credentials show error flash message', { tag: ['@smoke'] }, async ({ page }) => {
    await allure.allureId('TI-FA-003');
    await allure.story('Invalid Login');
    await allure.label('severity', 'critical');

    const faPage = new TI_FormAuthenticationPage(page);
    await faPage.goto();

    await allure.step('Log in with invalid credentials', async () => {
      await faPage.invalidLogin('wrong', 'credentials');
    });

    await allure.step('Assert error flash is shown', async () => {
      await faPage.assertLoginFailed();
    });

    await allure.step('Assert still on login page', async () => {
      await faPage.assertOnLoginPage();
    });
  });

  test('user can log out after logging in', async ({ page }) => {
    await allure.allureId('TI-FA-004');
    await allure.story('Logout');
    await allure.label('severity', 'normal');

    const faPage = new TI_FormAuthenticationPage(page);
    await faPage.goto();

    await allure.step('Log in', async () => {
      await faPage.validLogin();
      await faPage.assertOnSecurePage();
    });

    await allure.step('Log out', async () => {
      await faPage.logout();
    });

    await allure.step('Assert logout success message and redirect to login page', async () => {
      await faPage.assertLoggedOut();
      await faPage.assertOnLoginPage();
    });
  });

  test('flash message is shown after successful login', async ({ page }) => {
    await allure.allureId('TI-FA-005');
    await allure.story('Valid Login');
    await allure.label('severity', 'normal');

    const faPage = new TI_FormAuthenticationPage(page);
    await faPage.goto();

    await allure.step('Login and verify flash message is success type', async () => {
      await faPage.validLogin();
      const isSuccess = await faPage.isFlashSuccess();
      expect(isSuccess).toBe(true);
    });
  });
});
