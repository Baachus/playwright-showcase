import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from '../BasePage.js';

/**
 * TI_InfiniteScrollPage
 * ─────────────────────────────────────────────────────────────────────────────
 * Represents the Infinite Scroll page on the-internet.herokuapp.com (/infinite_scroll).
 * New paragraphs are appended to the page as the user scrolls down.
 *
 * jscroll DOM structure:
 *   .jscroll-inner  → contains the initial paragraphs on load
 *   .jscroll-added  → appended container(s) for each scroll-triggered load
 * We select all <p> elements across both to track total paragraph count.
 */
export class TI_InfiniteScrollPage extends BasePage {
  // ── Locators ────────────────────────────────────────────────────────────────
  readonly title: Locator;
  readonly paragraphs: Locator;

  constructor(page: Page) {
    super(page);
    this.title = page.getByRole('heading', { name: 'Infinite Scroll' });
    // Select all paragraphs — both the initial ones (.jscroll-inner) and
    // the dynamically added ones (.jscroll-added).
    this.paragraphs = page.locator('.jscroll-inner p, .jscroll-added p');
  }

  // ── Navigation ──────────────────────────────────────────────────────────────
  async goto(): Promise<void> {
    await this.page.goto('/infinite_scroll');
    await this.waitForPageLoad();
  }

  async waitForPageLoad(): Promise<void> {
    await this.title.waitFor({ state: 'visible' });
    // Wait for jscroll to initialize and render initial paragraphs
    await this.page.locator('.jscroll-inner p').first().waitFor({ state: 'visible' });
  }

  // ── Actions ─────────────────────────────────────────────────────────────────
  async scrollToBottom(): Promise<void> {
    await this.page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await this.page.waitForTimeout(1000);
  }

  /**
   * Scroll down multiple times and wait for new content to load each time.
   */
  async scrollDownTimes(times: number): Promise<void> {
    for (let i = 0; i < times; i++) {
      const countBefore = await this.paragraphs.count();
      await this.scrollToBottom();
      // Wait for total paragraph count to increase
      await this.page.waitForFunction(
        (prevCount: number) => {
          const inner = document.querySelectorAll('.jscroll-inner p').length;
          const added = document.querySelectorAll('.jscroll-added p').length;
          return (inner + added) > prevCount;
        },
        countBefore,
        { timeout: 5000 }
      );
    }
  }

  // ── Queries ─────────────────────────────────────────────────────────────────
  async getParagraphCount(): Promise<number> {
    return this.paragraphs.count();
  }

  // ── Assertions ──────────────────────────────────────────────────────────────
  async assertOnPage(): Promise<void> {
    await expect(this.page).toHaveURL(/\/infinite_scroll/);
  }

  async assertParagraphsExist(): Promise<void> {
    await expect(this.paragraphs.first()).toBeVisible();
  }

  async assertMoreParagraphsAfterScroll(initialCount: number): Promise<void> {
    const currentCount = await this.getParagraphCount();
    expect(currentCount).toBeGreaterThan(initialCount);
  }
}
