/**
 * Local Email Sender App
 * ─────────────────────────────────────────────────────────────────────────────
 * A tiny Express + nodemailer service used by the Playwright `Email` project
 * to simulate a real application that sends verification / OTP / HTML /
 * attachment emails.  Each tested scenario hits one HTTP endpoint here, this
 * server composes the email and dispatches it to an SMTP recipient (in the
 * test setup, a local Mailpit capture server).
 *
 * Why this exists:
 *   the-internet.herokuapp.com (the project's main demo target) does not
 *   actually send email.  This local service gives us a fully controllable
 *   email-producing system that Playwright can drive.  In the test setup it
 *   relays over SMTP to a local Mailpit capture server, and the specs read the
 *   result back via Mailpit's REST API.
 *
 * Transports
 *   - SMTP relay (used by the tests): set SMTP_HOST / SMTP_PORT (/ SMTP_USER /
 *     SMTP_PASS) to relay through an SMTP server.  The Playwright config points
 *     these at the local Mailpit sink (127.0.0.1:1025).  Any real SMTP provider
 *     (Brevo, SendGrid, Mailtrap, ...) works too.
 *   - MX direct (default when no SMTP_HOST): nodemailer looks up the
 *     recipient's MX records and delivers on port 25.  Requires outbound 25,
 *     which is blocked on most dev machines / CI -- prefer the SMTP relay.
 *   - Capture: set EMAIL_CAPTURE=1 to skip real delivery entirely and store
 *     emails in memory.  Useful for unit-style runs where you only want to
 *     assert on payloads.
 *
 * Endpoints
 *   POST /send/verification   { to, name? }      -> sends a verification link
 *   POST /send/otp            { to }             -> sends a 6-digit OTP
 *   POST /send/html           { to }             -> sends a rich HTML email
 *   POST /send/attachment     { to }             -> sends an attachment + HTML
 *   GET  /verify/:token                          -> "verifies" a token
 *   GET  /captured                               -> dump captured emails
 *   GET  /healthz                                -> readiness probe
 *
 * NOTE: This file is intentionally framework-light -- it is not the system
 * under test in the traditional sense.  It is a controllable stand-in for an
 * upstream service so the email-verification *flow* can be exercised
 * end-to-end with real network delivery.
 */
import express, { type Request, type Response } from 'express';
import nodemailer, { type Transporter } from 'nodemailer';
import { randomBytes, randomInt } from 'node:crypto';
import { promises as dns } from 'node:dns';

// ── Config ────────────────────────────────────────────────────────────────────
const PORT = Number(process.env.EMAIL_APP_PORT ?? 4310);
const FROM_ADDRESS = process.env.EMAIL_FROM ?? 'no-reply@playwright-showcase.test';
const FROM_NAME = process.env.EMAIL_FROM_NAME ?? 'Playwright Showcase';
const APP_BASE_URL = process.env.EMAIL_APP_BASE_URL ?? `http://localhost:${PORT}`;
const CAPTURE_MODE = process.env.EMAIL_CAPTURE === '1';

// ── Token store ───────────────────────────────────────────────────────────────
type VerificationRecord = { token: string; email: string; verifiedAt?: number };
const tokens = new Map<string, VerificationRecord>();
const otps = new Map<string, { code: string; createdAt: number }>();

// In-memory capture (only populated when CAPTURE_MODE is on).
type CapturedEmail = {
  to: string;
  subject: string;
  text: string | undefined;
  html: string | undefined;
  attachments?: { filename: string; size: number }[];
  sentAt: number;
};
const captured: CapturedEmail[] = [];

// ── Transport ─────────────────────────────────────────────────────────────────
// nodemailer v7 dropped the built-in direct-MX transport.  We support three
// modes:
//   - CAPTURE_MODE          -> in-memory jsonTransport, no network I/O
//   - SMTP_HOST provided    -> classic SMTP relay (Brevo, Mailtrap, ...)
//   - otherwise (default)   -> per-recipient MX lookup + plain SMTP on port 25
const HELO_NAME = process.env.EMAIL_HELO ?? 'playwright-showcase.test';
const captureTransport = nodemailer.createTransport({ jsonTransport: true });
const relayTransport: Transporter | null = process.env.SMTP_HOST
  ? nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT ?? 587),
      secure: process.env.SMTP_SECURE === '1',
      auth: process.env.SMTP_USER
        ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS ?? '' }
        : undefined,
      name: HELO_NAME,
    })
  : null;

const mxTransportCache = new Map<string, Transporter>();
async function getMxTransport(recipientDomain: string): Promise<Transporter> {
  const cached = mxTransportCache.get(recipientDomain);
  if (cached) return cached;
  const records = await dns.resolveMx(recipientDomain);
  if (!records.length) throw new Error(`No MX records for ${recipientDomain}`);
  records.sort((a, b) => a.priority - b.priority);
  const exchange = records[0].exchange;
  const t = nodemailer.createTransport({
    host: exchange,
    port: 25,
    secure: false,
    name: HELO_NAME,
    tls: { rejectUnauthorized: false }, // many MX hosts use self-signed certs
    connectionTimeout: 15_000,
    greetingTimeout: 15_000,
    socketTimeout: 30_000,
  });
  mxTransportCache.set(recipientDomain, t);
  return t;
}

