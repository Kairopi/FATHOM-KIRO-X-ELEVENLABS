import { useRef, useEffect, useCallback, useState } from 'react';
import WaveSurfer from 'wavesurfer.js';
import { useStore } from '@/store';

interface UseAudioPlayerOptions {
  containerRef: React.RefObject<HTMLElement | null>;
  url: string | undefined;
  lensAccentColor?: string;
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
}

export function useAudioPlayer({
  containerRef,
  url,
  lensAccentColor = '#8B5CF6',
}: UseAudioPlayerOptions): UseAudioPlayerReturn {
  const wavesurferRef = useRef<WaveSurfer | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  const isPlaying = useStore((s) => s.isPlaying);
  const setIsPlaying = useStore((s) => s.setIsPlaying);
  const playbackSpeed = useStore((s) => s.playbackSpeed);

  // Initialize WaveSurfer
  useEffect(() => {
    if (!containerRef.current || !url) return;

    // Clean up any existing instance first
    if (wavesurferRef.current) {
      wavesurferRef.current.destroy();
      wavesurferRef.current = null;
    }

    const ws = WaveSurfer.create({
      container: containerRef.current,
      waveColor: `${lensAccentColor}40`, // 25% opacity
      progressColor: lensAccentColor,
      cursorColor: lensAccentColor,
      barWidth: 2,
      barGap: 1,
      barRadius: 2,
      height: 120,
      normalize: true,
      backend: 'WebAudio',
    });

    wavesurferRef.current = ws;

    ws.load(url);

    ws.on('ready', () => {
      setIsReady(true);
      setDuration(ws.getDuration());
      ws.setPlaybackRate(playbackSpeed);
    });

    ws.on('audioprocess', () => {
      setCurrentTime(ws.getCurrentTime());
      // Also push to store for MiniPlayer progress
      useStore.getState().setCurrentTime(ws.getCurrentTime());
    });

    ws.on('play', () => {
      setIsPlaying(true);
    });

    ws.on('pause', () => {
      setIsPlaying(false);
    });

    ws.on('finish', () => {
      setIsPlaying(false);
    });

    return () => {
      ws.destroy();
      wavesurferRef.current = null;
      setIsReady(false);
      setCurrentTime(0);
      setDuration(0);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [url, containerRef, lensAccentColor]);

  // Sync playback speed when it changes in the store
  useEffect(() => {
    const ws = wavesurferRef.current;
    if (ws && isReady) {
      ws.setPlaybackRate(playbackSpeed);
    }
  }, [playbackSpeed, isReady]);

  // CRITICAL: Sync WaveSurfer with store's isPlaying state
  // This ensures external play/pause commands (from MiniPlayer) work correctly
  useEffect(() => {
    const ws = wavesurferRef.current;
    if (!ws || !isReady) return;

    const wsIsPlaying = ws.isPlaying();
    
    // If store says play but WaveSurfer is paused, play it
    if (isPlaying && !wsIsPlaying) {
      ws.play();
    }
    // If store says pause but WaveSurfer is playing, pause it
    else if (!isPlaying && wsIsPlaying) {
      ws.pause();
    }
  }, [isPlaying, isReady]);

  // Listen for global keyboard shortcut events
  useEffect(() => {
    const handlePlayPause = () => {
      wavesurferRef.current?.playPause();
    };
    const handleSkipForward = () => {
      const ws = wavesurferRef.current;
      if (!ws) return;
      ws.setTime(Math.min(ws.getCurrentTime() + 15, ws.getDuration()));
    };
    const handleSkipBackward = () => {
      const ws = wavesurferRef.current;
      if (!ws) return;
      ws.setTime(Math.max(ws.getCurrentTime() - 15, 0));
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
    wavesurferRef.current?.playPause();
  }, []);

  const play = useCallback(() => {
    wavesurferRef.current?.play();
  }, []);

  const pause = useCallback(() => {
    wavesurferRef.current?.pause();
  }, []);

  const skipForward = useCallback(() => {
    const ws = wavesurferRef.current;
    if (!ws) return;
    ws.setTime(Math.min(ws.getCurrentTime() + 15, ws.getDuration()));
  }, []);

  const skipBackward = useCallback(() => {
    const ws = wavesurferRef.current;
    if (!ws) return;
    ws.setTime(Math.max(ws.getCurrentTime() - 15, 0));
  }, []);

  const seekTo = useCallback((timeSec: number) => {
    const ws = wavesurferRef.current;
    if (!ws) return;
    ws.setTime(Math.max(0, Math.min(timeSec, ws.getDuration())));
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
  };
}
