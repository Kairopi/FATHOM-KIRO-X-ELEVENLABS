import { ElevenLabsClient } from '@elevenlabs/elevenlabs-js';

let _client: ElevenLabsClient | null = null;
let _clientKey: string | undefined = undefined;

function getClient(): ElevenLabsClient {
  const currentKey = process.env.ELEVENLABS_API_KEY;
  // Recreate client if key changed (hot-swap support)
  if (!_client || _clientKey !== currentKey) {
    _client = new ElevenLabsClient({ apiKey: currentKey });
    _clientKey = currentKey;
    if (_clientKey !== currentKey) {
      console.log('[elevenlabs] API key changed, recreated client');
    }
  }
  return _client;
}

/** Collect any stream/iterable into a Buffer */
async function toBuffer(response: any): Promise<Buffer> {
  if (Buffer.isBuffer(response)) return response;
  if (response instanceof Uint8Array) return Buffer.from(response);

  if (response && typeof response[Symbol.asyncIterator] === 'function') {
    const chunks: Buffer[] = [];
    for await (const chunk of response) {
      chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
    }
    return Buffer.concat(chunks);
  }

  if (response && typeof response.getReader === 'function') {
    const reader = response.getReader();
    const chunks: Uint8Array[] = [];
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      if (value) chunks.push(value);
    }
    return Buffer.concat(chunks);
  }

  if (response && typeof response.pipe === 'function') {
    return new Promise<Buffer>((resolve, reject) => {
      const chunks: Buffer[] = [];
      response.on('data', (c: any) => chunks.push(Buffer.isBuffer(c) ? c : Buffer.from(c)));
      response.on('end', () => resolve(Buffer.concat(chunks)));
      response.on('error', reject);
    });
  }

  throw new Error(`Cannot convert to Buffer: ${typeof response}`);
}

/** Wrap a promise with a timeout */
function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(`${label} timed out after ${ms}ms`)), ms);
    promise.then(v => { clearTimeout(timer); resolve(v); }).catch(e => { clearTimeout(timer); reject(e); });
  });
}

/** Retry a function up to N times with delay */
async function withRetry<T>(fn: () => Promise<T>, retries: number, delayMs: number, label: string): Promise<T> {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await fn();
    } catch (err: any) {
      if (attempt === retries) throw err;
      console.warn(`[elevenlabs] ${label} attempt ${attempt + 1} failed: ${err.message}. Retrying in ${delayMs}ms...`);
      await new Promise(r => setTimeout(r, delayMs));
    }
  }
  throw new Error('Unreachable');
}

// ── Conversational voice settings (from ElevenLabs docs) ──
const PODCAST_VOICE_SETTINGS = {
  stability: 0.4,
  similarityBoost: 0.75,
  style: 0.3,
  useSpeakerBoost: true,
};

/**
 * TTS: Synthesize a dialogue segment with retry + timeout + voice settings.
 * Uses eleven_flash_v2_5 as fallback for per-segment synthesis.
 */
export async function synthesizeSegment(params: {
  text: string;
  voiceId: string;
  previousText?: string;
  nextText?: string;
}): Promise<Buffer> {
  return withRetry(async () => {
    const response = await withTimeout(
      getClient().textToSpeech.convert(params.voiceId, {
        text: params.text,
        modelId: 'eleven_flash_v2_5',
        outputFormat: 'mp3_44100_128',
        previousText: params.previousText,
        nextText: params.nextText,
        voiceSettings: PODCAST_VOICE_SETTINGS,
      }),
      20000,
      'TTS'
    );
    return toBuffer(response);
  }, 2, 2000, `TTS "${params.text.substring(0, 30)}..."`);
}

/**
 * Dialogue API: Generate the entire podcast conversation as one cohesive audio
 * using ElevenLabs v3 Text to Dialogue with timestamps.
 * 
 * This produces dramatically more natural, human-sounding speech with:
 * - Natural speaker transitions and overlaps
 * - Emotional expression via audio tags ([cheerfully], [thoughtfully], etc.)
 * - Contextual understanding across the full conversation
 * - Precise per-segment timestamps for transcript sync
 * 
 * Uses direct REST API since the JS SDK doesn't include this endpoint yet.
 * 120s timeout — users accept up to 2 min wait for premium quality.
 */
