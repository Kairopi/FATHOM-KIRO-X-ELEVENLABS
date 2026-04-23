import { Router } from 'express';
import { nanoid } from 'nanoid';
import { userMiddleware } from '../middleware/user.js';
import { preprocessContent, generateScript, refineScript, generateTakeaways, generateQuiz, type ScriptSegment } from '../services/dashscope.js';
import { synthesizeSegment, synthesizeDialogue, generateSoundscape, generateMusic } from '../services/elevenlabs.js';
import { assembleVoiceTrack, saveSoundscape, saveMusic } from '../services/audio-assembler.js';
import { createTrack } from '../db/queries.js';
import { getLensConfig, type LearningLens, ALL_LENSES } from '../config/lenses.js';
import { type PodcastFormat, type PodcastLength, ALL_FORMATS } from '../config/formats.js';
import { resolveVoiceId } from '../config/voices.js';
import { generateShareId } from '../utils/share-id.js';

const router = Router();

interface GenerateBody {
  content: string;
  lens: LearningLens;
  format?: PodcastFormat;
  length?: PodcastLength;
  voiceConfig: {
    explainer: { voiceId: string; name: string };
    learner: { voiceId: string; name: string };
  };
}

// Helper to send SSE progress events
function sendProgress(res: any, step: string, current: number, total: number) {
  const percent = Math.round((current / total) * 100);
  const data = JSON.stringify({ step, current, total, percent });
  res.write(`data: ${data}\n\n`);
}

