import { test, expect } from '../../../src/fixtures/index.js';
import { TI_StatusCodesPage } from '../../../src/pages/the-internet/TI_StatusCodesPage.js';
import * as allure from 'allure-js-commons';

test.beforeEach(async () => {
  await allure.epic('The Internet');
  await allure.feature('Status Codes');
});

test.describe('The Internet – Status Codes', { tag: ['@ui', '@theinternethero', '@status-codes'] }, () => {

  test('page loads with links for all four status codes', { tag: ['@smoke'] }, async ({ page }) => {
    await allure.allureId('TI-STC-001');
    await allure.story('Page Load');
    await allure.label('severity', 'critical');

    const stcPage = new TI_StatusCodesPage(page);
    await stcPage.goto();

    await allure.step('Assert on correct URL', async () => {
      await stcPage.assertOnPage();
    });

    await allure.step('Assert all status code links are visible', async () => {
      await stcPage.assertAllLinksVisible();
    });
  });

  test('200 link navigates to the 200 status code page', { tag: ['@smoke'] }, async ({ page }) => {
    await allure.allureId('TI-STC-002');
    await allure.story('Status 200');
    await allure.label('severity', 'critical');

    const stcPage = new TI_StatusCodesPage(page);
    await stcPage.goto();

    await allure.step('Click the 200 link', async () => {
      await stcPage.click200();
    });

    await allure.step('Assert on status 200 page', async () => {
      await stcPage.assertOnStatusPage(200);
    });
  });

  test('404 link navigates to the 404 status code page', { tag: ['@smoke'] }, async ({ page }) => {
    await allure.allureId('TI-STC-003');
    await allure.story('Status 404');
    await allure.label('severity', 'critical');

    const stcPage = new TI_StatusCodesPage(page);
    await stcPage.goto();

    await allure.step('Click the 404 link', async () => {
      await stcPage.click404();
    });

    await allure.step('Assert on status 404 page', async () => {
      await stcPage.assertOnStatusPage(404);
    });
  });

  test('500 link navigates to the 500 status code page', async ({ page }) => {
    await allure.allureId('TI-STC-004');
    await allure.story('Status 500');
    await allure.label('severity', 'normal');

    const stcPage = new TI_StatusCodesPage(page);
    await stcPage.goto();

    await allure.step('Click the 500 link', async () => {
      await stcPage.click500();
    });

    await allure.step('Assert on status 500 page', async () => {
      await stcPage.assertOnStatusPage(500);
    });
  });

  test('200 page returns HTTP 200 response', async ({ page }) => {
    await allure.allureId('TI-STC-005');
    await allure.story('HTTP Response');
    await allure.label('severity', 'normal');

    const stcPage = new TI_StatusCodesPage(page);
    await stcPage.goto();

    await allure.step('Navigate to /status_codes/200 and capture response code', async () => {
      const status = await stcPage.getStatusCodeResponse(200);
      expect(status).toBe(200);
    });
  });

  test('sub-page has a back link to status codes index', async ({ page }) => {
    await allure.allureId('TI-STC-006');
    await allure.story('Navigation');
    await allure.label('severity', 'minor');

    const stcPage = new TI_StatusCodesPage(page);
    await stcPage.goto();

    await allure.step('Navigate to 200 page', async () => {
      await stcPage.click200();
    });

    await allure.step('Back link navigates to status codes index', async () => {
      await stcPage.goBack();
      await stcPage.assertOnPage();
    });
  });
});
