import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from '../BasePage.js';

/**
 * TI_HorizontalSliderPage
 * ─────────────────────────────────────────────────────────────────────────────
 * Represents the Horizontal Slider page on the-internet.herokuapp.com (/horizontal_slider).
 */
export class TI_HorizontalSliderPage extends BasePage {
  // ── Locators ────────────────────────────────────────────────────────────────
  readonly title: Locator;
  readonly slider: Locator;
  readonly rangeValue: Locator;

  constructor(page: Page) {
    super(page);
    this.title = page.getByRole('heading', { name: 'Horizontal Slider' });
    this.slider = page.locator('input[type="range"]');
    this.rangeValue = page.locator('#range');
  }

  // ── Navigation ──────────────────────────────────────────────────────────────
  async goto(): Promise<void> {
    await this.page.goto('/horizontal_slider');
    await this.waitForPageLoad();
  }

  async waitForPageLoad(): Promise<void> {
    await this.title.waitFor({ state: 'visible' });
  }

  // ── Actions ─────────────────────────────────────────────────────────────────
  /**
   * Move the slider to an absolute value using keyboard arrow keys.
   * The slider starts at 0, min=0, max=5, step=0.5.
   */
  async moveSliderTo(targetValue: number): Promise<void> {
    await this.slider.focus();
    // Reset to 0 by pressing Home
    await this.page.keyboard.press('Home');
    // Each Right arrow press moves by 0.5
    const steps = Math.round(targetValue / 0.5);
    for (let i = 0; i < steps; i++) {
      await this.page.keyboard.press('ArrowRight');
    }
  }

  /**
   * Set the slider value directly via JavaScript.
   */
  async setSliderValue(value: number): Promise<void> {
    await this.slider.evaluate((el: HTMLInputElement, val: number) => {
      el.value = String(val);
      el.dispatchEvent(new Event('change', { bubbles: true }));
      el.dispatchEvent(new Event('input', { bubbles: true }));
    }, value);
  }

  // ── Queries ─────────────────────────────────────────────────────────────────
  async getCurrentValue(): Promise<string> {
    return this.rangeValue.innerText();
  }

  async getSliderInputValue(): Promise<string> {
    return this.slider.inputValue();
  }

  // ── Assertions ──────────────────────────────────────────────────────────────
  async assertOnPage(): Promise<void> {
    await expect(this.page).toHaveURL(/\/horizontal_slider/);
  }

  async assertRangeValueIs(expected: string): Promise<void> {
    await expect(this.rangeValue).toHaveText(expected);
  }

  async assertSliderVisible(): Promise<void> {
    await expect(this.slider).toBeVisible();
    await expect(this.rangeValue).toBeVisible();
  }
}
