import { ZodType } from 'zod';

/**
 * API Contract Utilities
 * ─────────────────────────────────────────────────────────────────────────────
 * Thin wrapper around Zod's safeParse that turns schema validation into a
 * structured result the spec files can assert on and attach to Allure. Keeps
 * the zod-specific error shape out of the spec files -- they only ever see a
 * boolean and a list of human-readable issue strings.
 *
 * Used by tests/api/api-contract.spec.ts to detect API contract drift: a
 * field renamed, retyped, removed, or unexpectedly added since the schemas
 * in src/schemas were captured from the live API.
 */

export interface ContractCheckResult<T> {
  success: boolean;
  data?: T;
  /** Human-readable "path: message" strings, one per violation. Empty when success is true. */
  issues: string[];
}

export function checkContract<T>(schema: ZodType<T>, payload: unknown): ContractCheckResult<T> {
  const result = schema.safeParse(payload);

  if (result.success) {
    return { success: true, data: result.data, issues: [] };
  }

  const issues = result.error.issues.map(issue => {
    const path = issue.path.length > 0 ? issue.path.join('.') : '(root)';
    return `${path}: ${issue.message}`;
  });

  return { success: false, issues };
}
