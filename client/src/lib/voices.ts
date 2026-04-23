// Frontend preset voice metadata for UI rendering (mirrors server/config/voices.ts)

export interface VoiceMetadata {
  id: string;
  name: string;
  description: string;
}

export const PRESET_VOICES: VoiceMetadata[] = [
  { id: 'marcus', name: 'Marcus', description: 'Lively, expressive explainer' },
  { id: 'aria', name: 'Aria', description: 'Friendly, energetic' },
  { id: 'kai', name: 'Kai', description: 'Calm, thoughtful narrator' },
  { id: 'luna', name: 'Luna', description: 'Bright, curious' },
  { id: 'rex', name: 'Rex', description: 'Podcast-ready, engaging' },
];
