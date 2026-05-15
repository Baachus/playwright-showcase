import { Page, Locator, expect } from '@playwright/test';

/**
 * BaseComponent
 * ---------------------------------------------------------------------------
 * Abstract base class for all Component Object Models.
 *
 * Mirrors the BasePage pattern but scoped to a discrete UI component rather
 * than a full page. Every child component receives:
 *   - page: the Playwright Page, for keyboard/global interactions
 *   - root: the Locator that wraps the component's DOM root, so that all
 *            child locators are automatically scoped to that subtree.
 */
export abstract class BaseComponent {
  protected readonly page: Page;
  readonly root: Locator;

  constructor(page: Page, root: Locator) {
    this.page = page;
    this.root = root;
  }

  // -- Lifecycle ---------------------------------------------------------------

  /**
   * Wait until the component's root element is visible in the DOM.
   * Subclasses may override to wait for a more meaningful "ready" signal.
   */
  async waitForVisible(): Promise<void> {
    await this.root.waitFor({ state: 'visible' });
  }

  // -- State helpers -----------------------------------------------------------

  /** Returns true when the component root is currently visible. */
  async isVisible(): Promise<boolean> {
    return this.root.isVisible();
  }

  /** Returns true when the component root is present in the DOM (even if hidden). */
  async isAttached(): Promise<boolean> {
    return this.root.isVisible({ timeout: 0 }).then(() => true).catch(() => false);
  }

  // -- Shared assertions -------------------------------------------------------

  /** Assert that the component root is visible. */
  async assertVisible(): Promise<void> {
    await expect(this.root).toBeVisible();
  }

  /** Assert that the component root is hidden. */
  async assertHidden(): Promise<void> {
    await expect(this.root).toBeHidden();
  }

  /**
   * Assert that a text string appears somewhere within the component.
   */
  async assertContainsText(text: string | RegExp): Promise<void> {
    await expect(this.root).toContainText(text);
  }

  /**
   * Assert that a locator scoped to this component has a specific ARIA role
   * and is visible.
   */
  async assertRoleVisible(
    role: Parameters<Locator['getByRole']>[0],
    options?: Parameters<Locator['getByRole']>[1],
  ): Promise<void> {
    await expect(this.root.getByRole(role, options)).toBeVisible();
  }
}
