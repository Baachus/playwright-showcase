import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from '../BasePage.js';

/**
 * TI_FileUploadPage
 * ─────────────────────────────────────────────────────────────────────────────
 * Represents the File Upload page on the-internet.herokuapp.com (/upload).
 */
export class TI_FileUploadPage extends BasePage {
  // ── Locators ────────────────────────────────────────────────────────────────
  readonly title: Locator;
  readonly fileInput: Locator;
  readonly submitButton: Locator;
  readonly uploadedFiles: Locator;
  readonly uploadedHeader: Locator;

  constructor(page: Page) {
    super(page);
    this.title = page.getByRole('heading', { name: 'File Uploader' });
    this.fileInput = page.locator('#file-upload');
    this.submitButton = page.locator('#file-submit');
    this.uploadedFiles = page.locator('#uploaded-files');
    this.uploadedHeader = page.getByRole('heading', { name: 'File Uploaded!' });
  }

  // ── Navigation ──────────────────────────────────────────────────────────────
  async goto(): Promise<void> {
    await this.page.goto('/upload');
    await this.waitForPageLoad();
  }

  async waitForPageLoad(): Promise<void> {
    await this.title.waitFor({ state: 'visible' });
  }

  // ── Actions ─────────────────────────────────────────────────────────────────
  /**
   * Upload a file by path and submit the form.
   */
  async uploadFile(filePath: string): Promise<void> {
    await this.fileInput.setInputFiles(filePath);
    await this.submitButton.click();
    await this.uploadedHeader.waitFor({ state: 'visible' });
  }

  /**
   * Set the file input without submitting (for inspection tests).
   */
  async setFile(filePath: string): Promise<void> {
    await this.fileInput.setInputFiles(filePath);
  }

  // ── Queries ─────────────────────────────────────────────────────────────────
  async getUploadedFileName(): Promise<string> {
    return this.uploadedFiles.innerText();
  }

  // ── Assertions ──────────────────────────────────────────────────────────────
  async assertOnPage(): Promise<void> {
    await expect(this.page).toHaveURL(/\/upload/);
  }

  async assertUploadSuccessful(filename: string): Promise<void> {
    await expect(this.uploadedHeader).toBeVisible();
    await expect(this.uploadedFiles).toContainText(filename);
  }

  async assertUploadPageVisible(): Promise<void> {
    await expect(this.fileInput).toBeVisible();
    await expect(this.submitButton).toBeVisible();
  }
}
