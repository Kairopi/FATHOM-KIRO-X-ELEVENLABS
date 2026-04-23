import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface SkeletonCardProps {
  lensAccent?: string;
  className?: string;
  style?: React.CSSProperties;
}

export function SkeletonCard({ lensAccent, className, style }: SkeletonCardProps) {
  const shimmerGradient = lensAccent
    ? `linear-gradient(90deg, transparent, ${lensAccent}0D, transparent)`
    : 'linear-gradient(90deg, transparent, rgba(255,255,255,0.05), transparent)';

  return (
    <div
      className={cn(
        'relative overflow-hidden bg-[var(--bg-secondary)] rounded-[var(--radius-card)]',
        className
      )}
      style={style}
    >
      <motion.div
        animate={{ x: ['-100%', '100%'] }}
        transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
        className="absolute inset-0"
        style={{ background: shimmerGradient }}
      />
    </div>
  );
}

interface SkeletonWaveformProps {
  lensAccent?: string;
  className?: string;
}

export function SkeletonWaveform({ lensAccent, className }: SkeletonWaveformProps) {
  const shimmerGradient = lensAccent
    ? `linear-gradient(90deg, transparent, ${lensAccent}0D, transparent)`
    : 'linear-gradient(90deg, transparent, rgba(255,255,255,0.05), transparent)';

  return (
    <div
      className={cn(
        'relative overflow-hidden bg-[var(--bg-tertiary)] border border-[var(--border-secondary)] rounded-[var(--radius-button)]',
        'h-20 md:h-[120px]',
        className
      )}
    >
      <motion.div
        animate={{ x: ['-100%', '100%'] }}
        transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
        className="absolute inset-0"
        style={{ background: shimmerGradient }}
      />
    </div>
  );
}

interface SkeletonTrackRowProps {
  lensAccent?: string;
}

export function SkeletonTrackRow({ lensAccent }: SkeletonTrackRowProps) {
  return <SkeletonCard lensAccent={lensAccent} className="h-14" />;
}

interface SkeletonTranscriptProps {
  lensAccent?: string;
  lines?: number;
}

export function SkeletonTranscript({ lensAccent, lines = 3 }: SkeletonTranscriptProps) {
  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={{
        visible: {
          transition: { staggerChildren: 0.04 },
        },
      }}
      className="space-y-3"
    >
      {Array.from({ length: lines }).map((_, index) => (
        <motion.div
          key={index}
          variants={{
            hidden: { opacity: 0, y: 4 },
            visible: { opacity: 1, y: 0 },
          }}
        >
          <SkeletonCard
            lensAccent={lensAccent}
            className="h-4"
            style={{ width: `${Math.random() * 30 + 70}%` }}
          />
        </motion.div>
      ))}
    </motion.div>
  );
}
