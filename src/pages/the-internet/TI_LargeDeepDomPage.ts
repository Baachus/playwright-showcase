import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from '../BasePage.js';

/**
 * TI_LargeDeepDomPage
 * ─────────────────────────────────────────────────────────────────────────────
 * Represents the Large & Deep DOM page on the-internet.herokuapp.com (/large).
 */
export class TI_LargeDeepDomPage extends BasePage {
  // ── Locators ────────────────────────────────────────────────────────────────
  readonly title: Locator;
  readonly largeTable: Locator;
  readonly tableRows: Locator;
  readonly siblings: Locator;

  constructor(page: Page) {
    super(page);
    this.title = page.getByRole('heading', { name: 'Large & Deep DOM' });
    this.largeTable = page.locator('#large-table');
    this.tableRows = page.locator('#large-table tbody tr');
    this.siblings = page.locator('#siblings');
  }

  // ── Navigation ──────────────────────────────────────────────────────────────
  async goto(): Promise<void> {
    await this.page.goto('/large');
    await this.waitForPageLoad();
  }

  async waitForPageLoad(): Promise<void> {
    await this.title.waitFor({ state: 'visible' });
    await this.largeTable.waitFor({ state: 'visible' });
  }

  // ── Queries ─────────────────────────────────────────────────────────────────
  async getRowCount(): Promise<number> {
    return this.tableRows.count();
  }

  async getCellText(row: number, col: number): Promise<string> {
    return this.tableRows.nth(row).locator('td').nth(col).innerText();
  }

  // ── Assertions ──────────────────────────────────────────────────────────────
  async assertOnPage(): Promise<void> {
    await expect(this.page).toHaveURL(/\/large/);
  }

  async assertTableVisible(): Promise<void> {
    await expect(this.largeTable).toBeVisible();
  }

  async assertSiblingsVisible(): Promise<void> {
    await expect(this.siblings).toBeAttached();
  }

  async assertTableHasManyRows(): Promise<void> {
    const count = await this.getRowCount();
    expect(count).toBeGreaterThan(10);
  }
}
