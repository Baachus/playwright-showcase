import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from '../BasePage.js';

/**
 * TI_JQueryUIMenuPage
 * ─────────────────────────────────────────────────────────────────────────────
 * Represents the JQuery UI Menus page on the-internet.herokuapp.com (/jqueryui/menu).
 */
export class TI_JQueryUIMenuPage extends BasePage {
  // ── Locators ────────────────────────────────────────────────────────────────
  readonly title: Locator;
  readonly menu: Locator;
  readonly enabledItem: Locator;
  readonly disabledItem: Locator;
  readonly downloadsItem: Locator;
  readonly pdfLink: Locator;
  readonly csvLink: Locator;
  readonly excelLink: Locator;

  constructor(page: Page) {
    super(page);
    // The heading on the page reads "JQuery UI - Menu" (case-sensitive match may vary)
    // Use a broad locator that matches the first h3 heading in the example section
    this.title = page.locator('.example h3').first();
    this.menu = page.locator('#menu');
    this.enabledItem = page.locator('#menu').getByRole('menuitem', { name: 'Enabled' }).first();
    this.disabledItem = page.locator('#menu .ui-state-disabled').first();
    this.downloadsItem = page.getByRole('menuitem', { name: 'Downloads' });
    this.pdfLink = page.getByRole('menuitem', { name: 'PDF' });
    this.csvLink = page.getByRole('menuitem', { name: 'CSV' });
    this.excelLink = page.getByRole('menuitem', { name: 'Excel' });
  }

  // ── Navigation ──────────────────────────────────────────────────────────────
  async goto(): Promise<void> {
    await this.page.goto('/jqueryui/menu');
    await this.waitForPageLoad();
  }

  async waitForPageLoad(): Promise<void> {
    await this.page.waitForLoadState('domcontentloaded');
    // Wait for the jQuery UI menu to be initialized (it gets role="menuitem" applied)
    await this.page.waitForFunction(
      () => document.querySelector('#menu [role="menuitem"]') != null,
      { timeout: 10000 }
    );
    await this.menu.waitFor({ state: 'visible' });
  }

  // ── Actions ─────────────────────────────────────────────────────────────────
  async hoverDownloads(): Promise<void> {
    await this.downloadsItem.hover();
    await this.pdfLink.waitFor({ state: 'visible' });
  }

  async clickPdf(): Promise<void> {
    await this.hoverDownloads();
    const [download] = await Promise.all([
      this.page.waitForEvent('download'),
      this.pdfLink.click(),
    ]);
    await download.cancel();
  }

  async clickCsv(): Promise<void> {
    await this.hoverDownloads();
    const [download] = await Promise.all([
      this.page.waitForEvent('download'),
      this.csvLink.click(),
    ]);
    await download.cancel();
  }

  async clickExcel(): Promise<void> {
    await this.hoverDownloads();
    const [download] = await Promise.all([
      this.page.waitForEvent('download'),
      this.excelLink.click(),
    ]);
    await download.cancel();
  }

  // ── Assertions ──────────────────────────────────────────────────────────────
  async assertOnPage(): Promise<void> {
    await expect(this.page).toHaveURL(/\/jqueryui\/menu/);
  }

  async assertMenuVisible(): Promise<void> {
    await expect(this.menu).toBeVisible();
  }

  async assertDownloadSubMenuVisible(): Promise<void> {
    await this.hoverDownloads();
    await expect(this.pdfLink).toBeVisible();
    await expect(this.csvLink).toBeVisible();
    await expect(this.excelLink).toBeVisible();
  }
}
