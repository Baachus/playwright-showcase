import { Page, Route, Request } from '@playwright/test';

/**
 * Network Mocking Utilities
 * ─────────────────────────────────────────────────────────────────────────────
 * Wrappers around Playwright's `page.route()` API for intercepting and
 * controlling network traffic in tests. Three primary use-cases are covered:
 *
 *   1. Response mocking   — return canned JSON/HTML without hitting the server.
 *   2. Error simulation   — force HTTP error codes or network-level failures.
 *   3. Latency injection  — add artificial delays to expose timeout/UX issues.
 *   4. Request inspection — capture outgoing requests for assertion purposes.
 *   5. Passthrough + spy  — let the real request through but record it.
 *
 * All helpers return an `unroute` function so tests can clean up explicitly
 * (though Playwright automatically removes routes after each test).
 *
 * Usage:
 *   import { mockJsonResponse, simulateNetworkError, addLatency } from '@utils/mock.utils.js';
 *
 *   const unroute = await mockJsonResponse(page, /\/api\/users/, { id: 1, name: 'Alice' });
 *    … test code …
 *   await unroute();
 */

// ── Types ────────────────────────────────────────────────────────────────────

/** A function that removes the registered route. */
export type UnrouteFunction = () => Promise<void>;

/** Options for mocked JSON responses. */
export interface MockJsonOptions {
  /** HTTP status code. Default: 200. */
  status?: number;
  /** Additional response headers merged with Content-Type. */
  headers?: Record<string, string>;
  /** Delay in milliseconds before responding. Default: 0. */
  delay?: number;
}

/** Options for mocked HTML responses. */
export interface MockHtmlOptions {
  /** HTTP status code. Default: 200. */
  status?: number;
  /** Additional response headers. */
  headers?: Record<string, string>;
  /** Delay in milliseconds before responding. Default: 0. */
  delay?: number;
}

/** Options for error simulation. */
export interface ErrorSimulationOptions {
  /** Delay before returning the error. Default: 0. */
  delay?: number;
}

/** Options for latency injection. */
export interface LatencyOptions {
  /** Fixed delay in ms. If `jitter` is set, actual delay = delay ± jitter. */
  delay: number;
  /** Maximum random variance in ms applied to `delay`. Default: 0. */
  jitter?: number;
}

/** A captured network request with timing. */
export interface CapturedRequest {
  url: string;
  method: string;
  headers: Record<string, string>;
  postData: string | null;
  timestamp: number;
}

// ── Response Mocking ─────────────────────────────────────────────────────────
/**
 * Intercept requests matching `urlPattern` and return a mocked JSON response.
 *
 * @param page       - Playwright page.
 * @param urlPattern - URL glob or RegExp to intercept.
 * @param body       - The JSON-serializable object to return as the body.
 * @param options    - Status code, extra headers, and optional delay.
 * @returns          An `unroute` function to remove the route when done.
 *
 * @example
 *   await mockJsonResponse(page, /\/api\/products/, [{ id: 1, name: 'Widget' }]);
 */
export async function mockJsonResponse(
  page: Page,
  urlPattern: string | RegExp,
  body: unknown,
  options: MockJsonOptions = {},
): Promise<UnrouteFunction> {
  const { status = 200, headers = {}, delay = 0 } = options;

  const handler = async (route: Route) => {
    if (delay > 0) await new Promise((r) => setTimeout(r, delay));
    await route.fulfill({
      status,
      contentType: 'application/json',
      headers: { 'Access-Control-Allow-Origin': '*', ...headers },
      body: JSON.stringify(body),
    });
  };

  await page.route(urlPattern, handler);
  return async () => page.unroute(urlPattern, handler);
}

/**
 * Intercept requests matching `urlPattern` and return a mocked HTML response.
 *
 * @example
 *   await mockHtmlResponse(page, /\/maintenance/, '<h1>Under maintenance</h1>');
 */
export async function mockHtmlResponse(
  page: Page,
  urlPattern: string | RegExp,
  html: string,
  options: MockHtmlOptions = {},
): Promise<UnrouteFunction> {
  const { status = 200, headers = {}, delay = 0 } = options;

  const handler = async (route: Route) => {
    if (delay > 0) await new Promise((r) => setTimeout(r, delay));
    await route.fulfill({
      status,
      contentType: 'text/html; charset=utf-8',
      headers,
      body: html,
    });
  };

  await page.route(urlPattern, handler);
  return async () => page.unroute(urlPattern, handler);
}

// ── Error Simulation ─────────────────────────────────────────────────────────
/**
 * Intercept requests matching `urlPattern` and respond with an HTTP error code.
 * Useful for testing how the UI handles 4xx/5xx responses.
 *
 * @param status - HTTP status code (e.g. 404, 500, 503).
 *
 * @example
 *   await simulateHttpError(page, /\/api\/users/, 503, { body: { error: 'Service Unavailable' } });
 */
