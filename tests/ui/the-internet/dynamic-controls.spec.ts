import { test, expect } from '../../../src/fixtures/index.js';
import { TI_DynamicControlsPage } from '../../../src/pages/the-internet/TI_DynamicControlsPage.js';
import * as allure from 'allure-js-commons';

test.beforeEach(async () => {
  await allure.epic('The Internet');
  await allure.feature('Dynamic Controls');
});

test.describe('The Internet – Dynamic Controls', { tag: ['@ui', '@theinternethero', '@dynamic-controls'] }, () => {

  test('page loads with checkbox and disabled input visible', { tag: ['@smoke'] }, async ({ page }) => {
    await allure.allureId('TI-DCO-001');
    await allure.story('Page Load');
    await allure.label('severity', 'critical');

    const dcoPage = new TI_DynamicControlsPage(page);
    await dcoPage.goto();

    await allure.step('Assert on correct URL', async () => {
      await dcoPage.assertOnPage();
    });

    await allure.step('Assert checkbox is visible', async () => {
      await dcoPage.assertCheckboxVisible();
    });

    await allure.step('Assert input is disabled by default', async () => {
      await dcoPage.assertInputDisabled();
    });
  });

  test('toggle button removes and adds the checkbox', { tag: ['@smoke'] }, async ({ page }) => {
    await allure.allureId('TI-DCO-002');
    await allure.story('Checkbox Toggle');
    await allure.label('severity', 'critical');

    const dcoPage = new TI_DynamicControlsPage(page);
    await dcoPage.goto();

    await allure.step('Click toggle to remove checkbox', async () => {
      await dcoPage.toggleCheckbox();
    });

    await allure.step('Assert checkbox is removed from DOM', async () => {
      await dcoPage.assertCheckboxRemoved();
    });

    await allure.step('Assert message says checkbox is gone', async () => {
      await dcoPage.assertMessageContains("It's gone!");
    });
  });

  test('enable button enables the text input', { tag: ['@smoke'] }, async ({ page }) => {
    await allure.allureId('TI-DCO-003');
    await allure.story('Input Enable/Disable');
    await allure.label('severity', 'critical');

    const dcoPage = new TI_DynamicControlsPage(page);
    await dcoPage.goto();

    await allure.step('Click enable/disable to enable the input', async () => {
      await dcoPage.toggleInput();
    });

    await allure.step('Assert input is now enabled', async () => {
      await dcoPage.assertInputEnabled();
    });

    await allure.step('Assert message says input is enabled', async () => {
      await dcoPage.assertMessageContains("It's enabled!");
    });
  });

  test('enabled input accepts text entry', async ({ page }) => {
    await allure.allureId('TI-DCO-004');
    await allure.story('Input Enable/Disable');
    await allure.label('severity', 'normal');

    const dcoPage = new TI_DynamicControlsPage(page);
    await dcoPage.goto();

    await allure.step('Enable the input', async () => {
      await dcoPage.toggleInput();
      await dcoPage.assertInputEnabled();
    });

    await allure.step('Type text into the input', async () => {
      await dcoPage.typeInInput('Hello World');
      const value = await dcoPage.textInput.inputValue();
      expect(value).toBe('Hello World');
    });
  });

  test('re-disabling input after enabling works correctly', async ({ page }) => {
    await allure.allureId('TI-DCO-005');
    await allure.story('Input Enable/Disable');
    await allure.label('severity', 'normal');

    const dcoPage = new TI_DynamicControlsPage(page);
    await dcoPage.goto();

    await allure.step('Enable the input', async () => {
      await dcoPage.toggleInput();
      await dcoPage.assertInputEnabled();
    });

    await allure.step('Disable the input again', async () => {
      await dcoPage.toggleInput();
      await dcoPage.assertInputDisabled();
    });

    await allure.step('Assert message says input is disabled', async () => {
      await dcoPage.assertMessageContains("It's disabled!");
    });
  });
});
