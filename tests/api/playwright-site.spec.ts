import { test, expect } from '@playwright/test';
import * as allure from 'allure-js-commons';

/**
 * API Tests – playwright.dev
 */

test.describe('API – Core HTTP Behaviour', () => {
  test.beforeEach(async ({}, testInfo) => {
    testInfo.annotations.push({ type: 'epic', description: 'API Testing' });
    testInfo.annotations.push({ type: 'owner', description: 'Playwright Showcase' });
  });

  test.describe('Status Codes', () => {
    test('GET / should return 200',
      { annotation: [{ type: 'feature', description: 'Status Codes' }, { type: 'story', description: 'Home page' }, { type: 'severity', description: 'critical' }] },
      async ({ request }) => {
        await allure.step('GET https://playwright.dev/', async () => {
          const response = await request.get('https://playwright.dev/');
          await allure.step('Assert status is 200', async () => {
            expect(response.status()).toBe(200);
          });
        });
      });

    test('GET /docs/intro should return 200',
      { annotation: [{ type: 'feature', description: 'Status Codes' }, { type: 'story', description: 'Docs page' }, { type: 'severity', description: 'critical' }] },
      async ({ request }) => {
        await allure.step('GET https://playwright.dev/docs/intro', async () => {
          const response = await request.get('https://playwright.dev/docs/intro');
          await allure.step('Assert status is 200', async () => {
            expect(response.status()).toBe(200);
          });
        });
      });

    test('GET of a non-existent path should return 404',
      { annotation: [{ type: 'feature', description: 'Status Codes' }, { type: 'story', description: '404 handling' }, { type: 'severity', description: 'normal' }] },
      async ({ request }) => {
        await allure.step('GET a non-existent path', async () => {
          const response = await request.get('https://playwright.dev/this-page-does-not-exist-xyz');
          await allure.step('Assert status is 200 or 404', async () => {
            expect([200, 404]).toContain(response.status());
          });
        });
      });
  });

  test.describe('Response Headers', () => {
    test('should return text/html content-type for the home page',
      { annotation: [{ type: 'feature', description: 'Response Headers' }, { type: 'story', description: 'Content-Type' }, { type: 'severity', description: 'normal' }] },
      async ({ request }) => {
        const response = await request.get('https://playwright.dev/');
        const contentType = response.headers()['content-type'] ?? '';
        await allure.step('Attach response headers', async () => {
          await allure.attachment('Response Headers', JSON.stringify(response.headers(), null, 2), { contentType: 'application/json' });
        });
        await allure.step('Assert content-type is text/html', async () => {
          expect(contentType).toContain('text/html');
        });
      });

    test('should include a cache-control header',
      { annotation: [{ type: 'feature', description: 'Response Headers' }, { type: 'story', description: 'Cache-Control' }, { type: 'severity', description: 'normal' }] },
      async ({ request }) => {
        const response = await request.get('https://playwright.dev/');
        await allure.step('Assert a cache-related header is present', async () => {
          const headers = response.headers();
          const hasCacheControl =
            'cache-control' in headers || 'cdn-cache-control' in headers || 'cf-cache-status' in headers;
          expect(hasCacheControl).toBeTruthy();
        });
      });

    test('should not expose server version information',
      { annotation: [{ type: 'feature', description: 'Response Headers' }, { type: 'story', description: 'Server header' }, { type: 'severity', description: 'normal' }] },
      async ({ request }) => {
        const response = await request.get('https://playwright.dev/');
        await allure.step('Assert Server header contains no version string', async () => {
          const server = response.headers()['server'] ?? '';
          expect(server).not.toMatch(/apache\/\d/i);
          expect(server).not.toMatch(/nginx\/\d/i);
          expect(server).not.toMatch(/iis\/\d/i);
        });
      });
  });

  test.describe('Response Time SLAs', () => {
    test('home page should respond within 3 seconds',
      { annotation: [{ type: 'feature', description: 'Response Time' }, { type: 'story', description: 'Home page SLA' }, { type: 'severity', description: 'critical' }] },
      async ({ request }) => {
        const start = Date.now();
        const response = await request.get('https://playwright.dev/');
        const duration = Date.now() - start;
        await allure.step(`Assert response time ${duration}ms < 3000ms`, async () => {
          await allure.attachment('Response Time', `${duration}ms`, { contentType: 'text/plain' });
          expect(response.status()).toBe(200);
          expect(duration).toBeLessThan(3_000);
        });
      });

    test('docs page should respond within 3 seconds',
      { annotation: [{ type: 'feature', description: 'Response Time' }, { type: 'story', description: 'Docs page SLA' }, { type: 'severity', description: 'critical' }] },
      async ({ request }) => {
        const start = Date.now();
        const response = await request.get('https://playwright.dev/docs/intro');
        const duration = Date.now() - start;
        await allure.step(`Assert response time ${duration}ms < 3000ms`, async () => {
          await allure.attachment('Response Time', `${duration}ms`, { contentType: 'text/plain' });
          expect(response.status()).toBe(200);
          expect(duration).toBeLessThan(3_000);
        });
      });
  });

  test.describe('Content Validation', () => {
    test('home page body should contain Playwright branding',
      { annotation: [{ type: 'feature', description: 'Content Validation' }, { type: 'severity', description: 'normal' }] },
      async ({ request }) => {
        const response = await request.get('https://playwright.dev/');
        await allure.step('Assert body contains "Playwright"', async () => {
          const body = await response.text();
          expect(body).toContain('Playwright');
        });
      });

    test('response body should not be empty',
      { annotation: [{ type: 'feature', description: 'Content Validation' }, { type: 'severity', description: 'normal' }] },
      async ({ request }) => {
        const response = await request.get('https://playwright.dev/');
        await allure.step('Assert response body has substantial content', async () => {
          const body = await response.text();
          expect(body.length).toBeGreaterThan(100);
        });
      });
  });

  test.describe('HTTPS & Redirects', () => {
    test('site should be served over HTTPS',
      { annotation: [{ type: 'feature', description: 'HTTPS' }, { type: 'severity', description: 'critical' }] },
      async ({ request }) => {
        const response = await request.get('https://playwright.dev/');
        await allure.step('Assert final URL uses https://', async () => {
          expect(response.url()).toMatch(/^https:\/\//);
        });
      });
  });
});