import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from '../BasePage.js';

/**
 * TI_DynamicContentPage
 * ─────────────────────────────────────────────────────────────────────────────
 * Represents the Dynamic Content page on the-internet.herokuapp.com (/dynamic_content).
 * Content (images and text) changes non-deterministically on each page load.
 */
export class TI_DynamicContentPage extends BasePage {
  // ── Locators ────────────────────────────────────────────────────────────────
  readonly title: Locator;
  readonly rows: Locator;
  readonly images: Locator;
  readonly textBlocks: Locator;

  constructor(page: Page) {
    super(page);
    this.title = page.getByRole('heading', { name: 'Dynamic Content' });
    this.rows = page.locator('#content .row').filter({ has: page.locator('img') });
    this.images = page.locator('#content .row img');
    this.textBlocks = page.locator('#content .row .large-10');
  }

  // ── Navigation ──────────────────────────────────────────────────────────────
  async goto(): Promise<void> {
    await this.page.goto('/dynamic_content');
    await this.waitForPageLoad();
  }

  async waitForPageLoad(): Promise<void> {
    await this.title.waitFor({ state: 'visible' });
  }

  // ── Queries ─────────────────────────────────────────────────────────────────
  async getRowCount(): Promise<number> {
    return this.rows.count();
  }

  async getRowText(index: number): Promise<string> {
    return this.textBlocks.nth(index).innerText();
  }

  async getImageSrc(index: number): Promise<string> {
    return (await this.images.nth(index).getAttribute('src')) ?? '';
  }

  async getAllRowTexts(): Promise<string[]> {
    const count = await this.textBlocks.count();
    const texts: string[] = [];
    for (let i = 0; i < count; i++) {
      texts.push(await this.textBlocks.nth(i).innerText());
    }
    return texts;
  }

  // ── Assertions ──────────────────────────────────────────────────────────────
  async assertOnPage(): Promise<void> {
    await expect(this.page).toHaveURL(/\/dynamic_content/);
  }

  async assertFourRowsVisible(): Promise<void> {
    // Three visible rows and row for entire data set
    await expect(this.rows).toHaveCount(4);
  }

  async assertAllImagesLoaded(): Promise<void> {
    const count = await this.images.count();
    for (let i = 0; i < count; i++) {
      const src = await this.images.nth(i).getAttribute('src');
      expect(src).toBeTruthy();
    }
  }
}