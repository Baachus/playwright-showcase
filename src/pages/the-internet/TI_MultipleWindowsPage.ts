import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from '../BasePage.js';

/**
 * TI_MultipleWindowsPage
 * ─────────────────────────────────────────────────────────────────────────────
 * Represents the Multiple Windows page on the-internet.herokuapp.com (/windows).
 * Clicking the link opens a new window/tab.
 */
export class TI_MultipleWindowsPage extends BasePage {
  // ── Locators ────────────────────────────────────────────────────────────────
  readonly title: Locator;
  readonly clickHereLink: Locator;

  constructor(page: Page) {
    super(page);
    this.title = page.getByRole('heading', { name: 'Opening a new window' });
    this.clickHereLink = page.getByRole('link', { name: 'Click Here' });
  }

  // ── Navigation ──────────────────────────────────────────────────────────────
  async goto(): Promise<void> {
    await this.page.goto('/windows');
    await this.waitForPageLoad();
  }

  async waitForPageLoad(): Promise<void> {
    await this.title.waitFor({ state: 'visible' });
  }

  // ── Actions ─────────────────────────────────────────────────────────────────
  /**
   * Click the "Click Here" link and return the new page that opens.
   */
  async clickAndGetNewPage(): Promise<Page> {
    const [newPage] = await Promise.all([
      // Explicit timeout: in WebKit, target="_blank" links can open in a
      // separate browser process rather than the same context, causing the
      // 'page' event to never fire and blocking worker teardown indefinitely.
      this.page.context().waitForEvent('page', { timeout: 15_000 }),
      this.clickHereLink.click(),
    ]);
    await newPage.waitForLoadState('domcontentloaded');
    return newPage;
  }

  // ── Assertions ──────────────────────────────────────────────────────────────
  async assertOnPage(): Promise<void> {
    await expect(this.page).toHaveURL(/\/windows$/);
  }

  async assertLinkVisible(): Promise<void> {
    await expect(this.clickHereLink).toBeVisible();
  }

  async assertNewWindowHasHeading(newPage: Page): Promise<void> {
    const heading = newPage.getByRole('heading', { name: 'New Window' });
    await expect(heading).toBeVisible();
  }

  async assertNewWindowUrl(newPage: Page): Promise<void> {
    await expect(newPage).toHaveURL(/\/windows\/new/);
  }
}
