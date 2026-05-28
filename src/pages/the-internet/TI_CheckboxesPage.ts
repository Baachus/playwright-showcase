import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from '../BasePage.js';

/**
 * TI_CheckboxesPage
 * ─────────────────────────────────────────────────────────────────────────────
 * Represents the Checkboxes page on the-internet.herokuapp.com (/checkboxes).
 */
export class TI_CheckboxesPage extends BasePage {
  // ── Locators ────────────────────────────────────────────────────────────────
  readonly title: Locator;
  readonly checkboxForm: Locator;
  readonly checkboxes: Locator;
  readonly checkbox1: Locator;
  readonly checkbox2: Locator;

  constructor(page: Page) {
    super(page);
    this.title = page.getByRole('heading', { name: 'Checkboxes' });
    this.checkboxForm = page.locator('form#checkboxes');
    this.checkboxes = page.locator('form#checkboxes input[type="checkbox"]');
    this.checkbox1 = page.locator('form#checkboxes input[type="checkbox"]').nth(0);
    this.checkbox2 = page.locator('form#checkboxes input[type="checkbox"]').nth(1);
  }

  // ── Navigation ──────────────────────────────────────────────────────────────
  async goto(): Promise<void> {
    await this.page.goto('/checkboxes');
    await this.waitForPageLoad();
  }

  async waitForPageLoad(): Promise<void> {
    await this.title.waitFor({ state: 'visible' });
  }

  // ── Queries ─────────────────────────────────────────────────────────────────
  async isCheckbox1Checked(): Promise<boolean> {
    return this.checkbox1.isChecked();
  }

  async isCheckbox2Checked(): Promise<boolean> {
    return this.checkbox2.isChecked();
  }

  async getCheckboxCount(): Promise<number> {
    return this.checkboxes.count();
  }

  // ── Actions ─────────────────────────────────────────────────────────────────
  async checkCheckbox1(): Promise<void> {
    await this.checkbox1.check();
  }

  async uncheckCheckbox1(): Promise<void> {
    await this.checkbox1.uncheck();
  }

  async checkCheckbox2(): Promise<void> {
    await this.checkbox2.check();
  }

  async uncheckCheckbox2(): Promise<void> {
    await this.checkbox2.uncheck();
  }

  async toggleCheckbox(index: 0 | 1): Promise<void> {
    await this.checkboxes.nth(index).click();
  }

  // ── Assertions ──────────────────────────────────────────────────────────────
  async assertOnPage(): Promise<void> {
    await expect(this.page).toHaveURL(/\/checkboxes/);
  }

  async assertCheckbox1IsChecked(): Promise<void> {
    await expect(this.checkbox1).toBeChecked();
  }

  async assertCheckbox1IsUnchecked(): Promise<void> {
    await expect(this.checkbox1).not.toBeChecked();
  }

  async assertCheckbox2IsChecked(): Promise<void> {
    await expect(this.checkbox2).toBeChecked();
  }

  async assertCheckbox2IsUnchecked(): Promise<void> {
    await expect(this.checkbox2).not.toBeChecked();
  }
}
