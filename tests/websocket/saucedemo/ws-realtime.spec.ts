import { test, expect } from '../../../src/fixtures/index.js';
import * as allure from 'allure-js-commons';

/**
 * Real WebSocket Tests -- Saucedemo
 * ---------------------------------------------------------------------------
 * Tests real WebSocket connections using Playwright's built-in WS observation
 * APIs (page.on('websocket'), webSocket.on('framereceived'), etc.).
 *
 * A WebSocket connection is opened from inside the Saucedemo page context via
 * page.evaluate() and pointed at a public echo server. Playwright captures the
 * WS lifecycle events at the framework level without any mocking layer.
 *
 * Public echo server used: wss://echo.websocket.events
 *   - Echoes every frame back verbatim
 *   - Sends a welcome message on connect: "echo.websocket.events sponsored by ..."
 *   - No auth required; free tier; may occasionally be slow
 *
 * Tests in this file are tagged @ws-realtime and marked test.slow() because
 * they involve real network round-trips.
 *
 * NOTE: If the echo server is unreachable, tests will fail with a timeout.
 * Run with --project=WebSocket-Realtime to execute these in isolation.
 */

const ECHO_SERVER = 'wss://echo.websocket.events';

/** Open a real WebSocket from inside the page and return the socket handle. */
async function openRealWebSocket(page: import('@playwright/test').Page, url: string): Promise<void> {
  await page.evaluate((wsUrl: string) => {
    (window as any).__realWs = {
      ws: null as WebSocket | null,
      received: [] as string[],
      isOpen: false,
      closeCode: null as number | null,

      open(u: string) {
        return new Promise<void>((resolve, reject) => {
          const ws = new WebSocket(u);
          this.ws = ws;
          ws.addEventListener('open', () => { this.isOpen = true; resolve(); });
          ws.addEventListener('message', (e: MessageEvent) => { this.received.push(e.data as string); });
          ws.addEventListener('close', (e: CloseEvent) => { this.isOpen = false; this.closeCode = e.code; });
          ws.addEventListener('error', () => { this.isOpen = false; reject(new Error('WS error')); });
          setTimeout(() => reject(new Error('WS open timed out')), 8_000);
        });
      },

      send(msg: string) { this.ws?.send(msg); },
      close(code = 1000) { this.ws?.close(code); },
    };
    return (window as any).__realWs.open(wsUrl);
  }, url);
}

test.beforeEach(async () => {
  await allure.epic('Saucedemo');
  await allure.feature('WebSocket -- Real Server');
});

