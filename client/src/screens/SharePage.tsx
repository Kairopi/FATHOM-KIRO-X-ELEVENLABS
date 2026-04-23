import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { Loader2, Share2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getLensMetadata } from '@/lib/lenses';
import { LensIcon } from '@/components/ui/LensIcon';
import { SPRING_SNAPPY, SPRING_GENTLE } from '@/lib/motion';
import { WaveformPlayer } from '@/components/player/WaveformPlayer';
import { TranscriptView } from '@/components/player/TranscriptView';
import type { LearningLens, TranscriptSegment } from '@/types';

interface SharedTrack {
  id: string;
  title: string;
  lens: LearningLens;
  transcript: TranscriptSegment[];
  audioUrl: string;
  duration: number;
  soundscapeUrl: string | null;
  introMusicUrl: string | null;
  outroMusicUrl: string | null;
}

type Tab = 'player' | 'transcript';

const TABS: { key: Tab; label: string }[] = [
  { key: 'player', label: 'Player' },
  { key: 'transcript', label: 'Transcript' },
];

export function SharePage() {
  const { shareId } = useParams<{ shareId: string }>();
  const [track, setTrack] = useState<SharedTrack | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>('player');
  const [currentTime, setCurrentTime] = useState(0);

  // Fetch shared track — no auth header needed
  useEffect(() => {
    if (!shareId) return;
    setLoading(true);
    setNotFound(false);

    fetch(`/api/share/${shareId}`)
      .then((res) => {
        if (!res.ok) throw new Error('Not found');
        return res.json();
      })
      .then((data) => setTrack(data))
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [shareId]);

  const handleTimeUpdate = useCallback((time: number) => {
    setCurrentTime(time);
  }, []);

  const handleSeek = useCallback((_timeSec: number) => {
    // TranscriptView handles seek via WaveformPlayer
  }, []);

  const handleCopyShareLink = useCallback(async () => {
    const url = `${window.location.origin}/share/${shareId}`;
    await navigator.clipboard.writeText(url);
    toast.success('Share link copied!');
  }, [shareId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen" style={{ background: 'var(--bg-primary)' }}>
        <Loader2 className="w-6 h-6 animate-spin text-[var(--accent)]" />
      </div>
    );
  }

  if (notFound || !track) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 min-h-screen" style={{ background: 'var(--bg-primary)' }}>
        <p className="text-sm text-[var(--text-secondary)]">Shared track not found</p>
        <a
          href="/"
          className="px-4 py-2 text-sm bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white rounded-[var(--radius-button)] transition-colors"
          aria-label="Go home"
        >
          Go Home
        </a>
      </div>
    );
  }

  const lensMeta = getLensMetadata(track.lens);

  return (
    <div
      className="min-h-screen"
      style={{
        backgroundColor: `${lensMeta.accentColor}08`, // 3% opacity flat background
      }}
    >
      <div className="mx-auto max-w-full sm:max-w-[640px] lg:max-w-[800px] xl:max-w-[960px] px-4 sm:px-5 lg:px-6 xl:px-8 py-8">
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={SPRING_GENTLE}
          className="flex flex-col gap-4"
        >
          {/* Header */}
          <div className="flex items-start justify-between gap-4">
            <div className="flex flex-col gap-3">
              <h1 className="text-h2 text-[var(--text-primary)]">
                {track.title}
              </h1>

              {/* Lens badge */}
              <span
                className="inline-flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-[var(--radius-pill)] w-fit"
                style={{
                  backgroundColor: `${lensMeta.accentColor}14`,
                  color: lensMeta.accentColor,
                  border: `1px solid ${lensMeta.accentColor}33`,
                }}
              >
                <LensIcon iconName={lensMeta.icon} size={14} strokeWidth={1.75} color={lensMeta.accentColor} />
                <span>{lensMeta.name}</span>
              </span>
            </div>

            {/* Copy share link button */}
            <motion.button
              type="button"
              whileHover={{ scale: 1.05, y: -1 }}
              whileTap={{ scale: 0.98 }}
              transition={SPRING_SNAPPY}
              onClick={handleCopyShareLink}
              aria-label="Copy share link"
              className="flex items-center gap-2 px-4 py-2 text-xs font-medium bg-transparent hover:bg-[var(--bg-tertiary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] border border-[var(--border-primary)] rounded-[var(--radius-button)] transition-all duration-300"
            >
              <Share2 className="w-4 h-4" strokeWidth={2} />
              <span>Share</span>
            </motion.button>
          </div>

          {/* Tabs */}
          <div className="flex gap-0 border-b border-[var(--border-primary)]" role="tablist" aria-label="Share page tabs">
            {TABS.map(({ key, label }) => (
              <button
                key={key}
                type="button"
                onClick={() => setActiveTab(key)}
                aria-label={`${label} tab`}
                aria-selected={activeTab === key}
                role="tab"
                className={cn(
                  'px-4 py-2 min-h-[44px] text-sm font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--border-focus)]',
                  activeTab === key
                    ? 'text-[var(--text-primary)] border-b-2 border-[var(--accent)]'
                    : 'text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]',
                )}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Tab content */}
          <div className={cn(activeTab !== 'player' && 'hidden')}>
            <WaveformPlayer
              audioUrl={track.audioUrl}
              onTimeUpdate={handleTimeUpdate}
            />
          </div>

          {activeTab === 'transcript' && (
            <TranscriptView
              transcript={track.transcript}
              currentTime={currentTime}
              onSeek={handleSeek}
            />
          )}
        </motion.div>
      </div>
    </div>
  );
}
