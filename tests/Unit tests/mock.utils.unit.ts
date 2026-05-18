import { test, expect } from '@playwright/test';
import type { Page, Route, Request } from '@playwright/test';
import {
  mockJsonResponse,
  mockHtmlResponse,
  simulateHttpError,
  simulateNetworkError,
  withOfflineMode,
  addLatency,
  spyOnRequests,
  mockNthCall,
} from '../../src/utils/mock.utils.js';

/**
 * Unit tests for mock.utils.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Each test captures the handler registered on a mock Page, then invokes it
 * with a mock Route to verify the correct fulfill / abort / continue call is
 * made — without any browser or real network traffic.
 */

// ── Mock factory helpers ──────────────────────────────────────────────────────

interface RouteCapture {
  status?: number;
  contentType?: string;
  body?: string;
  headers?: Record<string, string>;
  abortCode?: string;
  continued?: boolean;
}

/** Creates a Route mock that records what was called on it. */
function createRouteMock(): Route & { _capture: RouteCapture; _response: () => RouteCapture } {
  const capture: RouteCapture = {};
  return {
    fulfill: async (opts: {
      status?: number;
      contentType?: string;
      body?: string;
      headers?: Record<string, string>;
    }) => {
      capture.status      = opts.status;
      capture.contentType = opts.contentType;
      capture.body        = opts.body;
      capture.headers     = opts.headers;
    },
    abort:    async (code: string) => { capture.abortCode = code; },
    continue: async ()              => { capture.continued = true; },
    fetch:    async ()              => ({
      json: async () => ({ original: true }),
    }),
    _capture:  capture,
    _response: () => capture,
  } as unknown as Route & { _capture: RouteCapture; _response: () => RouteCapture };
}

interface PageMock {
  page:     Page;
  invokeHandler: (route?: Route, request?: Request) => Promise<void>;
}

/** Creates a Page mock that captures a route handler and lets you call it. */
function createPageMock(): PageMock {
  type Handler = (route: Route, request?: Request) => Promise<void>;
  let handler: Handler | null = null;
  let isOffline = false;

  const page = {
    route:   async (_pattern: unknown, h: Handler) => { handler = h; },
    unroute: async (_pattern: unknown, _h: unknown) => { handler = null; },
    context: () => ({
      setOffline: async (v: boolean) => { isOffline = v; },
    }),
    _isOffline: () => isOffline,
  } as unknown as Page;

  return {
    page,
    invokeHandler: async (route?: Route, request?: Request) => {
      if (!handler) throw new Error('No handler registered');
      await handler(route ?? createRouteMock(), request);
    },
  };
}

// ── mockJsonResponse ─────────────────────────────────────────────────────────

test.describe('mock.utils › mockJsonResponse', () => {

  test('registers a route and fulfills with JSON content-type', async () => {
    const { page, invokeHandler } = createPageMock();
    const route = createRouteMock();
    await mockJsonResponse(page, /\/api\/test/, { id: 1 });
    await invokeHandler(route);
    expect(route._capture.contentType).toBe('application/json');
  });

  test('serializes the body to JSON string', async () => {
    const { page, invokeHandler } = createPageMock();
    const route = createRouteMock();
    const body = { items: [1, 2, 3], total: 3 };
    await mockJsonResponse(page, /\/api\/items/, body);
    await invokeHandler(route);
    expect(JSON.parse(route._capture.body!)).toEqual(body);
  });

  test('defaults to HTTP 200 status', async () => {
    const { page, invokeHandler } = createPageMock();
    const route = createRouteMock();
    await mockJsonResponse(page, /\/api\/test/, {});
    await invokeHandler(route);
    expect(route._capture.status).toBe(200);
  });

  test('uses a custom status code when provided', async () => {
    const { page, invokeHandler } = createPageMock();
    const route = createRouteMock();
    await mockJsonResponse(page, /\/api\/test/, {}, { status: 201 });
    await invokeHandler(route);
    expect(route._capture.status).toBe(201);
  });

  test('returns an unroute function that removes the handler', async () => {
    const { page, invokeHandler } = createPageMock();
    const unroute = await mockJsonResponse(page, /\/api\/test/, {});
    await unroute();
    await expect(invokeHandler()).rejects.toThrow('No handler registered');
  });
});

