import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from '../BasePage.js';

/**
 * TI_TyposPage
 * ─────────────────────────────────────────────────────────────────────────────
 * Represents the Typos page on the-internet.herokuapp.com (/typos).
 * The second paragraph randomly contains a typo (`;` instead of `'`).
 * The second paragraph text is: "Sometimes you won't ever encounter a typo"
 * where "won't" may be rendered as "won;t" (the typo variant).
 */
export class TI_TyposPage extends BasePage {
  // ── Locators ────────────────────────────────────────────────────────────────
  readonly title: Locator;
  readonly paragraphs: Locator;
  readonly firstParagraph: Locator;
  readonly secondParagraph: Locator;

  constructor(page: Page) {
    super(page);
    this.title = page.getByRole('heading', { name: 'Typos' });
    this.paragraphs = page.locator('.example p');
    this.firstParagraph = page.locator('.example p').nth(0);
    this.secondParagraph = page.locator('.example p').nth(1);
  }

  // ── Navigation ──────────────────────────────────────────────────────────────
  async goto(): Promise<void> {
    await this.page.goto('/typos');
    await this.waitForPageLoad();
  }

  async waitForPageLoad(): Promise<void> {
    await this.title.waitFor({ state: 'visible' });
  }

  // ── Queries ─────────────────────────────────────────────────────────────────
  async getFirstParagraphText(): Promise<string> {
    return this.firstParagraph.innerText();
  }

  async getSecondParagraphText(): Promise<string> {
    return this.secondParagraph.innerText();
  }

  /**
   * Returns true if the second paragraph contains a typo (`;` instead of `'`).
   */
  async hasTypo(): Promise<boolean> {
    const text = await this.getSecondParagraphText();
    return text.includes(';');
  }

  /**
   * Returns true if the second paragraph is correctly spelled ("won't").
   */
  async isCorrect(): Promise<boolean> {
    const text = await this.getSecondParagraphText();
    return text.includes("won't");
  }

  // ── Assertions ──────────────────────────────────────────────────────────────
  async assertOnPage(): Promise<void> {
    await expect(this.page).toHaveURL(/\/typos/);
  }

  async assertParagraphsVisible(): Promise<void> {
    await expect(this.firstParagraph).toBeVisible();
    await expect(this.secondParagraph).toBeVisible();
  }

  async assertSecondParagraphHasExpectedContent(): Promise<void> {
    const text = await this.getSecondParagraphText();
    // The second paragraph says "Sometimes you won't ever encounter a typo"
    // where "won't" may appear as "won;t" (the typo variant).
    const hasContent = text.includes('won') && (text.includes("'") || text.includes(';'));
    expect(hasContent).toBe(true);
  }
}
