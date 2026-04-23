# Implementation Plan: Fathom Audio Learning Engine

## Overview

Build a hyper-personalized audio learning engine that transforms text into two-voice AI podcasts. Tasks are ordered for maximum hackathon demo impact: project scaffolding → backend foundation → guest auth → layout shell → home screen with voice input hero → generation pipeline → player with waveform + audio layers → library → mini player → settings → share page → polish. Design system: premium restrained aesthetic (Linear/Vercel-tier) with warm zinc darks, indigo accent, Geist Sans typography, spring-physics animations, border-based elevation, zero decorative gradients. Tech stack: React + Vite + TypeScript + Tailwind + shadcn/ui + Framer Motion + Wavesurfer.js (frontend), Node.js + Express + SQLite (backend), DashScope qwen-plus (LLM), ElevenLabs (TTS/SFX/Music/STT).

## Tasks

- [x] 1. Project setup and monorepo scaffolding
  - [x] 1.1 Initialize monorepo with root package.json, tsconfig.json, and .env file
    - Create root `package.json` with workspace scripts (`dev`, `build`, `dev:client`, `dev:server`)
    - Create root `tsconfig.json` with shared compiler options
    - Create `.env` with placeholders for `DASHSCOPE_API_KEY`, `ELEVENLABS_API_KEY`, `JINA_API_KEY`
    - _Requirements: 6.1, 5.1_

  - [x] 1.2 Scaffold Vite + React + TypeScript frontend in `client/`
    - Initialize Vite project with React + TypeScript template
    - Install dependencies: `react`, `react-dom`, `react-router-dom`, `zustand`, `tailwindcss`, `@tailwindcss/vite`, `framer-motion`, `wavesurfer.js`, `sonner`, `nanoid`, `lucide-react`
    - Configure `vite.config.ts` with API proxy to backend (`/api` → `http://localhost:3001`)
    - Set up `tailwind.config.ts` with dark mode and custom CSS variables from Requirement 13.1
    - Import Geist Sans and Geist Mono fonts (via `geist` npm package or CDN). Configure `--font-sans` and `--font-mono` CSS variables.
    - Create `src/index.css` with Tailwind directives and the full premium CSS variable palette:
      - Backgrounds: --bg-primary (#09090B), --bg-secondary (#18181B), --bg-tertiary (#27272A), --bg-elevated (#09090B)
      - Borders: --border-primary (rgba(255,255,255,0.08)), --border-secondary (rgba(255,255,255,0.04)), --border-focus (rgba(99,102,241,0.5))
      - Text: --text-primary (#FAFAFA), --text-secondary (#A1A1AA), --text-tertiary (#71717A), --text-muted (#52525B)
      - Accent: --accent (#6366F1), --accent-hover (#818CF8), --accent-muted (rgba(99,102,241,0.15))
      - Semantic: --success (#22C55E), --warning (#EAB308), --error (#EF4444)
      - Lens accents: --lens-gamer (#8B5CF6), --lens-coach (#10B981), --lens-eli5 (#F59E0B), --lens-storyteller (#F97316), --lens-scientist (#3B82F6), --lens-popculture (#EC4899), --lens-chef (#F97316), --lens-streetsmart (#6B7280)
    - Add typography system: heading letter-spacing (-0.025em h1, -0.02em h2, -0.015em h3), body letter-spacing (-0.011em), label styles (uppercase, 0.01em, font-weight 500)
    - Add `prefers-reduced-motion` media query to disable all animations
    - Install and configure shadcn/ui (`components.json`, `cn` utility)
    - _Requirements: 13.1, 13.2_

  - [x] 1.3 Scaffold Express + TypeScript backend in `server/`
    - Initialize `server/package.json` and `server/tsconfig.json`
    - Install dependencies: `express`, `better-sqlite3`, `nanoid`, `@elevenlabs/elevenlabs-js`, `openai` (for DashScope compatible client), `cors`, `dotenv`
    - Install dev dependencies: `tsx`, `@types/express`, `@types/better-sqlite3`
    - Create `server/index.ts` with Express app setup, CORS, JSON body parser, static file serving for `/audio/`, and route mounting
    - Create `public/audio/` directory structure (tracks, interrupts, soundscapes, music, previews, temp)
    - _Requirements: 21.1_

  - [x] 1.4 Create shared TypeScript types in `client/src/types/index.ts`
    - Define `LearningLens`, `VoicePair`, `ScriptSegment`, `Track`, `TranscriptSegment`, `Interrupt`, `PresetVoice`, `LensConfig` types matching the design interfaces (LensConfig uses `accentColor: string` instead of gradient)
    - _Requirements: 5.5, 6.4_

- [x] 2. Database and backend foundation
  - [x] 2.1 Set up SQLite database with better-sqlite3
    - Create `server/db/database.ts` — initialize better-sqlite3 connection to `fathom.db`, enable WAL mode, enable foreign keys
    - Create `server/db/schema.sql` — users, tracks, interrupts tables with indexes (idx_tracks_user_id, idx_tracks_share_id, idx_interrupts_track_id)
    - Run schema on startup via `db.exec(schema)`
    - _Requirements: 20.1, 20.2, 20.3, 20.4_

  - [x] 2.2 Implement database query functions
    - Create `server/db/queries.ts` with parameterized functions: `createUser`, `getUserById`, `createTrack`, `getTrackById`, `getTracksByUserId` (ORDER BY created_at DESC), `toggleFavorite`, `deleteTrack`, `getTrackByShareId`, `createInterrupt`, `getInterruptsByTrackId`
    - _Requirements: 11.8, 20.1, 20.2, 20.3_

  - [ ] 2.3 Write property tests for database layer
    - **Property 17: Cascade delete from users to tracks to interrupts**
    - **Validates: Requirements 20.4**

  - [x] 2.4 Create user middleware and utility modules
    - Create `server/middleware/user.ts` — extract userId from `X-User-Id` header, look up user in DB, attach to `req.user`, return 401 if missing/invalid
    - Create `server/utils/share-id.ts` — nanoid-based share ID generator
    - _Requirements: 1.3, 12.1_

  - [ ]* 2.5 Write property tests for auth middleware
    - **Property 2: Missing userId returns unauthorized**
    - **Validates: Requirements 1.3**

- [x] 3. Guest authentication
  - [x] 3.1 Implement guest auth route and frontend screen
    - Create `server/routes/auth.ts` — POST /api/auth/guest accepts `{ displayName }`, creates user with nanoid id, returns `{ user: { id, displayName } }`
    - Create `client/src/screens/AuthScreen.tsx` — full-screen centered form with display name input and "Start Learning" button, dark mode styled
    - Wire auth flow: on submit → POST /api/auth/guest → store user in Zustand + localStorage → redirect to Home
    - _Requirements: 1.1, 1.2, 1.4_

  - [x] 3.2 Write property test for guest signup
    - **Property 1: Guest signup creates valid user record**
    - **Validates: Requirements 1.2, 1.4**

- [x] 4. Checkpoint — Verify foundation
  - Ensure all tests pass, ask the user if questions arise.

- [x] 5. Global layout, routing, and design system
  - [x] 5.1 Create Zustand store with persisted slices
    - Create `client/src/store/index.ts` — single store with auth, generation, player, library, and settings slices
    - Persist user, defaults, and playbackSpeed to localStorage under key `fathom-storage`
    - _Requirements: 14.2, 14.3, 14.4_

  - [x] 5.2 Create API client wrapper
    - Create `client/src/lib/api.ts` — fetch wrapper that attaches `X-User-Id` header from Zustand store, handles 401 → redirect to auth, wraps errors with toast
    - _Requirements: 1.3, 16.2_

  - [x] 5.3 Build AppLayout with Sidebar, BottomTabBar, and routing
    - Create `client/src/components/layout/AppLayout.tsx` — flex layout with sidebar + main content (max-width 800px centered)
    - Create `client/src/components/layout/Sidebar.tsx` — 56px fixed left panel, icon-only nav (New, Home, Library, Settings), 3px --accent left border on active item, hidden below 768px
    - Create `client/src/components/layout/BottomTabBar.tsx` — 56px fixed bottom nav with 3 tabs, visible only below 768px
    - Create `client/src/App.tsx` — React Router setup with auth guard, routes for Home, Player, Library, Settings, Share
    - _Requirements: 13.3, 13.4, 13.5, 13.6, 13.7, 13.8_

- [x] 6. Lens and voice configuration data
  - [x] 6.1 Create lens configuration and voice presets
    - Create `server/config/lenses.ts` — all 8 LensConfig objects with id, name, description, icon, accentColor (hex string for subtle tint backgrounds), soundscapePrompt, musicPrompt, systemPromptModifier
    - Create `server/config/voices.ts` — 5 PresetVoice objects (Marcus, Aria, Kai, Luna, Rex) with ElevenLabs voice IDs
    - Mirror lens metadata on frontend in `client/src/lib/lenses.ts` for UI rendering (name, icon, accentColor, description)
    - _Requirements: 3.1, 4.2, 22.2, 23.2_

  - [x] 6.2 Write property test for lens configuration consistency
    - **Property 7: Lens configuration mapping consistency**
    - **Validates: Requirements 5.4, 22.2, 23.2**

- [x] 7. Home screen — content input, voice input hero, lens pills, voice picker
  - [x] 7.1 Build ContentInput and VoiceInputButton components
    - Create `client/src/components/home/ContentInput.tsx` — auto-resizing textarea with placeholder text, dark styled
    - Implement drag-and-drop zone: on dragover show dashed 2px --accent border + overlay "📄 Drop a .txt file here", accept .txt only, invalid files show shake animation + toast "Only .txt files are supported"
    - Create `client/src/components/home/VoiceInputButton.tsx` — large "🎤 Speak your topic" hero button with pulsing animation during recording, prominent placement above textarea
    - Create `client/src/hooks/useVoiceInput.ts` — MediaRecorder capture → send audio blob to POST /api/transcribe (which calls ElevenLabs Scribe) → populate textarea with transcribed text
    - _Requirements: 2.1, 2.2, 2.5, 24.1, 24.2, 24.3, 24.4, 24.5, 24.6_

  - [x] 7.2 Build LensPills and LensPickerDialog
    - Create `client/src/components/home/LensPills.tsx` — horizontal scrollable row of 8 lens pills (9999px border-radius), selected state styling with lens accent tint
    - Create `client/src/components/home/LensPickerDialog.tsx` — dialog with 8 lens cards using subtle accent tint design: background at 8% lens accent opacity, 2px left border in lens accent color, name in --text-primary, description in --text-secondary, 24px emoji icon. Hover: opacity increases to 12% + scale(1.01) spring. Selected: 1px ring in lens accent at 50% opacity. NO gradients. Plays 2-second audio preview on hover/select.
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 25.2, 25.3_

  - [x] 7.3 Build VoicePickerDialog and GenerateButton
    - Create `client/src/components/home/VoicePickerDialog.tsx` — dialog showing 5 voices × 2 roles (Explainer/Learner) with preview playback
    - Create `client/src/components/home/GenerateButton.tsx` — enabled only when content is non-empty AND lens is selected; triggers generation on click; supports Cmd/Ctrl+Enter shortcut
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.6, 2.6, 15.3_

  - [x] 7.4 Build HomeScreen with FirstRunContent
    - Create `client/src/screens/HomeScreen.tsx` — compose ContentInput, VoiceInputButton (hero placement), LensPills, VoicePickerTrigger, GenerateButton
    - Create `client/src/components/home/FirstRunContent.tsx` — example content + "Try saying: Explain quantum computing like I'm a gamer" shown when user has no tracks
    - _Requirements: 18.1, 18.2, 18.3_

  - [x] 7.5 Write property test for generate button enablement
    - **Property 3: Generate button requires content and lens**
    - **Validates: Requirements 2.6, 3.5**

- [x] 8. Checkpoint — Verify home screen and auth flow
  - Ensure all tests pass, ask the user if questions arise.

- [-] 9. Backend generation pipeline — DashScope + ElevenLabs TTS + SFX + Music
  - [x] 9.1 Implement DashScope client for script generation
    - Create `server/services/dashscope.ts` — OpenAI-compatible client pointing to `https://dashscope-intl.aliyuncs.com/compatible-mode/v1`, model `qwen-plus`, role `system` (not `developer`), `response_format: { type: "json_object" }`
    - Implement `generateScript(content, lens)` — constructs system prompt with lens-specific modifier, returns `ScriptSegment[]`
    - Implement `generateReExplanation(transcript, timestampSec, lens)` — generates simplified re-explanation text
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6_

  - [ ] 9.2 Write property test for script segment validity
    - **Property 4: Script segment structural validity**
    - **Validates: Requirements 5.5**

  - [x] 9.3 Implement ElevenLabs service (TTS, SFX, Music, STT)
    - Create `server/services/elevenlabs.ts` using `@elevenlabs/elevenlabs-js` SDK
    - Implement `synthesizeSegment(text, voiceId, previousText?, nextText?)` — eleven_v3, mp3_44100_128, with context stitching params
    - Implement `synthesizeInterrupt(text, voiceId)` — eleven_flash_v2_5 for fast re-explanation
    - Implement `generateSoundscape(prompt, durationSeconds)` — Sound Effects API
    - Implement `generateMusic(prompt, durationMs)` — Music API via `client.music.compose`
    - Implement `transcribeAudio(audioBuffer)` — Scribe STT via `client.speechToText.convert`
    - _Requirements: 6.1, 6.2, 10.4, 22.1, 23.1, 24.1_

  - [ ]* 9.4 Write property test for TTS context stitching
    - **Property 5: TTS context stitching correctness**
    - **Validates: Requirements 6.2**

  - [x] 9.5 Implement audio assembler and Jina scraper
    - Create `server/services/audio-assembler.ts` — `Buffer.concat` TTS segment buffers into single voice track MP3, save to disk, return path + duration
    - Create `server/services/jina.ts` — Jina Reader API client for URL text extraction
    - _Requirements: 6.3, 2.3, 2.4_

  - [x] 9.6 Implement POST /api/generate route (full pipeline)
    - Create `server/routes/generate.ts` — orchestrates: validate input → DashScope script → parallel ElevenLabs SFX + Music → sequential TTS segments with context stitching → assemble voice track → save files → create Track DB record → return Track
    - Implement graceful degradation: SFX/Music errors → proceed without, TTS/DashScope errors → abort with error
    - Create `server/routes/scrape.ts` — POST /api/scrape-url proxies to Jina Reader
    - Note: The backend saves soundscape/music as separate files. The frontend handles layering via Web Audio API — the backend does NOT mix audio tracks together. This aligns with the design's audio assembly pipeline.
    - _Requirements: 6.3, 6.4, 6.5, 21.1, 21.2, 22.6, 23.7_

  - [x] 9.7 Write property test for track record completeness
    - **Property 6: Track record completeness**
    - **Validates: Requirements 6.4**

  - [x] 9.8 Write property test for malformed request validation
    - **Property 18: Malformed request body returns 400**
    - **Validates: Requirements 21.9**

- [x] 10. Generating state screen
  - [x] 10.1 Build GeneratingState component
    - Create `client/src/components/home/GeneratingState.tsx` — pulsing animation, progress bar, cycling status messages ("Analyzing your content...", "Writing the script...", "Generating soundscape...", "Synthesizing voices..."), cancel button, "You said: [text]" display for voice input
    - Wire to Zustand `isGenerating` / `generationPhase` / `spokenInput` state
    - On cancel: AbortController abort + return to Home
    - On complete: navigate to PlayerScreen
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5_

- [x] 11. Checkpoint — Verify end-to-end generation pipeline
  - Ensure all tests pass, ask the user if questions arise.

- [x] 12. Player screen — waveform, audio layers, transcript, Hold On
  - [x] 12.1 Implement Wavesurfer.js audio player hook
    - Create `client/src/hooks/useAudioPlayer.ts` — Wavesurfer.js initialization, waveform rendering, play/pause, seek on click, skip ±15s, playback speed control
    - _Requirements: 8.2, 8.3, 8.4_

  - [x] 12.2 Implement Web Audio API multi-track layering hook
    - Create `client/src/hooks/useAudioLayers.ts` — load voice track + soundscape + intro/outro music as separate sources, manage playback sequencing (intro → voice+soundscape+bgmusic → outro), volume levels (soundscape 0.15, music 0.10), mute/unmute toggles
    - _Requirements: 22.3, 22.4, 22.5, 23.3, 23.4, 23.5, 23.6_

  - [x] 12.3 Build WaveformPlayer and layer toggle components
    - Create `client/src/components/player/WaveformPlayer.tsx` — waveform visualization, play/pause, skip ±15s, speed control, progress display
    - Create `client/src/components/player/SoundscapeToggle.tsx` — toggle to mute/unmute soundscape layer
    - Create `client/src/components/player/MusicToggle.tsx` — toggle to mute/unmute music layer
    - _Requirements: 8.2, 8.4, 22.4, 23.5_

  - [x] 12.4 Build TranscriptView with sync highlighting
    - Create `client/src/components/player/TranscriptView.tsx` — display transcript segments with EXPLAINER/LEARNER labels, highlight current segment based on playback time, click segment to seek
    - _Requirements: 9.1, 9.2, 9.3_

  - [ ]* 12.5 Write property test for transcript time-based lookup
    - **Property 8: Transcript segment time-based lookup**
    - **Validates: Requirements 9.2**

  - [ ]* 12.6 Write property test for transcript click seek
    - **Property 9: Transcript click seeks to segment start**
    - **Validates: Requirements 9.3**

  - [x] 12.7 Build HoldOnButton and interrupt flow
    - Create `client/src/components/player/HoldOnButton.tsx` — visible during playback, on tap: pause → POST /api/interrupt → play re-explanation → resume original
    - Create `server/routes/interrupt.ts` — POST /api/interrupt: DashScope re-explanation → ElevenLabs TTS (eleven_flash_v2_5) → save audio → create Interrupt DB record → return
    - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5, 10.6, 21.3_

  - [ ]* 12.8 Write property test for interrupt record completeness
    - **Property 10: Interrupt record completeness**
    - **Validates: Requirements 10.5**

  - [x] 12.9 Build PostListenActions and PlayerScreen
    - Create `client/src/components/player/PostListenActions.tsx` — "Generate a deeper dive", "Try a different lens", "Share this track" buttons shown when track finishes
    - Create `client/src/screens/PlayerScreen.tsx` — three tabs (Player, Transcript, Info), compose WaveformPlayer, toggles, HoldOnButton, TranscriptView, PostListenActions
    - _Requirements: 8.1, 19.1, 19.2, 19.3, 19.4, 19.5_

- [x] 13. Track library
  - [x] 13.1 Implement track management routes
    - Create `server/routes/tracks.ts` — GET /api/tracks (user's tracks, newest first), GET /api/tracks/:id, PATCH /api/tracks/:id/favorite (toggle), DELETE /api/tracks/:id (cascade delete audio files)
    - _Requirements: 21.4, 21.5, 21.6, 21.7, 11.8_

  - [ ]* 13.2 Write property tests for library operations
    - **Property 12: Favorite toggle is an involution**
    - **Property 13: Track deletion removes from database**
    - **Property 14: Tracks returned in descending creation order**
    - **Validates: Requirements 11.4, 11.6, 11.8**

  - [x] 13.3 Build LibraryScreen with search and filters
    - Create `client/src/components/library/TrackRow.tsx` — title, lens icon, duration, date, favorite icon
    - If the track is currently playing, show animated equalizer bars (3 bars, CSS animation) instead of duration text
    - Create `client/src/components/library/FilterControls.tsx` — lens filter dropdown + favorites toggle
    - Create `client/src/components/library/TrackContextMenu.tsx` — right-click/long-press menu: play, share, delete
    - Create `client/src/screens/LibraryScreen.tsx` — search input + filters + track list, real-time title search filtering
    - Library thumbnails: 56px squares with lens accent color at 12% opacity background + centered lens emoji. NO gradients.
    - _Requirements: 11.1, 11.2, 11.3, 11.4, 11.5, 11.6, 11.7_

  - [x] 13.4 Write property test for library search filtering
    - **Property 11: Library search filters correctly**
    - **Validates: Requirements 11.2, 11.3**

- [x] 14. Checkpoint — Verify player and library
  - Ensure all tests pass, ask the user if questions arise.

- [x] 15. Mini player
  - [x] 15.1 Build MiniPlayer component
    - Create `client/src/components/layout/MiniPlayer.tsx` — 72px fixed bottom bar with track title, play/pause button, progress indicator; visible when `currentTrack` is set; positioned above BottomTabBar on mobile
    - Wire to Zustand player state and audio layer controls
    - _Requirements: 8.9_

- [x] 16. Settings screen
  - [x] 16.1 Build SettingsScreen with defaults, playback, and account sections
    - Create `client/src/screens/SettingsScreen.tsx` — three sections: Defaults (default lens picker, default voice pair), Playback (speed selector: 0.5×–2×), Account (display name, created_at, logout button)
    - Persist defaults and playback speed to Zustand persisted store
    - Logout: clear localStorage + Zustand → redirect to AuthScreen
    - _Requirements: 14.1, 14.2, 14.3, 14.4, 14.5, 1.5_

- [x] 17. Share page
  - [x] 17.1 Implement share route and SharePage
    - Create `server/routes/share.ts` — GET /api/share/:shareId returns Track subset (no auth required), 404 if not found
    - Create `client/src/screens/SharePage.tsx` — public page with audio player, title, lens badge, transcript; no auth required
    - Implement copy-to-clipboard share link in format `/share/{shareId}` with toast confirmation
    - _Requirements: 12.1, 12.2, 12.3, 12.4, 12.5, 21.8_

  - [x] 17.2 Write property tests for sharing
    - **Property 15: Share ID uniqueness and URL format**
    - **Property 16: Public share endpoint returns track without auth**
    - **Validates: Requirements 12.1, 12.2, 12.4**

- [x] 18. Lens audio previews
  - [x] 18.1 Implement lens preview generation and route
    - Create `server/routes/lens-previews.ts` — GET /api/lens-previews returns `{ [lens]: audioUrl }` map; on first call, generate 2-second SFX previews for all 8 lenses via ElevenLabs Sound Effects API and cache to `public/audio/previews/`
    - Wire LensPickerDialog to fetch and play previews on hover/select
    - _Requirements: 25.1, 25.2, 25.3, 25.4, 25.5_

- [x] 19. Framer Motion animations and micro-interactions
  - [x] 19.1 Add page transition animations
    - Wrap route content in Framer Motion AnimatePresence with opacity crossfade only (200ms). NO slide animations.
    - Add exit animations for route changes (opacity 1→0, 200ms)
    - _Requirements: 13.1_

  - [x] 19.2 Add component micro-interactions (spring-physics based)
    - Define shared spring configs: SPRING_SNAPPY (stiffness: 500, damping: 30), SPRING_GENTLE (stiffness: 300, damping: 25), SPRING_SLOW (stiffness: 200, damping: 20)
    - Button press: scale(0.98) on active, spring back with SPRING_SNAPPY
    - Lens Picker cards: translateY(-1px) + subtle shadow increase on hover, SPRING_SNAPPY. scale(1.01) with spring.
    - Dialog open: opacity 0→1 + scale(0.98→1), SPRING_GENTLE
    - Dialog close: opacity 1→0 + scale(1→0.98), 150ms ease-out
    - Library track rows: stagger fade-in, 30ms apart, opacity 0→1 + translateY(4px→0)
    - HoldOn button: pulse glow animation (2s loop) using Framer Motion
    - HoldOn expand: AnimatePresence for input field expansion
    - NO decorative bounce animations. NO slide-in page transitions.
    - _Requirements: 7.1, 10.1, 11.1_

  - [x] 19.3 Add generating state animations
    - Pulsing circle: 200px, solid lens accent border (3px), opacity pulses 40%→100%→40% (2.5s ease-in-out, CSS keyframes — NOT Framer)
    - Soft blur glow at 15% opacity behind the circle
    - Status text: fade transitions between messages (200ms crossfade)
    - Progress bar: shimmer animation using CSS keyframes (translateX(-100%→100%), 2s linear infinite)
    - Error state: circle shrinks (scale 0.9), border flashes --error
    - Add `prefers-reduced-motion` check: all animations → instant, no motion
    - _Requirements: 7.1, 7.2, 7.4_

- [x] 20. Responsive polish and mobile optimization
  - [x] 20.1 Implement mobile bottom sheets for dialogs
    - On viewports <768px, LensPickerDialog and VoicePickerDialog render as full-screen bottom sheets (shadcn Sheet) instead of centered dialogs
    - Attach Popover on Home screen becomes a bottom sheet on mobile
    - _Requirements: 13.5_

  - [x] 20.2 Implement Mini Player mobile stacking
    - On mobile (<768px), Mini Player sits ABOVE the BottomTabBar (bottom: 56px instead of bottom: 0)
    - Main content area adds padding-bottom to account for both bars
    - _Requirements: 8.9, 13.5_

  - [x] 20.3 Add touch-friendly targets and visual flourishes
    - All interactive elements minimum 44px touch target on mobile
    - Auth screen: very subtle radial background wash using --accent at 3% opacity (barely visible, radial-gradient(circle at 50% 40%, rgba(99,102,241,0.03) 0%, transparent 60%))
    - Share page: very subtle radial wash in lens accent at 3% opacity
    - Library thumbnails: 56px squares with lens accent color at 12% opacity background + centered lens emoji. NO gradients.
    - Player background wash: lens accent at 3% opacity, radial fade. NO gradient overlays.
    - _Requirements: 13.1, 17.1_

- [x] 21. Keyboard shortcuts and toast notifications
  - [x] 21.1 Implement keyboard shortcuts and toast system
    - Create `client/src/hooks/useKeyboardShortcuts.ts` — Space (play/pause), Arrow Right (+15s), Arrow Left (-15s), M (mute), Escape (close dialogs), N (new generation outside text input)
    - Configure Sonner toast provider with consistent positioning and auto-dismiss
    - Add aria-label attributes to all interactive elements, focus trapping in dialogs, visible focus rings
    - _Requirements: 8.5, 8.6, 8.7, 8.8, 15.1, 15.2, 16.1, 16.2, 16.3, 17.1, 17.2, 17.3, 17.4_

- [x] 22. Final checkpoint — Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation after each major milestone
- Property tests validate the 18 correctness properties from the design document using fast-check
- Build order is optimized for hackathon demo impact: voice input hero → generation → player → library
- Frontend audio layering via Web Audio API eliminates ffmpeg dependency
- Guest auth (no passwords) keeps the auth flow minimal for demo purposes
