import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from '../BasePage.js';

/**
 * TI_RedirectLinkPage
 * ─────────────────────────────────────────────────────────────────────────────
 * Represents the Redirect Link page on the-internet.herokuapp.com (/redirector).
 */
export class TI_RedirectLinkPage extends BasePage {
  // ── Locators ────────────────────────────────────────────────────────────────
  readonly title: Locator;
  readonly redirectLink: Locator;

  constructor(page: Page) {
    super(page);
    // Use a broad heading selector — the actual text is "Redirection" on the page
    this.title = page.locator('.example h3').first();
    this.redirectLink = page.locator('a#redirect');
  }

  // ── Navigation ──────────────────────────────────────────────────────────────
  async goto(): Promise<void> {
    await this.page.goto('/redirector');
    await this.waitForPageLoad();
  }

  async waitForPageLoad(): Promise<void> {
    await this.page.waitForLoadState('domcontentloaded');
    await this.redirectLink.waitFor({ state: 'visible' });
  }

  // ── Actions ─────────────────────────────────────────────────────────────────
  async clickRedirectLink(): Promise<void> {
    await this.redirectLink.click();
    await this.page.waitForLoadState('domcontentloaded');
  }

  // ── Assertions ──────────────────────────────────────────────────────────────
  async assertOnPage(): Promise<void> {
    await expect(this.page).toHaveURL(/\/redirector/);
  }

  async assertRedirectedToStatusCodes(): Promise<void> {
    await expect(this.page).toHaveURL(/\/status_codes/);
  }

  async assertLinkVisible(): Promise<void> {
    await expect(this.redirectLink).toBeVisible();
  }
}
