import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import {
  LENS_CONFIGS,
  ALL_LENSES,
  type LearningLens,
  type LensConfig,
} from '../config/lenses.js';
import {
  LENS_METADATA,
  ALL_LENSES as FRONTEND_ALL_LENSES,
  type LensMetadata,
} from '../../client/src/lib/lenses.js';

/**
 * Property 7: Lens configuration mapping consistency
 * Validates: Requirements 5.4, 22.2, 23.2
 *
 * For any LearningLens value, the system prompt modifier, soundscape prompt,
 * and music prompt must all match the predefined configuration for that lens,
 * and no two lenses may share the same soundscape prompt or music prompt.
 */

const EXPECTED_LENSES: LearningLens[] = [
  'gamer',
  'coach',
  'eli5',
  'storyteller',
  'scientist',
  'pop_culture',
  'chef',
  'street_smart',
];

const lensArb = fc.constantFrom(...ALL_LENSES);

describe('Property 7: Lens configuration mapping consistency', () => {
  it('all 8 expected lenses exist in LENS_CONFIGS', () => {
    for (const lens of EXPECTED_LENSES) {
      expect(LENS_CONFIGS[lens]).toBeDefined();
    }
    expect(ALL_LENSES).toHaveLength(8);
  });

  it('each lens config has all required fields and id matches its key', () => {
    fc.assert(
      fc.property(lensArb, (lens) => {
        const config: LensConfig = LENS_CONFIGS[lens];

        // All required fields exist
        expect(config.id).toBe(lens);
        expect(typeof config.name).toBe('string');
        expect(config.name.length).toBeGreaterThan(0);
        expect(typeof config.description).toBe('string');
        expect(config.description.length).toBeGreaterThan(0);
        expect(typeof config.icon).toBe('string');
        expect(config.icon.length).toBeGreaterThan(0);
        expect(typeof config.accentColor).toBe('string');
        expect(typeof config.soundscapePrompt).toBe('string');
        expect(typeof config.musicPrompt).toBe('string');
        expect(typeof config.systemPromptModifier).toBe('string');
      }),
      { numRuns: 100 },
    );
  });

  it('every lens has a non-empty soundscapePrompt (Req 22.2)', () => {
    fc.assert(
      fc.property(lensArb, (lens) => {
        expect(LENS_CONFIGS[lens].soundscapePrompt.trim().length).toBeGreaterThan(0);
      }),
      { numRuns: 100 },
    );
  });

  it('every lens has a non-empty musicPrompt (Req 23.2)', () => {
    fc.assert(
      fc.property(lensArb, (lens) => {
        expect(LENS_CONFIGS[lens].musicPrompt.trim().length).toBeGreaterThan(0);
      }),
      { numRuns: 100 },
    );
  });

  it('every lens has a non-empty systemPromptModifier (Req 5.4)', () => {
    fc.assert(
      fc.property(lensArb, (lens) => {
        expect(LENS_CONFIGS[lens].systemPromptModifier.trim().length).toBeGreaterThan(0);
      }),
      { numRuns: 100 },
    );
  });

  it('frontend LENS_METADATA mirrors server LENS_CONFIGS for shared fields', () => {
    // Ensure both sides expose the same set of lenses
    expect(ALL_LENSES.sort()).toEqual(FRONTEND_ALL_LENSES.sort());

    fc.assert(
      fc.property(lensArb, (lens) => {
        const server: LensConfig = LENS_CONFIGS[lens];
        const client: LensMetadata = LENS_METADATA[lens];

        expect(client.id).toBe(server.id);
        expect(client.name).toBe(server.name);
        expect(client.description).toBe(server.description);
        expect(client.icon).toBe(server.icon);
        expect(client.accentColor).toBe(server.accentColor);
      }),
      { numRuns: 100 },
    );
  });

  it('accentColor values are valid hex color strings', () => {
    const hexColorRegex = /^#[0-9A-Fa-f]{6}$/;

    fc.assert(
      fc.property(lensArb, (lens) => {
        expect(LENS_CONFIGS[lens].accentColor).toMatch(hexColorRegex);
      }),
      { numRuns: 100 },
    );
  });

  it('no two lenses share the same soundscapePrompt or musicPrompt', () => {
    const soundscapePrompts = ALL_LENSES.map((l) => LENS_CONFIGS[l].soundscapePrompt);
    const musicPrompts = ALL_LENSES.map((l) => LENS_CONFIGS[l].musicPrompt);

    expect(new Set(soundscapePrompts).size).toBe(soundscapePrompts.length);
    expect(new Set(musicPrompts).size).toBe(musicPrompts.length);
  });
});
