import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from '../BasePage.js';

/**
 * TI_BrokenImagesPage
 * ─────────────────────────────────────────────────────────────────────────────
 * Represents the Broken Images page on the-internet.herokuapp.com (/broken_images).
 */
export class TI_BrokenImagesPage extends BasePage {
  // ── Locators ────────────────────────────────────────────────────────────────
  readonly title: Locator;
  readonly image: Locator;

  constructor(page: Page) {
    super(page);
    this.title = page.getByRole('heading', { name: 'Broken Images' });
    // Scope to .example to avoid picking up the "Fork on GitHub" banner image
    // which may or may not be present depending on the browser / viewport.
    this.image = page.locator('.example img');
  }

  // ── Navigation ──────────────────────────────────────────────────────────────
  async goto(): Promise<void> {
    await this.page.goto('/broken_images');
    await this.waitForPageLoad();
  }

  async waitForPageLoad(): Promise<void> {
    await this.title.waitFor({ state: 'visible' });
  }

  // ── Queries ─────────────────────────────────────────────────────────────────
  async getNthImage(count: number): Promise<Locator> {
    return this.image.nth(count);
  }

  // ── Assertions ──────────────────────────────────────────────────────────────
  async assertOnBrokenImagesPage(): Promise<void> {
    await expect(this.page).toHaveURL(/\/broken_images/);
  }
}
