import { Page, WebSocketRoute } from '@playwright/test';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Shape stored on window.__wsClient inside the browser context. */
declare global {
  interface Window {
    __wsClient: {
      ws: WebSocket | null;
      messages: string[];
      closeCode: number | null;
      closeReason: string | null;
      isOpen: boolean;
      connect(url: string): void;
      send(message: string): void;
      close(code?: number, reason?: string): void;
    };
  }
}

// ---------------------------------------------------------------------------
// MockWebSocketServer
// ---------------------------------------------------------------------------

/**
 * MockWebSocketServer
 * ---------------------------------------------------------------------------
 * Wraps Playwright's page.routeWebSocket() to provide a controllable mock
 * WebSocket server for testing WS-dependent features without a real backend.
 *
 * Usage:
 *   const server = new MockWebSocketServer('wss://realtime.saucedemo.com/prices');
 *   await server.setup(page);
 *   // ... navigate, connect client ...
 *   server.push(JSON.stringify({ type: 'price-update', item: 'Backpack', price: 9.99 }));
 *   await server.waitForMessage();
 */
export class MockWebSocketServer {
  readonly url: string;

  /** Messages sent from the browser client to this mock server. */
  readonly receivedMessages: (string | Buffer)[] = [];

  /** Number of times a client has connected to this mock server. */
  private connectionCount = 0;

  /** The active WebSocketRoute (set when a client connects). */
  private activeRoute: WebSocketRoute | null = null;

  /** Resolvers waiting for the next incoming message. */
  private messageWaiters: Array<(msg: string | Buffer) => void> = [];

  /**
   * Messages that arrived before a waitForMessage() call was made.
   * Prevents the race condition where the client sends a message before
   * the test has called waitForMessage(), causing the waiter to never fire.
   */
  private pendingMessages: (string | Buffer)[] = [];

  /** Resolvers waiting for the next client connection. */
  private connectionWaiters: Array<() => void> = [];

  constructor(url: string) {
    this.url = url;
  }

  /**
   * Register the route handler on the given page. Must be called BEFORE the
   * page navigates and before the WS connection is opened.
   */
  async setup(page: Page): Promise<void> {
    await page.routeWebSocket(this.url, (ws: WebSocketRoute) => {
      this.activeRoute = ws;
      this.connectionCount++;

      // Notify any test waiting for a connection
      const waiter = this.connectionWaiters.shift();
      if (waiter) waiter();

      ws.onMessage((message: string | Buffer) => {
        this.receivedMessages.push(message);

        // Notify any test waiting for a message, or buffer it for the next
        // waitForMessage() call.  This prevents the race condition where the
        // client sends a message before the test has called waitForMessage(),
        // which would cause the waiter Promise to time out.
        const msgWaiter = this.messageWaiters.shift();
        if (msgWaiter) {
          msgWaiter(message);
        } else {
          this.pendingMessages.push(message);
        }
      });

      // IMPORTANT: registering onClose disables Playwright's automatic
      // close-frame forwarding (per the Playwright docs: "when onClose handler
      // is set up, the default forwarding of closure is disabled, and handler
      // should take care of it").  We must manually echo the close back so the
      // WebSocket close handshake completes on both sides.
      ws.onClose(async (code, reason) => {
        const route = this.activeRoute;
        this.activeRoute = null;
        if (route) {
          await route.close({ code, reason }).catch(() => {
            // Swallow errors when the route is already closed (e.g. the server
            // initiated the close, so the route is gone by the time onClose
            // fires for the client's answering close frame).
          });
        }
      });
    });
  }

  // -- Server -> Client ------------------------------------------------------

  /** Push a message from the mock server to the connected client. */
  push(message: string | Buffer): void {
    if (!this.activeRoute) {
      throw new Error('No active WebSocket connection. Did the client connect?');
    }
    this.activeRoute.send(message);
  }

  /** Push a JSON-serialisable object as a message. */
  pushJSON(payload: unknown): void {
    this.push(JSON.stringify(payload));
  }

  /** Close the connection from the server side. */
  async close(code = 1000, reason = 'Server closed'): Promise<void> {
    await this.activeRoute?.close({ code, reason });
  }

  // -- Queries ---------------------------------------------------------------

  /** True when a client is currently connected. */
  get isConnected(): boolean {
    return this.activeRoute !== null;
  }

  /** Total number of client connections received since setup(). */
  get totalConnections(): number {
    return this.connectionCount;
  }

  // -- Waiters ---------------------------------------------------------------

  /**
   * Wait until the next message arrives from the client (or timeout).
   *
   * If a message arrived before this call, it is returned immediately from
   * the pendingMessages buffer, preventing the race condition where the client
   * sends before the test has registered a waiter.
   */
  waitForMessage(timeoutMs = 5_000): Promise<string | Buffer> {
    if (this.pendingMessages.length > 0) {
      return Promise.resolve(this.pendingMessages.shift()!);
    }
    return new Promise<string | Buffer>((resolve, reject) => {
      const timer = setTimeout(
        () => reject(new Error('WS waitForMessage timed out after ' + timeoutMs + 'ms')),
        timeoutMs,
      );
      this.messageWaiters.push((msg) => {
        clearTimeout(timer);
        resolve(msg);
      });
    });
  }

