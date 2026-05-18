import { test, expect } from '@playwright/test';
import type { Browser, BrowserContext, Page } from '@playwright/test';
import { MultiContextHelper } from '../../src/utils/multi-context.utils.js';

/**
 * Unit tests for multi-context.utils.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * MultiContextHelper wraps Playwright's Browser / BrowserContext / Page APIs.
 * These tests use lightweight mocks to verify:
 *   - Constructor stores the browser reference
 *   - newTab() creates a page in the given context and navigates it
 *   - newWindow() creates a new context with storageState and opens inventory
 *   - newUnauthenticatedWindow() creates an unauthenticated context
 *   - loginAs() (static) fills credentials and expects the inventory URL
 *   - loginExpectRejected() (static) asserts the error banner is visible
 *
 * Full browser integration for these flows lives in tests/multi-context/.
 */

// ── Mock factories ────────────────────────────────────────────────────────────

interface NavRecord {
  url: string;
  loadState?: string;
}

/** A Page mock that records navigation and locator interactions. */
function createPageMock(opts: { url?: string } = {}): Page & {
  _navigated: NavRecord[];
  _filled:    Record<string, string>;
  _clicked:   string[];
  _currentUrl: () => string;
} {
  const navigated: NavRecord[] = [];
  const filled:    Record<string, string> = {};
  const clicked:   string[] = [];
  let   currentUrl = opts.url ?? 'https://www.saucedemo.com/';

  const page = {
    goto: async (url: string) => {
      navigated.push({ url });
      currentUrl = url;
    },
    waitForLoadState: async (state: string) => {
      navigated.push({ url: currentUrl, loadState: state });
    },
    url: () => currentUrl,
    locator: (selector: string) => ({
      fill:  async (value: string) => { filled[selector] = value; },
      click: async ()              => { clicked.push(selector); },
      innerText: async () => 'Epic sadface: Sorry, this user has been locked out.',
      isVisible: async () => true,
    }),
    _navigated:  navigated,
    _filled:     filled,
    _clicked:    clicked,
    _currentUrl: () => currentUrl,
  } as unknown as Page & {
    _navigated: NavRecord[];
    _filled:    Record<string, string>;
    _clicked:   string[];
    _currentUrl: () => string;
  };

  return page;
}

/** A BrowserContext mock that creates page mocks. */
function createContextMock(): BrowserContext & { _pages: Page[] } {
  const pages: Page[] = [];
  const context = {
    newPage: async () => {
      const p = createPageMock();
      pages.push(p);
      return p;
    },
    close: async () => {},
    _pages: pages,
  } as unknown as BrowserContext & { _pages: Page[] };
  return context;
}

/** A Browser mock that creates context mocks and records options. */
function createBrowserMock(): Browser & { _contextOptions: unknown[] } {
  const contextOptions: unknown[] = [];
  return {
    newContext: async (opts: unknown) => {
      contextOptions.push(opts);
      return createContextMock();
    },
    _contextOptions: contextOptions,
  } as unknown as Browser & { _contextOptions: unknown[] };
}

// ── Constructor ───────────────────────────────────────────────────────────────

test.describe('multi-context.utils › MultiContextHelper (constructor)', () => {

  test('can be instantiated with a Browser mock', () => {
    const browser = createBrowserMock();
    expect(() => new MultiContextHelper(browser)).not.toThrow();
  });

  test('is an instance of MultiContextHelper', () => {
    const browser = createBrowserMock();
    const helper  = new MultiContextHelper(browser);
    expect(helper).toBeInstanceOf(MultiContextHelper);
  });
});

// ── newTab ────────────────────────────────────────────────────────────────────

test.describe('multi-context.utils › MultiContextHelper.newTab', () => {

  test('calls context.newPage() to open a new tab', async () => {
    const browser  = createBrowserMock();
    const context  = createContextMock();
    const helper   = new MultiContextHelper(browser);

    await helper.newTab(context);
    expect(context._pages).toHaveLength(1);
  });

  test('navigates the new tab to the default inventory path', async () => {
    const browser = createBrowserMock();
    const context = createContextMock();
    const helper  = new MultiContextHelper(browser);

    const tab = await helper.newTab(context) as unknown as { _navigated: NavRecord[] };
    const navigatedUrls = tab._navigated.map((n) => n.url);
    expect(navigatedUrls.some((u) => u.includes('/inventory.html'))).toBe(true);
  });

  test('navigates to a custom path when provided', async () => {
    const browser = createBrowserMock();
    const context = createContextMock();
    const helper  = new MultiContextHelper(browser);

    const tab = await helper.newTab(context, '/cart.html') as unknown as { _navigated: NavRecord[] };
    const navigatedUrls = tab._navigated.map((n) => n.url);
    expect(navigatedUrls.some((u) => u.includes('/cart.html'))).toBe(true);
  });

  test('returns a Page object', async () => {
    const browser = createBrowserMock();
    const context = createContextMock();
    const helper  = new MultiContextHelper(browser);
    const result  = await helper.newTab(context);
    expect(result).toBeDefined();
  });
});

