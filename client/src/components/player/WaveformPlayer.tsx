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
  const waveformContainerRef = useRef<HTMLDivElement>(null);
  const playbackSpeed = useStore((s) => s.playbackSpeed);
  const currentTrack = useStore((s) => s.currentTrack);
  const [audioError, setAudioError] = useState(false);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, time: 0 });

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

  // Audio error is detected by WaveSurfer failing to load
  useEffect(() => {
    setAudioError(false);
  }, [audioUrl]);

  // Handle hover on waveform for tooltip
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!waveformContainerRef.current || !duration) return;
    const rect = waveformContainerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = x / rect.width;
    const time = percentage * duration;
    const barIndex = Math.floor(x / 3); // 2px bar + 1px gap
    setHoveredIndex(barIndex);
    setTooltipPosition({ x, time });
  };

  const handleMouseLeave = () => {
    setHoveredIndex(null);
  };

  if (audioError) {
    return (
      <div className="audio-error-fallback" role="alert">
        ⚠️ Audio could not be loaded. Please try again later.
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Waveform container with hover tooltip */}
      <div
        ref={waveformContainerRef}
        className="relative"
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
      >
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

        {/* Scrubbing tooltip with mini waveform */}
        {hoveredIndex !== null && isReady && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.15 }}
            className="absolute bottom-full mb-2 px-2 py-1.5 bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded text-xs pointer-events-none z-10"
            style={{
              left: `${tooltipPosition.x}px`,
              transform: 'translateX(-50%)',
            }}
          >
            <span className="text-[var(--text-primary)] font-medium tabular-nums">
              {formatTime(tooltipPosition.time)}
            </span>
            {/* Mini 3-bar waveform preview */}
            <div className="flex gap-[1px] mt-1 justify-center">
              {[0.6, 1, 0.8].map((h, i) => (
                <div
                  key={i}
                  style={{
                    width: '2px',
                    height: `${h * 12}px`,
                    backgroundColor: lensAccentColor,
                  }}
                />
              ))}
            </div>
          </motion.div>
        )}
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
          whileHover={{ scale: 1.08, boxShadow: '0 8px 16px rgba(139, 92, 246, 0.3)' }}
          whileTap={{ scale: 0.95 }}
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
              whileHover={{ scale: 1.08, y: -1 }}
              whileTap={{ scale: 0.95 }}
              transition={SPRING_SNAPPY}
              onClick={() => setSpeed(speed)}
              aria-label={`Set playback speed to ${speed}x`}
              className={cn(
                'px-3 py-1.5 text-xs font-medium rounded-[var(--radius-button)] transition-all duration-200',
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
