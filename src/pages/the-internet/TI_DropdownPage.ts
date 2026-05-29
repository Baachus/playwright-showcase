import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from '../BasePage.js';

/**
 * TI_DropdownPage
 * ─────────────────────────────────────────────────────────────────────────────
 * Represents the Dropdown page on the-internet.herokuapp.com (/dropdown).
 */
export class TI_DropdownPage extends BasePage {
  // ── Locators ────────────────────────────────────────────────────────────────
  readonly title: Locator;
  readonly dropdown: Locator;

  constructor(page: Page) {
    super(page);
    this.title = page.getByRole('heading', { name: 'Dropdown List' });
    this.dropdown = page.locator('select#dropdown');
  }

  // ── Navigation ──────────────────────────────────────────────────────────────
  async goto(): Promise<void> {
    await this.page.goto('/dropdown');
    await this.waitForPageLoad();
  }

  async waitForPageLoad(): Promise<void> {
    await this.title.waitFor({ state: 'visible' });
  }

  // ── Queries ─────────────────────────────────────────────────────────────────
  async getSelectedOptionText(): Promise<string> {
    return this.dropdown.evaluate((el: HTMLSelectElement) => el.options[el.selectedIndex].text);
  }

  async getSelectedOptionValue(): Promise<string> {
    return this.dropdown.inputValue();
  }

  async getAllOptions(): Promise<string[]> {
    return this.dropdown.evaluate((el: HTMLSelectElement) =>
      Array.from(el.options).map(o => o.text)
    );
  }

  // ── Actions ─────────────────────────────────────────────────────────────────
  async selectOption1(): Promise<void> {
    await this.dropdown.selectOption('1');
  }

  async selectOption2(): Promise<void> {
    await this.dropdown.selectOption('2');
  }

  async selectByLabel(label: string): Promise<void> {
    await this.dropdown.selectOption({ label });
  }

  // ── Assertions ──────────────────────────────────────────────────────────────
  async assertOnPage(): Promise<void> {
    await expect(this.page).toHaveURL(/\/dropdown/);
  }

  async assertOption1Selected(): Promise<void> {
    await expect(this.dropdown).toHaveValue('1');
  }

  async assertOption2Selected(): Promise<void> {
    await expect(this.dropdown).toHaveValue('2');
  }

  async assertDefaultPlaceholderSelected(): Promise<void> {
    const text = await this.getSelectedOptionText();
    expect(text).toBe('Please select an option');
  }
}
