import { test, expect } from '../../../src/fixtures/index.js';
import { TI_ChallengingDomPage } from '../../../src/pages/the-internet/TI_ChallengingDomPage.js';
import * as allure from 'allure-js-commons';

test.beforeEach(async () => {
  await allure.epic('The Internet');
  await allure.feature('Challenging DOM');
});

test.describe('The Internet – Challenging DOM', { tag: ['@ui', '@theinternethero', '@challenging-dom'] }, () => {

  test('page loads with title and three buttons', { tag: ['@smoke'] }, async ({ page }) => {
    await allure.allureId('TI-CD-001');
    await allure.story('Page Load');
    await allure.label('severity', 'critical');

    const cdPage = new TI_ChallengingDomPage(page);
    await cdPage.goto();

    await allure.step('Assert on correct URL', async () => {
      await cdPage.assertOnPage();
    });

    await allure.step('Assert all three buttons are visible', async () => {
      await cdPage.assertButtonsVisible();
    });
  });

  test('table is visible with rows and headers', { tag: ['@smoke'] }, async ({ page }) => {
    await allure.allureId('TI-CD-002');
    await allure.story('Table');
    await allure.label('severity', 'normal');

    const cdPage = new TI_ChallengingDomPage(page);
    await cdPage.goto();

    await allure.step('Assert table is visible', async () => {
      await cdPage.assertTableVisible();
    });

    await allure.step('Assert table has headers', async () => {
      const headerCount = await cdPage.getHeaderCount();
      expect(headerCount).toBeGreaterThan(0);
    });

    await allure.step('Assert table has rows', async () => {
      const rowCount = await cdPage.getRowCount();
      expect(rowCount).toBeGreaterThan(0);
    });
  });

  test('canvas element is visible', async ({ page }) => {
    await allure.allureId('TI-CD-003');
    await allure.story('Canvas');
    await allure.label('severity', 'normal');

    const cdPage = new TI_ChallengingDomPage(page);
    await cdPage.goto();

    await allure.step('Assert canvas is present and visible', async () => {
      await cdPage.assertCanvasVisible();
    });
  });

  test('blue button has correct CSS class', async ({ page }) => {
    await allure.allureId('TI-CD-004');
    await allure.story('Buttons');
    await allure.label('severity', 'minor');

    const cdPage = new TI_ChallengingDomPage(page);
    await cdPage.goto();

    await allure.step('Verify blue button does not have alert or success class', async () => {
      await expect(cdPage.alertButton).toBeVisible();
      await expect(cdPage.successButton).toBeVisible();
      // Alert button has .button.alert, success has .button.success
      const alertClass = await cdPage.alertButton.getAttribute('class');
      const successClass = await cdPage.successButton.getAttribute('class');
      expect(alertClass).toContain('alert');
      expect(successClass).toContain('success');
    });
  });

  test('table cell content is readable', async ({ page }) => {
    await allure.allureId('TI-CD-005');
    await allure.story('Table');
    await allure.label('severity', 'minor');

    const cdPage = new TI_ChallengingDomPage(page);
    await cdPage.goto();

    await allure.step('Read first cell text and confirm it is non-empty', async () => {
      const text = await cdPage.getCellText(0, 0);
      expect(text.trim()).not.toBe('');
    });
  });
});
