import { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Paperclip, Users, Mic, ArrowUp, Loader2, Plus, X } from 'lucide-react';
import { toast } from 'sonner';
import { useStore } from '@/store';
import { useNavigate } from 'react-router-dom';
import { SPRING_SNAPPY } from '@/lib/motion';
import { ContentInput } from '@/components/home/ContentInput';
import { LensPickerDialog } from '@/components/home/LensPickerDialog';
import { VoicePickerDialog } from '@/components/home/VoicePickerDialog';
import { FirstRunContent } from '@/components/home/FirstRunContent';
import { GeneratingState } from '@/components/home/GeneratingState';
import { getLensMetadata } from '@/lib/lenses';
import { LensIcon } from '@/components/ui/LensIcon';
import { useVoiceInput } from '@/hooks/useVoiceInput';

export function HomeScreen() {
  const navigate = useNavigate();
  const tracks = useStore((s) => s.tracks);
  const voicePair = useStore((s) => s.voicePair);
  const content = useStore((s) => s.content);
  const setContent = useStore((s) => s.setContent);
  const selectedLens = useStore((s) => s.selectedLens);
  const isGenerating = useStore((s) => s.isGenerating);
  const setIsGenerating = useStore((s) => s.setIsGenerating);
  const setGenerationPhase = useStore((s) => s.setGenerationPhase);
  const setSpokenInput = useStore((s) => s.setSpokenInput);
  const [lensPickerOpen, setLensPickerOpen] = useState(false);
  const [voicePickerOpen, setVoicePickerOpen] = useState(false);
  const [optionsOpen, setOptionsOpen] = useState(false);
  const [generationError, setGenerationError] = useState<string | null>(null);
  const [isFocused, setIsFocused] = useState(false);
  const [selectedFormat, setSelectedFormat] = useState<'deep_dive' | 'brief' | 'debate' | 'critique'>('deep_dive');
  const [selectedLength, setSelectedLength] = useState<'short' | 'medium' | 'long'>('medium');
  const abortControllerRef = useRef<AbortController | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { isRecording, isTranscribing, startRecording, stopRecording } = useVoiceInput();

  const isFirstRun = tracks.length === 0 && !content.trim();
  const hasContent = content.trim().length > 0;
  const canGenerate = hasContent && selectedLens && !isGenerating;
  const lensMeta = selectedLens ? getLensMetadata(selectedLens) : null;

  const handleCancel = useCallback(() => {
    if (abortControllerRef.current) { abortControllerRef.current.abort(); abortControllerRef.current = null; }
    setIsGenerating(false); setGenerationPhase(''); setSpokenInput(null); setGenerationError(null);
  }, [setIsGenerating, setGenerationPhase, setSpokenInput]);

  const handleRetry = useCallback(() => {
    setGenerationError(null); setIsGenerating(false); setGenerationPhase('');
  }, [setIsGenerating, setGenerationPhase]);

  const handleGenerate = useCallback(async () => {
    if (!canGenerate) return;
    setIsGenerating(true);
    setGenerationPhase('Analyzing your content...');
    setGenerationError(null);

    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    try {
      const user = useStore.getState().user;
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'text/event-stream',
          ...(user ? { 'X-User-Id': user.id } : {}),
        },
        body: JSON.stringify({ content: content.trim(), lens: selectedLens, format: selectedFormat, length: selectedLength, voiceConfig: voicePair }),
        signal: abortController.signal,
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({ message: 'Generation failed' }));
        throw new Error(err.message || 'Generation failed');
      }

      // Read SSE stream
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';

          for (const line of lines) {
            if (!line.startsWith('data: ')) continue;
            try {
              const data = JSON.parse(line.slice(6));

              if (data.error) {
                throw new Error(data.error);
              }

              if (data.step) {
                setGenerationPhase(data.step);
              }

              if (data.track) {
                setContent('');
                setIsGenerating(false);
                setGenerationPhase('');
                // Add track to library store so it appears immediately
                const currentTracks = useStore.getState().tracks;
                useStore.getState().setTracks([data.track, ...currentTracks]);
                navigate(`/player/${data.track.id}`);
                toast.success('Podcast generated!');
                return;
              }
            } catch (parseErr: any) {
              if (parseErr.message && !parseErr.message.includes('JSON')) throw parseErr;
            }
          }
        }
      }

      // Fallback: if no SSE track was received, try parsing as JSON
      if (buffer.trim()) {
        try {
          const lastData = JSON.parse(buffer.replace('data: ', ''));
          if (lastData.track) {
            setContent('');
            const currentTracks = useStore.getState().tracks;
            useStore.getState().setTracks([lastData.track, ...currentTracks]);
            navigate(`/player/${lastData.track.id}`);
            toast.success('Podcast generated!');
            return;
          }
        } catch {}
      }
    } catch (err: any) {
      if (err.name === 'AbortError') return;
      console.error('Generation failed:', err);
      setGenerationError(err.message || 'Generation failed. Please try again.');
    } finally {
      setIsGenerating(false);
      setGenerationPhase('');
      abortControllerRef.current = null;
    }
  }, [canGenerate, content, selectedLens, voicePair, setIsGenerating, setGenerationPhase, setContent, navigate]);

  const handleMicClick = async () => {
    if (isRecording) { stopRecording(); }
    else { try { await startRecording(); } catch {} }
  };

  const handleFileClick = () => fileInputRef.current?.click();
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check file size — max 5MB
    const MAX_SIZE = 5 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      toast.error('File too large. Maximum 5MB.');
      e.target.value = '';
      return;
    }

    // Accept .txt, .md, .csv, and common text types
    const textExtensions = ['.txt', '.md', '.csv', '.json', '.xml', '.html', '.htm', '.rtf', '.log'];
    const textTypes = ['text/', 'application/json', 'application/xml'];
    const ext = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
    const isTextFile = textExtensions.includes(ext) || textTypes.some(t => file.type.startsWith(t));

    if (!isTextFile) {
      toast.error('Unsupported file type. Try .txt, .md, or paste text directly.');
      e.target.value = '';
      return;
    }

    const reader = new FileReader();
    reader.onload = (ev) => {
      if (typeof ev.target?.result === 'string') {
        let text = ev.target.result;
        // Truncate very large files with a warning
        if (text.length > 50000) {
          text = text.substring(0, 50000);
          toast('Content was trimmed to 50,000 characters for best results.', { duration: 5000 });
        }
        setContent(text);
        toast.success(`Loaded ${file.name}`);
      }
    };
    reader.onerror = () => toast.error('Failed to read file');
    reader.readAsText(file);
    e.target.value = '';
  };

  // Ctrl/Cmd+Enter to generate
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey) && canGenerate) {
      e.preventDefault();
      handleGenerate();
    }
  }, [canGenerate, handleGenerate]);

  if (isGenerating || generationError) {
    return <GeneratingState onCancel={handleCancel} onRetry={handleRetry} error={generationError} />;
  }

  const glowColor = lensMeta ? lensMeta.accentColor : '#8B5CF6';
  const formatLabel = selectedFormat === 'deep_dive' ? 'Deep Dive' : selectedFormat === 'brief' ? 'Brief' : selectedFormat === 'debate' ? 'Debate' : 'Critique';
  const lengthLabel = selectedLength === 'short' ? '2 min' : selectedLength === 'medium' ? '5 min' : '10 min';

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={{ hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.07 } } }}
      className="flex flex-col items-center w-full min-h-[calc(100vh-160px)] justify-center gap-8 relative"
    >
      {/* Full-page lens color wash — flat color with blur, no gradient */}
      <motion.div
        className="fixed inset-0 pointer-events-none z-0 flex items-start justify-center"
      >
        <motion.div
          className="w-[600px] h-[400px] rounded-full mt-[-100px]"
          animate={{ backgroundColor: lensMeta ? `${glowColor}08` : 'rgba(139,92,246,0.03)' }}
          transition={{ duration: 1, ease: 'easeInOut' }}
          style={{ filter: 'blur(120px)' }}
        />
      </motion.div>

      {/* Ambient glow behind card — flat color with blur, no gradient */}
      <motion.div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-[35%] w-[400px] h-[200px] rounded-full pointer-events-none z-0"
        animate={{ backgroundColor: `${glowColor}0A` }}
        transition={{ duration: 0.8, ease: 'easeInOut' }}
        style={{ filter: 'blur(80px)' }}
      />

      {/* Heading */}
      <motion.div variants={{ hidden: { opacity: 0, y: 10 }, visible: { opacity: 1, y: 0 } }} className="text-center relative z-10">
        <h1 style={{ fontSize: 'clamp(26px, 4.5vw, 40px)', fontWeight: 700, letterSpacing: '-0.035em', lineHeight: 1.1, color: 'var(--text-primary)' }}>
          What do you want to learn?
        </h1>
        <p className="mt-3" style={{ margin: '12px auto 0', fontSize: 'clamp(14px, 1vw, 15px)', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
          Paste text, drop a URL, or speak. Fathom creates your podcast.
        </p>
      </motion.div>

      {/* Composer Card */}
      <motion.div
        variants={{ hidden: { opacity: 0, y: 14 }, visible: { opacity: 1, y: 0 } }}
        className={`w-full relative rounded-2xl overflow-visible ${optionsOpen ? 'z-[60]' : 'z-10'}`}
        onKeyDown={handleKeyDown}
        style={{
          border: isFocused ? `1px solid ${glowColor}30` : '1px solid rgba(255,255,255,0.07)',
          backgroundColor: 'var(--bg-secondary)',
          boxShadow: isFocused
            ? `0 0 0 3px ${glowColor}0A, 0 8px 40px ${glowColor}0D, 0 2px 8px rgba(0,0,0,0.2)`
            : '0 0 0 1px rgba(255,255,255,0.02), 0 4px 20px rgba(0,0,0,0.2)',
          transition: 'border-color 0.3s, box-shadow 0.3s',
        }}
      >
        {/* Textarea */}
        <div className="rounded-t-2xl overflow-hidden">
          <ContentInput onFocusChange={setIsFocused} />
        </div>

        {/* Toolbar */}
        <div className="flex items-center justify-between px-3 py-2.5 border-t border-[var(--border-secondary)]">
          {/* Left side */}
          <div className="flex items-center gap-1.5">
            {/* + Options */}
            <div className="relative">
              <motion.button
                type="button"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                transition={SPRING_SNAPPY}
                onClick={() => setOptionsOpen(!optionsOpen)}
                aria-label="Options"
                aria-expanded={optionsOpen}
                aria-pressed={optionsOpen}
                className="flex items-center justify-center min-h-[48px] min-w-[48px] w-8 h-8 sm:min-h-[40px] sm:min-w-[40px] rounded-full transition-all duration-150 focus:outline-none focus-visible:outline-3 focus-visible:outline-[var(--border-focus)] focus-visible:outline-offset-2"
                style={{ backgroundColor: optionsOpen ? 'var(--bg-tertiary)' : 'transparent', color: optionsOpen ? 'var(--text-primary)' : 'var(--text-tertiary)' }}
              >
                <AnimatePresence mode="wait">
                  {optionsOpen ? (
                    <motion.div key="x" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }} transition={{ duration: 0.15 }}>
                      <X className="w-4 h-4" strokeWidth={2} />
                    </motion.div>
                  ) : (
                    <motion.div key="plus" initial={{ rotate: 90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -90, opacity: 0 }} transition={{ duration: 0.15 }}>
                      <Plus className="w-4 h-4" strokeWidth={2} />
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.button>

              {/* Popover */}
              <AnimatePresence>
                {optionsOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 4, scale: 0.97 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 4, scale: 0.97 }}
                    transition={{ duration: 0.15 }}
                    className="absolute bottom-full left-0 mb-2 w-64 py-2 rounded-xl border border-[var(--border-primary)] bg-[var(--bg-tertiary)] z-[100]"
                    style={{ boxShadow: '0 8px 32px rgba(0,0,0,0.4)' }}
                    role="menu"
                    aria-label="Generation options"
                  >
                    {/* Format */}
                    <div className="px-3.5 py-2">
                      <span className="text-[11px] font-medium uppercase tracking-wider text-[var(--text-muted)]">Format</span>
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {(['deep_dive', 'brief', 'debate', 'critique'] as const).map(f => (
                          <motion.button key={f} type="button" onClick={() => setSelectedFormat(f)}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            transition={SPRING_SNAPPY}
                            aria-label={`Format: ${f === 'deep_dive' ? 'Deep Dive' : f === 'brief' ? 'Brief' : f === 'debate' ? 'Debate' : 'Critique'}`}
                            aria-pressed={selectedFormat === f}
                            className="px-2.5 py-1 min-h-[48px] sm:min-h-[auto] text-[11px] font-medium rounded-full border transition-all duration-150 focus:outline-none focus-visible:outline-3 focus-visible:outline-[var(--border-focus)] focus-visible:outline-offset-2"
                            style={selectedFormat === f
                              ? { backgroundColor: 'var(--accent-muted)', color: 'var(--accent-hover)', borderColor: 'var(--accent)' }
                              : { backgroundColor: 'transparent', color: 'var(--text-tertiary)', borderColor: 'var(--border-primary)' }}>
                            {f === 'deep_dive' ? 'Deep Dive' : f === 'brief' ? 'Brief' : f === 'debate' ? 'Debate' : 'Critique'}
                          </motion.button>
                        ))}
                      </div>
                    </div>
                    <div className="mx-3 my-1 h-px bg-[var(--border-secondary)]" />
                    {/* Length */}
                    <div className="px-3.5 py-2">
                      <span className="text-[11px] font-medium uppercase tracking-wider text-[var(--text-muted)]">Length</span>
                      <div className="flex gap-1.5 mt-2">
                        {(['short', 'medium', 'long'] as const).map(l => (
                          <motion.button key={l} type="button" onClick={() => setSelectedLength(l)}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            transition={SPRING_SNAPPY}
                            aria-label={`Length: ${l === 'short' ? '2 minutes' : l === 'medium' ? '5 minutes' : '10 minutes'}`}
                            aria-pressed={selectedLength === l}
                            className="px-2.5 py-1 min-h-[48px] sm:min-h-[auto] text-[11px] font-medium rounded-full border transition-all duration-150 focus:outline-none focus-visible:outline-3 focus-visible:outline-[var(--border-focus)] focus-visible:outline-offset-2"
                            style={selectedLength === l
                              ? { backgroundColor: 'var(--accent-muted)', color: 'var(--accent-hover)', borderColor: 'var(--accent)' }
                              : { backgroundColor: 'transparent', color: 'var(--text-tertiary)', borderColor: 'var(--border-primary)' }}>
                            {l === 'short' ? '2 min' : l === 'medium' ? '5 min' : '10 min'}
                          </motion.button>
                        ))}
                      </div>
                    </div>
                    <div className="mx-3 my-1 h-px bg-[var(--border-secondary)]" />
                    {/* Attach */}
                    <motion.button type="button" onClick={() => { setOptionsOpen(false); handleFileClick(); }}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      transition={SPRING_SNAPPY}
                      aria-label="Attach file"
                      className="w-full flex items-center gap-2.5 px-3.5 py-2.5 min-h-[48px] sm:min-h-[40px] text-[13px] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-elevated)] transition-colors focus:outline-none focus-visible:outline-3 focus-visible:outline-[var(--border-focus)] focus-visible:outline-offset-2">
                      <Paperclip className="w-4 h-4 text-[var(--text-tertiary)]" strokeWidth={1.75} />
                      <span>Attach file</span>
                    </motion.button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <input ref={fileInputRef} type="file" accept=".txt,.md,.csv,.json,.xml,.html,.htm,.rtf,.log,text/*" className="hidden" onChange={handleFileChange} />

            {/* Lens badge - always visible */}
            <motion.button type="button" onClick={() => setLensPickerOpen(true)}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              transition={SPRING_SNAPPY}
              aria-label={lensMeta ? `Learning lens: ${lensMeta.name}. Click to change` : 'Choose learning lens'}
              className="flex items-center gap-1.5 px-3 py-1.5 min-h-[48px] sm:min-h-[40px] rounded-full text-[12px] font-medium transition-all duration-150 focus:outline-none focus-visible:outline-3 focus-visible:outline-[var(--border-focus)] focus-visible:outline-offset-2"
              style={lensMeta ? {
                backgroundColor: `${lensMeta.accentColor}15`,
                color: lensMeta.accentColor,
                border: `1px solid ${lensMeta.accentColor}30`,
              } : {
                backgroundColor: 'transparent',
                color: 'var(--text-tertiary)',
                border: '1px dashed var(--border-primary)',
              }}>
              {lensMeta ? (
                <>
                  <LensIcon iconName={lensMeta.icon} size={12} strokeWidth={2} color={lensMeta.accentColor} />
                  {lensMeta.name}
                </>
              ) : 'Choose lens'}
            </motion.button>
          </div>

          {/* Right side */}
          <div className="flex items-center gap-1 shrink-0">
            <motion.button type="button" onClick={() => setVoicePickerOpen(true)} aria-label="Choose voices"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              transition={SPRING_SNAPPY}
              className="flex items-center gap-1.5 px-2 py-1.5 min-h-[48px] min-w-[48px] sm:min-h-[40px] sm:min-w-[40px] text-[11px] text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] rounded-lg hover:bg-[var(--bg-tertiary)] transition-colors focus:outline-none focus-visible:outline-3 focus-visible:outline-[var(--border-focus)] focus-visible:outline-offset-2">
              <Users className="w-3.5 h-3.5" strokeWidth={1.75} />
              <span className="hidden sm:inline">Voices</span>
            </motion.button>

            {/* Mic/Send */}
            <motion.button
              type="button"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              transition={SPRING_SNAPPY}
              onClick={hasContent ? handleGenerate : handleMicClick}
              disabled={hasContent ? !canGenerate : isTranscribing}
              aria-label={hasContent ? 'Generate podcast' : isRecording ? 'Stop recording' : 'Voice input'}
              className="flex items-center justify-center min-h-[48px] min-w-[48px] w-8 h-8 sm:min-h-[40px] sm:min-w-[40px] rounded-full transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed focus:outline-none focus-visible:outline-3 focus-visible:outline-[var(--border-focus)] focus-visible:outline-offset-2"
              style={{
                backgroundColor: hasContent ? (canGenerate ? (lensMeta?.accentColor ?? 'var(--accent-primary)') : 'var(--bg-tertiary)') : (isRecording ? 'var(--error)' : 'var(--bg-tertiary)'),
                color: hasContent ? (canGenerate ? '#fff' : 'var(--text-muted)') : (isRecording ? '#fff' : 'var(--text-tertiary)'),
                boxShadow: hasContent && canGenerate ? `0 1px 6px ${lensMeta?.accentColor ?? '#8B5CF6'}40` : 'none',
              }}
            >
              <AnimatePresence mode="wait">
                {isGenerating ? (
                  <motion.div key="loading" initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.5 }}>
                    <Loader2 className="w-4 h-4 animate-spin" strokeWidth={2.5} />
                  </motion.div>
                ) : hasContent ? (
                  <motion.div key="send" initial={{ opacity: 0, scale: 0.5, rotate: 90 }} animate={{ opacity: 1, scale: 1, rotate: 0 }} exit={{ opacity: 0, scale: 0.5, rotate: -90 }} transition={{ duration: 0.15 }}>
                    <ArrowUp className="w-4 h-4" strokeWidth={2.5} />
                  </motion.div>
                ) : (
                  <motion.div key="mic" initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.5 }} transition={{ duration: 0.15 }}>
                    <Mic className="w-4 h-4" strokeWidth={2} />
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.button>
          </div>
        </div>
      </motion.div>

      {/* Suggestion chips */}
      {isFirstRun && (
        <motion.div variants={{ hidden: { opacity: 0, y: 6 }, visible: { opacity: 1, y: 0 } }} className="w-full relative z-10">
          <FirstRunContent />
        </motion.div>
      )}

      <LensPickerDialog open={lensPickerOpen} onOpenChange={setLensPickerOpen} />
      <VoicePickerDialog open={voicePickerOpen} onOpenChange={setVoicePickerOpen} />

      {/* Screen reader announcements for selection changes */}
      <div role="status" aria-live="polite" className="sr-only">
        {lensMeta ? `Learning lens: ${lensMeta.name}` : ''}
        {` Format: ${formatLabel}. Length: ${lengthLabel}.`}
      </div>
    </motion.div>
  );
}
