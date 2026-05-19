# Playwright Showcase

A production-grade **Playwright + TypeScript** testing showcase covering a wide range of real-world testing scenarios across two target applications. The project demonstrates best practices in test architecture, reporting, and tooling that can be adapted for any professional test automation suite.

---

## Table of Contents

- [Overview](#overview)
- [Tech Stack](#tech-stack)
- [Applications Under Test](#applications-under-test)
- [Project Structure](#project-structure)
- [Setup](#setup)
- [Running Tests](#running-tests)
  - [Run All Tests](#run-all-tests)
  - [Run by Test Category](#run-by-test-category)
  - [Run in Headed / Debug Mode](#run-in-headed--debug-mode)
  - [Run by Tag](#run-by-tag)
  - [Run Specific Test Scenarios](#run-specific-test-scenarios)
- [Allure Reports](#allure-reports)
  - [Generate and Open a Report](#generate-and-open-a-report)
  - [Single-File Report](#single-file-report)
  - [Trend / History Tracking](#trend--history-tracking)
  - [Live Serve (no build step)](#live-serve-no-build-step)
- [Allure ID Updates](#allure-id-updates)
- [Visual Snapshot Management](#visual-snapshot-management)
- [Lighthouse Performance Reports](#lighthouse-performance-reports)
- [Code Quality](#code-quality)
- [Configuration Reference](#configuration-reference)
- [Architecture](#architecture)

---

## Overview

This project showcases how to structure a large Playwright test suite for maintainability and observability. It includes:

- **UI Testing** – Page Object Model (POM) and Component Object Model (COM) tests across multiple browsers and devices
- **API Testing** – Direct HTTP request testing with response validation
- **Accessibility Testing** – Automated WCAG 2.1 AA audits powered by axe-core
- **Visual Regression Testing** – Pixel-level screenshot comparison with baseline management
- **Performance Testing** – Lighthouse audits with Web Vitals assertions (FCP, LCP, CLS, TBT, TTFB)
- **Security Testing** – HTTP security header audits with severity classification
- **Network Mocking** – Route interception, canned responses, error simulation, and request spying
- **Component Testing** – Isolated component-level testing for navbar, search, footer, and more
- **Multi-Context Testing** – Multi-tab, multi-window, and multi-user session testing
- **WebSocket Testing** – Mock WebSocket server interception and real echo-server testing
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
| [Lighthouse](https://github.com/GoogleChrome/lighthouse) | ^13.3 | Performance audits |
| [@faker-js/faker](https://fakerjs.dev) | ^10.4 | Test data generation |
| [ESLint](https://eslint.org) | ^10.3 | Linting |
| [Prettier](https://prettier.io) | ^3.8 | Formatting |

---

## Applications Under Test

### [playwright.dev](https://playwright.dev)
The official Playwright documentation site. Used for UI, accessibility, visual regression, component, network mocking, and performance tests.

### [Saucedemo](https://www.saucedemo.com)
A demo e-commerce application from Sauce Labs. Used for UI, checkout flow, multi-context, WebSocket, and authentication tests. Supports multiple user personas with different behaviors (standard, locked-out, problem, performance-glitch, error, visual).

---

## Project Structure

```
playwright-showcase/
├── src/
│   ├── components/              # Component Object Models (COMs)
│   │   └── playwrightdev/       # PD_NavbarComponent, PD_SearchComponent, etc.
│   ├── fixtures/                # Custom Playwright fixture extensions
│   │   ├── index.ts             # Main fixture export (page objects + multi-context)
│   │   ├── playwrightdev.setup.ts
│   │   ├── saucedemo.setup.ts
│   │   └── saucedemo-multiuser.setup.ts
│   ├── pages/                   # Page Object Models (POMs)
│   │   ├── playwrightdev/       # PD_HomePage, PD_DocsPage
│   │   └── saucedemo/           # SD_LoginPage, SD_InventoryPage, SD_CartPage, checkout/
│   └── utils/                   # Shared utility libraries
│       ├── accessibility.utils.ts
│       ├── authentication.utils.ts
│       ├── mock.utils.ts
│       ├── multi-context.utils.ts
│       ├── performance.utils.ts
│       ├── security.utils.ts
│       ├── visual.utils.ts
│       └── websocket.utils.ts
├── tests/
│   ├── accessibility/           # WCAG 2.1 AA scans via axe-core
│   ├── api/                     # Direct API / HTTP tests
│   ├── components/              # Isolated component tests
│   ├── mocking/                 # Network route interception tests
│   ├── multi-context/           # Multi-tab, multi-window, multi-user tests
│   ├── performance/             # Lighthouse performance audits
│   ├── security/                # HTTP security header audits
│   ├── ui/                      # End-to-end UI tests
│   ├── unit/                    # Utility unit tests
│   ├── visual/                  # Screenshot regression tests + stored baselines
│   └── websocket/               # WebSocket mock and real echo-server tests
├── scripts/
│   ├── allure-generate.mjs      # Cross-platform Allure report generator with history
│   └── add-allure-ids.mjs       # Auto-inject stable allure IDs into every test
├── .auth/                       # Saved browser auth states (gitignored)
├── reports/
│   └── lighthouse/              # Lighthouse HTML reports
├── allure-results/              # Raw Allure result files (gitignored)
├── allure-report/               # Generated Allure report (gitignored)
├── playwright.config.ts
├── tsconfig.json
└── package.json
```

---

## Setup

### Prerequisites

- **Node.js** 20 or later
- **npm** 9 or later

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

---

## Running Tests

### Run All Tests

```bash
npm test
# or
npx playwright test
```

This runs every project in `playwright.config.ts` in parallel, including setup projects.

---

### Run by Test Category

| Category | Command |
|----------|---------|
| All UI tests | `npm run test:ui` |
| API tests | `npm run test:api` |
| Accessibility tests | `npm run test:a11y` |
| Performance tests | `npm run test:perf` |
| Security tests | `npm run test:security` |
| Visual regression | `npm run test:visual` |
| Network mocking | `npm run test:mock` |
| Component tests | `npm run test:components` |
| All multi-context | `npm run test:multi-context` |
| WebSocket (all) | `npm run test:websocket` |
| WebSocket mock only | `npm run test:ws-mock` |
| WebSocket realtime only | `npm run test:ws-realtime` |

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

Tests are tagged with `@`-prefixed labels (e.g. `@smoke`, `@ui`, `@accessibility`). Use `--grep` to filter:

```bash
# Run only smoke tests
npx playwright test --grep @smoke

# Run only accessibility tests across all browsers
npx playwright test --grep @accessibility

# Run only multi-context tests
npx playwright test --grep @multi-context
```

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

Performance tests run Lighthouse and have a 90-second timeout. Run them in isolation if needed:

```bash
npx playwright test tests/performance --project=Performance
```

#### Saucedemo Checkout Flow Only

```bash
npx playwright test tests/ui/saucedemo/checkout.spec.ts --project="Saucedemo Chromium"
```

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

### ID Prefix Map

| Test File | Prefix |
|-----------|--------|
| `accessibility/a11y` | `A11Y` |
| `api/playwright-site` | `API` |
| `components/.../code-block` | `COMP-CB` |
| `components/.../footer` | `COMP-FT` |
| `components/.../language-selector` | `COMP-LS` |
| `components/.../navbar` | `COMP-NB` |
| `components/.../search` | `COMP-SR` |
| `mocking/.../api-mocking` | `MOCK-API` |
| `mocking/.../network-conditions` | `MOCK-NET` |
| `multi-context/.../multi-tab` | `CTX-TAB` |
| `multi-context/.../multi-user` | `CTX-USR` |
| `multi-context/.../multi-window` | `CTX-WIN` |
| `performance/performance` | `PERF` |
| `security/security` | `SEC` |
| `ui/.../docs-page` | `UI-DP` |
| `ui/.../home-page` | `UI-HP` |
| `ui/saucedemo/checkout` | `UI-CK` |
| `ui/saucedemo/inventory` | `UI-INV` |
| `ui/saucedemo/login` | `UI-LG` |
| `visual/.../docs-page` | `VIS-DP` |
| `visual/.../home-page` | `VIS-HP` |
| `websocket/.../ws-mock` | `WS-MOCK` |
| `websocket/.../ws-realtime` | `WS-REAL` |
| `unit/accessibility` | `UNIT-A11Y` |
| `unit/authentication` | `UNIT-AUTH` |
| `unit/mock` | `UNIT-MOCK` |
| `unit/multi-context` | `UNIT-CTX` |
| `unit/performance` | `UNIT-PERF` |
| `unit/security` | `UNIT-SEC` |
| `unit/visual` | `UNIT-VIS` |
| `unit/websocket` | `UNIT-WS` |

---

## Visual Snapshot Management

Visual regression tests compare screenshots pixel-by-pixel against stored baselines in `tests/visual/**/*.spec.ts-snapshots/`. Baselines are OS-specific (the suffix `-win32.png` is appended automatically on Windows).

### First run – creating baselines

On a fresh clone with no snapshots, Playwright creates baseline images automatically on the first run. No extra flags are needed.

### Update baselines after intentional UI changes

When the UI has changed and the new appearance is correct, update all snapshots:

```bash
npm run test:visual:update
# or
npx playwright test tests/visual --project=Visual --update-snapshots
```

### Tolerance thresholds

The global `toHaveScreenshot` threshold is `maxDiffPixelRatio: 0.02` (2%). Individual tests may override this. Animations are globally disabled during visual tests via `freezeAnimations()` in `visual.utils.ts`.

---

## Lighthouse Performance Reports

Performance tests run Lighthouse against `playwright.dev` and assert on Core Web Vitals and category scores. An HTML Lighthouse report is saved to `reports/lighthouse/`.

### Open the Lighthouse report

```bash
npm run lighthouse:open
```

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

## Configuration Reference

### `playwright.config.ts`

| Setting | Value |
|---------|-------|
| `fullyParallel` | `true` |
| `retries` | `0` locally, `2` on CI |
| `workers` | auto locally, `2` on CI |
| `timeout` | 30 seconds per test |
| `expect.timeout` | 5 seconds |
| `screenshot` | `only-on-failure` |
| `video` | `on-first-retry` |
| `trace` | `on-first-retry` |
| `viewport` | 1280 × 720 |
| `baseURL` | `https://playwright.dev` |
| `outputDir` | `test-results/` |

### Projects

| Project Name | Target | Browsers/Devices | Auth |
|-------------|--------|-----------------|------|
| `Unit Tests` | `tests/unit` | Chromium | None |
| `Playwright.dev Chromium` | `tests/ui`, `tests/api`, `tests/accessibility` | Desktop Chrome | playwrightdev |
| `Playwright.dev Firefox` | `tests/ui`, `tests/api`, `tests/accessibility` | Desktop Firefox | playwrightdev |
| `Playwright.dev Webkit` | `tests/ui`, `tests/api`, `tests/accessibility` | Desktop Safari | playwrightdev |
| `Playwright.dev Mobile-chrome` | Same as above | Pixel 5 | playwrightdev |
| `Playwright.dev Mobile-safari` | Same as above | iPhone 13 | playwrightdev |
| `Components` | `tests/components` | Desktop Chrome | playwrightdev |
| `API` | `tests/api` | N/A (HTTP only) | None |
| `Saucedemo Chromium` | `tests/ui/saucedemo` | Desktop Chrome | saucedemo |
| `Multi-Context` | `tests/multi-context` | Desktop Chrome | sd_standard_user |
| `WebSocket-Mock` | `tests/websocket/ws-mock` | Desktop Chrome | saucedemo |
| `WebSocket-Realtime` | `tests/websocket/ws-realtime` | Desktop Chrome | saucedemo |
| `Visual` | `tests/visual` | Desktop Chrome | None |
| `Mocking` | `tests/mocking` | Desktop Chrome | None |
| `Performance` | `tests/performance` | Desktop Chrome | None |
| `Security` | `tests/security` | Desktop Chrome | None |
| `Accessibility` | `tests/accessibility` | Desktop Chrome | None |

### Path Aliases (`tsconfig.json`)

| Alias | Resolves To |
|-------|------------|
| `@pages/*` | `./src/pages/*` |
| `@fixtures/*` | `./src/fixtures/*` |
| `@utils/*` | `./src/utils/*` |
| `@data/*` | `./src/data/*` |

---

## Architecture

### Page Object Models (`src/pages/`)

Every page under test is modelled as a TypeScript class extending `BasePage`. Pages encapsulate selectors and actions so tests remain readable and selector changes are isolated to one place.

- `BasePage` – shared navigation and wait helpers
- `PD_HomePage`, `PD_DocsPage` – playwright.dev pages
- `SD_LoginPage`, `SD_InventoryPage`, `SD_CartPage` – Saucedemo pages
- `SD_InfoPage`, `SD_VerificationPage`, `SD_ConfirmationPage` – Saucedemo checkout steps

### Component Object Models (`src/components/`)

Components that appear across multiple pages are modelled as classes extending `BaseComponent`. Each exposes typed interaction methods.

- `PD_NavbarComponent`, `PD_SearchComponent`, `PD_FooterComponent`
- `PD_CodeBlockComponent`, `PD_LanguageSelectorComponent`

### Custom Fixtures (`src/fixtures/index.ts`)

Tests import `{ test, expect }` from `src/fixtures/index.ts` rather than directly from `@playwright/test`. This extends the base `test` object with pre-instantiated page objects and multi-context helpers, eliminating boilerplate from every test file.

Key fixtures:
- `pd_homePage`, `pd_docsPage` – auto-navigate before yielding
- `sd_inventoryPage`, `sd_loginPage`, `sd_cartPage`, etc. – Saucedemo POMs
- `sd_tab2` – a second `Page` in the same context (shared session)
- `sd_standard_ctx`, `sd_problem_ctx`, `sd_glitch_ctx` – independent authenticated contexts
- `sd_unauth_ctx` – fresh unauthenticated context for testing login rejection
- `echoServer` – per-test in-process WebSocket echo server

### Utility Libraries (`src/utils/`)

Reusable, independently unit-tested helper modules:

| Utility | Responsibilities |
|---------|-----------------|
| `accessibility.utils.ts` | axe-core scanning, WCAG level assertions, violation summaries |
| `authentication.utils.ts` | Auth file resolution, credential loading |
| `mock.utils.ts` | `page.route()` helpers: JSON/HTML mocking, error simulation, request spying |
| `multi-context.utils.ts` | Browser context creation and multi-window coordination |
| `performance.utils.ts` | Lighthouse runner, score/vitals assertion helpers |
| `security.utils.ts` | HTTP header auditing with required vs. recommended severity |
| `visual.utils.ts` | Animation freezing, stable-state waiting, viewport helpers, dark-mode emulation |
| `websocket.utils.ts` | `MockWebSocketServer`, client injection, echo server, message waiting |

### Authentication Setup

Saucedemo auth states are persisted to `.auth/` by setup projects that run before the dependent test projects. The `authentication.utils.ts` module resolves the correct auth file path for each Saucedemo user persona.

Credentials are read from `.auth/saucedemo-credentials.json` if present, with fallback to the known public Saucedemo defaults.

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
