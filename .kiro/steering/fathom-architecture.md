---
inclusion: auto
---

# Fathom Architecture — Coding Standards

## Project Structure
- `client/` — React + Vite + TypeScript frontend
- `server/` — Node.js + Express + TypeScript backend
- `public/audio/` — Generated audio files (served statically)
- `.env` — API keys (ELEVENLABS_API_KEY, DASHSCOPE_API_KEY)

## Frontend Patterns

### File Organization
- Screens: `client/src/screens/` — one file per route (HomeScreen, PlayerScreen, LibraryScreen, SettingsScreen, SharePage, AuthScreen)
- Components: `client/src/components/{feature}/` — grouped by feature (home/, player/, library/, layout/)
- Hooks: `client/src/hooks/` — custom hooks (useAudioPlayer, useAudioLayers, useVoiceInput, useKeyboardShortcuts)
- Store: `client/src/store/index.ts` — single Zustand store
- Types: `client/src/types/index.ts` — all shared TypeScript interfaces
- API: `client/src/lib/api.ts` — fetch wrapper with X-User-Id header
- Utils: `client/src/lib/utils.ts` — cn() helper

### State Management (Zustand)
- Single store at `@/store`
- Persisted slices: user, defaults, playbackSpeed (via `persist` middleware, key: `fathom-storage`)
- Runtime slices: currentTrack, isPlaying, isGenerating, content, selectedLens, tracks
- Access via `useStore()` hook with selectors: `useStore(s => s.currentTrack)`

### API Client
- All API calls go through `@/lib/api.ts`
- Automatically attaches `X-User-Id` header from store
- On 401 response: clear user from store, redirect to AuthScreen
- On error: show toast via Sonner

### Routing
- React Router v7 with `<BrowserRouter>`
- Auth guard: if no user in store, redirect to `/auth`
- Routes: `/` (Home), `/player/:id` (Player), `/library`, `/settings`, `/share/:shareId` (public, no auth)

## Backend Patterns

### File Organization
- Routes: `server/routes/` — one file per resource (auth.ts, generate.ts, tracks.ts, interrupt.ts, share.ts, scrape.ts, lens-previews.ts)
- Services: `server/services/` — external API wrappers (dashscope.ts, elevenlabs.ts, audio-assembler.ts, jina.ts)
- Database: `server/db/` — database.ts (connection), schema.sql (DDL), queries.ts (parameterized functions)
- Config: `server/config/` — lenses.ts (8 lens configs), voices.ts (5 preset voices)
- Middleware: `server/middleware/user.ts` — userId extraction from X-User-Id header

### Express Route Pattern
```typescript
import { Router } from 'express';
import { userMiddleware } from '../middleware/user.js';

const router = Router();
router.use(userMiddleware); // for protected routes

router.post('/', async (req, res) => {
  try {
    // validate input
    // call service
    // return response
    res.json(result);
  } catch (error) {
    console.error('Route error:', error);
    res.status(500).json({ error: 'internal_error', message: 'Something went wrong' });
  }
});

export default router;
```

### Database Pattern
- Use `better-sqlite3` synchronous API
- All queries in `server/db/queries.ts` as named functions
- Use parameterized queries (never string interpolation)
- IDs generated with `nanoid()` before insert
- JSON fields stored as TEXT, parsed with `JSON.parse()` on read

### Error Response Shape
```typescript
{ error: string, message: string }
```
- 400: validation_error
- 401: unauthorized
- 404: not_found
- 500: internal_error
- 502: llm_error, tts_error, stt_error, scrape_error

### DashScope Integration
- Base URL: `https://dashscope-intl.aliyuncs.com/compatible-mode/v1`
- Model: `qwen-plus`
- Use `role: "system"` (NOT "developer")
- Request `response_format: { type: "json_object" }`
- Always include "Output ONLY valid JSON" in system prompt
- Wrap `JSON.parse()` in try/catch

### ElevenLabs Integration
- Use `@elevenlabs/elevenlabs-js` SDK (NOT raw fetch)
- TTS main: model `eleven_v3`, output `mp3_44100_128`
- TTS interrupt: model `eleven_flash_v2_5` (faster)
- Always pass `previousText`/`nextText` for context stitching
- Sound Effects: `client.textToSoundEffects.convert()`
- Music: `client.music.compose()`
- STT: `client.speechToText.convert()`
- Graceful degradation: SFX/Music errors → proceed without, TTS errors → abort

### Audio Assembly
- Backend: `Buffer.concat()` TTS segments into single voice track. Save as separate files.
- Frontend: Web Audio API layers voice + soundscape + music during playback
- NO ffmpeg. NO server-side mixing.
