import { Page, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import type { AxeResults, Result } from 'axe-core';

/**
 * Accessibility Utilities
 * ─────────────────────────────────────────────────────────────────────────────
 * Wrappers around axe-core/playwright for WCAG compliance testing.
 * Supports targeted scans, rule filtering, and rich failure reporting.
 */

export interface A11yOptions {
  /** CSS selector to scope the scan to a specific region */
  include?: string[];
  /** CSS selector to exclude from scan */
  exclude?: string[];
  /** WCAG tags to target e.g. ['wcag2a', 'wcag2aa', 'wcag21aa'] */
  tags?: string[];
  /** Specific axe rules to disable */
  disableRules?: string[];
}

/**
 * Run an axe accessibility scan on the current page.
 */
export async function runA11yScan(page: Page, options: A11yOptions = {}): Promise<AxeResults> {
  let builder = new AxeBuilder({ page });

  if (options.include?.length) {
    builder = builder.include(options.include);
  }
  if (options.exclude?.length) {
    builder = builder.exclude(options.exclude);
  }
  if (options.tags?.length) {
    builder = builder.withTags(options.tags);
  }
  if (options.disableRules?.length) {
    builder = builder.disableRules(options.disableRules);
  }

  return builder.analyze();
}

/**
 * Assert zero accessibility violations (WCAG 2.1 AA by default).
 */
export async function assertNoA11yViolations(page: Page, options: A11yOptions = {}): Promise<void> {
  const results = await runA11yScan(page, {
    tags: ['wcag2a', 'wcag2aa', 'wcag21aa'],
    ...options,
  });

  if (results.violations.length > 0) {
    throw new Error(formatViolations(results.violations));
  }
}

/**
 * Assert no violations of a specific WCAG level.
 */
export async function assertWcagLevel(
  page: Page,
  level: 'A' | 'AA' | 'AAA',
  options: Omit<A11yOptions, 'tags'> = {},
): Promise<void> {
  const tagMap = {
    A: ['wcag2a'],
    AA: ['wcag2a', 'wcag2aa', 'wcag21aa'],
    AAA: ['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag2aaa'],
  };

  await assertNoA11yViolations(page, { ...options, tags: tagMap[level] });
}

/**
 * Format axe violations into a readable error message.
 */
function formatViolations(violations: Result[]): string {
  const lines: string[] = [
    `\n♿ Accessibility violations found: ${violations.length}\n`,
    '─'.repeat(60),
  ];

  for (const violation of violations) {
    lines.push(`\n[${violation.impact?.toUpperCase()}] ${violation.id}`);
    lines.push(`  Description: ${violation.description}`);
    lines.push(`  Help: ${violation.helpUrl}`);
    lines.push(`  Nodes affected: ${violation.nodes.length}`);

    for (const node of violation.nodes.slice(0, 3)) {
      lines.push(`    • ${node.target.join(', ')}`);
      if (node.failureSummary) {
        lines.push(`      ${node.failureSummary.replace(/\n/g, '\n      ')}`);
      }
    }

    if (violation.nodes.length > 3) {
      lines.push(`    ... and ${violation.nodes.length - 3} more nodes`);
    }
  }

  return lines.join('\n');
}

/**
 * Get a summary of violations grouped by impact level.
 */
export async function getViolationSummary(
  page: Page,
  options: A11yOptions = {},
): Promise<Record<string, number>> {
  const results = await runA11yScan(page, options);
  const summary: Record<string, number> = {
    critical: 0,
    serious: 0,
    moderate: 0,
    minor: 0,
  };

  for (const v of results.violations) {
    const impact = v.impact ?? 'minor';
    summary[impact] = (summary[impact] ?? 0) + 1;
  }

  return summary;
}