function recipientDomain(to: unknown): string {
  const s = String(to);
  const at = s.lastIndexOf('@');
  if (at < 0) throw new Error(`Recipient missing @-domain: ${s}`);
  return s.slice(at + 1).trim().toLowerCase();
}

async function pickTransport(to: unknown): Promise<Transporter> {
  if (CAPTURE_MODE) return captureTransport;
  if (relayTransport) return relayTransport;
  return getMxTransport(recipientDomain(to));
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function mkToken(): string {
  return randomBytes(16).toString('hex');
}

function mkOtp(): string {
  return String(randomInt(0, 1_000_000)).padStart(6, '0');
}

async function sendOrCapture(message: nodemailer.SendMailOptions): Promise<{ messageId?: string }> {
  if (CAPTURE_MODE) {
    captured.push({
      to: String(message.to),
      subject: String(message.subject ?? ''),
      text: typeof message.text === 'string' ? message.text : undefined,
      html: typeof message.html === 'string' ? message.html : undefined,
      attachments: Array.isArray(message.attachments)
        ? message.attachments.map(a => ({
            filename: String(a.filename ?? 'attachment'),
            size:
              typeof a.content === 'string'
                ? Buffer.byteLength(a.content)
                : a.content instanceof Buffer
                  ? a.content.length
                  : 0,
          }))
        : undefined,
      sentAt: Date.now(),
    });
    return { messageId: `captured-${captured.length}` };
  }
  const transport = await pickTransport(message.to);
  const info = await transport.sendMail({ from: { name: FROM_NAME, address: FROM_ADDRESS }, ...message });
  return { messageId: info.messageId };
}

// ── Email templates ───────────────────────────────────────────────────────────
function renderVerificationHtml(name: string, link: string): string {
  return `
  <!doctype html>
  <html><body style="font-family: Arial, sans-serif; color:#222;">
    <h1 style="color:#2b6cb0;">Verify your email</h1>
    <p>Hi ${escapeHtml(name)},</p>
    <p>Thanks for signing up with Playwright Showcase. Please confirm your
    email address by clicking the button below.</p>
    <p>
      <a href="${link}"
         style="display:inline-block;padding:12px 20px;background:#2b6cb0;
                color:#fff;text-decoration:none;border-radius:6px;">
        Verify my email
      </a>
    </p>
    <p>Or paste this link into your browser:<br><code>${link}</code></p>
    <p style="color:#888;font-size:12px;">This link will expire in 24 hours.</p>
  </body></html>`;
}

function renderOtpHtml(code: string): string {
  return `
  <!doctype html>
  <html><body style="font-family: Arial, sans-serif; color:#222;">
    <h1>Your one-time code</h1>
    <p>Use the following code to finish signing in:</p>
    <p style="font-size:32px;letter-spacing:6px;font-weight:700;
              background:#f1f5f9;padding:16px;border-radius:8px;display:inline-block;">
      ${code}
    </p>
    <p style="color:#888;font-size:12px;">The code expires in 10 minutes.</p>
  </body></html>`;
}

function renderRichHtml(): string {
  return `
  <!doctype html>
  <html><body style="font-family: Arial, sans-serif;">
    <h1 id="hello-heading">Hello, traveller!</h1>
    <p>This is a <strong>rich HTML</strong> message used to verify that
    email clients render formatted bodies correctly.</p>
    <ul>
      <li>Item one</li>
      <li>Item two</li>
      <li id="last-bullet">Item three</li>
    </ul>
    <p><a id="docs-link" href="https://playwright.dev/docs/intro">Open the docs</a></p>
  </body></html>`;
}

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, c => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  }[c]!));
}

// ── Express app ───────────────────────────────────────────────────────────────
const app = express();
app.use(express.json());

// Simple landing page lets you drive the flows without the API client.
app.get('/', (_req, res) => {
  res.type('html').send(`
    <!doctype html><html><body style="font-family:Arial,sans-serif;max-width:640px;margin:40px auto;">
      <h1>Playwright Showcase -- Email Sender</h1>
      <p>Endpoints:</p>
      <ul>
        <li><code>POST /send/verification</code></li>
        <li><code>POST /send/otp</code></li>
        <li><code>POST /send/html</code></li>
        <li><code>POST /send/attachment</code></li>
        <li><code>GET  /verify/:token</code></li>
        <li><code>GET  /captured</code> (capture mode only)</li>
      </ul>
      <form id="trigger" data-test="trigger-form">
        <label>To: <input data-test="to-input" name="to" placeholder="test@mailinator.com" /></label>
        <label>Name: <input data-test="name-input" name="name" placeholder="Robert" /></label>
        <button type="button" data-test="send-verification" onclick="trigger('verification')">Send verification</button>
        <button type="button" data-test="send-otp"          onclick="trigger('otp')">Send OTP</button>
        <button type="button" data-test="send-html"         onclick="trigger('html')">Send HTML</button>
        <button type="button" data-test="send-attachment"   onclick="trigger('attachment')">Send attachment</button>
      </form>
      <pre data-test="output" id="output" style="background:#f1f5f9;padding:12px;"></pre>
      <script>
        async function trigger(kind) {
          const form = document.getElementById('trigger');
          const to = form.to.value;
          const name = form.name.value || undefined;
          const res = await fetch('/send/' + kind, {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify({ to, name }),
          });
          const body = await res.text();
          document.getElementById('output').textContent = body;
        }
      </script>
    </body></html>
  `);
});

