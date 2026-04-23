import { Router } from 'express';
import { getTrackByShareId, type TrackRow } from '../db/queries.js';

function shareTrackToJson(track: TrackRow) {
  return {
    id: track.id,
    title: track.title,
    lens: track.lens,
    transcript: JSON.parse(track.transcript || '[]'),
    audioUrl: track.audio_url,
    duration: track.duration,
    soundscapeUrl: track.soundscape_url,
    introMusicUrl: track.intro_music_url,
    outroMusicUrl: track.outro_music_url,
  };
}

const router = Router();

// GET /api/share/:shareId — public, no auth required
router.get('/:shareId', (req, res) => {
  try {
    const { shareId } = req.params;
    const track = getTrackByShareId(shareId);

    if (!track) {
      res.status(404).json({ error: 'Shared track not found' });
      return;
    }

    res.json(shareTrackToJson(track));
  } catch (err: any) {
    console.error('Error fetching shared track:', err);
    res.status(500).json({ error: 'Failed to fetch shared track' });
  }
});

export default router;
