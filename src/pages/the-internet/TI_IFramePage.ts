import { Page, Locator, FrameLocator, expect } from '@playwright/test';
import { BasePage } from '../BasePage.js';

/**
 * TI_IFramePage
 * ─────────────────────────────────────────────────────────────────────────────
 * Represents the iFrame page on the-internet.herokuapp.com (/iframe).
 * Contains a TinyMCE WYSIWYG editor loaded inside an iframe.
 */
export class TI_IFramePage extends BasePage {
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
    await this.page.goto('/iframe');
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

  async getEditorContent(): Promise<string> {
    return this.editorBody.innerText();
  }

  // ── Assertions ──────────────────────────────────────────────────────────────
  async assertOnPage(): Promise<void> {
    await expect(this.page).toHaveURL(/\/iframe/);
  }

  async assertEditorVisible(): Promise<void> {
    await expect(this.editorBody).toBeVisible();
  }

  async assertEditorContains(text: string): Promise<void> {
    await expect(this.editorBody).toContainText(text);
  }
}
