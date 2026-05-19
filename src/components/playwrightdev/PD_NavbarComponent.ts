import { Page, Locator, expect } from '@playwright/test';
import { BaseComponent } from '../BaseComponent.js';

/**
 * PD_NavbarComponent
 * ---------------------------------------------------------------------------
 * Encapsulates the top navigation bar on every page of playwright.dev.
 *
 * Language Switcher note:
 *   The language selector is a Docusaurus "dropdown--hover-able" element.
 *   The individual language links are hidden inside a <ul class="dropdown__menu">
 *   that only becomes visible when the trigger anchor is hovered.
 *   All switchLanguage() / assertLanguageLinksVisible() calls hover the
 *   trigger first before interacting with the menu items.
 */
export class PD_NavbarComponent extends BaseComponent {
  // -- Core nav elements -------------------------------------------------------
  readonly brandLogo: Locator;
  readonly githubLink: Locator;
  readonly searchButton: Locator;
  readonly themeToggle: Locator;

  // -- Language dropdown -------------------------------------------------------
  readonly languageDropdownTrigger: Locator;
  readonly languageDropdownMenu: Locator;
  readonly nodeLink: Locator;
  readonly pythonLink: Locator;
  readonly javaLink: Locator;
  readonly dotnetLink: Locator;

  constructor(page: Page) {
    super(page, page.locator('nav.navbar'));

    this.brandLogo    = this.root.locator('a.navbar__brand');
    this.githubLink   = this.root.getByRole('link', { name: /github/i });
    this.searchButton = this.root.getByLabel(/search/i);
    this.themeToggle  = this.root.getByRole('button', { name: /switch between dark and light/i });

    const dropdown               = this.root.locator('.navbar__item.dropdown');
    this.languageDropdownTrigger = dropdown.locator('a.navbar__link').first();
    this.languageDropdownMenu    = dropdown.locator('ul.dropdown__menu');

    this.nodeLink   = this.languageDropdownMenu.getByRole('link', { name: 'Node.js' });
    this.pythonLink = this.languageDropdownMenu.getByRole('link', { name: 'Python' });
    this.javaLink   = this.languageDropdownMenu.getByRole('link', { name: 'Java' });
    this.dotnetLink = this.languageDropdownMenu.getByRole('link', { name: '.NET' });
  }

  // -- Private helpers ---------------------------------------------------------
  private async openLanguageDropdown(): Promise<void> {
    await this.languageDropdownTrigger.hover();
    await this.languageDropdownMenu.waitFor({ state: 'visible' });
  }

  // -- Queries -----------------------------------------------------------------
  async getBrandHref(): Promise<string | null> {
    return this.brandLogo.getAttribute('href');
  }

  async getThemeToggleLabel(): Promise<string | null> {
    return this.themeToggle.getAttribute('aria-label');
  }

  async getCurrentLanguageLabel(): Promise<string> {
    return (await this.languageDropdownTrigger.textContent() ?? '').trim();
  }

  // -- Actions -----------------------------------------------------------------
  async clickBrand(): Promise<void> {
    await this.brandLogo.click();
  }

  async clickThemeToggle(): Promise<void> {
    await this.themeToggle.click();
  }

  /**
   * Switch to a language by hovering the dropdown trigger first to reveal
   * the menu, then click the dropdown menu. */
  async switchLanguage(lang: 'Node.js' | 'Python' | 'Java' | '.NET'): Promise<void> {
    await this.openLanguageDropdown();
    const map: Record<string, Locator> = {
      'Node.js': this.nodeLink,
      Python:    this.pythonLink,
      Java:      this.javaLink,
      '.NET':    this.dotnetLink,
    };
    await map[lang].click();
    await this.page.waitForLoadState('domcontentloaded');
  }

  // -- Assertions --------------------------------------------------------------
  async assertFullyRendered(): Promise<void> {
    await expect(this.root).toBeVisible();
    await expect(this.brandLogo).toBeVisible();
    await expect(this.githubLink).toBeVisible();
    await expect(this.searchButton).toBeVisible();
    await expect(this.languageDropdownTrigger).toBeVisible();
  }

  async assertLanguageLinksVisible(): Promise<void> {
    await this.openLanguageDropdown();
    await expect(this.nodeLink).toBeVisible();
    await expect(this.pythonLink).toBeVisible();
    await expect(this.javaLink).toBeVisible();
    await expect(this.dotnetLink).toBeVisible();
  }

  async assertThemeToggleVisible(): Promise<void> {
    await expect(this.themeToggle).toBeVisible();
  }

  async assertThemeToggleMode(expectedMode: 'light' | 'dark'): Promise<void> {
    const label = await this.getThemeToggleLabel();
    expect(label?.toLowerCase()).toContain(expectedMode);
  }
}