router.post('/', userMiddleware, async (req, res) => {
  const { content, lens, format = 'deep_dive', length = 'medium', voiceConfig } = req.body as GenerateBody;

  // Validate input
  if (!content || typeof content !== 'string' || content.trim().length === 0) {
    res.status(400).json({ error: 'validation_error', message: 'Content is required' });
    return;
  }
  if (!lens || !ALL_LENSES.includes(lens)) {
    res.status(400).json({ error: 'validation_error', message: 'Valid learning lens is required' });
    return;
  }
  if (!voiceConfig?.explainer?.voiceId || !voiceConfig?.learner?.voiceId) {
    res.status(400).json({ error: 'validation_error', message: 'Voice configuration is required' });
    return;
  }

  // Check if client wants SSE
  const wantsSSE = req.headers.accept === 'text/event-stream';

  if (wantsSSE) {
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    });
  }

  const progress = (step: string, current: number, total: number) => {
    console.log(`[generate] ${step} (${current}/${total})`);
    if (wantsSSE) sendProgress(res, step, current, total);
  };

  try {
    const trackId = nanoid();
    const lensConfig = getLensConfig(lens);
    const totalSteps = 20; // rough estimate, updated as we learn segment count

    // ── Stage 1: Pre-process content (Req 1) ──
    progress('Analyzing content', 1, totalSteps);
    let processedContent: string;
    try {
      processedContent = await preprocessContent(content.trim());
    } catch {
      processedContent = content.trim().substring(0, 4000);
    }

    // ── Start parallel audio generation NOW (Req 5) ──
    const estimatedDuration = 60; // seconds
    const audioPromise = Promise.allSettled([
      generateSoundscape({ prompt: lensConfig.soundscapePrompt, durationSeconds: Math.min(estimatedDuration, 30) }),
      generateMusic({ prompt: lensConfig.musicPrompt, durationMs: 10000 }),
      generateMusic({ prompt: lensConfig.musicPrompt, durationMs: 5000 }),
    ]);

    // ── Stage 2: Generate script (Req 2) ──
    progress('Writing script', 3, totalSteps);
    let scriptResult: { title: string; segments: ScriptSegment[] };
    try {
      scriptResult = await generateScript(processedContent, lens, format, length);
      console.log(`[generate] Script: "${scriptResult.title}" with ${scriptResult.segments.length} segments`);
    } catch (err: any) {
      const msg = 'Could not generate script. Please try again.';
      if (wantsSSE) { res.write(`data: ${JSON.stringify({ error: msg })}\n\n`); res.end(); }
      else res.status(502).json({ error: 'llm_error', message: msg });
      return;
    }

    // ── Stage 3: Refine script (Req 3) ──
    progress('Refining script', 5, totalSteps);
    let refinedSegments: ScriptSegment[];
    try {
      refinedSegments = await refineScript(scriptResult.segments);
    } catch {
      refinedSegments = scriptResult.segments;
    }

    // ── Collect parallel audio results ──
    const [soundscapeResult, introResult, outroResult] = await audioPromise;
    let soundscapeUrl: string | null = null;
    let introMusicUrl: string | null = null;
    let outroMusicUrl: string | null = null;

    if (soundscapeResult.status === 'fulfilled') soundscapeUrl = saveSoundscape(trackId, soundscapeResult.value);
    else console.warn('[generate] Soundscape failed:', (soundscapeResult as PromiseRejectedResult).reason?.message);

    if (introResult.status === 'fulfilled') introMusicUrl = saveMusic(trackId, 'intro', introResult.value);
    else console.warn('[generate] Intro music failed:', (introResult as PromiseRejectedResult).reason?.message);

    if (outroResult.status === 'fulfilled') outroMusicUrl = saveMusic(trackId, 'outro', outroResult.value);
    else console.warn('[generate] Outro music failed:', (outroResult as PromiseRejectedResult).reason?.message);

    // ── Stage 4: TTS synthesis via eleven_v3 Text to Dialogue API ──
    // Uses the highest-quality model for natural, human-sounding podcast audio.
    // Falls back to per-segment synthesis if the Dialogue API fails.
    progress(`Synthesizing voices`, 7, 7 + 4);

    const explainerVoiceId = resolveVoiceId(voiceConfig.explainer.voiceId);
    const learnerVoiceId = resolveVoiceId(voiceConfig.learner.voiceId);

    let voiceTrackBuffer: Buffer;
    let transcriptSegments: Array<{ speaker: 'EXPLAINER' | 'LEARNER'; text: string; startTime: number; endTime: number }>;

    try {
      // ── Primary: Text to Dialogue API (eleven_v3) — best quality ──
      progress('Synthesizing voices (v3 dialogue)', 7, 7 + 4);
      const dialogueResult = await synthesizeDialogue({
        segments: refinedSegments,
        explainerVoiceId,
        learnerVoiceId,
      });

      voiceTrackBuffer = dialogueResult.audioBuffer;

      // Build transcript from voice segment timestamps
      if (dialogueResult.voiceSegments.length === refinedSegments.length) {
        transcriptSegments = refinedSegments.map((seg, i) => ({
          speaker: seg.speaker,
          text: seg.text,
          startTime: dialogueResult.voiceSegments[i].startTime,
          endTime: dialogueResult.voiceSegments[i].endTime,
        }));
      } else {
        // Fallback: distribute timestamps evenly if segment count doesn't match
        const totalDuration = dialogueResult.voiceSegments.length > 0
          ? dialogueResult.voiceSegments[dialogueResult.voiceSegments.length - 1].endTime
          : voiceTrackBuffer.length / 16000;
        const segDuration = totalDuration / refinedSegments.length;
        transcriptSegments = refinedSegments.map((seg, i) => ({
          speaker: seg.speaker,
          text: seg.text,
          startTime: i * segDuration,
          endTime: (i + 1) * segDuration,
        }));
      }

      console.log(`[generate] Dialogue API succeeded: ${voiceTrackBuffer.length} bytes`);
    } catch (dialogueErr: any) {
      // ── Fallback: per-segment TTS (eleven_flash_v2_5) ──
      console.warn(`[generate] Dialogue API failed, falling back to per-segment TTS: ${dialogueErr.message}`);

      const segmentBuffers: Buffer[] = [];
      transcriptSegments = [];
      let currentTimeSec = 0;
      const segCount = refinedSegments.length;

      for (let i = 0; i < segCount; i++) {
        const seg = refinedSegments[i];
        progress(`Synthesizing voice ${i + 1} of ${segCount}`, 7 + i, 7 + segCount + 2);

        const voiceId = seg.speaker === 'EXPLAINER' ? explainerVoiceId : learnerVoiceId;
        const previousText = i > 0 ? refinedSegments[i - 1].text : undefined;
        const nextText = i < segCount - 1 ? refinedSegments[i + 1].text : undefined;

        let buffer: Buffer;
        try {
          buffer = await synthesizeSegment({ text: seg.text, voiceId, previousText, nextText });
        } catch (err: any) {
          const msg = `Voice synthesis failed on segment ${i + 1}. Please try again.`;
          if (wantsSSE) { res.write(`data: ${JSON.stringify({ error: msg })}\n\n`); res.end(); }
          else res.status(502).json({ error: 'tts_error', message: msg });
          return;
        }

        segmentBuffers.push(buffer);
        const segDuration = buffer.length / 16000;
        transcriptSegments.push({ speaker: seg.speaker, text: seg.text, startTime: currentTimeSec, endTime: currentTimeSec + segDuration });
        currentTimeSec += segDuration;
      }

      voiceTrackBuffer = Buffer.concat(segmentBuffers);
    }

    // ── Assemble audio (Req 6) ──
    const segCount = refinedSegments.length;
    progress('Assembling audio', 7 + segCount, 7 + segCount + 2);
    const { audioUrl, durationSec } = await assembleVoiceTrack({ trackId, segmentBuffers: [voiceTrackBuffer] });

    // ── Save track ──
    progress('Saving track', 7 + segCount + 1, 7 + segCount + 2);
    const shareId = generateShareId();

    // Generate takeaways + quiz in parallel (non-blocking)
    const [takeawaysResult, quizResult] = await Promise.allSettled([
      generateTakeaways(processedContent, scriptResult.title),
      generateQuiz(processedContent, scriptResult.title),
    ]);

    const takeaways = takeawaysResult.status === 'fulfilled' ? takeawaysResult.value : [];
    const quiz = quizResult.status === 'fulfilled' ? quizResult.value : [];

    const track = createTrack({
      id: trackId, userId: req.user!.id, title: scriptResult.title, sourceText: content.trim(),
      lens, voiceConfig: JSON.stringify(voiceConfig), transcript: JSON.stringify(transcriptSegments),
      audioUrl, duration: durationSec, shareId, soundscapeUrl, introMusicUrl, outroMusicUrl,
    });

    // ── Return result ──
    const trackData = {
      id: track!.id, title: track!.title, sourceText: track!.source_text, lens: track!.lens,
      format,
      voiceConfig: JSON.parse(track!.voice_config || '{}'), transcript: JSON.parse(track!.transcript || '[]'),
      audioUrl: track!.audio_url, duration: track!.duration, shareId: track!.share_id,
      isFavorite: Boolean(track!.is_favorite), soundscapeUrl: track!.soundscape_url,
      introMusicUrl: track!.intro_music_url, outroMusicUrl: track!.outro_music_url,
      takeaways, quiz,
      createdAt: track!.created_at,
    };

    if (wantsSSE) {
      res.write(`data: ${JSON.stringify({ step: 'Complete', percent: 100, track: trackData })}\n\n`);
      res.end();
    } else {
      res.json(trackData);
    }

    console.log(`[generate] Complete: "${scriptResult.title}" (${durationSec}s, ${segCount} segments)`);
  } catch (err: any) {
    console.error('[generate] Pipeline error:', err);
    const msg = 'An unexpected error occurred during generation';
    if (wantsSSE) { res.write(`data: ${JSON.stringify({ error: msg })}\n\n`); res.end(); }
    else res.status(500).json({ error: 'internal_error', message: msg });
  }
});

export default router;
