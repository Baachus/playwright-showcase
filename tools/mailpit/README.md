# Mailpit (local email capture)

[Mailpit](https://mailpit.axllent.org/) is a small, free, self-contained SMTP
server with a REST API and web UI. It is the read side of the `Email`
Playwright project: the local **email-sender** app relays messages to Mailpit
over SMTP, and the tests read them back through Mailpit's REST API.

This replaces the previous Mailinator setup, which required real outbound email
delivery (port 25 / an external relay) and screen-scraping a public inbox — slow,
flaky, and unable to reliably surface attachments. Mailpit is fully local and
deterministic.

## How it runs

`tools/mailpit/run.mjs` auto-downloads the correct Mailpit binary for your OS
(Windows / macOS / Linux) into `tools/mailpit/bin/` on first run, then starts it:

| service        | address              | purpose                                  |
| -------------- | -------------------- | ---------------------------------------- |
| SMTP listener  | `127.0.0.1:1025`     | email-sender relays outgoing mail here   |
| HTTP UI + API  | `127.0.0.1:8025`     | tests read messages via the REST API     |

The Playwright `Email` project boots this for you via its `webServer` block, so
you rarely need to start it manually. To run it by hand:

```bash
npm run mailpit
```

Then open the UI at <http://127.0.0.1:8025> to watch captured mail live.

## Configuration

| env                 | default            | meaning                          |
| ------------------- | ------------------ | -------------------------------- |
| `MAILPIT_SMTP_ADDR` | `127.0.0.1:1025`   | SMTP bind address                |
| `MAILPIT_HTTP_ADDR` | `127.0.0.1:8025`   | HTTP UI + API bind address       |
| `MAILPIT_VERSION`   | `latest`           | release tag to download          |

## REST endpoints the tests use

```
GET /api/v1/search?query=to:<addr>      -> message list (poll for arrival)
GET /api/v1/message/{ID}                 -> full message: HTML, Text, Attachments
GET /api/v1/message/{ID}/part/{PartID}   -> raw attachment bytes
DELETE /api/v1/messages                  -> clear the mailbox
```

The binary download host (`github.com/axllent/mailpit/releases`) must be
reachable the first time. After that the cached binary is used offline.
