import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from '../BasePage.js';

/**
 * TI_ShadowDomPage
 * ─────────────────────────────────────────────────────────────────────────────
 * Represents the Shadow DOM page on the-internet.herokuapp.com (/shadowdom).
 * Uses a custom <guid-generator> element with Shadow DOM containing sl-input
 * elements and a sl-copy-button.
 */
export class TI_ShadowDomPage extends BasePage {
  // ── Locators ────────────────────────────────────────────────────────────────
  readonly title: Locator;
  readonly guidGenerator: Locator;

  constructor(page: Page) {
    super(page);
    this.title = page.getByRole('heading', { name: 'Shadow DOM' });
    this.guidGenerator = page.locator('guid-generator');
  }

  // ── Navigation ──────────────────────────────────────────────────────────────
  async goto(): Promise<void> {
    await this.page.goto('/shadowdom');
    await this.waitForPageLoad();
  }

  async waitForPageLoad(): Promise<void> {
    await this.title.waitFor({ state: 'visible' });
    await this.guidGenerator.waitFor({ state: 'visible' });
    // Wait for the custom element to be defined and its shadow root attached.
    // This is important in webkit where custom element upgrades can be slower.
    await this.page.waitForFunction(
      () => {
        const host = document.querySelector('guid-generator');
        return host != null && host.shadowRoot != null;
      },
      { timeout: 10000 }
    );
  }

  // ── Queries ─────────────────────────────────────────────────────────────────
  /**
   * Get the value of the first sl-input inside the shadow DOM via JavaScript.
   */
  async getFirstGuidValue(): Promise<string> {
    return this.page.evaluate(() => {
      const host = document.querySelector('guid-generator');
      if (!host?.shadowRoot) return '';
      const input = host.shadowRoot.querySelector('sl-input') as HTMLInputElement | null;
      return input?.value ?? '';
    });
  }

  async getGuidInputValues(): Promise<string[]> {
    return this.page.evaluate(() => {
      const host = document.querySelector('guid-generator');
      if (!host?.shadowRoot) return [];
      const inputs = host.shadowRoot.querySelectorAll('sl-input') as NodeListOf<HTMLInputElement>;
      return Array.from(inputs).map(i => i.value);
    });
  }

  // ── Assertions ──────────────────────────────────────────────────────────────
  async assertOnPage(): Promise<void> {
    await expect(this.page).toHaveURL(/\/shadowdom/);
  }

  async assertGuidGeneratorVisible(): Promise<void> {
    await expect(this.guidGenerator).toBeVisible();
  }

  async assertShadowRootPresent(): Promise<void> {
    const hasShadowRoot = await this.page.evaluate(() => {
      const host = document.querySelector('guid-generator');
      return !!host?.shadowRoot;
    });
    expect(hasShadowRoot).toBe(true);
  }
}
