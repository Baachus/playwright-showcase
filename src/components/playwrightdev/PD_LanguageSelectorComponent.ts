import { Page, Locator, expect } from '@playwright/test';
import { BaseComponent } from '../BaseComponent.js';

/**
 * PD_LanguageSelectorComponent
 * ---------------------------------------------------------------------------
 * Models the "Node.js / Python / Java / .NET" language switcher dropdown
 * that lives inside the navbar on playwright.dev.
 *
 * The selector is a Docusaurus "dropdown--hoverable" element:
 *   - A trigger anchor shows the current language and is always visible.
 *   - Hovering the trigger reveals a <ul class="dropdown__menu"> with all
 *     four language options as links.
 *
 * All select* methods hover the trigger before clicking, and all assertion
 * helpers that check menu items also hover first.
 */
export class PD_LanguageSelectorComponent extends BaseComponent {
  // The visible trigger (always in DOM, shows current language)
  readonly dropdownTrigger: Locator;
  // The menu revealed on hover
  readonly dropdownMenu: Locator;
  // Individual options inside the menu
  readonly nodeTab: Locator;
  readonly pythonTab: Locator;
  readonly javaTab: Locator;
  readonly dotnetTab: Locator;

  constructor(page: Page) {
    super(page, page.locator('nav.navbar .navbar__item.dropdown'));

    this.dropdownTrigger = this.root.locator('a.navbar__link').first();
    this.dropdownMenu    = this.root.locator('ul.dropdown__menu');

    this.nodeTab   = this.dropdownMenu.getByRole('link', { name: 'Node.js' });
    this.pythonTab = this.dropdownMenu.getByRole('link', { name: 'Python' });
    this.javaTab   = this.dropdownMenu.getByRole('link', { name: 'Java' });
    this.dotnetTab = this.dropdownMenu.getByRole('link', { name: '.NET' });
  }

  // ── Private helpers ──────────────────────────────────────────────────────────

  /** Hover the trigger to open the dropdown menu. */
  private async openDropdown(): Promise<void> {
    await this.dropdownTrigger.hover();
    await this.dropdownMenu.waitFor({ state: 'visible' });
  }

  // ── Queries ──────────────────────────────────────────────────────────────────

  /**
   * Returns the label of the currently active language by inspecting the URL.
   * Node.js is the default (no URL prefix).
   */
  async getActiveLanguage(): Promise<string> {
    const url = this.page.url();
    if (url.includes('/python/'))  return 'Python';
    if (url.includes('/java/'))    return 'Java';
    if (url.includes('/dotnet/'))  return '.NET';
    return 'Node.js';
  }

  /**
   * Returns the visible label on the trigger button (e.g. "Node.js").
   */
  async getTriggerLabel(): Promise<string> {
    return (await this.dropdownTrigger.textContent() ?? '').trim();
  }

  /**
   * Opens the dropdown and returns all four option labels as strings.
   */
  async getTabLabels(): Promise<string[]> {
    await this.openDropdown();
    return this.dropdownMenu.getByRole('link').allTextContents();
  }

  // ── Actions ──────────────────────────────────────────────────────────────────

  /** Hover the trigger to reveal the menu, then select Node.js. */
  async selectNodeJs(): Promise<void> {
    await this.openDropdown();
    await this.nodeTab.click();
    await this.page.waitForLoadState('domcontentloaded');
  }

  /** Hover the trigger to reveal the menu, then select Python. */
  async selectPython(): Promise<void> {
    await this.openDropdown();
    await this.pythonTab.click();
    await this.page.waitForLoadState('domcontentloaded');
  }

  /** Hover the trigger to reveal the menu, then select Java. */
  async selectJava(): Promise<void> {
    await this.openDropdown();
    await this.javaTab.click();
    await this.page.waitForLoadState('domcontentloaded');
  }

  /** Hover the trigger to reveal the menu, then select .NET. */
  async selectDotnet(): Promise<void> {
    await this.openDropdown();
    await this.dotnetTab.click();
    await this.page.waitForLoadState('domcontentloaded');
  }

  // ── Assertions ───────────────────────────────────────────────────────────────

  /** Assert the dropdown trigger is visible (always in DOM). */
  async assertTriggerVisible(): Promise<void> {
    await expect(this.dropdownTrigger).toBeVisible();
  }

  /**
   * Open the dropdown and assert all four language options are present
   * inside the revealed menu.
   */
  async assertAllTabsVisible(): Promise<void> {
    await this.openDropdown();
    await expect(this.nodeTab).toBeVisible();
    await expect(this.pythonTab).toBeVisible();
    await expect(this.javaTab).toBeVisible();
    await expect(this.dotnetTab).toBeVisible();
  }
}
