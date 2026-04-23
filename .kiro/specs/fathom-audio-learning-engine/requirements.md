# Requirements Document

## Introduction

Fathom is a hyper-personalized audio learning engine that transforms any text into a two-voice AI podcast tailored to how the user learns best. Users paste text, attach URLs, or drag-and-drop files, choose a "learning lens" (e.g., Gamer, Coach, ELI5, Storyteller) and voice pair, then Fathom generates a conversational podcast between an Explainer and a Learner. The app features a full audio player with waveform visualization, transcript view, a "Hold On" re-explanation interrupt feature, a personal library of generated tracks, and public sharing. Built with React + Vite + TypeScript on the frontend and Node.js + Express + SQLite on the backend, Fathom integrates Alibaba Cloud DashScope (qwen-plus) for script generation and ElevenLabs for text-to-speech, sound effects, music generation, and speech-to-text.

## Glossary

- **App**: The Fathom web application as a whole, encompassing frontend and backend.
- **Frontend**: The React + Vite + TypeScript client application rendered in the browser.
- **Backend**: The Node.js + Express server that handles API requests, LLM calls, TTS synthesis, and database operations.
- **Database**: The SQLite database storing users, tracks, and interrupts.
- **DashScope_Client**: The module responsible for communicating with the Alibaba Cloud DashScope API (Singapore endpoint) using the qwen-plus model in OpenAI-compatible format.
- **ElevenLabs_Client**: The module using the @elevenlabs/elevenlabs-js SDK to synthesize speech via the ElevenLabs API.
- **Track**: A generated audio podcast episode stored in the database, including its audio file, transcript, metadata, and associated learning lens.
- **Interrupt**: A "Hold On" re-explanation request made by the user during playback, stored in the database and linked to a Track.
- **Learning_Lens**: One of eight predefined learning styles (Gamer, Coach, ELI5, Storyteller, Scientist, Pop_Culture, Chef, Street_Smart) that shapes the tone and style of the generated podcast script.
- **Voice_Pair**: A combination of an Explainer voice and a Learner voice selected by the user from five preset ElevenLabs voices.
- **Explainer**: The podcast speaker role that teaches and explains the source material.
- **Learner**: The podcast speaker role that asks questions, reacts, and seeks clarification.
- **Script**: The structured JSON output from DashScope_Client containing an ordered list of dialogue segments with speaker role, text, and optional stage directions.
- **Waveform_Player**: The Wavesurfer.js-based audio player component that renders a waveform visualization and provides playback controls.
- **Mini_Player**: The 72px fixed bottom bar that appears when audio is playing, providing persistent playback controls across all screens.
- **Sidebar**: The 56px fixed left navigation panel with icon-only items and micro labels (desktop only).
- **Bottom_Tab_Bar**: The 56px fixed bottom navigation bar replacing the Sidebar on mobile viewports below 768px.
- **Share_Page**: The public, unauthenticated page at /share/:shareId that allows anyone to listen to a shared Track.
- **Jina_Reader**: The external Jina Reader API used to scrape and extract text content from URLs.
- **Voice_Design_API**: The ElevenLabs API endpoint used to create preset voices during first application initialization.
- **Soundscape**: An ambient sound effect layer generated via the ElevenLabs Sound Effects API, mixed under the podcast audio to create an immersive listening environment.
- **Lens_Music**: A short AI-generated music clip created via the ElevenLabs Music API that serves as intro/outro and subtle background music for a podcast track.
- **Scribe**: The ElevenLabs Speech-to-Text API used to transcribe user voice input into text on the Home screen.

## Requirements

### Requirement 1: User Authentication

**User Story:** As a user, I want to enter my display name and start using Fathom, so that my generated tracks and preferences are saved to my account.

#### Acceptance Criteria

1. WHEN a user navigates to the App without an active session, THE Frontend SHALL display a full-screen centered guest authentication screen with a display name input and a "Start Learning" button.
2. WHEN a user submits a valid display name, THE Backend SHALL create a user record in the Database with a nanoid-generated id and the provided display name, and return the user data.
3. IF a user submits an empty or whitespace-only display name, THEN THE Backend SHALL return a 400 error with a descriptive validation message.
4. WHEN a user is authenticated, THE Backend SHALL create a row in the users table with id, display_name, and created_at fields.
5. WHEN a user logs out, THE Frontend SHALL clear the stored user data from localStorage and redirect to the guest authentication screen.

