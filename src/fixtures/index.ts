import { test as base, expect, BrowserContext, Page } from '@playwright/test';
// Playwright.dev - Pages
import { PD_HomePage } from '../pages/playwrightdev/PD_HomePage.js';
import { PD_DocsPage } from '../pages/playwrightdev/PD_DocsPage.js';
// Playwright.dev - Components
import { PD_NavbarComponent } from '../components/playwrightdev/PD_NavbarComponent.js';
import { PD_SearchComponent } from '../components/playwrightdev/PD_SearchComponent.js';
import { PD_CodeBlockComponent } from '../components/playwrightdev/PD_CodeBlockComponent.js';
import { PD_LanguageSelectorComponent } from '../components/playwrightdev/PD_LanguageSelectorComponent.js';
import { PD_FooterComponent } from '../components/playwrightdev/PD_FooterComponent.js';
// The Internet - Pages
import { TI_ABTestPage } from '../pages/the-internet/TI_ABTestPage.js';
import { TI_AddRemovePage } from '@pages/the-internet/TI_AddRemovePage.js';
import { TI_BasicAuthPage } from '@pages/the-internet/TI_BasicAuthPage.js';
import { TI_BrokenImagesPage } from '@pages/the-internet/TI_BrokenImagesPage.js';
import { TI_ChallengingDomPage } from '@pages/the-internet/TI_ChallengingDomPage.js';
import { TI_CheckboxesPage } from '@pages/the-internet/TI_CheckboxesPage.js';
import { TI_ContextMenuPage } from '@pages/the-internet/TI_ContextMenuPage.js';
import { TI_DigestAuthPage } from '@pages/the-internet/TI_DigestAuthPage.js';
import { TI_DisappearingElementsPage } from '@pages/the-internet/TI_DisappearingElementsPage.js';
import { TI_DragAndDropPage } from '@pages/the-internet/TI_DragAndDropPage.js';
import { TI_DropdownPage } from '@pages/the-internet/TI_DropdownPage.js';
import { TI_DynamicContentPage } from '@pages/the-internet/TI_DynamicContentPage.js';
import { TI_DynamicControlsPage } from '@pages/the-internet/TI_DynamicControlsPage.js';
import { TI_DynamicLoadingPage } from '@pages/the-internet/TI_DynamicLoadingPage.js';
import { TI_EntryAdPage } from '@pages/the-internet/TI_EntryAdPage.js';
import { TI_ExitIntentPage } from '@pages/the-internet/TI_ExitIntentPage.js';
import { TI_FileDownloadPage } from '@pages/the-internet/TI_FileDownloadPage.js';
import { TI_FileUploadPage } from '@pages/the-internet/TI_FileUploadPage.js';
import { TI_FloatingMenuPage } from '@pages/the-internet/TI_FloatingMenuPage.js';
import { TI_ForgotPasswordPage } from '@pages/the-internet/TI_ForgotPasswordPage.js';
import { TI_FormAuthenticationPage } from '@pages/the-internet/TI_FormAuthenticationPage.js';
import { TI_GeolocationPage } from '@pages/the-internet/TI_GeolocationPage.js';
import { TI_HorizontalSliderPage } from '@pages/the-internet/TI_HorizontalSliderPage.js';
import { TI_HoversPage } from '@pages/the-internet/TI_HoversPage.js';
import { TI_IFramePage } from '@pages/the-internet/TI_IFramePage.js';
import { TI_InfiniteScrollPage } from '@pages/the-internet/TI_InfiniteScrollPage.js';
import { TI_InputsPage } from '@pages/the-internet/TI_InputsPage.js';
import { TI_JavaScriptAlertsPage } from '@pages/the-internet/TI_JavaScriptAlertsPage.js';
import { TI_JavaScriptErrorPage } from '@pages/the-internet/TI_JavaScriptErrorPage.js';
import { TI_JQueryUIMenuPage } from '@pages/the-internet/TI_JQueryUIMenuPage.js';
import { TI_KeyPressesPage } from '@pages/the-internet/TI_KeyPressesPage.js';
import { TI_LargeDeepDomPage } from '@pages/the-internet/TI_LargeDeepDomPage.js';
import { TI_MultipleWindowsPage } from '@pages/the-internet/TI_MultipleWindowsPage.js';
import { TI_NestedFramesPage } from '@pages/the-internet/TI_NestedFramesPage.js';
import { TI_NotificationMessagesPage } from '@pages/the-internet/TI_NotificationMessagesPage.js';
import { TI_RedirectLinkPage } from '@pages/the-internet/TI_RedirectLinkPage.js';
import { TI_SecureFileDownloadPage } from '@pages/the-internet/TI_SecureFileDownloadPage.js';
import { TI_ShadowDomPage } from '@pages/the-internet/TI_ShadowDomPage.js';
import { TI_ShiftingContentPage } from '@pages/the-internet/TI_ShiftingContentPage.js';
import { TI_SlowResourcesPage } from '@pages/the-internet/TI_SlowResourcesPage.js';
import { TI_SortableDataTablesPage } from '@pages/the-internet/TI_SortableDataTablesPage.js';
import { TI_StatusCodesPage } from '@pages/the-internet/TI_StatusCodesPage.js';
import { TI_TyposPage } from '@pages/the-internet/TI_TyposPage.js';
import { TI_WYSIWYGEditorPage } from '@pages/the-internet/TI_WYSIWYGEditorPage.js';
// Saucedemo - Pages
import { SD_LoginPage } from '../pages/saucedemo/SD_LoginPage.js';
import { SD_InventoryPage } from '../pages/saucedemo/SD_InventoryPage.js';
import { SD_CartPage } from '@pages/saucedemo/SD_CartPage.js';
import { SD_ConfirmationPage } from '@pages/saucedemo/checkout/SD_ConfirmationPage.js';
import { SD_InfoPage } from '@pages/saucedemo/checkout/SD_InfoPage.js';
import { SD_VerificationPage } from '@pages/saucedemo/checkout/SD_VerificationPage.js';
// Multi-context utilities
import { MultiContextHelper } from '../utils/multi-context.utils.js';
import { getSaucedemoAuthFile, SD_PASSWORD } from '../utils/authentication.utils.js';
// WebSocket utilities
import { startLocalEchoServer, type LocalEchoServer } from '../utils/websocket.utils.js';
// Email - Pages
import { LocalEmailAppPage } from '../pages/email/LocalEmailAppPage.js';
import { MailpitInboxPage } from '../pages/mailpit/MailpitInboxPage.js';
import { mintInboxName, inboxToAddress } from '../utils/email.utils.js';

