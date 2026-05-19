import { test, expect } from '@playwright/test';
import * as allure from 'allure-js-commons';
import type { Page, WebSocketRoute } from '@playwright/test';
import {
  MockWebSocketServer,
  startLocalEchoServer,
} from '../../src/utils/websocket.utils.js';

/**
 * Unit tests for websocket.utils.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * MockWebSocketServer internals are exercised by manually triggering its
 * internal callbacks (the same way Playwright does at runtime).
 * startLocalEchoServer spins up a real in-process server on a random port.
 *
 * Page-dependent helpers (injectWebSocketClient, sendFromClient, etc.) are
 * covered by the integration-level WebSocket specs in tests/websocket/.
 */

// ── MockWebSocketServer construction ─────────────────────────────────────────
test.describe('websocket.utils › MockWebSocketServer (construction)', () => {

  test('stores the url passed to the constructor', async () => {
    await allure.allureId('UNIT-WS-001');
    const server = new MockWebSocketServer('wss://realtime.example.com/prices');
    expect(server.url).toBe('wss://realtime.example.com/prices');
  });

  test('isConnected is false before setup()', async () => {
    await allure.allureId('UNIT-WS-002');
    const server = new MockWebSocketServer('wss://example.com');
    expect(server.isConnected).toBe(false);
  });

  test('totalConnections is 0 before any client connects', async () => {
    await allure.allureId('UNIT-WS-003');
    const server = new MockWebSocketServer('wss://example.com');
    expect(server.totalConnections).toBe(0);
  });

  test('receivedMessages is an empty array initially', async () => {
    await allure.allureId('UNIT-WS-004');
    const server = new MockWebSocketServer('wss://example.com');
    expect(Array.isArray(server.receivedMessages)).toBe(true);
    expect(server.receivedMessages).toHaveLength(0);
  });
});

// ── MockWebSocketServer — push / pushJSON guards ──────────────────────────────
test.describe('websocket.utils › MockWebSocketServer.push', () => {

  test('throws when no client is connected', async () => {
    await allure.allureId('UNIT-WS-005');
    const server = new MockWebSocketServer('wss://example.com');
    expect(() => server.push('hello')).toThrow(/no active websocket connection/i);
  });

  test('pushJSON throws when no client is connected', async () => {
    await allure.allureId('UNIT-WS-006');
    const server = new MockWebSocketServer('wss://example.com');
    expect(() => server.pushJSON({ type: 'ping' })).toThrow(/no active websocket connection/i);
  });
});

// ── MockWebSocketServer — simulate a connection ───────────────────────────────
/**
 * Manually drive the MockWebSocketServer by simulating what Playwright's
 * routeWebSocket() callback would do when a client connects.
 */
function simulateConnection(server: MockWebSocketServer): {
  triggerMessage: (msg: string | Buffer) => void;
  triggerClose:   (code?: number, reason?: string) => void;
  sentMessages:   (string | Buffer)[];
} {
  const sentMessages: (string | Buffer)[] = [];

  // Build a fake WebSocketRoute
  const fakeRoute = {
    send:     (msg: string | Buffer) => { sentMessages.push(msg); },
    close:    async ()               => {},
    onMessage: (cb: (msg: string | Buffer) => void) => { onMsg = cb; },
    onClose:   (cb: (code: number, reason: string) => void) => { onClose = cb; },
  } as unknown as WebSocketRoute;

  let onMsg:   ((msg: string | Buffer) => void)        = () => {};
  let onClose: ((code: number, reason: string) => void) = () => {};

  // Directly invoke the internal route handler by calling setup() on a mock page
  const page = {
    routeWebSocket: async (_url: unknown, cb: (ws: WebSocketRoute) => void) => {
      cb(fakeRoute);
    },
  } as unknown as Page;

  // setup() is async, but the synchronous part (registering onMessage/onClose)
  // happens immediately inside the routeWebSocket callback
  server.setup(page);

  return {
    triggerMessage: (msg) => onMsg(msg),
    triggerClose:   (code = 1000, reason = '') => onClose(code, reason),
    sentMessages,
  };
}

test.describe('websocket.utils › MockWebSocketServer (connected)', () => {

  test('isConnected is true after a client connects', async () => {
    await allure.allureId('UNIT-WS-007');
    const server = new MockWebSocketServer('wss://example.com');
    simulateConnection(server);
    // Small tick to let the setup() Promise resolve
    await new Promise((r) => setTimeout(r, 0));
    expect(server.isConnected).toBe(true);
  });

  test('totalConnections increments after each connection', async () => {
    await allure.allureId('UNIT-WS-008');
    const server = new MockWebSocketServer('wss://example.com');
    simulateConnection(server);
    await new Promise((r) => setTimeout(r, 0));
    expect(server.totalConnections).toBe(1);
  });

  test('push sends the message to the client', async () => {
    await allure.allureId('UNIT-WS-009');
    const server = new MockWebSocketServer('wss://example.com');
    const { sentMessages } = simulateConnection(server);
    await new Promise((r) => setTimeout(r, 0));
    server.push('hello from server');
    expect(sentMessages).toContain('hello from server');
  });

  test('pushJSON sends a JSON-serialized string', async () => {
    await allure.allureId('UNIT-WS-010');
    const server = new MockWebSocketServer('wss://example.com');
    const { sentMessages } = simulateConnection(server);
    await new Promise((r) => setTimeout(r, 0));
    server.pushJSON({ type: 'price-update', price: 9.99 });
    expect(sentMessages).toHaveLength(1);
    expect(JSON.parse(sentMessages[0] as string)).toEqual({ type: 'price-update', price: 9.99 });
  });

  test('incoming message is appended to receivedMessages', async () => {
    await allure.allureId('UNIT-WS-011');
    const server = new MockWebSocketServer('wss://example.com');
    const { triggerMessage } = simulateConnection(server);
    await new Promise((r) => setTimeout(r, 0));
    triggerMessage('ping');
    expect(server.receivedMessages).toContain('ping');
  });
});

