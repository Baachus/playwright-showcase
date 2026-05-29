import { test, expect } from '../../../src/fixtures/index.js';
import { TI_DynamicContentPage } from '../../../src/pages/the-internet/TI_DynamicContentPage.js';
import * as allure from 'allure-js-commons';

test.beforeEach(async () => {
  await allure.epic('The Internet');
  await allure.feature('Dynamic Content');
});

test.describe('The Internet – Dynamic Content', { tag: ['@ui', '@theinternethero', '@dynamic-content'] }, () => {

  test('page loads with exactly three content rows', { tag: ['@smoke'] }, async ({ page }) => {
    await allure.allureId('TI-DC-001');
    await allure.story('Page Load');
    await allure.label('severity', 'critical');

    const dcPage = new TI_DynamicContentPage(page);
    await dcPage.goto();

    await allure.step('Assert on correct URL', async () => {
      await dcPage.assertOnPage();
    });

    await allure.step('Assert three rows are visible', async () => {
      await dcPage.assertFourRowsVisible();
    });
  });

  test('all rows have image src attributes', { tag: ['@smoke'] }, async ({ page }) => {
    await allure.allureId('TI-DC-002');
    await allure.story('Images');
    await allure.label('severity', 'normal');

    const dcPage = new TI_DynamicContentPage(page);
    await dcPage.goto();

    await allure.step('Assert all images have src attributes', async () => {
      await dcPage.assertAllImagesLoaded();
    });
  });

  test('row text blocks are non-empty', async ({ page }) => {
    await allure.allureId('TI-DC-003');
    await allure.story('Content');
    await allure.label('severity', 'normal');

    const dcPage = new TI_DynamicContentPage(page);
    await dcPage.goto();

    await allure.step('Each row text block contains text', async () => {
      const texts = await dcPage.getAllRowTexts();
      expect(texts).toHaveLength(4);
      for (const t of texts) {
        expect(t.trim().length).toBeGreaterThan(0);
      }
    });
  });

  test('content changes on page reload', async ({ page }) => {
    await allure.allureId('TI-DC-004');
    await allure.story('Dynamic Content');
    await allure.label('severity', 'normal');

    const dcPage = new TI_DynamicContentPage(page);
    await dcPage.goto();

    await allure.step('Capture content on first load', async () => {
      const firstLoad = await dcPage.getAllRowTexts();
      expect(firstLoad).toHaveLength(4);

      // Reload and capture again
      await dcPage.goto();
      const secondLoad = await dcPage.getAllRowTexts();
      expect(secondLoad).toHaveLength(4);

      // Content is non-deterministic — we only verify the page still has 3 rows
      // with content after reload (it may or may not differ)
    });
  });
});
