import { Page, Locator } from '@playwright/test';

/**
 * BasePage
 * ─────────────────────────────────────────────────────────────────────────────
 * All Page Object classes extend this base. It provides common navigation
 * helpers, wait utilities, and a consistent interface for interacting with
 * every page in the application.
 */
export abstract class BasePage {
  readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  // ── Navigation ──────────────────────────────────────────────────────────────

  /** Navigate to the page's canonical URL. Must be implemented by subclasses. */
  abstract goto(): Promise<void>;

  /** Wait until the page's key element signals it is fully loaded. */
  abstract waitForPageLoad(): Promise<void>;

  // ── Shared Utilities ────────────────────────────────────────────────────────

  /**
   * Get the current page <title>.
   */
  async getTitle(): Promise<string> {
    return this.page.title();
  }

  /**
   * Get the current page URL.
   */
  getUrl(): string {
    return this.page.url();
  }

  /**
   * Wait for a network response matching a URL pattern.
   */
  async waitForResponse(urlPattern: string | RegExp): Promise<void> {
    await this.page.waitForResponse(urlPattern);
  }

  /**
   * Scroll an element into view before interacting with it.
   */
  async scrollIntoView(locator: Locator): Promise<void> {
    await locator.scrollIntoViewIfNeeded();
  }

  /**
   * Take a named screenshot for debugging or reporting.
   */
  async screenshot(name: string): Promise<void> {
    await this.page.screenshot({ path: `test-results/screenshots/${name}.png`, fullPage: true });
  }
}
