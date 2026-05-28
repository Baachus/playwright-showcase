import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from '../BasePage.js';

/**
 * TI_DigestAuthPage
 * ─────────────────────────────────────────────────────────────────────────────
 * Represents the Digest Authentication page on the-internet.herokuapp.com (/digest_auth).
 *
 * NOTE: Digest Auth is a browser-level challenge. Playwright does not natively
 * support Digest Auth via setExtraHTTPHeaders (that only works for Basic Auth).
 * The recommended approach is to use a CDP session or rely on the browser's
 * built-in credential handling via page.authenticate().
 */
export class TI_DigestAuthPage extends BasePage {
  // ── Locators ────────────────────────────────────────────────────────────────
  readonly title: Locator;
  readonly successText: Locator;

  constructor(page: Page) {
    super(page);
    this.title = page.getByRole('heading', { name: 'Digest Auth' });
    this.successText = page.getByText('Congratulations! You must have the proper credentials.');
  }

  // ── Navigation ──────────────────────────────────────────────────────────────
  /**
   * Navigate without credentials — will result in a 401 page.
   */
  async goto(): Promise<void> {
    await this.page.goto('/digest_auth');
  }

  async waitForPageLoad(): Promise<void> {
    await this.title.waitFor({ state: 'visible' });
  }

  // ── Queries ─────────────────────────────────────────────────────────────────
  /**
   * Navigate with valid credentials embedded in the URL.
   * This works for Digest Auth on the-internet (the server accepts URL-embedded creds).
   */
  async validLogin(username = 'admin', password = 'admin'): Promise<void> {
    const url = `https://${username}:${password}@the-internet.herokuapp.com/digest_auth`;
    await this.page.goto(url);
    await this.waitForPageLoad();
  }

  // ── Assertions ──────────────────────────────────────────────────────────────
  async assertOnPage(): Promise<void> {
    await expect(this.page).toHaveURL(/\/digest_auth/);
  }

  async assertLoginSuccess(): Promise<void> {
    await expect(this.successText).toBeVisible();
  }
}
