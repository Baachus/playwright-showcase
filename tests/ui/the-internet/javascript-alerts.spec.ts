import { test, expect } from '../../../src/fixtures/index.js';
import { TI_JavaScriptAlertsPage } from '../../../src/pages/the-internet/TI_JavaScriptAlertsPage.js';
import * as allure from 'allure-js-commons';

test.beforeEach(async () => {
  await allure.epic('The Internet');
  await allure.feature('JavaScript Alerts');
});

test.describe('The Internet – JavaScript Alerts', { tag: ['@ui', '@theinternethero', '@js-alerts'] }, () => {

  test('page loads with all three alert buttons', { tag: ['@smoke'] }, async ({ page }) => {
    await allure.allureId('TI-JA-001');
    await allure.story('Page Load');
    await allure.label('severity', 'critical');

    const jaPage = new TI_JavaScriptAlertsPage(page);
    await jaPage.goto();

    await allure.step('Assert on correct URL', async () => {
      await jaPage.assertOnPage();
    });

    await allure.step('Assert all three buttons are visible', async () => {
      await expect(jaPage.alertButton).toBeVisible();
      await expect(jaPage.confirmButton).toBeVisible();
      await expect(jaPage.promptButton).toBeVisible();
    });
  });

  test('JS Alert fires dialog and result shows accepted', { tag: ['@smoke'] }, async ({ page }) => {
    await allure.allureId('TI-JA-002');
    await allure.story('JS Alert');
    await allure.label('severity', 'critical');

    const jaPage = new TI_JavaScriptAlertsPage(page);
    await jaPage.goto();

    await allure.step('Trigger alert and accept', async () => {
      const message = await jaPage.triggerAndAcceptAlert();
      expect(message).toBe('I am a JS Alert');
    });

    await allure.step('Assert result shows alert was accepted', async () => {
      await jaPage.assertResultContains('You successfully clicked an alert');
    });
  });

  test('JS Confirm accepted shows OK in result', { tag: ['@smoke'] }, async ({ page }) => {
    await allure.allureId('TI-JA-003');
    await allure.story('JS Confirm');
    await allure.label('severity', 'critical');

    const jaPage = new TI_JavaScriptAlertsPage(page);
    await jaPage.goto();

    await allure.step('Trigger confirm and accept', async () => {
      await jaPage.triggerAndAcceptConfirm();
    });

    await allure.step('Assert result shows OK', async () => {
      await jaPage.assertResultContains('Ok');
    });
  });

  test('JS Confirm dismissed shows Cancel in result', async ({ page }) => {
    await allure.allureId('TI-JA-004');
    await allure.story('JS Confirm');
    await allure.label('severity', 'normal');

    const jaPage = new TI_JavaScriptAlertsPage(page);
    await jaPage.goto();

    await allure.step('Trigger confirm and dismiss', async () => {
      await jaPage.triggerAndDismissConfirm();
    });

    await allure.step('Assert result shows Cancel', async () => {
      await jaPage.assertResultContains('Cancel');
    });
  });

  test('JS Prompt with input echoes the text in result', { tag: ['@smoke'] }, async ({ page }) => {
    await allure.allureId('TI-JA-005');
    await allure.story('JS Prompt');
    await allure.label('severity', 'critical');

    const jaPage = new TI_JavaScriptAlertsPage(page);
    await jaPage.goto();

    await allure.step('Trigger prompt, type text and accept', async () => {
      await jaPage.triggerAndFillPrompt('Hello Playwright');
    });

    await allure.step('Assert result contains the typed text', async () => {
      await jaPage.assertResultContains('Hello Playwright');
    });
  });

  test('JS Prompt dismissed shows null in result', async ({ page }) => {
    await allure.allureId('TI-JA-006');
    await allure.story('JS Prompt');
    await allure.label('severity', 'normal');

    const jaPage = new TI_JavaScriptAlertsPage(page);
    await jaPage.goto();

    await allure.step('Trigger prompt and dismiss', async () => {
      await jaPage.triggerAndDismissPrompt();
    });

    await allure.step('Assert result shows null', async () => {
      await jaPage.assertResultContains('null');
    });
  });
});
