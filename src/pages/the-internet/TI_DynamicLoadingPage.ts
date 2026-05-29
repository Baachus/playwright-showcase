import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from '../BasePage.js';

/**
 * TI_DynamicLoadingPage
 * ─────────────────────────────────────────────────────────────────────────────
 * Represents the Dynamic Loading index page and both examples on
 * the-internet.herokuapp.com (/dynamic_loading, /dynamic_loading/1, /dynamic_loading/2).
 *
 * Example 1: Element is hidden, then shown after clicking Start.
 * Example 2: Element is not in the DOM, then rendered after clicking Start.
 */
export class TI_DynamicLoadingPage extends BasePage {
  // ── Locators ────────────────────────────────────────────────────────────────
  readonly title: Locator;
  readonly example1Link: Locator;
  readonly example2Link: Locator;
  readonly startButton: Locator;
  readonly loading: Locator;
  readonly finishText: Locator;

  constructor(page: Page) {
    super(page);
    this.title = page.getByRole('heading', { name: 'Dynamically Loaded Page Elements' });
    this.example1Link = page.getByRole('link', { name: 'Example 1' });
    this.example2Link = page.getByRole('link', { name: 'Example 2' });
    this.startButton = page.getByRole('button', { name: 'Start' });
    this.loading = page.locator('#loading');
    this.finishText = page.locator('#finish');
  }

  // ── Navigation ──────────────────────────────────────────────────────────────
  async goto(): Promise<void> {
    await this.page.goto('/dynamic_loading');
    await this.waitForPageLoad();
  }

  async gotoExample1(): Promise<void> {
    await this.page.goto('/dynamic_loading/1');
    await this.startButton.waitFor({ state: 'visible' });
  }

  async gotoExample2(): Promise<void> {
    await this.page.goto('/dynamic_loading/2');
    await this.startButton.waitFor({ state: 'visible' });
  }

  async waitForPageLoad(): Promise<void> {
    await this.title.waitFor({ state: 'visible' });
  }

  // ── Actions ─────────────────────────────────────────────────────────────────
  /**
   * Click Start and wait for the loading indicator to disappear, then for
   * the finish element to become visible.
   */
  async clickStartAndWait(): Promise<void> {
    await this.startButton.click();
    await this.loading.waitFor({ state: 'hidden' });
    await this.finishText.waitFor({ state: 'visible' });
  }

  // ── Queries ─────────────────────────────────────────────────────────────────
  async getFinishText(): Promise<string> {
    return this.finishText.innerText();
  }

  // ── Assertions ──────────────────────────────────────────────────────────────
  async assertOnPage(): Promise<void> {
    await expect(this.page).toHaveURL(/\/dynamic_loading/);
  }

  async assertOnExample1(): Promise<void> {
    await expect(this.page).toHaveURL(/\/dynamic_loading\/1/);
  }

  async assertOnExample2(): Promise<void> {
    await expect(this.page).toHaveURL(/\/dynamic_loading\/2/);
  }

  async assertFinishTextVisible(): Promise<void> {
    await expect(this.finishText).toBeVisible();
  }

  async assertFinishTextContains(text: string): Promise<void> {
    await expect(this.finishText).toContainText(text);
  }
}
