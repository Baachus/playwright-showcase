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

  test('alert can be accepted after right-click', async ({ page }) => {
    await allure.allureId('TI-CM-003');
    await allure.story('Context Menu');
    await allure.label('severity', 'normal');

    const cmPage = new TI_ContextMenuPage(page);
    await cmPage.goto();

    await allure.step('Right-click the hot-spot and accept the alert', async () => {
      let dialogSeen = false;
      page.once('dialog', async (dialog) => {
        dialogSeen = true;
        expect(dialog.type()).toBe('alert');
        await dialog.accept();
      });
      await cmPage.hotSpot.click({ button: 'right' });
      await page.waitForTimeout(600);
      expect(dialogSeen).toBe(true);
    });

    await allure.step('Page should still be on context menu URL after dismissal', async () => {
      await cmPage.assertOnPage();
    });
  });
});
