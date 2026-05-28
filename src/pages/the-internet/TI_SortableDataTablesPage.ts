import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from '../BasePage.js';

/**
 * TI_SortableDataTablesPage
 * ─────────────────────────────────────────────────────────────────────────────
 * Represents the Sortable Data Tables page on the-internet.herokuapp.com (/tables).
 * Two tables with sortable columns: Last Name, First Name, Email, Due, Web Site, Action.
 */
export class TI_SortableDataTablesPage extends BasePage {
  // ── Locators ────────────────────────────────────────────────────────────────
  readonly title: Locator;
  readonly table1: Locator;
  readonly table2: Locator;
  readonly table1Headers: Locator;
  readonly table2Headers: Locator;
  readonly table1Rows: Locator;
  readonly table2Rows: Locator;

  constructor(page: Page) {
    super(page);
    this.title = page.getByRole('heading', { name: 'Data Tables' });
    this.table1 = page.locator('#table1');
    this.table2 = page.locator('#table2');
    this.table1Headers = page.locator('#table1 thead th');
    this.table2Headers = page.locator('#table2 thead th');
    this.table1Rows = page.locator('#table1 tbody tr');
    this.table2Rows = page.locator('#table2 tbody tr');
  }

  // ── Navigation ──────────────────────────────────────────────────────────────
  async goto(): Promise<void> {
    await this.page.goto('/tables');
    await this.waitForPageLoad();
  }

  async waitForPageLoad(): Promise<void> {
    await this.title.waitFor({ state: 'visible' });
  }

  // ── Actions ─────────────────────────────────────────────────────────────────
  async sortTable1By(columnName: string): Promise<void> {
    await this.table1Headers.filter({ hasText: columnName }).click();
    await this.page.waitForTimeout(300);
  }

  async sortTable2By(columnName: string): Promise<void> {
    await this.table2Headers.filter({ hasText: columnName }).click();
    await this.page.waitForTimeout(300);
  }

  // ── Queries ─────────────────────────────────────────────────────────────────
  async getTable1RowCount(): Promise<number> {
    return this.table1Rows.count();
  }

  async getTable2RowCount(): Promise<number> {
    return this.table2Rows.count();
  }

  async getTable1ColumnValues(columnIndex: number): Promise<string[]> {
    const count = await this.table1Rows.count();
    const values: string[] = [];
    for (let i = 0; i < count; i++) {
      const cell = this.table1Rows.nth(i).locator('td').nth(columnIndex);
      values.push((await cell.innerText()).trim());
    }
    return values;
  }

  async getTable1CellText(row: number, col: number): Promise<string> {
    return this.table1Rows.nth(row).locator('td').nth(col).innerText();
  }

  // ── Assertions ──────────────────────────────────────────────────────────────
  async assertOnPage(): Promise<void> {
    await expect(this.page).toHaveURL(/\/tables/);
  }

  async assertBothTablesVisible(): Promise<void> {
    await expect(this.table1).toBeVisible();
    await expect(this.table2).toBeVisible();
  }

  async assertTable1HasRows(): Promise<void> {
    const count = await this.getTable1RowCount();
    expect(count).toBeGreaterThan(0);
  }

  async assertTable1IsSortedAscending(columnIndex: number): Promise<void> {
    const values = await this.getTable1ColumnValues(columnIndex);
    const sorted = [...values].sort((a, b) => a.localeCompare(b));
    expect(values).toEqual(sorted);
  }
}
