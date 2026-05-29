import { test, expect } from '../../../src/fixtures/index.js';
import { TI_SortableDataTablesPage } from '../../../src/pages/the-internet/TI_SortableDataTablesPage.js';
import * as allure from 'allure-js-commons';

test.beforeEach(async () => {
  await allure.epic('The Internet');
  await allure.feature('Sortable Data Tables');
});

test.describe('The Internet – Sortable Data Tables', { tag: ['@ui', '@theinternethero', '@sortable-tables'] }, () => {

  test('page loads with both tables visible', { tag: ['@smoke'] }, async ({ page }) => {
    await allure.allureId('TI-ST-001');
    await allure.story('Page Load');
    await allure.label('severity', 'critical');

    const stPage = new TI_SortableDataTablesPage(page);
    await stPage.goto();

    await allure.step('Assert on correct URL', async () => {
      await stPage.assertOnPage();
    });

    await allure.step('Assert both tables are visible', async () => {
      await stPage.assertBothTablesVisible();
    });
  });

  test('table 1 has rows with data', { tag: ['@smoke'] }, async ({ page }) => {
    await allure.allureId('TI-ST-002');
    await allure.story('Table Data');
    await allure.label('severity', 'critical');

    const stPage = new TI_SortableDataTablesPage(page);
    await stPage.goto();

    await allure.step('Assert table 1 has data rows', async () => {
      await stPage.assertTable1HasRows();
    });
  });

  test('clicking Last Name header sorts table 1 by last name ascending', { tag: ['@smoke'] }, async ({ page }) => {
    await allure.allureId('TI-ST-003');
    await allure.story('Sorting');
    await allure.label('severity', 'critical');

    const stPage = new TI_SortableDataTablesPage(page);
    await stPage.goto();

    await allure.step('Click Last Name header to sort ascending', async () => {
      await stPage.sortTable1By('Last Name');
    });

    await allure.step('Assert last name column is sorted A-Z', async () => {
      await stPage.assertTable1IsSortedAscending(0);
    });
  });

  test('table 1 cell text is readable', async ({ page }) => {
    await allure.allureId('TI-ST-004');
    await allure.story('Table Data');
    await allure.label('severity', 'normal');

    const stPage = new TI_SortableDataTablesPage(page);
    await stPage.goto();

    await allure.step('Read first cell of table 1 and assert non-empty', async () => {
      const text = await stPage.getTable1CellText(0, 0);
      expect(text.trim().length).toBeGreaterThan(0);
    });
  });

  test('table 2 has rows with data', async ({ page }) => {
    await allure.allureId('TI-ST-005');
    await allure.story('Table Data');
    await allure.label('severity', 'normal');

    const stPage = new TI_SortableDataTablesPage(page);
    await stPage.goto();

    await allure.step('Assert table 2 has rows', async () => {
      const count = await stPage.getTable2RowCount();
      expect(count).toBeGreaterThan(0);
    });
  });
});
