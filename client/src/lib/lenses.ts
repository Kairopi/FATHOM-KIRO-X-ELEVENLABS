import type { LearningLens } from '@/types';

export interface LensMetadata {
  id: LearningLens;
  name: string;
  description: string;
  icon: string;        // Lucide icon name
  iconEmoji: string;   // Fallback emoji for places that need it (library thumbnails)
  accentColor: string;
}

/**
 * Lens accent colors are hardcoded hex values that MUST match the
 * corresponding CSS custom properties in index.css (--lens-gamer, etc.).
 * Hex values are required because components append opacity suffixes
 * (e.g. `${accentColor}0D` for 5% opacity) which doesn't work with var().
 */
export const LENS_METADATA: Record<LearningLens, LensMetadata> = {
  gamer: {
    id: 'gamer',
    name: 'Gamer',
    description: 'Level up your knowledge with gaming metaphors and boss-fight analogies',
    icon: 'Swords',
    iconEmoji: '⚔️',
    accentColor: '#8B5CF6', // must match --lens-gamer
  },
  coach: {
    id: 'coach',
    name: 'Coach',
    description: 'Get motivated with sports coaching language and team-based analogies',
    icon: 'Dumbbell',
    iconEmoji: '💪',
    accentColor: '#10B981', // must match --lens-coach
  },
  eli5: {
    id: 'eli5',
    name: 'ELI5',
    description: 'Explain like I\'m five — simple words, fun comparisons, zero jargon',
    icon: 'Lightbulb',
    iconEmoji: '💡',
    accentColor: '#F59E0B', // must match --lens-eli5
  },
  storyteller: {
    id: 'storyteller',
    name: 'Storyteller',
    description: 'Weave knowledge into epic narrative arcs and dramatic storytelling',
    icon: 'Drama',
    iconEmoji: '🎭',
    accentColor: '#F97316', // must match --lens-storyteller
  },
  scientist: {
    id: 'scientist',
    name: 'Scientist',
    description: 'Precise, hypothesis-driven explanations with experimental thinking',
    icon: 'Atom',
    iconEmoji: '⚛️',
    accentColor: '#3B82F6', // must match --lens-scientist
  },
  pop_culture: {
    id: 'pop_culture',
    name: 'Pop Culture',
    description: 'Learn through movies, TV shows, memes, and trending references',
    icon: 'Popcorn',
    iconEmoji: '🍿',
    accentColor: '#EC4899', // must match --lens-popculture
  },
  chef: {
    id: 'chef',
    name: 'Chef',
    description: 'Cook up understanding with recipe-style breakdowns and kitchen wisdom',
    icon: 'CookingPot',
    iconEmoji: '🍳',
    accentColor: '#F97316', // must match --lens-chef
  },
  street_smart: {
    id: 'street_smart',
    name: 'Street Smart',
    description: 'Real-world practical wisdom with no-nonsense street-wise analogies',
    icon: 'Compass',
    iconEmoji: '🧭',
    accentColor: '#6B7280', // must match --lens-streetsmart
  },
};

export function getLensMetadata(lens: LearningLens): LensMetadata {
  return LENS_METADATA[lens];
}

export const ALL_LENSES: LearningLens[] = Object.keys(LENS_METADATA) as LearningLens[];