export async function synthesizeDialogue(params: {
  segments: Array<{ speaker: 'EXPLAINER' | 'LEARNER'; text: string }>;
  explainerVoiceId: string;
  learnerVoiceId: string;
}): Promise<{
  audioBuffer: Buffer;
  voiceSegments: Array<{ voiceId: string; startTime: number; endTime: number }>;
}> {
  const inputs = params.segments.map(seg => ({
    voice_id: seg.speaker === 'EXPLAINER' ? params.explainerVoiceId : params.learnerVoiceId,
    text: seg.text,
  }));

  console.log(`[elevenlabs] Synthesizing dialogue: ${inputs.length} segments via eleven_v3 Text to Dialogue API`);

  const apiKey = process.env.ELEVENLABS_API_KEY;
  if (!apiKey) throw new Error('ELEVENLABS_API_KEY not set');

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 120000);

  try {
    const response = await fetch('https://api.elevenlabs.io/v1/text-to-dialogue/with-timestamps', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'xi-api-key': apiKey,
      },
      body: JSON.stringify({
        inputs,
        model_id: 'eleven_v3',
        output_format: 'mp3_44100_128',
      }),
      signal: controller.signal,
    });

    if (!response.ok) {
      const errBody = await response.text().catch(() => '');
      throw new Error(`Dialogue API returned ${response.status}: ${errBody.substring(0, 200)}`);
    }

    const result = await response.json() as any;

    // Decode base64 audio
    const audioBuffer = Buffer.from(result.audio_base64 || result.audio_base_64, 'base64');

    // Extract voice segment timestamps
    const voiceSegments = (result.voice_segments || []).map((vs: any) => ({
      voiceId: vs.voice_id,
      startTime: vs.start_time_seconds ?? vs.start_time ?? 0,
      endTime: vs.end_time_seconds ?? vs.end_time ?? 0,
    }));

    console.log(`[elevenlabs] Dialogue synthesized: ${audioBuffer.length} bytes, ${voiceSegments.length} voice segments`);

    return { audioBuffer, voiceSegments };
  } finally {
    clearTimeout(timeout);
  }
}

/**
 * TTS: Fast re-explanation (Hold On button) — keeps eleven_flash_v2_5 for speed
 */
export async function synthesizeInterrupt(params: {
  text: string;
  voiceId: string;
}): Promise<Buffer> {
  const response = await withTimeout(
    getClient().textToSpeech.convert(params.voiceId, {
      text: params.text,
      modelId: 'eleven_flash_v2_5',
      outputFormat: 'mp3_44100_128',
      voiceSettings: PODCAST_VOICE_SETTINGS,
    }),
    15000,
    'Interrupt TTS'
  );
  return toBuffer(response);
}

/**
 * Sound Effects: Ambient soundscape. 30s timeout. (Req 5)
 */
export async function generateSoundscape(params: {
  prompt: string;
  durationSeconds: number;
}): Promise<Buffer> {
  const response = await withTimeout(
    getClient().textToSoundEffects.convert({
      text: params.prompt,
      durationSeconds: params.durationSeconds,
      promptInfluence: 0.7,
    }),
    30000,
    'Soundscape'
  );
  return toBuffer(response);
}

/**
 * Music: Intro/outro clip. 45s timeout. (Req 5)
 */
export async function generateMusic(params: {
  prompt: string;
  durationMs: number;
}): Promise<Buffer> {
  const response = await withTimeout(
    getClient().music.compose({
      prompt: params.prompt,
      musicLengthMs: params.durationMs,
      forceInstrumental: true,
    }),
    45000,
    'Music'
  );
  return toBuffer(response);
}

/**
 * STT: Transcribe audio via Scribe. (Req 9)
 */
export async function transcribeAudio(audioBuffer: Buffer): Promise<string> {
  const blob = new Blob([audioBuffer], { type: 'audio/webm' });
  const result = await withTimeout(
    getClient().speechToText.convert({ file: blob, modelId: 'scribe_v2' }),
    30000,
    'STT'
  );
  return result.text;
}
