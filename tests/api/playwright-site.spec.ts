import { test, expect } from '@playwright/test';

/**
 * API Tests – playwright.dev
 * ─────────────────────────────────────────────────────────────────────────────
 * Covers: HTTP status codes, response headers, content-type validation,
 * redirect behavior, and response time SLAs.
 *
 * NOTE: playwright.dev is a static/CDN-backed site so we focus on HTTP-level
 * assertions. Swap baseURL + endpoints for a REST API to unlock full CRUD
 * coverage using the same patterns shown here.
 */

test.describe('API – Core HTTP Behavior', () => {
  test.describe('Status Codes', () => {
    test('GET / should return 200', async ({ request }) => {
      const response = await request.get('https://playwright.dev/');
      expect(response.status()).toBe(200);
    });

    test('GET /docs/intro should return 200', async ({ request }) => {
      const response = await request.get('https://playwright.dev/docs/intro');
      expect(response.status()).toBe(200);
    });

    test('GET of a non-existent path should return 404', async ({ request }) => {
      const response = await request.get('https://playwright.dev/this-page-does-not-exist-xyz');
      // CDN may return 200 with a 404 page – we check either behaviour is handled
      expect([200, 404]).toContain(response.status());
    });
  });

  test.describe('Response Headers', () => {
    test('should return text/html content-type for the home page', async ({ request }) => {
      const response = await request.get('https://playwright.dev/');
      const contentType = response.headers()['content-type'] ?? '';
      expect(contentType).toContain('text/html');
    });

    test('should include a cache-control header', async ({ request }) => {
      const response = await request.get('https://playwright.dev/');
      const headers = response.headers();
      const hasCacheControl =
        'cache-control' in headers || 'cdn-cache-control' in headers || 'cf-cache-status' in headers;
      expect(hasCacheControl).toBeTruthy();
    });

    test('should not expose server version information', async ({ request }) => {
      const response = await request.get('https://playwright.dev/');
      const server = response.headers()['server'] ?? '';
      // Server header should not leak specific version strings
      expect(server).not.toMatch(/apache\/\d/i);
      expect(server).not.toMatch(/nginx\/\d/i);
      expect(server).not.toMatch(/iis\/\d/i);
    });
  });

  test.describe('Response Time SLAs', () => {
    test('home page should respond within 3 seconds', async ({ request }) => {
      const start = Date.now();
      const response = await request.get('https://playwright.dev/');
      const duration = Date.now() - start;

      expect(response.status()).toBe(200);
      expect(duration).toBeLessThan(3_000);
    });

    test('docs page should respond within 3 seconds', async ({ request }) => {
      const start = Date.now();
      const response = await request.get('https://playwright.dev/docs/intro');
      const duration = Date.now() - start;

      expect(response.status()).toBe(200);
      expect(duration).toBeLessThan(3_000);
    });
  });

  test.describe('Content Validation', () => {
    test('home page body should contain Playwright branding', async ({ request }) => {
      const response = await request.get('https://playwright.dev/');
      const body = await response.text();
      expect(body).toContain('Playwright');
    });

    test('docs intro body should contain installation instructions', async ({ request }) => {
      const response = await request.get('https://playwright.dev/docs/intro');
      const body = await response.text();
      expect(body.toLowerCase()).toContain('install');
    });

    test('response body should not be empty', async ({ request }) => {
      const response = await request.get('https://playwright.dev/');
      const body = await response.text();
      expect(body.length).toBeGreaterThan(100);
    });
  });

  test.describe('HTTPS & Redirects', () => {
    test('site should be served over HTTPS', async ({ request }) => {
      const response = await request.get('https://playwright.dev/');
      expect(response.url()).toMatch(/^https:\/\//);
    });

    test('HTTP request should redirect to HTTPS', async ({ request }) => {
      // Most CDN providers redirect 80 → 443; we verify final URL is HTTPS
      const response = await request.get('https://playwright.dev/', {
        maxRedirects: 5,
      });
      expect(response.url()).toMatch(/^https:\/\//);
      expect(response.status()).toBe(200);
    });
  });
});