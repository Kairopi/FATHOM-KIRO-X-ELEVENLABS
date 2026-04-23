import OpenAI from 'openai';
import { getLensConfig, type LearningLens } from '../config/lenses.js';
import { getFormatConfig, type PodcastFormat, type PodcastLength, LENGTH_CONFIGS } from '../config/formats.js';

export interface ScriptSegment {
  speaker: 'EXPLAINER' | 'LEARNER';
  text: string;
}

interface TranscriptSegment {
  speaker: 'EXPLAINER' | 'LEARNER';
  text: string;
  startTime: number;
  endTime: number;
}

let _client: OpenAI | null = null;
let _clientKey: string | undefined = undefined;

function getClient(): OpenAI {
  const currentKey = process.env.DASHSCOPE_API_KEY;
  if (!_client || _clientKey !== currentKey) {
    _client = new OpenAI({
      apiKey: currentKey,
      baseURL: 'https://dashscope-intl.aliyuncs.com/compatible-mode/v1',
    });
    _clientKey = currentKey;
  }
  return _client;
}

// ── Stage 1: Content Pre-Processing (Req 1) ──

export async function preprocessContent(content: string): Promise<string> {
  // Hard cap: never send more than 30K chars to the LLM
  const trimmed = content.length > 30000 ? content.substring(0, 30000) : content;

  if (trimmed.length <= 3000) return trimmed;

  console.log(`[dashscope] Pre-processing ${trimmed.length} chars...`);
  try {
    const response = await getClient().chat.completions.create({
      model: 'qwen-max',
      response_format: { type: 'json_object' },
      messages: [
        {
          role: 'system',
          content: `You are a content analyst. Summarize the following text for a podcast script writer.
Preserve key facts, arguments, examples, and interesting details. Remove redundancy.
Output JSON: { "summary": "condensed text under 2000 words", "keyTopics": ["topic1", "topic2", "topic3"] }`,
        },
        { role: 'user', content: trimmed },
      ],
    });

    const raw = response.choices[0]?.message?.content;
    if (!raw) return trimmed.substring(0, 4000);

    const parsed = JSON.parse(raw);
    return parsed.summary || trimmed.substring(0, 4000);
  } catch (err: any) {
    console.error('[dashscope] Pre-processing failed, using raw content:', err.message);
    return trimmed.substring(0, 4000);
  }
}

// ── Stage 2: Script Generation (Req 2) ──

const SCRIPT_SYSTEM_PROMPT = `You are a podcast script writer. Generate a two-speaker conversational podcast script.

Speakers:
- EXPLAINER: Knowledgeable and enthusiastic. Teaches the material with clarity and energy.
- LEARNER: Curious and engaged. Asks genuine questions, reacts with surprise or interest, pushes for clarity.

Output ONLY valid JSON:
{
  "title": "A short, catchy episode title",
  "segments": [
    { "speaker": "EXPLAINER", "text": "dialogue text" },
    { "speaker": "LEARNER", "text": "dialogue text" }
  ]
}

Rules:
- Generate exactly 10-15 segments
- Each segment is 1-3 sentences
- Alternate speakers naturally
- The LEARNER asks real questions, not just "wow tell me more"
- Make it feel like a real conversation between friends`;

export async function generateScript(
  content: string,
  lens: LearningLens,
  format: PodcastFormat = 'deep_dive',
  length: PodcastLength = 'medium'
): Promise<{ title: string; segments: ScriptSegment[] }> {
  const lensConfig = getLensConfig(lens);
  const formatConfig = getFormatConfig(format);
  const lengthConfig = LENGTH_CONFIGS[length];

  const minSegs = Math.round(formatConfig.segmentCount.min * lengthConfig.segmentMultiplier);
  const maxSegs = Math.round(formatConfig.segmentCount.max * lengthConfig.segmentMultiplier);

  const systemPrompt = `${SCRIPT_SYSTEM_PROMPT}

${formatConfig.systemPromptOverride}

Generate ${minSegs}-${maxSegs} segments.

Lens style: ${lensConfig.name}
${lensConfig.systemPromptModifier}`;

  const response = await getClient().chat.completions.create({
    model: 'qwen-max',
    response_format: { type: 'json_object' },
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: `Create a podcast conversation about this:\n\n${content}` },
    ],
  });

  const raw = response.choices[0]?.message?.content;
  if (!raw) throw new Error('DashScope returned empty response');

  let parsed: { title?: string; segments?: any[] };
  try { parsed = JSON.parse(raw); } catch { throw new Error('DashScope returned invalid JSON'); }

  if (!Array.isArray(parsed.segments) || parsed.segments.length === 0) {
    throw new Error('DashScope returned no segments');
  }

  // Limit to 15 segments max
  const rawSegments = parsed.segments.slice(0, 15);

  const segments: ScriptSegment[] = rawSegments.map((seg: any) => ({
    speaker: seg.speaker === 'LEARNER' ? 'LEARNER' as const : 'EXPLAINER' as const,
    text: String(seg.text || ''),
  }));

  const hasExplainer = segments.some((s) => s.speaker === 'EXPLAINER');
  const hasLearner = segments.some((s) => s.speaker === 'LEARNER');
  if (!hasExplainer || !hasLearner) throw new Error('Script must contain both speakers');

  return { title: String(parsed.title || 'Untitled Podcast'), segments };
}

// ── Stage 3: Script Refinement (Req 3) ──

