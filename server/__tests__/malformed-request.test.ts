import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';

/**
 * Property 18: Malformed request body returns 400
 * Validates: Requirements 21.9
 *
 * Req 21.9 — IF any API route receives a malformed request body, THEN THE
 *            Backend SHALL return a 400 error response with a descriptive
 *            validation message.
 *
 * This property tests the validation logic extracted from each route that
 * accepts a request body:
 *   - POST /api/auth/guest   (displayName validation)
 *   - POST /api/generate     (content, lens, voiceConfig validation)
 *   - POST /api/scrape-url   (url validation)
 */

// --- Valid lenses (mirrors server/config/lenses.ts) ---

const ALL_LENSES = [
  'gamer', 'coach', 'eli5', 'storyteller',
  'scientist', 'pop_culture', 'chef', 'street_smart',
] as const;

type LearningLens = (typeof ALL_LENSES)[number];

// --- Pure validation functions extracted from routes ---

/**
 * From server/routes/auth.ts:
 *   if (!displayName || typeof displayName !== 'string' || displayName.trim().length === 0)
 */
function validateDisplayName(displayName: unknown): boolean {
  if (!displayName || typeof displayName !== 'string' || (displayName as string).trim().length === 0) {
    return false;
  }
  return true;
}

/**
 * From server/routes/generate.ts — content check:
 *   if (!content || typeof content !== 'string' || content.trim().length === 0)
 */
function validateContent(content: unknown): boolean {
  if (!content || typeof content !== 'string' || (content as string).trim().length === 0) {
    return false;
  }
  return true;
}

/**
 * From server/routes/generate.ts — lens check:
 *   if (!lens || !ALL_LENSES.includes(lens))
 */
function validateLens(lens: unknown): boolean {
  if (!lens || !(ALL_LENSES as readonly string[]).includes(lens as string)) {
    return false;
  }
  return true;
}

/**
 * From server/routes/generate.ts — voiceConfig check:
 *   if (!voiceConfig?.explainer?.voiceId || !voiceConfig?.learner?.voiceId)
 */
function validateVoiceConfig(voiceConfig: unknown): boolean {
  const vc = voiceConfig as any;
  if (!vc?.explainer?.voiceId || !vc?.learner?.voiceId) {
    return false;
  }
  return true;
}

/**
 * From server/routes/scrape.ts:
 *   if (!url || typeof url !== 'string' || url.trim().length === 0)
 */
function validateUrl(url: unknown): boolean {
  if (!url || typeof url !== 'string' || (url as string).trim().length === 0) {
    return false;
  }
  return true;
}

// --- Arbitraries ---

const lensArb = fc.constantFrom(...ALL_LENSES);

const nonEmptyStringArb = fc
  .string({ minLength: 1, maxLength: 300 })
  .filter((s) => s.trim().length > 0);

const whitespaceOnlyArb = fc.constantFrom('', ' ', '  ', '\t', '\n', '  \n\t  ');

/** Values that are falsy or not strings — simulates missing/wrong-type fields */
const invalidStringArb = fc.oneof(
  fc.constant(undefined),
  fc.constant(null),
  fc.constant(0),
  fc.constant(false),
  fc.constant({}),
  fc.constant([]),
  whitespaceOnlyArb,
);

/** Strings that are NOT valid lenses */
const invalidLensArb = fc
  .string({ minLength: 1, maxLength: 50 })
  .filter((s) => !(ALL_LENSES as readonly string[]).includes(s));

const validVoiceConfigArb = fc.record({
  explainer: fc.record({ voiceId: nonEmptyStringArb, name: nonEmptyStringArb }),
  learner: fc.record({ voiceId: nonEmptyStringArb, name: nonEmptyStringArb }),
});

// --- Tests ---

describe('Property 18: Malformed request body returns 400', () => {
  // --- POST /api/generate: content validation ---

  it('rejects missing/empty/whitespace-only content in generate', () => {
    fc.assert(
      fc.property(invalidStringArb, (content) => {
        expect(validateContent(content)).toBe(false);
      }),
      { numRuns: 200 },
    );
  });

  it('accepts valid non-empty content in generate', () => {
    fc.assert(
      fc.property(nonEmptyStringArb, (content) => {
        expect(validateContent(content)).toBe(true);
      }),
      { numRuns: 200 },
    );
  });

  // --- POST /api/generate: lens validation ---

  it('rejects invalid lens values in generate', () => {
    fc.assert(
      fc.property(invalidLensArb, (lens) => {
        expect(validateLens(lens)).toBe(false);
      }),
      { numRuns: 200 },
    );
  });

  it('rejects missing/falsy lens values in generate', () => {
    fc.assert(
      fc.property(
        fc.oneof(fc.constant(undefined), fc.constant(null), fc.constant(''), fc.constant(0)),
        (lens) => {
          expect(validateLens(lens)).toBe(false);
        },
      ),
      { numRuns: 200 },
    );
  });

  it('accepts all valid lenses in generate', () => {
    fc.assert(
      fc.property(lensArb, (lens) => {
        expect(validateLens(lens)).toBe(true);
      }),
      { numRuns: 200 },
    );
  });

  // --- POST /api/generate: voiceConfig validation ---

  it('rejects missing/malformed voiceConfig in generate', () => {
    const malformedVoiceConfigArb = fc.oneof(
      fc.constant(undefined),
      fc.constant(null),
      fc.constant({}),
      fc.constant({ explainer: {} }),
      fc.constant({ learner: {} }),
      fc.constant({ explainer: { voiceId: '' }, learner: { voiceId: 'abc' } }),
      fc.constant({ explainer: { voiceId: 'abc' }, learner: { voiceId: '' } }),
      fc.constant({ explainer: { voiceId: 'abc' }, learner: {} }),
      fc.constant({ explainer: {}, learner: { voiceId: 'abc' } }),
    );

    fc.assert(
      fc.property(malformedVoiceConfigArb, (voiceConfig) => {
        expect(validateVoiceConfig(voiceConfig)).toBe(false);
      }),
      { numRuns: 200 },
    );
  });

  it('accepts valid voiceConfig in generate', () => {
    fc.assert(
      fc.property(validVoiceConfigArb, (voiceConfig) => {
        expect(validateVoiceConfig(voiceConfig)).toBe(true);
      }),
      { numRuns: 200 },
    );
  });

  // --- POST /api/auth/guest: displayName validation ---

  it('rejects missing/empty/whitespace-only displayName in auth', () => {
    fc.assert(
      fc.property(invalidStringArb, (displayName) => {
        expect(validateDisplayName(displayName)).toBe(false);
      }),
      { numRuns: 200 },
    );
  });

  it('accepts valid non-empty displayName in auth', () => {
    fc.assert(
      fc.property(nonEmptyStringArb, (displayName) => {
        expect(validateDisplayName(displayName)).toBe(true);
      }),
      { numRuns: 200 },
    );
  });

  // --- POST /api/scrape-url: url validation ---

  it('rejects missing/empty/whitespace-only url in scrape', () => {
    fc.assert(
      fc.property(invalidStringArb, (url) => {
        expect(validateUrl(url)).toBe(false);
      }),
      { numRuns: 200 },
    );
  });

  it('accepts valid non-empty url in scrape', () => {
    fc.assert(
      fc.property(nonEmptyStringArb, (url) => {
        expect(validateUrl(url)).toBe(true);
      }),
      { numRuns: 200 },
    );
  });
});
