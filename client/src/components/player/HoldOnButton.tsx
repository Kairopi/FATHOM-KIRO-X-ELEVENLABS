import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { SPRING_SNAPPY } from '@/lib/motion';
import { api } from '@/lib/api';
import type { Interrupt } from '@/types';

interface HoldOnButtonProps {
  trackId: string;
  currentTime: number;
  isPlaying: boolean;
  onPause: () => void;
  onResume: () => void;
}

type ButtonState = 'idle' | 'loading' | 'playing';

export function HoldOnButton({
  trackId,
  currentTime,
  isPlaying,
  onPause,
  onResume,
}: HoldOnButtonProps) {
  const [state, setState] = useState<ButtonState>('idle');

  const handleClick = useCallback(async () => {
    if (state !== 'idle') return;

    onPause();
    setState('loading');

    try {
      const interrupt = await api.post<Interrupt>('/api/interrupt', {
        trackId,
        timestampSec: Math.floor(currentTime),
      });

      setState('playing');
      const audio = new Audio(interrupt.audioUrl);

      await new Promise<void>((resolve, reject) => {
        audio.onended = () => resolve();
        audio.onerror = () => reject(new Error('Failed to play re-explanation audio'));
        audio.play().catch(reject);
      });

      // Resume original playback
      setState('idle');
      onResume();
    } catch {
      toast.error('Could not generate re-explanation');
      setState('idle');
      onResume();
    }
  }, [state, trackId, currentTime, onPause, onResume]);

  const label =
    state === 'loading'
      ? 'Thinking...'
      : state === 'playing'
        ? 'Re-explaining...'
        : '✋ Hold On';

  return (
    <AnimatePresence>
      {(isPlaying || state !== 'idle') && (
        <motion.button
          type="button"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{
            opacity: 1,
            scale: 1,
            boxShadow: [
              '0 0 0px 0px var(--accent-muted)',
              '0 0 16px 4px var(--accent-muted)',
              '0 0 0px 0px var(--accent-muted)',
            ],
          }}
          exit={{ opacity: 0, scale: 0.9 }}
          transition={{
            ...SPRING_SNAPPY,
            boxShadow: {
              duration: 2,
              repeat: Infinity,
              ease: 'easeInOut',
            },
          }}
          whileTap={{ scale: 0.98 }}
          onClick={handleClick}
          disabled={state !== 'idle'}
          aria-label={label}
          className="flex items-center gap-2 rounded-[9999px] bg-[var(--bg-secondary)] border border-[var(--border-primary)] px-5 py-2.5 text-sm font-medium text-[var(--text-primary)] transition-colors hover:bg-[var(--bg-tertiary)] disabled:opacity-70 disabled:cursor-not-allowed"
        >
          {state === 'loading' && (
            <Loader2 className="w-4 h-4 animate-spin text-[var(--accent)]" />
          )}
          {label}
        </motion.button>
      )}
    </AnimatePresence>
  );
}
