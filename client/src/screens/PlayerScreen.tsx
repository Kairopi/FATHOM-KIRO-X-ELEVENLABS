import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Loader2, Play, Pause, Share2, Clock } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { api } from '@/lib/api';
import { getLensMetadata } from '@/lib/lenses';
import { LensIcon } from '@/components/ui/LensIcon';
import { SPRING_SNAPPY } from '@/lib/motion';
import { useStore } from '@/store';
import { useAudioLayers } from '@/hooks/useAudioLayers';
import { WaveformPlayer } from '@/components/player/WaveformPlayer';
import { SoundscapeToggle } from '@/components/player/SoundscapeToggle';
import { MusicToggle } from '@/components/player/MusicToggle';
import { HoldOnButton } from '@/components/player/HoldOnButton';
import { TranscriptView } from '@/components/player/TranscriptView';
import { PostListenActions } from '@/components/player/PostListenActions';
import type { Track } from '@/types';

type Tab = 'player' | 'transcript' | 'info';

const TABS: { key: Tab; label: string }[] = [
  { key: 'player', label: 'Player' },
  { key: 'transcript', label: 'Transcript' },
  { key: 'info', label: 'Info' },
];

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
}

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export function PlayerScreen() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const setTrack = useStore((s) => s.setTrack);

  const [track, setLocalTrack] = useState<Track | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>('player');
  const [currentTime, setCurrentTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isFinished, setIsFinished] = useState(false);
  const finishedRef = useRef(false);
  const seekRef = useRef<((time: number) => void) | null>(null);
  const playPauseRef = useRef<(() => void) | null>(null);
  const pauseRef = useRef<(() => void) | null>(null);
  const playRef = useRef<(() => void) | null>(null);

  const { startMainLayers, startOutro } = useAudioLayers({
    track,
    isVoicePlaying: isPlaying,
    onOutroEnd: () => {},
  });

  useEffect(() => {
    if (isPlaying) startMainLayers();
  }, [isPlaying, startMainLayers]);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    setNotFound(false);
    api.get<Track>(`/api/tracks/${id}`)
      .then((data) => { setLocalTrack(data); setTrack(data); })
      .catch((err) => {
        console.error('[PlayerScreen] Failed to load track:', err);
        setNotFound(true);
      })
      .finally(() => setLoading(false));
  }, [id, setTrack]);

  const handleTimeUpdate = useCallback((t: number) => setCurrentTime(t), []);
  const handlePlayStateChange = useCallback((p: boolean) => setIsPlaying(p), []);
  const handleFinish = useCallback(() => {
    if (finishedRef.current) return;
    finishedRef.current = true;
    setIsFinished(true);
    startOutro();
  }, [startOutro]);
  const handleSeek = useCallback((t: number) => seekRef.current?.(t), []);
  const handlePause = useCallback(() => {
    pauseRef.current?.();
  }, []);

  const handleResume = useCallback(() => {
    playRef.current?.();
  }, []);

  const handleShare = useCallback(async () => {
    if (!track) return;
    const url = `${window.location.origin}/share/${track.shareId}`;
    await navigator.clipboard.writeText(url);
    toast.success('Share link copied!');
  }, [track]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="w-6 h-6 animate-spin text-[var(--accent)]" />
      </div>
    );
  }

  if (notFound || !track) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-24">
        <p className="text-sm text-[var(--text-secondary)]">Track not found</p>
        <motion.button type="button" 
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          transition={SPRING_SNAPPY}
          onClick={() => navigate('/')}
          className="px-4 py-2 text-sm bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white rounded-full transition-colors">
          Go Home
        </motion.button>
      </div>
    );
  }

  const lensMeta = getLensMetadata(track.lens);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4, ease: [0.25, 0.1, 0.25, 1.0] }}
      className="flex flex-col gap-5 py-2 relative">

      {/* Lens wash */}
      <motion.div className="fixed inset-0 pointer-events-none z-0"
        animate={{ backgroundColor: `${lensMeta.accentColor}06` }}
        transition={{ duration: 0.8, ease: 'easeInOut' }} />

      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: 'easeOut' }} className="flex items-center gap-4">
        <div className="shrink-0 w-14 h-14 rounded-xl flex items-center justify-center"
          style={{ backgroundColor: `${lensMeta.accentColor}1A` }}>
          <LensIcon iconName={lensMeta.icon} size={24} strokeWidth={1.75} color={lensMeta.accentColor} />
        </div>
        <div className="flex-1 min-w-0">
          <h1 className="text-lg font-semibold text-[var(--text-primary)] truncate" style={{ letterSpacing: '-0.02em' }}>
            {track.title}
          </h1>
          <div className="flex items-center gap-3 mt-0.5">
            <span className="text-xs font-medium" style={{ color: lensMeta.accentColor }}>{lensMeta.name}</span>
            <span className="text-xs text-[var(--text-muted)] flex items-center gap-1">
              <Clock className="w-3 h-3" strokeWidth={2} />
              {formatDuration(track.duration)}
            </span>
          </div>
        </div>
        <motion.button type="button" whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
          transition={SPRING_SNAPPY} onClick={handleShare} aria-label="Share track"
          className="shrink-0 min-w-[48px] min-h-[48px] sm:w-10 sm:h-10 flex items-center justify-center rounded-full hover:bg-[var(--bg-tertiary)] text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] transition-colors">
          <Share2 className="w-4 h-4" strokeWidth={2} />
        </motion.button>
      </motion.div>

      {/* === WaveformPlayer — ALWAYS MOUNTED so audio never stops === */}
      <div className={cn(activeTab !== 'player' && 'hidden')}>
        <WaveformPlayer
          audioUrl={track.audioUrl}
          onTimeUpdate={handleTimeUpdate}
          onFinish={handleFinish}
          onPlayStateChange={handlePlayStateChange}
          seekRef={seekRef}
          playPauseRef={playPauseRef}
          pauseRef={pauseRef}
          playRef={playRef}
        />
      </div>

      {/* Compact inline player bar — shown on Transcript/Info tabs */}
      {activeTab !== 'player' && (
        <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-3 px-4 py-2.5 rounded-xl border border-[var(--border-primary)] bg-[var(--bg-secondary)]">
          <motion.button type="button" whileTap={{ scale: 0.95 }} transition={SPRING_SNAPPY}
            onClick={() => playPauseRef.current?.()}
            aria-label={isPlaying ? 'Pause' : 'Play'}
            className="shrink-0 min-w-[48px] min-h-[48px] sm:w-9 sm:h-9 flex items-center justify-center rounded-full text-white"
            style={{ backgroundColor: lensMeta.accentColor }}>
            {isPlaying
              ? <Pause className="w-4 h-4" strokeWidth={2.5} />
              : <Play className="w-4 h-4 ml-0.5" strokeWidth={2.5} />}
          </motion.button>
          {/* Progress bar */}
          <div className="flex-1 h-1 rounded-full bg-[var(--bg-tertiary)] overflow-hidden">
            <motion.div className="h-full rounded-full"
              style={{ backgroundColor: lensMeta.accentColor, width: track.duration > 0 ? `${(currentTime / track.duration) * 100}%` : '0%' }}
              transition={{ duration: 0.1 }} />
          </div>
          <span className="text-[11px] text-[var(--text-tertiary)] tabular-nums shrink-0">
            {formatDuration(currentTime)}
          </span>
        </motion.div>
      )}

      {/* Toggles + Hold On — shown on Player tab */}
      {activeTab === 'player' && (
        <div className="flex flex-col gap-5">
          <div className="flex items-center gap-2">
            <SoundscapeToggle />
            <MusicToggle />
          </div>
          <div className="flex justify-center">
            <HoldOnButton trackId={track.id} currentTime={currentTime}
              isPlaying={isPlaying} onPause={handlePause} onResume={handleResume} />
          </div>
          <PostListenActions track={track} isFinished={isFinished} />
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-0 border-b border-[var(--border-primary)]" role="tablist" aria-label="Player tabs">
        {TABS.map(({ key, label }) => (
          <motion.button key={key} type="button" 
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            transition={SPRING_SNAPPY}
            onClick={() => setActiveTab(key)}
            id={`tab-${key}`}
            aria-selected={activeTab === key} 
            aria-controls={`tabpanel-${key}`}
            role="tab"
            className={cn(
              'px-5 min-h-[48px] sm:py-2.5 text-sm font-medium transition-all duration-300 relative flex items-center',
              'focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--border-focus)]',
              activeTab === key ? 'text-[var(--text-primary)]' : 'text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]'
            )}>
            {label}
            {activeTab === key && (
              <motion.div layoutId="tab-indicator" className="absolute bottom-0 left-0 right-0 h-0.5 rounded-full"
                style={{ backgroundColor: lensMeta.accentColor }}
                transition={{ type: 'spring', stiffness: 260, damping: 30 }} />
            )}
          </motion.button>
        ))}
      </div>

      {/* Screen reader announcements */}
      <div role="status" aria-live="polite" className="sr-only">
        {isPlaying ? 'Playing' : 'Paused'}
      </div>
      <div role="status" aria-live="polite" className="sr-only">
        {activeTab === 'player' && 'Player tab selected'}
        {activeTab === 'transcript' && 'Transcript tab selected'}
        {activeTab === 'info' && 'Info tab selected'}
      </div>

      {/* Tab content */}
      <AnimatePresence mode="wait">
        {activeTab === 'transcript' && (
          <motion.div key="transcript" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.35, ease: [0.25, 0.1, 0.25, 1.0] }}
            role="tabpanel" 
            id="tabpanel-transcript"
            aria-labelledby="tab-transcript">
            <TranscriptView transcript={track.transcript} currentTime={currentTime} onSeek={handleSeek} />
          </motion.div>
        )}

        {activeTab === 'info' && (
          <motion.div key="info" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.35, ease: [0.25, 0.1, 0.25, 1.0] }}
            role="tabpanel" 
            id="tabpanel-info"
            aria-labelledby="tab-info"
            className="flex flex-col gap-5 p-5 bg-[var(--bg-secondary)] rounded-xl border border-[var(--border-primary)]">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg flex items-center justify-center"
                style={{ backgroundColor: `${lensMeta.accentColor}1A` }}>
                <LensIcon iconName={lensMeta.icon} size={20} strokeWidth={1.75} color={lensMeta.accentColor} />
              </div>
              <div>
                <span className="text-sm font-semibold" style={{ color: lensMeta.accentColor }}>{lensMeta.name} Lens</span>
                <p className="text-xs text-[var(--text-tertiary)]">{formatDate(track.createdAt)}</p>
              </div>
            </div>
            <div className="h-px bg-[var(--border-secondary)]" />
            <div className="grid grid-cols-3 gap-4">
              {[
                { label: 'Duration', value: formatDuration(track.duration) },
                { label: 'Segments', value: `${track.transcript.length}` },
                { label: 'Created', value: formatDate(track.createdAt) },
              ].map(({ label, value }) => (
                <div key={label} className="flex flex-col gap-0.5">
                  <span className="text-[10px] uppercase font-medium text-[var(--text-muted)] tracking-wider">{label}</span>
                  <span className="text-sm text-[var(--text-primary)] font-medium">{value}</span>
                </div>
              ))}
            </div>
            <div className="h-px bg-[var(--border-secondary)]" />
            <div>
              <span className="text-[10px] uppercase font-medium text-[var(--text-muted)] tracking-wider">Source</span>
              <p className="mt-1.5 text-sm text-[var(--text-secondary)] leading-relaxed">
                {track.sourceText.length > 400 ? `${track.sourceText.slice(0, 400)}…` : track.sourceText}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
