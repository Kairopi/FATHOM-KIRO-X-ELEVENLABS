export type LearningLens = 'gamer' | 'coach' | 'eli5' | 'storyteller' | 'scientist' | 'pop_culture' | 'chef' | 'street_smart';
export type PodcastFormat = 'deep_dive' | 'brief' | 'debate' | 'critique';
export type PodcastLength = 'short' | 'medium' | 'long';
export interface VoicePair {
    explainer: {
        voiceId: string;
        name: string;
    };
    learner: {
        voiceId: string;
        name: string;
    };
}
export interface ScriptSegment {
    speaker: 'EXPLAINER' | 'LEARNER';
    text: string;
    stageDirection?: string;
}
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
export interface QuizQuestion {
    question: string;
    options: string[];
    correctIndex: number;
    explanation: string;
}
export interface TranscriptSegment {
    speaker: 'EXPLAINER' | 'LEARNER';
    text: string;
    startTime: number;
    endTime: number;
}
export interface Interrupt {
    id: string;
    trackId: string;
    timestampSec: number;
    explanation: string;
    audioUrl: string;
    createdAt: string;
}
export interface PresetVoice {
    id: string;
    name: string;
    description: string;
    elevenLabsVoiceId: string | null;
    previewAudioUrl: string | null;
}
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
