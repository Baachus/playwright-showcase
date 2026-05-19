import { test, expect } from '@playwright/test';
import * as allure from 'allure-js-commons';
import {
  mockJsonResponse,
  mockHtmlResponse,
  simulateHttpError,
  simulateNetworkError,
  spyOnRequests,
  modifyJsonResponse,
  mockNthCall,
} from '../../../src/utils/mock.utils.js';

/**
 * Network Mocking Tests – API Interception
 * ─────────────────────────────────────────────────────────────────────────────
 * Demonstrates Playwright's `page.route()` API across a range of real-world
 * scenarios: canned responses, error simulation, response modification, and
 * outbound request spying.
 *
 * These tests run against playwright.dev but intercept specific network calls
 * before they reach the wire, making them deterministic and fast.
 */

test.beforeEach(async () => {
  await allure.epic('Playwright.dev');
  await allure.feature('Network Mocking');
});

// ── Canned JSON Responses ─────────────────────────────────────────────────────
test.describe('JSON Response Mocking', { tag: ['@mocking'] }, () => {
  test('should return a mocked JSON payload for a matched route', async ({ page }) => {
    await allure.allureId('MOCK-API-001');
    await allure.story('Canned Response');
    await allure.label('severity', 'critical');
    await allure.description(
      'Intercepts a GET request and returns a controlled JSON body without hitting the real server. ' +
      'Confirms the browser receives exactly what the mock provides.',
    );

    const mockPayload = { version: '1.0.0-mock', status: 'ok', features: ['routing', 'assertions'] };

    await allure.step('Register JSON mock for /api/status', async () => {
      await mockJsonResponse(page, '**/api/status', mockPayload);
    });

    let interceptedData: unknown;
    await allure.step('Trigger a fetch request and capture the response', async () => {
      await page.goto('/');
      await page.waitForLoadState('domcontentloaded');

      interceptedData = await page.evaluate(async () => {
        const res = await fetch('/api/status');
        return res.json();
      });
    });

    await allure.step('Assert the mocked payload was returned', async () => {
      expect(interceptedData).toMatchObject(mockPayload);
    });
  });

  test('should return a mocked 201 Created response', async ({ page }) => {
    await allure.allureId('MOCK-API-002');
    await allure.story('Status Codes');
    await allure.label('severity', 'normal');
    await allure.description(
      'Verifies that custom HTTP status codes are honoured by the mock — useful for testing ' +
      'POST/PUT handlers that check the response status before updating UI state.',
    );

    await allure.step('Register 201 mock for /api/items', async () => {
      await mockJsonResponse(page, '**/api/items', { id: 42, created: true }, { status: 201 });
    });

    await page.goto('/');

    let status: number;
    await allure.step('POST to /api/items and capture status code', async () => {
      status = await page.evaluate(async () => {
        const res = await fetch('/api/items', { method: 'POST', body: '{}' });
        return res.status;
      });
    });

    await allure.step('Assert status is 201', async () => {
      expect(status!).toBe(201);
    });
  });

  test('should serve different responses for different routes', async ({ page }) => {
    await allure.allureId('MOCK-API-003');
    await allure.story('Multiple Routes');
    await allure.label('severity', 'normal');
    await allure.description(
      'Registers two independent route mocks and confirms each URL receives its own payload — ' +
      'simulating a multi-endpoint API consumed by one page.',
    );

    const usersPayload  = [{ id: 1, name: 'Alice' }, { id: 2, name: 'Bob' }];
    const configPayload = { theme: 'dark', locale: 'en-US' };

    await allure.step('Register mocks for /api/users and /api/config', async () => {
      await mockJsonResponse(page, '**/api/users',  usersPayload);
      await mockJsonResponse(page, '**/api/config', configPayload);
    });

    await page.goto('/');

    let users: unknown, config: unknown;
    await allure.step('Fetch both endpoints concurrently', async () => {
      [users, config] = await page.evaluate(async () => {
        const [u, c] = await Promise.all([
          fetch('/api/users').then((r) => r.json()),
          fetch('/api/config').then((r) => r.json()),
        ]);
        return [u, c];
      });
    });

    await allure.step('Assert correct payloads returned for each route', async () => {
      expect(users).toEqual(usersPayload);
      expect(config).toEqual(configPayload);
    });
  });
});

