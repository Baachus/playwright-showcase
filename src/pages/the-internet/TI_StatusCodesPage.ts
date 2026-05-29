import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from '../BasePage.js';

/**
 * TI_StatusCodesPage
 * ─────────────────────────────────────────────────────────────────────────────
 * Represents the Status Codes page on the-internet.herokuapp.com (/status_codes).
 */
export class TI_StatusCodesPage extends BasePage {
  // ── Locators ────────────────────────────────────────────────────────────────
  readonly title: Locator;
  readonly link200: Locator;
  readonly link301: Locator;
  readonly link404: Locator;
  readonly link500: Locator;
  readonly backLink: Locator;

  constructor(page: Page) {
    super(page);
    this.title = page.getByRole('heading', { name: 'Status Codes' });
    this.link200 = page.getByRole('link', { name: '200' });
    this.link301 = page.getByRole('link', { name: '301' });
    this.link404 = page.getByRole('link', { name: '404' });
    this.link500 = page.getByRole('link', { name: '500' });
    this.backLink = page.getByRole('link', { name: 'here' });
  }

  // ── Navigation ──────────────────────────────────────────────────────────────
  async goto(): Promise<void> {
    await this.page.goto('/status_codes');
    await this.waitForPageLoad();
  }

  async waitForPageLoad(): Promise<void> {
    await this.title.waitFor({ state: 'visible' });
  }

  // ── Actions ─────────────────────────────────────────────────────────────────
  async click200(): Promise<void> {
    await this.link200.click();
    await this.page.waitForLoadState('domcontentloaded');
  }

  async click301(): Promise<void> {
    await this.link301.click();
    await this.page.waitForLoadState('domcontentloaded');
  }

  async click404(): Promise<void> {
    await this.link404.click();
    await this.page.waitForLoadState('domcontentloaded');
  }

  async click500(): Promise<void> {
    await this.link500.click();
    await this.page.waitForLoadState('domcontentloaded');
  }

  async goBack(): Promise<void> {
    await this.backLink.click();
    await this.waitForPageLoad();
  }

  // ── Queries ─────────────────────────────────────────────────────────────────
  /**
   * Navigate to a status code page and capture the actual HTTP response code.
   */
  async getStatusCodeResponse(code: number): Promise<number> {
    const [response] = await Promise.all([
      this.page.waitForResponse(resp => resp.url().includes(`/status_codes/${code}`)),
      this.page.goto(`/status_codes/${code}`),
    ]);
    return response.status();
  }

  // ── Assertions ──────────────────────────────────────────────────────────────
  async assertOnPage(): Promise<void> {
    await expect(this.page).toHaveURL(/\/status_codes$/);
  }

  async assertAllLinksVisible(): Promise<void> {
    await expect(this.link200).toBeVisible();
    await expect(this.link301).toBeVisible();
    await expect(this.link404).toBeVisible();
    await expect(this.link500).toBeVisible();
  }

  async assertOnStatusPage(code: number): Promise<void> {
    await expect(this.page).toHaveURL(new RegExp(`/status_codes/${code}`));
  }
}
