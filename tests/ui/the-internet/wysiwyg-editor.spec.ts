import { test, expect } from '../../../src/fixtures/index.js';
import { TI_WYSIWYGEditorPage } from '../../../src/pages/the-internet/TI_WYSIWYGEditorPage.js';
import * as allure from 'allure-js-commons';

test.beforeEach(async () => {
  await allure.epic('The Internet');
  await allure.feature('WYSIWYG Editor');
});

test.describe('The Internet – WYSIWYG Editor', { tag: ['@ui', '@theinternethero', '@wysiwyg-editor'] }, () => {

  test('page loads with TinyMCE editor visible inside iframe', { tag: ['@smoke'] }, async ({ page }) => {
    await allure.allureId('TI-WY-001');
    await allure.story('Page Load');
    await allure.label('severity', 'critical');

    const wyPage = new TI_WYSIWYGEditorPage(page);
    await wyPage.goto();

    await allure.step('Assert on correct URL', async () => {
      await wyPage.assertOnPage();
    });

    await allure.step('Assert editor body is visible', async () => {
      await wyPage.assertEditorVisible();
    });
  });

  test('editor has default content on load', async ({ page }) => {
    await allure.allureId('TI-WY-002');
    await allure.story('Editor Content');
    await allure.label('severity', 'normal');

    const wyPage = new TI_WYSIWYGEditorPage(page);
    await wyPage.goto();

    await allure.step('Read editor content and confirm non-empty', async () => {
      const content = await wyPage.getEditorContent();
      expect(content.trim().length).toBeGreaterThan(0);
    });
  });

  test('text can be typed into the editor', { tag: ['@smoke'] }, async ({ page }) => {
    await allure.allureId('TI-WY-003');
    await allure.story('Editor Interaction');
    await allure.label('severity', 'critical');

    const wyPage = new TI_WYSIWYGEditorPage(page);
    await wyPage.goto();

    await allure.step('Clear editor and type custom text', async () => {
      await wyPage.clearAndTypeText('Playwright WYSIWYG test');
    });

    await allure.step('Assert editor contains the typed text', async () => {
      await wyPage.assertEditorContains('Playwright WYSIWYG test');
    });
  });

  test('text can be appended to existing content', async ({ page }) => {
    await allure.allureId('TI-WY-004');
    await allure.story('Editor Interaction');
    await allure.label('severity', 'normal');

    const wyPage = new TI_WYSIWYGEditorPage(page);
    await wyPage.goto();

    await allure.step('Append additional text to the editor', async () => {
      await wyPage.appendText(' - appended');
    });

    await allure.step('Assert appended text is present', async () => {
      await wyPage.assertEditorContains('appended');
    });
  });

  test('editor can be fully cleared', async ({ page }) => {
    await allure.allureId('TI-WY-005');
    await allure.story('Editor Interaction');
    await allure.label('severity', 'minor');

    const wyPage = new TI_WYSIWYGEditorPage(page);
    await wyPage.goto();

    await allure.step('Clear the editor', async () => {
      await wyPage.clearEditor();
    });

    await allure.step('Confirm editor is now empty', async () => {
      const content = await wyPage.getEditorContent();
      expect(content.trim()).toBe('');
    });
  });
});