### Requirement 2: Source Content Input

**User Story:** As a user, I want to provide text content via paste, URL, or file drag-and-drop, so that Fathom can generate a podcast from my chosen material.

#### Acceptance Criteria

1. THE Frontend SHALL display a centered auto-resizing textarea on the Home screen for pasting text content.
2. WHEN a user pastes text into the textarea, THE Frontend SHALL accept and display the pasted content with no maximum character limit enforced on the client.
3. WHEN a user attaches a URL, THE Backend SHALL send the URL to the Jina_Reader API via POST /api/scrape-url and return the extracted text content.
4. IF the Jina_Reader API returns an error or empty content, THEN THE Backend SHALL return an error response with a descriptive message indicating the URL could not be scraped.
5. WHEN a user drags and drops a text file onto the Home screen, THE Frontend SHALL read the file contents and populate the textarea with the extracted text.
6. WHEN a user provides content via any input method, THE Frontend SHALL enable the generate button only after both content and a Learning_Lens are selected.

### Requirement 3: Learning Lens Selection

**User Story:** As a user, I want to choose a learning lens that matches how my brain works, so that the generated podcast uses a teaching style I connect with.

#### Acceptance Criteria

1. THE Frontend SHALL display selectable lens pills on the Home screen representing the eight Learning_Lens options: Gamer, Coach, ELI5, Storyteller, Scientist, Pop_Culture, Chef, and Street_Smart.
2. WHEN a user taps a lens pill, THE Frontend SHALL open a Lens Picker dialog displaying all eight Learning_Lens options as cards with subtle accent tint backgrounds, name, description, and icon.
3. WHEN a user selects a Learning_Lens from the Lens Picker dialog, THE Frontend SHALL close the dialog and display the selected lens as the active pill on the Home screen.
4. THE Frontend SHALL apply subtle lens accent tint backgrounds on Lens Picker cards (lens accent color at 8% opacity with a 2px left border in the lens accent color) and SHALL NOT apply gradients to any UI elements. The only permitted gradient is a very subtle radial background wash on the Player screen at 3% opacity.
5. WHEN no Learning_Lens is selected, THE Frontend SHALL disable the generate action.

### Requirement 4: Voice Pair Selection

**User Story:** As a user, I want to pick the voices for the Explainer and Learner, so that the podcast sounds the way I prefer.

#### Acceptance Criteria

1. THE Frontend SHALL display a voice picker trigger on the Home screen that opens a Voice Picker dialog.
2. WHEN the Voice Picker dialog opens, THE Frontend SHALL display five preset voices with preview playback capability for both the Explainer and Learner roles.
3. WHEN a user selects a voice for the Explainer role, THE Frontend SHALL update the Voice_Pair Explainer assignment and display the selected voice name.
4. WHEN a user selects a voice for the Learner role, THE Frontend SHALL update the Voice_Pair Learner assignment and display the selected voice name.
5. WHEN the App initializes for the first time, THE Backend SHALL create five preset voices using the ElevenLabs Voice_Design_API and store the resulting voice IDs for subsequent use.
6. WHEN a user taps a voice preview button, THE ElevenLabs_Client SHALL generate a short audio sample and THE Frontend SHALL play the sample immediately.

### Requirement 5: Podcast Script Generation

**User Story:** As a user, I want Fathom to generate a two-speaker podcast script from my content using my chosen learning lens, so that the material is transformed into an engaging conversational format.

#### Acceptance Criteria

1. WHEN a user triggers generation via POST /api/generate with content, a Learning_Lens, and a Voice_Pair, THE DashScope_Client SHALL send a request to the DashScope API at base URL https://dashscope-intl.aliyuncs.com/compatible-mode/v1 using model qwen-plus.
2. THE DashScope_Client SHALL use OpenAI-compatible chat format with role "system" for the system prompt and SHALL NOT use role "developer".
3. THE DashScope_Client SHALL request JSON output by setting response_format to { type: "json_object" } in the API request.
4. THE DashScope_Client SHALL include a system prompt that instructs the model to generate a two-speaker podcast Script with EXPLAINER and LEARNER roles, styled according to the selected Learning_Lens.
5. THE Script output SHALL contain an ordered list of dialogue segments, where each segment includes a speaker role (EXPLAINER or LEARNER), the dialogue text, and optional stage directions.
6. IF the DashScope API returns an error or invalid JSON, THEN THE Backend SHALL return an error response to the Frontend with a descriptive message.

