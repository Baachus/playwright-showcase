import { test, expect } from '../../../src/fixtures/index.js';
import { TI_InputsPage } from '../../../src/pages/the-internet/TI_InputsPage.js';
import * as allure from 'allure-js-commons';

test.beforeEach(async () => {
  await allure.epic('The Internet');
  await allure.feature('Inputs');
});

test.describe('The Internet – Inputs', { tag: ['@ui', '@theinternethero', '@inputs'] }, () => {

  test('page loads with a number input', { tag: ['@smoke'] }, async ({ page }) => {
    await allure.allureId('TI-IN-001');
    await allure.story('Page Load');
    await allure.label('severity', 'critical');

    const inPage = new TI_InputsPage(page);
    await inPage.goto();

    await allure.step('Assert on correct URL', async () => {
      await inPage.assertOnPage();
    });

    await allure.step('Assert number input is visible', async () => {
      await inPage.assertInputVisible();
    });
  });

  test('typing a number sets the input value', { tag: ['@smoke'] }, async ({ page }) => {
    await allure.allureId('TI-IN-002');
    await allure.story('Input');
    await allure.label('severity', 'critical');

    const inPage = new TI_InputsPage(page);
    await inPage.goto();

    await allure.step('Type the number 42', async () => {
      await inPage.typeNumber(42);
    });

    await allure.step('Assert input value is 42', async () => {
      await inPage.assertInputValue('42');
    });
  });

  test('arrow up key increments the value', async ({ page }) => {
    await allure.allureId('TI-IN-003');
    await allure.story('Keyboard Interaction');
    await allure.label('severity', 'normal');

    const inPage = new TI_InputsPage(page);
    await inPage.goto();

    await allure.step('Set initial value to 5 and press ArrowUp once', async () => {
      await inPage.typeNumber(5);
      await inPage.pressArrowUp(1);
    });

    await allure.step('Assert value incremented to 6', async () => {
      await inPage.assertInputValue('6');
    });
  });

  test('arrow down key decrements the value', async ({ page }) => {
    await allure.allureId('TI-IN-004');
    await allure.story('Keyboard Interaction');
    await allure.label('severity', 'normal');

    const inPage = new TI_InputsPage(page);
    await inPage.goto();

    await allure.step('Set initial value to 10 and press ArrowDown once', async () => {
      await inPage.typeNumber(10);
      await inPage.pressArrowDown(1);
    });

    await allure.step('Assert value decremented to 9', async () => {
      await inPage.assertInputValue('9');
    });
  });

  test('input can be cleared', async ({ page }) => {
    await allure.allureId('TI-IN-005');
    await allure.story('Input');
    await allure.label('severity', 'minor');

    const inPage = new TI_InputsPage(page);
    await inPage.goto();

    await allure.step('Type a number then clear', async () => {
      await inPage.typeNumber(99);
      await inPage.clearInput();
    });

    await allure.step('Assert input is empty', async () => {
      await inPage.assertInputEmpty();
    });
  });
});
