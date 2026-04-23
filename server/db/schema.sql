-- Users table (guest mode — no passwords)
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  display_name TEXT NOT NULL,
  created_at TEXT DEFAULT (datetime('now'))
);

-- Tracks table
CREATE TABLE IF NOT EXISTS tracks (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  source_text TEXT,
  lens TEXT NOT NULL,
  voice_config TEXT,
  transcript TEXT,
  audio_url TEXT,
  duration INTEGER,
  share_id TEXT UNIQUE,
  is_favorite INTEGER DEFAULT 0,
  soundscape_url TEXT,
  intro_music_url TEXT,
  outro_music_url TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

-- Interrupts table
CREATE TABLE IF NOT EXISTS interrupts (
  id TEXT PRIMARY KEY,
  track_id TEXT NOT NULL REFERENCES tracks(id) ON DELETE CASCADE,
  timestamp_sec INTEGER NOT NULL,
  explanation TEXT,
  audio_url TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_tracks_user_id ON tracks(user_id);
CREATE INDEX IF NOT EXISTS idx_tracks_share_id ON tracks(share_id);
CREATE INDEX IF NOT EXISTS idx_interrupts_track_id ON interrupts(track_id);
