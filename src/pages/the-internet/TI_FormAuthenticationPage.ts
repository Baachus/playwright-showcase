import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from '../BasePage.js';

/**
 * TI_FormAuthenticationPage
 * ─────────────────────────────────────────────────────────────────────────────
 * Represents the Form Authentication (Login) page on the-internet.herokuapp.com (/login).
 * Valid credentials: admin / admin.
 */
export class TI_FormAuthenticationPage extends BasePage {
  // ── Locators ────────────────────────────────────────────────────────────────
  readonly title: Locator;
  readonly usernameInput: Locator;
  readonly passwordInput: Locator;
  readonly loginButton: Locator;
  readonly flashMessage: Locator;
  readonly logoutButton: Locator;
  readonly secureAreaHeading: Locator;

  constructor(page: Page) {
    super(page);
    this.title = page.getByRole('heading', { name: 'Login Page' });
    this.usernameInput = page.locator('#username');
    this.passwordInput = page.locator('#password');
    this.loginButton = page.locator('button[type="submit"]');
    this.flashMessage = page.locator('#flash');
    this.logoutButton = page.getByRole('link', { name: 'Logout' });
    this.secureAreaHeading = page.getByRole('heading', { name: 'Secure Area' });
  }

  // ── Navigation ──────────────────────────────────────────────────────────────
  async goto(): Promise<void> {
    await this.page.goto('/login');
    await this.waitForPageLoad();
  }

  async waitForPageLoad(): Promise<void> {
    await this.title.waitFor({ state: 'visible' });
  }

  // ── Actions ─────────────────────────────────────────────────────────────────
  async login(username: string, password: string): Promise<void> {
    await this.usernameInput.fill(username);
    await this.passwordInput.fill(password);
    await this.loginButton.click();
    await this.flashMessage.waitFor({ state: 'visible' });
  }

  async validLogin(): Promise<void> {
    await this.login('tomsmith', 'SuperSecretPassword!');
  }

  async invalidLogin(username = 'wrong', password = 'wrong'): Promise<void> {
    await this.login(username, password);
  }

  async logout(): Promise<void> {
    await this.logoutButton.click();
    await this.flashMessage.waitFor({ state: 'visible' });
  }

  // ── Queries ─────────────────────────────────────────────────────────────────
  async getFlashMessageText(): Promise<string> {
    return this.flashMessage.innerText();
  }

  async isFlashSuccess(): Promise<boolean> {
    const classes = await this.flashMessage.getAttribute('class') ?? '';
    return classes.includes('success');
  }

  async isFlashError(): Promise<boolean> {
    const classes = await this.flashMessage.getAttribute('class') ?? '';
    return classes.includes('error');
  }

  // ── Assertions ──────────────────────────────────────────────────────────────
  async assertOnLoginPage(): Promise<void> {
    await expect(this.page).toHaveURL(/\/login/);
  }

  async assertOnSecurePage(): Promise<void> {
    await expect(this.page).toHaveURL(/\/secure/);
    await expect(this.secureAreaHeading).toBeVisible();
  }

  async assertLoginSuccessful(): Promise<void> {
    await expect(this.flashMessage).toContainText('You logged into a secure area');
  }

  async assertLoginFailed(): Promise<void> {
    await expect(this.flashMessage).toContainText('Your username is invalid');
  }

  async assertLoggedOut(): Promise<void> {
    await expect(this.flashMessage).toContainText('You logged out of the secure area');
  }
}
