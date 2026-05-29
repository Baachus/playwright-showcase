import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from '../BasePage.js';

/**
 * TI_KeyPressesPage
 * ─────────────────────────────────────────────────────────────────────────────
 * Represents the Key Presses page on the-internet.herokuapp.com (/key_presses).
 */
export class TI_KeyPressesPage extends BasePage {
  // ── Locators ────────────────────────────────────────────────────────────────
  readonly title: Locator;
  readonly targetInput: Locator;
  readonly result: Locator;

  constructor(page: Page) {
    super(page);
    this.title = page.getByRole('heading', { name: 'Key Presses' });
    this.targetInput = page.locator('#target');
    this.result = page.locator('#result');
  }

  // ── Navigation ──────────────────────────────────────────────────────────────
  async goto(): Promise<void> {
    await this.page.goto('/key_presses');
    await this.waitForPageLoad();
  }

  async waitForPageLoad(): Promise<void> {
    await this.title.waitFor({ state: 'visible' });
    await this.targetInput.waitFor({ state: 'visible' });
  }

  // ── Actions ─────────────────────────────────────────────────────────────────
  async pressKey(key: string): Promise<void> {
    await this.targetInput.click();
    await this.page.keyboard.press(key);
    // Wait for result to contain text (more reliable than waiting for visibility)
    await expect(this.result).not.toBeEmpty({ timeout: 5000 });
  }

  async typeInInput(text: string): Promise<void> {
    await this.targetInput.fill(text);
  }

  // ── Queries ─────────────────────────────────────────────────────────────────
  async getResultText(): Promise<string> {
    return this.result.innerText();
  }

  // ── Assertions ──────────────────────────────────────────────────────────────
  async assertOnPage(): Promise<void> {
    await expect(this.page).toHaveURL(/\/key_presses/);
  }

  async assertResultContains(keyName: string): Promise<void> {
    await expect(this.result).toContainText(keyName);
  }

  async assertResultShowsKey(key: string): Promise<void> {
    await expect(this.result).toContainText(`You entered: ${key}`);
  }
}
