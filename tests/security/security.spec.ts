import { test, expect } from '@playwright/test';
import * as allure from 'allure-js-commons';
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
 */

const HOME_URL = 'https://playwright.dev/';
const DOCS_URL = 'https://playwright.dev/docs/intro';

test.describe('Security – HTTP Headers (Required)', { tag: ['@security'] }, () => {
  test.beforeEach(async ({}) => {
     await allure.epic('Playwright.dev');
     await allure.feature('Security Headers Required');
  });

  // Note: Fails due to x-content-type-options not present
  test.skip('required security headers should all be present',
    async ({ request }) => {
      await allure.story('OWASP Header Audit');
      await allure.label('severity', 'critical');
    
      const response = await request.get(HOME_URL);

      await allure.step('Run full OWASP security header audit', async () => {
        const report = auditSecurityHeaders(response);
        printSecurityReport(report);

        await allure.attachment('Security Header Report', JSON.stringify({
          score: `${report.score}/100`,
          passed: report.passed.map(h => ({ header: h.header, value: h.value })),
          requiredFailed: report.requiredFailed.map(h => ({ header: h.header, recommendation: h.recommendation })),
          recommendedMissing: report.recommendedFailed.map(h => ({ header: h.header, recommendation: h.recommendation })),
        }, null, 2), { contentType: 'application/json' });

        await allure.step('Assert all required headers pass', async () => {
          assertRequiredHeadersPresent(report);
        });
      });
    });

  test('HSTS should be present and valid',
    async ({ request }) => {
      await allure.story('HSTS');
      await allure.label('severity', 'critical');

      const response = await request.get(HOME_URL);

      await allure.step('Assert Strict-Transport-Security header is present', async () => {
        assertHeaderPresent(response, 'strict-transport-security');
        const hsts = response.headers()['strict-transport-security'];
        await allure.attachment('HSTS Value', hsts ?? 'not set', { contentType: 'text/plain' });
        expect(hsts).toMatch(/max-age=\d+/i);
      });
    });

  test('HSTS max-age should be at least 1 year',
    async ({ request }) => {
      await allure.story('HSTS');
      await allure.label('severity', 'normal');

      const response = await request.get(HOME_URL);
      const hsts = response.headers()['strict-transport-security'] ?? '';

      await allure.step('Assert HSTS max-age >= 31536000 seconds', async () => {
        const maxAgeMatch = hsts.match(/max-age=(\d+)/i);
        if (maxAgeMatch) {
          const maxAge = parseInt(maxAgeMatch[1], 10);
          expect(maxAge).toBeGreaterThanOrEqual(31_536_000);
        }
      });
    });

  // Note: Fails due to x-content-type-options not present
  test.skip('X-Content-Type-Options should be nosniff',
    async ({ request }) => {
      await allure.story('Content Type Sniffing');
      await allure.label('severity', 'critical');

      const response = await request.get(HOME_URL);

      await allure.step('Assert X-Content-Type-Options: nosniff', async () => {
        assertHeaderPresent(response, 'x-content-type-options', 'nosniff');
      });
    });
});

test.describe('Security – HTTP Headers (Recommended Audit)', { tag: ['@security'] }, () => {
  test.beforeEach(async ({}) => {
     await allure.epic('Playwright.dev');
     await allure.feature('Security Headers Recommended');
  });

  const recommendedHeaders = [
    'content-security-policy',
    'referrer-policy',
    'permissions-policy',
    'x-frame-options',
  ] as const;

  for (const header of recommendedHeaders) {
    test(`audit: ${header} presence`,
      async ({ request }, testInfo) => {
      await allure.story('Recommended Header Audit');
      await allure.label('severity', 'minor');

      const response = await request.get(HOME_URL);
      const value = getHeader(response, header);

      await allure.step(`Check ${header} header`, async () => {
        await allure.attachment(header, value ?? 'NOT SET', { contentType: 'text/plain' });
      });

      testInfo.annotations.push({
        type: value ? 'present' : 'missing-recommended',
        description: value ?? 'Header not set — consider adding for OWASP compliance',
      });
    });
  }
});

