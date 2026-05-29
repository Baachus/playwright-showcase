import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from '../BasePage.js';

/**
 * TI_ExitIntentPage
 * ─────────────────────────────────────────────────────────────────────────────
 * Represents the Exit Intent page on the-internet.herokuapp.com (/exit_intent).
 * The modal is triggered when the mouse leaves the viewport (exit intent).
 */
export class TI_ExitIntentPage extends BasePage {
  // ── Locators ────────────────────────────────────────────────────────────────
  readonly title: Locator;
  readonly modal: Locator;
  readonly modalTitle: Locator;
  readonly closeButton: Locator;

  constructor(page: Page) {
    super(page);
    this.title = page.getByRole('heading', { name: 'Exit Intent' });
    this.modal = page.locator('.modal');
    this.modalTitle = page.locator('.modal-title');
    this.closeButton = page.locator('.modal-footer p');
  }

  // ── Navigation ──────────────────────────────────────────────────────────────
  async goto(): Promise<void> {
    await this.page.goto('/exit_intent');
    await this.waitForPageLoad();
  }

  async waitForPageLoad(): Promise<void> {
    await this.title.waitFor({ state: 'visible' });
  }

  // ── Actions ─────────────────────────────────────────────────────────────────
  /**
   * Simulate the mouse leaving the viewport to trigger the exit-intent modal.
   * Dispatches a mouseleave event on the document (cross-browser reliable).
   */
  async triggerExitIntent(): Promise<void> {
    // Move the mouse into the page first, then dispatch the mouseleave event
    // on the document — this is more reliable cross-browser than mouse.move(y=0)
    await this.title.click();
    await this.page.mouse.move(10, 10);
    await this.page.evaluate(() => {
      document.dispatchEvent(
        new MouseEvent('mouseleave', { bubbles: false, cancelable: true })
      );
    });
    await this.page.waitForTimeout(500);
  }

  async closeModal(): Promise<void> {
    await this.closeButton.click();
    await this.modal.waitFor({ state: 'hidden' });
  }

  // ── Queries ─────────────────────────────────────────────────────────────────
  async isModalVisible(): Promise<boolean> {
    return this.modal.isVisible();
  }

  // ── Assertions ──────────────────────────────────────────────────────────────
  async assertOnPage(): Promise<void> {
    await expect(this.page).toHaveURL(/\/exit_intent/);
  }

  async assertModalVisible(): Promise<void> {
    await expect(this.modal).toBeVisible();
  }

  async assertModalHidden(): Promise<void> {
    await expect(this.modal).toBeHidden();
  }
}
