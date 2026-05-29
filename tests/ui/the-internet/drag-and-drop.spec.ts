import { test, expect } from '../../../src/fixtures/index.js';
import { TI_DragAndDropPage } from '../../../src/pages/the-internet/TI_DragAndDropPage.js';
import * as allure from 'allure-js-commons';

test.beforeEach(async () => {
  await allure.epic('The Internet');
  await allure.feature('Drag and Drop');
});

test.describe('The Internet – Drag and Drop', { tag: ['@ui', '@theinternethero', '@drag-and-drop'] }, () => {

  test('page loads with columns A and B in default order', { tag: ['@smoke'] }, async ({ page }) => {
    await allure.allureId('TI-DD-001');
    await allure.story('Page Load');
    await allure.label('severity', 'critical');

    const ddPage = new TI_DragAndDropPage(page);
    await ddPage.goto();

    await allure.step('Assert on correct URL', async () => {
      await ddPage.assertOnPage();
    });

    await allure.step('Assert columns are in default A, B order', async () => {
      await ddPage.assertDefaultOrder();
    });
  });

  test('dragging column A onto column B swaps their positions', { tag: ['@smoke'] }, async ({ page }) => {
    await allure.allureId('TI-DD-002');
    await allure.story('Drag Interaction');
    await allure.label('severity', 'critical');

    const ddPage = new TI_DragAndDropPage(page);
    await ddPage.goto();

    await allure.step('Drag column A onto column B', async () => {
      await ddPage.dragAtoB();
    });

    await allure.step('Assert columns have swapped to B, A order', async () => {
      await ddPage.assertColumnAContains('B');
      await ddPage.assertColumnBContains('A');
    });
  });

  test('dragging back restores original order', async ({ page }) => {
    await allure.allureId('TI-DD-003');
    await allure.story('Drag Interaction');
    await allure.label('severity', 'normal');

    const ddPage = new TI_DragAndDropPage(page);
    await ddPage.goto();

    await allure.step('Swap columns A and B', async () => {
      await ddPage.dragAtoB();
    });

    await allure.step('Swap back', async () => {
      await ddPage.dragBtoA();
    });

    await allure.step('Assert columns are back in default order', async () => {
      await ddPage.assertDefaultOrder();
    });
  });

  test('column text is readable before drag', async ({ page }) => {
    await allure.allureId('TI-DD-004');
    await allure.story('Page Load');
    await allure.label('severity', 'minor');

    const ddPage = new TI_DragAndDropPage(page);
    await ddPage.goto();

    await allure.step('Read column header text', async () => {
      const colA = await ddPage.getColumnAText();
      const colB = await ddPage.getColumnBText();
      expect(colA).toBe('A');
      expect(colB).toBe('B');
    });
  });
});
