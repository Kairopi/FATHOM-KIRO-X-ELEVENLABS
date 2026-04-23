# Fathom

Hyper-personalized audio learning engine powered by ElevenLabs.

Fathom transforms any content into engaging, personalized audio experiences. Choose from different learning lenses (perspectives) and voices to make learning more accessible and enjoyable.

## Features

- Multiple Learning Lenses: Chef, Coach, ELI5, Gamer, Pop Culture, Scientist, Storyteller, and Street Smart perspectives
- Voice Selection: Choose from multiple AI voices (Aria, Kai, Luna)
- Layered Audio: Background music and soundscapes for immersive learning
- Personal Library: Save and organize your generated audio tracks
- Modern UI: Responsive interface built with React and Tailwind CSS
- Interactive Player: Waveform visualization, playback controls, and transcript view
- Content Scraping: Generate audio from URLs or paste your own content
- Voice Input: Speak your content instead of typing

## Quick Start

### Prerequisites

- Node.js (v18 or higher)
- npm or yarn
- ElevenLabs API key (Get one at elevenlabs.io)
- DashScope API key (for content processing)

### Installation

1. Clone the repository
   ```bash
   git clone https://github.com/Kairopi/FATHOM-KIRO-X-ELEVENLABS.git
   cd FATHOM-KIRO-X-ELEVENLABS
   ```

2. Install dependencies
   ```bash
   npm run install:all
   ```

3. Set up environment variables
   
   Copy the example environment file:
   ```bash
   cp .env.example .env
   ```
   
   Edit .env and add your API keys:
   ```env
   ELEVENLABS_API_KEY=your_elevenlabs_api_key_here
   DASHSCOPE_API_KEY=your_dashscope_api_key_here
   ```

4. Start the development server
   ```bash
   npm run dev
   ```

   This will start both the client (Vite) and server (Express) concurrently.

5. Open your browser
   
   Navigate to http://localhost:5173 or the port shown in your terminal.

## Project Structure

```
fathom/
├── client/                 # React frontend (Vite + TypeScript)
│   ├── src/
│   │   ├── components/    # UI components
│   │   ├── screens/       # Page components
│   │   ├── hooks/         # Custom React hooks
│   │   ├── lib/           # Utilities and helpers
│   │   ├── store/         # Zustand state management
│   │   └── types/         # TypeScript type definitions
│   └── public/            # Static assets
│
├── server/                # Express backend (Node.js + TypeScript)
│   ├── routes/           # API endpoints
│   ├── services/         # External service integrations
│   ├── db/               # Database (SQLite)
│   ├── config/           # Configuration files
│   └── __tests__/        # Test files
│
└── public/audio/         # Generated audio files
    ├── tracks/           # User-generated tracks
    ├── music/            # Background music
    ├── soundscapes/      # Ambient sounds
    └── previews/         # Voice and lens previews
```

## Available Scripts

### Root Level
- npm run dev: Start both client and server in development mode
- npm run dev:client: Start only the client
- npm run dev:server: Start only the server
- npm run build: Build the client for production
- npm run start: Start the production server
- npm run install:all: Install all dependencies (root, client, server)

### Client
- npm run dev --prefix client: Start Vite dev server
- npm run build --prefix client: Build for production
- npm run preview --prefix client: Preview production build

### Server
- npm run dev --prefix server: Start server with hot reload
- npm run build --prefix server: Compile TypeScript
- npm run test --prefix server: Run tests
- npm run start --prefix server: Start compiled server

## Tech Stack

### Frontend
- React 18: UI framework
- TypeScript: Type safety
- Vite: Build tool and dev server
- Tailwind CSS: Styling
- Framer Motion: Animations
- Zustand: State management
- React Router: Navigation
- WaveSurfer.js: Audio waveform visualization
- Lucide React: Icons

### Backend
- Express: Web framework
- TypeScript: Type safety
- SQLite: Database
- ElevenLabs SDK: Text-to-speech
- OpenAI: Content processing
- Vitest: Testing framework

## API Keys

### ElevenLabs API Key
1. Sign up at elevenlabs.io
2. Navigate to your profile settings
3. Copy your API key
4. Add it to your .env file

### DashScope API Key
1. Sign up at DashScope (dashscope.aliyun.com)
2. Get your API key from the dashboard
3. Add it to your .env file

## How It Works

1. Input Content: Paste text, enter a URL, or use voice input
2. Choose a Lens: Select how you want the content explained (e.g., like a chef, scientist, or storyteller)
3. Select a Voice: Pick your preferred AI voice
4. Generate: Fathom processes your content and generates personalized audio
5. Listen and Learn: Play your audio with optional background music and soundscapes
6. Save to Library: Access your tracks anytime from your personal library

## Testing

Run the test suite:

```bash
npm run test --prefix server
```

Tests include:
- Generate button functionality
- Guest signup flow
- Lens configuration
- Library search and filtering
- Malformed request handling
- Sharing functionality
- Track record management

## Contributing

Contributions are welcome. Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (git checkout -b feature/AmazingFeature)
3. Commit your changes (git commit -m 'Add some AmazingFeature')
4. Push to the branch (git push origin feature/AmazingFeature)
5. Open a Pull Request

## License

This project is private and proprietary.

## Acknowledgments

- ElevenLabs for the text-to-speech API
- Kiro AI for development assistance

## Contact

For questions or support, please open an issue on GitHub.

## Security Note

Never commit your .env file. It contains sensitive API keys. The .env file is already in .gitignore to prevent accidental commits.
