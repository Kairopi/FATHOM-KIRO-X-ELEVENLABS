import { getDb, saveDatabase } from './database.js';

// Helper: run a SELECT that returns one row as an object
function getOne(sql: string, params: any[]): Record<string, any> | undefined {
  const db = getDb();
  const stmt = db.prepare(sql);
  stmt.bind(params);
  if (stmt.step()) {
    const columns = stmt.getColumnNames();
    const values = stmt.get();
    stmt.free();
    const row: Record<string, any> = {};
    columns.forEach((col, i) => { row[col] = values[i]; });
    return row;
  }
  stmt.free();
  return undefined;
}

// Helper: run a SELECT that returns multiple rows as objects
function getAll(sql: string, params: any[]): Record<string, any>[] {
  const db = getDb();
  const stmt = db.prepare(sql);
  stmt.bind(params);
  const columns = stmt.getColumnNames();
  const rows: Record<string, any>[] = [];
  while (stmt.step()) {
    const values = stmt.get();
    const row: Record<string, any> = {};
    columns.forEach((col, i) => { row[col] = values[i]; });
    rows.push(row);
  }
  stmt.free();
  return rows;
}

// Helper: run an INSERT/UPDATE/DELETE and persist
function runMutation(sql: string, params: any[]): void {
  const db = getDb();
  db.run(sql, params);
  saveDatabase();
}

// --- Users ---

export function createUser(id: string, displayName: string) {
  runMutation('INSERT INTO users (id, display_name) VALUES (?, ?)', [id, displayName]);
  return getUserById(id);
}

export function getUserById(id: string) {
  return getOne('SELECT * FROM users WHERE id = ?', [id]) as
    | { id: string; display_name: string; created_at: string }
    | undefined;
}

// --- Tracks ---

export function createTrack(params: {
  id: string;
  userId: string;
  title: string;
  sourceText: string | null;
  lens: string;
  voiceConfig: string | null;
  transcript: string | null;
  audioUrl: string | null;
  duration: number | null;
  shareId: string | null;
  soundscapeUrl: string | null;
  introMusicUrl: string | null;
  outroMusicUrl: string | null;
}) {
  runMutation(
    `INSERT INTO tracks (id, user_id, title, source_text, lens, voice_config, transcript, audio_url, duration, share_id, soundscape_url, intro_music_url, outro_music_url)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      params.id,
      params.userId,
      params.title,
      params.sourceText,
      params.lens,
      params.voiceConfig,
      params.transcript,
      params.audioUrl,
      params.duration,
      params.shareId,
      params.soundscapeUrl,
      params.introMusicUrl,
      params.outroMusicUrl,
    ]
  );
  return getTrackById(params.id);
}

export function getTrackById(id: string) {
  return getOne('SELECT * FROM tracks WHERE id = ?', [id]) as TrackRow | undefined;
}

export function getTracksByUserId(userId: string) {
  return getAll(
    'SELECT * FROM tracks WHERE user_id = ? ORDER BY created_at DESC',
    [userId]
  ) as TrackRow[];
}

export function toggleFavorite(id: string) {
  runMutation(
    'UPDATE tracks SET is_favorite = CASE WHEN is_favorite = 0 THEN 1 ELSE 0 END WHERE id = ?',
    [id]
  );
  return getTrackById(id);
}

export function deleteTrack(id: string) {
  runMutation('DELETE FROM tracks WHERE id = ?', [id]);
}

export function getTrackByShareId(shareId: string) {
  return getOne('SELECT * FROM tracks WHERE share_id = ?', [shareId]) as TrackRow | undefined;
}

// --- Interrupts ---

export function createInterrupt(params: {
  id: string;
  trackId: string;
  timestampSec: number;
  explanation: string | null;
  audioUrl: string | null;
}) {
  runMutation(
    `INSERT INTO interrupts (id, track_id, timestamp_sec, explanation, audio_url)
     VALUES (?, ?, ?, ?, ?)`,
    [params.id, params.trackId, params.timestampSec, params.explanation, params.audioUrl]
  );
  return getInterruptById(params.id);
}

function getInterruptById(id: string) {
  return getOne('SELECT * FROM interrupts WHERE id = ?', [id]) as InterruptRow | undefined;
}

export function getInterruptsByTrackId(trackId: string) {
  return getAll(
    'SELECT * FROM interrupts WHERE track_id = ? ORDER BY timestamp_sec ASC',
    [trackId]
  ) as InterruptRow[];
}

// --- Row types ---

export interface TrackRow {
  id: string;
  user_id: string;
  title: string;
  source_text: string | null;
  lens: string;
  voice_config: string | null;
  transcript: string | null;
  audio_url: string | null;
  duration: number | null;
  share_id: string | null;
  is_favorite: number;
  soundscape_url: string | null;
  intro_music_url: string | null;
  outro_music_url: string | null;
  created_at: string;
}

export interface InterruptRow {
  id: string;
  track_id: string;
  timestamp_sec: number;
  explanation: string | null;
  audio_url: string | null;
  created_at: string;
}
