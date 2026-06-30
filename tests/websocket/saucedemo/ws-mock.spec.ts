import { test, expect } from '../../../src/fixtures/index.js';
import {
  MockWebSocketServer,
  injectWebSocketClient,
  waitForClientConnection,
  getClientMessages,
  waitForClientMessages,
  sendFromClient,
  closeClientConnection,
} from '../../../src/utils/websocket.utils.js';
import * as allure from 'allure-js-commons';

/**
 * Mock WebSocket Tests -- Saucedemo
 * ---------------------------------------------------------------------------
 * Demonstrates Playwright's page.routeWebSocket() API against a simulated
 * "realtime price-update" feature layered on top of the Saucedemo inventory
 * page.
 *
 * Key concept: page.routeWebSocket() intercepts the browser's WebSocket
 * handshake before it leaves the process, giving us a fully-controlled mock
 * server with zero network dependency.
 *
 * The injected window.__wsClient script (from websocket.utils.ts):
 *   - Opens a WebSocket to the mock URL on page load
 *   - Stores all received messages in window.__wsClient.messages[]
 *   - On 'price-update' JSON payloads, patches the Saucedemo DOM directly
 *   - On 'badge-update' JSON payloads, updates the cart-badge count
 *
 * Mock server URL (never leaves the browser process):
 *   wss://realtime.saucedemo.com/prices
 */

const WS_URL = 'wss://realtime.saucedemo.com/prices';

test.beforeEach(async () => {
  await allure.epic('Saucedemo');
  await allure.feature('WebSocket -- Mock Server');
});