app.get('/healthz', (_req, res) => {
  res.json({ ok: true, transport: CAPTURE_MODE ? 'capture' : process.env.SMTP_HOST ? 'smtp' : 'direct' });
});

app.post('/send/verification', async (req: Request, res: Response) => {
  try {
    const { to, name = 'there' } = req.body ?? {};
    if (!to) return res.status(400).json({ error: 'missing "to"' });
    const token = mkToken();
    tokens.set(token, { token, email: to });
    const link = `${APP_BASE_URL}/verify/${token}`;
    const result = await sendOrCapture({
      to,
      subject: 'Please verify your email -- Playwright Showcase',
      text: `Hi ${name},\n\nVerify your email by opening this link:\n${link}\n`,
      html: renderVerificationHtml(name, link),
      headers: { 'X-Test-Kind': 'verification' },
    });
    res.json({ ok: true, token, link, ...result });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

app.post('/send/otp', async (req: Request, res: Response) => {
  try {
    const { to } = req.body ?? {};
    if (!to) return res.status(400).json({ error: 'missing "to"' });
    const code = mkOtp();
    otps.set(to, { code, createdAt: Date.now() });
    const result = await sendOrCapture({
      to,
      subject: `Your sign-in code is ${code}`,
      text: `Your one-time code is: ${code}\nIt expires in 10 minutes.`,
      html: renderOtpHtml(code),
      headers: { 'X-Test-Kind': 'otp' },
    });
    res.json({ ok: true, code, ...result });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

app.post('/send/html', async (req: Request, res: Response) => {
  try {
    const { to } = req.body ?? {};
    if (!to) return res.status(400).json({ error: 'missing "to"' });
    const result = await sendOrCapture({
      to,
      subject: 'Welcome to Playwright Showcase (rich HTML)',
      text: 'Hello, traveller! See the HTML version of this email.',
      html: renderRichHtml(),
      headers: { 'X-Test-Kind': 'html' },
    });
    res.json({ ok: true, ...result });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

app.post('/send/attachment', async (req: Request, res: Response) => {
  try {
    const { to } = req.body ?? {};
    if (!to) return res.status(400).json({ error: 'missing "to"' });
    const csv = 'name,score\nAda,99\nGrace,98\nLinus,97\n';
    const result = await sendOrCapture({
      to,
      subject: 'Your weekly report (with attachment)',
      text: 'Your CSV report is attached.',
      html: '<p>Your CSV report is attached. See the <code>report.csv</code> file.</p>',
      attachments: [{ filename: 'report.csv', content: csv, contentType: 'text/csv' }],
      headers: { 'X-Test-Kind': 'attachment' },
    });
    res.json({ ok: true, attachmentName: 'report.csv', attachmentSize: csv.length, ...result });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

app.get('/verify/:token', (req: Request, res: Response) => {
  // Express 5 widens req.params values to string | string[]; the route only
  // matches the single-segment :token so the string[] branch is unreachable.
  const token = Array.isArray(req.params.token) ? req.params.token[0] : req.params.token;
  const record = tokens.get(token);
  if (!record) {
    return res.status(404).type('html').send(`
      <html><body style="font-family:Arial;margin:40px;">
        <h1 data-test="verify-failed">Invalid or expired token</h1>
      </body></html>`);
  }
  record.verifiedAt = Date.now();
  res.type('html').send(`
    <html><body style="font-family:Arial;margin:40px;">
      <div data-test="verify-success">
        <h1>Email verified</h1>
        <p>Thanks <span data-test="verify-email">${escapeHtml(record.email)}</span>,
        your address is now confirmed.</p>
      </div>
    </body></html>`);
});

app.get('/captured', (_req: Request, res: Response) => {
  res.json({ count: captured.length, emails: captured });
});

// Reset endpoint used by test setup to clear stored tokens / captures.
app.post('/_reset', (_req, res) => {
  tokens.clear();
  otps.clear();
  captured.length = 0;
  res.json({ ok: true });
});

// ── Entry point ───────────────────────────────────────────────────────────────
const server = app.listen(PORT, () => {
  console.log(`[email-sender] listening on ${APP_BASE_URL} (transport: ${
    CAPTURE_MODE ? 'capture' : process.env.SMTP_HOST ? 'smtp' : 'direct'
  })`);
});

function shutdown(signal: string): void {
  console.log(`[email-sender] received ${signal}, closing...`);
  server.close(() => process.exit(0));
  setTimeout(() => process.exit(1), 5000).unref();
}
process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));
