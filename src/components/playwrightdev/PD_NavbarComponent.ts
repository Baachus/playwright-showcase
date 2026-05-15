import { Page, Locator, expect } from '@playwright/test';
import { BaseComponent } from '../BaseComponent.js';

/**
 * PD_NavbarComponent
 * ---------------------------------------------------------------------------
 * Encapsulates the top navigation bar on every page of playwright.dev.
 *
 * Language Switcher note:
 *   The language selector is a Docusaurus "dropdown--hoverable" element.
 *   The individual language links are hidden inside a <ul class="dropdown__menu">
 *   that only becomes visible when the trigger anchor is hovered.
 *   All switchLanguage() / assertLanguageLinksVisible() calls hover the
 *   trigger first before interacting with the menu items.
 */
export class PD_NavbarComponent extends BaseComponent {
  // ── Core nav elements ────────────────────────────────────────────────────────
  readonly brandLogo: Locator;
  readonly githubLink: Locator;
  readonly searchButton: Locator;
  readonly themeToggle: Locator;

  // ── Language dropdown ────────────────────────────────────────────────────────
  // The visible trigger that the user hovers to open the menu.
  readonly languageDropdownTrigger: Locator;
  // The hidden menu revealed on hover.
  readonly languageDropdownMenu: Locator;
  // Individual language options inside the menu.
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

    // The dropdown wrapper scoped to navbar
    const dropdown         = this.root.locator('.navbar__item.dropdown');
    this.languageDropdownTrigger = dropdown.locator('a.navbar__link').first();
    this.languageDropdownMenu    = dropdown.locator('ul.dropdown__menu');

    // Menu items -- only visible after hovering the trigger
    this.nodeLink   = this.languageDropdownMenu.getByRole('link', { name: 'Node.js' });
    this.pythonLink = this.languageDropdownMenu.getByRole('link', { name: 'Python' });
    this.javaLink   = this.languageDropdownMenu.getByRole('link', { name: 'Java' });
    this.dotnetLink = this.languageDropdownMenu.getByRole('link', { name: '.NET' });
  }

  // ── Private helpers ──────────────────────────────────────────────────────────

  /** Hover the dropdown trigger so the language menu becomes visible. */
  private async openLanguageDropdown(): Promise<void> {
    await this.languageDropdownTrigger.hover();
    await this.languageDropdownMenu.waitFor({ state: 'visible' });
  }

  // ── Queries ──────────────────────────────────────────────────────────────────

  /** Returns the resolved href of the brand logo anchor. */
  async getBrandHref(): Promise<string | null> {
    return this.brandLogo.getAttribute('href');
  }

  /** Returns the current aria-label of the theme toggle button. */
  async getThemeToggleLabel(): Promise<string | null> {
    return this.themeToggle.getAttribute('aria-label');
  }

  /** Returns the visible label on the language dropdown trigger (e.g. "Node.js"). */
  async getCurrentLanguageLabel(): Promise<string> {
    return (await this.languageDropdownTrigger.textContent() ?? '').trim();
  }

  // ── Actions ──────────────────────────────────────────────────────────────────

  /** Click the brand logo to return to the home page. */
  async clickBrand(): Promise<void> {
    await this.brandLogo.click();
  }

  /** Click the theme toggle to switch between light and dark mode. */
  async clickThemeToggle(): Promise<void> {
    await this.themeToggle.click();
  }

  /**
   * Switch to a language by hovering the dropdown trigger first to reveal
   * the menu, then clicking the appropriate option.
   */
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

  // ── Assertions ───────────────────────────────────────────────────────────────

  /** Assert that all primary nav elements are present and visible. */
  async assertFullyRendered(): Promise<void> {
    await expect(this.root).toBeVisible();
    await expect(this.brandLogo).toBeVisible();
    await expect(this.githubLink).toBeVisible();
    await expect(this.searchButton).toBeVisible();
    await expect(this.languageDropdownTrigger).toBeVisible();
  }

  /**
   * Assert that all four language options are present in the dropdown menu.
   * Hovers the trigger first to reveal the menu.
   */
  async assertLanguageLinksVisible(): Promise<void> {
    await this.openLanguageDropdown();
    await expect(this.nodeLink).toBeVisible();
    await expect(this.pythonLink).toBeVisible();
    await expect(this.javaLink).toBeVisible();
    await expect(this.dotnetLink).toBeVisible();
  }

  /** Assert that the theme toggle button is visible. */
  async assertThemeToggleVisible(): Promise<void> {
    await expect(this.themeToggle).toBeVisible();
  }

  /**
   * Assert that the theme toggle label matches the expected mode.
   * Pass 'dark' to confirm the current mode is light (toggle switches to dark).
   */
  async assertThemeToggleMode(expected: 'dark' | 'light'): Promise<void> {
    await expect(this.themeToggle).toHaveAttribute('aria-label', new RegExp(expected, 'i'));
  }
}