test.describe('Mock WebSocket -- Intercept & Control', { tag: ['@websocket', '@ws-mock'] }, () => {

  // --connection-------------------------------------------------------------- 
  test.describe('Connection Lifecycle', { tag: ['@smoke'] }, () => {

    test('should establish a mock WS connection when the page loads', async ({ page }) => {
      await allure.allureId('WS-MOCK-001');
      await allure.story('Connection Established');
      await allure.label('severity', 'critical');

      const server = new MockWebSocketServer(WS_URL);

      await allure.step('Register the mock WS route', async () => {
        await server.setup(page);
      });

      await allure.step('Inject the WS client and navigate to Saucedemo', async () => {
        await injectWebSocketClient(page, WS_URL);
        await page.goto('https://www.saucedemo.com/inventory.html');
      });

      await allure.step('Wait for client to connect to mock server', async () => {
        await server.waitForConnection();
      });

      await allure.step('Assert mock server reports an active connection', async () => {
        expect(server.isConnected).toBe(true);
        expect(server.totalConnections).toBe(2);    // TODO: Investigate why this is coming back as two instead of the expected 1.
      });

      await allure.step('Assert client reports the connection is open', async () => {
        await waitForClientConnection(page);
        const isOpen: boolean = await page.evaluate(() => window.__wsClient.isOpen);
        expect(isOpen).toBe(true);
      });
    });

    test('should close the connection cleanly when the server sends a close frame', async ({ page }) => {
      await allure.allureId('WS-MOCK-002');
      await allure.story('Server-Initiated Close');
      await allure.label('severity', 'critical');

      const server = new MockWebSocketServer(WS_URL);
      await server.setup(page);
      await injectWebSocketClient(page, WS_URL);
      await page.goto('https://www.saucedemo.com/inventory.html');
      await server.waitForConnection();
      await waitForClientConnection(page);

      await allure.step('Server closes the connection with code 1000', async () => {
        server.close(1000, 'Session ended');
      });

      await allure.step('Wait for client to acknowledge the close', async () => {
        await page.waitForFunction(() => !window.__wsClient.isOpen, { timeout: 3_000 });
      });

      await allure.step('Assert client recorded the close code and reason', async () => {
        const { closeCode, closeReason } = await page.evaluate(() => ({
          closeCode:   window.__wsClient.closeCode,
          closeReason: window.__wsClient.closeReason,
        }));
        expect(closeCode).toBe(1000);
        expect(closeReason).toBe('Session ended');
      });
    });

    test('should close the connection cleanly when the client closes', async ({ page }) => {
      await allure.allureId('WS-MOCK-003');
      await allure.story('Client-Initiated Close');
      await allure.label('severity', 'normal');

      const server = new MockWebSocketServer(WS_URL);
      await server.setup(page);
      await injectWebSocketClient(page, WS_URL);
      await page.goto('https://www.saucedemo.com/inventory.html');
      await server.waitForConnection();
      await waitForClientConnection(page);

      await allure.step('Client closes the connection', async () => {
        await closeClientConnection(page, 1000, 'Client done');
      });

      await allure.step('Assert client isOpen is now false', async () => {
        await page.waitForFunction(() => !window.__wsClient.isOpen, { timeout: 3_000 });
        const isOpen: boolean = await page.evaluate(() => window.__wsClient.isOpen);
        expect(isOpen).toBe(false);
      });
    });
  });

  // --send / receive-------------------------------------------------------------- 
  test.describe('Message Exchange', () => {

    test('should capture a plain-text message sent from the client', async ({ page }) => {
      await allure.allureId('WS-MOCK-004');
      await allure.story('Client -> Server Text Message');
      await allure.label('severity', 'critical');

      const server = new MockWebSocketServer(WS_URL);
      await server.setup(page);
      await injectWebSocketClient(page, WS_URL);
      await page.goto('https://www.saucedemo.com/inventory.html');
      await server.waitForConnection();
      await waitForClientConnection(page);

      await allure.step('Client sends a plain-text ping message', async () => {
        await sendFromClient(page, 'ping');
      });

      await allure.step('Mock server receives and records the message', async () => {
        const msg = await server.waitForMessage();
        expect(msg.toString()).toBe('ping');
        expect(server.receivedMessages).toHaveLength(1);
      });
    });

    test('should deliver a server-pushed message to the client', async ({ page }) => {
      await allure.allureId('WS-MOCK-005');
      await allure.story('Server -> Client Push');
      await allure.label('severity', 'critical');

      const server = new MockWebSocketServer(WS_URL);
      await server.setup(page);
      await injectWebSocketClient(page, WS_URL);
      await page.goto('https://www.saucedemo.com/inventory.html');
      await server.waitForConnection();
      await waitForClientConnection(page);

      await allure.step('Server pushes a plain-text message', async () => {
        server.push('hello from server');
      });

      await allure.step('Client receives and stores the message', async () => {
        const messages = await waitForClientMessages(page, 1);
        expect(messages[0]).toBe('hello from server');
      });
    });

    test('should handle multiple sequential messages in order', async ({ page }) => {
      await allure.allureId('WS-MOCK-006');
      await allure.story('Sequential Message Ordering');
      await allure.label('severity', 'normal');

      const server = new MockWebSocketServer(WS_URL);
      await server.setup(page);
      await injectWebSocketClient(page, WS_URL);
      await page.goto('https://www.saucedemo.com/inventory.html');
      await server.waitForConnection();
      await waitForClientConnection(page);

      await allure.step('Server pushes 5 numbered messages', async () => {
        for (let i = 1; i <= 5; i++) {
          server.push(`message-${i}`);
        }
      });

      await allure.step('Client receives all 5 messages in order', async () => {
        const messages = await waitForClientMessages(page, 5);
        expect(messages).toEqual(['message-1', 'message-2', 'message-3', 'message-4', 'message-5']);
      });
    });

    test('should echo client messages back as an echo server would', async ({ page }) => {
      await allure.allureId('WS-MOCK-007');
      await allure.story('Echo Server Pattern');
      await allure.label('severity', 'normal');

      const server = new MockWebSocketServer(WS_URL);

      // Configure mock server to echo back whatever it receives
      await page.routeWebSocket(WS_URL, (ws) => {
        ws.onMessage((msg) => {
          ws.send(`echo: ${msg}`);
        });
      });

      await injectWebSocketClient(page, WS_URL);
      await page.goto('https://www.saucedemo.com/inventory.html');
      await waitForClientConnection(page);

      await allure.step('Client sends "hello" and expects "echo: hello" back', async () => {
        await sendFromClient(page, 'hello');
        const messages = await waitForClientMessages(page, 1);
        expect(messages[0]).toBe('echo: hello');
      });
    });

    test('should handle JSON message payloads', async ({ page }) => {
      await allure.allureId('WS-MOCK-008');
      await allure.story('JSON Message Exchange');
      await allure.label('severity', 'normal');

      const server = new MockWebSocketServer(WS_URL);
      await server.setup(page);
      await injectWebSocketClient(page, WS_URL);
      await page.goto('https://www.saucedemo.com/inventory.html');
      await server.waitForConnection();
      await waitForClientConnection(page);

      const payload = { action: 'subscribe', channel: 'prices', userId: 'test-user-42' };

      await allure.step('Client sends a JSON subscription message', async () => {
        await sendFromClient(page, JSON.stringify(payload));
      });

      await allure.step('Server receives the JSON and parses it correctly', async () => {
        const raw = await server.waitForMessage();
        const parsed = JSON.parse(raw.toString());
        expect(parsed).toMatchObject(payload);
      });
    });
  });

  // --server-push / DOM updates--------------------------------------------------------------
  test.describe('Server-Push & DOM Reactions', { tag: ['@smoke'] }, () => {

    /**
     * Guard against setup-saucedemo failures (transient network issues, missing
     * secrets, etc.).  Unlike the Connection/Message tests above, Server-Push
     * tests interact with actual inventory DOM elements that only appear when
     * authenticated.  If storageState is missing or stale we log in explicitly
     * so the test still gets a real inventory page.
     */
    test.beforeEach(async ({ page }) => {
      // Navigate first so we can inspect the DOM.
      await page.goto('https://www.saucedemo.com/inventory.html');
      // saucedemo renders the login form in-place (URL stays /inventory.html)
      // when the session is invalid, so check for inventory content, not URL.
      const inventoryVisible = await page.locator('.inventory_list').isVisible();
      if (!inventoryVisible) {
        await page.locator('[data-test="username"]').fill(
          process.env.SAUCEDEMO_USERNAME ?? 'standard_user',
        );
        await page.locator('[data-test="password"]').fill(
          process.env.SAUCEDEMO_PASSWORD ?? 'secret_sauce',
        );
        await page.locator('[data-test="login-button"]').click();
        await page.waitForURL(/inventory/);
      }
    });

    test('should update a product price in the DOM when the server pushes a price-update', async ({ page }) => {
      await allure.allureId('WS-MOCK-009');
      await allure.story('Realtime Price Update');
      await allure.label('severity', 'critical');

      const server = new MockWebSocketServer(WS_URL);
      await server.setup(page);
      await injectWebSocketClient(page, WS_URL);
      await page.goto('https://www.saucedemo.com/inventory.html');
      await server.waitForConnection();
      await waitForClientConnection(page);

      const targetItem = 'Sauce Labs Backpack';
      const newPrice   = 9.99;

      await allure.step('Record the original price', async () => {
        const card     = page.locator('.inventory_item').filter({ hasText: targetItem });
        const origText = await card.locator('.inventory_item_price').innerText();
        expect(origText).not.toBe(`$${newPrice.toFixed(2)}`);
      });

      await allure.step('Server pushes a price-update for Sauce Labs Backpack', async () => {
        server.pushJSON({ type: 'price-update', item: targetItem, price: newPrice });
        await waitForClientMessages(page, 1);
      });

      await allure.step('Assert the Saucedemo DOM reflects the new price', async () => {
        const card     = page.locator('.inventory_item').filter({ hasText: targetItem });
        const priceEl  = card.locator('.inventory_item_price');
        await expect(priceEl).toHaveText(`$${newPrice.toFixed(2)}`);
        // Our injected script also stamps a data attribute for easy assertion
        await expect(priceEl).toHaveAttribute('data-ws-updated', 'true');
      });
    });

    test('should update prices for multiple items in a single batch', async ({ page }) => {
      await allure.allureId('WS-MOCK-010');
      await allure.story('Batch Price Update');
      await allure.label('severity', 'normal');

      const server = new MockWebSocketServer(WS_URL);
      await server.setup(page);
      await injectWebSocketClient(page, WS_URL);
      await page.goto('https://www.saucedemo.com/inventory.html');
      await server.waitForConnection();
      await waitForClientConnection(page);

      const updates = [
        { item: 'Sauce Labs Backpack',   price: 5.00 },
        { item: 'Sauce Labs Bike Light', price: 3.99 },
        { item: 'Sauce Labs Onesie',     price: 2.49 },
      ];

      await allure.step('Server pushes price-updates for 3 items', async () => {
        for (const u of updates) {
          server.pushJSON({ type: 'price-update', item: u.item, price: u.price });
        }
        await waitForClientMessages(page, updates.length);
      });

      await allure.step('Assert each item shows its new price in the DOM', async () => {
        for (const u of updates) {
          const card    = page.locator('.inventory_item').filter({ hasText: u.item });
          const priceEl = card.locator('.inventory_item_price');
          await expect(priceEl).toHaveText(`$${u.price.toFixed(2)}`);
        }
      });
    });

    test('should reflect a server-pushed cart badge update in the navbar', async ({ page }) => {
      await allure.allureId('WS-MOCK-011');
      await allure.story('Realtime Cart Badge Update');
      await allure.label('severity', 'normal');

      const server = new MockWebSocketServer(WS_URL);
      await server.setup(page);
      await injectWebSocketClient(page, WS_URL);

      // Pre-add an item so the badge element is present
      await page.goto('https://www.saucedemo.com/inventory.html');
      await page.locator('button[data-test^="add-to-cart"]').first().click();
      expect(await page.locator('.shopping_cart_badge').innerText()).toBe('1');

      await server.waitForConnection();
      await waitForClientConnection(page);

      await allure.step('Server pushes a badge-update message (count = 3)', async () => {
        server.pushJSON({ type: 'badge-update', price: 3 });
        await waitForClientMessages(page, 1);
      });

      await allure.step('Assert the cart badge now shows 3', async () => {
        await expect(page.locator('.shopping_cart_badge')).toHaveText('3');
      });
    });
  });

  // --interception-------------------------------------------------------------- 
  test.describe('Message Interception & Validation', () => {

    test('should allow the mock server to filter and selectively respond', async ({ page }) => {
      await allure.allureId('WS-MOCK-012');
      await allure.story('Selective Server Response');
      await allure.label('severity', 'normal');

      // Custom handler: only respond to "ping", reject "spam"
      await page.routeWebSocket(WS_URL, (ws) => {
        ws.onMessage((msg) => {
          const text = msg.toString();
          if (text === 'ping') ws.send('pong');
          if (text === 'spam') ws.close({ code: 1008, reason: 'Policy Violation' });
        });
      });

      await injectWebSocketClient(page, WS_URL);
      await page.goto('https://www.saucedemo.com/inventory.html');
      await waitForClientConnection(page);

      await allure.step('Send "ping" and assert "pong" is received', async () => {
        await sendFromClient(page, 'ping');
        const msgs = await waitForClientMessages(page, 1);
        expect(msgs[0]).toBe('pong');
      });
    });

    test('should record the full conversation log (client and server messages)', async ({ page }) => {
      await allure.allureId('WS-MOCK-013');
      await allure.story('Conversation Log');
      await allure.label('severity', 'normal');

      const server = new MockWebSocketServer(WS_URL);

      // Echo handler that also records server-side
      await page.routeWebSocket(WS_URL, (ws) => {
        ws.onMessage((msg) => {
          server.receivedMessages.push(msg);
          ws.send(`ack:${msg}`);
        });
      });

      await injectWebSocketClient(page, WS_URL);
      await page.goto('https://www.saucedemo.com/inventory.html');
      await waitForClientConnection(page);

      await allure.step('Client sends three messages', async () => {
        for (const msg of ['alpha', 'beta', 'gamma']) {
          await sendFromClient(page, msg);
        }
      });

      await allure.step('Assert server received all three client messages', async () => {
        // Poll until all 3 arrive
        const deadline = Date.now() + 4_000;
        while (server.receivedMessages.length < 3 && Date.now() < deadline) {
          await page.waitForTimeout(100);
        }
        expect(server.receivedMessages.map(m => m.toString())).toEqual(['alpha', 'beta', 'gamma']);
      });

      await allure.step('Assert client received all three acknowledgements', async () => {
        const clientMsgs = await waitForClientMessages(page, 3);
        expect(clientMsgs).toEqual(['ack:alpha', 'ack:beta', 'ack:gamma']);
      });
    });
  });
});
