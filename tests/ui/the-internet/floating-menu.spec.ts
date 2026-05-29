import { test, expect } from '../../../src/fixtures/index.js';
import { TI_FloatingMenuPage } from '../../../src/pages/the-internet/TI_FloatingMenuPage.js';
import * as allure from 'allure-js-commons';

test.beforeEach(async () => {
  await allure.epic('The Internet');
  await allure.feature('Floating Menu');
});

test.describe('The Internet – Floating Menu', { tag: ['@ui', '@theinternethero', '@floating-menu'] }, () => {

  test('page loads with all menu items visible', { tag: ['@smoke'] }, async ({ page }) => {
    await allure.allureId('TI-FM-001');
    await allure.story('Page Load');
    await allure.label('severity', 'critical');

    const fmPage = new TI_FloatingMenuPage(page);
    await fmPage.goto();

    await allure.step('Assert on correct URL', async () => {
      await fmPage.assertOnPage();
    });

    await allure.step('Assert all four menu items are visible', async () => {
      await fmPage.assertAllMenuItemsVisible();
    });
  });

  test('menu has exactly 4 items', async ({ page }) => {
    await allure.allureId('TI-FM-002');
    await allure.story('Menu Items');
    await allure.label('severity', 'normal');

    const fmPage = new TI_FloatingMenuPage(page);
    await fmPage.goto();

    await allure.step('Assert menu item count is 4', async () => {
      const count = await fmPage.getMenuItemCount();
      expect(count).toBe(4);
    });
  });

  test('menu remains visible after scrolling to bottom of page', { tag: ['@smoke'] }, async ({ page }) => {
    await allure.allureId('TI-FM-003');
    await allure.story('Floating Behaviour');
    await allure.label('severity', 'critical');

    const fmPage = new TI_FloatingMenuPage(page);
    await fmPage.goto();

    await allure.step('Scroll to the bottom of the page', async () => {
      await fmPage.scrollToBottom();
    });

    await allure.step('Assert menu is still visible in the viewport', async () => {
      await fmPage.assertMenuVisible();
      await fmPage.assertAllMenuItemsVisible();
    });
  });

  test('menu remains visible after scrolling back to top', async ({ page }) => {
    await allure.allureId('TI-FM-004');
    await allure.story('Floating Behaviour');
    await allure.label('severity', 'normal');

    const fmPage = new TI_FloatingMenuPage(page);
    await fmPage.goto();

    await allure.step('Scroll down then back up', async () => {
      await fmPage.scrollToBottom();
      await fmPage.scrollToTop();
    });

    await allure.step('Assert menu is still visible', async () => {
      await fmPage.assertMenuVisible();
    });
  });
});
