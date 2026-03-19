import { test, expect } from '@playwright/test';
import {
  auditSecurityHeaders,
  assertRequiredHeadersPresent,
  assertHeaderPresent,
  assertHeaderAbsent,
  getHeader,
  printSecurityReport,
} from '../../src/utils/security.utils.js';

/**
 * Security Tests – playwright.dev
 * ─────────────────────────────────────────────────────────────────────────────
 * Covers: HTTP security headers (OWASP), sensitive header exposure,
 * HTTPS enforcement, cookie security attributes, and basic XSS/injection
 * resistance at the HTTP layer.
 *
 * Header tests are split by severity:
 *
 *   REQUIRED     → playwright.dev is confirmed to serve these headers.
 *                  A missing header is a genuine test FAILURE.
 *
 *   RECOMMENDED  → OWASP best-practice headers that playwright.dev (a static
 *                  CDN-backed docs site) does not currently set. These are
 *                  audited and reported as warnings but do NOT fail the suite.
 *                  When you point this framework at your own app, promote any
 *                  of these to `required` in security.utils.ts.
 *
 * This approach keeps the suite green against third-party sites while still
 * demonstrating the full OWASP audit capability.
 */

// ── Shared fixture: fetch the home page once per describe block ─────────────
const HOME_URL = 'https://playwright.dev/';
const DOCS_URL = 'https://playwright.dev/docs/intro';

test.describe('Security – HTTP Headers (Required)', () => {
  /**
   * Single consolidated test that runs the full audit and only hard-fails on
   * headers marked `severity: 'required'` in security.utils.ts.
   * Recommended gaps are printed as warnings in the test output.
   */
  test('required security headers should all be present', async ({ request }) => {
    const response = await request.get(HOME_URL);
    const report = auditSecurityHeaders(response);
    printSecurityReport(report);

    // Throws if any `required` header is missing; logs warnings for `recommended`
    assertRequiredHeadersPresent(report);
  });

  test('HSTS should be present and valid on the home page', async ({ request }) => {
    const response = await request.get(HOME_URL);
    assertHeaderPresent(response, 'strict-transport-security');

    const hsts = response.headers()['strict-transport-security'];
    expect(hsts).toMatch(/max-age=\d+/i);
  });

  test('HSTS max-age should be at least 1 year (31536000s)', async ({ request }) => {
    const response = await request.get(HOME_URL);
    const hsts = response.headers()['strict-transport-security'] ?? '';
    const maxAgeMatch = hsts.match(/max-age=(\d+)/i);

    if (maxAgeMatch) {
      const maxAge = parseInt(maxAgeMatch[1], 10);
      expect(maxAge).toBeGreaterThanOrEqual(31_536_000);
    }
  });

  test('X-Content-Type-Options should be nosniff', async ({ request }) => {
    const response = await request.get(HOME_URL);
    assertHeaderPresent(response, 'x-content-type-options', 'nosniff');
  });
});

test.describe('Security – HTTP Headers (Recommended Audit)', () => {
  /**
   * These tests document OWASP recommended headers that playwright.dev does
   * not currently set. They use test.info() annotations so results are
   * clearly visible in the HTML / Allure report without failing the suite.
   *
   * When adapting this framework for your own application, move any header
   * that your app SHOULD have into the 'Required' describe block above and
   * change its severity in security.utils.ts.
   */

  const recommendedHeaders = [
    'content-security-policy',
    'referrer-policy',
    'permissions-policy',
    'x-frame-options',
  ] as const;

  for (const header of recommendedHeaders) {
    test(`audit: ${header} presence`, async ({ request }, testInfo) => {
      const response = await request.get(HOME_URL);
      const value = getHeader(response, header);

      // Annotate the report with the actual result so it's visible in Allure/HTML
      await testInfo.attach(`${header}`, {
        body: value ?? '⚠️  NOT SET',
        contentType: 'text/plain',
      });

      if (value) {
        console.warn(`  ✅ ${header}: ${value}`);
      } else {
        console.warn(`  ⚠️  ${header} is not set (recommended but not required for this site)`);
      }

      // Soft assertion: mark as expected-optional so it never fails
      // Remove this line and replace with assertHeaderPresent() for your own app
      test.info().annotations.push({
        type: value ? 'present' : 'missing-recommended',
        description: value ?? 'Header not set — consider adding for OWASP compliance',
      });
    });
  }
});

test.describe('Security – Sensitive Header Exposure', () => {
  test('should not expose X-Powered-By header', async ({ request }) => {
    const response = await request.get(HOME_URL);
    assertHeaderAbsent(response, 'x-powered-by');
  });

  test('should not expose detailed Server version in header', async ({ request }) => {
    const response = await request.get(HOME_URL);
    const server = response.headers()['server'] ?? '';
    // Server header may exist (e.g. "cloudflare") but must not leak a version string
    expect(server).not.toMatch(/\d+\.\d+/);
  });

  test('should not expose X-AspNet-Version header', async ({ request }) => {
    const response = await request.get(HOME_URL);
    assertHeaderAbsent(response, 'x-aspnet-version');
  });

  test('should not expose X-AspNetMvc-Version header', async ({ request }) => {
    const response = await request.get(HOME_URL);
    assertHeaderAbsent(response, 'x-aspnetmvc-version');
  });
});

test.describe('Security – HTTPS & Transport', () => {
  test('home page final response URL should use HTTPS', async ({ request }) => {
    const response = await request.get(HOME_URL);
    expect(response.url()).toMatch(/^https:\/\//);
  });

  test('docs page should be served over HTTPS', async ({ request }) => {
    const response = await request.get(DOCS_URL);
    expect(response.url()).toMatch(/^https:\/\//);
    expect(response.status()).toBe(200);
  });

  test('HSTS should be present on the docs page too', async ({ request }) => {
    const response = await request.get(DOCS_URL);
    assertHeaderPresent(response, 'strict-transport-security');
  });
});

test.describe('Security – Content Integrity', () => {
  test('home page body should not contain XSS injection markers', async ({ request }) => {
    const response = await request.get(HOME_URL);
    const body = await response.text();

    expect(body).not.toContain('<script>alert(');
    expect(body).not.toContain('onerror="alert');
    expect(body).not.toContain('onload="alert');
  });

  test('response should not expose directory listing', async ({ request }) => {
    const response = await request.get(HOME_URL);
    const body = await response.text();

    expect(body).not.toContain('Index of /');
    expect(body).not.toContain('Parent Directory');
  });
});

test.describe('Security – Cookie Attributes', () => {
  test('site cookies should have the Secure attribute', async ({ page, context }) => {
    await page.goto(HOME_URL);
    const cookies = await context.cookies();
    const siteCookies = cookies.filter((c) => c.domain.includes('playwright.dev'));

    for (const cookie of siteCookies) {
      expect(cookie.secure).toBe(true);
    }
  });

  test('site cookies should have the HttpOnly attribute', async ({ page, context }) => {
    await page.goto(HOME_URL);
    const cookies = await context.cookies();
    const siteCookies = cookies.filter((c) => c.domain.includes('playwright.dev'));

    for (const cookie of siteCookies) {
      expect(cookie.httpOnly).toBe(true);
    }
  });
});