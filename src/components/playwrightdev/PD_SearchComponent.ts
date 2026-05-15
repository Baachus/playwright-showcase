import { Page, Locator, expect } from '@playwright/test';
import { BaseComponent } from '../BaseComponent.js';

/**
 * PD_SearchComponent
 * ---------------------------------------------------------------------------
 * Models the Algolia DocSearch modal that overlays the page when the user
 * activates search (button click or Ctrl+K / Cmd+K).
 *
 * The trigger (search button in the navbar) is intentionally excluded here;
 * it lives on PD_NavbarComponent. This component represents the modal itself
 * once it is open.
 */
export class PD_SearchComponent extends BaseComponent {
  // Trigger (pre-modal)
  readonly triggerButton: Locator;

  // Modal elements (visible only when open)
  readonly searchInput: Locator;
  readonly cancelButton: Locator;
  readonly resultsList: Locator;
  readonly noResultsMessage: Locator;

  constructor(page: Page) {
    // Root is the DocSearch modal container; only present in the DOM when open.
    super(page, page.locator('.DocSearch-Modal'));

    // The button that opens the modal (lives outside the modal itself)
    this.triggerButton = page.getByLabel(/search/i).first();

    // Elements inside the modal
    this.searchInput      = page.getByPlaceholder(/search docs/i);
    this.cancelButton     = page.getByRole('button', { name: /cancel/i });
    this.resultsList      = page.locator('.DocSearch-Hits');
    this.noResultsMessage = page.locator('.DocSearch-NoResults');
  }

  // Open / Close

  /** Open the search modal by clicking the trigger button in the navbar. */
  async open(): Promise<void> {
    await this.triggerButton.click();
    await this.searchInput.waitFor({ state: 'visible' });
  }

  /** Open the search modal using the keyboard shortcut (Ctrl+K / Cmd+K). */
  async openWithKeyboard(): Promise<void> {
    const isMac = process.platform === 'darwin';
    await this.page.keyboard.press(isMac ? 'Meta+K' : 'Control+K');
    await this.searchInput.waitFor({ state: 'visible' });
  }

  /** Close the modal by pressing Escape. */
  async closeWithEscape(): Promise<void> {
    await this.page.keyboard.press('Escape');
    await this.root.waitFor({ state: 'hidden' });
  }

  /** Close the modal by clicking the Cancel button (mobile / touch fallback). */
  async closeWithButton(): Promise<void> {
    await this.cancelButton.click();
    await this.root.waitFor({ state: 'hidden' });
  }

  // Interactions

  /**
   * Type a query into the search input.
   * The modal must already be open before calling this.
   */
  async typeQuery(query: string): Promise<void> {
    await this.searchInput.fill(query);
  }

  /**
   * Open the modal, search for a term, and wait for results to appear.
   */
  async searchFor(query: string): Promise<void> {
    await this.open();
    await this.typeQuery(query);
    await this.resultsList.first().waitFor({ state: 'visible' });
  }

  // Queries

  /** Returns the current value of the search input. */
  async getInputValue(): Promise<string> {
    return this.searchInput.inputValue();
  }

  /** Returns the number of search result items currently displayed. */
  async getResultCount(): Promise<number> {
    return this.page.locator('.DocSearch-Hit').count();
  }

  // Assertions

  /** Assert the modal is open and the input is focused. */
  async assertOpen(): Promise<void> {
    await expect(this.root).toBeVisible();
    await expect(this.searchInput).toBeVisible();
  }

  /** Assert the modal is closed / hidden. */
  async assertClosed(): Promise<void> {
    await expect(this.root).toBeHidden();
  }

  /** Assert that the input contains the expected query text. */
  async assertInputValue(expected: string): Promise<void> {
    await expect(this.searchInput).toHaveValue(expected);
  }

  /** Assert that at least one result is shown for the current query. */
  async assertResultsVisible(): Promise<void> {
    await expect(this.resultsList.first()).toBeVisible();
    const count = await this.getResultCount();
    expect(count).toBeGreaterThan(0);
  }
}
