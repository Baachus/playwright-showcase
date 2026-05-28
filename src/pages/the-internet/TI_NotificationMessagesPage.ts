import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from '../BasePage.js';

/**
 * TI_NotificationMessagesPage
 * ─────────────────────────────────────────────────────────────────────────────
 * Represents the Notification Messages page on the-internet.herokuapp.com
 * (/notification_message_rendered).
 */
export class TI_NotificationMessagesPage extends BasePage {
  // ── Locators ────────────────────────────────────────────────────────────────
  readonly title: Locator;
  readonly clickHereLink: Locator;
  readonly flashMessage: Locator;

  constructor(page: Page) {
    super(page);
    this.title = page.getByRole('heading', { name: 'Notification Message' });
    this.clickHereLink = page.getByRole('link', { name: 'Click here' });
    this.flashMessage = page.locator('#flash');
  }

  // ── Navigation ──────────────────────────────────────────────────────────────
  async goto(): Promise<void> {
    await this.page.goto('/notification_message_rendered');
    await this.waitForPageLoad();
  }

  async waitForPageLoad(): Promise<void> {
    await this.title.waitFor({ state: 'visible' });
  }

  // ── Actions ─────────────────────────────────────────────────────────────────
  async clickLink(): Promise<void> {
    await this.clickHereLink.click();
    await this.flashMessage.waitFor({ state: 'visible' });
  }

  // ── Queries ─────────────────────────────────────────────────────────────────
  async getFlashMessageText(): Promise<string> {
    return this.flashMessage.innerText();
  }

  async isFlashSuccess(): Promise<boolean> {
    const classes = await this.flashMessage.getAttribute('class') ?? '';
    return classes.includes('notice'); // flash uses 'notice' class for success (not 'success')
  }

  async isFlashError(): Promise<boolean> {
    const classes = await this.flashMessage.getAttribute('class') ?? '';
    return classes.includes('error');
  }

  // ── Assertions ──────────────────────────────────────────────────────────────
  async assertOnPage(): Promise<void> {
    await expect(this.page).toHaveURL(/\/notification_message/);
  }

  async assertFlashMessageVisible(): Promise<void> {
    await expect(this.flashMessage).toBeVisible();
  }

  async assertFlashMessageNotEmpty(): Promise<void> {
    const text = await this.getFlashMessageText();
    expect(text.trim()).not.toBe('');
  }
}
