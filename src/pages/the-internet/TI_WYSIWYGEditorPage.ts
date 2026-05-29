import { Page, Locator, FrameLocator, expect } from '@playwright/test';
import { BasePage } from '../BasePage.js';

/**
 * TI_WYSIWYGEditorPage
 * ─────────────────────────────────────────────────────────────────────────────
 * Represents the WYSIWYG Editor page on the-internet.herokuapp.com (/editor).
 * Contains a TinyMCE WYSIWYG editor inside an iframe.
 */
export class TI_WYSIWYGEditorPage extends BasePage {
  // ── Locators ────────────────────────────────────────────────────────────────
  readonly title: Locator;
  readonly iframeLocator: FrameLocator;
  readonly editorBody: Locator;

  constructor(page: Page) {
    super(page);
    this.title = page.getByRole('heading', { name: 'An iFrame containing the TinyMCE WYSIWYG Editor' });
    this.iframeLocator = page.frameLocator('#mce_0_ifr');
    this.editorBody = this.iframeLocator.locator('#tinymce');
  }

  // ── Navigation ──────────────────────────────────────────────────────────────
  async goto(): Promise<void> {
    await this.page.goto('/tinymce');
    await this.waitForPageLoad();
  }

  async waitForPageLoad(): Promise<void> {
    await this.title.waitFor({ state: 'visible' });
    await this.editorBody.waitFor({ state: 'visible' });
  }

  // ── Actions ─────────────────────────────────────────────────────────────────
  async clearAndTypeText(text: string): Promise<void> {
    await this.editorBody.click();
    await this.page.keyboard.press('Control+a');
    await this.page.keyboard.type(text);
  }

  async appendText(text: string): Promise<void> {
    await this.editorBody.click();
    await this.page.keyboard.press('End');
    await this.page.keyboard.type(text);
  }

  async clearEditor(): Promise<void> {
    await this.editorBody.click();
    await this.page.keyboard.press('Control+a');
    await this.page.keyboard.press('Delete');
  }

  // ── Queries ─────────────────────────────────────────────────────────────────
  async getEditorContent(): Promise<string> {
    return this.editorBody.innerText();
  }

  async getEditorHtml(): Promise<string> {
    return this.editorBody.innerHTML();
  }

  // ── Assertions ──────────────────────────────────────────────────────────────
  async assertOnPage(): Promise<void> {
    await expect(this.page).toHaveURL(/\/tinymce/);
  }

  async assertEditorVisible(): Promise<void> {
    await expect(this.editorBody).toBeVisible();
  }

  async assertEditorContains(text: string): Promise<void> {
    await expect(this.editorBody).toContainText(text);
  }
}
