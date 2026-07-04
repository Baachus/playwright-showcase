import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from '../BasePage.js';

/**
 * TI_ContextMenuPage
 * ─────────────────────────────────────────────────────────────────────────────
 * Represents the Context Menu page on the-internet.herokuapp.com (/context_menu).
 */
export class TI_ContextMenuPage extends BasePage {
  // ── Locators ────────────────────────────────────────────────────────────────
  readonly title: Locator;
  readonly hotSpot: Locator;

  constructor(page: Page) {
    super(page);
    this.title = page.getByRole('heading', { name: 'Context Menu' });
    this.hotSpot = page.locator('#hot-spot');
  }

  // ── Navigation ──────────────────────────────────────────────────────────────
  async goto(): Promise<void> {
    await this.page.goto('/context_menu');
    await this.waitForPageLoad();
  }

  async waitForPageLoad(): Promise<void> {
    await this.title.waitFor({ state: 'visible' });
  }

  // ── Actions ─────────────────────────────────────────────────────────────────
  /**
   * Right-click the hot-spot to trigger the browser native context-menu alert.
   * Returns the dialog message text.
   */
  async rightClickHotSpot(): Promise<string> {
    // Register the dialog listener before clicking, then await the event
    // itself instead of sleeping — no race, no fixed delay.
    const dialogPromise = this.page.waitForEvent('dialog');
    await this.hotSpot.click({ button: 'right' });
    const dialog = await dialogPromise;
    const dialogMessage = dialog.message();
    await dialog.accept();
    return dialogMessage;
  }

  // ── Assertions ──────────────────────────────────────────────────────────────
  async assertOnPage(): Promise<void> {
    await expect(this.page).toHaveURL(/\/context_menu/);
  }

  async assertHotSpotVisible(): Promise<void> {
    await expect(this.hotSpot).toBeVisible();
  }
}
