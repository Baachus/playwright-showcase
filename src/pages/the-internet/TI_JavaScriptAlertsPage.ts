import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from '../BasePage.js';

/**
 * TI_JavaScriptAlertsPage
 * ─────────────────────────────────────────────────────────────────────────────
 * Represents the JavaScript Alerts page on the-internet.herokuapp.com (/javascript_alerts).
 */
export class TI_JavaScriptAlertsPage extends BasePage {
  // ── Locators ────────────────────────────────────────────────────────────────
  readonly title: Locator;
  readonly alertButton: Locator;
  readonly confirmButton: Locator;
  readonly promptButton: Locator;
  readonly result: Locator;

  constructor(page: Page) {
    super(page);
    this.title = page.getByRole('heading', { name: 'JavaScript Alerts' });
    this.alertButton = page.getByRole('button', { name: 'Click for JS Alert' });
    this.confirmButton = page.getByRole('button', { name: 'Click for JS Confirm' });
    this.promptButton = page.getByRole('button', { name: 'Click for JS Prompt' });
    this.result = page.locator('#result');
  }

  // ── Navigation ──────────────────────────────────────────────────────────────
  async goto(): Promise<void> {
    await this.page.goto('/javascript_alerts');
    await this.waitForPageLoad();
  }

  async waitForPageLoad(): Promise<void> {
    await this.title.waitFor({ state: 'visible' });
  }

  // ── Actions ─────────────────────────────────────────────────────────────────
  /**
   * Click the JS Alert button and accept the alert. Returns the alert message.
   */
  async triggerAndAcceptAlert(): Promise<string> {
    let message = '';
    this.page.once('dialog', async (dialog) => {
      message = dialog.message();
      await dialog.accept();
    });
    await this.alertButton.click();
    await this.result.waitFor({ state: 'visible' });
    return message;
  }

  /**
   * Click the JS Confirm button and accept the confirmation dialog.
   */
  async triggerAndAcceptConfirm(): Promise<string> {
    let message = '';
    this.page.once('dialog', async (dialog) => {
      message = dialog.message();
      await dialog.accept();
    });
    await this.confirmButton.click();
    await this.result.waitFor({ state: 'visible' });
    return message;
  }

  /**
   * Click the JS Confirm button and dismiss the confirmation dialog.
   */
  async triggerAndDismissConfirm(): Promise<string> {
    let message = '';
    this.page.once('dialog', async (dialog) => {
      message = dialog.message();
      await dialog.dismiss();
    });
    await this.confirmButton.click();
    await this.result.waitFor({ state: 'visible' });
    return message;
  }

  /**
   * Click the JS Prompt button, type text in the prompt, and accept.
   */
  async triggerAndFillPrompt(inputText: string): Promise<string> {
    let message = '';
    this.page.once('dialog', async (dialog) => {
      message = dialog.message();
      await dialog.accept(inputText);
    });
    await this.promptButton.click();
    await this.result.waitFor({ state: 'visible' });
    return message;
  }

  /**
   * Click the JS Prompt button and dismiss the prompt (cancel).
   */
  async triggerAndDismissPrompt(): Promise<void> {
    this.page.once('dialog', async (dialog) => {
      await dialog.dismiss();
    });
    await this.promptButton.click();
    await this.result.waitFor({ state: 'visible' });
  }

  // ── Queries ─────────────────────────────────────────────────────────────────
  async getResultText(): Promise<string> {
    return this.result.innerText();
  }

  // ── Assertions ──────────────────────────────────────────────────────────────
  async assertOnPage(): Promise<void> {
    await expect(this.page).toHaveURL(/\/javascript_alerts/);
  }

  async assertResultContains(text: string): Promise<void> {
    await expect(this.result).toContainText(text);
  }
}
