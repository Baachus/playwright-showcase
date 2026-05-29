import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from '../BasePage.js';

/**
 * TI_InputsPage
 * ─────────────────────────────────────────────────────────────────────────────
 * Represents the Inputs page on the-internet.herokuapp.com (/inputs).
 * Contains a single number input that only accepts numeric values.
 */
export class TI_InputsPage extends BasePage {
  // ── Locators ────────────────────────────────────────────────────────────────
  readonly title: Locator;
  readonly numberInput: Locator;

  constructor(page: Page) {
    super(page);
    this.title = page.getByRole('heading', { name: 'Inputs' });
    this.numberInput = page.locator('input[type="number"]');
  }

  // ── Navigation ──────────────────────────────────────────────────────────────
  async goto(): Promise<void> {
    await this.page.goto('/inputs');
    await this.waitForPageLoad();
  }

  async waitForPageLoad(): Promise<void> {
    await this.title.waitFor({ state: 'visible' });
  }

  // ── Actions ─────────────────────────────────────────────────────────────────
  async typeNumber(value: number): Promise<void> {
    await this.numberInput.fill(String(value));
  }

  async clearInput(): Promise<void> {
    await this.numberInput.clear();
  }

  async pressArrowUp(times = 1): Promise<void> {
    await this.numberInput.focus();
    for (let i = 0; i < times; i++) {
      await this.page.keyboard.press('ArrowUp');
    }
  }

  async pressArrowDown(times = 1): Promise<void> {
    await this.numberInput.focus();
    for (let i = 0; i < times; i++) {
      await this.page.keyboard.press('ArrowDown');
    }
  }

  async typeNonNumeric(text: string): Promise<void> {
    await this.numberInput.click();
    await this.page.keyboard.type(text);
  }

  // ── Queries ─────────────────────────────────────────────────────────────────
  async getInputValue(): Promise<string> {
    return this.numberInput.inputValue();
  }

  // ── Assertions ──────────────────────────────────────────────────────────────
  async assertOnPage(): Promise<void> {
    await expect(this.page).toHaveURL(/\/inputs/);
  }

  async assertInputVisible(): Promise<void> {
    await expect(this.numberInput).toBeVisible();
  }

  async assertInputValue(expected: string): Promise<void> {
    await expect(this.numberInput).toHaveValue(expected);
  }

  async assertInputEmpty(): Promise<void> {
    await expect(this.numberInput).toHaveValue('');
  }
}
