import { test, expect } from '../../../src/fixtures/index.js';
import { TI_HorizontalSliderPage } from '../../../src/pages/the-internet/TI_HorizontalSliderPage.js';
import * as allure from 'allure-js-commons';

test.beforeEach(async () => {
  await allure.epic('The Internet');
  await allure.feature('Horizontal Slider');
});

test.describe('The Internet – Horizontal Slider', { tag: ['@ui', '@theinternethero', '@horizontal-slider'] }, () => {

  test('page loads with slider and range display', { tag: ['@smoke'] }, async ({ page }) => {
    await allure.allureId('TI-HS-001');
    await allure.story('Page Load');
    await allure.label('severity', 'critical');

    const hsPage = new TI_HorizontalSliderPage(page);
    await hsPage.goto();

    await allure.step('Assert on correct URL', async () => {
      await hsPage.assertOnPage();
    });

    await allure.step('Assert slider and range value are visible', async () => {
      await hsPage.assertSliderVisible();
    });
  });

  test('slider can be moved to value 2.5 using keyboard', { tag: ['@smoke'] }, async ({ page }) => {
    await allure.allureId('TI-HS-002');
    await allure.story('Slider Interaction');
    await allure.label('severity', 'critical');

    const hsPage = new TI_HorizontalSliderPage(page);
    await hsPage.goto();

    await allure.step('Move slider to 2.5', async () => {
      await hsPage.moveSliderTo(2.5);
    });

    await allure.step('Assert range display shows 2.5', async () => {
      await hsPage.assertRangeValueIs('2.5');
    });
  });

  test('slider can be set to maximum value of 5', async ({ page }) => {
    await allure.allureId('TI-HS-003');
    await allure.story('Slider Interaction');
    await allure.label('severity', 'normal');

    const hsPage = new TI_HorizontalSliderPage(page);
    await hsPage.goto();

    await allure.step('Move slider to maximum value 5', async () => {
      await hsPage.moveSliderTo(5);
    });

    await allure.step('Assert range display shows 5', async () => {
      await hsPage.assertRangeValueIs('5');
    });
  });

  test('slider defaults to 0 on page load', async ({ page }) => {
    await allure.allureId('TI-HS-004');
    await allure.story('Default State');
    await allure.label('severity', 'normal');

    const hsPage = new TI_HorizontalSliderPage(page);
    await hsPage.goto();

    await allure.step('Assert initial slider value is 0', async () => {
      const value = await hsPage.getSliderInputValue();
      expect(value).toBe('0');
    });
  });
});
