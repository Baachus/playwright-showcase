import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from '../BasePage.js';

/**
 * TI_AddRemovePage
 * ─────────────────────────────────────────────────────────────────────────────
 * Represents the Add Remove Elements Test page on the-internet.herokuapp.com (/add_remove_elements).
 */
export class TI_AddRemovePage extends BasePage {
  // ── Locators ────────────────────────────────────────────────────────────────
  readonly addElement:   Locator;
  readonly deleteElement:   Locator;

  /** All valid heading texts served by the A/B test endpoint. */
  static readonly VALID_HEADINGS = ['A/B Test Control', 'A/B Test Variation 1'] as const;

  constructor(page: Page) {
    super(page);

    this.addElement = page.locator('h3');
    this.deleteElement = page.locator('div.example p');
  }

  // ── Navigation ──────────────────────────────────────────────────────────────
  async goto(): Promise<void> {
    await this.page.goto('/add_remove_elements');
    await this.waitForPageLoad();
  }

  async waitForPageLoad(): Promise<void> {
    await this.addElement.waitFor({ state: 'visible' });
  }

  // ── Queries ─────────────────────────────────────────────────────────────────

  // ── Assertions ──────────────────────────────────────────────────────────────
  /**
   * Assert the page loaded on the correct URL.
   */
  async assertOnAddRemoveElementPage(): Promise<void> {
    await expect(this.page).toHaveURL(/\/add_remove_element/);
  }
}
