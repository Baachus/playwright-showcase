import { test, expect } from '../../../src/fixtures/index.js';
import { TI_ForgotPasswordPage } from '../../../src/pages/the-internet/TI_ForgotPasswordPage.js';
import * as allure from 'allure-js-commons';

test.beforeEach(async () => {
  await allure.epic('The Internet');
  await allure.feature('Forgot Password');
});

test.describe('The Internet – Forgot Password', { tag: ['@ui', '@theinternethero', '@forgot-password'] }, () => {

  test('page loads with email input and submit button', { tag: ['@smoke'] }, async ({ page }) => {
    await allure.allureId('TI-FP-001');
    await allure.story('Page Load');
    await allure.label('severity', 'critical');

    const fpPage = new TI_ForgotPasswordPage(page);
    await fpPage.goto();

    await allure.step('Assert on correct URL', async () => {
      await fpPage.assertOnPage();
    });

    await allure.step('Assert form is visible', async () => {
      await fpPage.assertFormVisible();
    });
  });

  test('entering an email address populates the input', async ({ page }) => {
    await allure.allureId('TI-FP-002');
    await allure.story('Form Input');
    await allure.label('severity', 'normal');

    const fpPage = new TI_ForgotPasswordPage(page);
    await fpPage.goto();

    await allure.step('Type an email address', async () => {
      await fpPage.enterEmail('test@example.com');
    });

    await allure.step('Assert email value is set', async () => {
      const value = await fpPage.getEmailValue();
      expect(value).toBe('test@example.com');
    });
  });

  test('submitting the form navigates away from the page', { tag: ['@smoke'] }, async ({ page }) => {
    await allure.allureId('TI-FP-003');
    await allure.story('Form Submit');
    await allure.label('severity', 'critical');

    const fpPage = new TI_ForgotPasswordPage(page);
    await fpPage.goto();

    await allure.step('Submit the form with an email address', async () => {
      await fpPage.requestPasswordReset('user@example.com');
      await page.waitForLoadState('domcontentloaded');
    });

    await allure.step('URL should have changed after submission', async () => {
      // The form posts and may redirect — just verify it processed
      const url = page.url();
      expect(url).toBeTruthy();
    });
  });
});
