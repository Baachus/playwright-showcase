import { APIRequestContext, request } from '@playwright/test';
import { MAILPIT_API_BASE } from '@utils/email.utils.js';

/**
 * MailpitInboxPage
 * ─────────────────────────────────────────────────────────────────────────────
 * REST-based reader for a single test's mailbox in a local Mailpit server.
 *
 * Unlike the previous Mailinator page object, this does NOT drive a browser UI.
 * Mailpit exposes a clean JSON API, so reading mail is fast and deterministic:
 * no iframes, no flaky selectors, attachments are first-class.
 *
 * Scope
 *   Each instance is bound to one recipient `address`.  All reads filter by
 *   `to:<address>` so parallel tests never see each other's mail.
 *
 * Mailpit API used
 *   GET    /api/v1/search?query=to:<addr>     -> message summaries
 *   GET    /api/v1/message/{ID}                -> full message (HTML/Text/Attachments)
 *   GET    /api/v1/message/{ID}/part/{PartID}  -> raw attachment bytes
 *   DELETE /api/v1/messages  { IDs: [...] }     -> delete messages
 */

export type MailpitSummary = {
  ID: string;
  Subject: string;
  To: { Name: string; Address: string }[];
  Attachments: number;
  Created: string;
};

export type MailpitAttachment = {
  PartID: string;
  FileName: string;
  ContentType: string;
  Size: number;
};

export type MailpitMessage = {
  ID: string;
  Subject: string;
  Text: string;
  HTML: string;
  Attachments: MailpitAttachment[];
};

export class MailpitInboxPage {
  readonly address: string;
  private readonly apiBase: string;
  private ctx: APIRequestContext | null = null;
  /** ID of the message most recently matched/opened. */
  private currentId: string | null = null;

  constructor(address: string, apiBase: string = MAILPIT_API_BASE) {
    this.address = address;
    this.apiBase = apiBase.replace(/\/$/, '');
  }

  private async api(): Promise<APIRequestContext> {
    if (!this.ctx) this.ctx = await request.newContext({ baseURL: this.apiBase });
    return this.ctx;
  }

  /** Dispose the underlying request context (call from a fixture teardown). */
  async dispose(): Promise<void> {
    if (this.ctx) {
      await this.ctx.dispose();
      this.ctx = null;
    }
  }

  // ── Search / polling ────────────────────────────────────────────────────────
  /** Return all message summaries currently addressed to this mailbox. */
  async listMessages(): Promise<MailpitSummary[]> {
    const ctx = await this.api();
    const res = await ctx.get('/api/v1/search', {
      params: { query: `to:"${this.address}"`, limit: 50 },
    });
    if (!res.ok()) throw new Error(`Mailpit search failed: ${res.status()} ${await res.text()}`);
    const body = (await res.json()) as { messages?: MailpitSummary[] };
    return body.messages ?? [];
  }

  /**
   * Poll until a message whose subject matches `subject` arrives for this
   * mailbox.  Remembers the matched message id for subsequent reads, and
   * returns the summary.
   */
  async waitForMessageBySubject(
    subject: string | RegExp,
    opts: { timeoutMs?: number; intervalMs?: number } = {},
  ): Promise<MailpitSummary> {
    const timeoutMs = opts.timeoutMs ?? 30_000;
    const intervalMs = opts.intervalMs ?? 1_000;
    const matches = (s: string): boolean =>
      typeof subject === 'string' ? s.includes(subject) : subject.test(s);

    const deadline = Date.now() + timeoutMs;
    let lastSeen = 0;
    while (Date.now() < deadline) {
      const messages = await this.listMessages();
      lastSeen = messages.length;
      const hit = messages.find(m => matches(m.Subject));
      if (hit) {
        this.currentId = hit.ID;
        return hit;
      }
      await new Promise(r => setTimeout(r, intervalMs));
    }
    throw new Error(
      `Mailpit mailbox "${this.address}" did not receive a message matching ` +
        `${String(subject)} within ${timeoutMs}ms (saw ${lastSeen} message(s)).`,
    );
  }

  // ── Message reads ───────────────────────────────────────────────────────────
  /** Fetch the full message; defaults to the last matched/opened message. */
  async getMessage(id: string | null = this.currentId): Promise<MailpitMessage> {
    if (!id) throw new Error('No message selected -- call waitForMessageBySubject first.');
    const ctx = await this.api();
    const res = await ctx.get(`/api/v1/message/${id}`);
    if (!res.ok()) throw new Error(`Mailpit message fetch failed: ${res.status()}`);
    return (await res.json()) as MailpitMessage;
  }

  /** Visible text of the rendered HTML body (tags stripped). */
  async getHtmlBodyText(): Promise<string> {
    const msg = await this.getMessage();
    return htmlToText(msg.HTML || '');
  }

  /** Raw HTML markup of the message body. */
  async getHtmlBodyMarkup(): Promise<string> {
    const msg = await this.getMessage();
    return msg.HTML || '';
  }

  /** Plain-text alternative part, if the message provided one. */
  async getPlainBodyText(): Promise<string> {
    const msg = await this.getMessage();
    return (msg.Text || '').trim();
  }

  /** href of the first http(s) anchor in the HTML body, or null. */
  async getFirstLinkHref(): Promise<string | null> {
    const msg = await this.getMessage();
    const m = (msg.HTML || '').match(/href\s*=\s*["'](https?:\/\/[^"']+)["']/i);
    return m ? m[1] : null;
  }

  // ── Attachments ─────────────────────────────────────────────────────────────
  /** Attachment filenames Mailpit parsed out of the open message. */
  async listAttachmentNames(): Promise<string[]> {
    const msg = await this.getMessage();
    return (msg.Attachments ?? []).map(a => a.FileName);
  }

  /** Return an attachment's metadata by (case-insensitive) filename match. */
  async findAttachment(name: string | RegExp): Promise<MailpitAttachment | null> {
    const msg = await this.getMessage();
    const match = (f: string): boolean =>
      typeof name === 'string' ? f.toLowerCase() === name.toLowerCase() : name.test(f);
    return (msg.Attachments ?? []).find(a => match(a.FileName)) ?? null;
  }

  /** Download an attachment's bytes as UTF-8 text by filename. */
  async getAttachmentText(name: string | RegExp): Promise<string> {
    const att = await this.findAttachment(name);
    if (!att) throw new Error(`Attachment ${String(name)} not found on message ${this.currentId}`);
    const ctx = await this.api();
    const res = await ctx.get(`/api/v1/message/${this.currentId}/part/${att.PartID}`);
    if (!res.ok()) throw new Error(`Attachment download failed: ${res.status()}`);
    return res.text();
  }

  // ── Housekeeping ────────────────────────────────────────────────────────────
  /** Delete every message currently in this mailbox. */
  async clear(): Promise<void> {
    const ids = (await this.listMessages()).map(m => m.ID);
    if (!ids.length) return;
    const ctx = await this.api();
    await ctx.delete('/api/v1/messages', { data: { IDs: ids } });
  }
}

/** Minimal HTML→text: drop tags, decode common entities, collapse whitespace. */
function htmlToText(html: string): string {
  return html
    .replace(/<\s*(script|style)[^>]*>[\s\S]*?<\s*\/\s*\1\s*>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/\s+/g, ' ')
    .trim();
}
