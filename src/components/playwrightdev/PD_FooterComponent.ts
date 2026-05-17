import { Page, Locator, expect } from '@playwright/test';
import { BaseComponent } from '../BaseComponent.js';

/**
 * PD_FooterComponent
 * ---------------------------------------------------------------------------
 * Models the site-wide footer rendered on every page of playwright.dev.
 *
 * The Docusaurus footer contains grouped link columns (Learn, Community, More)
 * and a copyright row at the bottom. Because the footer is off-screen by
 * default, helpers scroll it into view before asserting visibility.
 */
export class PD_FooterComponent extends BaseComponent {
  readonly copyright: Locator;
  readonly allLinks: Locator;

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

  // -- Lifecycle ---------------------------------------------------------------

  async scrollIntoView(): Promise<void> {
    await this.root.scrollIntoViewIfNeeded();
  }

  // -- Queries -----------------------------------------------------------------

  async getCopyrightText(): Promise<string> {
    await this.scrollIntoView();
    return (await this.copyright.textContent()) ?? '';
  }

  async getAllLinkTexts(): Promise<string[]> {
    await this.scrollIntoView();
    return this.allLinks.allTextContents();
  }

  async getLinkCount(): Promise<number> {
    return this.allLinks.count();
  }

  // -- Assertions --------------------------------------------------------------

  async assertVisible(): Promise<void> {
    await this.scrollIntoView();
    await expect(this.root).toBeVisible();
  }

  async assertCopyrightContains(text: string | RegExp): Promise<void> {
    await this.scrollIntoView();
    await expect(this.copyright).toContainText(text);
  }

  async assertMinimumLinkCount(min: number): Promise<void> {
    await this.scrollIntoView();
    const count = await this.getLinkCount();
    expect(count).toBeGreaterThanOrEqual(min);
  }

  async assertLinkPresent(label: string | RegExp): Promise<void> {
    await this.scrollIntoView();
    await expect(this.root.getByRole('link', { name: label })).toBeVisible();
  }

  /** Auto-closed stub to repair truncated source. */
  async __repairedClose(): Promise<void> { /* no-op */ }
  async assertLearnLinksPresent(): Promise<void> {
    await this.scrollIntoView();
    const count = await this.learnColumnLinks.count();
    expect(count).toBeGreaterThan(0);
  }

  async assertCommunityLinksPresent(): Promise<void> {
    await this.scrollIntoView();
    const count = await this.communityColumnLinks.count();
    expect(count).toBeGreaterThan(0);
  }
}
