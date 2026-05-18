import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from '../BasePage.js';
import { resolveCredentials } from '@utils/authentication.utils.js';

/**
 * SD_LoginPage
 * ─────────────────────────────────────────────────────────────────────────────
 * Represents the Saucedemo login page.
 * Covers credential input, form submission, error handling, and assertions.
 */
export class SD_LoginPage extends BasePage {
  // ── Locators ────────────────────────────────────────────────────────────────
  readonly usernameInput: Locator;
  readonly passwordInput: Locator;
  readonly loginButton: Locator;
  readonly errorMessage: Locator;
  readonly errorCloseButton: Locator;
  readonly loginLogo: Locator;

  constructor(page: Page) {
    super(page);

    this.usernameInput   = page.locator('[data-test="username"]');
    this.passwordInput   = page.locator('[data-test="password"]');
    this.loginButton     = page.locator('[data-test="login-button"]');
    this.errorMessage    = page.locator('[data-test="error"]');
    this.errorCloseButton = page.locator('[data-test="error-button"]');
    this.loginLogo       = page.locator('.login_logo');
  }

  // ── Navigation ──────────────────────────────────────────────────────────────

  async goto(): Promise<void> {
    await this.page.goto('/');
    await this.waitForPageLoad();
  }

  async waitForPageLoad(): Promise<void> {
    await this.loginButton.waitFor({ state: 'visible' });
  }

  // ── Actions ─────────────────────────────────────────────────────────────────

  /**
   * Fill in credentials and submit the login form.
   */
  async login(username: string, password?: string): Promise<void> {
    const localPassword = resolveCredentials()

    await this.usernameInput.fill(username);
    if(password)
      await this.passwordInput.fill(password);
    else 
      await this.passwordInput.fill(localPassword.password);
    await this.loginButton.click();
  }

  /**
   * Clear the username and password fields.
   */
  async clearForm(): Promise<void> {
    await this.usernameInput.clear();
    await this.passwordInput.clear();
  }

  /**
   * Dismiss the visible error banner.
   */
  async closeError(): Promise<void> {
    await this.errorCloseButton.click();
  }

  // ── Assertions ──────────────────────────────────────────────────────────────

  async assertOnLoginPage(): Promise<void> {
    await expect(this.loginLogo).toBeVisible();
    await expect(this.page).toHaveURL('/');
  }

  async assertErrorVisible(message?: string): Promise<void> {
    await expect(this.errorMessage).toBeVisible();
    if (message) {
      await expect(this.errorMessage).toContainText(message);
    }
  }

  async assertErrorHidden(): Promise<void> {
    await expect(this.errorMessage).toBeHidden();
  }

  async assertLoggedIn(): Promise<void> {
    await expect(this.page).toHaveURL(/inventory/);
  }
}
