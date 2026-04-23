# Requirements: Generation Pipeline Refinement

## Introduction

Fathom transforms any text into a two-voice AI podcast tailored to the user's learning style. This spec makes the generation pipeline production-ready based on deep research into NotebookLM, NotebookLlama, open-source alternatives, and the specific APIs we use.

## Technology Stack

### DashScope (Qwen-Plus) for Script Generation
- **Endpoint:** `https://dashscope-intl.aliyuncs.com/compatible-mode/v1` (Singapore)
- **Model:** `qwen-plus` (best balance of performance, speed, and cost per Alibaba docs)
- **Format:** OpenAI-compatible chat completions with `response_format: { type: "json_object" }`
- **Auth:** Bearer token via `DASHSCOPE_API_KEY`
- **Role:** Use `role: "system"` (NOT `"developer"`)
- **Capabilities:** Strong at structured JSON output, creative writing, multilingual

### ElevenLabs for Audio
- **TTS Model:** `eleven_flash_v2_5` (75ms latency, multilingual, best for speed)
- **TTS Format:** `mp3_44100_128` (128kbps MP3, good quality, reasonable file size)
- **Voice Settings for Podcast:** `stability: 0.4, similarityBoost: 0.75, style: 0.3` (conversational preset from ElevenLabs docs)
- **Context Stitching:** `previousText` and `nextText` params for smooth transitions between segments
- **Sound Effects:** `textToSoundEffects.convert` with `promptInfluence: 0.7`
- **Music:** `music.compose` with `forceInstrumental: true`
- **STT:** `speechToText.convert` with `scribe_v2` model
- **SDK:** `@elevenlabs/elevenlabs-js` (returns ReadableStream, collect with async iteration)

### Voice ID Mapping
| Internal ID | Name | ElevenLabs Voice ID | Character |
|------------|------|-------------------|-----------|
| marcus | Marcus | JBFqnCBsd6RMkjVDRZzb | George: Warm, Captivating Storyteller |
| aria | Aria | cgSgspJ2msm6clMCkdW9 | Jessica: Playful, Bright, Warm |
| kai | Kai | SAz9YHcvj6GT2YYXdXww | River: Relaxed, Neutral, Informative |
| luna | Luna | Xb7hH8MSUJpSbSDYk0k2 | Alice: Clear, Engaging Educator |
| rex | Rex | IKne3meq5aSn9XLyUdCD | Charlie: Deep, Confident, Energetic |

## Generation Pipeline (4 Stages)

Based on NotebookLlama's proven architecture:

```
User Input -> [1. Pre-Process] -> [2. Script Write] -> [3. Script Refine] -> [4. Audio Synth] -> Podcast
                                                                              |
                                                              [Soundscape + Music in parallel]
```

## Requirements

### Requirement 1: Content Pre-Processing (Stage 1)

**User Story:** As a user, I want Fathom to focus on the most important points in my text, so the podcast is concise and engaging.

#### Acceptance Criteria

1. WHEN content exceeds 3000 characters, the backend SHALL send it to DashScope (qwen-plus) with a summarization prompt that extracts: a suggested title, 3-5 key topics, and a condensed version of the text (under 2000 words).
2. WHEN content is under 3000 characters, the backend SHALL skip pre-processing and pass it directly to script generation.
3. The pre-processing prompt SHALL instruct the model to preserve key facts, arguments, examples, and interesting details while removing redundancy.
4. The pre-processing step SHALL complete within 15 seconds.
5. IF pre-processing fails, the backend SHALL fall back to using the raw content (truncated to 4000 characters if needed).

### Requirement 2: Script Generation (Stage 2)

**User Story:** As a user, I want the podcast script to be a natural two-person conversation styled to my chosen learning lens.

#### Acceptance Criteria

1. The backend SHALL send the pre-processed content to DashScope (qwen-plus) with a system prompt that defines two speakers: EXPLAINER (teaches the material) and LEARNER (asks questions, reacts, seeks clarity).
2. The system prompt SHALL include the learning lens modifier (e.g., gaming metaphors for Gamer, coaching language for Coach, simple words for ELI5).
3. The output SHALL be valid JSON with format: `{ "title": string, "segments": [{ "speaker": "EXPLAINER"|"LEARNER", "text": string }] }`.
4. The script SHALL contain 10-15 segments for optimal length (keeps TTS under 90 seconds).
5. Each segment SHALL be 1-3 sentences.
6. The model SHALL use `response_format: { type: "json_object" }` to guarantee valid JSON output.
7. The system prompt SHALL use `role: "system"` (not "developer").

### Requirement 3: Script Refinement (Stage 3)

**User Story:** As a user, I want the podcast to sound like a real conversation, not a robot reading a script.

#### Acceptance Criteria

1. The backend SHALL send the initial script to DashScope (qwen-plus) for a second pass that adds natural speech patterns.
2. The refinement prompt SHALL instruct the model to: add filler words ("so", "right", "you know"), add reactions ("wow", "that makes sense", "oh interesting"), smooth transitions between topics, and make the LEARNER's questions feel genuine.
3. The refined script SHALL maintain the same JSON format and segment count as the original.
4. The refinement step SHALL complete within 15 seconds.
5. IF refinement fails, the backend SHALL use the original unrefined script.

