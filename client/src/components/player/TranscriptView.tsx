import { useRef, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { SPRING_SNAPPY, STAGGER_NORMAL } from '@/lib/motion';
import type { TranscriptSegment } from '@/types';

interface TranscriptViewProps {
  transcript: TranscriptSegment[];
  currentTime: number;
  onSeek: (timeSec: number) => void;
}

function formatTimestamp(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export function TranscriptView({ transcript, currentTime, onSeek }: TranscriptViewProps) {
  const activeRef = useRef<HTMLButtonElement | null>(null);

  const activeIndex = useMemo(
    () => transcript.findIndex((seg) => seg.startTime <= currentTime && currentTime < seg.endTime),
    [transcript, currentTime],
  );

  useEffect(() => {
    if (activeRef.current) {
      activeRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [activeIndex]);

  return (
    <motion.div initial="hidden" animate="visible"
      variants={{ visible: { transition: { staggerChildren: STAGGER_NORMAL } } }}
      className="flex flex-col gap-1">
      {transcript.map((segment, index) => {
        const isActive = index === activeIndex;
        const isPast = activeIndex >= 0 && index < activeIndex;
        const isExplainer = segment.speaker === 'EXPLAINER';

        return (
          <motion.button
            key={`${segment.startTime}-${index}`}
            ref={isActive ? activeRef : null}
            type="button"
            onClick={() => onSeek(segment.startTime)}
            variants={{ hidden: { opacity: 0, y: 4 }, visible: { opacity: 1, y: 0 } }}
            transition={SPRING_SNAPPY}
            aria-label={`${segment.speaker} at ${formatTimestamp(segment.startTime)}: ${segment.text}`}
            className={cn(
              'w-full text-left px-4 py-3 rounded-lg transition-all duration-200 cursor-pointer group',
              'focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--border-focus)]',
              isActive
                ? 'bg-[var(--accent-muted)] border-l-[3px] border-l-[var(--accent)]'
                : 'border-l-[3px] border-l-transparent hover:bg-[var(--bg-tertiary)]',
            )}
          >
            <div className="flex items-center gap-2 mb-1">
              {/* Speaker badge */}
              <span className={cn(
                'inline-flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full',
                isExplainer
                  ? 'text-[var(--accent)] bg-[var(--accent-muted)]'
                  : 'text-[var(--accent-secondary)] bg-[rgba(245,158,11,0.1)]',
              )}>
                <span className={cn(
                  'w-1.5 h-1.5 rounded-full',
                  isExplainer ? 'bg-[var(--accent)]' : 'bg-[var(--accent-secondary)]'
                )} />
                {segment.speaker}
              </span>
              {/* Timestamp */}
              <span className="text-[10px] text-[var(--text-muted)] tabular-nums group-hover:text-[var(--text-tertiary)] transition-colors">
                {formatTimestamp(segment.startTime)}
              </span>
            </div>
            <span className={cn(
              'block text-sm leading-relaxed transition-colors duration-200',
              isActive ? 'text-[var(--text-primary)]'
                : isPast ? 'text-[var(--text-tertiary)]'
                : 'text-[var(--text-secondary)]',
            )}>
              {segment.text}
            </span>
          </motion.button>
        );
      })}
    </motion.div>
  );
}
