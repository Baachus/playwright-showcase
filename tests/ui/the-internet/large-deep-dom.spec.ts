import { test, expect } from '../../../src/fixtures/index.js';
import { TI_LargeDeepDomPage } from '../../../src/pages/the-internet/TI_LargeDeepDomPage.js';
import * as allure from 'allure-js-commons';

test.beforeEach(async () => {
  await allure.epic('The Internet');
  await allure.feature('Large & Deep DOM');
});

test.describe('The Internet – Large & Deep DOM', { tag: ['@ui', '@theinternethero', '@large-dom'] }, () => {

  test('page loads with large table and siblings div', { tag: ['@smoke'] }, async ({ page }) => {
    await allure.allureId('TI-LD-001');
    await allure.story('Page Load');
    await allure.label('severity', 'critical');

    const ldPage = new TI_LargeDeepDomPage(page);
    await ldPage.goto();

    await allure.step('Assert on correct URL', async () => {
      await ldPage.assertOnPage();
    });

    await allure.step('Assert table and siblings are visible', async () => {
      await ldPage.assertTableVisible();
      await ldPage.assertSiblingsVisible();
    });
  });

  test('table has many rows', { tag: ['@smoke'] }, async ({ page }) => {
    await allure.allureId('TI-LD-002');
    await allure.story('Table');
    await allure.label('severity', 'normal');

    const ldPage = new TI_LargeDeepDomPage(page);
    await ldPage.goto();

    await allure.step('Assert table has more than 10 rows', async () => {
      await ldPage.assertTableHasManyRows();
    });
  });

  test('table cell content is readable', async ({ page }) => {
    await allure.allureId('TI-LD-003');
    await allure.story('Table');
    await allure.label('severity', 'normal');

    const ldPage = new TI_LargeDeepDomPage(page);
    await ldPage.goto();

    await allure.step('Read first cell value and assert non-empty', async () => {
      const text = await ldPage.getCellText(0, 0);
      expect(text.trim().length).toBeGreaterThan(0);
    });
  });

  test('page loads within reasonable time despite DOM size', async ({ page }) => {
    await allure.allureId('TI-LD-004');
    await allure.story('Performance');
    await allure.label('severity', 'minor');

    const ldPage = new TI_LargeDeepDomPage(page);

    await allure.step('Navigate to large DOM page and confirm it loads', async () => {
      const start = Date.now();
      await ldPage.goto();
      const elapsed = Date.now() - start;
      // Should load within 15 seconds even on a slow connection
      expect(elapsed).toBeLessThan(15_000);
    });
  });
});
