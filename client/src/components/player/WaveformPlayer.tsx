import { useRef, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Pause, SkipForward, SkipBack } from 'lucide-react';
import { cn } from '@/lib/utils';
import { SPRING_SNAPPY } from '@/lib/motion';
import { useAudioPlayer } from '@/hooks/useAudioPlayer';
import { useStore } from '@/store';
import { getLensMetadata } from '@/lib/lenses';
import { SkeletonWaveform } from '@/components/ui/skeleton';

interface WaveformPlayerProps {
  audioUrl: string;
  onTimeUpdate?: (time: number) => void;
  onFinish?: () => void;
  onPlayStateChange?: (playing: boolean) => void;
  seekRef?: React.MutableRefObject<((time: number) => void) | null>;
  playPauseRef?: React.MutableRefObject<(() => void) | null>;
  pauseRef?: React.MutableRefObject<(() => void) | null>;
  playRef?: React.MutableRefObject<(() => void) | null>;
}

const SPEED_OPTIONS = [0.5, 0.75, 1, 1.25, 1.5, 2];

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

export function WaveformPlayer({
  audioUrl,
  onTimeUpdate,
  onFinish,
  onPlayStateChange,
  seekRef,
  playPauseRef,
  pauseRef,
  playRef,
}: WaveformPlayerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const playbackSpeed = useStore((s) => s.playbackSpeed);
  const currentTrack = useStore((s) => s.currentTrack);
  const [audioError, setAudioError] = useState(false);

  // Get lens accent color
  const lensAccentColor = currentTrack?.lens
    ? getLensMetadata(currentTrack.lens).accentColor
    : '#8B5CF6';

  const {
    isReady,
    isPlaying,
    currentTime,
    duration,
    playPause,
    skipForward,
    skipBackward,
    seekTo,
    play,
    pause,
    setSpeed,
  } = useAudioPlayer({ containerRef, url: audioUrl, lensAccentColor });

  // Expose seekTo to parent via ref
  useEffect(() => {
    if (seekRef) seekRef.current = seekTo;
    return () => { if (seekRef) seekRef.current = null; };
  }, [seekRef, seekTo]);

  // Expose playPause to parent via ref
  useEffect(() => {
    if (playPauseRef) playPauseRef.current = playPause;
    return () => { if (playPauseRef) playPauseRef.current = null; };
  }, [playPauseRef, playPause]);

  // Expose pause/play to parent via refs
  useEffect(() => {
    if (pauseRef) pauseRef.current = pause;
    if (playRef) playRef.current = play;
    return () => {
      if (pauseRef) pauseRef.current = null;
      if (playRef) playRef.current = null;
    };
  }, [pauseRef, playRef, pause, play]);

  // Forward time updates to parent
  useEffect(() => {
    onTimeUpdate?.(currentTime);
  }, [currentTime, onTimeUpdate]);

  // Forward play state changes to parent
  useEffect(() => {
    onPlayStateChange?.(isPlaying);
  }, [isPlaying, onPlayStateChange]);

  // Detect finish (currentTime reaches duration)
  useEffect(() => {
    if (isReady && duration > 0 && !isPlaying && currentTime >= duration - 0.5) {
      onFinish?.();
    }
  }, [isReady, isPlaying, currentTime, duration, onFinish]);

  // Audio error is detected by audio failing to load
  useEffect(() => {
    setAudioError(false);
  }, [audioUrl]);

  if (audioError) {
    return (
      <div className="audio-error-fallback" role="alert">
        ⚠️ Audio could not be loaded. Please try again later.
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Waveform container */}
      <div className="relative">
        {!isReady && !audioError ? (
          <SkeletonWaveform lensAccent={lensAccentColor} />
        ) : null}
        <div
          ref={containerRef}
          className={cn(
            'w-full rounded-lg overflow-hidden bg-[var(--bg-tertiary)] border border-[var(--border-secondary)]',
            'h-20 md:h-[120px]',
            !isReady && !audioError && 'hidden'
          )}
        />
      </div>

      {/* Transport controls */}
      <div className="flex items-center justify-center gap-4">
        <motion.button
          type="button"
          whileHover={{ scale: 1.05, y: -1 }}
          whileTap={{ scale: 0.95 }}
          transition={SPRING_SNAPPY}
          onClick={skipBackward}
          disabled={!isReady}
          aria-label="Skip backward 15 seconds"
          className="flex items-center justify-center w-12 h-12 rounded-[var(--radius-button)] bg-transparent hover:bg-[var(--bg-tertiary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] border border-[var(--border-primary)] transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <SkipBack className="w-5 h-5" strokeWidth={2} />
        </motion.button>

        {/* Morphing play/pause button */}
        <motion.button
          type="button"
          layout
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          transition={SPRING_SNAPPY}
          onClick={playPause}
          disabled={!isReady}
          aria-label={isPlaying ? 'Pause' : 'Play'}
          aria-pressed={isPlaying}
          className="flex items-center justify-center w-14 h-14 rounded-[var(--radius-button)] bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white transition-all duration-200 shadow-lg shadow-[var(--accent)]/20 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <AnimatePresence mode="wait">
            {isPlaying ? (
              <motion.div
                key="pause"
                initial={{ scale: 0, rotate: -90 }}
                animate={{ scale: 1, rotate: 0 }}
                exit={{ scale: 0, rotate: 90 }}
                transition={SPRING_SNAPPY}
              >
                <Pause className="w-6 h-6" strokeWidth={2.5} />
              </motion.div>
            ) : (
              <motion.div
                key="play"
                initial={{ scale: 0, rotate: 90 }}
                animate={{ scale: 1, rotate: 0 }}
                exit={{ scale: 0, rotate: -90 }}
                transition={SPRING_SNAPPY}
              >
                <Play className="w-6 h-6 ml-0.5" strokeWidth={2.5} />
              </motion.div>
            )}
          </AnimatePresence>
        </motion.button>

        <motion.button
          type="button"
          whileHover={{ scale: 1.05, y: -1 }}
          whileTap={{ scale: 0.95 }}
          transition={SPRING_SNAPPY}
          onClick={skipForward}
          disabled={!isReady}
          aria-label="Skip forward 15 seconds"
          className="flex items-center justify-center w-12 h-12 rounded-[var(--radius-button)] bg-transparent hover:bg-[var(--bg-tertiary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] border border-[var(--border-primary)] transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <SkipForward className="w-5 h-5" strokeWidth={2} />
        </motion.button>
      </div>

      {/* Screen reader announcements for state changes */}
      <div role="status" aria-live="polite" className="sr-only">
        {isPlaying && "Audio playing"}
        {!isPlaying && isReady && currentTime > 0 && "Audio paused"}
        {playbackSpeed !== 1 && `Playback speed set to ${playbackSpeed}x`}
      </div>

      {/* Time display + speed selector */}
      <div className="flex items-center justify-between">
        <span className="text-xs text-[var(--text-tertiary)] tabular-nums">
          {formatTime(currentTime)} / {formatTime(duration)}
        </span>

        <div className="flex items-center gap-1.5">
          {SPEED_OPTIONS.map((speed) => (
            <motion.button
              key={speed}
              type="button"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              transition={SPRING_SNAPPY}
              onClick={() => setSpeed(speed)}
              disabled={!isReady}
              aria-label={`Set playback speed to ${speed}x`}
              className={cn(
                'px-3 py-1.5 text-xs font-medium rounded-[var(--radius-button)] transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed',
                playbackSpeed === speed
                  ? 'bg-[var(--accent)] text-white shadow-md shadow-[var(--accent)]/20'
                  : 'bg-transparent text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)]'
              )}
            >
              {speed}x
            </motion.button>
          ))}
        </div>
      </div>
    </div>
  );
}
