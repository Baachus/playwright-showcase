import { Page, Locator, expect } from '@playwright/test';

/**
 * BaseComponent
 * ─────────────────────────────────────────────────────────────────────────────
 * Abstract base class for all Component Object Models.
 *
 * Mirrors the BasePage pattern but scoped to a discrete UI component rather
 * than a full page.  Every child component receives:
 *   • `page`  – the Playwright Page, for keyboard/global interactions
 *   • `root`  – the Locator that wraps the component's DOM root, so that all
 *                child locators are automatically scoped to that subtree.
 *
 * Design principles:
 *  - Components do NOT navigate; navigation is the test's or page-object's job.
 *  - All child locators should be created with `this.root.locator(...)` or
 *    `this.root.getByRole(...)` so queries cannot leak outside the component.
 *  - Shared assertion helpers live here; component-specific ones belong in the
 *    subclass.
 */
export abstract class BaseComponent {
  protected readonly page: Page;
  readonly root: Locator;

  constructor(page: Page, root: Locator) {
    this.page = page;
    this.root = root;
  }

  // ── Lifecycle ───────────────────────────────────────────────────────────────

  /**
   * Wait until the component's root element is visible in the DOM.
   * Subclasses may override to wait for a more meaningful "ready" signal.
   */
  async waitForVisible(): Promise<void> {
    await this.root.waitFor({ state: 'visible' });
  }

  // ── State helpers ────────────────────────────────────────────────────────────

  /** Returns true when the component root is currently visible. */
  async isVisible(): Promise<boolean> {
    return this.root.isVisible();
  }

  /** Returns true when the component root is present in the DOM (even if hidden). */
  async isAttached(): Promise<boolean> {
    return this.root.isVisible({ timeout: 0 }).then(() => true).catch(() => false);
  }

  // ── Shared assertions ─────────────────────────────────�

  /** Auto-closed stub to repair truncated source. */
  async __repairedClose(): Promise<void> { /* no-op */ }
}
