import { Router } from 'express';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { userMiddleware } from '../middleware/user.js';
import {
  getTracksByUserId,
  getTrackById,
  toggleFavorite,
  deleteTrack,
  getInterruptsByTrackId,
  type TrackRow,
} from '../db/queries.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function trackToJson(track: TrackRow) {
  return {
    id: track.id,
    title: track.title,
    sourceText: track.source_text,
    lens: track.lens,
    voiceConfig: JSON.parse(track.voice_config || '{}'),
    transcript: JSON.parse(track.transcript || '[]'),
    audioUrl: track.audio_url,
    duration: track.duration,
    shareId: track.share_id,
    isFavorite: Boolean(track.is_favorite),
    soundscapeUrl: track.soundscape_url,
    introMusicUrl: track.intro_music_url,
    outroMusicUrl: track.outro_music_url,
    createdAt: track.created_at,
  };
}

async function unlinkSafe(filePath: string) {
  try {
    await fs.unlink(filePath);
  } catch (err: any) {
    if (err.code !== 'ENOENT') throw err;
  }
}

const router = Router();

// GET /api/tracks — ALL tracks from ALL users (shared library), newest first
router.get('/', userMiddleware, (req, res) => {
  try {
    // Get ALL tracks from the database, not just user's tracks
    // This creates a shared library where judges can see everything that's been generated
    const db = require('../db/database.js').getDatabase();
    const stmt = db.prepare(`
      SELECT * FROM tracks 
      ORDER BY created_at DESC
    `);
    const allTracks = stmt.all() as TrackRow[];
    
    // Mark which tracks belong to the current user
    const tracksWithOwnership = allTracks.map(track => ({
      ...trackToJson(track),
      isOwner: track.user_id === req.user!.id,
    }));
    
    res.json(tracksWithOwnership);
  } catch (err: any) {
    console.error('Error fetching tracks:', err);
    res.status(500).json({ error: 'Failed to fetch tracks' });
  }
});

// GET /api/tracks/:id — single track
router.get('/:id', userMiddleware, (req, res) => {
  try {
    const id = req.params.id as string;
    const track = getTrackById(id);
    if (!track) {
      res.status(404).json({ error: 'Track not found' });
      return;
    }
    if (track.user_id !== req.user!.id) {
      res.status(403).json({ error: 'Track does not belong to this user' });
      return;
    }
    res.json(trackToJson(track));
  } catch (err: any) {
    console.error('Error fetching track:', err);
    res.status(500).json({ error: 'Failed to fetch track' });
  }
});

// PATCH /api/tracks/:id/favorite — toggle favorite
router.patch('/:id/favorite', userMiddleware, (req, res) => {
  try {
    const id = req.params.id as string;
    const existing = getTrackById(id);
    if (!existing) {
      res.status(404).json({ error: 'Track not found' });
      return;
    }
    if (existing.user_id !== req.user!.id) {
      res.status(403).json({ error: 'Track does not belong to this user' });
      return;
    }
    const track = toggleFavorite(id);
    if (!track) {
      res.status(404).json({ error: 'Track not found' });
      return;
    }
    res.json(trackToJson(track));
  } catch (err: any) {
    console.error('Error toggling favorite:', err);
    res.status(500).json({ error: 'Failed to toggle favorite' });
  }
});

// DELETE /api/tracks/:id — cascade delete audio files from disk (only owner can delete)
router.delete('/:id', userMiddleware, async (req, res) => {
  try {
    const id = req.params.id as string;
    const track = getTrackById(id);
    if (!track) {
      res.status(404).json({ error: 'Track not found' });
      return;
    }
    // Only the owner can delete their tracks
    if (track.user_id !== req.user!.id) {
      res.status(403).json({ error: 'You can only delete your own tracks' });
      return;
    }

    const publicDir = path.join(__dirname, '..', '..', 'public', 'audio');
    const trackId = track.id;

    // Delete interrupt audio files
    const interrupts = getInterruptsByTrackId(trackId);
    for (const interrupt of interrupts) {
      await unlinkSafe(path.join(publicDir, 'interrupts', `${interrupt.id}.mp3`));
    }

    // Delete track audio, soundscape, intro/outro music
    await Promise.all([
      unlinkSafe(path.join(publicDir, 'tracks', `${trackId}.mp3`)),
      unlinkSafe(path.join(publicDir, 'soundscapes', `${trackId}_soundscape.mp3`)),
      unlinkSafe(path.join(publicDir, 'music', `${trackId}_intro.mp3`)),
      unlinkSafe(path.join(publicDir, 'music', `${trackId}_outro.mp3`)),
    ]);

    // Delete from DB (cascade handles interrupts table)
    deleteTrack(trackId);

    res.json({ success: true });
  } catch (err: any) {
    console.error('Error deleting track:', err);
    res.status(500).json({ error: 'Failed to delete track' });
  }
});

export default router;