  /** Wait until the next client connection is established. */
  waitForConnection(timeoutMs = 5_000): Promise<void> {
    if (this.isConnected) return Promise.resolve();
    return new Promise<void>((resolve, reject) => {
      const timer = setTimeout(
        () => reject(new Error('WS waitForConnection timed out after ' + timeoutMs + 'ms')),
        timeoutMs,
      );
      this.connectionWaiters.push(() => {
        clearTimeout(timer);
        resolve();
      });
    });
  }
}

// ---------------------------------------------------------------------------
// Client injection helpers
// ---------------------------------------------------------------------------

/**
 * Inject a controllable WebSocket client into the page via addInitScript.
 * The client is exposed as window.__wsClient and can be driven via page.evaluate().
 *
 * Must be called BEFORE page.goto() so the script is present on first load.
 *
 * @param page   Playwright page
 * @param wsUrl  The WebSocket URL the injected client will connect to
 */
export async function injectWebSocketClient(page: Page, wsUrl: string): Promise<void> {
  await page.addInitScript((url: string) => {
    window.__wsClient = {
      ws: null,
      messages: [],
      closeCode: null,
      closeReason: null,
      isOpen: false,

      connect(u: string) {
        const ws = new WebSocket(u);
        this.ws = ws;
        this.isOpen = false;

        ws.addEventListener('open', () => {
          this.isOpen = true;
        });

        ws.addEventListener('message', (event: MessageEvent) => {
          const data: string = event.data;
          this.messages.push(data);

          // Apply price-update messages directly to the Saucedemo DOM
          try {
            const payload = JSON.parse(data) as { type?: string; item?: string; price?: number };
            if (payload.type === 'price-update' && payload.item && payload.price !== undefined) {
              const items = document.querySelectorAll('.inventory_item');
              items.forEach((el) => {
                const nameEl = el.querySelector('.inventory_item_name');
                if (nameEl && nameEl.textContent?.trim() === payload.item) {
                  const priceEl = el.querySelector('.inventory_item_price');
                  if (priceEl) {
                    priceEl.textContent = '$' + (payload.price as number).toFixed(2);
                    priceEl.setAttribute('data-ws-updated', 'true');
                  }
                }
              });
            }

            // badge-update: update the cart badge count
            if (payload.type === 'badge-update' && typeof payload.price === 'number') {
              const badge = document.querySelector('.shopping_cart_badge');
              if (badge) badge.textContent = String(payload.price);
            }
          } catch (_) {
            // Non-JSON messages are stored as-is
          }
        });

        ws.addEventListener('close', (event: CloseEvent) => {
          this.isOpen = false;
          this.closeCode = event.code;
          this.closeReason = event.reason;
        });

        ws.addEventListener('error', () => {
          this.isOpen = false;
        });
      },

      send(message: string) {
        if (this.ws && this.isOpen) {
          this.ws.send(message);
        }
      },

      close(code = 1000, reason = '') {
        this.ws?.close(code, reason);
      },
    };

    // Auto-connect once the DOM is ready
    window.__wsClient.connect(url);
  }, wsUrl);
}

/**
 * Wait until the injected client reports an open connection.
 * Polls isOpen at 100ms intervals.
 */
export async function waitForClientConnection(page: Page, timeoutMs = 5_000): Promise<void> {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    const open: boolean = await page.evaluate(() => window.__wsClient?.isOpen ?? false);
    if (open) return;
    await page.waitForTimeout(100);
  }
  throw new Error('Client WS connection did not open within ' + timeoutMs + 'ms');
}

/**
 * Return the array of raw messages received by the injected client.
 */
export async function getClientMessages(page: Page): Promise<string[]> {
  return page.evaluate(() => window.__wsClient?.messages ?? []);
}

/**
 * Wait until the injected client has received at least count messages.
 */
export async function waitForClientMessages(
  page: Page,
  count: number,
  timeoutMs = 5_000,
): Promise<string[]> {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    const msgs = await getClientMessages(page);
    if (msgs.length >= count) return msgs;
    await page.waitForTimeout(100);
  }
  throw new Error('Client did not receive ' + count + ' message(s) within ' + timeoutMs + 'ms');
}

/**
 * Send a message from the injected client to the mock server.
 */
export async function sendFromClient(page: Page, message: string): Promise<void> {
  await page.evaluate((msg: string) => window.__wsClient?.send(msg), message);
}

/**
 * Close the client-side WebSocket connection from within the page.
 */
export async function closeClientConnection(
  page: Page,
  code = 1000,
  reason = '',
): Promise<void> {
  await page.evaluate(
    ({ c, r }: { c: number; r: string }) => window.__wsClient?.close(c, r),
    { c: code, r: reason },
  );
}