### Requirement 6: Text-to-Speech Synthesis and Audio Stitching

**User Story:** As a user, I want each speaker in the podcast to have a distinct AI voice and the final audio to sound like a seamless conversation, so that the listening experience is natural and engaging.

#### Acceptance Criteria

1. WHEN a Script is generated, THE ElevenLabs_Client SHALL synthesize each dialogue segment using the assigned voice from the Voice_Pair, with model eleven_v3 and output format mp3_44100_128.
2. THE ElevenLabs_Client SHALL pass previousText and nextText parameters for each segment to enable smooth cross-segment stitching.
3. WHEN all segments are synthesized, THE Backend SHALL assemble the final audio by concatenating the Lens_Music intro clip, the voice segments with the Soundscape mixed at 15% volume, and the Lens_Music outro clip into a single MP3 file.
4. WHEN the final audio file is assembled, THE Backend SHALL create a Track record in the Database with title, audio_url, transcript, lens, voice configuration, duration, share_id, soundscape_url, intro_music_url, and outro_music_url.
5. IF the ElevenLabs API returns an error for any segment, THEN THE Backend SHALL abort generation and return an error response with a descriptive message indicating which segment failed.

### Requirement 7: Generation Progress State

**User Story:** As a user, I want to see real-time progress while my podcast is being generated, so that I know the system is working and approximately how long it will take.

#### Acceptance Criteria

1. WHEN generation begins, THE Frontend SHALL display a generating state screen with a pulsing animation and a progress bar.
2. WHILE generation is in progress, THE Frontend SHALL cycle through status text messages indicating the current generation phase (e.g., "Analyzing your content...", "Writing the script...", "Synthesizing voices...").
3. WHEN a user clicks the cancel button during generation, THE Frontend SHALL abort the generation request and return to the Home screen.
4. IF generation fails, THEN THE Frontend SHALL display an error state with a descriptive message and a retry button.
5. WHEN generation completes, THE Frontend SHALL navigate to the Player screen for the newly created Track.

### Requirement 8: Audio Player

**User Story:** As a user, I want a full-featured audio player with waveform visualization, so that I can listen to, navigate, and control my generated podcasts.

#### Acceptance Criteria

1. WHEN a user opens a Track, THE Frontend SHALL display the Player screen with three tabs: Player, Transcript, and Info.
2. THE Waveform_Player SHALL render an interactive waveform visualization of the Track audio using Wavesurfer.js.
3. WHEN a user clicks on the waveform, THE Waveform_Player SHALL seek to the clicked position in the audio.
4. THE Waveform_Player SHALL provide play/pause, skip forward 15 seconds, skip backward 15 seconds, and playback speed controls.
5. WHEN a user presses the Space key, THE Waveform_Player SHALL toggle play/pause.
6. WHEN a user presses the right arrow key, THE Waveform_Player SHALL skip forward 15 seconds.
7. WHEN a user presses the left arrow key, THE Waveform_Player SHALL skip backward 15 seconds.
8. WHEN a user presses the M key, THE Waveform_Player SHALL toggle mute.
9. WHEN audio is playing on any screen, THE Frontend SHALL display the Mini_Player as a 72px fixed bottom bar with track title, play/pause, and progress indicator.

### Requirement 9: Transcript View

**User Story:** As a user, I want to read along with the podcast transcript and see which speaker is talking, so that I can follow the content visually while listening.

#### Acceptance Criteria

1. WHEN a user selects the Transcript tab on the Player screen, THE Frontend SHALL display the full dialogue transcript with each segment labeled by speaker role (EXPLAINER or LEARNER).
2. WHILE audio is playing, THE Frontend SHALL highlight the currently spoken transcript segment in sync with the audio playback position.
3. WHEN a user clicks a transcript segment, THE Waveform_Player SHALL seek to the start time of that segment.

### Requirement 10: Hold On Interrupt Re-Explanation

**User Story:** As a user, I want to tap "Hold On" during playback to get a simpler re-explanation of what was just said, so that I can understand confusing parts without rewinding.

#### Acceptance Criteria

