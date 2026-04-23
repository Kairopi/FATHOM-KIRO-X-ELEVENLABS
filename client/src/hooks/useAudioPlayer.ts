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

  // Initialize Wavesurfer instance
  useEffect(() => {
    if (!containerRef.current || !url) return;

    // Determine height based on screen size
    const isMobile = window.innerWidth < 768;
    const height = isMobile ? 80 : 120;

    const ws = WaveSurfer.create({
      container: containerRef.current,
      url,
      waveColor: `${lensAccentColor}40`, // 25% opacity for unplayed
      progressColor: lensAccentColor, // Full color for played
      cursorColor: lensAccentColor,
      cursorWidth: 3,
      barWidth: 2,
      barGap: 1,
      barRadius: 0,
      height,
      normalize: true,
      interact: true,
    });

    wavesurferRef.current = ws;

    ws.on('ready', () => {
      setIsReady(true);
      setDuration(ws.getDuration());
      ws.setPlaybackRate(playbackSpeed, true);
    });

    ws.on('timeupdate', (time: number) => {
      setCurrentTime(time);
      // Also push to store for MiniPlayer progress
      useStore.getState().setCurrentTime(time);
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
      ws.setPlaybackRate(playbackSpeed, true);
    }
  }, [playbackSpeed, isReady]);

  // Listen for global keyboard shortcut events (Req 8.5, 8.6, 8.7)
  useEffect(() => {
    const handlePlayPause = () => {
      wavesurferRef.current?.playPause();
    };
    const handleSkipForward = () => {
      const ws = wavesurferRef.current;
      if (!ws) return;
      const target = Math.min(ws.getCurrentTime() + 15, ws.getDuration());
      ws.setTime(target);
    };
    const handleSkipBackward = () => {
      const ws = wavesurferRef.current;
      if (!ws) return;
      const target = Math.max(ws.getCurrentTime() - 15, 0);
      ws.setTime(target);
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
    const target = Math.min(ws.getCurrentTime() + 15, ws.getDuration());
    ws.setTime(target);
  }, []);

  const skipBackward = useCallback(() => {
    const ws = wavesurferRef.current;
    if (!ws) return;
    const target = Math.max(ws.getCurrentTime() - 15, 0);
    ws.setTime(target);
  }, []);

  const seekTo = useCallback((timeSec: number) => {
    const ws = wavesurferRef.current;
    if (!ws) return;
    const clamped = Math.max(0, Math.min(timeSec, ws.getDuration()));
    ws.setTime(clamped);
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
