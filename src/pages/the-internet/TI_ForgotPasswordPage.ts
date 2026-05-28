import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from '../BasePage.js';

/**
 * TI_ForgotPasswordPage
 * ─────────────────────────────────────────────────────────────────────────────
 * Represents the Forgot Password page on the-internet.herokuapp.com (/forgot_password).
 */
export class TI_ForgotPasswordPage extends BasePage {
  // ── Locators ────────────────────────────────────────────────────────────────
  readonly title: Locator;
  readonly emailInput: Locator;
  readonly submitButton: Locator;

  constructor(page: Page) {
    super(page);
    this.title = page.getByRole('heading', { name: 'Forgot Password' });
    this.emailInput = page.locator('#email');
    this.submitButton = page.locator('#form_submit');
  }

  // ── Navigation ──────────────────────────────────────────────────────────────
  async goto(): Promise<void> {
    await this.page.goto('/forgot_password');
    await this.waitForPageLoad();
  }

  async waitForPageLoad(): Promise<void> {
    await this.title.waitFor({ state: 'visible' });
  }

  // ── Actions ─────────────────────────────────────────────────────────────────
  async enterEmail(email: string): Promise<void> {
    await this.emailInput.fill(email);
  }

  async submit(): Promise<void> {
    await this.submitButton.click();
  }

  async requestPasswordReset(email: string): Promise<void> {
    await this.enterEmail(email);
    await this.submit();
  }

  // ── Queries ─────────────────────────────────────────────────────────────────
  async getEmailValue(): Promise<string> {
    return this.emailInput.inputValue();
  }

  // ── Assertions ──────────────────────────────────────────────────────────────
  async assertOnPage(): Promise<void> {
    await expect(this.page).toHaveURL(/\/forgot_password/);
  }

  async assertFormVisible(): Promise<void> {
    await expect(this.emailInput).toBeVisible();
    await expect(this.submitButton).toBeVisible();
  }
}
