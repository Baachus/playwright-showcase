import { Page, Locator, APIRequestContext, expect, request } from '@playwright/test';
import { BasePage } from '../BasePage.js';

/**
 * LocalEmailAppPage
 * ─────────────────────────────────────────────────────────────────────────────
 * Page Object for the local email-sender helper service.  It exposes both:
 *   - UI helpers (`openHome`, `submitForm`) that drive the simple form at /
 *   - HTTP helpers (`triggerVerification`, `triggerOtp`, ...) that POST
 *     directly to the JSON endpoints.  These don't need a browser, so they
 *     keep the inbox-flow tests fast.
 *
 * Tests can mix and match: use the HTTP helper to trigger a send, then a
 * `Mailinator_PublicInboxPage` to read the result.
 */
export type SendResult = {
  ok: boolean;
  token?: string;
  link?: string;
  code?: string;
  attachmentName?: string;
  attachmentSize?: number;
  messageId?: string;
};

export class LocalEmailAppPage extends BasePage {
  readonly baseURL: string;

  // ── UI Locators ─────────────────────────────────────────────────────────────
  readonly toInput: Locator;
  readonly nameInput: Locator;
  readonly sendVerificationBtn: Locator;
  readonly sendOtpBtn: Locator;
  readonly sendHtmlBtn: Locator;
  readonly sendAttachmentBtn: Locator;
  readonly output: Locator;

  // ── Verify-page locators (the success page returned by GET /verify/:token) ─
  readonly verifySuccess: Locator;
  readonly verifyEmail: Locator;
  readonly verifyFailed: Locator;

  constructor(page: Page, baseURL: string) {
    super(page);
    this.baseURL = baseURL.replace(/\/$/, '');

    this.toInput             = page.getByTestId('to-input');
    this.nameInput           = page.getByTestId('name-input');
    this.sendVerificationBtn = page.getByTestId('send-verification');
    this.sendOtpBtn          = page.getByTestId('send-otp');
    this.sendHtmlBtn         = page.getByTestId('send-html');
    this.sendAttachmentBtn   = page.getByTestId('send-attachment');
    this.output              = page.getByTestId('output');

    this.verifySuccess = page.getByTestId('verify-success');
    this.verifyEmail   = page.getByTestId('verify-email');
    this.verifyFailed  = page.getByTestId('verify-failed');
  }

  // ── Navigation ──────────────────────────────────────────────────────────────
  async goto(): Promise<void> {
    await this.page.goto(this.baseURL + '/');
    await this.waitForPageLoad();
  }

  async waitForPageLoad(): Promise<void> {
    await this.toInput.waitFor({ state: 'visible' });
  }

  /** Drive the interactive form to send a verification email. */
  async submitVerificationForm(to: string, name = 'Robert'): Promise<void> {
    await this.goto();
    await this.toInput.fill(to);
    await this.nameInput.fill(name);
    await this.sendVerificationBtn.click();
    await expect(this.output).toContainText('"ok": true', { timeout: 15_000 });
  }

  // ── HTTP helpers ────────────────────────────────────────────────────────────
  private async post(path: string, body: object): Promise<SendResult> {
    const ctx: APIRequestContext = await request.newContext({ baseURL: this.baseURL });
    try {
      const res = await ctx.post(path, { data: body });
      if (!res.ok()) {
        throw new Error(`POST ${path} -> ${res.status()}: ${await res.text()}`);
      }
      return (await res.json()) as SendResult;
    } finally {
      await ctx.dispose();
    }
  }

  triggerVerification(to: string, name = 'Robert'): Promise<SendResult> {
    return this.post('/send/verification', { to, name });
  }

  triggerOtp(to: string): Promise<SendResult> {
    return this.post('/send/otp', { to });
  }

  triggerHtml(to: string): Promise<SendResult> {
    return this.post('/send/html', { to });
  }

  triggerAttachment(to: string): Promise<SendResult> {
    return this.post('/send/attachment', { to });
  }

  /** Reset server-side token / capture state (call once per test). */
  async reset(): Promise<void> {
    const ctx = await request.newContext({ baseURL: this.baseURL });
    try {
      await ctx.post('/_reset');
    } finally {
      await ctx.dispose();
    }
  }

  // ── Verify-page actions ─────────────────────────────────────────────────────
  /** Open a /verify/:token URL inside the test page and assert success. */
  async openVerifyLink(link: string): Promise<void> {
    await this.page.goto(link);
    await this.verifySuccess.waitFor({ state: 'visible' });
  }

  async assertVerifiedEmail(email: string): Promise<void> {
    await expect(this.verifyEmail).toHaveText(email);
  }
}
