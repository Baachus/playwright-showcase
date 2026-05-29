import { test, expect } from '../../../src/fixtures/index.js';
import { TI_IFramePage } from '../../../src/pages/the-internet/TI_IFramePage.js';
import * as allure from 'allure-js-commons';

test.beforeEach(async () => {
  await allure.epic('The Internet');
  await allure.feature('Frames (iFrame)');
});

test.describe('The Internet – iFrame', { tag: ['@ui', '@theinternethero', '@iframe'] }, () => {

  test('page loads with TinyMCE editor inside iframe', { tag: ['@smoke'] }, async ({ page }) => {
    await allure.allureId('TI-FR-001');
    await allure.story('Page Load');
    await allure.label('severity', 'critical');

    const frPage = new TI_IFramePage(page);
    await frPage.goto();

    await allure.step('Assert on correct URL', async () => {
      await frPage.assertOnPage();
    });

    await allure.step('Assert editor body inside iframe is visible', async () => {
      await frPage.assertEditorVisible();
    });
  });

  test('editor has default content on load', async ({ page }) => {
    await allure.allureId('TI-FR-002');
    await allure.story('Editor Content');
    await allure.label('severity', 'normal');

    const frPage = new TI_IFramePage(page);
    await frPage.goto();

    await allure.step('Get editor content and confirm it is non-empty', async () => {
      const content = await frPage.getEditorContent();
      expect(content.trim().length).toBeGreaterThan(0);
    });
  });

  //BUG: Currently this is not working due to TinyMCE not having more editor loads available on the application.
  test.skip('text can be typed into the editor', { tag: ['@smoke'] }, async ({ page }) => {
    await allure.allureId('TI-FR-003');
    await allure.story('Editor Interaction');
    await allure.label('severity', 'critical');

    const frPage = new TI_IFramePage(page);
    await frPage.goto();

    await allure.step('Clear editor and type new text', async () => {
      await frPage.clearAndTypeText('Hello from Playwright!');
    });

    await allure.step('Assert editor contains the typed text', async () => {
      await frPage.assertEditorContains('Hello from Playwright!');
    });
  });
});
