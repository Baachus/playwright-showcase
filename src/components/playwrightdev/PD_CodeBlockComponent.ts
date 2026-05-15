import { Page, Locator, expect } from '@playwright/test';
import { BaseComponent } from '../BaseComponent.js';

/**
 * PD_CodeBlockComponent
 * ─────────────────────────────────────────────────────────────────────────────
 * Represents an individual syntax-highlighted code block on a docs page.
 *
 * playwright.dev uses Docusaurus with Prism syntax highlighting.  Each block
 * is a `<div class="theme-code-block">` wrapper that contains:
 *   • A `<pre class="language-*">` element holding the highlighted code
 *   • A copy-to-clipboard button
 *   • (optionally) a language label tab
 *
 * Usage – create one instance per code block by index:
 *
 *   const block = new PD_CodeBlockComponent(page, 0);   // first code block
 *   await block.waitForVisible();
 *   await block.assertLanguage('typescript');
 */
export class PD_CodeBlockComponent extends BaseComponent {
  readonly pre: Locator;
  readonly copyButton: Locator;

  /**
   * @param page  – the Playwright Page
   * @param index – 0-based index of the code block on the current page
   */
  constructor(page: Page, index = 0) {
    // Docusaurus wraps every code block in a div.theme-code-block.
    // Fall back to the bare <pre> if the wrapper isn't found.
    const root = page.locator('div.theme-code-block').nth(index);
    super(page, root);

    this.pre        = this.root.locator('pre');
    this.copyButton = this.root.locator('button[class*="copyButton"], button[title*="Copy"]');
  }

  /**
   * Factory that returns ALL code block components visible on the current page.
   */
  static async all(page: Page): Promise<PD_CodeBlockComponent[]> {
    const count = await page.locator('div.theme-code-block').count();
    return Array.from({ length: count }, (_, i) => new PD_CodeBlockComponent(page, i));
  }

  // ── Queries ──────────────────────────────────────────────────────────────────

  /**
   * Returns the language identifier from the <pre> class, e.g. "typescript".
   * Returns null if no language class is found.
   */
  async getLanguage(): Promise<string | null> {
    const className = await this.pre.getAttribute('class') ?? '';
    const match = className.match(/language-(\S+)/);
    return match ? match[1] : null;
  }

  /**
   * Returns the raw text content of the code block.
   */
  async getCode(): Promise<string> {
    return (await this.pre.textContent()) ?? '';
  }

  /**
   * Returns true if the copy button is present within the block.
   */
  async hasCopyButton(): Promise<boolean> {
    return this.copyButton.isVisible({ timeout: 2_000 }).catch(() => false);
  }

  // ── Actions ──────────────────────────────────────────────────────────────────

  /**
   * Hover over the block to reveal the copy button, then click it.
   */
  async clickCopy(): Promise<void> {
    await this.root.hover();
    await this.copyButton.waitFor({ state: 'visible' });
    await this.copyButton.click();
  }

  // ── Assertions ───────────────────────────────────────────────────────────────

  /** Assert the code block is rendered with a <pre> element. */
  async assertRendered(): Promise<void> {
    await expect(this.root).toBeVisible();
    await expect(this.pre).toBeVisible();
  }

  /**
   * Assert the detected language matches the expected value (case-insensitive).
   */
  async assertLanguage(expected: string): Promise<void> {
    const lang = await this.getLanguage();
    expect(lang?.toLowerCase()).toBe(expected.toLowerCase());
  }

  /**
   * Assert the code content includes a specific substring.
   */
  async assertCodeContains(snippet: string): Promise<void> {
    const code = await this.getCode();
    expect(code).toContain(snippet);
  }

  /** Assert the copy button is visible (after hover). */
  async assertCopyButtonVisible(): Promise<void> {
    await this.root.hover();
    await expect(this.copyButton).toBeVisible();
  }

  /** Assert the total number of code blocks on the page. */
  static async assertCount(page: Page, expected: number): Promise<void> {
    await expect(page.locator('div.theme-code-block')).toHaveCount(expected);
  }

  /** Assert there is at least one code block on the page. */
  static async assertAtLeastOne(page: Page): Promise<void> {
    const count = await page.locator('div.theme-code-block').count();
    expect(count).toBeGreaterThan(0);
  }
}
