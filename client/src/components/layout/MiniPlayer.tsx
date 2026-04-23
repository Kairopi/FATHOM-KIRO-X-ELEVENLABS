import { useNavigate } from 'react-router-dom';
import { Play, Pause, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useStore } from '@/store';
import { getLensMetadata } from '@/lib/lenses';
import { LensIcon } from '@/components/ui/LensIcon';

export function MiniPlayer() {
  const navigate = useNavigate();
  const currentTrack = useStore((s) => s.currentTrack);
  const isPlaying = useStore((s) => s.isPlaying);
  const currentTime = useStore((s) => s.currentTime);
  const setTrack = useStore((s) => s.setTrack);

  if (!currentTrack) return null;

  const lensMeta = getLensMetadata(currentTrack.lens);

  const handleDismiss = () => {
    window.dispatchEvent(new CustomEvent('fathom:play-pause'));
    // Small delay so audio stops before we clear the track
    setTimeout(() => setTrack(null), 50);
  };

  return (
    <AnimatePresence>
      {currentTrack && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
          className={cn(
            'fixed z-50',
            'bottom-[72px] md:bottom-3',
            'left-3 right-3 md:left-auto md:right-4',
            'md:w-[380px]',
          )}
          role="region"
          aria-label="Mini player"
        >
          <div
            className="relative rounded-xl overflow-hidden border border-[var(--border-primary)]"
            style={{
              backgroundColor: 'var(--bg-secondary)',
              boxShadow: '0 8px 32px rgba(0,0,0,0.4), 0 0 0 1px rgba(255,255,255,0.03)',
            }}
          >
            {/* Progress bar — thin line at top */}
            <div className="h-[2px] bg-[var(--bg-tertiary)]">
              <div
                className="h-full transition-all duration-300 ease-linear"
                style={{
                  backgroundColor: lensMeta.accentColor,
                  width: currentTrack.duration > 0 ? `${Math.min(100, (currentTime / currentTrack.duration) * 100)}%` : '0%',
                }}
              />
            </div>

            <div className="flex items-center gap-3 px-3 py-2.5">
              {/* Lens icon */}
              <motion.button
                type="button"
                whileTap={{ scale: 0.95 }}
                transition={{ duration: 0.15, ease: [0.4, 0, 0.2, 1] }}
                onClick={() => navigate(`/player/${currentTrack.id}`)}
                className="shrink-0 w-10 h-10 rounded-lg flex items-center justify-center focus:outline-none focus-visible:outline-2 focus-visible:outline-[var(--border-focus)]"
                style={{ backgroundColor: `${lensMeta.accentColor}14` }}
                aria-label={`Open ${currentTrack.title}`}
              >
                <LensIcon iconName={lensMeta.icon} size={16} strokeWidth={1.75} color={lensMeta.accentColor} />
              </motion.button>

              {/* Track info */}
              <button
                type="button"
                onClick={() => navigate(`/player/${currentTrack.id}`)}
                className="flex-1 min-w-0 text-left focus:outline-none"
                aria-label={`Open ${currentTrack.title}`}
              >
                <p className="text-[13px] font-medium text-[var(--text-primary)] truncate" style={{ letterSpacing: '-0.01em' }}>
                  {currentTrack.title}
                </p>
                <p className="text-[11px] text-[var(--text-tertiary)] truncate mt-0.5">
                  {lensMeta.name}
                </p>
              </button>

              {/* Play/Pause */}
              <motion.button
                type="button"
                whileTap={{ scale: 0.9 }}
                transition={{ duration: 0.15, ease: [0.4, 0, 0.2, 1] }}
                onClick={() => window.dispatchEvent(new CustomEvent('fathom:play-pause'))}
                className="shrink-0 w-9 h-9 flex items-center justify-center rounded-full text-white focus:outline-none focus-visible:outline-2 focus-visible:outline-[var(--border-focus)]"
                style={{ backgroundColor: lensMeta.accentColor }}
                aria-label={isPlaying ? 'Pause' : 'Play'}
              >
                {isPlaying ? <Pause size={16} strokeWidth={2.5} /> : <Play size={16} strokeWidth={2.5} className="ml-0.5" />}
              </motion.button>

              {/* Close / Dismiss */}
              <motion.button
                type="button"
                whileTap={{ scale: 0.9 }}
                transition={{ duration: 0.15, ease: [0.4, 0, 0.2, 1] }}
                onClick={handleDismiss}
                className="shrink-0 w-7 h-7 flex items-center justify-center rounded-md text-[var(--text-muted)] hover:text-[var(--text-tertiary)] hover:bg-[var(--bg-tertiary)] transition-colors focus:outline-none focus-visible:outline-2 focus-visible:outline-[var(--border-focus)]"
                aria-label="Dismiss player"
              >
                <X size={14} strokeWidth={2} />
              </motion.button>
            </div>
          </div>

          <div role="status" aria-live="polite" className="sr-only">
            Now playing: {currentTrack.title}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
