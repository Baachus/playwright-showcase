import { test, expect } from '../../../src/fixtures/index.js';
import { TI_CheckboxesPage } from '../../../src/pages/the-internet/TI_CheckboxesPage.js';
import * as allure from 'allure-js-commons';

test.beforeEach(async () => {
  await allure.epic('The Internet');
  await allure.feature('Checkboxes');
});

test.describe('The Internet – Checkboxes', { tag: ['@ui', '@theinternethero', '@checkboxes'] }, () => {

  test('page loads with two checkboxes', { tag: ['@smoke'] }, async ({ page }) => {
    await allure.allureId('TI-CB-001');
    await allure.story('Page Load');
    await allure.label('severity', 'critical');

    const cbPage = new TI_CheckboxesPage(page);
    await cbPage.goto();

    await allure.step('Assert on correct URL', async () => {
      await cbPage.assertOnPage();
    });

    await allure.step('Assert two checkboxes are present', async () => {
      const count = await cbPage.getCheckboxCount();
      expect(count).toBe(2);
    });
  });

  test('checkbox 1 is unchecked and checkbox 2 is checked by default', { tag: ['@smoke'] }, async ({ page }) => {
    await allure.allureId('TI-CB-002');
    await allure.story('Default State');
    await allure.label('severity', 'critical');

    const cbPage = new TI_CheckboxesPage(page);
    await cbPage.goto();

    await allure.step('Assert checkbox 1 is unchecked by default', async () => {
      await cbPage.assertCheckbox1IsUnchecked();
    });

    await allure.step('Assert checkbox 2 is checked by default', async () => {
      await cbPage.assertCheckbox2IsChecked();
    });
  });

  test('checkbox 1 can be checked', async ({ page }) => {
    await allure.allureId('TI-CB-003');
    await allure.story('Interaction');
    await allure.label('severity', 'normal');

    const cbPage = new TI_CheckboxesPage(page);
    await cbPage.goto();

    await allure.step('Check checkbox 1', async () => {
      await cbPage.checkCheckbox1();
    });

    await allure.step('Assert checkbox 1 is now checked', async () => {
      await cbPage.assertCheckbox1IsChecked();
    });
  });

  test('checkbox 2 can be unchecked', async ({ page }) => {
    await allure.allureId('TI-CB-004');
    await allure.story('Interaction');
    await allure.label('severity', 'normal');

    const cbPage = new TI_CheckboxesPage(page);
    await cbPage.goto();

    await allure.step('Uncheck checkbox 2', async () => {
      await cbPage.uncheckCheckbox2();
    });

    await allure.step('Assert checkbox 2 is now unchecked', async () => {
      await cbPage.assertCheckbox2IsUnchecked();
    });
  });

  test('both checkboxes can be toggled independently', async ({ page }) => {
    await allure.allureId('TI-CB-005');
    await allure.story('Interaction');
    await allure.label('severity', 'normal');

    const cbPage = new TI_CheckboxesPage(page);
    await cbPage.goto();

    await allure.step('Check both checkboxes', async () => {
      await cbPage.checkCheckbox1();
      // checkbox 2 is already checked by default
    });

    await allure.step('Both checkboxes should be checked', async () => {
      await cbPage.assertCheckbox1IsChecked();
      await cbPage.assertCheckbox2IsChecked();
    });

    await allure.step('Uncheck both checkboxes', async () => {
      await cbPage.uncheckCheckbox1();
      await cbPage.uncheckCheckbox2();
    });

    await allure.step('Both checkboxes should be unchecked', async () => {
      await cbPage.assertCheckbox1IsUnchecked();
      await cbPage.assertCheckbox2IsUnchecked();
    });
  });
});
