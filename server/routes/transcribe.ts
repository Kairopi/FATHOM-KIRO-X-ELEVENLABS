import { Router } from 'express';
import { userMiddleware } from '../middleware/user.js';
import { transcribeAudio } from '../services/elevenlabs.js';

const router = Router();

router.post('/', userMiddleware, async (req, res) => {
  try {
    // Expect raw audio body (sent as application/octet-stream or similar)
    const chunks: Buffer[] = [];
    for await (const chunk of req) {
      chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
    }
    const audioBuffer = Buffer.concat(chunks);

    if (audioBuffer.length === 0) {
      res.status(400).json({ error: 'validation_error', message: 'Audio data is required' });
      return;
    }

    const text = await transcribeAudio(audioBuffer);
    res.json({ text });
  } catch (err: any) {
    console.error('Transcription error:', err);
    res.status(502).json({
      error: 'stt_error',
      message: err.message || 'Speech-to-text transcription failed',
    });
  }
});

export default router;
