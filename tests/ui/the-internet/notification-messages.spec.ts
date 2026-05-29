import { test, expect } from '../../../src/fixtures/index.js';
import { TI_NotificationMessagesPage } from '../../../src/pages/the-internet/TI_NotificationMessagesPage.js';
import * as allure from 'allure-js-commons';

test.beforeEach(async () => {
  await allure.epic('The Internet');
  await allure.feature('Notification Messages');
});

test.describe('The Internet – Notification Messages', { tag: ['@ui', '@theinternethero', '@notification-messages'] }, () => {

  test('page loads with heading and click-here link', { tag: ['@smoke'] }, async ({ page }) => {
    await allure.allureId('TI-NM-001');
    await allure.story('Page Load');
    await allure.label('severity', 'critical');

    const nmPage = new TI_NotificationMessagesPage(page);
    await nmPage.goto();

    await allure.step('Assert on correct URL', async () => {
      await nmPage.assertOnPage();
    });

    await allure.step('Assert click-here link is visible', async () => {
      await expect(nmPage.clickHereLink).toBeVisible();
    });
  });

  test('clicking the link shows a flash notification', { tag: ['@smoke'] }, async ({ page }) => {
    await allure.allureId('TI-NM-002');
    await allure.story('Notification');
    await allure.label('severity', 'critical');

    const nmPage = new TI_NotificationMessagesPage(page);
    await nmPage.goto();

    await allure.step('Click the link and wait for flash message', async () => {
      await nmPage.clickLink();
    });

    await allure.step('Assert flash message is visible and non-empty', async () => {
      await nmPage.assertFlashMessageVisible();
      await nmPage.assertFlashMessageNotEmpty();
    });
  });

  test('flash message is either success or error type', async ({ page }) => {
    await allure.allureId('TI-NM-003');
    await allure.story('Notification');
    await allure.label('severity', 'normal');

    const nmPage = new TI_NotificationMessagesPage(page);
    await nmPage.goto();

    await allure.step('Click link and check flash class', async () => {
      await nmPage.clickLink();
      const isSuccess = await nmPage.isFlashSuccess();
      const isError = await nmPage.isFlashError();
      // Flash must be one or the other
      expect(isSuccess || isError).toBe(true);
    });
  });

  test('multiple clicks each show a flash message', async ({ page }) => {
    await allure.allureId('TI-NM-004');
    await allure.story('Notification');
    await allure.label('severity', 'minor');

    const nmPage = new TI_NotificationMessagesPage(page);
    await nmPage.goto();

    await allure.step('Click link three times and verify flash each time', async () => {
      for (let i = 0; i < 3; i++) {
        await nmPage.clickLink();
        await nmPage.assertFlashMessageVisible();
        await nmPage.assertFlashMessageNotEmpty();
      }
    });
  });
});
