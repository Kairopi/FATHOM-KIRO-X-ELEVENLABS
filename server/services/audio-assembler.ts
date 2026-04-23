import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const AUDIO_DIR = path.join(__dirname, '..', '..', 'public', 'audio');

/**
 * Concatenate TTS segment buffers into a single voice track MP3.
 * Saves to disk and returns the relative URL path + estimated duration.
 */
export async function assembleVoiceTrack(params: {
  trackId: string;
  segmentBuffers: Buffer[];
}): Promise<{ outputPath: string; audioUrl: string; durationSec: number }> {
  const voiceTrack = Buffer.concat(params.segmentBuffers);
  const outputDir = path.join(AUDIO_DIR, 'tracks');
  fs.mkdirSync(outputDir, { recursive: true });

  const filename = `${params.trackId}.mp3`;
  const outputPath = path.join(outputDir, filename);
  fs.writeFileSync(outputPath, voiceTrack);

  // Estimate duration from MP3 file size (128kbps = 16000 bytes/sec)
  const durationSec = Math.round(voiceTrack.length / 16000);

  return {
    outputPath,
    audioUrl: `/audio/tracks/${filename}`,
    durationSec,
  };
}

/**
 * Save a soundscape buffer to disk.
 */
export function saveSoundscape(trackId: string, buffer: Buffer): string {
  const outputDir = path.join(AUDIO_DIR, 'soundscapes');
  fs.mkdirSync(outputDir, { recursive: true });
  const filename = `${trackId}_soundscape.mp3`;
  fs.writeFileSync(path.join(outputDir, filename), buffer);
  return `/audio/soundscapes/${filename}`;
}


/**
 * Save intro or outro music buffer to disk.
 */
export function saveMusic(trackId: string, type: 'intro' | 'outro', buffer: Buffer): string {
  const outputDir = path.join(AUDIO_DIR, 'music');
  fs.mkdirSync(outputDir, { recursive: true });
  const filename = `${trackId}_${type}.mp3`;
  fs.writeFileSync(path.join(outputDir, filename), buffer);
  return `/audio/music/${filename}`;
}

/**
 * Save an interrupt re-explanation audio buffer to disk.
 */
export function saveInterruptAudio(interruptId: string, buffer: Buffer): string {
  const outputDir = path.join(AUDIO_DIR, 'interrupts');
  fs.mkdirSync(outputDir, { recursive: true });
  const filename = `${interruptId}.mp3`;
  fs.writeFileSync(path.join(outputDir, filename), buffer);
  return `/audio/interrupts/${filename}`;
}
