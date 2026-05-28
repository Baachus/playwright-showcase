import { test, expect } from '../../../src/fixtures/index.js';
import { TI_KeyPressesPage } from '../../../src/pages/the-internet/TI_KeyPressesPage.js';
import * as allure from 'allure-js-commons';

test.beforeEach(async () => {
  await allure.epic('The Internet');
  await allure.feature('Key Presses');
});

test.describe('The Internet – Key Presses', { tag: ['@ui', '@theinternethero', '@key-presses'] }, () => {

  test('page loads with target input and result area', { tag: ['@smoke'] }, async ({ page }) => {
    await allure.allureId('TI-KP-001');
    await allure.story('Page Load');
    await allure.label('severity', 'critical');

    const kpPage = new TI_KeyPressesPage(page);
    await kpPage.goto();

    await allure.step('Assert on correct URL', async () => {
      await kpPage.assertOnPage();
    });

    await allure.step('Assert input is visible', async () => {
      await expect(kpPage.targetInput).toBeVisible();
    });
  });

  test('pressing Enter key shows RETURN in result', { tag: ['@smoke'] }, async ({ page }) => {
    await allure.allureId('TI-KP-002');
    await allure.story('Key Detection');
    await allure.label('severity', 'critical');

    const kpPage = new TI_KeyPressesPage(page);
    await kpPage.goto();

    await allure.step('Press Enter key', async () => {
      await kpPage.pressKey('Enter');
    });

    await allure.step('Assert result shows RETURN', async () => {
      await kpPage.assertResultShowsKey('RETURN');
    });
  });

  test('pressing letter A shows A in result', { tag: ['@smoke'] }, async ({ page }) => {
    await allure.allureId('TI-KP-003');
    await allure.story('Key Detection');
    await allure.label('severity', 'critical');

    const kpPage = new TI_KeyPressesPage(page);
    await kpPage.goto();

    await allure.step('Press the A key', async () => {
      await kpPage.pressKey('a');
    });

    await allure.step('Assert result shows A', async () => {
      await kpPage.assertResultShowsKey('A');
    });
  });

  test('pressing Tab key shows TAB in result', async ({ page }) => {
    await allure.allureId('TI-KP-004');
    await allure.story('Key Detection');
    await allure.label('severity', 'normal');

    const kpPage = new TI_KeyPressesPage(page);
    await kpPage.goto();

    await allure.step('Press Tab key', async () => {
      await kpPage.pressKey('Tab');
    });

    await allure.step('Assert result shows TAB', async () => {
      await kpPage.assertResultShowsKey('TAB');
    });
  });

  test('pressing Shift key shows SHIFT in result', async ({ page }) => {
    await allure.allureId('TI-KP-005');
    await allure.story('Key Detection');
    await allure.label('severity', 'normal');

    const kpPage = new TI_KeyPressesPage(page);
    await kpPage.goto();

    await allure.step('Press Shift key', async () => {
      await kpPage.pressKey('Shift');
    });

    await allure.step('Assert result shows SHIFT', async () => {
      await kpPage.assertResultShowsKey('SHIFT');
    });
  });
});
