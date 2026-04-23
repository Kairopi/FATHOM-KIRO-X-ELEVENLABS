import { useRef, useEffect, useCallback } from 'react';
import { useStore } from '@/store';
import type { Track } from '@/types';

/** Volume constants per spec */
const SOUNDSCAPE_VOLUME = 0.15;
const MUSIC_VOLUME = 0.10;

type PlaybackPhase = 'idle' | 'intro' | 'main' | 'outro';

interface UseAudioLayersOptions {
  /** The track whose layers to manage */
  track: Track | null;
  /** Whether the main voice track (wavesurfer) is currently playing */
  isVoicePlaying: boolean;
  /** Called when intro finishes so the parent can start the voice track */
  onIntroEnd?: () => void;
  /** Called when outro finishes */
  onOutroEnd?: () => void;
}

interface UseAudioLayersReturn {
  /** Current playback phase */
  phase: PlaybackPhase;
  /** Start the full sequence: intro → main layers → (outro triggered externally) */
  startIntro: () => void;
  /** Start the looping layers (soundscape + bg music) alongside voice */
  startMainLayers: () => void;
  /** Pause all layers */
  pauseLayers: () => void;
  /** Resume looping layers */
  resumeLayers: () => void;
  /** Play the outro music */
  startOutro: () => void;
  /** Stop and reset everything */
  stopAll: () => void;
  /** Soundscape enabled state (from store) */
  soundscapeEnabled: boolean;
  /** Music enabled state (from store) */
  musicEnabled: boolean;
  /** Toggle soundscape on/off */
  toggleSoundscape: () => void;
  /** Toggle music on/off */
  toggleMusic: () => void;
}

