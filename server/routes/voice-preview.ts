import { Router } from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { resolveVoiceId } from '../config/voices.js';
import { synthesizeSegment } from '../services/elevenlabs.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PREVIEW_DIR = path.join(__dirname, '..', '..', 'public', 'audio', 'previews');

const PREVIEW_TEXT: Record<string, string> = {
  marcus: "Hey there! Welcome to the show. Today we're diving into something really fascinating, and I think you're going to love it.",
  aria: "Oh wow, that sounds amazing! I honestly can't wait to learn more about this topic.",
  kai: "Let's take a step back and think about this from a different angle. There's something deeper here worth exploring.",
  luna: "That's such a great question! Here's what I think is really interesting about it, and why it matters.",
  rex: "Alright, so here's the thing. The key insight you need to understand is actually pretty mind-blowing when you think about it.",
};

const router = Router();

// GET /api/voice-preview/:voiceId — returns preview audio, generates on first request
router.get('/:voiceId', async (req, res) => {
  const { voiceId } = req.params;
  const filePath = path.join(PREVIEW_DIR, `voice_${voiceId}.mp3`);

  // Serve cached file if it exists
  if (fs.existsSync(filePath)) {
    res.setHeader('Content-Type', 'audio/mpeg');
    res.setHeader('Cache-Control', 'public, max-age=86400');
    fs.createReadStream(filePath).pipe(res);
    return;
  }

  // Generate on-demand
  const text = PREVIEW_TEXT[voiceId] || "Hello! This is a preview of my voice.";
  const elevenLabsVoiceId = resolveVoiceId(voiceId);

  try {
    console.log(`[voice-preview] Generating preview for ${voiceId}...`);
    const buffer = await synthesizeSegment({ text, voiceId: elevenLabsVoiceId });

    fs.mkdirSync(PREVIEW_DIR, { recursive: true });
    fs.writeFileSync(filePath, buffer);

    res.setHeader('Content-Type', 'audio/mpeg');
    res.setHeader('Cache-Control', 'public, max-age=86400');
    res.send(buffer);
    console.log(`[voice-preview] Generated and cached preview for ${voiceId}`);
  } catch (err: any) {
    console.error(`[voice-preview] Failed to generate preview for ${voiceId}:`, err.message);
    res.status(500).json({ error: 'Failed to generate voice preview' });
  }
});

export default router;
