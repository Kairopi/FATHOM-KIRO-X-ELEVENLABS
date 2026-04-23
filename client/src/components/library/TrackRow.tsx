import { motion } from 'framer-motion';
import { Heart } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getLensMetadata } from '@/lib/lenses';
import { LensIcon } from '@/components/ui/LensIcon';
import { useStore } from '@/store';
import { SPRING_SNAPPY, STAGGER_ITEM } from '@/lib/motion';
import type { Track } from '@/types';

interface Props {
  track: Track;
  onPlay: (track: Track) => void;
  onContextMenu: (e: React.MouseEvent, track: Track) => void;
  onToggleFavorite: (track: Track) => void;
}

function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
  });
}

export function TrackRow({ track, onPlay, onContextMenu, onToggleFavorite }: Props) {
  const currentTrack = useStore((s) => s.currentTrack);
  const isPlaying = useStore((s) => s.isPlaying);
  const lensMeta = getLensMetadata(track.lens);
  const isCurrentlyPlaying = currentTrack?.id === track.id && isPlaying;

  return (
    <motion.div
      variants={STAGGER_ITEM}
      transition={SPRING_SNAPPY}
      whileHover={{ 
        y: -2, 
        backgroundColor: 'var(--bg-tertiary)',
        boxShadow: '0 4px 12px rgba(0,0,0,0.2)'
      }}
      className={cn(
        'flex items-center gap-4 px-4 py-3 rounded-[var(--radius-card)] cursor-pointer transition-colors focus:outline-none focus-visible:outline-3 focus-visible:outline-[var(--border-focus)] focus-visible:outline-offset-2',
        isCurrentlyPlaying && 'bg-[var(--bg-tertiary)]'
      )}
      onClick={() => onPlay(track)}
      onContextMenu={(e) => onContextMenu(e, track)}
      role="button"
      tabIndex={0}
      aria-label={`Play ${track.title}`}
    >
      {/* Lens thumbnail — 48px, accent tint, SVG icon */}
      <div
        className="w-12 h-12 flex-shrink-0 flex items-center justify-center rounded-xl relative overflow-hidden"
        style={{ backgroundColor: `${lensMeta.accentColor}12` }}
        aria-hidden="true"
      >
        <LensIcon iconName={lensMeta.icon} size={20} strokeWidth={1.75} color={lensMeta.accentColor} />
        {/* Subtle bottom accent bar */}
        <div className="absolute bottom-0 left-0 right-0 h-[2px]" style={{ backgroundColor: `${lensMeta.accentColor}40` }} />
      </div>

      {/* Track info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="text-sm font-medium text-[var(--text-primary)] truncate">
            {track.title}
          </p>
          {/* Show "You" badge if user owns this track */}
          {(track as any).isOwner && (
            <span className="px-2 py-0.5 text-[10px] font-semibold rounded-full bg-[var(--accent)] text-white flex-shrink-0">
              YOU
            </span>
          )}
        </div>
        <div className="flex items-center gap-2 mt-0.5">
          <span className="text-xs font-medium" style={{ color: lensMeta.accentColor }}>
            {lensMeta.name}
          </span>
          <span className="text-xs text-[var(--text-tertiary)]">
            {formatDate(track.createdAt)}
          </span>
        </div>
      </div>

      {/* Duration or equalizer bars */}
      <div className="flex-shrink-0 w-12 text-right">
        {isCurrentlyPlaying ? (
          <div className="flex items-end justify-end gap-[2px] h-4" aria-label="Now playing">
            <span className="equalizer-bar w-[3px] bg-[var(--accent)] rounded-full" style={{ animationDelay: '0ms' }} />
            <span className="equalizer-bar w-[3px] bg-[var(--accent)] rounded-full" style={{ animationDelay: '150ms' }} />
            <span className="equalizer-bar w-[3px] bg-[var(--accent)] rounded-full" style={{ animationDelay: '300ms' }} />
          </div>
        ) : (
          <span className="text-xs text-[var(--text-tertiary)]">
            {track.duration ? formatDuration(track.duration) : '--:--'}
          </span>
        )}
      </div>

      {/* Favorite button */}
      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        transition={SPRING_SNAPPY}
        onClick={(e) => {
          e.stopPropagation();
          onToggleFavorite(track);
        }}
        className="flex-shrink-0 min-h-[48px] min-w-[48px] sm:min-h-[40px] sm:min-w-[40px] p-2.5 rounded-[var(--radius-small)] hover:bg-[var(--bg-secondary)] transition-colors touch-target-expand focus:outline-none focus-visible:outline-3 focus-visible:outline-[var(--border-focus)] focus-visible:outline-offset-2"
        aria-label={track.isFavorite ? 'Remove from favorites' : 'Add to favorites'}
        aria-pressed={track.isFavorite}
      >
        <Heart
          className={cn(
            'w-[18px] h-[18px]',
            track.isFavorite
              ? 'fill-[var(--error)] text-[var(--error)]'
              : 'text-[var(--text-tertiary)]'
          )}
          strokeWidth={track.isFavorite ? 2.5 : 2}
        />
      </motion.button>
    </motion.div>
  );
}