export async function simulateHttpError(
  page: Page,
  urlPattern: string | RegExp,
  status: number,
  options: { body?: unknown; delay?: number } = {},
): Promise<UnrouteFunction> {
  const { body, delay = 0 } = options;

  const handler = async (route: Route) => {
    if (delay > 0) await new Promise((r) => setTimeout(r, delay));
    await route.fulfill({
      status,
      contentType: 'application/json',
      body: body ? JSON.stringify(body) : JSON.stringify({ error: `HTTP ${status}` }),
    });
  };

  await page.route(urlPattern, handler);
  return async () => page.unroute(urlPattern, handler);
}

/**
 * Intercept requests matching `urlPattern` and abort them at the network level,
 * simulating a DNS failure, connection refused, or offline scenario.
 *
 * @param errorCode - Playwright abort error code. Default: 'failed'.
 *   Common values: 'aborted', 'connectionrefused', 'connectionreset',
 *                  'internetdisconnected', 'namenotresolved', 'timedout'.
 *
 * @example
 *   await simulateNetworkError(page, '**\/api\/**', 'internetdisconnected');
 */
export async function simulateNetworkError(
  page: Page,
  urlPattern: string | RegExp,
  errorCode:
    | 'aborted'
    | 'accessdenied'
    | 'addressunreachable'
    | 'blockedbyclient'
    | 'connectionaborted'
    | 'connectionclosed'
    | 'connectionfailed'
    | 'connectionrefused'
    | 'connectionreset'
    | 'internetdisconnected'
    | 'namenotresolved'
    | 'timedout'
    | 'failed' = 'failed',
  options: ErrorSimulationOptions = {},
): Promise<UnrouteFunction> {
  const { delay = 0 } = options;

  const handler = async (route: Route) => {
    if (delay > 0) await new Promise((r) => setTimeout(r, delay));
    await route.abort(errorCode);
  };

  await page.route(urlPattern, handler);
  return async () => page.unroute(urlPattern, handler);
}

// ── Latency Injection ─────────────────────────────────────────────────────────
/**
 * Intercept requests matching `urlPattern`, delay them by `options.delay` ms,
 * then pass them through to the real server unchanged. Useful for testing
 * loading states, spinners, and timeout handling.
 *
 * @example
 *   await addLatency(page, '**\/api\/**', { delay: 2000 });
 */
export async function addLatency(
  page: Page,
  urlPattern: string | RegExp,
  options: LatencyOptions,
): Promise<UnrouteFunction> {
  const { delay, jitter = 0 } = options;

  const handler = async (route: Route) => {
    const actual = jitter > 0 ? delay + Math.floor(Math.random() * jitter * 2) - jitter : delay;
    await new Promise((r) => setTimeout(r, Math.max(0, actual)));
    await route.continue();
  };

  await page.route(urlPattern, handler);
  return async () => page.unroute(urlPattern, handler);
}

// ── Request Capture / Spying ──────────────────────────────────────────────────
/**
 * Register a route handler that lets requests through to the real server
 * but records each matching request in the returned `captured` array.
 * Useful for asserting on outgoing payloads without mocking the response.
 *
 * @returns `{ captured, unroute }` — the recorded requests and a cleanup function.
 *
 * @example
 *   const { captured, unroute } = await spyOnRequests(page, /\/api\/track/);
 *   await page.click('button#buy');
 *   expect(captured).toHaveLength(1);
 *   expect(JSON.parse(captured[0].postData ?? '{}')).toMatchObject({ event: 'purchase' });
 *   await unroute();
 */
export async function spyOnRequests(
  page: Page,
  urlPattern: string | RegExp,
): Promise<{ captured: CapturedRequest[]; unroute: UnrouteFunction }> {
  const captured: CapturedRequest[] = [];

  const handler = async (route: Route, request: Request) => {
    captured.push({
      url:       request.url(),
      method:    request.method(),
      headers:   await request.allHeaders(),
      postData:  request.postData(),
      timestamp: Date.now(),
    });
    await route.continue();
  };

  await page.route(urlPattern, handler);
  return {
    captured,
    unroute: async () => page.unroute(urlPattern, handler),
  };
}

// ── Offline Mode ──────────────────────────────────────────────────────────────
/**
 * Set the browser context to offline mode, execute `action`, then restore
 * connectivity. Uses Playwright's `context.setOffline()`.
 *
 * @example
 *   await withOfflineMode(page, async () => {
 *     await expect(page.getByText('No internet connection')).toBeVisible();
 *   });
 */