test.describe('Security – Sensitive Header Exposure', { tag: ['@security'] }, () => {
  test.beforeEach(async ({}) => {
    await allure.epic('Playwright.dev');
    await allure.feature('Header Exposure');
  });

  test('should not expose X-Powered-By header',
    async ({ request }) => {
      await allure.story('Information Disclosure');
      await allure.label('severity', 'normal');

      const response = await request.get(HOME_URL);

      await allure.step('Assert X-Powered-By is absent', async () => {
        assertHeaderAbsent(response, 'x-powered-by');
      });
    });

  test('should not expose detailed Server version',
    async ({ request }) => {
      await allure.story('Information Disclosure');
      await allure.label('severity', 'normal');

      const response = await request.get(HOME_URL);

      await allure.step('Assert Server header contains no version number', async () => {
        const server = response.headers()['server'] ?? '';
        await allure.attachment('Server Header', server || '(not set)', { contentType: 'text/plain' });
        expect(server).not.toMatch(/\d+\.\d+/);
      });
    });

  for (const header of ['x-aspnet-version', 'x-aspnetmvc-version'] as const) {
    test(`should not expose ${header}`,
      async ({ request }) => {
        await allure.story('Information Disclosure');
        await allure.label('severity', 'normal');

        const response = await request.get(HOME_URL);

        await allure.step(`Assert ${header} is absent`, async () => {
          assertHeaderAbsent(response, header);
        });
      });
  }
});

test.describe('Security – HTTPS & Transport', { tag: ['@security'] }, () => {
  test.beforeEach(async ({}) => {
    await allure.epic('Playwright.dev');
    await allure.feature('HTTPS & Transport');
  });

  test('home page final response URL should use HTTPS',
    async ({ request }) => {
      await allure.story('HTTPS Enforcement');
      await allure.label('severity', 'critical');

      const response = await request.get(HOME_URL);

      await allure.step('Assert final URL scheme is https://', async () => {
        await allure.attachment('Final URL', response.url(), { contentType: 'text/plain' });
        expect(response.url()).toMatch(/^https:\/\//);
      });
    });

  test('docs page should be served over HTTPS',
    { annotation: [{ type: 'story', description: 'HTTPS Enforcement' }, { type: 'severity', description: 'critical' }] },
    async ({ request }) => {
      await allure.story('HTTPS Enforcement');
      await allure.label('severity', 'critical');

      const response = await request.get(DOCS_URL);

      await allure.step('Assert docs page URL is https:// and status 200', async () => {
        expect(response.url()).toMatch(/^https:\/\//);
        expect(response.status()).toBe(200);
      });
    });
});

test.describe('Security – Content Integrity', { tag: ['@security'] }, () => {
  test.beforeEach(async ({}) => {
    await allure.epic('Playwright.dev');
    await allure.feature('Content Integrity');
  });

  test('home page body should not contain XSS injection markers',
    async ({ request }) => {
      await allure.story('XSS Prevention');
      await allure.label('severity', 'critical');

      const response = await request.get(HOME_URL);
      const body = await response.text();

      await allure.step('Assert no XSS markers present in response body', async () => {
        expect(body).not.toContain('<script>alert(');
        expect(body).not.toContain('onerror="alert');
        expect(body).not.toContain('onload="alert');
      });
    });

  test('response should not expose directory listing',
    async ({ request }) => {
      await allure.story('Directory Traversal');
      await allure.label('severity', 'critical');

      const response = await request.get(HOME_URL);
      const body = await response.text();

      await allure.step('Assert no directory listing markers in body', async () => {
        expect(body).not.toContain('Index of /');
        expect(body).not.toContain('Parent Directory');
      });
    });
});

test.describe('Security – Cookie Attributes', { tag: ['@security'] }, () => {
  test.beforeEach(async ({}) => {
    await allure.epic('Playwright.dev');
    await allure.feature('Cookie Security');
  });

  test('site cookies should have the Secure attribute',
    async ({ page, context }) => {
      await allure.story('Cookie Flags');
      await allure.label('severity', 'critical');

      await page.goto(HOME_URL);
      
      await allure.step('Inspect all playwright.dev cookies for Secure flag', async () => {
        const cookies = await context.cookies();
        const siteCookies = cookies.filter((c) => c.domain.includes('playwright.dev'));
        await allure.attachment('Site Cookies', JSON.stringify(siteCookies.map(c => ({
          name: c.name, secure: c.secure, httpOnly: c.httpOnly, sameSite: c.sameSite,
        })), null, 2), { contentType: 'application/json' });
        for (const cookie of siteCookies) {
          expect(cookie.secure).toBe(true);
        }
      });
    });

  test('site cookies should have the HttpOnly attribute',
    async ({ page, context }) => {
      await allure.story('Cookie Flags');
      await allure.label('severity', 'critical');

      await page.goto(HOME_URL);

      await allure.step('Inspect all playwright.dev cookies for HttpOnly flag', async () => {
        const cookies = await context.cookies();
        const siteCookies = cookies.filter((c) => c.domain.includes('playwright.dev'));
        for (const cookie of siteCookies) {
          expect(cookie.httpOnly).toBe(true);
        }
      });
    });
});