1. WHILE audio is playing, THE Frontend SHALL display a "Hold On" button on the Player screen.
2. WHEN a user taps the "Hold On" button, THE Frontend SHALL pause playback and send a POST /api/interrupt request with the Track ID and the current playback timestamp.
3. WHEN the Backend receives an interrupt request, THE DashScope_Client SHALL generate a simplified re-explanation of the content around the specified timestamp using the Track transcript.
4. WHEN the re-explanation Script is generated, THE ElevenLabs_Client SHALL synthesize the re-explanation audio using model eleven_flash_v2_5 for faster generation.
5. WHEN the re-explanation audio is ready, THE Frontend SHALL play the re-explanation audio and THE Backend SHALL store the Interrupt record in the Database with track_id, timestamp, explanation text, and audio URL.
6. WHEN the re-explanation audio finishes, THE Frontend SHALL resume the original Track playback from where the user interrupted.

### Requirement 11: Track Library

**User Story:** As a user, I want to browse, search, and manage all my generated podcasts in a library, so that I can revisit and organize my learning content.

#### Acceptance Criteria

1. WHEN a user navigates to the Library screen, THE Frontend SHALL display all user Tracks as rows with title, Learning_Lens, duration, creation date, and favorite status.
2. THE Frontend SHALL provide a search input that filters Tracks by title in real time as the user types.
3. THE Frontend SHALL provide filter controls to filter Tracks by Learning_Lens and favorite status.
4. WHEN a user clicks the favorite icon on a Track row, THE Backend SHALL toggle the favorite status via PATCH /api/tracks/:id/favorite and THE Frontend SHALL update the display immediately.
5. WHEN a user right-clicks or long-presses a Track row, THE Frontend SHALL display a context menu with options to play, share, and delete the Track.
6. WHEN a user selects delete from the context menu, THE Backend SHALL delete the Track via DELETE /api/tracks/:id and THE Frontend SHALL remove the Track from the Library display.
7. THE Frontend SHALL apply subtle lens accent tint backgrounds on Library thumbnail elements (lens accent color at 12% opacity with lens emoji), and SHALL NOT apply gradients to Track rows, buttons, or borders.
8. WHEN the Backend receives GET /api/tracks, THE Backend SHALL return all Tracks belonging to the authenticated user ordered by creation date descending.

### Requirement 12: Track Sharing

**User Story:** As a user, I want to share my generated podcasts via a public link, so that others can listen without needing an account.

#### Acceptance Criteria

1. WHEN a Track is created, THE Backend SHALL generate a unique share_id and store it in the Track record.
2. WHEN a user copies the share link, THE Frontend SHALL copy the URL in the format /share/:shareId to the clipboard and display a toast notification confirming the copy.
3. WHEN a visitor navigates to /share/:shareId, THE Frontend SHALL display the Share_Page with the Track audio player, title, Learning_Lens, and transcript without requiring authentication.
4. WHEN the Backend receives GET /api/share/:shareId, THE Backend SHALL return the Track data associated with the share_id regardless of authentication status.
5. IF the share_id does not match any Track, THEN THE Backend SHALL return a 404 error response.

### Requirement 13: Application Layout and Navigation

**User Story:** As a user, I want a consistent dark-mode layout with intuitive navigation, so that I can move between screens efficiently on any device.

#### Acceptance Criteria

