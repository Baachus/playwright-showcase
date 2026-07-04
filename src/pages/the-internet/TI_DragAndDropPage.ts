import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from '../BasePage.js';

/**
 * TI_DragAndDropPage
 * ─────────────────────────────────────────────────────────────────────────────
 * Represents the Drag and Drop page on the-internet.herokuapp.com (/drag_and_drop).
 *
 * Note: This page uses the HTML5 drag API with `draggable="true"` attributes.
 * Playwright's built-in dragTo() is unreliable for HTML5 drag across browsers,
 * especially in WebKit. We use a JS-based drag event simulation instead.
 */
export class TI_DragAndDropPage extends BasePage {
  // ── Locators ────────────────────────────────────────────────────────────────
  readonly title: Locator;
  readonly columnA: Locator;
  readonly columnB: Locator;
  readonly columnAHeader: Locator;
  readonly columnBHeader: Locator;

  constructor(page: Page) {
    super(page);
    this.title = page.getByRole('heading', { name: 'Drag and Drop' });
    this.columnA = page.locator('#column-a');
    this.columnB = page.locator('#column-b');
    this.columnAHeader = page.locator('#column-a header');
    this.columnBHeader = page.locator('#column-b header');
  }

  // ── Navigation ──────────────────────────────────────────────────────────────
  async goto(): Promise<void> {
    await this.page.goto('/drag_and_drop');
    await this.waitForPageLoad();
  }

  async waitForPageLoad(): Promise<void> {
    await this.title.waitFor({ state: 'visible' });
    await this.columnA.waitFor({ state: 'visible' });
  }

  // ── Queries ─────────────────────────────────────────────────────────────────
  async getColumnAText(): Promise<string> {
    return this.columnAHeader.innerText();
  }

  async getColumnBText(): Promise<string> {
    return this.columnBHeader.innerText();
  }

  // ── Actions ─────────────────────────────────────────────────────────────────
  /**
   * Drag using JS-dispatched HTML5 drag events for reliable cross-browser support.
   */
  private async dragColumnViaJS(sourceId: string, targetId: string): Promise<void> {
    await this.page.evaluate(([src, tgt]) => {
      const source = document.getElementById(src)!;
      const target = document.getElementById(tgt)!;
      const dt = new DataTransfer();
      source.dispatchEvent(new DragEvent('dragstart', { bubbles: true, dataTransfer: dt }));
      target.dispatchEvent(new DragEvent('dragover',  { bubbles: true, dataTransfer: dt }));
      target.dispatchEvent(new DragEvent('drop',      { bubbles: true, dataTransfer: dt }));
      source.dispatchEvent(new DragEvent('dragend',   { bubbles: true, dataTransfer: dt }));
    }, [sourceId, targetId] as [string, string]);
    // No fixed wait needed: the page swaps the columns synchronously in the
    // drop handler, and callers assert via retrying expect(...).toHaveText().
  }

  async dragAtoB(): Promise<void> {
    await this.dragColumnViaJS('column-a', 'column-b');
  }

  async dragBtoA(): Promise<void> {
    await this.dragColumnViaJS('column-b', 'column-a');
  }

  // ── Assertions ──────────────────────────────────────────────────────────────
  async assertOnPage(): Promise<void> {
    await expect(this.page).toHaveURL(/\/drag_and_drop/);
  }

  async assertColumnAContains(text: string): Promise<void> {
    await expect(this.columnAHeader).toHaveText(text);
  }

  async assertColumnBContains(text: string): Promise<void> {
    await expect(this.columnBHeader).toHaveText(text);
  }

  async assertDefaultOrder(): Promise<void> {
    await expect(this.columnAHeader).toHaveText('A');
    await expect(this.columnBHeader).toHaveText('B');
  }
}
