import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { LearningLens, VoicePair, Track } from '@/types';

interface User {
  id: string;
  displayName: string;
}

const DEFAULT_VOICE_PAIR: VoicePair = {
  explainer: { voiceId: 'marcus', name: 'Marcus' },
  learner: { voiceId: 'aria', name: 'Aria' },
};

interface AppState {
  // Auth slice
  user: User | null;
  setUser: (user: User) => void;
  logout: () => void;

  // Generation slice
  content: string;
  setContent: (content: string) => void;
  selectedLens: LearningLens | null;
  setSelectedLens: (lens: LearningLens | null) => void;
  voicePair: VoicePair;
  setVoicePair: (pair: VoicePair) => void;
  isGenerating: boolean;
  setIsGenerating: (v: boolean) => void;
  generationPhase: string;
  setGenerationPhase: (phase: string) => void;
  spokenInput: string | null;
  setSpokenInput: (text: string | null) => void;

  // Navigation flags
  lensPickerOpen: boolean;
  setLensPickerOpen: (open: boolean) => void;

  // Player slice
  currentTrack: Track | null;
  setTrack: (track: Track | null) => void;
  isPlaying: boolean;
  setIsPlaying: (v: boolean) => void;
  currentTime: number;
  setCurrentTime: (t: number) => void;
  soundscapeEnabled: boolean;
  toggleSoundscape: () => void;
  musicEnabled: boolean;
  toggleMusic: () => void;
  playbackSpeed: number;
  setPlaybackSpeed: (speed: number) => void;

  // Library slice
  tracks: Track[];
  setTracks: (tracks: Track[]) => void;

  // Settings slice
  defaults: { lens: LearningLens | null; voicePair: VoicePair };
  setDefaultLens: (lens: LearningLens | null) => void;
  setDefaultVoicePair: (pair: VoicePair) => void;
  customVoiceNames: Record<string, string>; // voiceId → custom display name
  setCustomVoiceName: (voiceId: string, name: string) => void;
}

export const useStore = create<AppState>()(
  persist(
    (set) => ({
      // Auth
      user: null,
      setUser: (user) => set({ user }),
      logout: () => {
        set({ user: null });
        localStorage.removeItem('fathom-storage');
      },

      // Generation
      content: '',
      setContent: (content) => set({ content }),
      selectedLens: null,
      setSelectedLens: (selectedLens) => set({ selectedLens }),
      voicePair: DEFAULT_VOICE_PAIR,
      setVoicePair: (voicePair) => set({ voicePair }),
      isGenerating: false,
      setIsGenerating: (isGenerating) => set({ isGenerating }),
      generationPhase: '',
      setGenerationPhase: (generationPhase) => set({ generationPhase }),
      spokenInput: null,
      setSpokenInput: (spokenInput) => set({ spokenInput }),

      // Navigation flags
      lensPickerOpen: false,
      setLensPickerOpen: (lensPickerOpen) => set({ lensPickerOpen }),

      // Player
      currentTrack: null,
      setTrack: (currentTrack) => set({ currentTrack }),
      isPlaying: false,
      setIsPlaying: (isPlaying) => set({ isPlaying }),
      currentTime: 0,
      setCurrentTime: (currentTime) => set({ currentTime }),
      soundscapeEnabled: true,
      toggleSoundscape: () => set((s) => ({ soundscapeEnabled: !s.soundscapeEnabled })),
      musicEnabled: true,
      toggleMusic: () => set((s) => ({ musicEnabled: !s.musicEnabled })),
      playbackSpeed: 1.0,
      setPlaybackSpeed: (playbackSpeed) => set({ playbackSpeed }),

      // Library
      tracks: [],
      setTracks: (tracks) => set({ tracks }),

      // Settings
      defaults: { lens: null, voicePair: DEFAULT_VOICE_PAIR },
      setDefaultLens: (lens) => set((s) => ({ defaults: { ...s.defaults, lens } })),
      setDefaultVoicePair: (voicePair) => set((s) => ({ defaults: { ...s.defaults, voicePair } })),
      customVoiceNames: {},
      setCustomVoiceName: (voiceId, name) => set((s) => ({
        customVoiceNames: { ...s.customVoiceNames, [voiceId]: name },
      })),
    }),
    {
      name: 'fathom-storage',
      partialize: (state) => ({
        user: state.user,
        defaults: state.defaults,
        customVoiceNames: state.customVoiceNames,
        playbackSpeed: state.playbackSpeed,
      }),
    }
  )
);
