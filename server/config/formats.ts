// Podcast format configurations

export type PodcastFormat = 'deep_dive' | 'brief' | 'debate' | 'critique';
export type PodcastLength = 'short' | 'medium' | 'long';

export interface FormatConfig {
  id: PodcastFormat;
  name: string;
  description: string;
  segmentCount: { min: number; max: number };
  systemPromptOverride: string;
}

export const FORMAT_CONFIGS: Record<PodcastFormat, FormatConfig> = {
  deep_dive: {
    id: 'deep_dive',
    name: 'Deep Dive',
    description: 'Thorough exploration with detailed explanations',
    segmentCount: { min: 12, max: 18 },
    systemPromptOverride: `Format: DEEP DIVE
The EXPLAINER goes deep into the topic, covering nuances, edge cases, and connections.
The LEARNER asks probing follow-up questions and challenges assumptions.
Cover the topic thoroughly with examples and analogies.`,
  },
  brief: {
    id: 'brief',
    name: 'Brief',
    description: 'Quick summary hitting the key points',
    segmentCount: { min: 6, max: 8 },
    systemPromptOverride: `Format: BRIEF SUMMARY
Keep it concise. Hit the 3-5 most important points only.
The EXPLAINER gives tight, focused explanations.
The LEARNER asks only the most essential clarifying questions.
No tangents. Get to the point fast.`,
  },
  debate: {
    id: 'debate',
    name: 'Debate',
    description: 'Two sides argue different perspectives',
    segmentCount: { min: 10, max: 14 },
    systemPromptOverride: `Format: DEBATE
Instead of EXPLAINER/LEARNER, both speakers take opposing sides on the topic.
Speaker 1 (EXPLAINER) argues FOR the main thesis.
Speaker 2 (LEARNER) argues AGAINST or presents counterpoints.
They challenge each other respectfully but firmly.
Include rebuttals, concessions, and a balanced conclusion.`,
  },
  critique: {
    id: 'critique',
    name: 'Critique',
    description: 'Critical analysis examining strengths and weaknesses',
    segmentCount: { min: 8, max: 12 },
    systemPromptOverride: `Format: CRITIQUE
The EXPLAINER presents the topic objectively.
The LEARNER plays devil's advocate, questioning claims, pointing out weaknesses, and demanding evidence.
Examine both strengths and weaknesses of the ideas presented.
End with a balanced assessment.`,
  },
};

export const LENGTH_CONFIGS: Record<PodcastLength, { segmentMultiplier: number; label: string }> = {
  short: { segmentMultiplier: 0.6, label: '2-3 min' },
  medium: { segmentMultiplier: 1.0, label: '5-7 min' },
  long: { segmentMultiplier: 1.5, label: '10-15 min' },
};

export function getFormatConfig(format: PodcastFormat): FormatConfig {
  return FORMAT_CONFIGS[format];
}

export const ALL_FORMATS: PodcastFormat[] = Object.keys(FORMAT_CONFIGS) as PodcastFormat[];
