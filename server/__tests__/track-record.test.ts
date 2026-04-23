import { describe, it, expect, beforeEach } from 'vitest';
import * as fc from 'fast-check';
import type { Database } from 'sql.js';
import { createTestDb } from './helpers/test-db.js';

/**
 * Property 6: Track record completeness
 * Validates: Requirements 6.4
 *
 * Req 6.4 — When the final audio file is assembled, the backend creates a Track
 *           record in the Database with title, audio_url, transcript, lens,
 *           voice configuration, duration, share_id, soundscape_url,
 *           intro_music_url, and outro_music_url.
 *
 * This property verifies that for any valid combination of track fields,
 * the created record faithfully stores all required fields and they can
 * be retrieved intact.
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
  sourceText: string | null;
  lens: string;
  voiceConfig: string | null;
  transcript: string | null;
  audioUrl: string | null;
  duration: number | null;
  shareId: string | null;
  soundscapeUrl: string | null;
  introMusicUrl: string | null;
  outroMusicUrl: string | null;
}) {
  db.run(
    `INSERT INTO tracks (id, user_id, title, source_text, lens, voice_config, transcript, audio_url, duration, share_id, soundscape_url, intro_music_url, outro_music_url)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      params.id, params.userId, params.title, params.sourceText,
      params.lens, params.voiceConfig, params.transcript, params.audioUrl,
      params.duration, params.shareId, params.soundscapeUrl,
      params.introMusicUrl, params.outroMusicUrl,
    ],
  );
  const results = db.exec('SELECT * FROM tracks WHERE id = ?', [params.id]);
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

const lensArb = fc.constantFrom(...ALL_LENSES);

const nonEmptyStringArb = fc
  .string({ minLength: 1, maxLength: 200 })
  .filter(s => s.trim().length > 0);

const voiceConfigArb = fc.record({
  explainer: fc.record({ voiceId: nanoidArb, name: nonEmptyStringArb }),
  learner: fc.record({ voiceId: nanoidArb, name: nonEmptyStringArb }),
}).map(vc => JSON.stringify(vc));

const transcriptArb = fc.array(
  fc.record({
    speaker: fc.constantFrom('EXPLAINER', 'LEARNER'),
    text: nonEmptyStringArb,
    startTime: fc.float({ min: 0, max: 3600, noNaN: true }),
    endTime: fc.float({ min: 0, max: 3600, noNaN: true }),
  }),
  { minLength: 1, maxLength: 10 },
).map(segs => JSON.stringify(segs));

const durationArb = fc.integer({ min: 1, max: 7200 });

const audioPathArb = nanoidArb.map(id => `/audio/tracks/${id}.mp3`);
const soundscapePathArb = nanoidArb.map(id => `/audio/soundscapes/${id}_soundscape.mp3`);
const musicPathArb = (kind: string) => nanoidArb.map(id => `/audio/music/${id}_${kind}.mp3`);

beforeEach(async () => {
  db = await createTestDb();
  createUser(db, 'test-user-000000000000', 'Test User');
});

describe('Property 6: Track record completeness', () => {
  it('stores all Req 6.4 fields and retrieves them intact', () => {
    fc.assert(
      fc.property(
        nanoidArb,
        nonEmptyStringArb,
        lensArb,
        voiceConfigArb,
        transcriptArb,
        audioPathArb,
        durationArb,
        nanoidArb,
        soundscapePathArb,
        musicPathArb('intro'),
        musicPathArb('outro'),
        (trackId, title, lens, voiceConfig, transcript, audioUrl, duration, shareId, soundscapeUrl, introMusicUrl, outroMusicUrl) => {
          const record = createTrack(db, {
            id: trackId,
            userId: 'test-user-000000000000',
            title,
            sourceText: 'some source text',
            lens,
            voiceConfig,
            transcript,
            audioUrl,
            duration,
            shareId,
            soundscapeUrl,
            introMusicUrl,
            outroMusicUrl,
          });

          expect(record).toBeDefined();

          // Req 6.4: title
          expect(record!.title).toBe(title);

          // Req 6.4: audio_url
          expect(record!.audio_url).toBe(audioUrl);

          // Req 6.4: transcript (stored as JSON string)
          expect(record!.transcript).toBe(transcript);
          const parsed = JSON.parse(record!.transcript as string);
          expect(Array.isArray(parsed)).toBe(true);
          expect(parsed.length).toBeGreaterThan(0);

          // Req 6.4: lens
          expect(record!.lens).toBe(lens);

          // Req 6.4: voice configuration (stored as JSON string)
          expect(record!.voice_config).toBe(voiceConfig);
          const vc = JSON.parse(record!.voice_config as string);
          expect(vc.explainer.voiceId).toBeDefined();
          expect(vc.learner.voiceId).toBeDefined();

          // Req 6.4: duration
          expect(record!.duration).toBe(duration);

          // Req 6.4: share_id
          expect(record!.share_id).toBe(shareId);

          // Req 6.4: soundscape_url
          expect(record!.soundscape_url).toBe(soundscapeUrl);

          // Req 6.4: intro_music_url
          expect(record!.intro_music_url).toBe(introMusicUrl);

          // Req 6.4: outro_music_url
          expect(record!.outro_music_url).toBe(outroMusicUrl);

          // created_at auto-populated
          expect(record!.created_at).toBeDefined();

          // is_favorite defaults to 0
          expect(record!.is_favorite).toBe(0);
        },
      ),
      { numRuns: 100 },
    );
  });

  it('allows nullable audio layer fields for graceful degradation (Req 22.6, 23.7)', () => {
    fc.assert(
      fc.property(
        nanoidArb,
        nonEmptyStringArb,
        lensArb,
        voiceConfigArb,
        transcriptArb,
        audioPathArb,
        durationArb,
        nanoidArb,
        fc.constantFrom(null, '/audio/soundscapes/test.mp3'),
        fc.constantFrom(null, '/audio/music/test_intro.mp3'),
        fc.constantFrom(null, '/audio/music/test_outro.mp3'),
        (trackId, title, lens, voiceConfig, transcript, audioUrl, duration, shareId, soundscapeUrl, introMusicUrl, outroMusicUrl) => {
          const record = createTrack(db, {
            id: trackId,
            userId: 'test-user-000000000000',
            title,
            sourceText: null,
            lens,
            voiceConfig,
            transcript,
            audioUrl,
            duration,
            shareId,
            soundscapeUrl,
            introMusicUrl,
            outroMusicUrl,
          });

          expect(record).toBeDefined();

          // Core fields always present
          expect(record!.title).toBe(title);
          expect(record!.lens).toBe(lens);
          expect(record!.audio_url).toBe(audioUrl);
          expect(record!.duration).toBe(duration);

          // Nullable audio layer fields match input
          expect(record!.soundscape_url).toBe(soundscapeUrl);
          expect(record!.intro_music_url).toBe(introMusicUrl);
          expect(record!.outro_music_url).toBe(outroMusicUrl);
        },
      ),
      { numRuns: 100 },
    );
  });

  it('share_id is unique across tracks', () => {
    fc.assert(
      fc.property(
        nanoidArb, nanoidArb,
        nonEmptyStringArb,
        lensArb,
        nanoidArb, nanoidArb,
        (trackId1, trackId2, title, lens, shareId1, shareId2) => {
          fc.pre(trackId1 !== trackId2);
          fc.pre(shareId1 !== shareId2);

          createTrack(db, {
            id: trackId1,
            userId: 'test-user-000000000000',
            title,
            sourceText: null,
            lens,
            voiceConfig: null,
            transcript: null,
            audioUrl: null,
            duration: 60,
            shareId: shareId1,
            soundscapeUrl: null,
            introMusicUrl: null,
            outroMusicUrl: null,
          });

          // Duplicate shareId must fail (UNIQUE constraint)
          expect(() => {
            createTrack(db, {
              id: trackId2,
              userId: 'test-user-000000000000',
              title,
              sourceText: null,
              lens,
              voiceConfig: null,
              transcript: null,
              audioUrl: null,
              duration: 60,
              shareId: shareId1,
              soundscapeUrl: null,
              introMusicUrl: null,
              outroMusicUrl: null,
            });
          }).toThrow();

          // Different shareId succeeds
          const record2 = createTrack(db, {
            id: trackId2,
            userId: 'test-user-000000000000',
            title,
            sourceText: null,
            lens,
            voiceConfig: null,
            transcript: null,
            audioUrl: null,
            duration: 60,
            shareId: shareId2,
            soundscapeUrl: null,
            introMusicUrl: null,
            outroMusicUrl: null,
          });
          expect(record2).toBeDefined();
          expect(record2!.share_id).toBe(shareId2);
        },
      ),
      { numRuns: 50 },
    );
  });
});
