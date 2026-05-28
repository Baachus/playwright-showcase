import { test, expect } from '../../../src/fixtures/index.js';
import { TI_ShadowDomPage } from '../../../src/pages/the-internet/TI_ShadowDomPage.js';
import * as allure from 'allure-js-commons';

test.beforeEach(async () => {
  await allure.epic('The Internet');
  await allure.feature('Shadow DOM');
});

test.describe('The Internet – Shadow DOM', { tag: ['@ui', '@theinternethero', '@shadow-dom'] }, () => {

  test('page loads with the guid-generator custom element', { tag: ['@smoke'] }, async ({ page }) => {
    await allure.allureId('TI-SD-001');
    await allure.story('Page Load');
    await allure.label('severity', 'critical');

    const sdPage = new TI_ShadowDomPage(page);
    await sdPage.goto();

    await allure.step('Assert on correct URL', async () => {
      await sdPage.assertOnPage();
    });

    await allure.step('Assert guid-generator element is visible', async () => {
      await sdPage.assertGuidGeneratorVisible();
    });
  });

  test('guid-generator element has a Shadow Root', { tag: ['@smoke'] }, async ({ page }) => {
    await allure.allureId('TI-SD-002');
    await allure.story('Shadow DOM');
    await allure.label('severity', 'critical');

    const sdPage = new TI_ShadowDomPage(page);
    await sdPage.goto();

    await allure.step('Assert shadow root is attached to the host element', async () => {
      await sdPage.assertShadowRootPresent();
    });
  });

  test('guid inputs inside shadow DOM have values', async ({ page }) => {
    await allure.allureId('TI-SD-003');
    await allure.story('Shadow DOM Content');
    await allure.label('severity', 'normal');

    const sdPage = new TI_ShadowDomPage(page);
    await sdPage.goto();

    await allure.step('Read GUID input values from shadow DOM', async () => {
      const values = await sdPage.getGuidInputValues();
      expect(values.length).toBeGreaterThan(0);
      for (const v of values) {
        // GUIDs should be non-empty strings
        expect(typeof v).toBe('string');
      }
    });
  });
});
