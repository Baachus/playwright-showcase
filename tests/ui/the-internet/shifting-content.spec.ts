import { test, expect } from '../../../src/fixtures/index.js';
import { TI_ShiftingContentPage } from '../../../src/pages/the-internet/TI_ShiftingContentPage.js';
import * as allure from 'allure-js-commons';

test.beforeEach(async () => {
  await allure.epic('The Internet');
  await allure.feature('Shifting Content');
});

test.describe('The Internet – Shifting Content', { tag: ['@ui', '@theinternethero', '@shifting-content'] }, () => {

  test('index page loads with links to three examples', { tag: ['@smoke'] }, async ({ page }) => {
    await allure.allureId('TI-SC-001');
    await allure.story('Page Load');
    await allure.label('severity', 'critical');

    const scPage = new TI_ShiftingContentPage(page);
    await scPage.goto();

    await allure.step('Assert on correct URL', async () => {
      await scPage.assertOnPage();
    });

    await allure.step('Assert all three example links are visible', async () => {
      await scPage.assertExampleLinksVisible();
    });
  });

  test('menu example page loads', async ({ page }) => {
    await allure.allureId('TI-SC-002');
    await allure.story('Sub-Examples');
    await allure.label('severity', 'normal');

    const scPage = new TI_ShiftingContentPage(page);

    await allure.step('Navigate to menu example', async () => {
      await scPage.gotoMenu();
    });

    await allure.step('Assert URL contains menu', async () => {
      await expect(page).toHaveURL(/\/shifting_content\/menu/);
    });
  });

  test('list example page loads', async ({ page }) => {
    await allure.allureId('TI-SC-003');
    await allure.story('Sub-Examples');
    await allure.label('severity', 'normal');

    const scPage = new TI_ShiftingContentPage(page);

    await allure.step('Navigate to list example', async () => {
      await scPage.gotoList();
    });

    await allure.step('Assert URL contains list', async () => {
      await expect(page).toHaveURL(/\/shifting_content\/list/);
    });
  });

  test('image example page loads', async ({ page }) => {
    await allure.allureId('TI-SC-004');
    await allure.story('Sub-Examples');
    await allure.label('severity', 'normal');

    const scPage = new TI_ShiftingContentPage(page);

    await allure.step('Navigate to image example', async () => {
      await scPage.gotoImage();
    });

    await allure.step('Assert URL contains image', async () => {
      await expect(page).toHaveURL(/\/shifting_content\/image/);
    });
  });
});
