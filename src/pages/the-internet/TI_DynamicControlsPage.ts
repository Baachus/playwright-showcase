import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from '../BasePage.js';

/**
 * TI_DynamicControlsPage
 * ─────────────────────────────────────────────────────────────────────────────
 * Represents the Dynamic Controls page on the-internet.herokuapp.com (/dynamic_controls).
 */
export class TI_DynamicControlsPage extends BasePage {
  // ── Locators ────────────────────────────────────────────────────────────────
  readonly title: Locator;
  readonly checkboxExample: Locator;
  readonly checkbox: Locator;
  readonly toggleCheckboxButton: Locator;
  readonly inputExample: Locator;
  readonly textInput: Locator;
  readonly enableDisableButton: Locator;
  readonly checkboxLoading: Locator;
  readonly inputLoading: Locator;
  readonly message: Locator;

  constructor(page: Page) {
    super(page);
    this.title = page.getByRole('heading', { name: 'Dynamic Controls' });
    this.checkboxExample = page.locator('#checkbox-example');
    this.checkbox = page.locator('#checkbox-example input[type="checkbox"]');
    this.toggleCheckboxButton = page.locator('#checkbox-example button');
    this.inputExample = page.locator('#input-example');
    this.textInput = page.locator('#input-example input[type="text"]');
    this.enableDisableButton = page.locator('#input-example button');
    this.checkboxLoading = page.locator('#checkbox-example #loading');
    this.inputLoading = page.locator('#input-example #loading').first();
    this.message = page.locator('#message');
  }

  // ── Navigation ──────────────────────────────────────────────────────────────
  async goto(): Promise<void> {
    await this.page.goto('/dynamic_controls');
    await this.waitForPageLoad();
  }

  async waitForPageLoad(): Promise<void> {
    await this.title.waitFor({ state: 'visible' });
  }

  // ── Actions ─────────────────────────────────────────────────────────────────
  /**
   * Click the Toggle button to add/remove the checkbox. Waits for the loading
   * indicator to disappear and the message to appear.
   */
  async toggleCheckbox(): Promise<void> {
    await this.toggleCheckboxButton.click();
    await this.checkboxLoading.waitFor({ state: 'hidden' });
    await this.message.waitFor({ state: 'visible' });
  }

  /**
   * Click the Enable/Disable button to toggle the text input state.
   * Waits for the loading indicator to disappear and the message to appear.
   */
  async toggleInput(): Promise<void> {
    await this.enableDisableButton.click();
    await this.inputLoading.waitFor({ state: 'hidden' });
    await this.message.waitFor({ state: 'visible' });
  }

  async typeInInput(text: string): Promise<void> {
    await this.textInput.fill(text);
  }

  // ── Queries ─────────────────────────────────────────────────────────────────
  async getMessageText(): Promise<string> {
    return this.message.innerText();
  }

  async isCheckboxPresent(): Promise<boolean> {
    return this.checkbox.isVisible();
  }

  async isInputEnabled(): Promise<boolean> {
    return this.textInput.isEnabled();
  }

  // ── Assertions ──────────────────────────────────────────────────────────────
  async assertOnPage(): Promise<void> {
    await expect(this.page).toHaveURL(/\/dynamic_controls/);
  }

  async assertCheckboxVisible(): Promise<void> {
    await expect(this.checkbox).toBeVisible();
  }

  async assertCheckboxRemoved(): Promise<void> {
    await expect(this.checkbox).not.toBeAttached();
  }

  async assertInputEnabled(): Promise<void> {
    await expect(this.textInput).toBeEnabled();
  }

  async assertInputDisabled(): Promise<void> {
    await expect(this.textInput).toBeDisabled();
  }

  async assertMessageContains(text: string): Promise<void> {
    await expect(this.message).toContainText(text);
  }
}
