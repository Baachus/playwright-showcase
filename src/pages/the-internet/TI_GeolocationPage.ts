import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from '../BasePage.js';

/**
 * TI_GeolocationPage
 * ─────────────────────────────────────────────────────────────────────────────
 * Represents the Geolocation page on the-internet.herokuapp.com (/geolocation).
 */
export class TI_GeolocationPage extends BasePage {
  // ── Locators ────────────────────────────────────────────────────────────────
  readonly title: Locator;
  readonly whereAmIButton: Locator;
  readonly latValue: Locator;
  readonly longValue: Locator;

  constructor(page: Page) {
    super(page);
    this.title = page.getByRole('heading', { name: 'Geolocation' });
    this.whereAmIButton = page.getByRole('button', { name: 'Where am I?' });
    this.latValue = page.locator('#lat-value');
    this.longValue = page.locator('#long-value');
  }

  // ── Navigation ──────────────────────────────────────────────────────────────
  async goto(): Promise<void> {
    await this.page.goto('/geolocation');
    await this.waitForPageLoad();
  }

  async waitForPageLoad(): Promise<void> {
    await this.title.waitFor({ state: 'visible' });
  }

  // ── Actions ─────────────────────────────────────────────────────────────────
  async clickWhereAmI(): Promise<void> {
    await this.whereAmIButton.click();
  }

  async waitForCoordinates(): Promise<void> {
    await this.latValue.waitFor({ state: 'visible' });
    await this.longValue.waitFor({ state: 'visible' });
  }

  // ── Queries ─────────────────────────────────────────────────────────────────
  async getLatitude(): Promise<string> {
    return this.latValue.innerText();
  }

  async getLongitude(): Promise<string> {
    return this.longValue.innerText();
  }

  // ── Assertions ──────────────────────────────────────────────────────────────
  async assertOnPage(): Promise<void> {
    await expect(this.page).toHaveURL(/\/geolocation/);
  }

  async assertCoordinatesVisible(): Promise<void> {
    await expect(this.latValue).toBeVisible();
    await expect(this.longValue).toBeVisible();
  }

  async assertCoordinatesPopulated(): Promise<void> {
    const lat = await this.getLatitude();
    const lng = await this.getLongitude();
    expect(lat.trim()).not.toBe('');
    expect(lng.trim()).not.toBe('');
  }
}
