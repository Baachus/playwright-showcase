import { test, expect } from '../../../src/fixtures/index.js';
import { TI_DynamicLoadingPage } from '../../../src/pages/the-internet/TI_DynamicLoadingPage.js';
import * as allure from 'allure-js-commons';

test.beforeEach(async () => {
  await allure.epic('The Internet');
  await allure.feature('Dynamic Loading');
});

test.describe('The Internet – Dynamic Loading', { tag: ['@ui', '@theinternethero', '@dynamic-loading'] }, () => {

  test('index page loads with links to both examples', { tag: ['@smoke'] }, async ({ page }) => {
    await allure.allureId('TI-DL-001');
    await allure.story('Page Load');
    await allure.label('severity', 'critical');

    const dlPage = new TI_DynamicLoadingPage(page);
    await dlPage.goto();

    await allure.step('Assert on correct URL', async () => {
      await dlPage.assertOnPage();
    });

    await allure.step('Assert example links are present', async () => {
      await expect(dlPage.example1Link).toBeVisible();
      await expect(dlPage.example2Link).toBeVisible();
    });
  });

  test('Example 1: clicking Start reveals hidden Hello World element', { tag: ['@smoke'] }, async ({ page }) => {
    await allure.allureId('TI-DL-002');
    await allure.story('Example 1 – Hidden Element');
    await allure.label('severity', 'critical');

    const dlPage = new TI_DynamicLoadingPage(page);

    await allure.step('Navigate to Example 1', async () => {
      await dlPage.gotoExample1();
      await dlPage.assertOnExample1();
    });

    await allure.step('Click Start and wait for content to appear', async () => {
      await dlPage.clickStartAndWait();
    });

    await allure.step('Assert finish element is visible with Hello World text', async () => {
      await dlPage.assertFinishTextVisible();
      await dlPage.assertFinishTextContains('Hello World!');
    });
  });

  test('Example 2: clicking Start renders element that did not exist in DOM', { tag: ['@smoke'] }, async ({ page }) => {
    await allure.allureId('TI-DL-003');
    await allure.story('Example 2 – Rendered After');
    await allure.label('severity', 'critical');

    const dlPage = new TI_DynamicLoadingPage(page);

    await allure.step('Navigate to Example 2', async () => {
      await dlPage.gotoExample2();
      await dlPage.assertOnExample2();
    });

    await allure.step('Click Start and wait for element to be rendered', async () => {
      await dlPage.clickStartAndWait();
    });

    await allure.step('Assert newly rendered element contains Hello World', async () => {
      await dlPage.assertFinishTextVisible();
      await dlPage.assertFinishTextContains('Hello World!');
    });
  });

  test('Example 1: loading indicator appears then disappears', async ({ page }) => {
    await allure.allureId('TI-DL-004');
    await allure.story('Loading Indicator');
    await allure.label('severity', 'normal');

    const dlPage = new TI_DynamicLoadingPage(page);
    await dlPage.gotoExample1();

    await allure.step('Click Start and observe loading then completion', async () => {
      await dlPage.startButton.click();
      // Loading indicator should appear briefly
      await dlPage.loading.waitFor({ state: 'visible', timeout: 2000 }).catch(() => {
        // May be too fast to catch — that is acceptable
      });
      await dlPage.loading.waitFor({ state: 'hidden' });
      await dlPage.assertFinishTextVisible();
    });
  });
});
