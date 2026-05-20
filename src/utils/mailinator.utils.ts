/**
 * Mailinator utilities
 * ─────────────────────────────────────────────────────────────────────────────
 * Mailinator's public inboxes are free to use but the read API is paid-only.
 * For the public/free tier we navigate the web UI with Playwright -- this
 * module is a thin layer of helpers used by both the page object and the
 * specs themselves.
 *
 * Inbox names
 *   Mailinator's public inboxes are world-readable -- any test in the world
 *   could be picking up your messages.  Always generate a fresh, unique inbox
 *   per test run with mintInboxName().
 *
 * Reading the inbox
 *   Mailinator's UI lives at https://www.mailinator.com/v4/public/inboxes.jsp
 *   The row list and message body are rendered inside iframes / dynamic DOM
 *   that occasionally changes.  Keep selectors tolerant -- prefer text-based
 *   role queries over brittle CSS paths.  The MailinatorPage object wraps the
 *   concrete selectors so that if Mailinator changes its markup you only fix
 *   one file.
 */
import { randomBytes } from 'node:crypto';

export const MAILINATOR_PUBLIC_BASE = 'https://www.mailinator.com';
export const MAILINATOR_PUBLIC_INBOX_URL = (inbox: string): string =>
  `${MAILINATOR_PUBLIC_BASE}/v4/public/inboxes.jsp?to=${encodeURIComponent(inbox)}`;

/**
 * Mint a fresh public-inbox name that is highly unlikely to collide with
 * any other test (locally or globally).
 *
 * Format: <prefix>-<unix-ms>-<6 hex bytes>
 */
export function mintInboxName(prefix = 'pwshowcase'): string {
  return `${prefix}-${Date.now()}-${randomBytes(3).toString('hex')}`;
}

/** Full mailbox address for a given local part. */
export function inboxToAddress(inbox: string): string {
  return `${inbox}@mailinator.com`;
}

/**
 * Extract the first http(s) URL from an email body.  Used by the verification
 * scenario to recover the click-through link from the message preview.
 */
export function extractFirstLink(body: string): string | null {
  const match = body.match(/https?:\/\/[^\s"'<>]+/);
  return match ? match[0] : null;
}

/**
 * Extract the first link whose URL matches the given predicate.  Useful when
 * a message contains tracking links and you want the actual verification URL.
 */
export function extractLink(body: string, predicate: (url: string) => boolean): string | null {
  const re = /https?:\/\/[^\s"'<>]+/g;
  for (const match of body.matchAll(re)) {
    if (predicate(match[0])) return match[0];
  }
  return null;
}

/**
 * Extract a fixed-length numeric OTP code from an email body.  Defaults to
 * 6 digits, which is what the local sender app produces.
 */
export function extractOtp(body: string, length = 6): string | null {
  const re = new RegExp(`(?<!\\d)(\\d{${length}})(?!\\d)`);
  const m = body.match(re);
  return m ? m[1] : null;
}
