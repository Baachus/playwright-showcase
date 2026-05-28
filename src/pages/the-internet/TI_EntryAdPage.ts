import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from '../BasePage.js';

/**
 * TI_EntryAdPage
 * ─────────────────────────────────────────────────────────────────────────────
 * Represents the Entry Ad page on the-internet.herokuapp.com (/entry_ad).
 * A modal dialog appears on page load.
 */
export class TI_EntryAdPage extends BasePage {
  // ── Locators ────────────────────────────────────────────────────────────────
  readonly title: Locator;
  readonly modal: Locator;
  readonly modalTitle: Locator;
  readonly modalBody: Locator;
  readonly closeButton: Locator;
  readonly reopenLink: Locator;

  constructor(page: Page) {
    super(page);
    this.title = page.getByRole('heading', { name: 'Entry Ad' });
    this.modal = page.locator('.modal');
    this.modalTitle = page.locator('.modal-title');
    this.modalBody = page.locator('.modal-body');
    this.closeButton = page.locator('.modal-footer p');
    this.reopenLink = page.getByRole('link', { name: 'click here' });
  }

  // ── Navigation ──────────────────────────────────────────────────────────────
  async goto(): Promise<void> {
    await this.page.goto('/entry_ad');
    await this.waitForPageLoad();
  }

  async waitForPageLoad(): Promise<void> {
    await this.title.waitFor({ state: 'visible' });
  }

  // ── Actions ─────────────────────────────────────────────────────────────────
  async waitForModalVisible(): Promise<void> {
    await this.modal.waitFor({ state: 'visible' });
  }

  async closeModal(): Promise<void> {
    await this.closeButton.click();
    await this.modal.waitFor({ state: 'hidden' });
  }

  async reopenModal(): Promise<void> {
    await this.reopenLink.click();
    await this.modal.waitFor({ state: 'visible' });
  }

  // ── Queries ─────────────────────────────────────────────────────────────────
  async getModalTitleText(): Promise<string> {
    return this.modalTitle.innerText();
  }

  async isModalVisible(): Promise<boolean> {
    return this.modal.isVisible();
  }

  // ── Assertions ──────────────────────────────────────────────────────────────
  async assertOnPage(): Promise<void> {
    await expect(this.page).toHaveURL(/\/entry_ad/);
  }

  async assertModalVisible(): Promise<void> {
    await expect(this.modal).toBeVisible();
  }

  async assertModalHidden(): Promise<void> {
    await expect(this.modal).toBeHidden();
  }
}