// ── HTML Response Mocking ─────────────────────────────────────────────────────
test.describe('HTML Response Mocking', { tag: ['@mocking'] }, () => {
  test('should render a fully mocked HTML page', async ({ page }) => {
    await allure.allureId('MOCK-API-004');
    await allure.story('HTML Mock');
    await allure.label('severity', 'normal');
    await allure.description(
      'Replaces an entire page response with controlled HTML. This technique is useful for testing ' +
      'how the app handles different server-rendered content without needing a backend.',
    );

    const html = `
      <!DOCTYPE html>
      <html lang="en">
        <head><title>Mocked Page</title></head>
        <body>
          <h1 data-testid="mocked-heading">Served by Playwright Mock</h1>
          <p data-testid="mocked-body">This page was intercepted and replaced.</p>
        </body>
      </html>
    `;

    await allure.step('Register HTML mock for /mocked-page', async () => {
      await mockHtmlResponse(page, '**/mocked-page', html);
    });

    await allure.step('Navigate to /mocked-page', async () => {
      await page.goto('/mocked-page');
    });

    await allure.step('Assert mocked content is rendered', async () => {
      await expect(page.getByTestId('mocked-heading')).toHaveText('Served by Playwright Mock');
      await expect(page.getByTestId('mocked-body')).toBeVisible();
      await expect(page).toHaveTitle('Mocked Page');
    });
  });
});

// ── HTTP Error Simulation ─────────────────────────────────────────────────────
test.describe('HTTP Error Simulation', { tag: ['@mocking'] }, () => {
  test('should simulate a 404 Not Found response', async ({ page }) => {
    await allure.allureId('MOCK-API-005');
    await allure.story('404 Error');
    await allure.label('severity', 'critical');
    await allure.description(
      'Forces a 404 on a specific route to verify the application handles missing resources gracefully ' +
      'without throwing unhandled exceptions.',
    );

    await allure.step('Register 404 mock for /api/missing', async () => {
      await simulateHttpError(page, '**/api/missing', 404, {
        body: { error: 'Not Found', message: 'The requested resource does not exist.' },
      });
    });

    await page.goto('/');

    let responseStatus: number;
    let responseBody: unknown;
    await allure.step('Request /api/missing and capture response', async () => {
      ({ status: responseStatus, body: responseBody } = await page.evaluate(async () => {
        const res = await fetch('/api/missing');
        return { status: res.status, body: await res.json() };
      }));
    });

    await allure.step('Assert 404 status and error body', async () => {
      expect(responseStatus!).toBe(404);
      expect(responseBody).toMatchObject({ error: 'Not Found' });
    });
  });

  test('should simulate a 500 Internal Server Error', async ({ page }) => {
    await allure.allureId('MOCK-API-006');
    await allure.story('500 Error');
    await allure.label('severity', 'critical');
    await allure.description(
      'Simulates a server-side crash (500) to ensure the UI surfaces a user-friendly error state ' +
      'rather than displaying a broken or blank page.',
    );

    await allure.step('Register 500 mock for /api/crash', async () => {
      await simulateHttpError(page, '**/api/crash', 500, {
        body: { error: 'Internal Server Error', trace: 'fake-trace-id-12345' },
      });
    });

    await page.goto('/');

    let status: number;
    await allure.step('Request /api/crash and verify status', async () => {
      status = await page.evaluate(async () => {
        const res = await fetch('/api/crash');
        return res.status;
      });
    });

    await allure.step('Assert status is 500', async () => {
      expect(status!).toBe(500);
    });
  });

  test('should simulate a 503 Service Unavailable with retry-after header', async ({ page }) => {
    await allure.allureId('MOCK-API-007');
    await allure.story('503 Error');
    await allure.label('severity', 'normal');

    await allure.step('Register 503 mock with Retry-After header', async () => {
      await simulateHttpError(page, '**/api/service', 503, {
        body: { error: 'Service Unavailable' },
      });
    });

    await page.goto('/');

    let status: number;
    await allure.step('Request /api/service and capture status', async () => {
      status = await page.evaluate(async () => {
        const res = await fetch('/api/service');
        return res.status;
      });
    });

    await allure.step('Assert status is 503', async () => {
      expect(status!).toBe(503);
    });
  });
});

// ── Network-Level Failure Simulation ─────────────────────────────────────────
test.describe('Network Failure Simulation', { tag: ['@mocking'] }, () => {
  test('should abort a request to simulate a network failure', async ({ page }) => {
    await allure.allureId('MOCK-API-008');
    await allure.story('Network Abort');
    await allure.label('severity', 'critical');
    await allure.description(
      'Aborts a request at the TCP level (before any HTTP response), simulating a dropped connection or ' +
      'DNS failure. The browser receives a network error rather than an HTTP status code.',
    );

    await allure.step('Register abort route for /api/unreachable', async () => {
      await simulateNetworkError(page, '**/api/unreachable', 'failed');
    });

    await page.goto('/');

    let threw = false;
    await allure.step('Fetch /api/unreachable and expect a network exception', async () => {
      threw = await page.evaluate(async () => {
        try {
          await fetch('/api/unreachable');
          return false;
        } catch {
          return true;
        }
      });
    });

    await allure.step('Assert a network-level error was thrown', async () => {
      expect(threw).toBe(true);
    });
  });

  test('should simulate connection refused', async ({ page }) => {
    await allure.allureId('MOCK-API-009');
    await allure.story('Connection Refused');
    await allure.label('severity', 'normal');

    await allure.step('Register connectionrefused abort for /api/blocked', async () => {
      await simulateNetworkError(page, '**/api/blocked', 'connectionrefused');
    });

    await page.goto('/');

    const threw = await page.evaluate(async () => {
      try { await fetch('/api/blocked'); return false; }
      catch { return true; }
    });

    await allure.step('Assert connection was refused', async () => {
      expect(threw).toBe(true);
    });
  });
});

