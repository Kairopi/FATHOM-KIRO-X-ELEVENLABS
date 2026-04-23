// Preset voice definitions mapped to real ElevenLabs voice IDs

export interface PresetVoice {
  id: string;
  name: string;
  description: string;
  elevenLabsVoiceId: string;
  previewAudioUrl: string | null;
}

export const PRESET_VOICES: PresetVoice[] = [
  {
    id: 'marcus',
    name: 'Marcus',
    description: 'Lively, expressive explainer',
    elevenLabsVoiceId: 'VCgLBmBjldJmfphyB8sZ', // Liam - Lively, expressive, professional (#1 explainer voice)
    previewAudioUrl: null,
  },
  {
    id: 'aria',
    name: 'Aria',
    description: 'Friendly, energetic',
    elevenLabsVoiceId: 'cgSgspJ2msm6clMCkdW9', // Jessica - Playful, Bright, Warm
    previewAudioUrl: null,
  },
  {
    id: 'kai',
    name: 'Kai',
    description: 'Calm, thoughtful narrator',
    elevenLabsVoiceId: '991lF4hc0xxfec4Y6B0i', // Henry - Calm, thoughtful, emotionally grounded (#2 documentary voice)
    previewAudioUrl: null,
  },
  {
    id: 'luna',
    name: 'Luna',
    description: 'Bright, curious',
    elevenLabsVoiceId: 'Xb7hH8MSUJpSbSDYk0k2', // Alice - Clear, Engaging Educator
    previewAudioUrl: null,
  },
  {
    id: 'rex',
    name: 'Rex',
    description: 'Podcast-ready, engaging',
    elevenLabsVoiceId: 'vBKc2FfBKJfcZNyEt1n6', // Finn - Tenor pitched, excellent for podcasts
    previewAudioUrl: null,
  },
];

export function getVoiceById(id: string): PresetVoice | undefined {
  return PRESET_VOICES.find((v) => v.id === id);
}

// Map internal voice ID to ElevenLabs voice ID
export function resolveVoiceId(internalId: string): string {
  const voice = getVoiceById(internalId);
  if (voice) return voice.elevenLabsVoiceId;
  // If it's already an ElevenLabs ID, return as-is
  return internalId;
}
