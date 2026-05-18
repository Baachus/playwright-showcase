import fs from 'fs';
import path from 'path';
import { launch } from 'chrome-launcher';
import lighthouse from 'lighthouse';

/**
 * Lighthouse Performance Utilities
 * ─────────────────────────────────────────────────────────────────────────────
 * Wraps the Lighthouse Node API to run full audits from within Playwright
 * tests. Lighthouse requires its own Chrome instance (separate from the
 * Playwright browser) and produces:
 *
 *   • Typed score/metric objects for use in test assertions
 *   • An HTML report saved to reports/lighthouse/<slug>.html
 *   • A JSON report saved to reports/lighthouse/<slug>.json
 *
 * Usage in tests:
 *   const result = await runLighthouse('https://playwright.dev/');
 *   expect(result.scores.performance).toBeGreaterThanOrEqual(0.8);
 */

// ── Types ────────────────────────────────────────────────────────────────────

export interface LighthouseScores {
  /** 0–1 float (e.g. 0.95 = 95). Null if the category was not audited. */
  performance: number | null;
  accessibility: number | null;
  bestPractices: number | null;
  seo: number | null;
}

export interface LighthouseWebVitals {
  /** First Contentful Paint in ms */
  fcp: number | null;
  /** Largest Contentful Paint in ms */
  lcp: number | null;
  /** Total Blocking Time in ms */
  tbt: number | null;
  /** Cumulative Layout Shift score */
  cls: number | null;
  /** Speed Index in ms */
  speedIndex: number | null;
  /** Time to Interactive in ms */
  tti: number | null;
  /** Time to First Byte in ms */
  ttfb: number | null;
}

export interface LighthouseResult {
  url: string;
  scores: LighthouseScores;
  vitals: LighthouseWebVitals;
  /** Path to the saved HTML report, or null if saving failed */
  htmlReportPath: string | null;
  /** Path to the saved JSON report, or null if saving failed */
  jsonReportPath: string | null;
  /** Timestamp of when the audit ran */
  timestamp: string;
}

export interface LighthouseOptions {
  /**
   * Form factor to emulate.
   * 'desktop' disables throttling and uses a 1350x940 viewport.
   * 'mobile'  enables network/CPU throttling and a 375x667 viewport.
   * @default 'desktop'
   */
  formFactor?: 'desktop' | 'mobile';

  /**
   * Directory to write HTML and JSON reports into.
   * @default 'reports/lighthouse'
   */
  reportDir?: string;

  /**
   * File slug (no extension) for the saved report files.
   * Defaults to a URL-derived slug with timestamp.
   */
  reportSlug?: string;

