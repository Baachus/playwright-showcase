import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from '../BasePage.js';

/**
 * TI_FloatingMenuPage
 * ─────────────────────────────────────────────────────────────────────────────
 * Represents the Floating Menu page on the-internet.herokuapp.com (/floating_menu).
 * The menu stays fixed at the top of the viewport while scrolling.
 */
export class TI_FloatingMenuPage extends BasePage {
  // ── Locators ────────────────────────────────────────────────────────────────
  readonly title: Locator;
  readonly menu: Locator;
  readonly menuItems: Locator;
  readonly homeLink: Locator;
  readonly newsLink: Locator;
  readonly contactLink: Locator;
  readonly aboutLink: Locator;

  constructor(page: Page) {
    super(page);
    this.title = page.getByRole('heading', { name: 'Floating Menu' });
    this.menu = page.locator('#menu');
    this.menuItems = page.locator('ul#menu li');
    this.homeLink = page.locator('#menu').getByRole('link', { name: 'Home' });
    this.newsLink = page.locator('#menu').getByRole('link', { name: 'News' });
    this.contactLink = page.locator('#menu').getByRole('link', { name: 'Contact' });
    this.aboutLink = page.locator('#menu').getByRole('link', { name: 'About' });
  }

  // ── Navigation ──────────────────────────────────────────────────────────────
  async goto(): Promise<void> {
    await this.page.goto('/floating_menu');
    await this.waitForPageLoad();
  }

  async waitForPageLoad(): Promise<void> {
    await this.title.waitFor({ state: 'visible' });
  }

  // ── Actions ─────────────────────────────────────────────────────────────────
  /**
   * Scroll to the bottom of the page.
   */
  async scrollToBottom(): Promise<void> {
    await this.page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await this.page.waitForTimeout(300);
  }

  /**
   * Scroll to the top of the page.
   */
  async scrollToTop(): Promise<void> {
    await this.page.evaluate(() => window.scrollTo(0, 0));
    await this.page.waitForTimeout(300);
  }

  // ── Queries ─────────────────────────────────────────────────────────────────
  async getMenuItemCount(): Promise<number> {
    return this.menuItems.count();
  }

  async isMenuInViewport(): Promise<boolean> {
    return this.menu.isVisible();
  }

  // ── Assertions ──────────────────────────────────────────────────────────────
  async assertOnPage(): Promise<void> {
    await expect(this.page).toHaveURL(/\/floating_menu/);
  }

  async assertMenuVisible(): Promise<void> {
    await expect(this.menu).toBeVisible();
  }

  async assertAllMenuItemsVisible(): Promise<void> {
    await expect(this.homeLink).toBeVisible();
    await expect(this.newsLink).toBeVisible();
    await expect(this.contactLink).toBeVisible();
    await expect(this.aboutLink).toBeVisible();
  }
}
