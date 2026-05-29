import { test, expect } from '../../../src/fixtures/index.js';
import { TI_DropdownPage } from '../../../src/pages/the-internet/TI_DropdownPage.js';
import * as allure from 'allure-js-commons';

test.beforeEach(async () => {
  await allure.epic('The Internet');
  await allure.feature('Dropdown');
});

test.describe('The Internet – Dropdown', { tag: ['@ui', '@theinternethero', '@dropdown'] }, () => {

  test('page loads with dropdown showing placeholder text', { tag: ['@smoke'] }, async ({ page }) => {
    await allure.allureId('TI-DR-001');
    await allure.story('Page Load');
    await allure.label('severity', 'critical');

    const drPage = new TI_DropdownPage(page);
    await drPage.goto();

    await allure.step('Assert on correct URL', async () => {
      await drPage.assertOnPage();
    });

    await allure.step('Assert dropdown shows the placeholder option by default', async () => {
      await drPage.assertDefaultPlaceholderSelected();
    });
  });

  test('Option 1 can be selected', { tag: ['@smoke'] }, async ({ page }) => {
    await allure.allureId('TI-DR-002');
    await allure.story('Selection');
    await allure.label('severity', 'critical');

    const drPage = new TI_DropdownPage(page);
    await drPage.goto();

    await allure.step('Select Option 1', async () => {
      await drPage.selectOption1();
    });

    await allure.step('Assert Option 1 is selected', async () => {
      await drPage.assertOption1Selected();
    });
  });

  test('Option 2 can be selected', { tag: ['@smoke'] }, async ({ page }) => {
    await allure.allureId('TI-DR-003');
    await allure.story('Selection');
    await allure.label('severity', 'critical');

    const drPage = new TI_DropdownPage(page);
    await drPage.goto();

    await allure.step('Select Option 2', async () => {
      await drPage.selectOption2();
    });

    await allure.step('Assert Option 2 is selected', async () => {
      await drPage.assertOption2Selected();
    });
  });

  test('dropdown has exactly 3 options including placeholder', async ({ page }) => {
    await allure.allureId('TI-DR-004');
    await allure.story('Options');
    await allure.label('severity', 'normal');

    const drPage = new TI_DropdownPage(page);
    await drPage.goto();

    await allure.step('Get all option labels', async () => {
      const options = await drPage.getAllOptions();
      expect(options).toHaveLength(3);
      expect(options[0]).toBe('Please select an option');
      expect(options[1]).toBe('Option 1');
      expect(options[2]).toBe('Option 2');
    });
  });

  test('selection can be changed from option 1 to option 2', async ({ page }) => {
    await allure.allureId('TI-DR-005');
    await allure.story('Selection');
    await allure.label('severity', 'normal');

    const drPage = new TI_DropdownPage(page);
    await drPage.goto();

    await allure.step('Select Option 1 first', async () => {
      await drPage.selectOption1();
      await drPage.assertOption1Selected();
    });

    await allure.step('Switch to Option 2', async () => {
      await drPage.selectOption2();
      await drPage.assertOption2Selected();
    });
  });
});