/**
 * Custom Fixtures
 * ---------------------------------------------------------------------------
 * Extends Playwright's base `test` with pre-instantiated Page Object Models,
 * Component Object Models, and multi-context helpers.
 * Tests import `{ test, expect }` from this file instead of `@playwright/test`.
 */

type MultiContextFixtures = {
  sd_multiContextHelper: MultiContextHelper;
  sd_tab2: Page;
  sd_standard_ctx: { context: BrowserContext; page: Page; inventoryPage: SD_InventoryPage };
  sd_problem_ctx: { context: BrowserContext; page: Page; inventoryPage: SD_InventoryPage };
  sd_glitch_ctx: { context: BrowserContext; page: Page; inventoryPage: SD_InventoryPage };
  sd_unauth_ctx: { context: BrowserContext; page: Page; loginPage: SD_LoginPage };
};

type PageFixtures = {
  // The Internet - Pages
  ti_abTestPage: TI_ABTestPage;
  ti_addRemovePage: TI_AddRemovePage;
  ti_basicAuthPage: TI_BasicAuthPage;
  ti_brokenImagePage: TI_BrokenImagesPage;
  ti_challengingDomPage: TI_ChallengingDomPage;
  ti_checkboxesPage: TI_CheckboxesPage;
  ti_contextMenuPage: TI_ContextMenuPage;
  ti_digestAuthPage: TI_DigestAuthPage;
  ti_disappearingElementsPage: TI_DisappearingElementsPage;
  ti_dragAndDropPage: TI_DragAndDropPage;
  ti_dropdownPage: TI_DropdownPage;
  ti_dynamicContentPage: TI_DynamicContentPage;
  ti_dynamicControlsPage: TI_DynamicControlsPage;
  ti_dynamicLoadingPage: TI_DynamicLoadingPage;
  ti_entryAdPage: TI_EntryAdPage;
  ti_exitIntentPage: TI_ExitIntentPage;
  ti_fileDownloadPage: TI_FileDownloadPage;
  ti_fileUploadPage: TI_FileUploadPage;
  ti_floatingMenuPage: TI_FloatingMenuPage;
  ti_forgotPasswordPage: TI_ForgotPasswordPage;
  ti_formAuthenticationPage: TI_FormAuthenticationPage;
  ti_geolocationPage: TI_GeolocationPage;
  ti_horizontalSliderPage: TI_HorizontalSliderPage;
  ti_hoversPage: TI_HoversPage;
  ti_iFramePage: TI_IFramePage;
  ti_infiniteScrollPage: TI_InfiniteScrollPage;
  ti_inputsPage: TI_InputsPage;
  ti_javaScriptAlertsPage: TI_JavaScriptAlertsPage;
  ti_javaScriptErrorPage: TI_JavaScriptErrorPage;
  ti_jQueryUIMenuPage: TI_JQueryUIMenuPage;
  ti_keyPressesPage: TI_KeyPressesPage;
  ti_largeDeepDomPage: TI_LargeDeepDomPage;
  ti_multipleWindowsPage: TI_MultipleWindowsPage;
  ti_nestedFramesPage: TI_NestedFramesPage;
  ti_notificationMessagesPage: TI_NotificationMessagesPage;
  ti_redirectLinkPage: TI_RedirectLinkPage;
  ti_secureFileDownloadPage: TI_SecureFileDownloadPage;
  ti_shadowDomPage: TI_ShadowDomPage;
  ti_shiftingContentPage: TI_ShiftingContentPage;
  ti_slowResourcesPage: TI_SlowResourcesPage;
  ti_sortableDataTablesPage: TI_SortableDataTablesPage;
  ti_statusCodesPage: TI_StatusCodesPage;
  ti_typosPage: TI_TyposPage;
  ti_wysiwygEditorPage: TI_WYSIWYGEditorPage;
  // Playwright.dev - Pages
  pd_homePage: PD_HomePage;
  pd_docsPage: PD_DocsPage;
  // Playwright.dev - Components
  pd_navbar: PD_NavbarComponent;
  pd_search: PD_SearchComponent;
  pd_codeBlock: PD_CodeBlockComponent;
  pd_languageSelector: PD_LanguageSelectorComponent;
  pd_footer: PD_FooterComponent;
  // Saucedemo - Standard pages
  sd_inventoryPage: SD_InventoryPage;
  sd_loginPage: SD_LoginPage;
  sd_cartPage: SD_CartPage;
  sd_confirmationPage: SD_ConfirmationPage;
  sd_infoPage: SD_InfoPage;
  sd_verificationPage: SD_VerificationPage;
  // WebSocket
  echoServer: LocalEchoServer;

  // Email -- local sender app + Mailpit capture server
  /** A unique mailbox local-part minted per test (no collisions). */
  emailInbox: string;
  /** Full recipient address derived from `emailInbox`. */
  emailAddress: string;
  /** Page Object for the local email-sender helper service. */
  emailApp: LocalEmailAppPage;
  /** REST reader for the Mailpit mailbox scoped to `emailAddress`. */
  mailpitInbox: MailpitInboxPage;
} & MultiContextFixtures;

