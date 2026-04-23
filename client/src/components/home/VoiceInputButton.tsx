import { motion, AnimatePresence } from 'framer-motion';
import { Mic, Square } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useVoiceInput } from '@/hooks/useVoiceInput';
import { useStore } from '@/store';
import { useState } from 'react';
import { SPRING_SNAPPY } from '@/lib/motion';

interface VoiceInputButtonProps {
  variant?: 'hero' | 'inline' | 'menu-item';
  onDone?: () => void;
}

export function VoiceInputButton({ variant = 'hero', onDone }: VoiceInputButtonProps) {
  const { isRecording, isTranscribing, startRecording, stopRecording } = useVoiceInput();
  const spokenInput = useStore((s) => s.spokenInput);
  const [showRipple, setShowRipple] = useState(false);
  const [showError, setShowError] = useState(false);

  const handleClick = async () => {
    if (isRecording) {
      stopRecording();
    } else {
      setShowRipple(true);
      setTimeout(() => setShowRipple(false), 600);
      try {
        await startRecording();
      } catch {
        setShowError(true);
        setTimeout(() => setShowError(false), 400);
      }
    }
  };

  // ── Menu-item variant: inside the + popover ──
  if (variant === 'menu-item') {
    return (
      <button
        type="button"
        onClick={async () => {
          if (isRecording) {
            stopRecording();
          } else {
            try { await startRecording(); } catch {}
          }
          onDone?.();
        }}
        disabled={isTranscribing}
        className={cn(
          'w-full flex items-center gap-2.5 px-3.5 py-2.5 text-[13px] transition-colors',
          isRecording
            ? 'text-[var(--error)]'
            : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-elevated)]',
          isTranscribing && 'opacity-50 cursor-not-allowed'
        )}
      >
        <Mic className="w-4 h-4 text-[var(--text-tertiary)]" strokeWidth={1.75} />
        <span>{isTranscribing ? 'Transcribing…' : isRecording ? 'Stop Recording' : 'Voice Input'}</span>
      </button>
    );
  }

  // ── Inline variant: small toolbar button ──
  if (variant === 'inline') {
    return (
      <motion.button
        type="button"
        whileHover={!isTranscribing ? { scale: 1.02, backgroundColor: isRecording ? undefined : 'var(--bg-tertiary)' } : undefined}
        whileTap={!isTranscribing ? { scale: 0.98 } : undefined}
        transition={SPRING_SNAPPY}
        onClick={handleClick}
        disabled={isTranscribing}
        aria-label={isRecording ? 'Stop recording' : 'Voice input'}
        className={cn(
          'flex items-center gap-1.5 px-2.5 py-1.5 min-h-[48px] min-w-[48px] sm:min-h-[40px] sm:min-w-[40px] rounded-[var(--radius-button)] transition-colors text-[13px]',
          isRecording
            ? 'text-[var(--error)] bg-[rgba(239,68,68,0.1)]'
            : 'text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]',
          isTranscribing && 'opacity-40 cursor-not-allowed'
        )}
      >
        {isRecording ? (
          <Square className="w-3.5 h-3.5 fill-current" strokeWidth={0} />
        ) : (
          <Mic className="w-4 h-4" strokeWidth={1.75} />
        )}
        <span className="hidden sm:inline">
          {isTranscribing ? 'Transcribing…' : isRecording ? 'Stop' : 'Voice'}
        </span>
      </motion.button>
    );
  }

  // ── Hero variant: large centered button ──
  return (
    <div className="flex flex-col items-center gap-3">
      <div role="status" aria-live="polite" className="sr-only">
        {isTranscribing && 'Transcribing your speech...'}
        {isRecording && 'Recording started. Speak now.'}
        {!isRecording && !isTranscribing && spokenInput && `Transcription complete: ${spokenInput}`}
      </div>

      <div className="relative">
        {isRecording && (
          <span
            className="absolute inset-[-8px] rounded-full animate-[voice-ring_2s_linear_infinite]"
            style={{ border: '3px solid var(--error)', opacity: 0.5 }}
          />
        )}

        {showRipple && (
          <motion.span
            initial={{ scale: 0, opacity: 0.4 }}
            animate={{ scale: 2.5, opacity: 0 }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
            className="absolute inset-0 rounded-full bg-[var(--accent-primary)]"
          />
        )}

        <motion.button
          animate={
            !isRecording && !isTranscribing
              ? { scale: [1, 1.04, 1] }
              : showError
              ? { x: [-4, 4, -4, 4, 0] }
              : {}
          }
          transition={
            !isRecording && !isTranscribing
              ? { duration: 2.5, repeat: Infinity, ease: 'easeInOut' }
              : showError
              ? { duration: 0.4 }
              : {}
          }
          whileHover={!isTranscribing ? { scale: 1.02 } : {}}
          whileTap={!isTranscribing ? { scale: 0.98 } : {}}
          onClick={handleClick}
          disabled={isTranscribing}
          aria-label={isRecording ? 'Stop recording' : 'Speak your topic'}
          aria-pressed={isRecording}
          className={cn(
            'relative flex items-center justify-center',
            'w-[88px] h-[88px] rounded-full transition-colors',
            'focus:outline-none focus:ring-2 focus:ring-[var(--border-focus)] focus:ring-offset-2',
            isRecording
              ? 'bg-[var(--error)]'
              : 'bg-[var(--accent-primary)] hover:bg-[var(--accent-hover)]',
            isTranscribing && 'opacity-40 cursor-not-allowed'
          )}
          style={{
            boxShadow: isRecording
              ? '0 0 24px rgba(239, 68, 68, 0.3)'
              : '0 0 24px rgba(139, 92, 246, 0.2)',
          }}
        >
          {isRecording ? (
            <Square className="w-7 h-7 text-white fill-white" strokeWidth={0} />
          ) : (
            <Mic className="w-7 h-7 text-white" strokeWidth={2} />
          )}
        </motion.button>
      </div>

      <span className="text-[13px] font-medium text-[var(--text-tertiary)]">
        {isTranscribing ? 'Transcribing...' : isRecording ? 'Listening, tap to stop' : 'Speak your topic'}
      </span>

      <AnimatePresence>
        {spokenInput && !isRecording && !isTranscribing && (
          <motion.p
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="text-sm text-[var(--text-secondary)] text-center max-w-sm"
          >
            {spokenInput}
          </motion.p>
        )}
      </AnimatePresence>

      <style>{`
        @keyframes voice-ring {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