  /**
   * Extra Lighthouse flags to merge in.
   */
  extraFlags?: Record<string, unknown>;
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function numericValue(
  audits: Record<string, { numericValue?: number }>,
  key: string,
): number | null {
  return audits[key]?.numericValue ?? null;
}

function roundMs(ms: number | null): number | null {
  return ms !== null ? Math.round(ms * 10) / 10 : null;
}

function urlToSlug(url: string): string {
  return url
    .replace(/^https?:\/\//, '')
    .replace(/[^a-z0-9]/gi, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .toLowerCase()
    .slice(0, 60);
}

function ensureDir(dir: string): void {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

// ── Core runner ──────────────────────────────────────────────────────────────

/**
 * Run a Lighthouse audit against `url` and return typed scores, vitals,
 * and saved report paths.
 *
 * Lighthouse launches its own headless Chrome instance independently of the
 * Playwright browser — this is intentional. Mixing them causes timing
 * interference. The Chrome instance is always cleaned up after the audit.
 */
export async function runLighthouse(
  url: string,
  options: LighthouseOptions = {},
): Promise<LighthouseResult> {
  const {
    formFactor = 'desktop',
    reportDir = 'reports/lighthouse',
    reportSlug,
    extraFlags = {},
  } = options;

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const slug = reportSlug ?? `${urlToSlug(url)}-${timestamp}`;

  // ── Launch Chrome ──────────────────────────────────────────────────────────
  const chrome = await launch({
    chromeFlags: ['--headless', '--no-sandbox', '--disable-gpu'],
  });

  let lhResult: Awaited<ReturnType<typeof lighthouse>>;

  try {
    const desktopConfig = {
      extends: 'lighthouse:default',
      settings: {
        formFactor: 'desktop' as const,
        screenEmulation: {
          mobile: false,
          width: 1350,
          height: 940,
          deviceScaleFactor: 1,
          disabled: false,
        },
        throttlingMethod: 'provided' as const,
        throttling: {
          rttMs: 0,
          throughputKbps: 0,
          cpuSlowdownMultiplier: 1,
          requestLatencyMs: 0,
          downloadThroughputKbps: 0,
          uploadThroughputKbps: 0,
        },
      },
    };

    const mobileConfig = {
      extends: 'lighthouse:default',
      settings: {
        formFactor: 'mobile' as const,
        screenEmulation: {
          mobile: true,
          width: 375,
          height: 667,
          deviceScaleFactor: 2,
          disabled: false,
        },
        throttlingMethod: 'simulate' as const,
      },
    };

    const flags = {
      port: chrome.port,
      output: ['html', 'json'] as ['html', 'json'],
      logLevel: 'error' as const,
      ...extraFlags,
    };

    const config = formFactor === 'desktop' ? desktopConfig : mobileConfig;
    const raw = await lighthouse(url, flags, config);
    if (!raw) throw new Error('Lighthouse returned no result');
    lhResult = raw;
  } finally {
    await chrome.kill();
  }

  const { lhr, report } = lhResult;
  const audits = lhr.audits as Record<string, { numericValue?: number }>;

  // ── Extract category scores ────────────────────────────────────────────────
  const scores: LighthouseScores = {
    performance: lhr.categories['performance']?.score ?? null,
    accessibility: lhr.categories['accessibility']?.score ?? null,
    bestPractices: lhr.categories['best-practices']?.score ?? null,
    seo: lhr.categories['seo']?.score ?? null,
  };

  // ── Extract Web Vitals ─────────────────────────────────────────────────────
  const vitals: LighthouseWebVitals = {
    fcp: roundMs(numericValue(audits, 'first-contentful-paint')),
    lcp: roundMs(numericValue(audits, 'largest-contentful-paint')),
    tbt: roundMs(numericValue(audits, 'total-blocking-time')),
    cls: numericValue(audits, 'cumulative-layout-shift'),
    speedIndex: roundMs(numericValue(audits, 'speed-index')),
    tti: roundMs(numericValue(audits, 'interactive')),
    ttfb: roundMs(numericValue(audits, 'server-response-time')),
  };

  // ── Save reports ───────────────────────────────────────────────────────────
  ensureDir(reportDir);

  let htmlReportPath: string | null = null;
  let jsonReportPath: string | null = null;

  try {
    const [htmlReport, jsonReport] = Array.isArray(report) ? report : [report, null];

    htmlReportPath = path.join(reportDir, `${slug}.html`);
    fs.writeFileSync(htmlReportPath, htmlReport as string, 'utf-8');

    if (jsonReport) {
      jsonReportPath = path.join(reportDir, `${slug}.json`);
      fs.writeFileSync(jsonReportPath, jsonReport as string, 'utf-8');
    }
  } catch (err) {
    console.warn(`  Could not save Lighthouse report: ${(err as Error).message}`);
  }

  return {
    url,
    scores,
    vitals,
    htmlReportPath,
    jsonReportPath,
    timestamp: new Date().toISOString(),
  };
}

// ── Assertion & reporting helpers ────────────────────────────────────────────

/**
 * Pretty-print a Lighthouse result summary to the console.
 */
export function printLighthouseResult(result: LighthouseResult): void {
  const score = (n: number | null): string =>
    n === null ? 'n/a' : `${Math.round(n * 100)}/100`;
  const ms = (n: number | null): string =>
    n === null ? 'n/a' : `${n}ms`;
  const cls = (n: number | null): string =>
    n === null ? 'n/a' : n.toFixed(4);

  const line = (label: string, value: string, width = 25): string =>
    `  ${label.padEnd(33)}${value.padEnd(width)}`;

  console.warn([
    '',
    '  ╔═════════════════════════════════════════════════════════╗',
    '    Lighthouse Audit Results',
    '  ╠═════════════════════════════════════════════════════════╣',
    `    URL: ${result.url.slice(0, 49).padEnd(49)}`,
    '  ╠═════════════════════════════════════════════════════════╣',
    '    CATEGORY SCORES',
    `    ${line('Performance:', score(result.scores.performance))}`,
    `    ${line('Accessibility:', score(result.scores.accessibility))}`,
    `    ${line('Best Practices:', score(result.scores.bestPractices))}`,
    `    ${line('SEO:', score(result.scores.seo))}`,
    '  ╠═════════════════════════════════════════════════════════╣',
    '    WEB VITALS',
    `    ${line('FCP (First Contentful Paint):', ms(result.vitals.fcp))}`,
    `    ${line('LCP (Largest Contentful Paint):', ms(result.vitals.lcp))}`,
    `    ${line('TBT (Total Blocking Time):', ms(result.vitals.tbt))}`,
    `    ${line('CLS (Layout Shift):', cls(result.vitals.cls))}`,
    `    ${line('Speed Index:', ms(result.vitals.speedIndex))}`,
    `    ${line('TTI (Time to Interactive):', ms(result.vitals.tti))}`,
    `    ${line('TTFB (Time to First Byte):', ms(result.vitals.ttfb))}`,
    '  ╠═════════════════════════════════════════════════════════╣',
    `    HTML report: ${(result.htmlReportPath ?? 'not saved').slice(0, 42).padEnd(42)}`,
    '  ╚═════════════════════════════════════════════════════════╝',
    '',
  ].join('\n'));
}

/**
 * Assert that Lighthouse category scores meet their thresholds.
 * Thresholds are expressed as 0–1 floats (e.g. 0.9 = 90).
 * Omit any category key to skip asserting on it.
 */
export function assertLighthouseScores(
  result: LighthouseResult,
  thresholds: Partial<Record<keyof LighthouseScores, number>>,
): void {
  const failures: string[] = [];

  for (const [category, threshold] of Object.entries(thresholds) as [
    keyof LighthouseScores,
    number,
  ][]) {
    const actual = result.scores[category];
    if (actual === null) {
      failures.push(`  • ${category}: score not available (category may not have been audited)`);
    } else if (actual < threshold) {
      failures.push(
        `  • ${category}: scored ${Math.round(actual * 100)}/100, ` +
        `required >= ${Math.round(threshold * 100)}/100`,
      );
    }
  }

  if (failures.length > 0) {
    throw new Error(`Lighthouse score thresholds not met:\n${failures.join('\n')}`);
  }
}
