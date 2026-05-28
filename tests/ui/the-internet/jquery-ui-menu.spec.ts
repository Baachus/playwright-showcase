import { test, expect } from '../../../src/fixtures/index.js';
import { TI_JQueryUIMenuPage } from '../../../src/pages/the-internet/TI_JQueryUIMenuPage.js';
import * as allure from 'allure-js-commons';

test.beforeEach(async () => {
  await allure.epic('The Internet');
  await allure.feature('JQuery UI Menus');
});

test.describe('The Internet – JQuery UI Menus', { tag: ['@ui', '@theinternethero', '@jquery-ui-menu'] }, () => {

  test('page loads with jQuery UI menu visible', { tag: ['@smoke'] }, async ({ page }) => {
    await allure.allureId('TI-JQ-001');
    await allure.story('Page Load');
    await allure.label('severity', 'critical');

    const jqPage = new TI_JQueryUIMenuPage(page);
    await jqPage.goto();

    await allure.step('Assert on correct URL', async () => {
      await jqPage.assertOnPage();
    });

    await allure.step('Assert menu is visible', async () => {
      await jqPage.assertMenuVisible();
    });
  });

  test('hovering Downloads reveals PDF, CSV, Excel sub-menu', { tag: ['@smoke'] }, async ({ page }) => {
    await allure.allureId('TI-JQ-002');
    await allure.story('Sub-Menu');
    await allure.label('severity', 'critical');

    const jqPage = new TI_JQueryUIMenuPage(page);
    await jqPage.goto();

    await allure.step('Hover over Downloads and assert sub-menu appears', async () => {
      await jqPage.assertDownloadSubMenuVisible();
    });
  });

  test('PDF download link is accessible from sub-menu', async ({ page }) => {
    await allure.allureId('TI-JQ-003');
    await allure.story('Downloads');
    await allure.label('severity', 'normal');

    const jqPage = new TI_JQueryUIMenuPage(page);
    await jqPage.goto();

    await allure.step('Hover Downloads and assert PDF link is visible', async () => {
      await jqPage.hoverDownloads();
      await expect(jqPage.pdfLink).toBeVisible();
    });
  });

  test('CSV download link is accessible from sub-menu', async ({ page }) => {
    await allure.allureId('TI-JQ-004');
    await allure.story('Downloads');
    await allure.label('severity', 'normal');

    const jqPage = new TI_JQueryUIMenuPage(page);
    await jqPage.goto();

    await allure.step('Hover Downloads and assert CSV link is visible', async () => {
      await jqPage.hoverDownloads();
      await expect(jqPage.csvLink).toBeVisible();
    });
  });

  test('Excel download link is accessible from sub-menu', async ({ page }) => {
    await allure.allureId('TI-JQ-005');
    await allure.story('Downloads');
    await allure.label('severity', 'normal');

    const jqPage = new TI_JQueryUIMenuPage(page);
    await jqPage.goto();

    await allure.step('Hover Downloads and assert Excel link is visible', async () => {
      await jqPage.hoverDownloads();
      await expect(jqPage.excelLink).toBeVisible();
    });
  });
});
