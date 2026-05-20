import { Page, Locator, expect, FrameLocator } from '@playwright/test';
import { BasePage } from '../BasePage.js';
import { MAILINATOR_PUBLIC_INBOX_URL } from '@utils/mailinator.utils.js';

/**
 * Mailinator_PublicInboxPage
 * ─────────────────────────────────────────────────────────────────────────────
 * Page Object for Mailinator's free public-inbox UI.
 *
 *   URL:  https://www.mailinator.com/v4/public/inboxes.jsp?to=<inbox>
 *
 * Mailinator's read API is paid-only.  On the free tier the only way to
 * read messages programmatically is by driving the website with Playwright.
 * That makes selectors a bit fragile, so every concrete selector lives here
 * and helpers expose stable behaviour to tests.
 *
 * Anatomy of the page (as of 2026)
 *   - Top row contains the inbox switcher and a Refresh button.
 *   - A grid of message rows -- each row has a sender, subject and time
 *     column.  Clicking a row loads the message body into an iframe.
 *   - The body iframe is named #html_msg_body (rich HTML) with a sibling
 *     #text_msg_body for the plain-text alternative.
 *   - Attachments appear as links below the message header.
 */
export class Mailinator_PublicInboxPage extends BasePage {
  readonly inbox: string;

  // ── Locators ────────────────────────────────────────────────────────────────
  readonly refreshButton: Locator;
  readonly inboxField: Locator;
  readonly goButton: Locator;
  readonly rows: Locator;
  readonly messageHeading: Locator;
  readonly attachmentsContainer: Locator;
  readonly htmlBodyFrame: FrameLocator;
  readonly textBodyFrame: FrameLocator;

  constructor(page: Page, inbox: string) {
    super(page);
    this.inbox = inbox;

    // Tolerant selectors: prefer role + accessible name, fall back to CSS ids
    // Mailinator has used historically.
    this.refreshButton        = page.getByRole('button', { name: /refresh/i });
    this.inboxField           = page.getByPlaceholder(/inbox/i).first();
    this.goButton             = page.getByRole('button', { name: /^go$/i });
    this.rows                 = page.locator('#inbox_pane tr, table tbody tr').filter({ hasText: /.+/ });
    this.messageHeading       = page.locator('#message_heading, .message_heading');
    this.attachmentsContainer = page.locator('#email_attachments, .attachments');
    this.htmlBodyFrame        = page.frameLocator('#html_msg_body');
    this.textBodyFrame        = page.frameLocator('#text_msg_body');
  }

  // ── Navigation ──────────────────────────────────────────────────────────────
  async goto(): Promise<void> {
    await this.page.goto(MAILINATOR_PUBLIC_INBOX_URL(this.inbox), { waitUntil: 'domcontentloaded' });
    await this.waitForPageLoad();
  }

  async waitForPageLoad(): Promise<void> {
    // The inbox loads progressively.  Wait for either the table to be
    // present or the "empty inbox" placeholder -- whichever appears.
    await this.page
      .locator('#inbox_pane, table, text=/your public inbox/i')
      .first()
      .waitFor({ state: 'visible', timeout: 15_000 });
  }

  // ── Polling helpers ─────────────────────────────────────────────────────────
  /**
   * Poll the inbox until at least one message arrives, or until `timeoutMs`
   * elapses.  Mailinator does not push -- the page must be refreshed.  The
   * refresh button reloads the list without re-navigating.
   */
  async waitForAnyMessage(opts: { timeoutMs?: number; intervalMs?: number } = {}): Promise<void> {
    const timeoutMs = opts.timeoutMs ?? 60_000;
    const intervalMs = opts.intervalMs ?? 4_000;
    const deadline = Date.now() + timeoutMs;
    while (Date.now() < deadline) {
      const count = await this.rows.count();
      if (count > 0) return;
      await this.refresh();
      await this.page.waitForTimeout(intervalMs);
    }
    throw new Error(
      `Mailinator inbox "${this.inbox}" did not receive any messages within ${timeoutMs}ms.`,
    );
  }

  /**
   * Poll until a row whose subject matches the predicate exists.  Returns the
   * matching row locator -- the caller can click it to open the message.
   */
  async waitForMessageBySubject(
    subject: string | RegExp,
    opts: { timeoutMs?: number; intervalMs?: number } = {},
  ): Promise<Locator> {
    const timeoutMs = opts.timeoutMs ?? 60_000;
    const intervalMs = opts.intervalMs ?? 4_000;
    const deadline = Date.now() + timeoutMs;
    while (Date.now() < deadline) {
      const row = this.rows.filter({ hasText: subject });
      if (await row.count()) return row.first();
      await this.refresh();
      await this.page.waitForTimeout(intervalMs);
    }
    throw new Error(
      `Mailinator inbox "${this.inbox}" did not receive a message matching ${String(subject)} within ${timeoutMs}ms.`,
    );
  }

  /** Click the in-page refresh button (no full navigation). */
  async refresh(): Promise<void> {
    if (await this.refreshButton.isVisible().catch(() => false)) {
      await this.refreshButton.click();
    } else {
      await this.page.reload({ waitUntil: 'domcontentloaded' });
      await this.waitForPageLoad();
    }
  }

  // ── Message interaction ─────────────────────────────────────────────────────
  /** Open the first message in the list. */
  async openFirstMessage(): Promise<void> {
    await this.rows.first().click();
    await this.messageHeading.waitFor({ state: 'visible', timeout: 10_000 });
  }

  /** Open a message by clicking the row matched earlier with waitForMessageBySubject. */
  async openMessage(row: Locator): Promise<void> {
    await row.click();
    await this.messageHeading.waitFor({ state: 'visible', timeout: 10_000 });
  }

  /**
   * Return the rendered HTML body's inner text.  Useful for free-form
   * assertions ("contains OTP", "contains link") regardless of markup.
   */
  async getHtmlBodyText(): Promise<string> {
    const body = this.htmlBodyFrame.locator('body');
    await body.waitFor({ state: 'visible', timeout: 10_000 });
    return (await body.innerText()).trim();
  }

  /** Return the plain-text alternative if the message provided one. */
  async getPlainBodyText(): Promise<string> {
    const body = this.textBodyFrame.locator('body');
    await body.waitFor({ state: 'attached', timeout: 10_000 });
    return (await body.innerText()).trim();
  }

  /** Get the value of an href on any link inside the HTML body. */
  async getFirstLinkHref(): Promise<string | null> {
    const first = this.htmlBodyFrame.locator('a[href^="http"]').first();
    if (!(await first.count())) return null;
    return first.getAttribute('href');
  }

  /** List the attachment filenames Mailinator surfaces for the open message. */
  async listAttachmentNames(): Promise<string[]> {
    if (!(await this.attachmentsContainer.isVisible().catch(() => false))) return [];
    return this.attachmentsContainer
      .locator('a')
      .allInnerTexts()
      .then(items => items.map(s => s.trim()).filter(Boolean));
  }

  // ── Assertions ──────────────────────────────────────────────────────────────
  async assertOnInbox(): Promise<void> {
    await expect(this.page).toHaveURL(/\/v4\/public\/inboxes\.jsp/);
  }

  async assertHasMessages(): Promise<void> {
    await expect(this.rows.first()).toBeVisible();
  }
}
