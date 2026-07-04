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
    this.paragraphs = page.locator('div[class="jscroll-added"]');
  }

  // ── Navigation ──────────────────────────────────────────────────────────────
  async goto(): Promise<void> {
    await this.page.goto('/infinite_scroll');
    await this.waitForPageLoad();
  }

  async waitForPageLoad(): Promise<void> {
    await this.title.waitFor({ state: 'visible' });
    await this.paragraphs.first().waitFor({ state: 'visible' });
  }

  // ── Actions ─────────────────────────────────────────────────────────────────
  async scrollToBottom(): Promise<void> {
    const count = await this.getParagraphCount();
    await this.paragraphs.nth(count - 1).scrollIntoViewIfNeeded();
    // Wait for jscroll to actually append new content instead of sleeping.
    await this.page.waitForFunction(
      (prev) => document.querySelectorAll('div[class="jscroll-added"]').length > prev,
      count
    );
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