export async function refineScript(
  segments: ScriptSegment[]
): Promise<ScriptSegment[]> {
  console.log(`[dashscope] Refining ${segments.length} segments...`);

  const scriptText = segments.map(s => `${s.speaker}: ${s.text}`).join('\n');

  try {
    const response = await getClient().chat.completions.create({
      model: 'qwen-max',
      response_format: { type: 'json_object' },
      messages: [
        {
          role: 'system',
          content: `You are a podcast script editor. Take this podcast script and make it sound more natural and conversational.

Add:
- Natural filler words: "so", "right", "you know", "I mean"
- Genuine reactions: "wow", "that makes sense", "oh interesting", "wait really?"
- Smooth transitions between topics
- Make the LEARNER's questions feel spontaneous, not scripted
- Add ElevenLabs v3 audio tags in square brackets for emotional delivery. Use tags like:
  [cheerfully], [thoughtfully], [excitedly], [curiously], [surprised], [laughs], [sighs]
  Place them at the START of a sentence or before key emotional moments.
  Example: "[excitedly] Oh wow, that's actually really cool!"
  Example: "[thoughtfully] Hmm, so what you're saying is..."
  Don't overuse them — 1-2 tags per segment max, and only where they feel natural.

Keep the same number of segments and speakers. Keep each segment 1-3 sentences.

Output JSON: { "segments": [{ "speaker": "EXPLAINER"|"LEARNER", "text": "refined dialogue with audio tags" }] }`,
        },
        { role: 'user', content: `Refine this script:\n\n${scriptText}` },
      ],
    });

    const raw = response.choices[0]?.message?.content;
    if (!raw) return segments;

    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed.segments) || parsed.segments.length === 0) return segments;

    return parsed.segments.map((seg: any) => ({
      speaker: seg.speaker === 'LEARNER' ? 'LEARNER' as const : 'EXPLAINER' as const,
      text: String(seg.text || ''),
    }));
  } catch (err: any) {
    console.error('[dashscope] Refinement failed, using original script:', err.message);
    return segments;
  }
}

// ── Hold On Re-Explanation ──

export async function generateReExplanation(
  transcript: TranscriptSegment[],
  timestampSec: number,
  lens: LearningLens
): Promise<string> {
  const lensConfig = getLensConfig(lens);
  const currentSegment = transcript.find(s => s.startTime <= timestampSec && s.endTime > timestampSec);
  const currentIdx = currentSegment ? transcript.indexOf(currentSegment) : transcript.length - 1;
  const contextStart = Math.max(0, currentIdx - 2);
  const contextText = transcript.slice(contextStart, currentIdx + 1).map(s => `${s.speaker}: ${s.text}`).join('\n');

  const response = await getClient().chat.completions.create({
    model: 'qwen-max',
    response_format: { type: 'json_object' },
    messages: [
      {
        role: 'system',
        content: `You are a patient teacher. Re-explain the concept in simpler terms.
Lens style: ${lensConfig.name}. ${lensConfig.systemPromptModifier}
Output JSON: { "explanation": "your simplified re-explanation here" }
Keep it to 2-3 sentences. Be clear and concise.`,
      },
      { role: 'user', content: `The listener needs a simpler explanation of:\n\n${contextText}` },
    ],
  });

  const raw = response.choices[0]?.message?.content;
  if (!raw) throw new Error('Empty re-explanation response');
  const parsed = JSON.parse(raw);
  return parsed.explanation || raw;
}


// ── Key Takeaways Generation ──

export async function generateTakeaways(content: string, title: string): Promise<string[]> {
  console.log('[dashscope] Generating takeaways...');
  try {
    const response = await getClient().chat.completions.create({
      model: 'qwen-max',
      response_format: { type: 'json_object' },
      messages: [
        {
          role: 'system',
          content: `Extract 3-5 key takeaways from this podcast content. Each takeaway should be one clear, actionable sentence.
Output JSON: { "takeaways": ["takeaway 1", "takeaway 2", "takeaway 3"] }`,
        },
        { role: 'user', content: `Podcast title: "${title}"\n\nContent:\n${content}` },
      ],
    });
    const raw = response.choices[0]?.message?.content;
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed.takeaways) ? parsed.takeaways.map(String) : [];
  } catch (err: any) {
    console.error('[dashscope] Takeaways generation failed:', err.message);
    return [];
  }
}

// ── Learning Quiz Generation ──

export interface QuizQuestion {
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

export async function generateQuiz(content: string, title: string): Promise<QuizQuestion[]> {
  console.log('[dashscope] Generating quiz...');
  try {
    const response = await getClient().chat.completions.create({
      model: 'qwen-max',
      response_format: { type: 'json_object' },
      messages: [
        {
          role: 'system',
          content: `Create a 5-question multiple choice quiz to test understanding of this podcast content.
Each question should have 4 options with exactly one correct answer.
Include a brief explanation for the correct answer.

Output JSON:
{
  "questions": [
    {
      "question": "What is...?",
      "options": ["A", "B", "C", "D"],
      "correctIndex": 0,
      "explanation": "A is correct because..."
    }
  ]
}`,
        },
        { role: 'user', content: `Podcast title: "${title}"\n\nContent:\n${content}` },
      ],
    });
    const raw = response.choices[0]?.message?.content;
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed.questions)) return [];
    return parsed.questions.map((q: any) => ({
      question: String(q.question || ''),
      options: Array.isArray(q.options) ? q.options.map(String) : [],
      correctIndex: typeof q.correctIndex === 'number' ? q.correctIndex : 0,
      explanation: String(q.explanation || ''),
    }));
  } catch (err: any) {
    console.error('[dashscope] Quiz generation failed:', err.message);
    return [];
  }
}
