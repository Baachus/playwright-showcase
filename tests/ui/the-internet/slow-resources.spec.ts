import { test, expect } from '../../../src/fixtures/index.js';
import { TI_SlowResourcesPage } from '../../../src/pages/the-internet/TI_SlowResourcesPage.js';
import * as allure from 'allure-js-commons';

test.beforeEach(async () => {
  await allure.epic('The Internet');
  await allure.feature('Slow Resources');
});

test.describe('The Internet – Slow Resources', { tag: ['@ui', '@theinternethero', '@slow-resources'] }, () => {

  test('page loads title before slow image finishes', { tag: ['@smoke'] }, async ({ page }) => {
    await allure.allureId('TI-SR-001');
    await allure.story('Page Load');
    await allure.label('severity', 'critical');

    const srPage = new TI_SlowResourcesPage(page);
    await srPage.goto();

    await allure.step('Assert on correct URL', async () => {
      await srPage.assertOnPage();
    });

    await allure.step('Assert page title is visible (page is functional before image loads)', async () => {
      await srPage.assertTitleVisible();
    });
  });

  test.skip('slow image element is present in the DOM', { tag: ['@smoke'] }, async ({ page }) => {
    await allure.allureId('TI-SR-002');
    await allure.story('Slow Image');
    await allure.label('severity', 'normal');

    const srPage = new TI_SlowResourcesPage(page);
    await srPage.goto();

    await allure.step('Assert the slow image element is attached to the DOM', async () => {
      await srPage.assertSlowImagePresent();
    });
  });

  test.skip('page fully loads including slow image within 30 seconds', async ({ page }) => {
    await allure.allureId('TI-SR-003');
    await allure.story('Slow Image');
    await allure.label('severity', 'normal');

    const srPage = new TI_SlowResourcesPage(page);

    await allure.step('Navigate and wait for complete page load', async () => {
      await srPage.gotoAndWaitForImage();
    });

    await allure.step('Assert slow image has finished loading', async () => {
      const loaded = await srPage.isImageLoaded();
      expect(loaded).toBe(true);
    });
  });
});
