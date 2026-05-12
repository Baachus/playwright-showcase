import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from '../../BasePage.js';

/**
 * SD_InfoPage
 * ─────────────────────────────────────────────────────────────────────────────
 * Represents the Saucedemo cart page.
 */
export class SD_InfoPage extends BasePage {
  // ── Locators ────────────────────────────────────────────────────────────────
  readonly loginLogo: Locator;

  constructor(page: Page) {
    super(page);

    this.loginLogo       = page.locator('.login_logo');
  }

  // ── Navigation ──────────────────────────────────────────────────────────────

  async goto(): Promise<void> {
    await this.page.goto('/');
    await this.waitForPageLoad();
  }

  async waitForPageLoad(): Promise<void> {
    await this.loginLogo.waitFor({ state: 'visible' });
  }

  // ── Actions ─────────────────────────────────────────────────────────────────


  // ── Assertions ──────────────────────────────────────────────────────────────

  async assertOnLoginPage(): Promise<void> {
    await expect(this.loginLogo).toBeVisible();
    await expect(this.page).toHaveURL('/');
  }
}