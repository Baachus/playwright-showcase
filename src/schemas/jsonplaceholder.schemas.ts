import { z } from 'zod';

/**
 * JSONPlaceholder API – Contract Schemas
 * ─────────────────────────────────────────────────────────────────────────────
 * Zod schemas describing the response shape of https://jsonplaceholder.typicode.com
 * as observed from the live API. Contract tests (tests/api/api-contract.spec.ts)
 * parse live responses against these schemas so that any unannounced change to
 * the API — a renamed field, a changed type, a removed field, or an added field
 * — fails the test suite instead of silently breaking consumers.
 *
 * `.strict()` is used deliberately: it rejects unknown keys, so a field being
 * ADDED to the API is caught just as loudly as a field being removed or
 * retyped. That's the point of contract testing — both directions of drift
 * matter.
 */

/** GET /posts, GET /posts/:id */
export const PostSchema = z
  .object({
    userId: z.number().int().positive(),
    id: z.number().int().positive(),
    title: z.string().min(1),
    body: z.string().min(1),
  })
  .strict();
export type Post = z.infer<typeof PostSchema>;
export const PostListSchema = z.array(PostSchema);

/** GET /comments?postId=:id */
export const CommentSchema = z
  .object({
    postId: z.number().int().positive(),
    id: z.number().int().positive(),
    name: z.string().min(1),
    email: z.string().email(),
    body: z.string().min(1),
  })
  .strict();
export type Comment = z.infer<typeof CommentSchema>;
export const CommentListSchema = z.array(CommentSchema);

/** GET /todos/:id */
export const TodoSchema = z
  .object({
    userId: z.number().int().positive(),
    id: z.number().int().positive(),
    title: z.string().min(1),
    completed: z.boolean(),
  })
  .strict();
export type Todo = z.infer<typeof TodoSchema>;

/** Nested address.geo on the User resource */
const GeoSchema = z
  .object({
    lat: z.string(),
    lng: z.string(),
  })
  .strict();

/** Nested address on the User resource */
const AddressSchema = z
  .object({
    street: z.string().min(1),
    suite: z.string().min(1),
    city: z.string().min(1),
    zipcode: z.string().min(1),
    geo: GeoSchema,
  })
  .strict();

/** Nested company on the User resource */
const CompanySchema = z
  .object({
    name: z.string().min(1),
    catchPhrase: z.string().min(1),
    bs: z.string().min(1),
  })
  .strict();

/** GET /users, GET /users/:id */
export const UserSchema = z
  .object({
    id: z.number().int().positive(),
    name: z.string().min(1),
    username: z.string().min(1),
    email: z.string().email(),
    address: AddressSchema,
    phone: z.string().min(1),
    website: z.string().min(1),
    company: CompanySchema,
  })
  .strict();
export type User = z.infer<typeof UserSchema>;
export const UserListSchema = z.array(UserSchema);
