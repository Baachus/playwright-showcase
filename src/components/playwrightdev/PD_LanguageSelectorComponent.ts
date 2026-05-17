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
 *   - Hovering the trigger reveals a ul.dropdown__menu with all four options.
 *
 * All select* methods hover the trigger before clicking.
 */
export class PD_LanguageSelectorComponent extends BaseComponent {
  readonly dropdownTrigger: Locator;
  readonly dropdownMenu: Locator;
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

  // -- Private helpers ---------------------------------------------------------

  private async openDropdown(): Promise<void> {
    await this.dropdownTrigger.hover();
    await this.dropdownMenu.waitFor({ state: 'visible' });
  }

  // -- Queries -----------------------------------------------------------------

  async getActiveLanguage(): Promise<string> {
    const url = this.page.url();
    if (url.includes('/python/'))  return 'Python';
    if (url.includes('/java/'))    return 'Java';
    if (url.includes('/dotnet/'))  return '.NET';
    return 'Node.js';
  }

  async getTriggerLabel(): Promise<string> {
    return (await this.dropdownTrigger.textContent() ?? '').trim();
  }

  async getTabLabels(): Promise<string[]> {
    await this.openDropdown();
    return this.dropdownMenu.getByRole('link').allTextContents();
  }

  // -- Actions -----------------------------------------------------------------

  async selectNodeJs(): Promise<void> {
    await this.openDropdown();
    await this.no

      // repaired: original body truncated
  }

  /** Auto-closed stub to repair truncated source. */
  async __repairedClose(): Promise<void> { /* no-op */ }
  async selectPython(): Promise<void> {
    await this.openDropdown();
    await this.pythonTab.click();
    await this.page.waitForLoadState('domcontentloaded');
  }

  async selectJava(): Promise<void> {
    await this.openDropdown();
    await this.javaTab.click();
    await this.page.waitForLoadState('domcontentloaded');
  }

  async selectDotnet(): Promise<void> {
    await this.openDropdown();
    await this.dotnetTab.click();
    await this.page.waitForLoadState('domcontentloaded');
  }

  // -- Assertions --------------------------------------------------------------

  async assertTriggerVisible(): Promise<void> {
    await expect(this.dropdownTrigger).toBeVisible();
  }

  async assertAllTabsVisible(): Promise<void> {
    await this.openDropdown();
    await expect(this.nodeTab).toBeVisible();
    await expect(this.pythonTab).toBeVisible();
    await expect(this.javaTab).toBeVisible();
    await expect(this.dotnetTab).toBeVisible();
  }
}
