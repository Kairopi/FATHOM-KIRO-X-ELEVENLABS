// Learning Lens type
export type LearningLens =
  | 'gamer'
  | 'coach'
  | 'eli5'
  | 'storyteller'
  | 'scientist'
  | 'pop_culture'
  | 'chef'
  | 'street_smart';

// Podcast format
export type PodcastFormat = 'deep_dive' | 'brief' | 'debate' | 'critique';

// Podcast length
export type PodcastLength = 'short' | 'medium' | 'long';

// Voice pair configuration
export interface VoicePair {
  explainer: { voiceId: string; name: string };
  learner: { voiceId: string; name: string };
}

// Script segment from DashScope
export interface ScriptSegment {
  speaker: 'EXPLAINER' | 'LEARNER';
  text: string;
  stageDirection?: string;
}

// Track as returned from API
export interface Track {
  id: string;
  title: string;
  sourceText: string;
  lens: LearningLens;
  format: PodcastFormat;
  voiceConfig: VoicePair;
  transcript: TranscriptSegment[];
  audioUrl: string;
  duration: number;
  shareId: string;
  isFavorite: boolean;
  soundscapeUrl: string | null;
  introMusicUrl: string | null;
  outroMusicUrl: string | null;
  takeaways: string[] | null;
  quiz: QuizQuestion[] | null;
  createdAt: string;
}

// Quiz question for post-listen
export interface QuizQuestion {
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

// Transcript segment with timing for sync
export interface TranscriptSegment {
  speaker: 'EXPLAINER' | 'LEARNER';
  text: string;
  startTime: number;
  endTime: number;
}

// Interrupt record
export interface Interrupt {
  id: string;
  trackId: string;
  timestampSec: number;
  explanation: string;
  audioUrl: string;
  createdAt: string;
}

// Preset voice definition
export interface PresetVoice {
  id: string;
  name: string;
  description: string;
  elevenLabsVoiceId: string | null;
  previewAudioUrl: string | null;
}

// Lens configuration
export interface LensConfig {
  id: LearningLens;
  name: string;
  description: string;
  icon: string;
  accentColor: string;
  soundscapePrompt: string;
  musicPrompt: string;
  systemPromptModifier: string;
}