// ── mockHtmlResponse ─────────────────────────────────────────────────────────

test.describe('mock.utils › mockHtmlResponse', () => {

  test('fulfills with HTML content-type', async () => {
    const { page, invokeHandler } = createPageMock();
    const route = createRouteMock();
    await mockHtmlResponse(page, /\/maintenance/, '<h1>Down</h1>');
    await invokeHandler(route);
    expect(route._capture.contentType).toMatch(/text\/html/);
  });

  test('returns the provided HTML as the response body', async () => {
    const { page, invokeHandler } = createPageMock();
    const route = createRouteMock();
    const html = '<html><body>Hello</body></html>';
    await mockHtmlResponse(page, /\/page/, html);
    await invokeHandler(route);
    expect(route._capture.body).toBe(html);
  });

  test('defaults to HTTP 200 status', async () => {
    const { page, invokeHandler } = createPageMock();
    const route = createRouteMock();
    await mockHtmlResponse(page, /\/page/, '<p>ok</p>');
    await invokeHandler(route);
    expect(route._capture.status).toBe(200);
  });

  test('uses a custom status code when provided', async () => {
    const { page, invokeHandler } = createPageMock();
    const route = createRouteMock();
    await mockHtmlResponse(page, /\/maintenance/, '<h1>503</h1>', { status: 503 });
    await invokeHandler(route);
    expect(route._capture.status).toBe(503);
  });

  test('returns an unroute function', async () => {
    const { page } = createPageMock();
    const unroute = await mockHtmlResponse(page, /\/page/, '<p>x</p>');
    expect(typeof unroute).toBe('function');
  });
});

// ── simulateHttpError ─────────────────────────────────────────────────────────

test.describe('mock.utils › simulateHttpError', () => {

  test('fulfills with the given HTTP error status', async () => {
    const { page, invokeHandler } = createPageMock();
    const route = createRouteMock();
    await simulateHttpError(page, /\/api\/broken/, 503);
    await invokeHandler(route);
    expect(route._capture.status).toBe(503);
  });

  test('fulfills with a 404 status', async () => {
    const { page, invokeHandler } = createPageMock();
    const route = createRouteMock();
    await simulateHttpError(page, /\/api\/missing/, 404);
    await invokeHandler(route);
    expect(route._capture.status).toBe(404);
  });

  test('encodes the default error body as JSON', async () => {
    const { page, invokeHandler } = createPageMock();
    const route = createRouteMock();
    await simulateHttpError(page, /\/api\/err/, 500);
    await invokeHandler(route);
    const body = JSON.parse(route._capture.body!);
    expect(body).toHaveProperty('error');
  });

  test('includes a custom body when provided', async () => {
    const { page, invokeHandler } = createPageMock();
    const route = createRouteMock();
    const customBody = { error: 'Service Unavailable', code: 503 };
    await simulateHttpError(page, /\/api\/err/, 503, { body: customBody });
    await invokeHandler(route);
    expect(JSON.parse(route._capture.body!)).toEqual(customBody);
  });
});

// ── simulateNetworkError ──────────────────────────────────────────────────────

test.describe('mock.utils › simulateNetworkError', () => {

  test('aborts with "failed" by default', async () => {
    const { page, invokeHandler } = createPageMock();
    const route = createRouteMock();
    await simulateNetworkError(page, /\/api\/offline/);
    await invokeHandler(route);
    expect(route._capture.abortCode).toBe('failed');
  });

  test('aborts with the specified error code', async () => {
    const { page, invokeHandler } = createPageMock();
    const route = createRouteMock();
    await simulateNetworkError(page, /\/api\/offline/, 'internetdisconnected');
    await invokeHandler(route);
    expect(route._capture.abortCode).toBe('internetdisconnected');
  });

  test('aborts with "timedout" error code', async () => {
    const { page, invokeHandler } = createPageMock();
    const route = createRouteMock();
    await simulateNetworkError(page, /\/api\/slow/, 'timedout');
    await invokeHandler(route);
    expect(route._capture.abortCode).toBe('timedout');
  });

  test('returns an unroute function', async () => {
    const { page } = createPageMock();
    const unroute = await simulateNetworkError(page, /\/api\/test/);
    expect(typeof unroute).toBe('function');
  });
});

// ── withOfflineMode ───────────────────────────────────────────────────────────

