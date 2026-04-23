import path from 'path';
import { fileURLToPath } from 'url';
import { existsSync, readFileSync, statSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// .env hot-reload: re-reads the file if it changed since last read
const envPaths = [
  path.join(__dirname, '..', '.env'),
  path.join(process.cwd(), '.env'),
];

let _envFilePath: string | null = null;
let _envLastModified = 0;

function loadEnvFile() {
  const envPath = _envFilePath || envPaths.find((p) => existsSync(p));
  if (!envPath) return;
  _envFilePath = envPath;

  try {
    const stat = statSync(envPath);
    const mtime = stat.mtimeMs;
    // Skip if file hasn't changed
    if (mtime === _envLastModified) return;
    _envLastModified = mtime;

    const content = readFileSync(envPath, 'utf-8');
    for (const line of content.split('\n')) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const eqIdx = trimmed.indexOf('=');
      if (eqIdx === -1) continue;
      const key = trimmed.substring(0, eqIdx).trim();
      const value = trimmed.substring(eqIdx + 1).trim();
      if (key && value) {
        process.env[key] = value;
      }
    }
    console.log(`[env] Loaded .env from: ${envPath}`);
    console.log(`  ELEVENLABS_API_KEY: ${process.env.ELEVENLABS_API_KEY ? process.env.ELEVENLABS_API_KEY.substring(0, 8) + '...' : 'MISSING'}`);
    console.log(`  DASHSCOPE_API_KEY: ${process.env.DASHSCOPE_API_KEY ? 'SET' : 'MISSING'}`);
  } catch (err: any) {
    console.error(`[env] Failed to load .env: ${err.message}`);
  }
}

// Initial load
loadEnvFile();

import express from 'express';
import cors from 'cors';
import { initDatabase } from './db/database.js';
import authRoutes from './routes/auth.js';
import generateRoutes from './routes/generate.js';
import scrapeRoutes from './routes/scrape.js';
import transcribeRoutes from './routes/transcribe.js';
import interruptRoutes from './routes/interrupt.js';
import trackRoutes from './routes/tracks.js';
import shareRoutes from './routes/share.js';
import lensPreviewRoutes from './routes/lens-previews.js';
import voicePreviewRoutes from './routes/voice-preview.js';

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Hot-reload .env on every API request (checks file mtime, only re-reads if changed)
app.use('/api', (_req, _res, next) => { loadEnvFile(); next(); });

// Static file serving for generated audio
app.use('/audio', express.static(path.join(__dirname, '..', 'public', 'audio')));

// Route mounting
app.use('/api/auth', authRoutes);
app.use('/api/generate', generateRoutes);
app.use('/api/scrape-url', scrapeRoutes);
app.use('/api/transcribe', transcribeRoutes);
app.use('/api/interrupt', interruptRoutes);
app.use('/api/tracks', trackRoutes);
app.use('/api/share', shareRoutes);
app.use('/api/lens-previews', lensPreviewRoutes);
app.use('/api/voice-preview', voicePreviewRoutes);

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    hasDashScope: !!process.env.DASHSCOPE_API_KEY,
    hasElevenLabs: !!process.env.ELEVENLABS_API_KEY,
    dashScopeKeyPrefix: process.env.DASHSCOPE_API_KEY?.substring(0, 6) || 'MISSING',
  });
});

// Serve built frontend in production
// In Docker: Working dir is /app, server runs from /app/server/dist/index.js
// So __dirname = /app/server/dist, and client/dist is at /app/client/dist
const clientDistPath = path.resolve(process.cwd(), 'client', 'dist');
console.log(`[server] process.cwd(): ${process.cwd()}`);
console.log(`[server] __dirname: ${__dirname}`);
console.log(`[server] Looking for client dist at: ${clientDistPath}`);
console.log(`[server] Client dist exists: ${existsSync(clientDistPath)}`);
if (existsSync(clientDistPath)) {
  app.use(express.static(clientDistPath));
  // SPA fallback — serve index.html for all non-API routes
  app.get('*', (_req, res) => {
    res.sendFile(path.join(clientDistPath, 'index.html'));
  });
  console.log(`[server] Serving frontend from ${clientDistPath}`);
} else {
  console.warn(`[server] Client dist not found at ${clientDistPath}`);
}

// Initialize database then start server
async function start() {
  await initDatabase();
  app.listen(PORT, () => {
    console.log(`Fathom server running on http://localhost:${PORT}`);
  });
}

start().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});

export default app;
