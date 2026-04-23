import { describe, it, expect, beforeEach } from 'vitest';
import * as fc from 'fast-check';
import type { Database } from 'sql.js';
import { createTestDb } from './helpers/test-db.js';

/**
 * Property 1: Guest signup creates valid user record
 * Validates: Requirements 1.2, 1.4
 *
 * Req 1.2 — When a user submits a valid display name, the backend creates a user
 *           record with a nanoid-generated id and the provided display name.
 * Req 1.4 — When a user is authenticated, the backend creates a row in the users
 *           table with id, display_name, and created_at fields.
 */

let db: Database;

function createUser(db: Database, id: string, displayName: string) {
  db.run('INSERT INTO users (id, display_name) VALUES (?, ?)', [id, displayName]);
  const results = db.exec('SELECT id, display_name, created_at FROM users WHERE id = ?', [id]);
  if (results.length === 0 || results[0].values.length === 0) return undefined;
  const row = results[0].values[0];
  return {
    id: row[0] as string,
    display_name: row[1] as string,
    created_at: row[2] as string,
  };
}

// Arbitrary for nanoid-like IDs (21-char URL-safe strings)
const nanoidArb = fc.string({
  minLength: 21,
  maxLength: 21,
  unit: fc.constantFrom(...'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789_-'.split('')),
});

// Arbitrary for valid display names (non-empty after trim)
const displayNameArb = fc
  .string({ minLength: 1, maxLength: 200 })
  .filter(s => s.trim().length > 0)
  .map(s => s.trim());

beforeEach(async () => {
  db = await createTestDb();
});

describe('Property 1: Guest signup creates valid user record', () => {
  it('should create a user with id, display_name, and created_at for any valid input', () => {
    fc.assert(
      fc.property(fc.tuple(nanoidArb, displayNameArb), ([id, displayName]) => {
        const user = createUser(db, id, displayName);

        // User record must exist
        expect(user).toBeDefined();

        // id matches what was provided (Req 1.2)
        expect(user!.id).toBe(id);

        // display_name matches the trimmed input (Req 1.2)
        expect(user!.display_name).toBe(displayName);

        // created_at is populated (Req 1.4 — row has id, display_name, created_at)
        expect(typeof user!.created_at).toBe('string');
        expect(user!.created_at.length).toBeGreaterThan(0);
      }),
      { numRuns: 100 }
    );
  });

  it('should persist the user so it can be retrieved independently', () => {
    fc.assert(
      fc.property(fc.tuple(nanoidArb, displayNameArb), ([id, displayName]) => {
        db.run('INSERT INTO users (id, display_name) VALUES (?, ?)', [id, displayName]);

        // Retrieve with a separate query
        const results = db.exec('SELECT id, display_name FROM users WHERE id = ?', [id]);
        expect(results.length).toBe(1);

        const row = results[0].values[0];
        expect(row[0]).toBe(id);
        expect(row[1]).toBe(displayName);
      }),
      { numRuns: 100 }
    );
  });

  it('should reject duplicate user ids (PRIMARY KEY constraint)', () => {
    fc.assert(
      fc.property(
        fc.tuple(nanoidArb, displayNameArb, displayNameArb),
        ([id, name1, name2]) => {
          db.run('INSERT INTO users (id, display_name) VALUES (?, ?)', [id, name1]);

          // Second insert with same id must throw
          expect(() => {
            db.run('INSERT INTO users (id, display_name) VALUES (?, ?)', [id, name2]);
          }).toThrow();
        }
      ),
      { numRuns: 50 }
    );
  });
});
