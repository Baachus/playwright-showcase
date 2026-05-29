import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from '../BasePage.js';

/**
 * TI_ChallengingDomPage
 * ─────────────────────────────────────────────────────────────────────────────
 * Represents the Challenging DOM page on the-internet.herokuapp.com (/challenging_dom).
 */
export class TI_ChallengingDomPage extends BasePage {
  // ── Locators ────────────────────────────────────────────────────────────────
  readonly title: Locator;
  readonly blueButton: Locator;
  readonly alertButton: Locator;
  readonly successButton: Locator;
  readonly table: Locator;
  readonly tableHeaders: Locator;
  readonly tableRows: Locator;
  readonly canvas: Locator;

  constructor(page: Page) {
    super(page);
    this.title = page.getByRole('heading', { name: 'Challenging DOM' });
    this.blueButton = page.locator('a.button').first();
    this.alertButton = page.locator('a.button.alert');
    this.successButton = page.locator('a.button.success');
    this.table = page.locator('.example table');
    this.tableHeaders = page.locator('.example table thead th');
    this.tableRows = page.locator('.example table tbody tr');
    this.canvas = page.locator('canvas');
  }

  // ── Navigation ──────────────────────────────────────────────────────────────
  async goto(): Promise<void> {
    await this.page.goto('/challenging_dom');
    await this.waitForPageLoad();
  }

  async waitForPageLoad(): Promise<void> {
    await this.title.waitFor({ state: 'visible' });
  }

  // ── Queries ─────────────────────────────────────────────────────────────────
  async getRowCount(): Promise<number> {
    return this.tableRows.count();
  }

  async getHeaderCount(): Promise<number> {
    return this.tableHeaders.count();
  }

  async getCellText(row: number, col: number): Promise<string> {
    return this.tableRows.nth(row).locator('td').nth(col).innerText();
  }

  // ── Assertions ──────────────────────────────────────────────────────────────
  async assertOnPage(): Promise<void> {
    await expect(this.page).toHaveURL(/\/challenging_dom/);
  }

  async assertButtonsVisible(): Promise<void> {
    await expect(this.blueButton).toBeVisible();
    await expect(this.alertButton).toBeVisible();
    await expect(this.successButton).toBeVisible();
  }

  async assertTableVisible(): Promise<void> {
    await expect(this.table).toBeVisible();
  }

  async assertCanvasVisible(): Promise<void> {
    await expect(this.canvas).toBeVisible();
  }
}
