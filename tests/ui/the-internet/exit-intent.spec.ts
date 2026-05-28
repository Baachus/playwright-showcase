import { test, expect } from '../../../src/fixtures/index.js';
import { TI_ExitIntentPage } from '../../../src/pages/the-internet/TI_ExitIntentPage.js';
import * as allure from 'allure-js-commons';

test.beforeEach(async () => {
  await allure.epic('The Internet');
  await allure.feature('Exit Intent');
});

test.describe('The Internet – Exit Intent', { tag: ['@ui', '@theinternethero', '@exit-intent'] }, () => {

  test('page loads without modal initially', { tag: ['@smoke'] }, async ({ page }) => {
    await allure.allureId('TI-EI-001');
    await allure.story('Page Load');
    await allure.label('severity', 'critical');

    const eiPage = new TI_ExitIntentPage(page);
    await eiPage.goto();

    await allure.step('Assert on correct URL', async () => {
      await eiPage.assertOnPage();
    });

    await allure.step('Assert title is visible', async () => {
      await expect(eiPage.title).toBeVisible();
    });
  });

  test('moving mouse to top of viewport triggers exit-intent modal', { tag: ['@smoke'] }, async ({ page }) => {
    await allure.allureId('TI-EI-002');
    await allure.story('Exit Intent Trigger');
    await allure.label('severity', 'critical');

    const eiPage = new TI_ExitIntentPage(page);
    await eiPage.goto();

    await allure.step('Trigger exit intent by moving mouse to top of viewport', async () => {
      await eiPage.triggerExitIntent();
    });

    await allure.step('Assert modal is visible', async () => {
      await eiPage.assertModalVisible();
    });
  });

  test('exit-intent modal can be closed', async ({ page }) => {
    await allure.allureId('TI-EI-003');
    await allure.story('Modal Dismiss');
    await allure.label('severity', 'normal');

    const eiPage = new TI_ExitIntentPage(page);
    await eiPage.goto();

    await allure.step('Trigger exit intent and wait for modal', async () => {
      await eiPage.triggerExitIntent();
      await eiPage.assertModalVisible();
    });

    await allure.step('Close the modal', async () => {
      await eiPage.closeModal();
    });

    await allure.step('Assert modal is hidden', async () => {
      await eiPage.assertModalHidden();
    });
  });
});