test.describe('Real WebSocket -- Echo Server', { tag: ['@websocket', '@ws-realtime'] }, () => {

  // Mark all tests in this suite as slow (real network RTT)
  test.slow();

  // ---------------------------------------------------------------- observation
  test.describe('Playwright WS Observation API', { tag: ['@smoke'] }, () => {

    test('should observe a real WS connection via page.on("websocket")', async ({ page }) => {
      await allure.story('WS Connection Observation');
      await allure.label('severity', 'critical');

      const wsEvents: string[] = [];

      await allure.step('Register Playwright WS event listener', async () => {
        page.on('websocket', (ws) => {
          wsEvents.push(`open:${ws.url()}`);
          ws.on('framereceived', ({ payload }) => wsEvents.push(`recv:${payload}`));
          ws.on('framesent',     ({ payload }) => wsEvents.push(`sent:${payload}`));
          ws.on('close',        ()            => wsEvents.push('close'));
        });
      });

      await allure.step('Navigate to Saucedemo and open a real WebSocket', async () => {
        await page.goto('https://www.saucedemo.com/inventory.html');
        await openRealWebSocket(page, ECHO_SERVER);
      });

      await allure.step('Assert Playwright observed the WS open event', async () => {
        const openEvent = wsEvents.find(e => e.startsWith('open:'));
        expect(openEvent).toBeTruthy();
        expect(openEvent).toContain('echo.websocket.events');
      });
    });

    test('should observe frames sent and received via Playwright WS events', async ({ page }) => {
      await allure.story('Frame Observation');
      await allure.label('severity', 'critical');

      const sentFrames:     string[] = [];
      const receivedFrames: string[] = [];

      page.on('websocket', (ws) => {
        ws.on('framesent',     ({ payload }) => sentFrames.push(String(payload)));
        ws.on('framereceived', ({ payload }) => receivedFrames.push(String(payload)));
      });

      await page.goto('https://www.saucedemo.com/inventory.html');
      await openRealWebSocket(page, ECHO_SERVER);

      await allure.step('Send a message and wait for the echo', async () => {
        await page.evaluate(() => (window as any).__realWs.send('playwright-observe-test'));

        // Wait for at least one non-welcome received frame containing our payload
        await page.waitForFunction(
          () => ((window as any).__realWs.received as string[]).some((m: string) => m.includes('playwright-observe-test')),
          { timeout: 8_000 },
        );
      });

      await allure.step('Assert Playwright captured both the sent and received frames', async () => {
        expect(sentFrames.some(f => f.includes('playwright-observe-test'))).toBe(true);
        expect(receivedFrames.some(f => f.includes('playwright-observe-test'))).toBe(true);
      });
    });
  });

  // ---------------------------------------------------------------- round-trip
  test.describe('Round-Trip Message Exchange', () => {

    test('should send a message and receive the echo back from the server', async ({ page }) => {
      await allure.story('Echo Round-Trip');
      await allure.label('severity', 'critical');

      await page.goto('https://www.saucedemo.com/inventory.html');
      await openRealWebSocket(page, ECHO_SERVER);

      const payload = `saucedemo-test-${Date.now()}`;

      await allure.step('Send the unique payload to the echo server', async () => {
        await page.evaluate((msg: string) => (window as any).__realWs.send(msg), payload);
      });

      await allure.step('Wait for the echoed payload to arrive', async () => {
        await page.waitForFunction(
          (p: string) => ((window as any).__realWs.received as string[]).some((m: string) => m.includes(p)),
          payload,
          { timeout: 8_000 },
        );
      });

      await allure.step('Assert the received message matches what was sent', async () => {
        const received: string[] = await page.evaluate(() => (window as any).__realWs.received);
        expect(received.some(m => m.includes(payload))).toBe(true);
      });
    });

    test('should send multiple messages and receive all echoes', async ({ page }) => {
      await allure.story('Multiple Echo Round-Trips');
      await allure.label('severity', 'normal');

      await page.goto('https://www.saucedemo.com/inventory.html');
      await openRealWebSocket(page, ECHO_SERVER);

      const messages = ['alpha', 'beta', 'gamma', 'delta'];

      await allure.step('Send all messages sequentially', async () => {
        for (const msg of messages) {
          await page.evaluate((m: string) => (window as any).__realWs.send(m), msg);
          // Brief pause to avoid frame merging
          await page.waitForTimeout(100);
        }
      });

      await allure.step('Wait for all echoes to arrive', async () => {
        await page.waitForFunction(
          (count: number) => {
            const received: string[] = (window as any).__realWs.received;
            return received.filter(m => !m.includes('echo.websocket.events')).length >= count;
          },
          messages.length,
          { timeout: 10_000 },
        );
      });

      await allure.step('Assert each sent message is reflected in the received list', async () => {
        const received: string[] = await page.evaluate(() => (window as any).__realWs.received);
        for (const msg of messages) {
          expect(received.some(r => r.includes(msg))).toBe(true);
        }
      });
    });
  });

  // ---------------------------------------------------------------- lifecycle
  test.describe('Connection Lifecycle', { tag: ['@smoke'] }, () => {

    test('should transition through open -> message -> close states', async ({ page }) => {
      await allure.story('Full Connection Lifecycle');
      await allure.label('severity', 'critical');

      const lifecycleEvents: string[] = [];

      page.on('websocket', (ws) => {
        lifecycleEvents.push('open');
        ws.on('framereceived', () => {
          if (!lifecycleEvents.includes('message')) {
            lifecycleEvents.push('message');
          }
        });
        ws.on('close', () => lifecycleEvents.push('close'));
      });

      await page.goto('https://www.saucedemo.com/inventory.html');

      await allure.step('Open real WS connection', async () => {
        await openRealWebSocket(page, ECHO_SERVER);
      });

      await allure.step('Wait for the server welcome message', async () => {
        await page.waitForFunction(
          () => ((window as any).__realWs.received as string[]).length > 0,
          { timeout: 8_000 },
        );
      });

      await allure.step('Close the connection from the client', async () => {
        await page.evaluate(() => (window as any).__realWs.close());
        await page.waitForFunction(
          () => !(window as any).__realWs.isOpen,
          { timeout: 5_000 },
        );
      });

      await allure.step('Assert all three lifecycle events were observed', async () => {
        expect(lifecycleEvents).toContain('open');
        expect(lifecycleEvents).toContain('message');
        expect(lifecycleEvents).toContain('close');
      });

      await allure.step('Assert close code is 1000 (normal closure)', async () => {
        const code: number = await page.evaluate(() => (window as any).__realWs.closeCode);
        expect(code).toBe(1000);
      });
    });

    test('should handle a graceful server close without client error', async ({ page }) => {
      await allure.story('Graceful Server Close Handling');
      await allure.label('severity', 'normal');

      await page.goto('https://www.saucedemo.com/inventory.html');
      await openRealWebSocket(page, ECHO_SERVER);

      await allure.step('Wait for connection to be fully established', async () => {
        const isOpen: boolean = await page.evaluate(() => (window as any).__realWs.isOpen);
        expect(isOpen).toBe(true);
      });

      await allure.step('Client sends a close frame', async () => {
        await page.evaluate(() => (window as any).__realWs.close(1000));
      });

      await allure.step('Connection closes cleanly -- no unhandled errors on the page', async () => {
        await page.waitForFunction(
          () => !(window as any).__realWs.isOpen,
          { timeout: 5_000 },
        );
        const code: number | null = await page.evaluate(() => (window as any).__realWs.closeCode);
        // 1000 = normal closure; some servers use 1001 (going away)
        expect([1000, 1001]).toContain(code);
      });
    });
  });

  // ---------------------------------------------------------------- concurrent
  test.describe('Concurrent Connections', () => {

    test('should support two independent real WS connections simultaneously', async ({ page }) => {
      await allure.story('Concurrent Real Connections');
      await allure.label('severity', 'normal');

      const observedUrls: string[] = [];
      page.on('websocket', (ws) => observedUrls.push(ws.url()));

      await page.goto('https://www.saucedemo.com/inventory.html');

      await allure.step('Open two separate WebSocket connections from the same page', async () => {
        // Open connection 1
        await page.evaluate((url: string) => {
          (window as any).__ws1 = new WebSocket(url);
        }, ECHO_SERVER);

        await page.waitForTimeout(500);

        // Open connection 2
        await page.evaluate((url: string) => {
          (window as any).__ws2 = new WebSocket(url);
        }, ECHO_SERVER);

        await page.waitForTimeout(500);
      });

      await allure.step('Assert Playwright observed both WS connections', async () => {
        expect(observedUrls.length).toBeGreaterThanOrEqual(2);
        expect(observedUrls.every(u => u.includes('echo.websocket.events'))).toBe(true);
      });
    });
  });
});