export function useAudioLayers({
  track,
  isVoicePlaying,
  onIntroEnd,
  onOutroEnd,
}: UseAudioLayersOptions): UseAudioLayersReturn {
  const soundscapeRef = useRef<HTMLAudioElement | null>(null);
  const bgMusicRef = useRef<HTMLAudioElement | null>(null);
  const introRef = useRef<HTMLAudioElement | null>(null);
  const outroRef = useRef<HTMLAudioElement | null>(null);
  const phaseRef = useRef<PlaybackPhase>('idle');

  const soundscapeEnabled = useStore((s) => s.soundscapeEnabled);
  const musicEnabled = useStore((s) => s.musicEnabled);
  const storeToggleSoundscape = useStore((s) => s.toggleSoundscape);
  const storeToggleMusic = useStore((s) => s.toggleMusic);

  // ── Create / destroy audio elements when track changes ──
  useEffect(() => {
    // Cleanup previous elements
    cleanup();

    if (!track) return;

    // Soundscape layer (Req 22.3: ~15% volume, looped)
    if (track.soundscapeUrl) {
      const el = new Audio(track.soundscapeUrl);
      el.loop = true;
      el.volume = SOUNDSCAPE_VOLUME;
      el.preload = 'auto';
      soundscapeRef.current = el;
    }

    // Background music layer (Req 23.4: 10% volume, looped)
    if (track.introMusicUrl) {
      const el = new Audio(track.introMusicUrl);
      el.loop = true;
      el.volume = MUSIC_VOLUME;
      el.preload = 'auto';
      bgMusicRef.current = el;
    }

    // Intro music (Req 23.3: played before voice)
    if (track.introMusicUrl) {
      const el = new Audio(track.introMusicUrl);
      el.loop = false;
      el.volume = 1.0;
      el.preload = 'auto';
      introRef.current = el;
    }

    // Outro music (Req 23.3: played after voice ends)
    if (track.outroMusicUrl) {
      const el = new Audio(track.outroMusicUrl);
      el.loop = false;
      el.volume = 1.0;
      el.preload = 'auto';
      outroRef.current = el;
    }

    phaseRef.current = 'idle';

    return cleanup;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [track?.id]);

  // ── Sync soundscape enabled state — pause/resume, not just mute ──
  useEffect(() => {
    const el = soundscapeRef.current;
    if (!el) return;
    if (phaseRef.current !== 'main') return;
    if (soundscapeEnabled) {
      el.muted = false;
      safePlay(el);
    } else {
      safePause(el);
    }
  }, [soundscapeEnabled]);

  // ── Sync music enabled state — pause/resume, not just mute ──
  useEffect(() => {
    const bgEl = bgMusicRef.current;
    if (bgEl) {
      if (phaseRef.current === 'main') {
        if (musicEnabled) { bgEl.muted = false; safePlay(bgEl); }
        else { safePause(bgEl); }
      }
    }

    const introEl = introRef.current;
    if (introEl) introEl.muted = !musicEnabled;

    const outroEl = outroRef.current;
    if (outroEl) outroEl.muted = !musicEnabled;
  }, [musicEnabled]);

  // ── Pause/resume looping layers when voice play state changes ──
  useEffect(() => {
    if (phaseRef.current !== 'main') return;
    const store = useStore.getState();

    if (isVoicePlaying) {
      if (store.soundscapeEnabled) safePlay(soundscapeRef.current);
      if (store.musicEnabled) safePlay(bgMusicRef.current);
    } else {
      safePause(soundscapeRef.current);
      safePause(bgMusicRef.current);
    }
  }, [isVoicePlaying]);

  // ── Helpers ──
  function cleanup() {
    [soundscapeRef, bgMusicRef, introRef, outroRef].forEach((ref) => {
      const el = ref.current;
      if (el) {
        el.pause();
        el.removeAttribute('src');
        el.load();
        ref.current = null;
      }
    });
    phaseRef.current = 'idle';
  }

  /**
   * Start the full playback sequence.
   * If intro music exists, play it first then call onIntroEnd.
   * If no intro music (Req 23.6), skip straight to main layers.
   */
  const startIntro = useCallback(() => {
    const introEl = introRef.current;

    if (introEl) {
      phaseRef.current = 'intro';
      introEl.currentTime = 0;

      const handleEnded = () => {
        introEl.removeEventListener('ended', handleEnded);
        phaseRef.current = 'idle';
        onIntroEnd?.();
      };
      introEl.addEventListener('ended', handleEnded);
      safePlay(introEl);
    } else {
      // No intro music — skip directly (Req 23.6)
      onIntroEnd?.();
    }
  }, [onIntroEnd]);

  /**
   * Start the looping background layers (soundscape + bg music)
   * alongside the voice track.
   */
  const startMainLayers = useCallback(() => {
    phaseRef.current = 'main';
    const store = useStore.getState();

    const scEl = soundscapeRef.current;
    if (scEl && store.soundscapeEnabled) {
      scEl.currentTime = 0;
      scEl.muted = false;
      safePlay(scEl);
    }

    const bgEl = bgMusicRef.current;
    if (bgEl && store.musicEnabled) {
      bgEl.currentTime = 0;
      bgEl.muted = false;
      safePlay(bgEl);
    }
  }, []);

  /** Pause looping layers (e.g. when voice is paused) */
  const pauseLayers = useCallback(() => {
    safePause(soundscapeRef.current);
    safePause(bgMusicRef.current);
  }, []);

  /** Resume looping layers */
  const resumeLayers = useCallback(() => {
    if (phaseRef.current !== 'main') return;
    safePlay(soundscapeRef.current);
    safePlay(bgMusicRef.current);
  }, []);

  /** Play outro music after voice track ends (Req 23.3) */
  const startOutro = useCallback(() => {
    // Stop looping layers
    safePause(soundscapeRef.current);
    safePause(bgMusicRef.current);

    const outroEl = outroRef.current;
    if (outroEl) {
      phaseRef.current = 'outro';
      outroEl.currentTime = 0;

      const handleEnded = () => {
        outroEl.removeEventListener('ended', handleEnded);
        phaseRef.current = 'idle';
        onOutroEnd?.();
      };
      outroEl.addEventListener('ended', handleEnded);
      safePlay(outroEl);
    } else {
      // No outro music (Req 23.6)
      phaseRef.current = 'idle';
      onOutroEnd?.();
    }
  }, [onOutroEnd]);

  /** Stop and reset all layers */
  const stopAll = useCallback(() => {
    [soundscapeRef, bgMusicRef, introRef, outroRef].forEach((ref) => {
      const el = ref.current;
      if (el) {
        el.pause();
        el.currentTime = 0;
      }
    });
    phaseRef.current = 'idle';
  }, []);

  return {
    phase: phaseRef.current,
    startIntro,
    startMainLayers,
    pauseLayers,
    resumeLayers,
    startOutro,
    stopAll,
    soundscapeEnabled,
    musicEnabled,
    toggleSoundscape: storeToggleSoundscape,
    toggleMusic: storeToggleMusic,
  };
}

// ── Safe play/pause helpers (handle browser autoplay restrictions) ──

function safePlay(el: HTMLAudioElement | null) {
  if (!el) return;
  el.play().catch(() => {
    // Autoplay blocked — silently ignore; user interaction will resume
  });
}

function safePause(el: HTMLAudioElement | null) {
  if (!el || el.paused) return;
  el.pause();
}
