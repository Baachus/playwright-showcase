# Email Sender (local helper)

A tiny Express + nodemailer service used by the `Email` Playwright project to
simulate an upstream application that sends verification / OTP / HTML /
attachment emails.  It is **not** the system under test in the strict sense --
it is a controllable stand-in so the email-verification *flow* can be
exercised end-to-end with real network delivery.

## Why a local helper

`the-internet.herokuapp.com` (the project's main demo target) does not
actually send email.  This service gives us a fully controllable producer that
Playwright can drive.  It relays mail over SMTP to a local **Mailpit** capture
server (see `tools/mailpit/`), and the specs read the result back through
Mailpit's REST API — fully local, no internet, no port 25, no third-party inbox.

## Run

```bash
# From repo root:
npx tsx tools/email-sender/server.ts
```

The Playwright `Email` project boots this for you via `webServer`, so you
rarely need to run it manually.

## Configuration

| env                  | default                                | meaning                                                   |
| -------------------- | -------------------------------------- | --------------------------------------------------------- |
| `EMAIL_APP_PORT`     | `4310`                                 | HTTP port                                                 |
| `EMAIL_APP_BASE_URL` | `http://localhost:<port>`              | Public base URL used inside verification links            |
| `EMAIL_FROM`         | `no-reply@playwright-showcase.test`    | From: address                                             |
| `EMAIL_FROM_NAME`    | `Playwright Showcase`                  | From: display name                                        |
| `EMAIL_HELO`         | `playwright-showcase.test`             | HELO/EHLO name for direct MX transport                    |
| `EMAIL_CAPTURE`      | _unset_                                | If `1`, store emails in memory instead of sending         |
| `SMTP_HOST`          | _unset_                                | If set, relay through this SMTP server instead of MX      |
| `SMTP_PORT`          | `587`                                  | SMTP port                                                 |
| `SMTP_SECURE`        | _unset_                                | If `1`, use TLS on connect                                |
| `SMTP_USER` / `SMTP_PASS` | _unset_                          | SMTP credentials when relaying                            |

### Capture mode

Set `EMAIL_CAPTURE=1` to skip real delivery and keep emails in memory.  The
`/captured` endpoint then exposes everything that was "sent".  Useful when
your network blocks port 25 and you don't want to set up a relay, or for
unit-style payload assertions.

### Relay mode

If your machine or CI cannot send on port 25, sign up for any free SMTP
provider (Brevo, SendGrid, Mailtrap, etc.) and set `SMTP_HOST` / `SMTP_PORT`
/ `SMTP_USER` / `SMTP_PASS`.

## Endpoints

```
POST /send/verification   { to, name? }   -> sends a verification link email
POST /send/otp            { to }          -> sends a 6-digit one-time code
POST /send/html           { to }          -> sends a rich HTML body
POST /send/attachment     { to }          -> sends an HTML body + CSV attachment

GET  /verify/:token                       -> "verifies" a token and shows success page
GET  /captured                            -> JSON dump of in-memory captures
POST /_reset                              -> clears tokens/otps/captures (used by tests)
GET  /healthz                             -> readiness probe
GET  /                                    -> interactive form (handy for manual testing)
```
