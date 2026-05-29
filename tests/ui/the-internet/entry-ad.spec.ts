import { test, expect } from '../../../src/fixtures/index.js';
import { TI_EntryAdPage } from '../../../src/pages/the-internet/TI_EntryAdPage.js';
import * as allure from 'allure-js-commons';

test.beforeEach(async () => {
  await allure.epic('The Internet');
  await allure.feature('Entry Ad');
});

test.describe('The Internet – Entry Ad', { tag: ['@ui', '@theinternethero', '@entry-ad'] }, () => {

  test('page loads and modal appears on entry', { tag: ['@smoke'] }, async ({ page }) => {
    await allure.allureId('TI-EA-001');
    await allure.story('Modal Appearance');
    await allure.label('severity', 'critical');

    const eaPage = new TI_EntryAdPage(page);
    await eaPage.goto();

    await allure.step('Assert on correct URL', async () => {
      await eaPage.assertOnPage();
    });

    await allure.step('Wait for and assert modal is visible', async () => {
      await eaPage.waitForModalVisible();
      await eaPage.assertModalVisible();
    });
  });

  test('modal can be closed by clicking the close button', { tag: ['@smoke'] }, async ({ page }) => {
    await allure.allureId('TI-EA-002');
    await allure.story('Modal Dismiss');
    await allure.label('severity', 'critical');

    const eaPage = new TI_EntryAdPage(page);
    await eaPage.goto();

    await allure.step('Wait for modal to appear', async () => {
      await eaPage.waitForModalVisible();
    });

    await allure.step('Close the modal', async () => {
      await eaPage.closeModal();
    });

    await allure.step('Assert modal is no longer visible', async () => {
      await eaPage.assertModalHidden();
    });
  });

  test('modal title is readable', async ({ page }) => {
    await allure.allureId('TI-EA-004');
    await allure.story('Modal Content');
    await allure.label('severity', 'minor');

    const eaPage = new TI_EntryAdPage(page);
    await eaPage.goto();

    await allure.step('Read modal title text', async () => {
      await eaPage.waitForModalVisible();
      const titleText = await eaPage.getModalTitleText();
      expect(titleText.trim().length).toBeGreaterThan(0);
    });
  });
});