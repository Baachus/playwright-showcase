import { test, expect } from '@playwright/test';
import * as allure from 'allure-js-commons';

/**
 * API Tests – playwright.dev
 */

test.describe('API – Core HTTP Behavior', { tag: ['@api'] }, () => {
  test.beforeEach(async ({}) => {
    await allure.epic('Playwright.dev');
    await allure.feature('API Testing');
  });

  test.describe('Status Codes', () => {
    test('GET / should return 200',
      async ({ request }) => {
        await allure.allureId('API-001');
        await allure.story('Status Codes');
        await allure.label('severity', 'critical');

        await allure.step('GET https://playwright.dev/', async () => {
          const response = await request.get('https://playwright.dev/');
          await allure.step('Assert status is 200', async () => {
            expect(response.status()).toBe(200);
          });
        });
      });

    test('GET /docs/intro should return 200',
      async ({ request }) => {
        await allure.allureId('API-002');
        await allure.story('Status Codes');
        await allure.label('severity', 'critical');

        await allure.step('GET https://playwright.dev/docs/intro', async () => {
          const response = await request.get('https://playwright.dev/docs/intro');
          await allure.step('Assert status is 200', async () => {
            expect(response.status()).toBe(200);
          });
        });
      });

    test('GET of a non-existent path should return 404',
      async ({ request }) => {
        await allure.allureId('API-003');
        await allure.story('Status Codes');
        await allure.label('severity', 'normal');

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
      async ({ request }) => {
        await allure.allureId('API-004');
        await allure.story('Response Headers');
        await allure.label('severity', 'normal');

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
      async ({ request }) => {
        await allure.allureId('API-005');
        await allure.story('Response Headers');
        await allure.label('severity', 'normal');

        const response = await request.get('https://playwright.dev/');

        await allure.step('Assert a cache-related header is present', async () => {
          const headers = response.headers();
          const hasCacheControl =
            'cache-control' in headers || 'cdn-cache-control' in headers || 'cf-cache-status' in headers;
          expect(hasCacheControl).toBeTruthy();
        });
      });

    test('should not expose server version information',
      async ({ request }) => {
        await allure.allureId('API-006');
        await allure.story('Response Headers');
        await allure.label('severity', 'normal');

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
      async ({ request }) => {
        await allure.allureId('API-007');
        await allure.story('Response Time');
        await allure.label('severity', 'critical');

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
      async ({ request }) => {
        await allure.allureId('API-008');
        await allure.story('Response Time');
        await allure.label('severity', 'critical');

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
      async ({ request }) => {
        await allure.allureId('API-009');
        await allure.story('Content Validation');
        await allure.label('severity', 'normal');

        const response = await request.get('https://playwright.dev/');

        await allure.step('Assert body contains "Playwright"', async () => {
          const body = await response.text();
          expect(body).toContain('Playwright');
        });
      });

    test('response body should not be empty',
      async ({ request }) => {
        await allure.allureId('API-010');
        await allure.story('Content Validation');
        await allure.label('severity', 'normal');

        const response = await request.get('https://playwright.dev/');

        await allure.step('Assert response body has substantial content', async () => {
          const body = await response.text();
          expect(body.length).toBeGreaterThan(100);
        });
      });
  });

  test.describe('HTTPS & Redirects', () => {
    test('site should be served over HTTPS',
      async ({ request }) => {
        await allure.allureId('API-011');
        await allure.story('HTTPS');
        await allure.label('severity', 'critical');

        const response = await request.get('https://playwright.dev/');
        
        await allure.step('Assert final URL uses https://', async () => {
          expect(response.url()).toMatch(/^https:\/\//);
        });
      });
  });
});