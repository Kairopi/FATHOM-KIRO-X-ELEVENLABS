import { motion } from 'framer-motion';
import { Check, AlertCircle, WifiOff } from 'lucide-react';
import { cn } from '@/lib/utils';
import { SPRING_SNAPPY } from '@/lib/motion';
import { useEffect, useState } from 'react';

interface SuccessCheckmarkProps {
  className?: string;
}

export function SuccessCheckmark({ className }: SuccessCheckmarkProps) {
  return (
    <motion.div
      initial={{ scale: 0 }}
      animate={{ scale: [0, 1.2, 1] }}
      transition={SPRING_SNAPPY}
      className={cn(
        'w-16 h-16 rounded-full bg-[var(--success)] flex items-center justify-center',
        className
      )}
    >
      <Check className="w-8 h-8 text-white" />
    </motion.div>
  );
}

interface EmptyStateProps {
  message: string;
  ctaText: string;
  onCtaClick: () => void;
  className?: string;
}

export function EmptyState({ message, ctaText, onCtaClick, className }: EmptyStateProps) {
  return (
    <div className={cn('flex flex-col items-center gap-4 py-12', className)}>
      <p className="text-[var(--text-secondary)] text-sm">{message}</p>
      <motion.button
        animate={{ scale: [1, 1.02, 1] }}
        transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
        onClick={onCtaClick}
        className="px-4 py-2 bg-[var(--accent-primary)] hover:bg-[var(--accent-hover)] text-white rounded-[var(--radius-button)] text-sm font-medium transition-colors"
      >
        {ctaText}
      </motion.button>
    </div>
  );
}

interface ErrorStateProps {
  message: string;
  onRetry: () => void;
  className?: string;
}

export function ErrorState({ message, onRetry, className }: ErrorStateProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={SPRING_SNAPPY}
      className={cn(
        'flex flex-col items-center gap-3 p-4 bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-[var(--radius-card)]',
        className
      )}
    >
      <AlertCircle className="w-8 h-8 text-[var(--error)]" />
      <p className="text-sm text-[var(--error)] text-center">{message}</p>
      <motion.button
        whileTap={{ scale: 0.98 }}
        transition={SPRING_SNAPPY}
        onClick={onRetry}
        className="px-4 py-2 bg-[var(--accent-primary)] hover:bg-[var(--accent-hover)] text-white rounded-[var(--radius-button)] text-sm font-medium transition-colors"
      >
        Retry
      </motion.button>
    </motion.div>
  );
}

interface OfflineIndicatorProps {
  onReconnect: () => void;
}

export function OfflineIndicator({ onReconnect }: OfflineIndicatorProps) {
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (isOnline) return null;

  return (
    <motion.div
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      exit={{ y: -100 }}
      transition={SPRING_SNAPPY}
      className="fixed top-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 px-4 py-2 bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-[var(--radius-button)] shadow-lg"
    >
      <motion.div
        animate={{ opacity: [0.4, 1, 0.4] }}
        transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
        className="w-2 h-2 rounded-full bg-[var(--error)]"
      />
      <WifiOff className="w-4 h-4 text-[var(--text-secondary)]" />
      <span className="text-sm text-[var(--text-secondary)]">You're offline</span>
      <motion.button
        whileTap={{ scale: 0.98 }}
        transition={SPRING_SNAPPY}
        onClick={onReconnect}
        className="text-sm text-[var(--accent-primary)] hover:text-[var(--accent-hover)] font-medium transition-colors"
      >
        Reconnect
      </motion.button>
    </motion.div>
  );
}
