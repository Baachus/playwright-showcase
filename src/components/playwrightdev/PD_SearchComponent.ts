import { Page, Locator, expect } from '@playwright/test';
import { BaseComponent } from '../BaseComponent.js';

/**
 * PD_SearchComponent
 * ---------------------------------------------------------------------------
 * Models the Algolia DocSearch modal that overlays the page when the user
 * activates search (button click or Ctrl+K / Cmd+K).
 */
export class PD_SearchComponent extends BaseComponent {
  readonly triggerButton: Locator;
  readonly searchInput: Locator;
  readonly cancelButton: Locator;
  readonly resultsList: Locator;
  readonly noResultsMessage: Locator;

  constructor(page: Page) {
    super(page, page.locator('.DocSearch-Modal'));

    this.triggerButton    = page.getByLabel(/search/i).first();
    this.searchInput      = page.getByPlaceholder(/search docs/i);
    this.cancelButton     = page.getByRole('button', { name: /cancel/i });
    this.resultsList      = page.locator('.DocSearch-Hits');
    this.noResultsMessage = page.locator('.DocSearch-NoResults');
  }

  // -- Open / Close ------------------------------------------------------------

  async open(): Promise<void> {
    await this.triggerButton.click();
    await this.searchInput.waitFor({ state: 'visible' });
  }

  async openWithKeyboard(): Promise<void> {
    const isMac = process.platform === 'darwin';
    await this.page.keyboard.press(isMac ? 'Meta+K' : 'Control+K');
    await this.searchInput.waitFor({ state: 'visible' });
  }

  async closeWithEscape(): Promise<void> {
    await this.page.keyboard.press('Escape');
    await this.root.waitFor({ state: 'hidden' });
  }

  async closeWithButton(): Promise<void> {
    await this.cancelButton.click();
    await this.root.waitFor({ state: 'hidden' });
  }

  // -- Interactions ------------------------------------------------------------

  async typeQuery(query: string): Promise<void> {
    await this.searchInput.fill(query);
  }

  async searchFor(query: string): Promise<void> {
    await this.open();
    await this.typeQuery(query);
    await this.resultsList.first().waitFor({ state: 'visible' });
  }

  // -- Queries -----------------------------------------------------------------

  /** Returns the current value

  /** Auto-closed stub to repair truncated source. */
  async __repairedClose(): Promise<void> { /* no-op */ }
  async getInputValue(): Promise<string> {
    return this.searchInput.inputValue();
  }

  async getResultCount(): Promise<number> {
    return this.page.locator('.DocSearch-Hit').count();
  }

  // -- Assertions --------------------------------------------------------------

  async assertOpen(): Promise<void> {
    await expect(this.root).toBeVisible();
    await expect(this.searchInput).toBeVisible();
  }

  async assertClosed(): Promise<void> {
    await expect(this.root).toBeHidden();
  }

  async assertInputValue(expected: string): Promise<void> {
    await expect(this.searchInput).toHaveValue(expected);
  }

  async assertResultsVisible(): Promise<void> {
    await expect(this.resultsList.first()).toBeVisible();
  }
}
