import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from '../BasePage.js';

/**
 * PD_DocsPage
 * ─────────────────────────────────────────────────────────────────────────────
 * Represents the Playwright documentation content pages.
 * Covers sidebar navigation, content area, and anchor links.
 */
export class PD_DocsPage extends BasePage {
  // ── Locators ────────────────────────────────────────────────────────────────
  readonly sidebar: Locator;
  readonly mainContent: Locator;
  readonly breadcrumb: Locator;
  readonly tocLinks: Locator;
  readonly nextPageButton: Locator;
  readonly prevPageButton: Locator;
  readonly codeBlocks: Locator;
  readonly copyButtons: Locator;
  readonly editPageLink: Locator;

  constructor(page: Page) {
    super(page);

    this.sidebar = page.getByRole('navigation', { name: 'Docs sidebar' });
    this.mainContent = page.locator('article');
    this.breadcrumb = page.locator('nav[aria-label="Breadcrumbs"]');
    this.tocLinks = page.locator('.table-of-contents a');
    this.nextPageButton = page.getByRole('link', { name: /next/i }).last();
    this.prevPageButton = page.getByRole('link', { name: /previous/i }).first();
    this.codeBlocks = page.locator('pre[class*="language-"]');
    this.copyButtons = page.locator('button[class*="copyButton"]');
    this.editPageLink = page.getByRole('link', { name: /edit this page/i });
  }

  // ── Navigation ──────────────────────────────────────────────────────────────

  async goto(): Promise<void> {
    await this.page.goto('/docs/intro');
    await this.waitForPageLoad();
  }

  async waitForPageLoad(): Promise<void> {
    await this.mainContent.waitFor({ state: 'visible' });
  }

  async gotoSection(path: string): Promise<void> {
    await this.page.goto(`/docs/${path}`);
    await this.waitForPageLoad();
  }

  // ── Sidebar Navigation ──────────────────────────────────────────────────────

  /**
   * Expand a sidebar category by its label.
   */
  async expandSidebarCategory(label: string): Promise<void> {
    const category = this.sidebar.getByRole('button', { name: label });
    const isExpanded = await category.getAttribute('aria-expanded');
    if (isExpanded === 'false') {
      await category.click();
    }
  }

  /**
   * Click a specific sidebar link by its text.
   */
  async clickSidebarLink(linkText: string): Promise<void> {
    await this.sidebar.getByRole('link', { name: linkText }).click();
    await this.waitForPageLoad();
  }

  /**
   * Return all visible sidebar link texts as an array.
   */
  async getSidebarLinks(): Promise<string[]> {
    const links = this.sidebar.getByRole('link');
    return links.allTextContents();
  }

  // ── TOC Navigation ──────────────────────────────────────────────────────────

  /**
   * Click a table-of-contents anchor link.
   */
  async clickTocLink(linkText: string): Promise<void> {
    await this.tocLinks.filter({ hasText: linkText }).click();
  }

  // ── Code Blocks ─────────────────────────────────────────────────────────────

  /**
   * Get the number of code blocks on the current page.
   */
  async getCodeBlockCount(): Promise<number> {
    return this.codeBlocks.count();
  }

  /**
   * Get text content of a specific code block (0-indexed).
   */
  async getCodeBlockContent(index: number): Promise<string | null> {
    return this.codeBlocks.nth(index).textContent();
  }

  // ── Assertions ──────────────────────────────────────────────────────────────

  async assertOnDocsPage(): Promise<void> {
    await expect(this.mainContent).toBeVisible();
    await expect(this.page).toHaveURL(/\/docs\//);
  }

  async assertHeadingVisible(heading: string): Promise<void> {
    await expect(
      this.mainContent.getByRole('heading', { name: new RegExp(heading) }),
    ).toBeVisible();
  }

  async assertSidebarVisible(): Promise<void> {
    await expect(this.sidebar).toBeVisible();
  }

  async assertCodeBlocksPresent(): Promise<void> {
    const count = await this.getCodeBlockCount();
    expect(count).toBeGreaterThan(0);
  }
}