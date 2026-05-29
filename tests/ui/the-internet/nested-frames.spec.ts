import { test, expect } from '../../../src/fixtures/index.js';
import { TI_NestedFramesPage } from '../../../src/pages/the-internet/TI_NestedFramesPage.js';
import * as allure from 'allure-js-commons';

test.beforeEach(async () => {
  await allure.epic('The Internet');
  await allure.feature('Nested Frames');
});

test.describe('The Internet – Nested Frames', { tag: ['@ui', '@theinternethero', '@nested-frames'] }, () => {

  test('page loads and all named frames are present', { tag: ['@smoke'] }, async ({ page }) => {
    await allure.allureId('TI-NF-001');
    await allure.story('Page Load');
    await allure.label('severity', 'critical');

    const nfPage = new TI_NestedFramesPage(page);
    await nfPage.goto();

    await allure.step('Assert on correct URL', async () => {
      await nfPage.assertOnPage();
    });

    await allure.step('Assert all named frames are loaded', async () => {
      await nfPage.assertFramesLoaded();
    });
  });

  test('left frame contains the text LEFT', { tag: ['@smoke'] }, async ({ page }) => {
    await allure.allureId('TI-NF-002');
    await allure.story('Frame Content');
    await allure.label('severity', 'critical');

    const nfPage = new TI_NestedFramesPage(page);
    await nfPage.goto();

    await allure.step('Assert left frame contains LEFT', async () => {
      await nfPage.assertLeftFrameContains('LEFT');
    });
  });

  test('middle frame contains the text MIDDLE', { tag: ['@smoke'] }, async ({ page }) => {
    await allure.allureId('TI-NF-003');
    await allure.story('Frame Content');
    await allure.label('severity', 'critical');

    const nfPage = new TI_NestedFramesPage(page);
    await nfPage.goto();

    await allure.step('Assert middle frame contains MIDDLE', async () => {
      await nfPage.assertMiddleFrameContains('MIDDLE');
    });
  });

  test('right frame contains the text RIGHT', async ({ page }) => {
    await allure.allureId('TI-NF-004');
    await allure.story('Frame Content');
    await allure.label('severity', 'normal');

    const nfPage = new TI_NestedFramesPage(page);
    await nfPage.goto();

    await allure.step('Assert right frame contains RIGHT', async () => {
      await nfPage.assertRightFrameContains('RIGHT');
    });
  });

  test('bottom frame contains the text BOTTOM', async ({ page }) => {
    await allure.allureId('TI-NF-005');
    await allure.story('Frame Content');
    await allure.label('severity', 'normal');

    const nfPage = new TI_NestedFramesPage(page);
    await nfPage.goto();

    await allure.step('Assert bottom frame contains BOTTOM', async () => {
      await nfPage.assertBottomFrameContains('BOTTOM');
    });
  });
});
