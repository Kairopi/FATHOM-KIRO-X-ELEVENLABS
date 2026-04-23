import { motion } from 'framer-motion';
import { Volume2, VolumeX } from 'lucide-react';
import { cn } from '@/lib/utils';
import { SPRING_SNAPPY } from '@/lib/motion';
import { useStore } from '@/store';

export function SoundscapeToggle() {
  const soundscapeEnabled = useStore((s) => s.soundscapeEnabled);
  const toggleSoundscape = useStore((s) => s.toggleSoundscape);

  return (
    <motion.button
      type="button"
      whileHover={{ scale: 1.05, y: -1 }}
      whileTap={{ scale: 0.95 }}
      transition={SPRING_SNAPPY}
      onClick={toggleSoundscape}
      aria-label={soundscapeEnabled ? 'Mute soundscape' : 'Unmute soundscape'}
      className={cn(
        'flex items-center gap-2.5 px-4 py-2 rounded-[var(--radius-pill)] text-xs font-medium border transition-all duration-200',
        soundscapeEnabled
          ? 'bg-[var(--accent-muted)] text-[var(--accent-hover)] border-[var(--accent)] shadow-md shadow-[var(--accent)]/10'
          : 'bg-transparent text-[var(--text-tertiary)] border-[var(--border-primary)] hover:text-[var(--text-secondary)] hover:border-[var(--border-focus)]'
      )}
    >
      {soundscapeEnabled ? (
        <Volume2 className="w-4 h-4" strokeWidth={2} />
      ) : (
        <VolumeX className="w-4 h-4" strokeWidth={2} />
      )}
      Soundscape
    </motion.button>
  );
}
