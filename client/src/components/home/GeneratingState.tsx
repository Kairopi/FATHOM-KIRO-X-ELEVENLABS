import { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, RotateCcw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useStore } from '@/store';
import { SPRING_SNAPPY } from '@/lib/motion';
import { LENS_METADATA } from '@/lib/lenses';
import { SkeletonCard } from '@/components/ui/skeleton';

interface Props {
  onCancel: () => void;
  onRetry?: () => void;
  error?: string | null;
}

function formatElapsed(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export function GeneratingState({ onCancel, onRetry, error }: Props) {
  const generationPhase = useStore((s) => s.generationPhase);
  const spokenInput = useStore((s) => s.spokenInput);
  const selectedLens = useStore((s) => s.selectedLens);
  const [elapsed, setElapsed] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const accentColor = selectedLens
    ? LENS_METADATA[selectedLens].accentColor
    : '#8B5CF6';

  // Elapsed timer
  useEffect(() => {
    if (error) return;
    setElapsed(0);
    timerRef.current = setInterval(() => setElapsed((p) => p + 1), 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [error]);

  const displayMessage = generationPhase || 'Preparing your podcast...';

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6">
      <div role="status" aria-live="polite" className="sr-only">
        {error ? error : displayMessage}
      </div>

      {/* Skeleton progress indicator */}
      <div className="flex flex-col items-center gap-3 w-full max-w-xs" role="presentation" aria-hidden="true">
        {/* Skeleton shimmer bar with lens accent */}
        {!error ? (
          <SkeletonCard
            lensAccent={accentColor}
            className="h-2 w-full rounded-full"
          />
        ) : (
          <div className="h-2 w-full rounded-full bg-[var(--error)] opacity-40" />
        )}
        {/* Elapsed timer */}
        <span className={cn(
          'text-xs font-mono font-medium tabular-nums',
          error ? 'text-[var(--error)]' : 'text-[var(--text-tertiary)]'
        )}>
          {error ? 'Failed' : formatElapsed(elapsed)}
        </span>
      </div>

      {/* Status text */}
      <div className="flex flex-col items-center gap-2">
        <AnimatePresence mode="wait">
          <motion.p
            key={error ? 'error' : displayMessage}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.2 }}
            className={cn(
              'text-sm font-medium text-center',
              error ? 'text-[var(--error)]' : 'text-[var(--text-primary)]'
            )}
          >
            {error || displayMessage}
          </motion.p>
        </AnimatePresence>

        {!error && (
          <p className="text-xs text-[var(--text-tertiary)]">
            This usually takes 30–90 seconds
          </p>
        )}
      </div>

      {/* Skeleton content preview — simulates podcast being built */}
      {!error && (
        <div className="flex flex-col gap-2 w-full max-w-xs">
          {[0.85, 0.65, 0.75].map((widthFraction, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
            >
              <SkeletonCard
                lensAccent={accentColor}
                className="h-3 rounded"
                style={{ width: `${widthFraction * 100}%` }}
              />
            </motion.div>
          ))}
        </div>
      )}

      {/* Spoken input */}
      {spokenInput && !error && (
        <p className="text-xs text-[var(--text-tertiary)] text-center max-w-sm">
          You said: &ldquo;{spokenInput}&rdquo;
        </p>
      )}

      {/* Actions */}
      <div className="flex items-center gap-3 mt-2">
        {error && onRetry && (
          <motion.button
            type="button"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            transition={SPRING_SNAPPY}
            onClick={onRetry}
            aria-label="Retry generation"
            className="flex items-center gap-2 px-5 py-2.5 min-h-[48px] min-w-[48px] sm:min-h-[40px] sm:min-w-[40px] text-sm font-medium bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white rounded-full transition-colors focus:outline-none focus-visible:outline-3 focus-visible:outline-[var(--border-focus)] focus-visible:outline-offset-2 disabled:opacity-40 disabled:cursor-not-allowed disabled:pointer-events-none"
          >
            <RotateCcw className="w-4 h-4" strokeWidth={2} />
            Retry
          </motion.button>
        )}
        <motion.button
          type="button"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          transition={SPRING_SNAPPY}
          onClick={onCancel}
          aria-label="Cancel generation"
          className="flex items-center gap-2 px-5 py-2.5 min-h-[48px] min-w-[48px] sm:min-h-[40px] sm:min-w-[40px] text-sm font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] bg-transparent hover:bg-[var(--bg-tertiary)] border border-[var(--border-primary)] rounded-full transition-colors focus:outline-none focus-visible:outline-3 focus-visible:outline-[var(--border-focus)] focus-visible:outline-offset-2 disabled:opacity-40 disabled:cursor-not-allowed disabled:pointer-events-none"
        >
          <X className="w-4 h-4" strokeWidth={2} />
          Cancel
        </motion.button>
      </div>
    </div>
  );
}
