import { test, expect } from '../../../src/fixtures/index.js';
import { TI_HoversPage } from '../../../src/pages/the-internet/TI_HoversPage.js';
import * as allure from 'allure-js-commons';

test.beforeEach(async () => {
  await allure.epic('The Internet');
  await allure.feature('Hovers');
});

test.describe('The Internet – Hovers', { tag: ['@ui', '@theinternethero', '@hovers'] }, () => {

  test('page loads with three figure elements', { tag: ['@smoke'] }, async ({ page }) => {
    await allure.allureId('TI-HV-001');
    await allure.story('Page Load');
    await allure.label('severity', 'critical');

    const hvPage = new TI_HoversPage(page);
    await hvPage.goto();

    await allure.step('Assert on correct URL', async () => {
      await hvPage.assertOnPage();
    });

    await allure.step('Assert three figures are present', async () => {
      await hvPage.assertThreeFiguresVisible();
    });
  });

  test('hovering the first figure reveals its caption', { tag: ['@smoke'] }, async ({ page }) => {
    await allure.allureId('TI-HV-002');
    await allure.story('Hover Interaction');
    await allure.label('severity', 'critical');

    const hvPage = new TI_HoversPage(page);
    await hvPage.goto();

    await allure.step('Hover over first figure and assert caption becomes visible', async () => {
      await hvPage.assertCaptionVisibleAfterHover(0);
    });
  });

  test('hovering the second figure reveals its caption', { tag: ['@smoke'] }, async ({ page }) => {
    await allure.allureId('TI-HV-003');
    await allure.story('Hover Interaction');
    await allure.label('severity', 'critical');

    const hvPage = new TI_HoversPage(page);
    await hvPage.goto();

    await allure.step('Hover over second figure and assert caption becomes visible', async () => {
      await hvPage.assertCaptionVisibleAfterHover(1);
    });
  });

  test('hovering the third figure reveals its caption', async ({ page }) => {
    await allure.allureId('TI-HV-004');
    await allure.story('Hover Interaction');
    await allure.label('severity', 'normal');

    const hvPage = new TI_HoversPage(page);
    await hvPage.goto();

    await allure.step('Hover over third figure and assert caption becomes visible', async () => {
      await hvPage.assertCaptionVisibleAfterHover(2);
    });
  });

  test('each caption contains a name heading and a profile link', async ({ page }) => {
    await allure.allureId('TI-HV-005');
    await allure.story('Caption Content');
    await allure.label('severity', 'normal');

    const hvPage = new TI_HoversPage(page);
    await hvPage.goto();

    await allure.step('Check captions for all three figures', async () => {
      for (let i = 0; i < 3; i++) {
        await hvPage.hoverFigure(i);
        const text = await hvPage.getCaptionText(i);
        expect(text.trim().length).toBeGreaterThan(0);
        const href = await hvPage.getCaptionLinkHref(i);
        expect(href).toContain('/users/');
      }
    });
  });
});
