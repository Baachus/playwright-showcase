import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from '../BasePage.js';

/**
 * TI_HoversPage
 * ─────────────────────────────────────────────────────────────────────────────
 * Represents the Hovers page on the-internet.herokuapp.com (/hovers).
 * Each of the three figure elements reveals a caption with a name and link on hover.
 */
export class TI_HoversPage extends BasePage {
  // ── Locators ────────────────────────────────────────────────────────────────
  readonly title: Locator;
  readonly figures: Locator;
  readonly figCaptions: Locator;

  constructor(page: Page) {
    super(page);
    this.title = page.getByRole('heading', { name: 'Hovers' });
    this.figures = page.locator('.figure');
    this.figCaptions = page.locator('.figcaption');
  }

  // ── Navigation ──────────────────────────────────────────────────────────────
  async goto(): Promise<void> {
    await this.page.goto('/hovers');
    await this.waitForPageLoad();
  }

  async waitForPageLoad(): Promise<void> {
    await this.title.waitFor({ state: 'visible' });
  }

  // ── Actions ─────────────────────────────────────────────────────────────────
  async hoverFigure(index: number): Promise<void> {
    await this.figures.nth(index).hover();
  }

  async clickFigureLink(index: number): Promise<void> {
    await this.figures.nth(index).hover();
    await this.figures.nth(index).getByRole('link').click();
  }

  // ── Queries ─────────────────────────────────────────────────────────────────
  async getFigureCount(): Promise<number> {
    return this.figures.count();
  }

  async getCaptionText(index: number): Promise<string> {
    return this.figCaptions.nth(index).locator('h5').innerText();
  }

  async getCaptionLinkHref(index: number): Promise<string> {
    return (await this.figCaptions.nth(index).getByRole('link').getAttribute('href')) ?? '';
  }

  async isCaptionVisible(index: number): Promise<boolean> {
    return this.figCaptions.nth(index).isVisible();
  }

  // ── Assertions ──────────────────────────────────────────────────────────────
  async assertOnPage(): Promise<void> {
    await expect(this.page).toHaveURL(/\/hovers/);
  }

  async assertThreeFiguresVisible(): Promise<void> {
    await expect(this.figures).toHaveCount(3);
  }

  async assertCaptionVisibleAfterHover(index: number): Promise<void> {
    await this.hoverFigure(index);
    await expect(this.figCaptions.nth(index)).toBeVisible();
  }
};