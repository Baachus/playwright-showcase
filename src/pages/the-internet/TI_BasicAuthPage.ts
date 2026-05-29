import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from '../BasePage.js';

/**
 * TI_BasicAuthPage
 * ─────────────────────────────────────────────────────────────────────────────
 * Represents the Basic Auth Test page on the-internet.herokuapp.com (/basic_auth).
 */
export class TI_BasicAuthPage extends BasePage {
  // ── Locators ────────────────────────────────────────────────────────────────
  readonly title: Locator;
  readonly text:   Locator;
  readonly invalidTitle: Locator;

  constructor(page: Page) {
    super(page);

    this.title = page.getByRole('heading', { name: 'Basic Auth' });
    this.text = page.getByText('Congratulations! You must');
    this.invalidTitle = page.getByText('Not authorized');
  }

  // ── Navigation ──────────────────────────────────────────────────────────────
  /**
   * Navigate to /basic_auth without credentials.
   * NOTE: The server will respond with a 401 unless an Authorization header
   * has already been set on the context (e.g. via validLogin).
   */
  async goto(): Promise<void> {
    await this.page.goto('/basic_auth');
  }

  async waitForPageLoad(): Promise<void> {
    await this.title.waitFor({ state: 'visible' });
  }

  // ── Queries ─────────────────────────────────────────────────────────────────
  /**
   * Perform a valid Basic Auth login as admin/admin.
   *
   * HTTP Basic Auth uses a native browser dialog — there are no DOM inputs to
   * fill.  The correct Playwright approach is to attach a pre-computed
   * Authorization header to every request on the context, then navigate.
   * The server accepts the header and serves the protected page directly.
   */
  async validLogin(): Promise<void> {
    const encoded = Buffer.from('admin:admin').toString('base64');
    await this.page.context().setExtraHTTPHeaders({
      Authorization: `Basic ${encoded}`,
    });
    await this.page.goto('/basic_auth');
    await this.waitForPageLoad();
  }

  async invalidLogin(): Promise<void> {
    // Chromium blocks page.goto() while the native Basic-Auth dialog is open —
    // the navigation never "commits" until credentials are provided or cancelled.
    //
    // Strategy:
    //  1. Fire goto() WITHOUT awaiting it so the navigation starts in the background.
    //  2. waitForResponse() operates at the CDP/network layer and resolves as soon
    //     as the 401 response headers arrive — this fires WHILE goto() is suspended
    //     on the dialog, giving us a reliable signal that the dialog is now showing.
    //  3. Press Escape to cancel the credential challenge.
    //  4. await the original goto() — after Escape, Chrome renders the 401 page
    //     and the navigation resolves normally.
    const navigation = this.page
      .goto('/basic_auth', { timeout: 15_000 })
      .catch(() => { /* 401 is a valid outcome; suppress navigation errors */ });

    await this.page.waitForResponse(
      (resp) => resp.url().includes('/basic_auth') && resp.status() === 401,
      { timeout: 10_000 },
    );

    navigation;
    await this.page.keyboard.press('Escape');
    await this.page.waitForLoadState('domcontentloaded');
  }

  // ── Assertions ──────────────────────────────────────────────────────────────
  /**
   * Assert the page loaded on the correct URL.
   */
  async assertOnAddRemoveElementPage(): Promise<void> {
    await expect(this.page).toHaveURL(/\/basic_auth/);
  }
}
