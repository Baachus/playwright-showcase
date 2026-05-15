import { Page, Locator, expect } from '@playwright/test';
import { BaseComponent } from '../BaseComponent.js';

/**
 * PD_FooterComponent
 * ---------------------------------------------------------------------------
 * Models the site-wide footer rendered on every page of playwright.dev.
 *
 * The Docusaurus footer typically contains:
 *   - Grouped link columns (Learn, Community, More)
 *   - A copyright / branding row at the bottom
 *
 * Because the footer is at the bottom of the page, many helpers scroll it
 * into view before asserting visibility.
 */
export class PD_FooterComponent extends BaseComponent {
  readonly copyright: Locator;
  readonly allLinks: Locator;

  // Known link column groups
  readonly learnColumnLinks: Locator;
  readonly communityColumnLinks: Locator;
  readonly moreColumnLinks: Locator;

  constructor(page: Page) {
    super(page, page.locator('footer.footer'));

    this.copyright            = this.root.locator('.footer__copyright');
    this.allLinks             = this.root.getByRole('link');
    this.learnColumnLinks     = this.root.locator('.footer__col').filter({ hasText: /^Learn/i }).getByRole('link');
    this.communityColumnLinks = this.root.locator('.footer__col').filter({ hasText: /Community/i }).getByRole('link');
    this.moreColumnLinks      = this.root.locator('.footer__col').filter({ hasText: /^More/i }).getByRole('link');
  }

  // Lifecycle

  /** Scroll the footer into view before interacting with it. */
  async scrollIntoView(): Promise<void> {
    await this.root.scrollIntoViewIfNeeded();
  }

  // Queries

  /** Returns the copyright text from the footer bottom bar. */
  async getCopyrightText(): Promise<string> {
    await this.scrollIntoView();
    return (await this.copyright.textContent()) ?? '';
  }

  /** Returns all footer link labels as an array of strings. */
  async getAllLinkTexts(): Promise<string[]> {
    await this.scrollIntoView();
    return this.allLinks.allTextContents();
  }

  /** Returns the total number of links in the footer. */
  async getLinkCount(): Promise<number> {
    return this.allLinks.count();
  }

  // Assertions

  /** Assert the footer element is visible after scrolling to it. */
  async assertVisible(): Promise<void> {
    await this.scrollIntoView();
    await expect(this.root).toBeVisible();
  }

  /** Assert the copyright element exists and contains expected text. */
  async assertCopyrightContains(text: string | RegExp): Promise<void> {
    await this.scrollIntoView();
    await expect(this.copyright).toContainText(text);
  }

  /** Assert that the footer contains at least the given number of links. */
  async assertMinimumLinkCount(min: number): Promise<void> {
    await this.scrollIntoView();
    const count = await this.getLinkCount();
    expect(count).toBeGreaterThanOrEqual(min);
  }

  /** Assert a specific link is present in the footer (by its visible label). */
  async assertLinkPresent(label: string | RegExp): Promise<void> {
    await this.scrollIntoView();
    await expect(this.root.getByRole('link', { name: label })).toBeVisible();
  }

  /** Assert the Learn link-group column renders links. */
  async assertLearnLinksPresent(): Promise<void> {
    await this.scrollIntoView();
    const count = await this.learnColumnLinks.count();
    expect(count).toBeGreaterThan(0);
  }

  /** Assert the Community link-group column renders links. */
  async assertCommunityLinksPresent(): Promise<void> {
    await this.scrollIntoView();
    const count = await this.communityColumnLinks.count();
    expect(count).toBeGreaterThan(0);
  }
}
