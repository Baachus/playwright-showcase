import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from '../BasePage.js';

/**
 * TI_ShiftingContentPage
 * ─────────────────────────────────────────────────────────────────────────────
 * Represents the Shifting Content page on the-internet.herokuapp.com (/shifting_content).
 * Links to three sub-examples: menu, list, image.
 */
export class TI_ShiftingContentPage extends BasePage {
  // ── Locators ────────────────────────────────────────────────────────────────
  readonly title: Locator;
  readonly menuLink: Locator;
  readonly listLink: Locator;
  readonly imageLink: Locator;

  constructor(page: Page) {
    super(page);
    this.title = page.getByRole('heading', { name: 'Shifting Content' });
    // Use href-based selectors which are more stable than link text matching
    this.menuLink = page.locator('a[href*="shifting_content/menu"]');
    this.listLink = page.locator('a[href*="shifting_content/list"]');
    this.imageLink = page.locator('a[href*="shifting_content/image"]');
  }

  // ── Navigation ──────────────────────────────────────────────────────────────
  async goto(): Promise<void> {
    await this.page.goto('/shifting_content');
    await this.waitForPageLoad();
  }

  async gotoMenu(): Promise<void> {
    await this.page.goto('/shifting_content/menu');
    await this.page.waitForLoadState('domcontentloaded');
  }

  async gotoList(): Promise<void> {
    await this.page.goto('/shifting_content/list');
    await this.page.waitForLoadState('domcontentloaded');
  }

  async gotoImage(): Promise<void> {
    await this.page.goto('/shifting_content/image');
    await this.page.waitForLoadState('domcontentloaded');
  }

  async waitForPageLoad(): Promise<void> {
    await this.title.waitFor({ state: 'visible' });
  }

  // ── Assertions ──────────────────────────────────────────────────────────────
  async assertOnPage(): Promise<void> {
    await expect(this.page).toHaveURL(/\/shifting_content/);
  }

  async assertExampleLinksVisible(): Promise<void> {
    await expect(this.menuLink).toBeVisible();
    await expect(this.listLink).toBeVisible();
    await expect(this.imageLink).toBeVisible();
  }
}
