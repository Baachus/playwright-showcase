import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from '../BasePage.js';

/**
 * TI_JavaScriptErrorPage
 * ─────────────────────────────────────────────────────────────────────────────
 * Represents the JavaScript Error page on the-internet.herokuapp.com (/javascript_error).
 * The page itself triggers a JS error on load. There is no heading — the page
 * title is "Page with JavaScript errors on load" and the body contains a <p>.
 */
export class TI_JavaScriptErrorPage extends BasePage {
  // ── Locators ────────────────────────────────────────────────────────────────
  readonly bodyParagraph: Locator;

  constructor(page: Page) {
    super(page);
    // The page has no h1/h3 heading — match the paragraph text directly.
    this.bodyParagraph = page.locator('p').first();
  }

  // ── Navigation ──────────────────────────────────────────────────────────────
  async goto(): Promise<void> {
    await this.page.goto('/javascript_error');
    await this.waitForPageLoad();
  }

  async waitForPageLoad(): Promise<void> {
    await this.page.waitForLoadState('domcontentloaded');
  }

  // ── Queries ─────────────────────────────────────────────────────────────────
  /**
   * Collect JavaScript page errors. Register this listener BEFORE calling goto()
   * to capture errors that fire on load.
   */
  collectPageErrors(): string[] {
    const errors: string[] = [];
    this.page.on('pageerror', (err) => errors.push(err.message));
    return errors;
  }

  // ── Assertions ──────────────────────────────────────────────────────────────
  async assertOnPage(): Promise<void> {
    await expect(this.page).toHaveURL(/\/javascript_error/);
  }

  async assertPageTitleContains(text: string): Promise<void> {
    await expect(this.page).toHaveTitle(new RegExp(text, 'i'));
  }

  async assertBodyParagraphVisible(): Promise<void> {
    await expect(this.bodyParagraph).toBeVisible();
  }
}
