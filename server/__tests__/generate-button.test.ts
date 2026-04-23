import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import type { LearningLens } from '../../client/src/types/index.js';

/**
 * Property 3: Generate button requires content and lens
 * Validates: Requirements 2.6, 3.5
 *
 * Req 2.6 — The frontend enables the generate button only after both content
 *           AND a Learning_Lens are selected.
 * Req 3.5 — When no Learning_Lens is selected, the frontend disables the
 *           generate action.
 *
 * The enablement logic extracted from GenerateButton.tsx:
 *   isDisabled = !content.trim() || !selectedLens || isGenerating
 */

const ALL_LENSES: LearningLens[] = [
  'gamer', 'coach', 'eli5', 'storyteller',
  'scientist', 'pop_culture', 'chef', 'street_smart',
];

/**
 * Pure extraction of the GenerateButton enablement logic.
 * Mirrors: `const isDisabled = !content.trim() || !selectedLens || isGenerating;`
 */
function isGenerateDisabled(
  content: string,
  selectedLens: LearningLens | null,
  isGenerating: boolean,
): boolean {
  return !content.trim() || !selectedLens || isGenerating;
}

// Arbitraries
const lensArb = fc.constantFrom(...ALL_LENSES);

const nonEmptyContentArb = fc
  .string({ minLength: 1, maxLength: 500 })
  .filter((s) => s.trim().length > 0);

const whitespaceOnlyArb = fc.constantFrom('', ' ', '  ', '\t', '\n', '  \n\t  ');

describe('Property 3: Generate button requires content and lens', () => {
  it('is enabled when content is non-empty, a lens is selected, and not generating', () => {
    fc.assert(
      fc.property(nonEmptyContentArb, lensArb, (content, lens) => {
        expect(isGenerateDisabled(content, lens, false)).toBe(false);
      }),
      { numRuns: 200 },
    );
  });

  it('is disabled when content is empty or whitespace-only (Req 2.6)', () => {
    fc.assert(
      fc.property(whitespaceOnlyArb, fc.option(lensArb, { nil: null }), fc.boolean(), (content, lens, generating) => {
        expect(isGenerateDisabled(content, lens, generating)).toBe(true);
      }),
      { numRuns: 200 },
    );
  });

  it('is disabled when no lens is selected (Req 3.5)', () => {
    fc.assert(
      fc.property(nonEmptyContentArb, fc.boolean(), (content, generating) => {
        expect(isGenerateDisabled(content, null, generating)).toBe(true);
      }),
      { numRuns: 200 },
    );
  });

  it('is disabled while generation is in progress', () => {
    fc.assert(
      fc.property(nonEmptyContentArb, lensArb, (content, lens) => {
        expect(isGenerateDisabled(content, lens, true)).toBe(true);
      }),
      { numRuns: 200 },
    );
  });

  it('requires ALL three conditions to be met for enablement', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 0, maxLength: 300 }),
        fc.option(lensArb, { nil: null }),
        fc.boolean(),
        (content, lens, generating) => {
          const disabled = isGenerateDisabled(content, lens, generating);
          const hasContent = content.trim().length > 0;
          const hasLens = lens !== null;
          const notGenerating = !generating;

          // Button is enabled iff all three conditions hold
          expect(!disabled).toBe(hasContent && hasLens && notGenerating);
        },
      ),
      { numRuns: 500 },
    );
  });
});
