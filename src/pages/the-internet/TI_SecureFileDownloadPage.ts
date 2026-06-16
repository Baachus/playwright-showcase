import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from '../BasePage.js';

/**
 * TI_SecureFileDownloadPage
 * ─────────────────────────────────────────────────────────────────────────────
 * Represents the Secure File Download page on the-internet.herokuapp.com (/download_secure).
 * Requires HTTP Basic Auth (admin/admin).
 */
export class TI_SecureFileDownloadPage extends BasePage {
  // ── Locators ────────────────────────────────────────────────────────────────
  readonly title: Locator;
  readonly downloadLinks: Locator;

  constructor(page: Page) {
    super(page);
    this.title = page.getByRole('heading', { name: 'Secure File Downloader' });
    this.downloadLinks = page.locator('.example a');
  }

  // ── Navigation ──────────────────────────────────────────────────────────────
  /**
   * Navigate without credentials — will result in a 401 challenge.
   */
  async goto(): Promise<void> {
    await this.page.goto('/download_secure');
  }

  async waitForPageLoad(): Promise<void> {
    await this.title.waitFor({ state: 'visible' });
  }

  /**
   * Navigate with Basic Auth credentials embedded in the URL.
   */
  async gotoWithAuth(username = 'admin', password = 'admin'): Promise<void> {
    const encoded = Buffer.from(`${username}:${password}`).toString('base64');
    await this.page.context().setExtraHTTPHeaders({
      Authorization: `Basic ${encoded}`,
    });
    await this.page.goto('/download_secure');
    await this.waitForPageLoad();
  }

  // ── Queries ─────────────────────────────────────────────────────────────────
  async getLinkCount(): Promise<number> {
    return this.downloadLinks.count();
  }

  async getFirstLinkText(): Promise<string> {
    return this.downloadLinks.first().innerText();
  }

  async downloadFirstFile(): Promise<string> {
    const [download] = await Promise.all([
      // Explicit timeout prevents the promise from hanging indefinitely in
      // WebKit, which sometimes navigates to the file URL instead of firing
      // a download event.
      this.page.waitForEvent('download', { timeout: 15_000 }),
      this.downloadLinks.first().click(),
    ]);
    return download.suggestedFilename();
  }

  // ── Assertions ──────────────────────────────────────────────────────────────
  async assertOnPage(): Promise<void> {
    await expect(this.page).toHaveURL(/\/download_secure/);
  }

  async assertLinksExist(): Promise<void> {
    await expect(this.downloadLinks.first()).toBeVisible();
  }
}