/**
 * Self-healing auth guard for the multi-context Saucedemo fixtures.
 *
 * The sd_*_ctx fixtures load a storageState produced by the
 * setup-saucedemo-multiuser project. If that state is missing or stale -- or a
 * starved CI worker lets the saved session expire -- navigating straight to
 * /inventory.html silently renders the login form instead, so a blind
 * waitFor(inventory-container) would hang for the full 30s timeout. This guard
 * detects that case and logs in explicitly, mirroring the pattern already used
 * in tests/websocket/saucedemo/ws-mock.spec.ts.
 */
export async function ensureSaucedemoInventory(page: Page, username: string): Promise<void> {
  await page.goto('https://www.saucedemo.com/inventory.html');
  const authed = await page
    .locator('[data-test="inventory-container"]')
    .waitFor({ state: 'visible', timeout: 5000 })
    .then(() => true)
    .catch(() => false);
  if (!authed) {
    await page.locator('[data-test="username"]').fill(username);
    await page.locator('[data-test="password"]').fill(SD_PASSWORD);
    await page.locator('[data-test="login-button"]').click();
    await page.waitForURL(/inventory/);
  }
}

export const test = base.extend<PageFixtures>({
  // ── The Internet ─────────────────────────────────────────────────────────────
  ti_abTestPage: async ({ page }, use) => {
    const p = new TI_ABTestPage(page); await p.goto(); await use(p);
  },
  ti_addRemovePage: async ({ page }, use) => {
    const p = new TI_AddRemovePage(page); await p.goto(); await use(p);
  },
  ti_basicAuthPage: async ({ page }, use) => {
    await use(new TI_BasicAuthPage(page));
  },
  ti_brokenImagePage: async ({ page }, use) => {
    await use(new TI_BrokenImagesPage(page));
  },
  ti_challengingDomPage: async ({ page }, use) => {
    const p = new TI_ChallengingDomPage(page); await p.goto(); await use(p);
  },
  ti_checkboxesPage: async ({ page }, use) => {
    const p = new TI_CheckboxesPage(page); await p.goto(); await use(p);
  },
  ti_contextMenuPage: async ({ page }, use) => {
    const p = new TI_ContextMenuPage(page); await p.goto(); await use(p);
  },
  ti_digestAuthPage: async ({ page }, use) => {
    await use(new TI_DigestAuthPage(page));
  },
  ti_disappearingElementsPage: async ({ page }, use) => {
    const p = new TI_DisappearingElementsPage(page); await p.goto(); await use(p);
  },
  ti_dragAndDropPage: async ({ page }, use) => {
    const p = new TI_DragAndDropPage(page); await p.goto(); await use(p);
  },
  ti_dropdownPage: async ({ page }, use) => {
    const p = new TI_DropdownPage(page); await p.goto(); await use(p);
  },
  ti_dynamicContentPage: async ({ page }, use) => {
    const p = new TI_DynamicContentPage(page); await p.goto(); await use(p);
  },
  ti_dynamicControlsPage: async ({ page }, use) => {
    const p = new TI_DynamicControlsPage(page); await p.goto(); await use(p);
  },
  ti_dynamicLoadingPage: async ({ page }, use) => {
    const p = new TI_DynamicLoadingPage(page); await p.goto(); await use(p);
  },
  ti_entryAdPage: async ({ page }, use) => {
    const p = new TI_EntryAdPage(page); await p.goto(); await use(p);
  },
  ti_exitIntentPage: async ({ page }, use) => {
    const p = new TI_ExitIntentPage(page); await p.goto(); await use(p);
  },
  ti_fileDownloadPage: async ({ page }, use) => {
    const p = new TI_FileDownloadPage(page); await p.goto(); await use(p);
  },
  ti_fileUploadPage: async ({ page }, use) => {
    const p = new TI_FileUploadPage(page); await p.goto(); await use(p);
  },
  ti_floatingMenuPage: async ({ page }, use) => {
    const p = new TI_FloatingMenuPage(page); await p.goto(); await use(p);
  },
  ti_forgotPasswordPage: async ({ page }, use) => {
    const p = new TI_ForgotPasswordPage(page); await p.goto(); await use(p);
  },
  ti_formAuthenticationPage: async ({ page }, use) => {
    const p = new TI_FormAuthenticationPage(page); await p.goto(); await use(p);
  },
  ti_geolocationPage: async ({ page }, use) => {
    const p = new TI_GeolocationPage(page); await p.goto(); await use(p);
  },
  ti_horizontalSliderPage: async ({ page }, use) => {
    const p = new TI_HorizontalSliderPage(page); await p.goto(); await use(p);
  },
  ti_hoversPage: async ({ page }, use) => {
    const p = new TI_HoversPage(page); await p.goto(); await use(p);
  },
  ti_iFramePage: async ({ page }, use) => {
    const p = new TI_IFramePage(page); await p.goto(); await use(p);
  },
  ti_infiniteScrollPage: async ({ page }, use) => {
    const p = new TI_InfiniteScrollPage(page); await p.goto(); await use(p);
  },
  ti_inputsPage: async ({ page }, use) => {
    const p = new TI_InputsPage(page); await p.goto(); await use(p);
  },
  ti_javaScriptAlertsPage: async ({ page }, use) => {
    const p = new TI_JavaScriptAlertsPage(page); await p.goto(); await use(p);
  },
  ti_javaScriptErrorPage: async ({ page }, use) => {
    const p = new TI_JavaScriptErrorPage(page); await p.goto(); await use(p);
  },
  ti_jQueryUIMenuPage: async ({ page }, use) => {
    const p = new TI_JQueryUIMenuPage(page); await p.goto(); await use(p);
  },
  ti_keyPressesPage: async ({ page }, use) => {
    const p = new TI_KeyPressesPage(page); await p.goto(); await use(p);
  },
  ti_largeDeepDomPage: async ({ page }, use) => {
    const p = new TI_LargeDeepDomPage(page); await p.goto(); await use(p);
  },
  ti_multipleWindowsPage: async ({ page }, use) => {
    const p = new TI_MultipleWindowsPage(page); await p.goto(); await use(p);
  },
  ti_nestedFramesPage: async ({ page }, use) => {
    const p = new TI_NestedFramesPage(page); await p.goto(); await use(p);
  },
  ti_notificationMessagesPage: async ({ page }, use) => {
    const p = new TI_NotificationMessagesPage(page); await p.goto(); await use(p);
  },
  ti_redirectLinkPage: async ({ page }, use) => {
    const p = new TI_RedirectLinkPage(page); await p.goto(); await use(p);
  },
  ti_secureFileDownloadPage: async ({ page }, use) => {
    await use(new TI_SecureFileDownloadPage(page));
  },
  ti_shadowDomPage: async ({ page }, use) => {
    const p = new TI_ShadowDomPage(page); await p.goto(); await use(p);
  },
  ti_shiftingContentPage: async ({ page }, use) => {
    const p = new TI_ShiftingContentPage(page); await p.goto(); await use(p);
  },
  ti_slowResourcesPage: async ({ page }, use) => {
    const p = new TI_SlowResourcesPage(page); await p.goto(); await use(p);
  },
  ti_sortableDataTablesPage: async ({ page }, use) => {
    const p = new TI_SortableDataTablesPage(page); await p.goto(); await use(p);
  },
  ti_statusCodesPage: async ({ page }, use) => {
    const p = new TI_StatusCodesPage(page); await p.goto(); await use(p);
  },
  ti_typosPage: async ({ page }, use) => {
    const p = new TI_TyposPage(page); await p.goto(); await use(p);
  },
  ti_wysiwygEditorPage: async ({ page }, use) => {
    const p = new TI_WYSIWYGEditorPage(page); await p.goto(); await use(p);
  },

  // ── Playwright.dev - Pages ───────────────────────────────────────────────────
  pd_homePage: async ({ page }, use) => {
    const p = new PD_HomePage(page); await p.goto(); await use(p);
  },
  pd_docsPage: async ({ page }, use) => {
    const p = new PD_DocsPage(page); await p.goto(); await use(p);
  },

  // ── Playwright.dev - Components ──────────────────────────────────────────────
  pd_navbar: async ({ page }, use) => {
    await page.goto('/'); await page.waitForLoadState('domcontentloaded');
    const c = new PD_NavbarComponent(page); await c.waitForVisible(); await use(c);
  },
  pd_search: async ({ page }, use) => {
    await page.goto('/'); await page.waitForLoadState('domcontentloaded');
    await use(new PD_SearchComponent(page));
  },
  pd_codeBlock: async ({ page }, use) => {
    await page.goto('/docs/intro'); await page.waitForLoadState('domcontentloaded');
    await use(new PD_CodeBlockComponent(page, 0));
  },
  pd_languageSelector: async ({ page }, use) => {
    await page.goto('/'); await page.waitForLoadState('domcontentloaded');
    const c = new PD_LanguageSelectorComponent(page); await c.waitForVisible(); await use(c);
  },
  pd_footer: async ({ page }, use) => {
    await page.goto('/'); await page.waitForLoadState('domcontentloaded');
    await use(new PD_FooterComponent(page));
  },

  // ── Saucedemo - Standard pages ───────────────────────────────────────────────
  sd_inventoryPage: async ({ page }, use) => {
    const p = new SD_InventoryPage(page); await p.goto(); await use(p);
  },
  sd_loginPage: async ({ page }, use) => {
    const p = new SD_LoginPage(page); await p.goto(); await use(p);
  },
  sd_cartPage: async ({ page }, use) => {
    const p = new SD_CartPage(page); await p.goto(); await use(p);
  },
  sd_confirmationPage: async ({ page }, use) => {
    const p = new SD_ConfirmationPage(page); await p.goto(); await use(p);
  },
  sd_infoPage: async ({ page }, use) => {
    const p = new SD_InfoPage(page); await p.goto(); await use(p);
  },
  sd_verificationPage: async ({ page }, use) => {
    const p = new SD_VerificationPage(page); await p.goto(); await use(p);
  },

  echoServer: async ({}, use) => {
    const server = await startLocalEchoServer(); await use(server); await server.close();
  },

  // ---- Email -- local sender + Mailpit ----
  /**
   * emailInbox -- a fresh mailbox local-part minted per test.  A unique name
   * per test keeps Mailpit `to:` searches isolated even under parallelism.
   */
  emailInbox: async ({}, use) => {
    await use(mintInboxName('pwshowcase'));
  },

  /** Full recipient address derived from `emailInbox`. */
  emailAddress: async ({ emailInbox }, use) => {
    await use(inboxToAddress(emailInbox));
  },

  /**
   * emailApp -- LocalEmailAppPage bound to the running helper service.
   * The service URL comes from the EMAIL_APP_BASE_URL env var (set by the
   * `webServer` block in playwright.config.ts), defaulting to localhost:4310.
   * The fixture resets the server's in-memory state before each test.
   */
  emailApp: async ({ page }, use) => {
    const baseURL = process.env.EMAIL_APP_BASE_URL ?? 'http://localhost:4310';
    const app = new LocalEmailAppPage(page, baseURL);
    await app.reset();
    await use(app);
  },

  /**
   * mailpitInbox -- REST reader scoped to this test's unique recipient
   * address.  No navigation needed; the test triggers a send, then polls the
   * Mailpit API for arrival.  Disposed automatically after the test.
   */
  mailpitInbox: async ({ emailAddress }, use) => {
    const inbox = new MailpitInboxPage(emailAddress);
    await use(inbox);
    await inbox.dispose();
  },

  // ── Saucedemo - Multi-context fixtures ───────────────────────────────────────
  sd_multiContextHelper: async ({ browser }, use) => {
    await use(new MultiContextHelper(browser));
  },
  sd_tab2: async ({ context }, use) => {
    const tab2 = await context.newPage();
    await tab2.goto('https://www.saucedemo.com/inventory.html');
    await tab2.waitForLoadState('domcontentloaded');
    await use(tab2);
    await tab2.close();
  },
  sd_standard_ctx: async ({ browser }, use) => {
    const context = await browser.newContext({ baseURL: 'https://www.saucedemo.com', storageState: getSaucedemoAuthFile('standard_user') });
    const page = await context.newPage();
    await ensureSaucedemoInventory(page, 'standard_user');
    const inventoryPage = new SD_InventoryPage(page); await inventoryPage.waitForPageLoad();
    await use({ context, page, inventoryPage }); await context.close();
  },
  sd_problem_ctx: async ({ browser }, use) => {
    const context = await browser.newContext({ baseURL: 'https://www.saucedemo.com', storageState: getSaucedemoAuthFile('problem_user') });
    const page = await context.newPage();
    await ensureSaucedemoInventory(page, 'problem_user');
    const inventoryPage = new SD_InventoryPage(page); await inventoryPage.waitForPageLoad();
    await use({ context, page, inventoryPage }); await context.close();
  },
  sd_glitch_ctx: async ({ browser }, use) => {
    const context = await browser.newContext({ baseURL: 'https://www.saucedemo.com', storageState: getSaucedemoAuthFile('performance_glitch_user') });
    const page = await context.newPage();
    await ensureSaucedemoInventory(page, 'performance_glitch_user');
    const inventoryPage = new SD_InventoryPage(page); await inventoryPage.waitForPageLoad();
    await use({ context, page, inventoryPage }); await context.close();
  },
  sd_unauth_ctx: async ({ browser }, use) => {
    const context = await browser.newContext({ baseURL: 'https://www.saucedemo.com' });
    const page = await context.newPage();
    const loginPage = new SD_LoginPage(page); await loginPage.goto();
    await use({ context, page, loginPage }); await context.close();
  },
});

export { expect };
