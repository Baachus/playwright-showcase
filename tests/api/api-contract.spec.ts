import { test, expect } from '@playwright/test';
import * as allure from 'allure-js-commons';
import {
  PostSchema,
  PostListSchema,
  UserSchema,
  UserListSchema,
  CommentListSchema,
  TodoSchema,
} from '@schemas/jsonplaceholder.schemas.js';
import { checkContract } from '@utils/api-contract.utils.js';

/**
 * API Contract Tests -- JSONPlaceholder
 * ─────────────────────────────────────────────────────────────────────────────
 * Unlike tests/api/playwright-site.spec.ts (which checks HTTP behavior of a
 * static docs site), this suite validates the *shape* of a real JSON API's
 * responses against Zod schemas captured from the live API
 * (src/schemas/jsonplaceholder.schemas.ts).
 *
 * The goal of contract testing is to catch API drift automatically: if a
 * field is renamed, retyped, removed, or a new field is silently added, the
 * schema's .strict() check fails the test with a precise diff -- instead of
 * a consumer discovering the break in production.
 */

const BASE_URL = 'https://jsonplaceholder.typicode.com';

test.describe('API Contract – JSONPlaceholder', { tag: ['@api', '@contract'] }, () => {
  test.beforeEach(async ({}) => {
    await allure.epic('JSONPlaceholder');
    await allure.feature('API Contract Testing');
  });

  test.describe('Posts Resource', () => {
    test('GET /posts/:id should match the Post contract',
      async ({ request }) => {
        await allure.allureId('API-012');
        await allure.story('Posts Resource');
        await allure.label('severity', 'critical');

        const response = await request.get(`${BASE_URL}/posts/1`);
        expect(response.status()).toBe(200);
        const body = await response.json();

        const result = checkContract(PostSchema, body);
        await allure.step('Assert response matches Post contract', async () => {
          if (!result.success) {
            await allure.attachment('Contract Violations', JSON.stringify(result.issues, null, 2), { contentType: 'application/json' });
          }
          expect(result.success, `Contract violations:\n${result.issues.join('\n')}`).toBe(true);
        });
      });

    test('GET /posts should return a list of Post-shaped resources',
      async ({ request }) => {
        await allure.allureId('API-013');
        await allure.story('Posts Resource');
        await allure.label('severity', 'critical');

        const response = await request.get(`${BASE_URL}/posts`);
        expect(response.status()).toBe(200);
        const body = await response.json();

        const result = checkContract(PostListSchema, body);
        await allure.step('Assert every item in the list matches the Post contract', async () => {
          if (!result.success) {
            await allure.attachment('Contract Violations', JSON.stringify(result.issues, null, 2), { contentType: 'application/json' });
          }
          expect(result.success, `Contract violations:\n${result.issues.join('\n')}`).toBe(true);
          expect(result.data?.length).toBeGreaterThan(0);
        });
      });
  });

  test.describe('Users Resource', () => {
    test('GET /users/:id should match the User contract, including nested address/geo/company',
      async ({ request }) => {
        await allure.allureId('API-014');
        await allure.story('Users Resource');
        await allure.label('severity', 'critical');

        const response = await request.get(`${BASE_URL}/users/1`);
        expect(response.status()).toBe(200);
        const body = await response.json();

        const result = checkContract(UserSchema, body);
        await allure.step('Assert response matches User contract', async () => {
          if (!result.success) {
            await allure.attachment('Contract Violations', JSON.stringify(result.issues, null, 2), { contentType: 'application/json' });
          }
          expect(result.success, `Contract violations:\n${result.issues.join('\n')}`).toBe(true);
        });
      });

    test('GET /users should return a list of User-shaped resources',
      async ({ request }) => {
        await allure.allureId('API-015');
        await allure.story('Users Resource');
        await allure.label('severity', 'normal');

        const response = await request.get(`${BASE_URL}/users`);
        expect(response.status()).toBe(200);
        const body = await response.json();

        const result = checkContract(UserListSchema, body);
        await allure.step('Assert every item in the list matches the User contract', async () => {
          if (!result.success) {
            await allure.attachment('Contract Violations', JSON.stringify(result.issues, null, 2), { contentType: 'application/json' });
          }
          expect(result.success, `Contract violations:\n${result.issues.join('\n')}`).toBe(true);
          expect(result.data?.length).toBeGreaterThan(0);
        });
      });
  });

  test.describe('Comments Resource', () => {
    test('GET /comments?postId= should match the Comment contract and reference the requested post',
      async ({ request }) => {
        await allure.allureId('API-016');
        await allure.story('Comments Resource');
        await allure.label('severity', 'normal');

        const response = await request.get(`${BASE_URL}/comments?postId=1`);
        expect(response.status()).toBe(200);
        const body = await response.json();

        const result = checkContract(CommentListSchema, body);
        await allure.step('Assert every item in the list matches the Comment contract', async () => {
          if (!result.success) {
            await allure.attachment('Contract Violations', JSON.stringify(result.issues, null, 2), { contentType: 'application/json' });
          }
          expect(result.success, `Contract violations:\n${result.issues.join('\n')}`).toBe(true);
        });

        await allure.step('Assert referential integrity: every comment.postId === 1', async () => {
          const mismatched = (result.data ?? []).filter(comment => comment.postId !== 1);
          expect(mismatched, `Comments with unexpected postId: ${JSON.stringify(mismatched)}`).toEqual([]);
        });
      });
  });

  test.describe('Todos Resource', () => {
    test('GET /todos/:id should match the Todo contract',
      async ({ request }) => {
        await allure.allureId('API-017');
        await allure.story('Todos Resource');
        await allure.label('severity', 'normal');

        const response = await request.get(`${BASE_URL}/todos/1`);
        expect(response.status()).toBe(200);
        const body = await response.json();

        const result = checkContract(TodoSchema, body);
        await allure.step('Assert response matches Todo contract', async () => {
          if (!result.success) {
            await allure.attachment('Contract Violations', JSON.stringify(result.issues, null, 2), { contentType: 'application/json' });
          }
          expect(result.success, `Contract violations:\n${result.issues.join('\n')}`).toBe(true);
        });
      });
  });

  test.describe('Field Type Stability', () => {
    test('resource id fields should remain numeric across resources',
      async ({ request }) => {
        await allure.allureId('API-018');
        await allure.story('Field Type Stability');
        await allure.label('severity', 'critical');

        // A very common, silent breaking change is an API migrating numeric
        // ids to string/UUID ids. The schema check above would already catch
        // this, but asserting it directly here gives an immediately readable
        // failure that names the exact resource that broke.
        const [post, user, todo] = await Promise.all([
          request.get(`${BASE_URL}/posts/1`).then(r => r.json()),
          request.get(`${BASE_URL}/users/1`).then(r => r.json()),
          request.get(`${BASE_URL}/todos/1`).then(r => r.json()),
        ]);

        await allure.step('Assert id fields are typeof number', async () => {
          expect(typeof post.id, 'posts/1.id should be a number').toBe('number');
          expect(typeof user.id, 'users/1.id should be a number').toBe('number');
          expect(typeof todo.id, 'todos/1.id should be a number').toBe('number');
        });
      });
  });

  test.describe('Error Response Contract', () => {
    test('GET /posts/:id for a non-existent id should return 404',
      async ({ request }) => {
        await allure.allureId('API-019');
        await allure.story('Error Response Contract');
        await allure.label('severity', 'normal');

        const response = await request.get(`${BASE_URL}/posts/99999`);

        await allure.step('Assert status is 404', async () => {
          expect(response.status()).toBe(404);
        });
      });

    test('GET /posts/:id for a non-existent id should not return a partial Post payload',
      async ({ request }) => {
        await allure.allureId('API-020');
        await allure.story('Error Response Contract');
        await allure.label('severity', 'normal');

        const response = await request.get(`${BASE_URL}/posts/99999`);
        const body = await response.json();

        const result = checkContract(PostSchema, body);
        await allure.step('Assert the 404 body does not satisfy the Post contract', async () => {
          // If this ever starts succeeding, the API has started leaking
          // partially-populated or malformed Post data on a "not found"
          // response, which is itself a contract change worth knowing about.
          expect(result.success, `Expected the 404 body to fail Post validation, but it matched: ${JSON.stringify(body)}`).toBe(false);
        });
      });
  });

  test.describe('Contract Enforcement Sanity Check', () => {
    test('strict schema should reject a payload with an unexpected additional field',
      async ({}) => {
        await allure.allureId('API-021');
        await allure.story('Contract Enforcement Sanity Check');
        await allure.label('severity', 'minor');

        // Meta-test, no network call: proves the .strict() schemas actually
        // catch additive drift (a field silently added to the API), which is
        // otherwise easy to get wrong when hand-rolling schema validation.
        const driftedPost = {
          userId: 1,
          id: 1,
          title: 'title',
          body: 'body',
          newUnannouncedField: 'this should not be here',
        };

        const result = checkContract(PostSchema, driftedPost);

        await allure.step('Assert the unexpected field is flagged as a contract violation', async () => {
          expect(result.success).toBe(false);
          expect(result.issues.join(' ')).toContain('newUnannouncedField');
        });
      });
  });
});
