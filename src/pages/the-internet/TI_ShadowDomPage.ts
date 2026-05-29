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
  readonly template: Locator;
  readonly shadowTemplate: Locator;

  constructor(page: Page) {
    super(page);
    this.title = page.getByRole('heading', { name: 'Simple template' });
    this.template = page.locator('my-paragraph');
    this.shadowTemplate = page.getByText('My default text');
  }

  // ── Navigation ──────────────────────────────────────────────────────────────
  async goto(): Promise<void> {
    await this.page.goto('/shadowdom');
    await this.waitForPageLoad();
  }

  async waitForPageLoad(): Promise<void> {
    await this.title.waitFor({ state: 'visible' });
    await this.template.first().waitFor({ state: 'visible' });
    // Wait for the custom element to be defined and its shadow root attached.
    // This is important in webkit where custom element upgrades can be slower.
    await this.page.waitForFunction(
      () => {
        const host = document.querySelector('my-paragraph');
        return host != null && host.shadowRoot != null;
      },
      { timeout: 10000 }
    );
  }

  // ── Queries ─────────────────────────────────────────────────────────────────
  async getTemplateInputValues(): Promise<Locator[]> {
    return this.shadowTemplate.all();
  }

  // ── Assertions ──────────────────────────────────────────────────────────────
  async assertOnPage(): Promise<void> {
    await expect(this.page).toHaveURL(/\/shadowdom/);
  }

  async assertTemplateVisible(): Promise<void> {
    await expect(this.template.first()).toBeVisible();
  }

  async assertShadowRootPresent(): Promise<void> {
    expect(this.shadowTemplate.first()).toBeAttached();
  }
}