1. THE Frontend SHALL render a dark-mode-only interface using CSS variables: --bg-primary (#09090B), --bg-secondary (#18181B), --bg-tertiary (#27272A), --bg-elevated (#09090B), --border-primary (rgba(255,255,255,0.08)), --border-secondary (rgba(255,255,255,0.04)), --border-focus (rgba(99,102,241,0.5)), --text-primary (#FAFAFA), --text-secondary (#A1A1AA), --text-tertiary (#71717A), --text-muted (#52525B), --accent (#6366F1), --accent-hover (#818CF8), --accent-muted (rgba(99,102,241,0.15)), --success (#22C55E), --warning (#EAB308), --error (#EF4444), and lens accent colors: --lens-gamer (#8B5CF6), --lens-coach (#10B981), --lens-eli5 (#F59E0B), --lens-storyteller (#F97316), --lens-scientist (#3B82F6), --lens-popculture (#EC4899), --lens-chef (#F97316), --lens-streetsmart (#6B7280).
2. THE Frontend SHALL use the Geist Sans font family with Inter and system-ui as fallbacks (--font-sans: 'Geist Sans', 'Inter', -apple-system, 'Segoe UI', system-ui, sans-serif) and Geist Mono for monospace (--font-mono: 'Geist Mono', 'Berkeley Mono', 'SF Mono', monospace). Headings SHALL use tight negative letter-spacing (-0.025em for h1, -0.02em for h2, -0.015em for h3) and body text SHALL use -0.011em letter-spacing. Labels and small text SHALL use font-weight 500, slightly positive letter-spacing (0.01em), and text-transform uppercase.
3. THE Frontend SHALL render the Sidebar as a 56px fixed left panel with icon-only navigation items (New, Home, Library, Settings) and micro labels on viewports 768px and wider.
4. THE Frontend SHALL indicate the active Sidebar item with a 3px left border bar in --accent color.
5. WHEN the viewport width is below 768px, THE Frontend SHALL hide the Sidebar and display the Bottom_Tab_Bar as a 56px fixed bottom navigation with three tabs.
6. THE Frontend SHALL center the main content area with a maximum width of 800px.
7. THE Frontend SHALL use 10px border radius for cards and modals, 6px border radius for buttons and inputs, 4px border radius for small elements (tags, badges), and 9999px border radius for pills.
8. THE Frontend SHALL use spacing values in multiples of 4px throughout the interface.

### Requirement 14: Settings Management

**User Story:** As a user, I want to configure my default learning lens, voice pair, and playback preferences, so that I do not have to re-select them every time I generate a podcast.

#### Acceptance Criteria

1. WHEN a user navigates to the Settings screen, THE Frontend SHALL display three sections: Defaults, Playback, and Account.
2. WHEN a user selects a default Learning_Lens in Settings, THE Frontend SHALL persist the selection and pre-select that lens on the Home screen for subsequent generations.
3. WHEN a user selects a default Voice_Pair in Settings, THE Frontend SHALL persist the selection and pre-select those voices on the Home screen for subsequent generations.
4. WHEN a user adjusts playback speed in Settings, THE Frontend SHALL persist the preference and apply the selected speed to all subsequent audio playback.
5. THE Frontend SHALL display account information including username and account creation date in the Account section.

### Requirement 15: Keyboard Shortcuts

**User Story:** As a user, I want keyboard shortcuts for common actions, so that I can control the app efficiently without using the mouse.

#### Acceptance Criteria

1. WHEN a user presses the Escape key, THE Frontend SHALL close any open dialog or modal.
2. WHEN a user presses the N key outside of a text input, THE Frontend SHALL navigate to the Home screen to start a new generation.
3. WHEN a user presses Cmd+Enter (Mac) or Ctrl+Enter (Windows) while the textarea is focused, THE Frontend SHALL trigger the generate action if content and a Learning_Lens are selected.

### Requirement 16: Toast Notifications

**User Story:** As a user, I want non-intrusive toast notifications for important actions and errors, so that I receive feedback without disrupting my workflow.

#### Acceptance Criteria

1. WHEN a significant action completes (share link copied, track deleted, track favorited), THE Frontend SHALL display a toast notification using the Sonner library.
2. WHEN an API error occurs, THE Frontend SHALL display an error toast with a descriptive message.
3. THE Frontend SHALL position toast notifications consistently and dismiss them automatically after a timeout.

### Requirement 17: Accessibility

**User Story:** As a user with assistive technology, I want the app to be accessible, so that I can use all features regardless of ability.

#### Acceptance Criteria

1. THE Frontend SHALL include aria-label attributes on all interactive elements including buttons, links, and form controls.
2. THE Frontend SHALL trap focus within open dialogs and modals, preventing focus from escaping to background content.
3. THE Frontend SHALL display visible focus rings on all focusable elements when navigated via keyboard.
4. IF audio playback fails, THEN THE Frontend SHALL display a visible fallback message indicating the audio could not be loaded.

### Requirement 18: First-Run Experience

**User Story:** As a new user, I want to see pre-populated example content on my first visit, so that I understand how Fathom works before creating my own podcast.

#### Acceptance Criteria

1. WHEN a new user logs in for the first time, THE Frontend SHALL detect the absence of existing Tracks in the user Library.
2. WHEN no Tracks exist for the user, THE Frontend SHALL display pre-populated example content on the Home screen demonstrating the input textarea, lens selection, and voice selection.
3. WHEN the user dismisses the first-run content or generates a Track, THE Frontend SHALL transition to the standard Home screen state.

### Requirement 19: Post-Listen Follow-Ups

**User Story:** As a user, I want suggested follow-up actions after finishing a podcast, so that I can continue learning or take action on the content.

#### Acceptance Criteria

1. WHEN a Track finishes playing, THE Frontend SHALL display follow-up suggestions on the Player screen.
2. THE Frontend SHALL include follow-up options such as "Generate a deeper dive", "Try a different lens", and "Share this track".
3. WHEN a user selects "Generate a deeper dive", THE Frontend SHALL navigate to the Home screen with the original content pre-filled and a prompt to select a new Learning_Lens.
4. WHEN a user selects "Try a different lens", THE Frontend SHALL navigate to the Home screen with the original content pre-filled and the Lens Picker dialog open.
5. WHEN a user selects "Share this track", THE Frontend SHALL copy the share link to the clipboard and display a toast notification.

### Requirement 20: Database Schema

**User Story:** As a developer, I want a well-structured database schema, so that all application data is stored reliably with proper relationships and constraints.

#### Acceptance Criteria

1. THE Database SHALL contain a users table with columns: id (TEXT, primary key, nanoid-generated), display_name (TEXT, not null), and created_at (TEXT, default datetime('now')).
2. THE Database SHALL contain a tracks table with columns: id (TEXT, primary key, nanoid-generated), user_id (TEXT, foreign key referencing users.id, not null), title (TEXT, not null), source_text (TEXT), lens (TEXT, not null), voice_config (TEXT, JSON string), transcript (TEXT, JSON string), audio_url (TEXT), duration (INTEGER), share_id (TEXT, unique), is_favorite (INTEGER, default 0), soundscape_url (TEXT), intro_music_url (TEXT), outro_music_url (TEXT), and created_at (TEXT, default datetime('now')).
3. THE Database SHALL contain an interrupts table with columns: id (TEXT, primary key, nanoid-generated), track_id (TEXT, foreign key referencing tracks.id, not null), timestamp_sec (INTEGER, not null), explanation (TEXT), audio_url (TEXT), and created_at (TEXT, default datetime('now')).
4. THE Database SHALL enforce foreign key constraints with CASCADE delete from users to tracks and from tracks to interrupts.

### Requirement 21: API Route Structure

**User Story:** As a developer, I want clearly defined API routes, so that the frontend and backend communicate through a consistent and predictable interface.

#### Acceptance Criteria

1. THE Backend SHALL expose POST /api/generate accepting content, lens, and voice configuration in the request body and returning the generated Track data.
2. THE Backend SHALL expose POST /api/scrape-url accepting a URL in the request body and returning the extracted text content.
3. THE Backend SHALL expose POST /api/interrupt accepting track_id and timestamp_sec in the request body and returning the re-explanation audio and text.
4. THE Backend SHALL expose GET /api/tracks returning all Tracks for the authenticated user.
5. THE Backend SHALL expose GET /api/tracks/:id returning a single Track by ID for the authenticated user.
6. THE Backend SHALL expose PATCH /api/tracks/:id/favorite toggling the is_favorite field and returning the updated Track.
7. THE Backend SHALL expose DELETE /api/tracks/:id deleting the Track and returning a success confirmation.
8. THE Backend SHALL expose GET /api/share/:shareId returning Track data for public access without authentication.
9. IF any API route receives a malformed request body, THEN THE Backend SHALL return a 400 error response with a descriptive validation message.


### Requirement 22: Immersive Lens Soundscapes

**User Story:** As a user, I want ambient sound effects layered under my podcast that match my chosen learning lens, so that the listening experience feels immersive and uniquely tailored to my learning style.

#### Acceptance Criteria

1. WHEN a Script is generated, THE Backend SHALL generate a Soundscape audio clip via the ElevenLabs Sound Effects API (POST /v1/sound-generation) using a text prompt, duration_seconds matching the estimated Track duration, and prompt_influence parameter.
2. THE Backend SHALL select the Soundscape text prompt based on the chosen Learning_Lens: "Subtle retro arcade ambience with soft electronic hums and distant game sounds" for Gamer, "Stadium crowd ambience with distant cheering and whistle sounds" for Coach, "Warm cozy room ambience with soft background sounds" for ELI5, "Cinematic ambient atmosphere with soft orchestral undertones" for Storyteller, "Clean laboratory ambience with subtle electronic equipment hums" for Scientist, "Trendy coffee shop ambience with soft background chatter" for Pop_Culture, "Kitchen ambience with subtle sizzling and utensil sounds" for Chef, and "Urban city ambience with distant traffic and street sounds" for Street_Smart.
3. THE Backend SHALL mix the Soundscape audio into the final MP3 at approximately 15% volume behind the voice segments.
4. THE Frontend SHALL display a Soundscape toggle control on the Waveform_Player that allows the user to enable or disable the ambient Soundscape layer during playback.
5. WHEN a user disables the Soundscape toggle, THE Frontend SHALL mute the Soundscape layer while continuing voice playback uninterrupted.
6. IF the ElevenLabs Sound Effects API returns an error, THEN THE Backend SHALL proceed with Track generation without the Soundscape and log the error.

### Requirement 23: AI-Generated Background Music

**User Story:** As a user, I want a short intro jingle and subtle background music that matches my learning lens, so that the podcast feels polished and professionally produced.

#### Acceptance Criteria

1. WHEN a Script is generated, THE Backend SHALL generate a 10-second Lens_Music intro clip and a 5-second Lens_Music outro clip via the ElevenLabs Music API (client.music.compose) using a music prompt based on the selected Learning_Lens.
2. THE Backend SHALL select the Lens_Music prompt based on the chosen Learning_Lens: "Upbeat chiptune electronic intro, 8-bit inspired, energetic" for Gamer, "Motivational sports broadcast intro, brass and drums" for Coach, "Playful gentle xylophone melody, warm and friendly" for ELI5, "Cinematic orchestral intro, dramatic and engaging" for Storyteller, "Clean minimal electronic ambient, futuristic and precise" for Scientist, "Trendy lo-fi hip hop beat, chill and modern" for Pop_Culture, "Jazzy acoustic guitar intro, warm and inviting" for Chef, and "Urban hip hop beat, confident and smooth" for Street_Smart.
3. WHEN the final audio is assembled, THE Backend SHALL prepend the Lens_Music intro clip before the first voice segment and append the Lens_Music outro clip after the last voice segment.
4. WHILE voice segments are playing, THE Backend SHALL mix the Lens_Music at approximately 10% volume as subtle background music behind the conversation.
5. THE Frontend SHALL display a music toggle control on the Waveform_Player that allows the user to enable or disable the Lens_Music layer during playback.
6. WHEN a user disables the music toggle, THE Frontend SHALL mute the Lens_Music layer while continuing voice playback uninterrupted.
7. IF the ElevenLabs Music API returns an error, THEN THE Backend SHALL proceed with Track generation without the Lens_Music and log the error.

### Requirement 24: Voice Input via Speech-to-Text

**User Story:** As a user, I want to speak my topic instead of typing it, so that I can use Fathom in a natural voice-in voice-out workflow.

#### Acceptance Criteria

1. WHEN a user taps the microphone icon on the Home screen, THE Frontend SHALL begin capturing audio from the device microphone and send the audio to the ElevenLabs Scribe API for transcription.
2. WHILE the microphone is active, THE Frontend SHALL display a pulsing animation on the microphone icon to indicate recording is in progress.
3. WHILE the microphone is active, THE Frontend SHALL populate the textarea with the transcribed text from the Scribe API in real time as words are recognized.
4. WHEN a user taps the stop button, THE Frontend SHALL stop audio capture, finalize the transcription, and display the complete transcribed text in the textarea.
5. IF the device microphone is unavailable or permission is denied, THEN THE Frontend SHALL display a toast notification with a descriptive message indicating microphone access is required.
6. IF the Scribe API returns an error during transcription, THEN THE Frontend SHALL stop recording, display an error toast, and preserve any text already transcribed in the textarea.

### Requirement 25: Lens Audio Previews

**User Story:** As a user, I want to hear a short ambient sound preview when selecting a learning lens, so that I can feel the vibe of each lens before committing to my choice.

#### Acceptance Criteria

1. WHEN the App initializes for the first time, THE Backend SHALL generate a 2-second audio preview for each of the eight Learning_Lens options via the ElevenLabs Sound Effects API (POST /v1/sound-generation) with duration_seconds set to 2 and cache the resulting audio files.
2. WHEN a user selects or hovers over a Learning_Lens card in the Lens Picker dialog, THE Frontend SHALL play the cached 2-second audio preview for that lens.
3. WHEN a user selects or hovers over a different Learning_Lens card while a preview is playing, THE Frontend SHALL stop the current preview and play the newly selected lens preview.
4. IF the cached audio preview for a Learning_Lens is unavailable, THEN THE Frontend SHALL skip preview playback without displaying an error.
5. THE Backend SHALL expose GET /api/lens-previews returning the cached audio preview URLs for all eight Learning_Lens options.
