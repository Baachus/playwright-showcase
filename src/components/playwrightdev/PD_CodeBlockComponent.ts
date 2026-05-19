import { Page, Locator, expect } from '@playwright/test';
import { BaseComponent } from '../BaseComponent.js';

/**
 * PD_CodeBlockComponent
 * ---------------------------------------------------------------------------
 * Represents an individual syntax-highlighted code block on a docs page.
 *
 * playwright.dev uses Docusaurus with Prism syntax highlighting. Each block
 * is a div.theme-code-block wrapper containing a pre.language-* element,
 * a copy-to-clipboard button, and (optionally) a language label tab.
 */
export class PD_CodeBlockComponent extends BaseComponent {
  readonly pre: Locator;
  readonly copyButton: Locator;

  constructor(page: Page, index = 0) {
    const root = page.locator('div.theme-code-block').nth(index);
    super(page, root);

    this.pre        = this.root.locator('pre');
    this.copyButton = this.root.locator('button[class*="copyButton"], button[title*="Copy"]');
  }

  // -- Factory -----------------------------------------------------------------
  static async all(page: Page): Promise<PD_CodeBlockComponent[]> {
    const count = await page.locator('div.theme-code-block').count();
    return Array.from({ length: count }, (_, i) => new PD_CodeBlockComponent(page, i));
  }

  // -- Queries -----------------------------------------------------------------
  async getLanguage(): Promise<string | null> {
    const className = await this.pre.getAttribute('class') ?? '';
    const match = className.match(/language-(\S+)/);
    return match ? match[1] : null;
  }

  async getCode(): Promise<string> {
    return (await this.pre.textContent()) ?? '';
  }

  async hasCopyButton(): Promise<boolean> {
    return this.copyButton.isVisible({ timeout: 2_000 }).catch(() => false);
  }

  // -- Actions --------------------------------------------------------------
  async clickCopy(): Promise<void> {
    await this.root.hover();
    await this.copyButton.waitFor({ state: 'visible' });
    await this.copyButton.click();
  }

  // -- Assertions --------------------------------------------------------------
  async assertRendered(): Promise<void> {
    await expect(this.root).toBeVisible();
    await expect(this.pre).toBeVisible();
  }

  async assertLanguage(expected: string): Promise<void> {
    const lang = await this.getLanguage();
    expect(lang?.toLowerCase()).toBe(expected.toLowerCase());
  }

  async assertCodeContains(snippet: string): Promise<void> {
    const code = await this.getCode();
    expect(code).toContain(snippet);
  }

  async assertCopyButtonVisible(): Promise<void> {
    await this.root.hover();
    await expect(this.copyButton).toBeVisible();
  }

  static async assertCount(page: Page, expected: number): Promise<void> {
    await expect(page.locator('div.theme-code-block')).toHaveCount(expected);
  }

  static async assertAtLeastOne(page: Page): Promise<void> {
    const count = await page.locator('div.theme-code-block').count();
    expect(count).toBeGreaterThan(0);
  }
}
