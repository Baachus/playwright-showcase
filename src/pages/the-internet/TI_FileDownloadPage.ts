import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from '../BasePage.js';
import * as path from 'path';
import * as fs from 'fs';

/**
 * TI_FileDownloadPage
 * ─────────────────────────────────────────────────────────────────────────────
 * Represents the File Download page on the-internet.herokuapp.com (/download).
 */
export class TI_FileDownloadPage extends BasePage {
  // ── Locators ────────────────────────────────────────────────────────────────
  readonly title: Locator;
  readonly downloadLinks: Locator;

  constructor(page: Page) {
    super(page);
    this.title = page.getByRole('heading', { name: 'File Downloader' });
    this.downloadLinks = page.locator('.example a');
  }

  // ── Navigation ──────────────────────────────────────────────────────────────
  async goto(): Promise<void> {
    await this.page.goto('/download');
    await this.waitForPageLoad();
  }

  async waitForPageLoad(): Promise<void> {
    await this.title.waitFor({ state: 'visible' });
  }

  // ── Queries ─────────────────────────────────────────────────────────────────
  async getLinkCount(): Promise<number> {
    return this.downloadLinks.count();
  }

  async getFirstLinkText(): Promise<string> {
    return this.downloadLinks.first().innerText();
  }

  async getAllLinkTexts(): Promise<string[]> {
    const count = await this.downloadLinks.count();
    const texts: string[] = [];
    for (let i = 0; i < count; i++) {
      texts.push(await this.downloadLinks.nth(i).innerText());
    }
    return texts;
  }

  // ── Actions ─────────────────────────────────────────────────────────────────
  /**
   * Click the first download link and capture the downloaded file.
   * Returns the suggested filename from the download event.
   */
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

  /**
   * Click the nth download link and capture the downloaded file.
   * Returns the suggested filename.
   */
  async downloadFile(index: number): Promise<string> {
    const [download] = await Promise.all([
      this.page.waitForEvent('download', { timeout: 15_000 }),
      this.downloadLinks.nth(index).click(),
    ]);
    return download.suggestedFilename();
  }

  // ── Assertions ──────────────────────────────────────────────────────────────
  async assertOnPage(): Promise<void> {
    await expect(this.page).toHaveURL(/\/download/);
  }

  async assertLinksExist(): Promise<void> {
    await expect(this.downloadLinks.first()).toBeVisible();
  }
}
