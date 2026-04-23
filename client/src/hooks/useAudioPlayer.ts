import { useRef, useEffect, useCallback, useState } from 'react';
import { useStore } from '@/store';

interface UseAudioPlayerOptions {
  containerRef: React.RefObject<HTMLElement | null>;
  url: string | undefined;
}

interface UseAudioPlayerReturn {
  isReady: boolean;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  playPause: () => void;
  play: () => void;
  pause: () => void;
  skipForward: () => void;
  skipBackward: () => void;
  seekTo: (timeSec: number) => void;
  setSpeed: (rate: number) => void;
  waveformHeights: number[];
}

// Generate waveform bar heights using sine wave algorithm (S-tier spec)
function generateWaveformHeights(barCount: number): number[] {
  const baseHeight = 0.3;  // 30% of container
  const amplitude = 0.4;   // 40% variation
  const frequency = 0.1;   // Wave frequency
  
  return Array.from({ length: barCount }, (_, index) => {
    const height = baseHeight + amplitude * Math.sin(index * frequency);
    return Math.max(0.1, Math.min(1, height)); // Clamp between 10% and 100%
  });
}

export function useAudioPlayer({
  containerRef,
  url,
}: UseAudioPlayerOptions): UseAudioPlayerReturn {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [waveformHeights, setWaveformHeights] = useState<number[]>([]);

  const isPlaying = useStore((s) => s.isPlaying);
  const setIsPlaying = useStore((s) => s.setIsPlaying);
  const playbackSpeed = useStore((s) => s.playbackSpeed);

  // Initialize audio element and generate sine wave waveform
  useEffect(() => {
    if (!url) return;

    const audio = new Audio(url);
    audioRef.current = audio;

    // Generate sine wave waveform (S-tier spec)
    const containerWidth = containerRef.current?.clientWidth || 800;
    const barCount = Math.floor(containerWidth / 3); // 2px bar + 1px gap = 3px per bar
    const heights = generateWaveformHeights(barCount);
    setWaveformHeights(heights);

    audio.addEventListener('loadedmetadata', () => {
      setIsReady(true);
      setDuration(audio.duration);
      audio.playbackRate = playbackSpeed;
    });

    audio.addEventListener('timeupdate', () => {
      setCurrentTime(audio.currentTime);
      // Also push to store for MiniPlayer progress
      useStore.getState().setCurrentTime(audio.currentTime);
    });

    audio.addEventListener('play', () => {
      setIsPlaying(true);
    });

    audio.addEventListener('pause', () => {
      setIsPlaying(false);
    });

    audio.addEventListener('ended', () => {
      setIsPlaying(false);
    });

    return () => {
      audio.pause();
      audio.src = '';
      audioRef.current = null;
      setIsReady(false);
      setCurrentTime(0);
      setDuration(0);
      setWaveformHeights([]);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [url, containerRef]);

  // Sync playback speed when it changes in the store
  useEffect(() => {
    const audio = audioRef.current;
    if (audio && isReady) {
      audio.playbackRate = playbackSpeed;
    }
  }, [playbackSpeed, isReady]);

  // Listen for global keyboard shortcut events (Req 8.5, 8.6, 8.7)
  useEffect(() => {
    const handlePlayPause = () => {
      const audio = audioRef.current;
      if (!audio) return;
      if (audio.paused) {
        audio.play();
      } else {
        audio.pause();
      }
    };
    const handleSkipForward = () => {
      const audio = audioRef.current;
      if (!audio) return;
      audio.currentTime = Math.min(audio.currentTime + 15, audio.duration);
    };
    const handleSkipBackward = () => {
      const audio = audioRef.current;
      if (!audio) return;
      audio.currentTime = Math.max(audio.currentTime - 15, 0);
    };

    window.addEventListener('fathom:play-pause', handlePlayPause);
    window.addEventListener('fathom:skip-forward', handleSkipForward);
    window.addEventListener('fathom:skip-backward', handleSkipBackward);
    return () => {
      window.removeEventListener('fathom:play-pause', handlePlayPause);
      window.removeEventListener('fathom:skip-forward', handleSkipForward);
      window.removeEventListener('fathom:skip-backward', handleSkipBackward);
    };
  }, []);

  const playPause = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    if (audio.paused) {
      audio.play();
    } else {
      audio.pause();
    }
  }, []);

  const play = useCallback(() => {
    audioRef.current?.play();
  }, []);

  const pause = useCallback(() => {
    audioRef.current?.pause();
  }, []);

  const skipForward = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.currentTime = Math.min(audio.currentTime + 15, audio.duration);
  }, []);

  const skipBackward = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.currentTime = Math.max(audio.currentTime - 15, 0);
  }, []);

  const seekTo = useCallback((timeSec: number) => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.currentTime = Math.max(0, Math.min(timeSec, audio.duration));
  }, []);

  const setSpeed = useCallback((rate: number) => {
    const store = useStore.getState();
    store.setPlaybackSpeed(rate);
  }, []);

  return {
    isReady,
    isPlaying,
    currentTime,
    duration,
    playPause,
    play,
    pause,
    skipForward,
    skipBackward,
    seekTo,
    setSpeed,
    waveformHeights,
  };
}
