import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from '../BasePage.js';

/**
 * TI_SlowResourcesPage
 * ─────────────────────────────────────────────────────────────────────────────
 * Represents the Slow Resources page on the-internet.herokuapp.com (/slow).
 * Contains an image that takes 5 seconds to load.
 */
export class TI_SlowResourcesPage extends BasePage {
  // ── Locators ────────────────────────────────────────────────────────────────
  readonly title: Locator;
  readonly slowImage: Locator;

  constructor(page: Page) {
    super(page);
    this.title = page.getByRole('heading', { name: 'Slow Resources' });
    this.slowImage = page.locator('.example img');
  }

  // ── Navigation ──────────────────────────────────────────────────────────────
  async goto(): Promise<void> {
    await this.page.goto('/slow');
    await this.waitForPageLoad();
  }

  async waitForPageLoad(): Promise<void> {
    // Use domcontentloaded since the slow image would delay networkidle
    await this.title.waitFor({ state: 'visible' });
  }

  /**
   * Navigate and wait for the slow image to fully load (may take up to 10s).
   */
  async gotoAndWaitForImage(): Promise<void> {
    await this.page.goto('/slow', { waitUntil: 'load', timeout: 30_000 });
  }

  // ── Queries ─────────────────────────────────────────────────────────────────
  async isImageLoaded(): Promise<boolean> {
    return this.slowImage.evaluate((img: HTMLImageElement) => img.complete && img.naturalWidth > 0);
  }

  // ── Assertions ──────────────────────────────────────────────────────────────
  async assertOnPage(): Promise<void> {
    await expect(this.page).toHaveURL(/\/slow/);
  }

  async assertTitleVisible(): Promise<void> {
    await expect(this.title).toBeVisible();
  }

  async assertSlowImagePresent(): Promise<void> {
    await expect(this.slowImage).toBeAttached();
  }
}
