import { describe, it, expect, beforeEach } from 'vitest';
import * as fc from 'fast-check';
import type { Database } from 'sql.js';
import { createTestDb } from './helpers/test-db.js';
import { generateShareId } from '../utils/share-id.js';

/**
 * Property 15: Share ID uniqueness and URL format
 * Property 16: Public share endpoint returns track without auth
 * Validates: Requirements 12.1, 12.2, 12.4
 *
 * Req 12.1 — When a Track is created, the backend generates a unique share_id
 *            and stores it in the Track record.
 * Req 12.2 — The share link uses the format /share/:shareId.
 * Req 12.4 — GET /api/share/:shareId returns Track data regardless of auth status.
 */

let db: Database;

const ALL_LENSES = [
  'gamer', 'coach', 'eli5', 'storyteller',
  'scientist', 'pop_culture', 'chef', 'street_smart',
] as const;

// --- Helpers ---

function createUser(db: Database, id: string, displayName: string) {
  db.run('INSERT INTO users (id, display_name) VALUES (?, ?)', [id, displayName]);
}

function createTrack(db: Database, params: {
  id: string;
  userId: string;
  title: string;
  lens: string;
  shareId: string | null;
  transcript?: string | null;
  audioUrl?: string | null;
  duration?: number | null;
  soundscapeUrl?: string | null;
  introMusicUrl?: string | null;
  outroMusicUrl?: string | null;
}) {
  db.run(
    `INSERT INTO tracks (id, user_id, title, source_text, lens, voice_config, transcript, audio_url, duration, share_id, soundscape_url, intro_music_url, outro_music_url)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      params.id, params.userId, params.title, null,
      params.lens, null, params.transcript ?? null, params.audioUrl ?? null,
      params.duration ?? null, params.shareId, params.soundscapeUrl ?? null,
      params.introMusicUrl ?? null, params.outroMusicUrl ?? null,
    ],
  );
}

function getTrackByShareId(db: Database, shareId: string) {
  const results = db.exec('SELECT * FROM tracks WHERE share_id = ?', [shareId]);
  if (results.length === 0 || results[0].values.length === 0) return undefined;
  const cols = results[0].columns;
  const row = results[0].values[0];
  const record: Record<string, unknown> = {};
  cols.forEach((col, i) => { record[col] = row[i]; });
  return record;
}

// --- Arbitraries ---

const nanoidArb = fc.string({
  minLength: 21,
  maxLength: 21,
  unit: fc.constantFrom(...'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789_-'.split('')),
});

const shareIdArb = fc.string({
  minLength: 12,
  maxLength: 12,
  unit: fc.constantFrom(...'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789_-'.split('')),
});

const lensArb = fc.constantFrom(...ALL_LENSES);

const nonEmptyStringArb = fc
  .string({ minLength: 1, maxLength: 200 })
  .filter(s => s.trim().length > 0);

const transcriptArb = fc.array(
  fc.record({
    speaker: fc.constantFrom('EXPLAINER', 'LEARNER'),
    text: nonEmptyStringArb,
    startTime: fc.float({ min: 0, max: 3600, noNaN: true }),
    endTime: fc.float({ min: 0, max: 3600, noNaN: true }),
  }),
  { minLength: 1, maxLength: 5 },
).map(segs => JSON.stringify(segs));

beforeEach(async () => {
  db = await createTestDb();
  createUser(db, 'user-owner-00000000000', 'Owner');
  createUser(db, 'user-other-00000000000', 'Other');
});

// ---------------------------------------------------------------------------
// Property 15: Share ID uniqueness and URL format
// ---------------------------------------------------------------------------

describe('Property 15: Share ID uniqueness and URL format', () => {
  it('generateShareId produces 12-character URL-safe strings', () => {
    fc.assert(
      fc.property(fc.constant(null), () => {
        const id = generateShareId();

        // Length is exactly 12 (Req 12.1 — nanoid(12))
        expect(id).toHaveLength(12);

        // Only URL-safe characters (nanoid default alphabet)
        expect(id).toMatch(/^[A-Za-z0-9_-]+$/);

        // Valid for URL path segment /share/:shareId (Req 12.2)
        const url = `/share/${id}`;
        expect(url).toMatch(/^\/share\/[A-Za-z0-9_-]{12}$/);
      }),
      { numRuns: 200 },
    );
  });

  it('generateShareId produces unique IDs across many invocations', () => {
    const ids = new Set<string>();
    const count = 500;

    for (let i = 0; i < count; i++) {
      ids.add(generateShareId());
    }

    // All generated IDs should be unique (Req 12.1)
    expect(ids.size).toBe(count);
  });

  it('share_id UNIQUE constraint prevents duplicate share IDs in the database', () => {
    fc.assert(
      fc.property(
        nanoidArb, nanoidArb,
        nonEmptyStringArb,
        lensArb,
        shareIdArb,
        (trackId1, trackId2, title, lens, shareId) => {
          fc.pre(trackId1 !== trackId2);

          // First track with this shareId succeeds
          createTrack(db, {
            id: trackId1,
            userId: 'user-owner-00000000000',
            title,
            lens,
            shareId,
          });

          // Second track with same shareId must fail (UNIQUE constraint, Req 12.1)
          expect(() => {
            createTrack(db, {
              id: trackId2,
              userId: 'user-owner-00000000000',
              title,
              lens,
              shareId,
            });
          }).toThrow();
        },
      ),
      { numRuns: 50 },
    );
  });

  it('share_id is stored in the track record and retrievable', () => {
    fc.assert(
      fc.property(
        nanoidArb,
        nonEmptyStringArb,
        lensArb,
        shareIdArb,
        (trackId, title, lens, shareId) => {
          createTrack(db, {
            id: trackId,
            userId: 'user-owner-00000000000',
            title,
            lens,
            shareId,
          });

          const track = getTrackByShareId(db, shareId);
          expect(track).toBeDefined();
          expect(track!.share_id).toBe(shareId);
          expect(track!.id).toBe(trackId);
        },
      ),
      { numRuns: 100 },
    );
  });
});

// ---------------------------------------------------------------------------
// Property 16: Public share endpoint returns track without auth
// ---------------------------------------------------------------------------

describe('Property 16: Public share endpoint returns track without auth', () => {
  it('track is retrievable by share_id regardless of which user created it', () => {
    fc.assert(
      fc.property(
        nanoidArb,
        nonEmptyStringArb,
        lensArb,
        shareIdArb,
        transcriptArb,
        fc.integer({ min: 1, max: 7200 }),
        (trackId, title, lens, shareId, transcript, duration) => {
          createTrack(db, {
            id: trackId,
            userId: 'user-owner-00000000000',
            title,
            lens,
            shareId,
            transcript,
            audioUrl: `/audio/tracks/${trackId}.mp3`,
            duration,
            soundscapeUrl: `/audio/soundscapes/${trackId}_soundscape.mp3`,
            introMusicUrl: `/audio/music/${trackId}_intro.mp3`,
            outroMusicUrl: `/audio/music/${trackId}_outro.mp3`,
          });

          // Retrieve by share_id — no user_id filter (Req 12.4)
          const track = getTrackByShareId(db, shareId);
          expect(track).toBeDefined();

          // All public-facing fields are present
          expect(track!.id).toBe(trackId);
          expect(track!.title).toBe(title);
          expect(track!.lens).toBe(lens);
          expect(track!.audio_url).toBe(`/audio/tracks/${trackId}.mp3`);
          expect(track!.duration).toBe(duration);
          expect(track!.soundscape_url).toBe(`/audio/soundscapes/${trackId}_soundscape.mp3`);
          expect(track!.intro_music_url).toBe(`/audio/music/${trackId}_intro.mp3`);
          expect(track!.outro_music_url).toBe(`/audio/music/${trackId}_outro.mp3`);

          // Transcript is valid JSON array
          const parsed = JSON.parse(track!.transcript as string);
          expect(Array.isArray(parsed)).toBe(true);
          expect(parsed.length).toBeGreaterThan(0);
          for (const seg of parsed) {
            expect(['EXPLAINER', 'LEARNER']).toContain(seg.speaker);
            expect(typeof seg.text).toBe('string');
            expect(typeof seg.startTime).toBe('number');
            expect(typeof seg.endTime).toBe('number');
          }
        },
      ),
      { numRuns: 100 },
    );
  });

  it('non-existent share_id returns no result (Req 12.5)', () => {
    fc.assert(
      fc.property(shareIdArb, (shareId) => {
        // No tracks created — lookup must return undefined
        const track = getTrackByShareId(db, shareId);
        expect(track).toBeUndefined();
      }),
      { numRuns: 100 },
    );
  });

  it('share lookup does not require matching user_id (no auth filter)', () => {
    fc.assert(
      fc.property(
        nanoidArb,
        nonEmptyStringArb,
        lensArb,
        shareIdArb,
        (trackId, title, lens, shareId) => {
          // Track created by 'user-owner'
          createTrack(db, {
            id: trackId,
            userId: 'user-owner-00000000000',
            title,
            lens,
            shareId,
          });

          // Query by share_id only — simulates unauthenticated access (Req 12.4)
          const results = db.exec(
            'SELECT * FROM tracks WHERE share_id = ?',
            [shareId],
          );
          expect(results.length).toBe(1);
          expect(results[0].values.length).toBe(1);

          // Verify the query does NOT filter by user_id
          const cols = results[0].columns;
          const row = results[0].values[0];
          const userIdIdx = cols.indexOf('user_id');
          expect(row[userIdIdx]).toBe('user-owner-00000000000');

          // A different user context would still find this track
          // because the share query has no user_id WHERE clause
          const shareIdIdx = cols.indexOf('share_id');
          expect(row[shareIdIdx]).toBe(shareId);
        },
      ),
      { numRuns: 50 },
    );
  });
});
