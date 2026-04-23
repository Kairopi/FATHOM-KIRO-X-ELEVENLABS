import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';

/**
 * Property 11: Library search filters correctly
 * Validates: Requirements 11.2, 11.3
 *
 * Req 11.2 — The Frontend SHALL provide a search input that filters Tracks
 *            by title in real time as the user types.
 * Req 11.3 — The Frontend SHALL provide filter controls to filter Tracks
 *            by Learning_Lens and favorite status.
 *
 * For any search query string and list of tracks, the filtered result should
 * contain exactly those tracks whose title contains the search string
 * (case-insensitive), and for any lens/favorite filter combination, the result
 * should contain exactly those tracks matching all active filter criteria.
 */

// --- Types (mirroring client/src/types) ---

const ALL_LENSES = [
  'gamer', 'coach', 'eli5', 'storyteller',
  'scientist', 'pop_culture', 'chef', 'street_smart',
] as const;

type LearningLens = (typeof ALL_LENSES)[number];

interface Track {
  id: string;
  title: string;
  lens: LearningLens;
  isFavorite: boolean;
}

// --- Filtering logic (extracted from LibraryScreen.tsx) ---

function filterTracks(
  tracks: Track[],
  search: string,
  lensFilter: LearningLens | null,
  favoritesOnly: boolean,
): Track[] {
  let result = tracks;
  if (search.trim()) {
    const q = search.toLowerCase();
    result = result.filter((t) => t.title.toLowerCase().includes(q));
  }
  if (lensFilter) {
    result = result.filter((t) => t.lens === lensFilter);
  }
  if (favoritesOnly) {
    result = result.filter((t) => t.isFavorite);
  }
  return result;
}

// --- Arbitraries ---

const lensArb = fc.constantFrom(...ALL_LENSES);

const trackArb = fc.record({
  id: fc.uuid(),
  title: fc.string({ minLength: 1, maxLength: 100 }).filter(s => s.trim().length > 0),
  lens: lensArb,
  isFavorite: fc.boolean(),
});

const trackListArb = fc.array(trackArb, { minLength: 0, maxLength: 20 });

const searchQueryArb = fc.string({ minLength: 0, maxLength: 50 });

const lensFilterArb = fc.option(lensArb, { nil: null });

// --- Property tests ---

describe('Property 11: Library search filters correctly', () => {
  it('title search returns exactly tracks whose title contains the query (case-insensitive) (Req 11.2)', () => {
    fc.assert(
      fc.property(trackListArb, searchQueryArb, (tracks, search) => {
        const result = filterTracks(tracks, search, null, false);

        if (!search.trim()) {
          // Empty/whitespace search returns all tracks
          expect(result).toHaveLength(tracks.length);
        } else {
          const q = search.toLowerCase();
          // Every returned track must contain the query in its title
          for (const track of result) {
            expect(track.title.toLowerCase()).toContain(q);
          }
          // Every track that contains the query must be in the result
          const expected = tracks.filter((t) => t.title.toLowerCase().includes(q));
          expect(result).toHaveLength(expected.length);
        }
      }),
      { numRuns: 200 },
    );
  });

  it('lens filter returns exactly tracks matching the selected lens (Req 11.3)', () => {
    fc.assert(
      fc.property(trackListArb, lensFilterArb, (tracks, lensFilter) => {
        const result = filterTracks(tracks, '', lensFilter, false);

        if (lensFilter === null) {
          // No lens filter returns all tracks
          expect(result).toHaveLength(tracks.length);
        } else {
          // Every returned track must have the matching lens
          for (const track of result) {
            expect(track.lens).toBe(lensFilter);
          }
          // Every track with the matching lens must be in the result
          const expected = tracks.filter((t) => t.lens === lensFilter);
          expect(result).toHaveLength(expected.length);
        }
      }),
      { numRuns: 200 },
    );
  });

  it('favorites filter returns exactly favorited tracks (Req 11.3)', () => {
    fc.assert(
      fc.property(trackListArb, fc.boolean(), (tracks, favoritesOnly) => {
        const result = filterTracks(tracks, '', null, favoritesOnly);

        if (!favoritesOnly) {
          // No favorites filter returns all tracks
          expect(result).toHaveLength(tracks.length);
        } else {
          // Every returned track must be a favorite
          for (const track of result) {
            expect(track.isFavorite).toBe(true);
          }
          // Every favorite track must be in the result
          const expected = tracks.filter((t) => t.isFavorite);
          expect(result).toHaveLength(expected.length);
        }
      }),
      { numRuns: 200 },
    );
  });

  it('combined filters are conjunctive — all criteria must match simultaneously', () => {
    fc.assert(
      fc.property(
        trackListArb,
        searchQueryArb,
        lensFilterArb,
        fc.boolean(),
        (tracks, search, lensFilter, favoritesOnly) => {
          const result = filterTracks(tracks, search, lensFilter, favoritesOnly);

          // Manually compute expected result with all filters applied
          let expected = tracks;
          if (search.trim()) {
            const q = search.toLowerCase();
            expected = expected.filter((t) => t.title.toLowerCase().includes(q));
          }
          if (lensFilter) {
            expected = expected.filter((t) => t.lens === lensFilter);
          }
          if (favoritesOnly) {
            expected = expected.filter((t) => t.isFavorite);
          }

          expect(result).toHaveLength(expected.length);
          // Same tracks in same order
          for (let i = 0; i < result.length; i++) {
            expect(result[i].id).toBe(expected[i].id);
          }
        },
      ),
      { numRuns: 200 },
    );
  });

  it('filtering preserves original track order (no reordering)', () => {
    fc.assert(
      fc.property(
        trackListArb,
        searchQueryArb,
        lensFilterArb,
        fc.boolean(),
        (tracks, search, lensFilter, favoritesOnly) => {
          const result = filterTracks(tracks, search, lensFilter, favoritesOnly);

          // Result IDs must appear in the same relative order as in the input
          const inputIds = tracks.map((t) => t.id);
          const resultIds = result.map((t) => t.id);

          let lastIndex = -1;
          for (const id of resultIds) {
            const idx = inputIds.indexOf(id, lastIndex + 1);
            expect(idx).toBeGreaterThan(lastIndex);
            lastIndex = idx;
          }
        },
      ),
      { numRuns: 200 },
    );
  });

  it('search is case-insensitive — same results regardless of query casing', () => {
    fc.assert(
      fc.property(trackListArb, searchQueryArb, (tracks, search) => {
        const lower = filterTracks(tracks, search.toLowerCase(), null, false);
        const upper = filterTracks(tracks, search.toUpperCase(), null, false);
        const original = filterTracks(tracks, search, null, false);

        expect(lower.map((t) => t.id)).toEqual(upper.map((t) => t.id));
        expect(lower.map((t) => t.id)).toEqual(original.map((t) => t.id));
      }),
      { numRuns: 200 },
    );
  });
});
