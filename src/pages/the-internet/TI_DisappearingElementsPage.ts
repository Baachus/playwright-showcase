import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from '../BasePage.js';

/**
 * TI_DisappearingElementsPage
 * ─────────────────────────────────────────────────────────────────────────────
 * Represents the Disappearing Elements page on the-internet.herokuapp.com (/disappearing_elements).
 * The "Gallery" nav link appears and disappears randomly on each page load.
 */
export class TI_DisappearingElementsPage extends BasePage {
  // ── Locators ────────────────────────────────────────────────────────────────
  readonly title: Locator;
  readonly navList: Locator;
  readonly navItems: Locator;
  readonly homeLink: Locator;
  readonly aboutLink: Locator;
  readonly contactUsLink: Locator;
  readonly portfolioLink: Locator;
  readonly galleryLink: Locator;

  constructor(page: Page) {
    super(page);
    this.title = page.getByRole('heading', { name: 'Disappearing Elements' });
    this.navList = page.locator('.example ul');
    this.navItems = page.locator('.example ul li');
    this.homeLink = page.getByRole('link', { name: 'Home' });
    this.aboutLink = page.getByRole('link', { name: 'About' });
    this.contactUsLink = page.getByRole('link', { name: 'Contact Us' });
    this.portfolioLink = page.getByRole('link', { name: 'Portfolio' });
    this.galleryLink = page.getByRole('link', { name: 'Gallery' });
  }

  // ── Navigation ──────────────────────────────────────────────────────────────
  async goto(): Promise<void> {
    await this.page.goto('/disappearing_elements');
    await this.waitForPageLoad();
  }

  async waitForPageLoad(): Promise<void> {
    await this.title.waitFor({ state: 'visible' });
  }

  // ── Queries ─────────────────────────────────────────────────────────────────
  async getNavItemCount(): Promise<number> {
    return this.navItems.count();
  }

  async isGalleryLinkVisible(): Promise<boolean> {
    return this.galleryLink.isVisible();
  }

  /**
   * Reload the page up to maxAttempts times until the Gallery link appears.
   * Returns true if the Gallery link was found, false otherwise.
   */
  async reloadUntilGalleryAppears(maxAttempts = 10): Promise<boolean> {
    for (let i = 0; i < maxAttempts; i++) {
      await this.goto();
      if (await this.isGalleryLinkVisible()) return true;
    }
    return false;
  }

  // ── Assertions ──────────────────────────────────────────────────────────────
  async assertOnPage(): Promise<void> {
    await expect(this.page).toHaveURL(/\/disappearing_elements/);
  }

  async assertPermanentLinksVisible(): Promise<void> {
    await expect(this.homeLink).toBeVisible();
    await expect(this.aboutLink).toBeVisible();
    await expect(this.contactUsLink).toBeVisible();
    await expect(this.portfolioLink).toBeVisible();
  }
}