export async function withOfflineMode(page: Page, action: () => Promise<void>): Promise<void> {
  await page.context().setOffline(true);
  try {
    await action();
  } finally {
    await page.context().setOffline(false);
  }
}

// ── Response Modification ─────────────────────────────────────────────────────
/** Options for modifyJsonResponse. */
export interface ModifyJsonOptions {
  /**
   * Synthetic base body to use when the real server does not return JSON
   * (e.g. returns HTML, or the endpoint doesn't exist in the test environment).
   * When provided, the transform receives this value instead of the server body
   * and the response is fulfilled with status 200 + application/json.
   * When omitted and the server returns non-JSON, the response is forwarded
   * to the browser unmodified.
   */
  fallbackBody?: unknown;
}

/**
 * Intercept a request, let it hit the real server, then modify the response
 * body before returning it to the browser. Useful when you want real data
 * but need to surgically alter one field (e.g. inject a feature flag).
 *
 * When the real server does not return JSON (e.g. the endpoint only exists in
 * production, or returns HTML in the test environment), supply `fallbackBody`
 * to provide a synthetic base that the transform will receive instead.
 *
 * IMPORTANT: Register only this single route for the URL pattern. Do NOT stack
 * a `mockJsonResponse` call for the same pattern — Playwright processes routes
 * LIFO (last-registered wins), so the later registration would intercept first
 * and this handler would never reach `route.fetch()`.
 *
 * @param transform - Receives the parsed (or fallback) JSON body and returns
 *                    the modified version.
 * @param options   - Optional `fallbackBody` for non-JSON server responses.
 *
 * @example
 *   Against a real JSON endpoint:
 *   await modifyJsonResponse(page, /\/api\/config/, (body) => ({
 *     ...body,
 *     featureFlags: { newCheckout: true },
 *   }));
 *
 *   When the endpoint returns HTML in the test environment:
 *   await modifyJsonResponse(
 *     page,
 *     /\/api\/config/,
 *     (body) => ({ ...(body as object), featureFlags: { newCheckout: true } }),
 *     { fallbackBody: { theme: 'dark', locale: 'en-US' } },
 *   );
 */
export async function modifyJsonResponse(
  page: Page,
  urlPattern: string | RegExp,
  transform: (body: unknown) => unknown,
  options: ModifyJsonOptions = {},
): Promise<UnrouteFunction> {
  const handler = async (route: Route) => {
    const response = await route.fetch();
    let body: unknown;
    try {
      body = await response.json();
    } catch {
      if (options.fallbackBody !== undefined) {
        // Real server didn't return JSON; use the synthetic base instead
        body = options.fallbackBody;
      } else {
        // No fallback configured — forward the raw response unmodified
        await route.fulfill({ response });
        return;
      }
    }
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(transform(body)),
    });
  };

  await page.route(urlPattern, handler);
  return async () => page.unroute(urlPattern, handler);
}

// ── Conditional Mocking ───────────────────────────────────────────────────────
/**
 * Mock only the Nth call to a URL (zero-indexed). All other requests are handled
 * by `fallbackHandler` if provided, or passed through to the real server otherwise.
 *
 * @param targetCallIndex - Which call to intercept (0 = first call, 1 = second, …).
 * @param mockHandler     - Handler invoked for the Nth call.
 * @param fallbackHandler - Optional handler for every other call. When omitted the
 *                          request is forwarded to the real server via `route.continue()`.
 *
 * IMPORTANT: Register only this single route for the URL pattern. Do NOT stack a
 * second `page.route()` call for the same pattern alongside this one — Playwright
 * processes routes LIFO (last-registered wins), so a second registration would
 * shadow this handler and intercept all calls before this one runs.
 *
 * @example
 *   Simulate a transient failure on the first attempt, then succeed:
 *   await mockNthCall(
 *     page,
 *     /\/api\/submit/,
 *     0,
 *     async (route) => route.fulfill({ status: 503, body: 'Service Unavailable' }),
 *     async (route) => route.fulfill({ status: 200, body: JSON.stringify({ ok: true }) }),
 *   );
 */
export async function mockNthCall(
  page: Page,
  urlPattern: string | RegExp,
  targetCallIndex: number,
  mockHandler: (route: Route) => Promise<void>,
  fallbackHandler?: (route: Route) => Promise<void>,
): Promise<UnrouteFunction> {
  let callCount = 0;

  const handler = async (route: Route) => {
    if (callCount === targetCallIndex) {
      callCount++;
      await mockHandler(route);
    } else {
      callCount++;
      if (fallbackHandler) {
        await fallbackHandler(route);
      } else {
        await route.continue();
      }
    }
  };

  await page.route(urlPattern, handler);
  return async () => page.unroute(urlPattern, handler);
}
