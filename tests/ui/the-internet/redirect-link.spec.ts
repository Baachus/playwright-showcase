import { test, expect } from '../../../src/fixtures/index.js';
import { TI_RedirectLinkPage } from '../../../src/pages/the-internet/TI_RedirectLinkPage.js';
import * as allure from 'allure-js-commons';

test.beforeEach(async () => {
  await allure.epic('The Internet');
  await allure.feature('Redirect Link');
});

test.describe('The Internet – Redirect Link', { tag: ['@ui', '@theinternethero', '@redirect-link'] }, () => {

  test('page loads with redirect link visible', { tag: ['@smoke'] }, async ({ page }) => {
    await allure.allureId('TI-RL-001');
    await allure.story('Page Load');
    await allure.label('severity', 'critical');

    const rlPage = new TI_RedirectLinkPage(page);
    await rlPage.goto();

    await allure.step('Assert on correct URL', async () => {
      await rlPage.assertOnPage();
    });

    await allure.step('Assert redirect link is visible', async () => {
      await rlPage.assertLinkVisible();
    });
  });

  test('clicking the redirect link navigates to status codes page', { tag: ['@smoke'] }, async ({ page }) => {
    await allure.allureId('TI-RL-002');
    await allure.story('Redirect');
    await allure.label('severity', 'critical');

    const rlPage = new TI_RedirectLinkPage(page);
    await rlPage.goto();

    await allure.step('Click the redirect link', async () => {
      await rlPage.clickRedirectLink();
    });

    await allure.step('Assert redirected to /status_codes', async () => {
      await rlPage.assertRedirectedToStatusCodes();
    });
  });

  test.skip('redirect link href points to status_codes', async ({ page }) => {
    await allure.allureId('TI-RL-003');
    await allure.story('Redirect');
    await allure.label('severity', 'minor');

    const rlPage = new TI_RedirectLinkPage(page);
    await rlPage.goto();

    await allure.step('Check href attribute of the redirect link', async () => {
      const href = await rlPage.redirectLink.getAttribute('href');
      expect(href).toContain('status_codes');
    });
  });
});
