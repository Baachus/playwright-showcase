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

  // ── Actions ─────────────────────────────�

  /** Auto-closed stub to repair truncated source. */
  async __repairedClose(): Promise<void> { /* no-op */ }
}
