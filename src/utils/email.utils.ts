/**
 * Email test utilities (Mailpit)
 * ─────────────────────────────────────────────────────────────────────────────
 * The Email project delivers mail to a local Mailpit instance (SMTP capture
 * server + REST API).  These helpers are shared by the fixtures, the page
 * object, and the specs.
 *
 * Addresses
 *   Mailpit accepts mail for any address, so we mint a fresh, unique recipient
 *   per test.  A unique address per test keeps Mailpit searches (`to:<addr>`)
 *   perfectly isolated even when tests run in parallel against one server.
 */
import { randomBytes } from 'node:crypto';

/** Base URL of the Mailpit HTTP API.  Overridable for CI / custom ports. */
export const MAILPIT_API_BASE =
  process.env.MAILPIT_API_BASE ?? 'http://127.0.0.1:8025';

/** Domain used for test recipients.  Purely cosmetic -- Mailpit accepts all. */
export const TEST_EMAIL_DOMAIN =
  process.env.TEST_EMAIL_DOMAIN ?? 'playwright-showcase.test';

/**
 * Mint a fresh inbox/local-part that is highly unlikely to collide with any
 * other test in the same run.  Format: <prefix>-<unix-ms>-<6 hex chars>
 */
export function mintInboxName(prefix = 'pwshowcase'): string {
  return `${prefix}-${Date.now()}-${randomBytes(3).toString('hex')}`;
}

/** Full mailbox address for a given local part. */
export function inboxToAddress(inbox: string): string {
  return `${inbox}@${TEST_EMAIL_DOMAIN}`;
}

/**
 * Extract the first http(s) URL from an email body.
 */
export function extractFirstLink(body: string): string | null {
  const match = body.match(/https?:\/\/[^\s"'<>]+/);
  return match ? match[0] : null;
}

/**
 * Extract the first link whose URL matches the given predicate.  Useful when
 * a message contains several links and you want a specific one.
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