test.describe('mock.utils › withOfflineMode', () => {

  test('sets the context offline before the action runs', async () => {
    const { page } = createPageMock();
    const offlineDuring: boolean[] = [];

    await withOfflineMode(page, async () => {
      offlineDuring.push((page as unknown as { _isOffline: () => boolean })._isOffline());
    });

    expect(offlineDuring[0]).toBe(true);
  });

  test('restores the context to online after the action completes', async () => {
    const { page } = createPageMock();
    await withOfflineMode(page, async () => { /* noop */ });
    expect((page as unknown as { _isOffline: () => boolean })._isOffline()).toBe(false);
  });

  test('restores online mode even when the action throws', async () => {
    const { page } = createPageMock();
    try {
      await withOfflineMode(page, async () => {
        throw new Error('action error');
      });
    } catch {
      // expected
    }
    expect((page as unknown as { _isOffline: () => boolean })._isOffline()).toBe(false);
  });
});

// ── addLatency ────────────────────────────────────────────────────────────────

test.describe('mock.utils › addLatency', () => {

  test('calls route.continue() after the delay', async () => {
    const { page, invokeHandler } = createPageMock();
    const route = createRouteMock();
    // Use delay=0 to keep tests fast
    await addLatency(page, /\/api\/slow/, { delay: 0 });
    await invokeHandler(route);
    expect(route._capture.continued).toBe(true);
  });

  test('returns an unroute function', async () => {
    const { page } = createPageMock();
    const unroute = await addLatency(page, /\/api\/slow/, { delay: 0 });
    expect(typeof unroute).toBe('function');
  });
});

// ── mockNthCall ───────────────────────────────────────────────────────────────

test.describe('mock.utils › mockNthCall', () => {

  test('invokes the mockHandler on the Nth (zero-indexed) call', async () => {
    // We'll test by directly hooking into the page mock
    type Handler = (route: Route, request?: Request) => Promise<void>;
    let registeredHandler: Handler | null = null;

    const page = {
      route:   async (_p: unknown, h: Handler) => { registeredHandler = h; },
      unroute: async () => {},
    } as unknown as Page;

    const mockResults: string[] = [];
    const fallbackResults: string[] = [];

    await mockNthCall(
      page,
      /\/api\/test/,
      1, // intercept the SECOND call (index 1)
      async (_route) => { mockResults.push('mocked'); },
      async (_route) => { fallbackResults.push('fallback'); },
    );

    // Simulate 3 calls
    const fakeRoute = createRouteMock();
    await registeredHandler!(fakeRoute);     // call 0 → fallback
    await registeredHandler!(fakeRoute);     // call 1 → mock
    await registeredHandler!(fakeRoute);     // call 2 → fallback

    expect(mockResults).toHaveLength(1);
    expect(fallbackResults).toHaveLength(2);
  });

  test('passes through via route.continue() when no fallbackHandler is provided', async () => {
    type Handler = (route: Route) => Promise<void>;
    let registeredHandler: Handler | null = null;

    const page = {
      route:   async (_p: unknown, h: Handler) => { registeredHandler = h; },
      unroute: async () => {},
    } as unknown as Page;

    await mockNthCall(page, /\/api\/test/, 99, async (_route) => { /* never fires */ });

    const route = createRouteMock();
    await registeredHandler!(route);
    // call 0 is not the 99th call, so it should continue
    expect(route._capture.continued).toBe(true);
  });

  test('returns an unroute function', async () => {
    const page = {
      route:   async () => {},
      unroute: async () => {},
    } as unknown as Page;
    const unroute = await mockNthCall(page, /\/api\/test/, 0, async () => {});
    expect(typeof unroute).toBe('function');
  });
});

// ── spyOnRequests ─────────────────────────────────────────────────────────────

test.describe('mock.utils › spyOnRequests', () => {

  test('returns an object with captured array and unroute function', async () => {
    const { page } = createPageMock();
    const result = await spyOnRequests(page, /\/api\/track/);
    expect(Array.isArray(result.captured)).toBe(true);
    expect(typeof result.unroute).toBe('function');
  });

  test('captured array starts empty', async () => {
    const { page } = createPageMock();
    const { captured } = await spyOnRequests(page, /\/api\/track/);
    expect(captured).toHaveLength(0);
  });
});
