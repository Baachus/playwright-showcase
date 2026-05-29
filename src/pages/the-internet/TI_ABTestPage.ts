import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from '../BasePage.js';

/**
 * TI_ABTestPage
 * ─────────────────────────────────────────────────────────────────────────────
 * Represents the A/B Test page on the-internet.herokuapp.com (/abtest).
 *
 * The server randomly serves one of two variants on each page load:
 *   - Control:   heading text is "A/B Test Control"
 *   - Variation: heading text is "A/B Test Variation 1"
 *
 * Both variants share the same DOM structure, so the same locators work for
 * either variant.  Assertions that need to handle both are provided as helpers.
 */
export class TI_ABTestPage extends BasePage {
  // ── Locators ────────────────────────────────────────────────────────────────
  readonly heading:   Locator;
  readonly content:   Locator;

  /** All valid heading texts served by the A/B test endpoint. */
  static readonly VALID_HEADINGS = ['A/B Test Control', 'A/B Test Variation 1'] as const;

  constructor(page: Page) {
    super(page);

    this.heading = page.locator('h3');
    this.content = page.locator('div.example p');
  }

  // ── Navigation ──────────────────────────────────────────────────────────────
  async goto(): Promise<void> {
    await this.page.goto('/abtest');
    await this.waitForPageLoad();
  }

  async waitForPageLoad(): Promise<void> {
    await this.heading.waitFor({ state: 'visible' });
  }

  // ── Queries ─────────────────────────────────────────────────────────────────
  /**
   * Return the heading text that was served on this load.
   */
  async getHeadingText(): Promise<string> {
    return (await this.heading.textContent()) ?? '';
  }

  // ── Assertions ──────────────────────────────────────────────────────────────
  /**
   * Assert the page loaded on the correct URL.
   */
  async assertOnABTestPage(): Promise<void> {
    await expect(this.page).toHaveURL(/\/abtest/);
  }

  /**
   * Assert the heading is one of the two valid A/B test variants.
   */
  async assertValidVariant(): Promise<void> {
    const text = await this.getHeadingText();
    const valid = TI_ABTestPage.VALID_HEADINGS.some(v => text.includes(v));
    expect(valid, `Heading "${text}" is not a recognized A/B test variant`).toBe(true);
  }

  /**
   * Assert the heading matches the "Control" variant exactly.
   */
  async assertIsControlVariant(): Promise<void> {
    await expect(this.heading).toContainText('A/B Test Control');
  }

  /**
   * Assert the heading matches "Variation 1" exactly.
   */
  async assertIsVariation1(): Promise<void> {
    await expect(this.heading).toContainText('A/B Test Variation 1');
  }

  /**
   * Assert the body-copy paragraph beneath the heading is visible and non-empty.
   */
  async assertContentVisible(): Promise<void> {
    await expect(this.content).toBeVisible();
    const text = await this.content.textContent();
    expect(text?.trim().length, 'Content paragraph should not be empty').toBeGreaterThan(0);
  }
}
