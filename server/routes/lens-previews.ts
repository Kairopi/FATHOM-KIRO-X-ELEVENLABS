import { Router } from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { ALL_LENSES, LENS_CONFIGS, type LearningLens } from '../config/lenses.js';
import { generateSoundscape } from '../services/elevenlabs.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PREVIEWS_DIR = path.join(__dirname, '..', '..', 'public', 'audio', 'previews');

function previewFileName(lens: LearningLens): string {
  return `lens_${lens}.mp3`;
}

function previewFilePath(lens: LearningLens): string {
  return path.join(PREVIEWS_DIR, previewFileName(lens));
}

function previewUrl(lens: LearningLens): string {
  return `/audio/previews/${previewFileName(lens)}`;
}

const router = Router();

// GET /api/lens-previews — public, no auth required
router.get('/', async (_req, res) => {
  try {
    // Ensure previews directory exists
    if (!fs.existsSync(PREVIEWS_DIR)) {
      fs.mkdirSync(PREVIEWS_DIR, { recursive: true });
    }

    // Check which previews already exist
    const missing: LearningLens[] = [];
    for (const lens of ALL_LENSES) {
      if (!fs.existsSync(previewFilePath(lens))) {
        missing.push(lens);
      }
    }

    // Generate missing previews
    for (const lens of missing) {
      try {
        const config = LENS_CONFIGS[lens];
        const buffer = await generateSoundscape({
          prompt: config.soundscapePrompt,
          durationSeconds: 2,
        });
        fs.writeFileSync(previewFilePath(lens), buffer);
      } catch (err) {
        console.error(`Failed to generate preview for lens "${lens}":`, err);
      }
    }

    // Build the response map with only existing files
    const result: Record<string, string> = {};
    for (const lens of ALL_LENSES) {
      if (fs.existsSync(previewFilePath(lens))) {
        result[lens] = previewUrl(lens);
      }
    }

    res.json(result);
  } catch (err) {
    console.error('Error in lens-previews route:', err);
    res.status(500).json({ error: 'Failed to fetch lens previews' });
  }
});

export default router;
