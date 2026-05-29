import { test, expect } from '../../../src/fixtures/index.js';
import { TI_MultipleWindowsPage } from '../../../src/pages/the-internet/TI_MultipleWindowsPage.js';
import * as allure from 'allure-js-commons';

test.beforeEach(async () => {
  await allure.epic('The Internet');
  await allure.feature('Multiple Windows');
});

test.describe('The Internet – Multiple Windows', { tag: ['@ui', '@theinternethero', '@multiple-windows'] }, () => {

  test('page loads with click-here link', { tag: ['@smoke'] }, async ({ page }) => {
    await allure.allureId('TI-MW-001');
    await allure.story('Page Load');
    await allure.label('severity', 'critical');

    const mwPage = new TI_MultipleWindowsPage(page);
    await mwPage.goto();

    await allure.step('Assert on correct URL', async () => {
      await mwPage.assertOnPage();
    });

    await allure.step('Assert link is visible', async () => {
      await mwPage.assertLinkVisible();
    });
  });

  test('clicking the link opens a new window', { tag: ['@smoke'] }, async ({ page }) => {
    await allure.allureId('TI-MW-002');
    await allure.story('New Window');
    await allure.label('severity', 'critical');

    const mwPage = new TI_MultipleWindowsPage(page);
    await mwPage.goto();

    await allure.step('Click link and capture new page', async () => {
      const newPage = await mwPage.clickAndGetNewPage();

      await allure.step('Assert new window has correct URL', async () => {
        await mwPage.assertNewWindowUrl(newPage);
      });

      await allure.step('Assert new window shows New Window heading', async () => {
        await mwPage.assertNewWindowHasHeading(newPage);
      });

      await newPage.close();
    });
  });

  test('original window remains intact after new window opens', async ({ page }) => {
    await allure.allureId('TI-MW-003');
    await allure.story('New Window');
    await allure.label('severity', 'normal');

    const mwPage = new TI_MultipleWindowsPage(page);
    await mwPage.goto();

    await allure.step('Open new window', async () => {
      const newPage = await mwPage.clickAndGetNewPage();
      await newPage.close();
    });

    await allure.step('Original window should still be on /windows', async () => {
      await mwPage.assertOnPage();
    });
  });

  test('two windows are open simultaneously after link click', async ({ page }) => {
    await allure.allureId('TI-MW-004');
    await allure.story('New Window');
    await allure.label('severity', 'normal');

    const mwPage = new TI_MultipleWindowsPage(page);
    await mwPage.goto();

    await allure.step('Open new window and verify both pages exist', async () => {
      const newPage = await mwPage.clickAndGetNewPage();
      const pages = page.context().pages();
      expect(pages.length).toBeGreaterThanOrEqual(2);
      await newPage.close();
    });
  });
});
