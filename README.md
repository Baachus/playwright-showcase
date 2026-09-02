# Playwright Showcase

A production-grade **Playwright + TypeScript** testing showcase covering a wide range of real-world testing scenarios across several target applications. The project demonstrates best practices in test architecture, reporting, and tooling that can be adapted for any professional test automation suite.

> **Related docs:** [`tests/visual/README.md`](tests/visual/README.md) (cross-OS visual baselines), [`tools/email-sender/README.md`](tools/email-sender/README.md) and [`tools/mailpit/README.md`](tools/mailpit/README.md) (email helper services). For a worked example of the BDD-style Given/When/Then convention see [`tests/bdd/saucedemo-login.bdd.spec.ts`](tests/bdd/saucedemo-login.bdd.spec.ts).

---

## Table of Contents

- [Playwright Showcase](#playwright-showcase)
  - [Table of Contents](#table-of-contents)
  - [Overview](#overview)
  - [Tech Stack](#tech-stack)
  - [Applications Under Test](#applications-under-test)
    - [playwright.dev](#playwrightdev)
    - [Saucedemo](#saucedemo)
    - [The Internet](#the-internet)
    - [JSONPlaceholder](#jsonplaceholder)
    - [Local email-sender helper](#local-email-sender-helper)
  - [Project Structure](#project-structure)
  - [Setup](#setup)
    - [Prerequisites](#prerequisites)
    - [Install dependencies](#install-dependencies)
    - [Install Playwright browsers](#install-playwright-browsers)
    - [Seed authentication state](#seed-authentication-state)
  - [Running Tests](#running-tests)
    - [Run All Tests](#run-all-tests)
    - [Run by Test Category](#run-by-test-category)
    - [Run in Headed / Debug Mode](#run-in-headed--debug-mode)
    - [View the HTML Test Report](#view-the-html-test-report)
    - [Run by Tag](#run-by-tag)
    - [Run Specific Test Scenarios](#run-specific-test-scenarios)
      - [Multi-Context (by scenario type)](#multi-context-by-scenario-type)
      - [WebSocket Smoke Tests](#websocket-smoke-tests)
      - [Visual Regression Against a Single Browser](#visual-regression-against-a-single-browser)
      - [Security Tests](#security-tests)
      - [Performance Tests](#performance-tests)
      - [Web Crawler Tests](#web-crawler-tests)
      - [API Contract Tests](#api-contract-tests)
      - [BDD-Style Tests](#bdd-style-tests)
      - [Saucedemo Checkout Flow Only](#saucedemo-checkout-flow-only)
      - [Email Verification](#email-verification)
  - [Email Verification Tests](#email-verification-tests)
    - [Scenarios](#scenarios)
    - [Configuration](#configuration)
    - [Running the Mailpit server independently](#running-the-mailpit-server-independently)
    - [Local interactive helper](#local-interactive-helper)
  - [Allure Reports](#allure-reports)
    - [Generate and Open a Report](#generate-and-open-a-report)
    - [Single-File Report](#single-file-report)
    - [Trend / History Tracking](#trend--history-tracking)
    - [Live Serve (no build step)](#live-serve-no-build-step)
  - [Allure ID Updates](#allure-id-updates)
    - [Run the ID injector](#run-the-id-injector)
    - [ID Prefix Map](#id-prefix-map)
  - [Visual Snapshot Management](#visual-snapshot-management)
    - [First run – creating baselines](#first-run--creating-baselines)
    - [Update baselines after intentional UI changes](#update-baselines-after-intentional-ui-changes)
    - [Cross-OS baselines for CI (Linux)](#cross-os-baselines-for-ci-linux)
    - [Before committing a UI or visual change](#before-committing-a-ui-or-visual-change)
    - [Tolerance thresholds](#tolerance-thresholds)
  - [Lighthouse Performance Reports](#lighthouse-performance-reports)
    - [Open the Lighthouse report](#open-the-lighthouse-report)
    - [Default score thresholds](#default-score-thresholds)
    - [Default Web Vitals thresholds](#default-web-vitals-thresholds)
  - [Code Quality](#code-quality)
  - [Continuous Integration](#continuous-integration)
  - [Configuration Reference](#configuration-reference)
    - [`playwright.config.ts`](#playwrightconfigts)
    - [Reporters](#reporters)
    - [Projects](#projects)
    - [Path Aliases (`tsconfig.json`)](#path-aliases-tsconfigjson)
  - [Architecture](#architecture)
    - [Page Object Models (`src/pages/`)](#page-object-models-srcpages)
    - [Component Object Models (`src/components/`)](#component-object-models-srccomponents)
    - [Custom Fixtures (`src/fixtures/index.ts`)](#custom-fixtures-srcfixturesindexts)
    - [Utility Libraries (`src/utils/`)](#utility-libraries-srcutils)
    - [API Schemas (`src/schemas/`)](#api-schemas-srcschemas)
    - [Authentication Setup](#authentication-setup)
    - [Allure Labelling Convention](#allure-labelling-convention)
    - [BDD Step Convention](#bdd-step-convention)

---

## Overview

This project showcases how to structure a large Playwright test suite for maintainability and observability. It targets playwright.dev, Saucedemo, The Internet, and JSONPlaceholder (plus a local email helper), and includes:

- **UI Testing** – Page Object Model (POM) and Component Object Model (COM) tests across multiple browsers and devices
- **API Testing** – Direct HTTP request testing with response validation
- **API Contract Testing** – Zod schema validation of live JSON API responses to catch API drift
- **BDD-Style Testing** – Given/When/Then/And/But step keywords rendered as a nested scenario tree in Allure (no Cucumber required)
- **Accessibility Testing** – Automated WCAG 2.0 A/AA + 2.1 AA audits powered by axe-core
- **Visual Regression Testing** – Pixel-level screenshot comparison with OS-specific baseline management
- **Performance Testing** – Lighthouse audits with Web Vitals assertions (FCP, LCP, CLS, TBT, TTFB)
- **Security Testing** – HTTP security header audits with required vs. recommended severity classification
- **Web Crawler Testing** – Breadth-first link/image integrity crawl with an allowlist for intentionally broken content
- **Network Mocking** – Route interception, canned responses, error simulation, and request spying
- **Component Testing** – Isolated component-level testing for navbar, search, footer, and more
- **Multi-Context Testing** – Multi-tab, multi-window, and multi-user session testing
- **WebSocket Testing** – Mock WebSocket server interception and real echo-server testing
- **Email Verification Testing** – End-to-end inbox flows (content, verification link, OTP, attachment) against a local Mailpit sink
- **Unit Testing** – Utility function unit tests that run alongside the integration suite
- **Allure Reporting** – Rich, trend-aware reports with test IDs, epics, features, stories, and attachments

---

## Tech Stack

| Tool | Version | Purpose |
|------|---------|---------|
| [Playwright](https://playwright.dev) | ^1.59 | Core test framework |
| [TypeScript](https://www.typescriptlang.org) | ^6.0 | Language |
| [allure-playwright](https://github.com/allure-framework/allure-js) | ^3.8 | Allure reporter integration |
| [allure-commandline](https://github.com/allure-framework/allure2) | ^2.40 | Report generation CLI |
| [@axe-core/playwright](https://github.com/dequelabs/axe-core-npm) | ^4.11 | Accessibility scanning |
| [Lighthouse](https://github.com/GoogleChrome/lighthouse) | ^12.6 | Performance audits (launched via `chrome-launcher`) |
| [Zod](https://zod.dev) | ^3.25 | API contract schemas |
| [ws](https://github.com/websockets/ws) | ^8.18 | Mock WebSocket server + echo server |
| [Express](https://expressjs.com) + [nodemailer](https://nodemailer.com) | ^5.0 / ^9.0 | Local email-sender helper (`tools/email-sender/`) |
| [Mailpit](https://mailpit.axllent.org) | latest (auto-downloaded) | Local SMTP sink + REST API for email tests |
| [tsx](https://tsx.is) | ^4.19 | Runs the TypeScript email helper without a build step |
| [@faker-js/faker](https://fakerjs.dev) | ^10.4 | Test data generation |
| [ESLint](https://eslint.org) + `eslint-plugin-playwright` | ^10.3 / ^2.10 | Linting |
| [Prettier](https://prettier.io) | ^3.8 | Formatting |

---

## Applications Under Test

### [playwright.dev](https://playwright.dev)
The official Playwright documentation site. Used for UI, API, accessibility, visual regression, component, network mocking, security header, and performance tests.

### [Saucedemo](https://www.saucedemo.com)
A demo e-commerce application from Sauce Labs. Used for UI, checkout flow, BDD, multi-context, WebSocket, and authentication tests. Supports multiple user personas with different behaviors (standard, locked-out, problem, performance-glitch, error, visual).

### [The Internet](https://the-internet.herokuapp.com)
A purpose-built playground by Elemental Selenium covering a wide range of challenging UI scenarios. Used for UI tests across 44 spec files targeting features such as A/B testing, drag-and-drop, dynamic controls, iframes, shadow DOM, JavaScript alerts, file upload/download, geolocation, infinite scroll, and more. It's also the target of the [Web Crawler suite](#web-crawler-tests), since it ships with a handful of intentionally broken links/images/status pages to detect.

### [JSONPlaceholder](https://jsonplaceholder.typicode.com)
A free fake REST API. Used exclusively by the [API contract tests](#api-contract-tests), which validate the shape of `/posts`, `/comments`, `/todos`, and `/users` responses against strict Zod schemas.

### Local email-sender helper
`tools/email-sender/server.ts` is a small Express + nodemailer app that acts as a stand-in "upstream service" for the [email verification tests](#email-verification-tests). It is started automatically by `playwright.config.ts` alongside a local Mailpit instance.

---

## Project Structure

```
playwright-showcase/
├── .github/workflows/
│   └── playwright.yml           # CI: smoke on every push, full suite nightly / manual
├── src/
│   ├── components/              # Component Object Models (COMs)
│   │   ├── BaseComponent.ts
│   │   ├── playwrightdev/       # PD_NavbarComponent, PD_SearchComponent, etc.
│   │   └── saucedemo/           # SD_InventoryItemComponent
│   ├── fixtures/                # Custom Playwright fixture extensions
│   │   ├── index.ts             # Main fixture export (page objects + multi-context + email)
│   │   ├── playwrightdev.setup.ts
│   │   ├── saucedemo.setup.ts
│   │   └── saucedemo-multiuser.setup.ts
│   ├── pages/                   # Page Object Models (POMs)
│   │   ├── BasePage.ts
│   │   ├── email/               # LocalEmailAppPage (drives the email-sender helper)
│   │   ├── mailpit/             # MailpitInboxPage (reads mail via Mailpit REST API)
│   │   ├── playwrightdev/       # PD_HomePage, PD_DocsPage
│   │   ├── saucedemo/           # SD_LoginPage, SD_InventoryPage, SD_CartPage, checkout/
│   │   └── the-internet/        # TI_* pages (44 pages, one per feature)
│   ├── schemas/                 # Zod schemas for API contract tests
│   │   └── jsonplaceholder.schemas.ts
│   └── utils/                   # Shared utility libraries
│       ├── accessibility.utils.ts
│       ├── api-contract.utils.ts
│       ├── authentication.utils.ts
│       ├── bdd.utils.ts
│       ├── crawler.utils.ts
│       ├── email.utils.ts
│       ├── mock.utils.ts
│       ├── multi-context.utils.ts
│       ├── performance.utils.ts
│       ├── security.utils.ts
│       ├── visual.utils.ts
│       └── websocket.utils.ts
├── tests/
│   ├── accessibility/           # WCAG scans via axe-core
│   ├── api/                     # playwright.dev HTTP tests + JSONPlaceholder contract tests
│   ├── bdd/                     # Given/When/Then style example (Saucedemo login)
│   ├── components/              # Isolated component tests
│   ├── crawler/                 # BFS link-integrity crawl of the-internet.herokuapp.com
│   ├── email/                   # Email verification via local Mailpit sink
│   ├── mocking/                 # Network route interception tests
│   ├── multi-context/           # Multi-tab, multi-window, multi-user tests
│   ├── performance/             # Lighthouse performance audits
│   ├── security/                # HTTP security header audits
│   ├── ui/                      # End-to-end UI tests (playwrightdev/, saucedemo/, the-internet/)
│   ├── unit/                    # Utility unit tests (*.unit.ts)
│   ├── visual/                  # Screenshot regression tests + stored baselines (+ README)
│   └── websocket/               # WebSocket mock and real echo-server tests
├── scripts/
│   ├── allure-generate.mjs      # Cross-platform Allure report generator with history
│   ├── add-allure-ids.mjs       # Auto-inject stable allure IDs into every test
│   ├── update-visual-baselines.sh   # Regenerate -linux.png baselines via Docker (bash)
│   └── update-visual-baselines.ps1  # Same, for Windows PowerShell
├── tools/
│   ├── email-sender/            # Local Express + nodemailer helper that sends test mail
│   └── mailpit/                 # Local Mailpit SMTP sink + REST API (auto-downloaded binary)
├── .auth/                       # Saved browser auth states + optional credentials (gitignored)
├── reports/                     # (gitignored)
│   ├── html/                    # Playwright HTML report
│   └── lighthouse/              # Lighthouse HTML + JSON reports
├── test-results/                # Traces, videos, screenshots (gitignored)
├── allure-results/              # Raw Allure result files (gitignored)
├── allure-report/               # Generated Allure report (gitignored)
├── allure-report-single/        # Single-file Allure report (gitignored)
├── eslint.config.js
├── playwright.config.ts
├── tsconfig.json
└── package.json
```

---

## Setup

### Prerequisites

- **Node.js** 20 or later
- **npm** 11.10 or later — `.npmrc` sets `min-release-age = 7` (refuses package versions published less than 7 days ago as a supply-chain safeguard), which older npm versions don't understand
- **Docker** (optional) — only needed to regenerate Linux visual baselines locally (see [Cross-OS baselines](#cross-os-baselines-for-ci-linux))

### Install dependencies

```bash
npm install
```

### Install Playwright browsers

```bash
npx playwright install
```

This downloads Chromium, Firefox, and WebKit binaries used by the test projects.

### Seed authentication state

The test suite uses saved auth states to avoid logging in before every test. Run the full suite once (or just the setup projects) to populate the `.auth/` directory:

```bash
npx playwright test --project=setup-saucedemo --project=setup-saucedemo-multiuser --project=setup-playwrightdev
```

The `.auth/` files are gitignored and must be regenerated on each new machine or after clearing them.

Saucedemo credentials are resolved in this order: `SAUCEDEMO_USERNAME` / `SAUCEDEMO_PASSWORD` environment variables, then `.auth/saucedemo-credentials.json` if present, then the known public Saucedemo defaults. CI supplies them as repository secrets.

---

## Running Tests

### Run All Tests

```bash
npm test
# or
npx playwright test
```

This runs every project in `playwright.config.ts` in parallel, including setup projects. A full, unfiltered run also boots the local Mailpit + email-sender services so the `Email` project can run (see [Email Verification Tests](#email-verification-tests)).

---

### Run by Test Category

| Category | Command |
|----------|---------|
| All UI tests (every project that matches `tests/ui`) | `npm run test:ui` |
| API tests (playwright.dev + contract) | `npm run test:api` |
| API contract tests only | `npm run test:contract` |
| BDD-style tests | `npm run test:bdd` |
| Accessibility tests | `npm run test:a11y` |
| Performance tests | `npm run test:perf` |
| Security tests | `npm run test:security` |
| Web crawler tests | `npm run test:crawler` |
| Visual regression | `npm run test:visual` |
| Network mocking | `npm run test:mock` |
| Component tests | `npm run test:components` |
| All multi-context | `npm run test:multi-context` |
| WebSocket (all) | `npm run test:websocket` |
| WebSocket mock only | `npm run test:ws-mock` |
| WebSocket realtime only | `npm run test:ws-realtime` |
| The Internet UI tests (one browser) | `npx playwright test tests/ui/the-internet --project="The Internet Chromium"` |
| Email verification | `npm run test:email` |
| Email verification (smoke only) | `npm run test:email:smoke` |
| Unit tests | `npx playwright test --project="Unit Tests"` |

> Note: `test:ui`, `test:api`, `test:a11y`, `test:perf`, and `test:security` pass only a path filter, so they run in **every** project whose scope includes that path. For example `npm run test:a11y` runs the accessibility spec under the `Accessibility` project *and* all five `Playwright.dev *` browser projects. Add `--project=...` to narrow it (see [Projects](#projects)).

---

### Run in Headed / Debug Mode

```bash
# Run with browser window visible
npm run test:headed

# Run with Playwright Inspector (step-through debugger)
npm run test:debug
```

### View the HTML Test Report

After a test run the HTML report is written to `reports/html/`. Open it with:

```bash
npm run test:report
```

---

### Run by Tag

Tests are tagged with `@`-prefixed labels. Use `--grep` to filter:

```bash
# Run only smoke tests
npx playwright test --grep @smoke

# Run only accessibility tests across all browsers
npx playwright test --grep @accessibility

# Run only multi-context tests
npx playwright test --grep @multi-context
```

Tags in use include `@smoke`, `@critical`, `@ui`, `@api`, `@contract`, `@accessibility`, `@bdd`, `@login`, `@email`, `@crawler`, `@multi-context`, `@multi-tab`, `@multi-window`, and `@multi-user`.

---

### Run Specific Test Scenarios

#### Multi-Context (by scenario type)

```bash
# Multi-tab tests only
npm run test:multi-tab

# Multi-window tests only
npm run test:multi-window

# Multi-user persona tests only
npm run test:multi-user
```

#### WebSocket Smoke Tests

```bash
npm run test:ws-mock:smoke
```

#### Visual Regression Against a Single Browser

The `Visual` project always runs on Desktop Chrome. To also run a single spec file:

```bash
npx playwright test tests/visual/playwrightdev/home-page.spec.ts --project=Visual
```

#### Security Tests

```bash
npx playwright test tests/security/security.spec.ts --project=Security
```

#### Performance Tests

Performance tests run Lighthouse and set their own 90-second per-test timeout (`test.setTimeout(90_000)`). They are only picked up by the `Performance` project and the `Playwright.dev Chromium` project (Lighthouse needs Chromium). Run them in isolation if needed:

```bash
npx playwright test tests/performance --project=Performance
```

#### Web Crawler Tests

Breadth-first crawls the-internet.herokuapp.com from the homepage (`maxDepth: 2`, ~70 pages) and asserts every discovered page/image resolves successfully, aside from a declared allowlist of the site's own intentionally broken demo content (status-code pages, auth-walled routes, decoy nav links, broken images). A second "positive control" test crawls with no allowlist to prove the detection itself actually works. The `Crawler` project has a 90-second timeout to accommodate the sequential HTTP requests.

```bash
npm run test:crawler
```

#### API Contract Tests

Validates JSONPlaceholder responses against strict Zod schemas in `src/schemas/jsonplaceholder.schemas.ts`. Any renamed, retyped, removed, or unexpectedly added field fails the test with a precise diff via `checkContract()`.

```bash
npm run test:contract
```

#### BDD-Style Tests

Demonstrates Given/When/Then scenarios without Cucumber or `.feature` files (see [BDD Step Convention](#bdd-step-convention)).

```bash
npm run test:bdd
```

#### Saucedemo Checkout Flow Only

```bash
npx playwright test tests/ui/saucedemo/checkout.spec.ts --project="Saucedemo Chromium"
```

#### Email Verification

```bash
# All four scenarios: content, verification-link, OTP, attachment
npm run test:email

# Smoke subset only
npm run test:email:smoke
```

---

## Email Verification Tests

The `Email` project exercises a full inbox-based verification flow against a
**local Mailpit instance** — a lightweight email sink that combines an SMTP
server (to receive mail) with a REST API (to read it back). Nothing leaves the
machine, so the suite is fully self-contained and deterministic in CI.

The flow:

1. A small local helper service (`tools/email-sender/`) sends real emails via
   Express + nodemailer. It is **not** the system under test in the strict
   sense — `the-internet.herokuapp.com` (the project's main demo target)
   doesn't actually send mail. The helper acts as a controllable stand-in for
   an upstream service so the verification *flow* can be exercised end-to-end.
2. The helper relays every message to the local **Mailpit** SMTP sink. Each
   test sends to a fresh, unique recipient address (minted via
   `mintInboxName()` in `email.utils.ts`, exposed as the `emailInbox` /
   `emailAddress` fixtures) so parallel runs never collide.
3. The test reads the message back through **Mailpit's REST API**
   (`MailpitInboxPage`, exposed as the `mailpitInbox` fixture), extracts the
   verification link / OTP code / attachment, and asserts on it.

Both helper services are started automatically by `playwright.config.ts`
(via `webServer`) whenever an email run is detected — Mailpit boots first so
the SMTP sink is ready before the sender starts. You do not need to start them
manually for `npm run test:email`.

An "email run" is detected when any of the following is true: `--project=Email`
is passed, a path containing `tests/email` is passed, no `--project` / path
filter is passed at all (a full-suite run), or `PW_EMAIL_SERVER=1` is set. Any
other filtered run (e.g. `npm run test:ui`) skips the `webServer` block
entirely so it never needs the email dependencies.

The `Email` project uses `testIdAttribute: 'data-test'` because the helper app
marks its elements with `data-test="..."`.

### Scenarios

| Spec | What it covers |
| --- | --- |
| `email-content.spec.ts` | Email arrives in Mailpit with expected subject + body |
| `email-verification-link.spec.ts` | Extract link from email and complete the verify flow |
| `email-otp.spec.ts` | Parse the 6-digit one-time code from the email |
| `email-attachment.spec.ts` | Attachment is surfaced and HTML body renders correctly |

### Configuration

These environment variables tune the email setup (all have sensible defaults):

| Variable | Default | Purpose |
| --- | --- | --- |
| `PW_EMAIL_SERVER` | unset | Set to `1` to force the Mailpit + email-sender `webServer` block on for any run |
| `EMAIL_APP_PORT` | `4310` | Port the local email-sender helper listens on |
| `EMAIL_APP_BASE_URL` | `http://localhost:4310` | Base URL of the helper; also the `Email` project's `baseURL` |
| `MAILPIT_SMTP_HOST` / `MAILPIT_SMTP_PORT` | `127.0.0.1` / `1025` | Where Mailpit listens for SMTP (the helper relays here) |
| `MAILPIT_HTTP_HOST` / `MAILPIT_HTTP_PORT` | `127.0.0.1` / `8025` | Where Mailpit serves its web UI + REST API |
| `MAILPIT_API_BASE` | `http://127.0.0.1:8025` | Base URL of the Mailpit REST API the tests read from |
| `MAILPIT_VERSION` | `latest` | Mailpit release to download into `tools/mailpit/bin/` |
| `TEST_EMAIL_DOMAIN` | `playwright-showcase.test` | Cosmetic domain for minted recipients (Mailpit accepts any address) |
| `EMAIL_FROM` / `EMAIL_FROM_NAME` | `no-reply@playwright-showcase.test` / `Playwright Showcase` | Sender identity used by the helper |
| `EMAIL_HELO` | `playwright-showcase.test` | HELO/EHLO name the helper presents to SMTP |
| `EMAIL_CAPTURE` | `0` | Set to `1` to make the helper capture mail in memory instead of relaying over SMTP |
| `SMTP_HOST` / `SMTP_PORT` / `SMTP_USER` / `SMTP_PASS` / `SMTP_SECURE` | Mailpit host/port | Override to relay through an external SMTP server instead of Mailpit |

### Running the Mailpit server independently

The config starts Mailpit automatically during an email run. To launch it on
its own (e.g. to inspect captured mail in Mailpit's own web UI):

```bash
npm run mailpit
# Mailpit web UI + REST API on http://127.0.0.1:8025, SMTP on 127.0.0.1:1025
```

The Mailpit binary is downloaded into `tools/mailpit/bin/` (gitignored) on first use.

### Local interactive helper

You can also start the email-sender helper independently and drive it from a
browser:

```bash
npm run email:server
```

See `tools/email-sender/README.md` and `tools/mailpit/README.md` for details.

---

## Allure Reports

Allure reports are the primary reporting tool for this project. They include test IDs, epics, features, stories, attachments (axe violations, Lighthouse scores, Web Vitals), trend charts, and executor information.

### Generate and Open a Report

After a test run, generate the report and open it in your browser:

```bash
# Step 1 – Generate the report (cross-platform, preserves trend history)
npm run allure:generate

# Step 2 – Open the report in your browser
npm run allure:open
```

`allure:generate` runs `scripts/allure-generate.mjs` which:
1. Copies history data from the previous report into `allure-results/history/` so trend charts accumulate over time
2. Writes an `executor.json` so the Executors widget is populated (auto-detects CI vs. local)
3. Runs `allure generate` to build the report
4. Patches missing plugin assets on Windows (a known allure-commandline limitation)

### Single-File Report

Generate a self-contained single HTML file (useful for sharing or attaching to tickets):

```bash
npm run allure:generate:single
```

The output is written to `allure-report-single/`.

### Trend / History Tracking

Run tests, generate, and open in one command (re-runs the full suite):

```bash
npm run allure:trend
```

Each subsequent run accumulates data in the Trend and Retry Trend charts inside the report.

### Live Serve (no build step)

Serve the raw results directory directly (no HTML generation required):

```bash
npm run allure:serve
```

---

## Allure ID Updates

Every test has a stable, human-readable Allure ID injected into its body (e.g. `UI-LG-001`, `A11Y-007`, `WS-MOCK-003`). These IDs appear in the Allure report and can be referenced in tickets or documentation.

The `add-allure-ids.mjs` script automatically injects or refreshes these IDs across all `*.spec.ts` and `*.unit.ts` files.

### Run the ID injector

```bash
node scripts/add-allure-ids.mjs
```

The script:
- Scans every test file under `tests/`
- Assigns IDs sequentially using a per-file prefix (see table below)
- Skips tests that already have an ID (safe to re-run at any time)
- Adds the `allure-js-commons` import to files that don't have it yet
- Prints a summary of updated files and total ID count
- Falls back to the prefix `TEST` for any file not in its `PREFIX_MAP`

> **Heads-up:** the script's `PREFIX_MAP` currently only covers the prefixes marked *script* below. The remaining prefixes (all `TI-*`, the Saucedemo cart/info/problem-user specs, the email specs, the BDD spec, and the contract spec) were assigned by hand and are not in the script; add them to `PREFIX_MAP` before running the injector on a new file in one of those areas, or it will get a `TEST-NNN` ID.

### ID Prefix Map

| Test File | Prefix | Source |
|-----------|--------|--------|
| `accessibility/a11y` | `A11Y` | script |
| `api/playwright-site` | `API` | script |
| `api/api-contract` | `API` (continues the same sequence, from `API-012`) | manual |
| `bdd/saucedemo-login.bdd` | `UI-LG-BDD` | manual |
| `components/.../code-block` | `COMP-CB` | script |
| `components/.../footer` | `COMP-FT` | script |
| `components/.../language-selector` | `COMP-LS` | script |
| `components/.../navbar` | `COMP-NB` | script |
| `components/.../search` | `COMP-SR` | script |
| `crawler/crawler` | `CRWL` | script |
| `email/email-attachment` | `EMAIL-AT` | manual |
| `email/email-content` | `EMAIL-CT` | manual |
| `email/email-otp` | `EMAIL-OTP` | manual |
| `email/email-verification-link` | `EMAIL-VL` | manual |
| `mocking/.../api-mocking` | `MOCK-API` | script |
| `mocking/.../network-conditions` | `MOCK-NET` | script |
| `multi-context/.../multi-tab` | `CTX-TAB` | script |
| `multi-context/.../multi-user` | `CTX-USR` | script |
| `multi-context/.../multi-window` | `CTX-WIN` | script |
| `performance/performance` | `PERF` | script |
| `security/security` | `SEC` | script |
| `ui/.../docs-page` | `UI-DP` | script |
| `ui/.../home-page` | `UI-HP` | script |
| `ui/saucedemo/cart` | `UI-CART` | manual |
| `ui/saucedemo/checkout` | `UI-CK` | script |
| `ui/saucedemo/info` | `UI-SI` | manual |
| `ui/saucedemo/inventory` | `UI-INV` | script |
| `ui/saucedemo/login` | `UI-LG` | script |
| `ui/saucedemo/problem_user/pu_info` | `UI-PUSI` | manual |
| `ui/saucedemo/problem_user/pu_inventory` | `UI-PUI` | manual |
| `ui/the-internet/ab-test` | `TI-AB` | manual |
| `ui/the-internet/add-remove` | `TI-AR` | manual |
| `ui/the-internet/basic-auth` | `TI-BA` | manual |
| `ui/the-internet/broken-image` | `TI-BI` | manual |
| `ui/the-internet/challenging-dom` | `TI-CD` | manual |
| `ui/the-internet/checkboxes` | `TI-CB` | manual |
| `ui/the-internet/context-menu` | `TI-CM` | manual |
| `ui/the-internet/digest-auth` | `TI-DA` | manual |
| `ui/the-internet/disappearing-elements` | `TI-DE` | manual |
| `ui/the-internet/drag-and-drop` | `TI-DR` | manual |
| `ui/the-internet/dropdown` | `TI-DD` | manual |
| `ui/the-internet/dynamic-content` | `TI-DC` | manual |
| `ui/the-internet/dynamic-controls` | `TI-DCO` | manual |
| `ui/the-internet/dynamic-loading` | `TI-DL` | manual |
| `ui/the-internet/entry-ad` | `TI-EA` | manual |
| `ui/the-internet/exit-intent` | `TI-EI` | manual |
| `ui/the-internet/file-download` | `TI-FD` | manual |
| `ui/the-internet/file-upload` | `TI-FU` | manual |
| `ui/the-internet/floating-menu` | `TI-FM` | manual |
| `ui/the-internet/forgot-password` | `TI-FP` | manual |
| `ui/the-internet/form-authentication` | `TI-FA` | manual |
| `ui/the-internet/geolocation` | `TI-GEO` | manual |
| `ui/the-internet/horizontal-slider` | `TI-HS` | manual |
| `ui/the-internet/hovers` | `TI-HV` | manual |
| `ui/the-internet/iframe` | `TI-IN` | manual |
| `ui/the-internet/infinite-scroll` | `TI-IS` | manual |
| `ui/the-internet/inputs` | `TI-IP` | manual |
| `ui/the-internet/javascript-alerts` | `TI-JA` | manual |
| `ui/the-internet/javascript-error` | `TI-JE` | manual |
| `ui/the-internet/jquery-ui-menu` | `TI-JQ` | manual |
| `ui/the-internet/key-presses` | `TI-KP` | manual |
| `ui/the-internet/large-deep-dom` | `TI-LD` | manual |
| `ui/the-internet/multiple-windows` | `TI-MW` | manual |
| `ui/the-internet/nested-frames` | `TI-NF` | manual |
| `ui/the-internet/notification-messages` | `TI-NM` | manual |
| `ui/the-internet/redirect-link` | `TI-RL` | manual |
| `ui/the-internet/secure-file-download` | `TI-SFD` | manual |
| `ui/the-internet/shadow-dom` | `TI-SD` | manual |
| `ui/the-internet/shifting-content` | `TI-SC` | manual |
| `ui/the-internet/slow-resources` | `TI-SR` | manual |
| `ui/the-internet/sortable-data-tables` | `TI-STC` | manual |
| `ui/the-internet/status-codes` | `TI-ST` | manual |
| `ui/the-internet/typos` | `TI-TY` | manual |
| `ui/the-internet/wysiwyg-editor` | `TI-WY` | manual |
| `visual/.../docs-page` | `VIS-DP` | script |
| `visual/.../home-page` | `VIS-HP` | script |
| `websocket/.../ws-mock` | `WS-MOCK` | script |
| `websocket/.../ws-realtime` | `WS-REAL` | script |
| `unit/accessibility` | `UNIT-A11Y` | script |
| `unit/authentication` | `UNIT-AUTH` | script |
| `unit/mock` | `UNIT-MOCK` | script |
| `unit/multi-context` | `UNIT-CTX` | script |
| `unit/performance` | `UNIT-PERF` | script |
| `unit/security` | `UNIT-SEC` | script |
| `unit/visual` | `UNIT-VIS` | script |
| `unit/websocket` | `UNIT-WS` | script |

---

## Visual Snapshot Management

Visual regression tests compare screenshots pixel-by-pixel against stored baselines in `tests/visual/**/*.spec.ts-snapshots/`. Baselines are **OS-specific**: Playwright appends a platform suffix to each file (`-win32.png` on Windows, `-linux.png` on Linux). Font and antialiasing differences between operating systems mean a Windows screenshot will never byte-match a Linux one, so **each OS needs its own committed baseline**. Our CI runs the full suite inside the official Playwright Docker image on `ubuntu-latest`, so the `Visual` project needs `-linux.png` baselines committed alongside the `-win32.png` ones.

### First run – creating baselines

On a fresh clone with no snapshots, Playwright creates baseline images automatically on the first run. No extra flags are needed.

### Update baselines after intentional UI changes

When the UI has changed and the new appearance is correct, update all snapshots:

```bash
npm run test:visual:update
# or
npx playwright test tests/visual --project=Visual --update-snapshots
```

This updates baselines for **your current OS only**. If you're on Windows, it refreshes the `-win32.png` files — CI's `-linux.png` files are **not** updated by this command. See the next section.

### Cross-OS baselines for CI (Linux)

CI fails the `Visual` project with *"A snapshot doesn't exist … writing actual"* whenever the `-linux.png` baselines are missing. Because Linux renders fonts differently than Windows, you can't just rename your `-win32.png` files — you must generate real Linux baselines in the same environment CI uses.

The helper scripts do exactly this: they run the `Visual` project inside the official Playwright Docker image, pinned to the exact version in `package-lock.json`, so the output matches CI pixel-for-pixel. Your `-win32.png` baselines and your local `node_modules` are left untouched (an anonymous volume shadows `node_modules` so the container's `npm ci` can't overwrite your Windows install).

**Requirements:** Docker (Docker Desktop on Windows/macOS).

```bash
# Windows (uses built-in Windows PowerShell — no PowerShell 7 / pwsh needed)
npm run visual:baselines:linux:win

# macOS / Linux / Git Bash
npm run visual:baselines:linux
```

Then review and commit the generated images:

```bash
git add tests/visual/**/*-linux.png
git commit -m "test(visual): update Linux baselines for CI"
```

No Docker? The CI workflow also has a manual `Regenerate Visual Baselines` job (`workflow_dispatch`) that runs `--update-snapshots` in the same pinned image and uploads the resulting `-linux.png` files as a downloadable artifact. See [Continuous Integration](#continuous-integration).

See `tests/visual/README.md` for more detail.

### Before committing a UI or visual change

Each time you commit a change that affects the rendered UI, run this checklist so CI stays green:

```bash
npm run typecheck      # 1. TypeScript compiles
npm run lint           # 2. Lint passes
npm run test:visual    # 3. Visual specs pass locally (Windows baselines)
npm run visual:baselines:linux:win   # 4. Regenerate Linux baselines (Docker)
```

Then stage **both** platform baselines together with your code change and commit:

```bash
git add tests/visual/**/*-win32.png tests/visual/**/*-linux.png
git commit -m "feat: <your change> + refreshed visual baselines"
```

If your change does **not** touch the UI, you can skip steps 3–4 — the existing baselines still apply.

### Tolerance thresholds

The global `toHaveScreenshot` threshold is `maxDiffPixelRatio: 0.02` (2%) with `animations: 'disabled'`. Individual tests may override this. Animations are additionally frozen during visual tests via `freezeAnimations()` in `visual.utils.ts`.

---

## Lighthouse Performance Reports

Performance tests run Lighthouse against `playwright.dev` and assert on Core Web Vitals and category scores. For each audited page an HTML report (`<slug>.html`) and a JSON report (`<slug>.json`) are saved to `reports/lighthouse/`. On CI, Lighthouse is pointed at the container's bundled Chromium via the `CHROME_PATH` environment variable.

### Open the Lighthouse report

```bash
npm run lighthouse:open
```

> This script uses `open` / `xdg-open`, so it works on macOS and Linux. On Windows, open the `.html` file in `reports/lighthouse/` directly.

### Default score thresholds

| Category | Minimum Score |
|----------|--------------|
| Performance | 80 |
| Accessibility | 90 |
| Best Practices | 90 |
| SEO | 90 |

### Default Web Vitals thresholds

| Metric | Threshold |
|--------|-----------|
| FCP | ≤ 1,800 ms |
| LCP | ≤ 2,500 ms |
| TBT | ≤ 200 ms |
| CLS | ≤ 0.10 |
| TTFB | ≤ 800 ms |

---

## Code Quality

```bash
# Type-check without emitting output
npm run typecheck

# Lint TypeScript files
npm run lint

# Auto-fix lint issues
npm run lint:fix

# Format all files with Prettier
npm run format

# Check formatting without writing changes
npm run format:check
```

---

## Continuous Integration

`.github/workflows/playwright.yml` defines three jobs:

| Job | Trigger | What it does |
|-----|---------|--------------|
| `Smoke Tests (@smoke)` | Every push, every PR to `main`/`master` | Installs Chromium only and runs `--grep @smoke` across the `Playwright.dev Chromium` and `Saucedemo Chromium` projects. Uploads `reports/html/` as `smoke-report` (14-day retention). |
| `Full Test Suite` | Weekly schedule (Tuesday 02:00 UTC) or manual `workflow_dispatch`; requires the smoke job to pass first | Runs `npx playwright test` (every project) inside the pinned `mcr.microsoft.com/playwright:<version>-noble` image so visual baselines match. Sets `CHROME_PATH` for Lighthouse and `HOME=/root` so Firefox can launch. Uploads `reports/html/` as `playwright-report` (30-day retention). |
| `Regenerate Visual Baselines (manual)` | Manual `workflow_dispatch` only | Runs `tests/visual --project=Visual --update-snapshots` in the same pinned image and uploads the new `-linux.png` files as `updated-visual-baselines` (7-day retention) for review and commit. |

CI-specific config behaviour: `forbidOnly` is enabled, retries are raised to `2`, workers are capped at `2`, the `github` reporter is added for inline annotations, and `reuseExistingServer` is disabled for the email helper services. Saucedemo credentials come from the `SAUCEDEMO_USERNAME` / `SAUCEDEMO_PASSWORD` repository secrets.

> The Docker image tag pinned in the workflow must match the installed `@playwright/test` version. When you bump Playwright, update the `container.image` tag in both the `test` and `update-visual-baselines` jobs and regenerate the Linux baselines.

---

## Configuration Reference

### `playwright.config.ts`

| Setting | Value |
|---------|-------|
| `fullyParallel` | `true` |
| `forbidOnly` | `true` on CI |
| `retries` | `1` locally, `2` on CI |
| `workers` | auto locally, `2` on CI |
| `timeout` | 45 seconds per test (Crawler project: 90 s; performance specs set 90 s themselves) |
| `expect.timeout` | 10 seconds |
| `expect.toHaveScreenshot` | `maxDiffPixelRatio: 0.02`, `animations: 'disabled'` |
| `actionTimeout` | 15 seconds |
| `navigationTimeout` | 30 seconds |
| `screenshot` | `only-on-failure` |
| `video` | `on-first-retry` |
| `trace` | `on-first-retry` |
| `viewport` | 1280 × 720 |
| `baseURL` | `https://playwright.dev` (overridden per project) |
| `outputDir` | `test-results/` |
| `webServer` | Mailpit + email-sender, only when an email run is detected |

### Reporters

| Reporter | Output |
|----------|--------|
| `html` | `reports/html/` (never auto-opens) |
| `allure-playwright` | `allure-results/` with `Test Failures` / `Broken Tests` categories and environment info |
| `list` | Console |
| `github` | CI only — inline annotations on GitHub Actions |

### Projects

Projects are scoped by `testMatch` / `testIgnore`. The `Playwright.dev *` projects use a blanket `testDir: './tests'` with ignore lists, so they pick up more than just `tests/ui`.

| Project Name | Runs | Browser/Device | Auth |
|-------------|------|----------------|------|
| `setup-saucedemo` | `saucedemo.setup.ts` | Chromium | writes `.auth/saucedemo.json` |
| `setup-saucedemo-multiuser` | `saucedemo-multiuser.setup.ts` | Chromium | writes `.auth/sd_standard_user.json`, `sd_problem_user.json`, `sd_performance_glitch_user.json` |
| `setup-playwrightdev` | `playwrightdev.setup.ts` | Chromium | writes `.auth/playwrightdev.json` |
| `Unit Tests` | `tests/unit/**/*.unit.ts` | Chromium (only launched by tests that use `page`) | None |
| `Playwright.dev Chromium` | `tests/ui/playwrightdev`, `tests/api`, `tests/accessibility`, `tests/security`, `tests/crawler`, `tests/performance` | Desktop Chrome | playwrightdev |
| `Playwright.dev Firefox` | Same as above minus `tests/performance` | Desktop Firefox | playwrightdev |
| `Playwright.dev Webkit` | Same as Firefox | Desktop Safari | playwrightdev |
| `Playwright.dev Mobile-chrome` | Same as Firefox | Pixel 5 | playwrightdev |
| `Playwright.dev Mobile-safari` | Same as Firefox | iPhone 13 | playwrightdev |
| `Components` | `tests/components` | Desktop Chrome | playwrightdev |
| `API` | `tests/api` | N/A (HTTP only, `Accept: application/json`) | None |
| `Saucedemo Chromium` | `tests/ui/saucedemo` | Desktop Chrome | saucedemo |
| `BDD` | `tests/bdd` | Desktop Chrome | saucedemo |
| `Multi-Context` | `tests/multi-context` | Desktop Chrome | sd_standard_user |
| `WebSocket-Mock` | `tests/websocket/**/ws-mock` | Desktop Chrome | saucedemo |
| `WebSocket-Realtime` | `tests/websocket/**/ws-realtime` | Desktop Chrome | saucedemo |
| `Visual` | `tests/visual` | Desktop Chrome | None |
| `Mocking` | `tests/mocking` | Desktop Chrome | None |
| `Performance` | `tests/performance` | Desktop Chrome | None |
| `Security` | `tests/security` | Desktop Chrome | None |
| `Accessibility` | `tests/accessibility` | Desktop Chrome | None |
| `Crawler` | `tests/crawler` (90 s timeout) | N/A (HTTP only) | None |
| `The Internet Chromium` | `tests/ui/the-internet` | Desktop Chrome | None |
| `The Internet Firefox` | `tests/ui/the-internet` | Desktop Firefox | None |
| `The Internet Webkit` | `tests/ui/the-internet` (`actionTimeout: 15 s` to stop WebKit `waitForEvent` hangs) | Desktop Safari | None |
| `Email` | `tests/email` (`testIdAttribute: 'data-test'`, `baseURL` = email helper) | Desktop Chrome | None |

### Path Aliases (`tsconfig.json`)

| Alias | Resolves To |
|-------|------------|
| `@pages/*` | `./src/pages/*` |
| `@fixtures/*` | `./src/fixtures/*` |
| `@utils/*` | `./src/utils/*` |
| `@schemas/*` | `./src/schemas/*` |
| `@data/*` | `./src/data/*` (reserved — no `src/data/` directory exists yet) |

---

## Architecture

### Page Object Models (`src/pages/`)

Every page under test is modelled as a TypeScript class extending `BasePage`. Pages encapsulate selectors and actions so tests remain readable and selector changes are isolated to one place.

- `BasePage` – shared navigation and wait helpers
- `PD_HomePage`, `PD_DocsPage` – playwright.dev pages
- `SD_LoginPage`, `SD_InventoryPage`, `SD_CartPage` – Saucedemo pages
- `SD_InfoPage`, `SD_VerificationPage`, `SD_ConfirmationPage` – Saucedemo checkout steps
- `TI_*Page` – 44 page objects for the-internet.herokuapp.com (one per feature)
- `LocalEmailAppPage`, `MailpitInboxPage` – drive the email-sender helper and read mail via Mailpit's REST API

### Component Object Models (`src/components/`)

Components that appear across multiple pages are modelled as classes extending `BaseComponent`. Each exposes typed interaction methods.

- `PD_NavbarComponent`, `PD_SearchComponent`, `PD_FooterComponent`
- `PD_CodeBlockComponent`, `PD_LanguageSelectorComponent`
- `SD_InventoryItemComponent` – shared data snapshot for a single inventory card, reused across inventory, cart, and checkout pages

### Custom Fixtures (`src/fixtures/index.ts`)

Tests import `{ test, expect }` from `src/fixtures/index.ts` rather than directly from `@playwright/test`. This extends the base `test` object with pre-instantiated page objects, component objects, multi-context helpers, and email helpers, eliminating boilerplate from every test file.

| Fixture group | Fixtures |
|---------------|----------|
| playwright.dev pages | `pd_homePage`, `pd_docsPage` – auto-navigate before yielding |
| playwright.dev components | `pd_navbar`, `pd_search`, `pd_codeBlock`, `pd_languageSelector`, `pd_footer` |
| Saucedemo pages | `sd_loginPage`, `sd_inventoryPage`, `sd_cartPage`, `sd_infoPage`, `sd_verificationPage`, `sd_confirmationPage` |
| The Internet pages | `ti_abTestPage`, `ti_addRemovePage`, … `ti_wysiwygEditorPage` – one fixture per `TI_*Page` (44 total) |
| Multi-context | `sd_multiContextHelper`; `sd_tab2` – a second `Page` in the same context (shared session); `sd_standard_ctx`, `sd_problem_ctx`, `sd_glitch_ctx` – independent authenticated contexts; `sd_unauth_ctx` – fresh unauthenticated context for testing login rejection |
| WebSocket | `echoServer` – per-test in-process WebSocket echo server |
| Email | `emailInbox` – unique mailbox name per test; `emailAddress` – full recipient address; `emailApp` – `LocalEmailAppPage` bound to the running helper (state reset per test); `mailpitInbox` – `MailpitInboxPage` scoped to that recipient |

### Utility Libraries (`src/utils/`)

Reusable helper modules (those marked ✓ have a dedicated `tests/unit/*.unit.ts` suite):

| Utility | Unit tests | Responsibilities |
|---------|:----------:|-----------------|
| `accessibility.utils.ts` | ✓ | axe-core scanning (`wcag2a`, `wcag2aa`, `wcag21aa` tags), WCAG level assertions, violation summaries |
| `api-contract.utils.ts` | | `checkContract()` – validates a payload against a Zod schema and returns a typed pass/fail result with a readable diff |
| `authentication.utils.ts` | ✓ | Auth file resolution per Saucedemo persona, credential loading (env → `.auth/` file → defaults) |
| `bdd.utils.ts` | | `Scenario`, `Background`, `Given`, `When`, `Then`, `And`, `But` – thin wrappers over `allure.step()` that prefix step titles |
| `crawler.utils.ts` | | BFS site crawler: link/image status checking, expected-vs-unexpected breakage classification, report printing |
| `email.utils.ts` | | Mailpit REST helpers: unique-address minting, message polling, link/OTP/attachment extraction |
| `mock.utils.ts` | ✓ | `page.route()` helpers: JSON/HTML mocking, error simulation, request spying |
| `multi-context.utils.ts` | ✓ | Browser context creation and multi-window coordination |
| `performance.utils.ts` | ✓ | Lighthouse runner (desktop/mobile presets), score/vitals assertion helpers, HTML + JSON report output |
| `security.utils.ts` | ✓ | HTTP header auditing with required vs. recommended severity and a 0–100 score |
| `visual.utils.ts` | ✓ | Animation freezing, stable-state waiting, viewport helpers, dark-mode emulation |
| `websocket.utils.ts` | ✓ | `MockWebSocketServer`, client injection, echo server, message waiting |

### API Schemas (`src/schemas/`)

`jsonplaceholder.schemas.ts` holds strict Zod schemas (`PostSchema`, `CommentSchema`, `TodoSchema`, `UserSchema`, plus `*ListSchema` array variants and inferred TypeScript types) captured from the live JSONPlaceholder API. Because the schemas use `.strict()`, any extra, missing, or retyped field fails the contract test.

### Authentication Setup

Saucedemo and playwright.dev auth states are persisted to `.auth/` by setup projects that run before the dependent test projects. The `authentication.utils.ts` module resolves the correct auth file path for each Saucedemo user persona.

Credentials are read from the `SAUCEDEMO_USERNAME` / `SAUCEDEMO_PASSWORD` environment variables first, then `.auth/saucedemo-credentials.json` if present, with fallback to the known public Saucedemo defaults.

### Allure Labelling Convention

Every test applies Allure metadata using `allure-js-commons`:

```typescript
await allure.epic('Saucedemo');           // top-level grouping
await allure.feature('Authentication');   // feature area
await allure.story('Valid User Login');   // specific scenario
await allure.label('severity', 'critical');
await allure.allureId('UI-LG-001');       // stable unique ID
```

This populates the Behaviors, Features, and Suites tabs in the Allure report and enables filtering by severity and status.

### BDD Step Convention

For scenario-style tests, `src/utils/bdd.utils.ts` provides Gherkin keywords as thin wrappers around `allure.step()`. There is no Cucumber runtime and no `.feature` files — the keywords simply prefix the step title so the Allure report renders a nested Given/When/Then tree under a `Scenario:` heading:

```typescript
import { Scenario, Background, Given, When, Then, And } from '@utils/bdd.utils.js';

await Scenario('Standard user logs in with valid credentials', async () => {
  await Background(async () => {
    await Given('the user is on the login page', () => loginPage.goto());
  });
  await When('the user submits valid credentials', () => loginPage.login('standard_user'));
  await Then('the user is redirected to the inventory page', () => expect(page).toHaveURL(/inventory/));
  await And('the inventory list is visible', () => expect(page.locator('.inventory_list')).toBeVisible());
});
```

See `tests/bdd/saucedemo-login.bdd.spec.ts` for the full example and run it with `npm run test:bdd`.