// ── MockWebSocketServer — waitForMessage ──────────────────────────────────────
test.describe('websocket.utils › MockWebSocketServer.waitForMessage', () => {

  test('resolves immediately when a message is already in the pending buffer', async () => {
    await allure.allureId('UNIT-WS-012');
    const server = new MockWebSocketServer('wss://example.com');
    const { triggerMessage } = simulateConnection(server);
    await new Promise((r) => setTimeout(r, 0));

    // Message arrives before waitForMessage is called
    triggerMessage('early-message');

    const msg = await server.waitForMessage(1_000);
    expect(msg).toBe('early-message');
  });

  test('resolves when a message arrives after waitForMessage is called', async () => {
    await allure.allureId('UNIT-WS-013');
    const server = new MockWebSocketServer('wss://example.com');
    const { triggerMessage } = simulateConnection(server);
    await new Promise((r) => setTimeout(r, 0));

    const waiting = server.waitForMessage(1_000);
    triggerMessage('late-message');

    expect(await waiting).toBe('late-message');
  });

  test('rejects after the specified timeout if no message arrives', async () => {
    await allure.allureId('UNIT-WS-014');
    const server = new MockWebSocketServer('wss://example.com');
    await expect(server.waitForMessage(50)).rejects.toThrow(/timed out/i);
  });
});

// ── MockWebSocketServer — waitForConnection ───────────────────────────────────
test.describe('websocket.utils › MockWebSocketServer.waitForConnection', () => {

  test('resolves immediately when already connected', async () => {
    await allure.allureId('UNIT-WS-015');
    const server = new MockWebSocketServer('wss://example.com');
    simulateConnection(server);
    await new Promise((r) => setTimeout(r, 0));
    await expect(server.waitForConnection(1_000)).resolves.toBeUndefined();
  });

  test('rejects after timeout when no client connects', async () => {
    await allure.allureId('UNIT-WS-016');
    const server = new MockWebSocketServer('wss://example.com');
    await expect(server.waitForConnection(50)).rejects.toThrow(/timed out/i);
  });
});

// ── startLocalEchoServer ──────────────────────────────────────────────────────
test.describe('websocket.utils › startLocalEchoServer', () => {

  test('returns an object with url and pageUrl properties', async () => {
    await allure.allureId('UNIT-WS-017');
    const echoServer = await startLocalEchoServer();
    try {
      expect(echoServer).toHaveProperty('url');
      expect(echoServer).toHaveProperty('pageUrl');
    } finally {
      await echoServer.close();
    }
  });

  test('url starts with ws://127.0.0.1:', async () => {
    await allure.allureId('UNIT-WS-018');
    const echoServer = await startLocalEchoServer();
    try {
      expect(echoServer.url).toMatch(/^ws:\/\/127\.0\.0\.1:\d+/);
    } finally {
      await echoServer.close();
    }
  });

  test('pageUrl starts with http://127.0.0.1:', async () => {
    await allure.allureId('UNIT-WS-019');
    const echoServer = await startLocalEchoServer();
    try {
      expect(echoServer.pageUrl).toMatch(/^http:\/\/127\.0\.0\.1:\d+/);
    } finally {
      await echoServer.close();
    }
  });

  test('url and pageUrl share the same port', async () => {
    await allure.allureId('UNIT-WS-020');
    const echoServer = await startLocalEchoServer();
    try {
      const wsPort   = echoServer.url.match(/:(\d+)/)?.[1];
      const httpPort = echoServer.pageUrl.match(/:(\d+)/)?.[1];
      expect(wsPort).toBe(httpPort);
    } finally {
      await echoServer.close();
    }
  });

  test('close() resolves without error', async () => {
    await allure.allureId('UNIT-WS-021');
    const echoServer = await startLocalEchoServer();
    await expect(echoServer.close()).resolves.toBeUndefined();
  });

  test('close() is idempotent (can be called twice safely)', async () => {
    await allure.allureId('UNIT-WS-022');
    const echoServer = await startLocalEchoServer();
    await echoServer.close();
    await expect(echoServer.close()).resolves.toBeUndefined();
  });

  test('each call returns a server on a different port', async () => {
    await allure.allureId('UNIT-WS-023');
    const server1 = await startLocalEchoServer();
    const server2 = await startLocalEchoServer();
    try {
      expect(server1.url).not.toBe(server2.url);
    } finally {
      await server1.close();
      await server2.close();
    }
  });
});