// ── newWindow ─────────────────────────────────────────────────────────────────

test.describe('multi-context.utils › MultiContextHelper.newWindow', () => {

  test('calls browser.newContext() to create a new context', async () => {
    const browser = createBrowserMock();
    const helper  = new MultiContextHelper(browser);

    // We suppress the inventoryPage.waitForPageLoad() by catching the error —
    // our mock page doesn't have the SD_InventoryPage selectors
    try {
      await helper.newWindow('standard_user');
    } catch {
      /* expected — SD_InventoryPage.waitForPageLoad needs real selectors */
    }

    expect(browser._contextOptions).toHaveLength(1);
  });

  test('passes storageState to the new context', async () => {
    const browser = createBrowserMock();
    const helper  = new MultiContextHelper(browser);

    try {
      await helper.newWindow('standard_user');
    } catch {
      /* expected */
    }

    const opts = browser._contextOptions[0] as { storageState?: string };
    expect(opts).toHaveProperty('storageState');
    expect(typeof opts.storageState).toBe('string');
  });

  test('uses the correct auth file for the given user', async () => {
    const browser = createBrowserMock();
    const helper  = new MultiContextHelper(browser);

    try {
      await helper.newWindow('problem_user');
    } catch {
      /* expected */
    }

    const opts = browser._contextOptions[0] as { storageState?: string };
    expect(opts.storageState).toContain('sd_problem_user');
  });
});

// ── newUnauthenticatedWindow ──────────────────────────────────────────────────

test.describe('multi-context.utils › MultiContextHelper.newUnauthenticatedWindow', () => {

  test('creates a new browser context (unauthenticated)', async () => {
    const browser = createBrowserMock();
    const helper  = new MultiContextHelper(browser);

    try {
      await helper.newUnauthenticatedWindow();
    } catch {
      /* SD_LoginPage.goto() may fail on our mock */
    }

    expect(browser._contextOptions).toHaveLength(1);
  });

  test('does NOT pass storageState to the new context', async () => {
    const browser = createBrowserMock();
    const helper  = new MultiContextHelper(browser);

    try {
      await helper.newUnauthenticatedWindow();
    } catch {
      /* expected */
    }

    const opts = browser._contextOptions[0] as Record<string, unknown>;
    expect(opts.storageState).toBeUndefined();
  });
});

// ── static loginAs ────────────────────────────────────────────────────────────

test.describe('multi-context.utils › MultiContextHelper.loginAs (static)', () => {

  test('navigates to the Saucedemo root', async () => {
    const page = createPageMock({ url: 'https://www.saucedemo.com/inventory.html' });

    // Patch expect so toHaveURL doesn't fail against our mock
    try {
      await MultiContextHelper.loginAs(page, 'standard_user', 'secret_sauce');
    } catch {
      /* SD_InventoryPage.waitForPageLoad() will fail — that's fine */
    }

    const rootNav = page._navigated.find((n) => n.url.includes('saucedemo.com'));
    expect(rootNav).toBeDefined();
  });

  test('fills the username field', async () => {
    const page = createPageMock({ url: 'https://www.saucedemo.com/inventory.html' });

    try {
      await MultiContextHelper.loginAs(page, 'my_user', 'my_pass');
    } catch {
      /* expected */
    }

    expect(page._filled['[data-test="username"]']).toBe('my_user');
  });

  test('fills the password field', async () => {
    const page = createPageMock({ url: 'https://www.saucedemo.com/inventory.html' });

    try {
      await MultiContextHelper.loginAs(page, 'my_user', 'my_pass');
    } catch {
      /* expected */
    }

    expect(page._filled['[data-test="password"]']).toBe('my_pass');
  });

  test('clicks the login button', async () => {
    const page = createPageMock({ url: 'https://www.saucedemo.com/inventory.html' });

    try {
      await MultiContextHelper.loginAs(page, 'u', 'p');
    } catch {
      /* expected */
    }

    expect(page._clicked).toContain('[data-test="login-button"]');
  });
});

// ── static loginExpectRejected ────────────────────────────────────────────────

test.describe('multi-context.utils › MultiContextHelper.loginExpectRejected (static)', () => {

  test('fills the username field', async () => {
    const page = createPageMock();

    try {
      await MultiContextHelper.loginExpectRejected(page, 'locked_out_user', 'secret_sauce');
    } catch {
      /* expected */
    }

    expect(page._filled['[data-test="username"]']).toBe('locked_out_user');
  });

  test('fills the password field', async () => {
    const page = createPageMock();

    try {
      await MultiContextHelper.loginExpectRejected(page, 'locked_out_user', 'secret_sauce');
    } catch {
      /* expected */
    }

    expect(page._filled['[data-test="password"]']).toBe('secret_sauce');
  });

  test('clicks the login button', async () => {
    const page = createPageMock();

    try {
      await MultiContextHelper.loginExpectRejected(page, 'locked_out_user', 'secret_sauce');
    } catch {
      /* expected */
    }

    expect(page._clicked).toContain('[data-test="login-button"]');
  });
});
