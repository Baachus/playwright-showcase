import { Page, Locator, Frame, expect } from '@playwright/test';
import { BasePage } from '../BasePage.js';

/**
 * TI_NestedFramesPage
 * ─────────────────────────────────────────────────────────────────────────────
 * Represents the Nested Frames page on the-internet.herokuapp.com (/nested_frames).
 * Uses a frameset with top/bottom frames; top contains left/middle/right subframes.
 */
export class TI_NestedFramesPage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  // ── Navigation ──────────────────────────────────────────────────────────────
  async goto(): Promise<void> {
    await this.page.goto('/nested_frames');
    await this.waitForPageLoad();
  }

  async waitForPageLoad(): Promise<void> {
    // Framesets don't have a standard DOM heading — wait for the page to load
    await this.page.waitForLoadState('domcontentloaded');
  }

  // ── Frame Accessors ─────────────────────────────────────────────────────────
  getTopFrame(): Frame | null {
    return this.page.frame({ name: 'frame-top' });
  }

  getBottomFrame(): Frame | null {
    return this.page.frame({ name: 'frame-bottom' });
  }

  getLeftFrame(): Frame | null {
    return this.page.frame({ name: 'frame-left' });
  }

  getMiddleFrame(): Frame | null {
    return this.page.frame({ name: 'frame-middle' });
  }

  getRightFrame(): Frame | null {
    return this.page.frame({ name: 'frame-right' });
  }

  // ── Queries ─────────────────────────────────────────────────────────────────
  async getFrameText(frame: Frame | null): Promise<string> {
    if (!frame) return '';
    return frame.locator('body').innerText();
  }

  async getLeftFrameText(): Promise<string> {
    return this.getFrameText(this.getLeftFrame());
  }

  async getMiddleFrameText(): Promise<string> {
    return this.getFrameText(this.getMiddleFrame());
  }

  async getRightFrameText(): Promise<string> {
    return this.getFrameText(this.getRightFrame());
  }

  async getBottomFrameText(): Promise<string> {
    return this.getFrameText(this.getBottomFrame());
  }

  // ── Assertions ──────────────────────────────────────────────────────────────
  async assertOnPage(): Promise<void> {
    await expect(this.page).toHaveURL(/\/nested_frames/);
  }

  async assertFramesLoaded(): Promise<void> {
    const bottom = this.getBottomFrame();
    const left = this.getLeftFrame();
    const middle = this.getMiddleFrame();
    const right = this.getRightFrame();
    expect(bottom).not.toBeNull();
    expect(left).not.toBeNull();
    expect(middle).not.toBeNull();
    expect(right).not.toBeNull();
  }

  async assertLeftFrameContains(text: string): Promise<void> {
    const frame = this.getLeftFrame();
    expect(frame).not.toBeNull();
    await expect(frame!.locator('body')).toContainText(text);
  }

  async assertMiddleFrameContains(text: string): Promise<void> {
    const frame = this.getMiddleFrame();
    expect(frame).not.toBeNull();
    await expect(frame!.locator('body')).toContainText(text);
  }

  async assertRightFrameContains(text: string): Promise<void> {
    const frame = this.getRightFrame();
    expect(frame).not.toBeNull();
    await expect(frame!.locator('body')).toContainText(text);
  }

  async assertBottomFrameContains(text: string): Promise<void> {
    const frame = this.getBottomFrame();
    expect(frame).not.toBeNull();
    await expect(frame!.locator('body')).toContainText(text);
  }
}
