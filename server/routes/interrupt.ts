import { Router } from 'express';
import { nanoid } from 'nanoid';
import { userMiddleware } from '../middleware/user.js';
import { getTrackById, createInterrupt } from '../db/queries.js';
import { generateReExplanation } from '../services/dashscope.js';
import { synthesizeInterrupt } from '../services/elevenlabs.js';
import type { LearningLens } from '../config/lenses.js';
import { resolveVoiceId } from '../config/voices.js';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = Router();

router.post('/', userMiddleware, async (req, res) => {
  try {
    const { trackId, timestampSec } = req.body as {
      trackId?: string;
      timestampSec?: number;
    };

    // Validate request body
    if (!trackId || typeof trackId !== 'string') {
      res.status(400).json({ error: 'validation_error', message: 'trackId is required' });
      return;
    }
    if (timestampSec == null || typeof timestampSec !== 'number' || timestampSec < 0) {
      res.status(400).json({ error: 'validation_error', message: 'timestampSec must be a non-negative number' });
      return;
    }

    // Get track and verify ownership
    const track = getTrackById(trackId);
    if (!track) {
      res.status(404).json({ error: 'not_found', message: 'Track not found' });
      return;
    }
    if (track.user_id !== req.user!.id) {
      res.status(403).json({ error: 'forbidden', message: 'Track does not belong to this user' });
      return;
    }

    // Parse transcript from track record
    let transcript: Array<{ speaker: 'EXPLAINER' | 'LEARNER'; text: string; startTime: number; endTime: number }>;
    try {
      transcript = JSON.parse(track.transcript || '[]');
    } catch {
      res.status(500).json({ error: 'internal_error', message: 'Failed to parse track transcript' });
      return;
    }

    // Generate re-explanation via DashScope
    const lens = track.lens as LearningLens;
    let explanation: string;
    try {
      explanation = await generateReExplanation(transcript, timestampSec, lens);
    } catch (err: any) {
      res.status(502).json({ error: 'llm_error', message: err.message || 'Re-explanation generation failed' });
      return;
    }

    // Get the explainer voice ID from track's voice_config
    let voiceId: string;
    try {
      const voiceConfig = JSON.parse(track.voice_config || '{}');
      voiceId = voiceConfig.explainer?.voiceId;
      if (!voiceId) {
        throw new Error('No explainer voiceId in voice config');
      }
    } catch (err: any) {
      res.status(500).json({ error: 'internal_error', message: 'Failed to parse voice config' });
      return;
    }

    // Synthesize re-explanation audio via ElevenLabs (eleven_flash_v2_5)
    let audioBuffer: Buffer;
    try {
      audioBuffer = await synthesizeInterrupt({ text: explanation, voiceId: resolveVoiceId(voiceId) });
    } catch (err: any) {
      res.status(502).json({ error: 'tts_error', message: err.message || 'TTS synthesis failed' });
      return;
    }

    // Save audio to public/audio/interrupts/{interruptId}.mp3
    const interruptId = nanoid();
    const interruptsDir = path.join(__dirname, '..', '..', 'public', 'audio', 'interrupts');
    await fs.mkdir(interruptsDir, { recursive: true });
    const audioPath = path.join(interruptsDir, `${interruptId}.mp3`);
    await fs.writeFile(audioPath, audioBuffer);
    const audioUrl = `/audio/interrupts/${interruptId}.mp3`;

    // Create Interrupt DB record
    const interrupt = createInterrupt({
      id: interruptId,
      trackId,
      timestampSec,
      explanation,
      audioUrl,
    });

    // Return interrupt data with camelCase keys
    res.json({
      id: interrupt!.id,
      trackId: interrupt!.track_id,
      timestampSec: interrupt!.timestamp_sec,
      explanation: interrupt!.explanation,
      audioUrl: interrupt!.audio_url,
      createdAt: interrupt!.created_at,
    });
  } catch (err: any) {
    console.error('Interrupt error:', err);
    res.status(500).json({ error: 'internal_error', message: 'An unexpected error occurred' });
  }
});

export default router;
