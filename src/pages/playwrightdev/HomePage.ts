import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from '../BasePage.js';

/**
 * HomePage
 * ─────────────────────────────────────────────────────────────────────────────
 * Represents the Playwright documentation home page (https://playwright.dev).
 * Encapsulates all locators and interactions for the landing page.
 */
export class HomePage extends BasePage {
  // ── Locators ────────────────────────────────────────────────────────────────
  readonly getStartedButton: Locator;
  readonly searchButton: Locator;
  readonly searchInput: Locator;
  readonly navbar: Locator;
  readonly heroTitle: Locator;
  readonly themeToggle: Locator;
  readonly githubLink: Locator;
  readonly nodeLink: Locator;
  readonly pythonLink: Locator;
  readonly javaLink: Locator;
  readonly dotnetLink: Locator;

  constructor(page: Page) {
    super(page);

    this.getStartedButton = page.getByRole('link', { name: 'Get started' }).first();
    this.searchButton = page.getByLabel('Search');
    this.searchInput = page.getByPlaceholder('Search docs');
    this.navbar = page.getByRole('navigation');
    this.heroTitle = page.getByRole('heading', { name: /Playwright/ }).first();
    this.themeToggle = page.getByLabel(/Toggle (dark|light) mode/);
    this.githubLink = page.getByRole('link', { name: 'GitHub' }).first();
    this.nodeLink = page.getByRole('link', { name: 'Node.js' });
    this.pythonLink = page.getByRole('link', { name: 'Python' });
    this.javaLink = page.getByRole('link', { name: 'Java' });
    this.dotnetLink = page.getByRole('link', { name: '.NET' });
  }

  // ── Navigation ──────────────────────────────────────────────────────────────

  async goto(): Promise<void> {
    await this.page.goto('/');
    await this.waitForPageLoad();
  }

  async waitForPageLoad(): Promise<void> {
    await this.heroTitle.waitFor({ state: 'visible' });
  }

  // ── Actions ─────────────────────────────────────────────────────────────────

  /**
   * Click the "Get started" CTA button.
   */
  async clickGetStarted(): Promise<void> {
    await this.getStartedButton.click();
  }

  /**
   * Open the search modal and type a query.
   */
  async searchFor(query: string): Promise<void> {
    await this.searchButton.click();
    await this.searchInput.waitFor({ state: 'visible' });
    await this.searchInput.fill(query);
  }

  /**
   * Toggle between light and dark mode.
   */
  async toggleTheme(): Promise<void> {
    await this.themeToggle.click();
  }

  /**
   * Switch to a language tab (Node.js, Python, Java, .NET).
   */
  async switchLanguage(language: 'Node.js' | 'Python' | 'Java' | '.NET'): Promise<void> {
    const linkMap = {
      'Node.js': this.nodeLink,
      Python: this.pythonLink,
      Java: this.javaLink,
      '.NET': this.dotnetLink,
    };
    await linkMap[language].click();
  }

  // ── Assertions ──────────────────────────────────────────────────────────────

  /**
   * Assert the page has loaded with core elements visible.
   */
  async assertPageLoaded(): Promise<void> {
    await expect(this.heroTitle).toBeVisible();
    await expect(this.getStartedButton).toBeVisible();
    await expect(this.navbar).toBeVisible();
  }

  /**
   * Assert the page title contains expected text.
   */
  async assertTitle(expectedTitle: string): Promise<void> {
    await expect(this.page).toHaveTitle(new RegExp(expectedTitle, 'i'));
  }
}