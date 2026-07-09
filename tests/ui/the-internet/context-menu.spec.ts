import { test, expect } from '../../../src/fixtures/index.js';
import { TI_ContextMenuPage } from '../../../src/pages/the-internet/TI_ContextMenuPage.js';
import * as allure from 'allure-js-commons';

test.beforeEach(async () => {
  await allure.epic('The Internet');
  await allure.feature('Context Menu');
});

test.describe('The Internet – Context Menu', { tag: ['@ui', '@theinternethero', '@context-menu'] }, () => {

  test('page loads with hot-spot element visible', { tag: ['@smoke'] }, async ({ page }) => {
    await allure.allureId('TI-CM-001');
    await allure.story('Page Load');
    await allure.label('severity', 'critical');

    const cmPage = new TI_ContextMenuPage(page);
    await cmPage.goto();

    await allure.step('Assert on correct URL', async () => {
      await cmPage.assertOnPage();
    });

    await allure.step('Assert hot-spot is visible', async () => {
      await cmPage.assertHotSpotVisible();
    });
  });

  test('right-clicking hot-spot triggers an alert dialog', { tag: ['@smoke'] }, async ({ page }) => {
    await allure.allureId('TI-CM-002');
    await allure.story('Context Menu');
    await allure.label('severity', 'critical');

    const cmPage = new TI_ContextMenuPage(page);
    await cmPage.goto();

    await allure.step('Right-click the hot-spot and capture the alert message', async () => {
      const message = await cmPage.rightClickHotSpot();
      expect(message).toBe('You selected a context menu');
    });
  });
});
