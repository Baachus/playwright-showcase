import { test, expect } from '../../../src/fixtures/index.js';
import { TI_JavaScriptErrorPage } from '../../../src/pages/the-internet/TI_JavaScriptErrorPage.js';
import * as allure from 'allure-js-commons';

test.beforeEach(async () => {
  await allure.epic('The Internet');
  await allure.feature('JavaScript Error');
});

test.describe('The Internet – JavaScript Error', { tag: ['@ui', '@theinternethero', '@js-error'] }, () => {

  test('page loads and body paragraph is visible', { tag: ['@smoke'] }, async ({ page }) => {
    await allure.allureId('TI-JE-001');
    await allure.story('Page Load');
    await allure.label('severity', 'normal');

    const jePage = new TI_JavaScriptErrorPage(page);
    await jePage.goto();

    await allure.step('Assert on correct URL', async () => {
      await jePage.assertOnPage();
    });

    await allure.step('Assert body paragraph is visible', async () => {
      await jePage.assertBodyParagraphVisible();
    });
  });

  test('page emits a JavaScript error on load', { tag: ['@smoke'] }, async ({ page }, testInfo) => {
    await allure.allureId('TI-JE-002');
    await allure.story('JavaScript Error');
    await allure.label('severity', 'critical');
    testInfo.skip(
      testInfo.project.name === 'The Internet Firefox',
      'Javascript Error not appearing in application for Firefox'
    );

    const errors: string[] = [];
    page.on('pageerror', (err) => errors.push(err.message));

    const jePage = new TI_JavaScriptErrorPage(page);

    await allure.step('Navigate to the page and collect JS errors', async () => {
      await jePage.goto();
    });

    await allure.step('Assert at least one JavaScript error was captured', async () => {
      expect(errors.length).toBeGreaterThan(0);
    });
  });

  test('document title references JavaScript errors', async ({ page }) => {
    await allure.allureId('TI-JE-003');
    await allure.story('Page Load');
    await allure.label('severity', 'minor');

    const jePage = new TI_JavaScriptErrorPage(page);
    await jePage.goto();

    await allure.step('Assert document title mentions JavaScript', async () => {
      // The page title is "Page with JavaScript errors on load"
      await jePage.assertPageTitleContains('javascript');
    });
  });
});
