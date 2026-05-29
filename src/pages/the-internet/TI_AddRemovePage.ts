import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from '../BasePage.js';

/**
 * TI_AddRemovePage
 * ─────────────────────────────────────────────────────────────────────────────
 * Represents the Add Remove Elements Test page on the-internet.herokuapp.com (/add_remove_elements).
 */
export class TI_AddRemovePage extends BasePage {
  // ── Locators ────────────────────────────────────────────────────────────────
  readonly title: Locator;
  readonly addElement:   Locator;
  readonly deleteElement:   Locator;

  constructor(page: Page) {
    super(page);

    this.title = page.getByRole('heading', { name: 'Add/Remove Elements' });
    this.addElement = page.getByRole('button', { name: 'Add Element' });
    this.deleteElement = page.getByRole('button', { name: 'Delete' });
  }

  // ── Navigation ──────────────────────────────────────────────────────────────
  async goto(): Promise<void> {
    await this.page.goto('/add_remove_elements/');
    await this.waitForPageLoad();
  }

  async waitForPageLoad(): Promise<void> {
    await this.title.waitFor({ state: 'visible' });
  }

  // ── Queries ─────────────────────────────────────────────────────────────────
  async getNthDeleteButton(count: number): Promise<Locator> {
    return this.deleteElement.nth(count);
  }

  // ── Assertions ──────────────────────────────────────────────────────────────
  /**
   * Assert the page loaded on the correct URL.
   */
  async assertOnAddRemoveElementPage(): Promise<void> {
    await expect(this.page).toHaveURL(/\/add_remove_element/);
  }
}
