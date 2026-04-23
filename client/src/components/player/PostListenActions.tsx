import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { RefreshCw, Shuffle, Link } from 'lucide-react';
import { toast } from 'sonner';
import { SPRING_SNAPPY, SPRING_GENTLE, STAGGER_NORMAL } from '@/lib/motion';
import { useStore } from '@/store';
import type { Track } from '@/types';

interface PostListenActionsProps {
  track: Track;
  isFinished: boolean;
}

const ACTION_ITEMS = [
  { key: 'deeperDive', label: 'Deeper dive', icon: RefreshCw },
  { key: 'differentLens', label: 'Different lens', icon: Shuffle },
  { key: 'share', label: 'Share', icon: Link },
] as const;

export function PostListenActions({ track, isFinished }: PostListenActionsProps) {
  const navigate = useNavigate();
  const setContent = useStore((s) => s.setContent);
  const setLensPickerOpen = useStore((s) => s.setLensPickerOpen);

  const handleAction = useCallback(
    async (key: string) => {
      switch (key) {
        case 'deeperDive':
          setContent(track.sourceText);
          navigate('/');
          break;
        case 'differentLens':
          setContent(track.sourceText);
          setLensPickerOpen(true);
          navigate('/');
          break;
        case 'share': {
          const url = `${window.location.origin}/share/${track.shareId}`;
          await navigator.clipboard.writeText(url);
          toast.success('Share link copied!');
          break;
        }
      }
    },
    [track.sourceText, track.shareId, setContent, setLensPickerOpen, navigate],
  );

  return (
    <AnimatePresence>
      {isFinished && (
        <motion.div
          initial="hidden"
          animate="visible"
          exit={{ opacity: 0 }}
          variants={{
            hidden: { opacity: 0 },
            visible: { opacity: 1, transition: { staggerChildren: STAGGER_NORMAL, delayChildren: 0.1 } },
          }}
          transition={SPRING_GENTLE}
          className="flex items-center gap-2 mt-6"
        >
          {ACTION_ITEMS.map(({ key, label, icon: Icon }) => (
            <motion.button
              key={key}
              type="button"
              variants={{ hidden: { opacity: 0, y: 6 }, visible: { opacity: 1, y: 0 } }}
              transition={SPRING_SNAPPY}
              whileHover={{ y: -1 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => handleAction(key)}
              className="flex items-center gap-1.5 px-3 py-2 text-[12px] font-medium text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] bg-transparent hover:bg-[var(--bg-tertiary)] border border-[var(--border-primary)] rounded-lg transition-all duration-150 focus:outline-none focus-visible:outline-2 focus-visible:outline-[var(--border-focus)]"
              aria-label={label}
            >
              <Icon className="w-3.5 h-3.5" strokeWidth={1.75} />
              {label}
            </motion.button>
          ))}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
