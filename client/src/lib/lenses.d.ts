import type { LearningLens } from '@/types';
export interface LensMetadata {
    id: LearningLens;
    name: string;
    description: string;
    icon: string;
    iconEmoji: string;
    accentColor: string;
}
/**
 * Lens accent colors are hardcoded hex values that MUST match the
 * corresponding CSS custom properties in index.css (--lens-gamer, etc.).
 * Hex values are required because components append opacity suffixes
 * (e.g. `${accentColor}0D` for 5% opacity) which doesn't work with var().
 */
export declare const LENS_METADATA: Record<LearningLens, LensMetadata>;
export declare function getLensMetadata(lens: LearningLens): LensMetadata;
export declare const ALL_LENSES: LearningLens[];