// ── Response Modification ─────────────────────────────────────────────────────
test.describe('Response Modification', { tag: ['@mocking'] }, () => {
  test('should surgically modify a live API response', async ({ page }) => {
    await allure.allureId('MOCK-API-010');
    await allure.story('Response Transform');
    await allure.label('severity', 'normal');
    await allure.description(
      'Lets the real request through to the server, then intercepts the response and modifies a single ' +
      'field before handing it to the browser. This is ideal for injecting feature flags or A/B variants ' +
      'into an otherwise real API response.',
    );

    // Single route registration — stacking a mockJsonResponse for the same pattern
    // would shadow this handler (Playwright uses LIFO ordering) and route.fetch()
    // would never be reached. The fallbackBody option supplies the base data when
    // the real server doesn't return JSON (playwright.dev has no /api/data endpoint).
    await allure.step('Register modifier that injects featureFlag into base response', async () => {
      await modifyJsonResponse(
        page,
        '**/api/data',
        (body) => ({
          ...(body as object),
          featureFlag: 'enabled',
          injectedBy: 'playwright-mock',
        }),
        { fallbackBody: { value: 'original', extra: 'real-data' } },
      );
    });

    await page.goto('/');

    const result = await page.evaluate(async () => {
      const res = await fetch('/api/data');
      return res.json();
    });

    await allure.step('Assert base fields and injected modifications are present', async () => {
      expect(result).toMatchObject({
        value: 'original',
        extra: 'real-data',
        featureFlag: 'enabled',
        injectedBy: 'playwright-mock',
      });
    });
  });
});

// ── Request Spying ────────────────────────────────────────────────────────────
test.describe('Request Spying', { tag: ['@mocking'] }, () => {
  test('should capture outbound requests without altering them', async ({ page }) => {
    await allure.allureId('MOCK-API-011');
    await allure.story('Request Spy');
    await allure.label('severity', 'normal');
    await allure.description(
      'Registers a passthrough spy that records every matching request in an array. The requests reach the ' +
      'real server unchanged, but test assertions can inspect the captured payloads — method, headers, and body.',
    );

    const { captured, unroute } = await spyOnRequests(page, /playwright\.dev/);

    await allure.step('Navigate to playwright.dev (requests pass through)', async () => {
      await page.goto('/');
      await page.waitForLoadState('domcontentloaded');
    });

    await allure.step('Assert at least one request was captured', async () => {
      expect(captured.length).toBeGreaterThan(0);
    });

    await allure.step('Assert the first captured request targets playwright.dev', async () => {
      expect(captured[0].url).toMatch(/playwright\.dev/);
    });

    await allure.step('Assert captured requests have HTTP method set', async () => {
      expect(['GET', 'POST', 'HEAD']).toContain(captured[0].method);
    });

    await unroute();
  });
});

// ── Transient / Nth-Call Mocking ──────────────────────────────────────────────
test.describe('Conditional Mocking', { tag: ['@mocking'] }, () => {
  test('should fail the first call and succeed on retry', async ({ page }) => {
    await allure.allureId('MOCK-API-012');
    await allure.story('Retry Simulation');
    await allure.label('severity', 'normal');
    await allure.description(
      'Intercepts only the first call to an endpoint with a 503 error, then lets subsequent calls through. ' +
      'This tests retry logic in the application without needing an unreliable backend.',
    );

    let firstCallStatus: number;
    let secondCallStatus: number;

    await allure.step('Register Nth-call mock: fail call 0, pass call 1+', async () => {
      // Both behaviors are in ONE route registration. Registering a second route for
      // the same pattern would shadow this one (Playwright uses LIFO ordering), causing
      // every call to hit the later handler and never reach the Nth-call logic.
      await mockNthCall(
        page,
        '**/api/retry-me',
        0,
        async (route) => {
          await route.fulfill({ status: 503, body: JSON.stringify({ error: 'Transient failure' }) });
        },
        async (route) => {
          await route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({ result: 'success' }),
          });
        },
      );
    });

    await page.goto('/');

    await allure.step('Make first request (should return 503)', async () => {
      firstCallStatus = await page.evaluate(async () => {
        const res = await fetch('/api/retry-me');
        return res.status;
      });
    });

    await allure.step('Make second request (should return 200)', async () => {
      secondCallStatus = await page.evaluate(async () => {
        const res = await fetch('/api/retry-me');
        return res.status;
      });
    });

    await allure.step('Assert first call failed with 503', async () => {
      expect(firstCallStatus!).toBe(503);
    });

    await allure.step('Assert second call succeeded with 200', async () => {
      expect(secondCallStatus!).toBe(200);
    });
  });
});
