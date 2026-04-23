import { useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowUp, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { SPRING_SNAPPY } from '@/lib/motion';
import { useStore } from '@/store';
import { api } from '@/lib/api';
import type { Track } from '@/types';

export function GenerateButton() {
  const navigate = useNavigate();
  const content = useStore((s) => s.content);
  const selectedLens = useStore((s) => s.selectedLens);
  const voicePair = useStore((s) => s.voicePair);
  const isGenerating = useStore((s) => s.isGenerating);
  const setIsGenerating = useStore((s) => s.setIsGenerating);
  const setGenerationPhase = useStore((s) => s.setGenerationPhase);
  const setContent = useStore((s) => s.setContent);

  const isDisabled = !content.trim() || !selectedLens || isGenerating;

  const handleGenerate = useCallback(async () => {
    if (isDisabled) return;
    setIsGenerating(true);
    setGenerationPhase('Analyzing your content...');
    try {
      const track = await api.post<Track>('/api/generate', {
        content: content.trim(),
        lens: selectedLens,
        voiceConfig: voicePair,
      });
      setContent('');
      navigate(`/player/${track.id}`);
      toast.success('Podcast generated!');
    } catch (error) {
      console.error('Generation failed:', error);
    } finally {
      setIsGenerating(false);
      setGenerationPhase('');
    }
  }, [isDisabled, content, selectedLens, voicePair, setIsGenerating, setGenerationPhase, setContent, navigate]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        handleGenerate();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleGenerate]);

  return (
    <motion.button
      type="button"
      whileHover={!isDisabled ? { scale: 1.02 } : undefined}
      whileTap={!isDisabled ? { scale: 0.98 } : undefined}
      transition={SPRING_SNAPPY}
      onClick={handleGenerate}
      disabled={isDisabled}
      aria-label={isGenerating ? 'Generating podcast…' : 'Generate podcast'}
      aria-disabled={isDisabled}
      className="flex items-center justify-center min-h-[48px] min-w-[48px] w-12 h-12 sm:min-h-[40px] sm:min-w-[40px] sm:w-8 sm:h-8 rounded-full transition-all duration-150 disabled:opacity-40 disabled:cursor-not-allowed focus:outline-none focus-visible:outline-3 focus-visible:outline-[var(--border-focus)] focus-visible:outline-offset-2"
      style={{
        backgroundColor: isDisabled ? 'var(--bg-tertiary)' : 'var(--accent-primary)',
        color: isDisabled ? 'var(--text-muted)' : '#fff',
        boxShadow: isDisabled ? 'none' : '0 1px 4px rgba(139,92,246,0.3)',
      }}
    >
      {/* Screen reader announcement for generation state */}
      <span role="status" aria-live="polite" className="sr-only">
        {isGenerating ? 'Generating podcast, please wait' : ''}
      </span>
      {isGenerating ? (
        <Loader2 className="w-4 h-4 animate-spin" strokeWidth={2.5} />
      ) : (
        <ArrowUp className="w-4 h-4" strokeWidth={2.5} />
      )}
    </motion.button>
  );
}