### Requirement 4: TTS Synthesis (Stage 4)

**User Story:** As a user, I want each speaker to have a distinct, natural-sounding voice.

#### Acceptance Criteria

1. The backend SHALL use ElevenLabs `eleven_flash_v2_5` model for all TTS.
2. The backend SHALL resolve internal voice IDs to ElevenLabs voice IDs using the mapping table.
3. The backend SHALL set voice settings for conversational style: `stability: 0.4, similarityBoost: 0.75, style: 0.3, useSpeakerBoost: true`.
4. The backend SHALL pass `previousText` and `nextText` for context stitching between segments.
5. Each TTS call SHALL have a 20-second timeout.
6. IF a TTS call fails, the backend SHALL retry up to 2 times with a 2-second delay.
7. IF a TTS call fails after retries, the backend SHALL return an error indicating which segment failed.
8. TTS segments SHALL be processed sequentially (required for context stitching).

### Requirement 5: Parallel Audio Generation

**User Story:** As a user, I want generation to be fast.

#### Acceptance Criteria

1. Soundscape and music generation SHALL start IN PARALLEL with script generation (Stage 2), not after.
2. Soundscape SHALL use the lens-specific prompt from the lens config.
3. Music SHALL generate a 10-second intro clip and a 5-second outro clip.
4. Soundscape SHALL have a 30-second timeout.
5. Music SHALL have a 45-second timeout.
6. IF any audio generation fails or times out, the backend SHALL proceed without it and log the error.
7. The frontend SHALL layer soundscape and music during playback using Web Audio API (backend does NOT mix them).

### Requirement 6: Audio Assembly

**User Story:** As a user, I want the final podcast audio to play seamlessly.

#### Acceptance Criteria

1. The audio assembler SHALL concatenate all TTS segment buffers into a single MP3 using `Buffer.concat`.
2. Duration SHALL be calculated from total buffer size: `durationSec = totalBytes / 16000` (128kbps).
3. Transcript timestamps SHALL be calculated per-segment from individual buffer sizes.
4. All files SHALL be saved to `public/audio/` with track ID in filenames.
5. The track database record SHALL store: id, user_id, title, source_text, lens, voice_config, transcript (JSON), audio_url, duration, share_id, soundscape_url, intro_music_url, outro_music_url.

### Requirement 7: Real-Time Progress

**User Story:** As a user, I want to see exactly what's happening during generation.

#### Acceptance Criteria

1. The generate endpoint SHALL use Server-Sent Events (SSE) to push progress updates to the frontend.
2. Progress events SHALL include: `{ step: string, current: number, total: number, percent: number }`.
3. Steps SHALL be: "Analyzing content" (5%), "Writing script" (20%), "Refining script" (35%), "Synthesizing voice 1 of N" (35-90%), "Assembling audio" (92%), "Saving track" (98%), "Complete" (100%).
4. The frontend SHALL display the step name and a progress bar.
5. WHEN complete, the SSE SHALL send the full track data and the frontend SHALL navigate to the player.

### Requirement 8: Error Handling

**User Story:** As a user, I want clear feedback when something goes wrong.

#### Acceptance Criteria

1. DashScope errors SHALL show: "Could not generate script. Please try again."
2. TTS errors SHALL show: "Voice synthesis failed on segment X. Please try again."
3. Timeout errors (over 3 minutes) SHALL show: "Generation took too long. Please try with shorter content."
4. The retry button SHALL re-submit the same content, lens, and voice config.
5. The cancel button SHALL abort generation and return to the home screen.
6. All errors SHALL be logged server-side with full stack traces.

### Requirement 9: Voice Input (STT)

**User Story:** As a user, I want to speak my topic instead of typing.

#### Acceptance Criteria

1. WHEN the mic button is clicked (textarea empty), the frontend SHALL record audio via MediaRecorder.
2. WHEN recording stops, the audio SHALL be sent to POST /api/transcribe.
3. The backend SHALL use ElevenLabs Scribe (`scribe_v2`) to transcribe.
4. The transcribed text SHALL populate the textarea.
5. IF transcription fails, the frontend SHALL show an error toast.

### Requirement 10: URL Scraping

**User Story:** As a user, I want to paste a URL and have the text extracted automatically.

#### Acceptance Criteria

1. WHEN the user pastes a URL (detected by regex), the frontend SHALL show a "Scrape this URL?" prompt.
2. The backend SHALL use Jina Reader API to extract text from the URL.
3. The extracted text SHALL replace the URL in the textarea.
4. IF scraping fails, the frontend SHALL show an error toast and keep the URL as-is.

### Requirement 11: Environment Configuration

**User Story:** As a developer, I want the server to start reliably.

#### Acceptance Criteria

1. The server SHALL load `.env` using manual file parsing (readFileSync + line splitting) to avoid dotenv encoding issues on Windows.
2. The server SHALL log API key status at startup.
3. The health endpoint SHALL report: server status, API key presence, database status.
4. Voice ID mapping SHALL be in `server/config/voices.ts` with a `resolveVoiceId()` function.
