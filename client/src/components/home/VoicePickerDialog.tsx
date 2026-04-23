import { useCallback, useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Play, Square } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer';
import { PRESET_VOICES } from '@/lib/voices';
import { SPRING_SNAPPY } from '@/lib/motion';
import { useStore } from '@/store';
import { useIsMobile } from '@/hooks/useIsMobile';
import type { VoiceMetadata } from '@/lib/voices';

interface VoicePickerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function VoiceRow({
  voice,
  customName,
  isSelected,
  isPlaying,
  onSelect,
  onPreview,
  onRename,
}: {
  voice: VoiceMetadata;
  customName?: string;
  isSelected: boolean;
  isPlaying: boolean;
  onSelect: () => void;
  onPreview: () => void;
  onRename: (name: string) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [editValue, setEditValue] = useState(customName || voice.name);
  const inputRef = useRef<HTMLInputElement>(null);

  const displayName = customName || voice.name;

  const handleStartEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    setEditValue(displayName);
    setEditing(true);
    setTimeout(() => inputRef.current?.select(), 10);
  };

  const handleFinishEdit = () => {
    const trimmed = editValue.trim();
    if (trimmed && trimmed !== voice.name) {
      onRename(trimmed);
    } else if (!trimmed || trimmed === voice.name) {
      onRename(''); // reset to default
    }
    setEditing(false);
  };

  return (
    <motion.button
      type="button"
      whileTap={!editing ? { scale: 0.98 } : {}}
      whileHover={!isSelected && !editing ? { y: -1, backgroundColor: 'var(--bg-tertiary)' } : {}}
      transition={SPRING_SNAPPY}
      onClick={!editing ? onSelect : undefined}
      aria-label={`Select ${displayName}`}
      aria-pressed={isSelected}
      className="flex items-center gap-3.5 px-3.5 py-2.5 w-full text-left rounded-xl cursor-pointer outline-none transition-all duration-200 focus-visible:outline-3 focus-visible:outline-[var(--border-focus)] focus-visible:outline-offset-2"
      style={{
        backgroundColor: isSelected ? 'rgba(139,92,246,0.08)' : 'transparent',
        border: isSelected ? '1.5px solid rgba(139,92,246,0.25)' : '1.5px solid transparent',
      }}
    >
      {/* Voice avatar */}
      <div className="shrink-0 w-9 h-9 rounded-full flex items-center justify-center text-[12px] font-bold"
        style={{
          backgroundColor: isSelected ? 'var(--accent-primary)' : 'var(--bg-tertiary)',
          color: isSelected ? '#fff' : 'var(--text-tertiary)',
          border: isSelected ? 'none' : '1px solid var(--border-primary)',
        }}>
        {displayName[0]}
      </div>

      {/* Voice info */}
      <div className="flex-1 min-w-0">
        {editing ? (
          <input
            ref={inputRef}
            type="text"
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onBlur={handleFinishEdit}
            onKeyDown={(e) => { if (e.key === 'Enter') handleFinishEdit(); if (e.key === 'Escape') setEditing(false); }}
            onClick={(e) => e.stopPropagation()}
            className="w-full text-[13px] font-semibold text-[var(--text-primary)] bg-[var(--bg-tertiary)] border border-[var(--border-focus)] rounded px-1.5 py-0.5 outline-none"
            autoFocus
          />
        ) : (
          <div className="flex items-center gap-1.5 group">
            <span className="text-[13px] font-semibold text-[var(--text-primary)]">{displayName}</span>
            <button type="button" onClick={handleStartEdit}
              className="opacity-0 group-hover:opacity-100 text-[10px] text-[var(--text-muted)] hover:text-[var(--text-tertiary)] transition-opacity"
              aria-label={`Rename ${displayName}`}>
              edit
            </button>
          </div>
        )}
        <div className="text-[11px] text-[var(--text-tertiary)]">{voice.description}</div>
      </div>

      {/* Preview button */}
      <motion.button
        type="button"
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={(e) => { e.stopPropagation(); onPreview(); }}
        aria-label={isPlaying ? `Stop preview` : `Preview ${displayName}`}
        className="shrink-0 w-8 h-8 flex items-center justify-center rounded-full transition-all duration-200"
        style={{
          backgroundColor: isPlaying ? 'var(--accent-primary)' : 'var(--bg-tertiary)',
          color: isPlaying ? '#fff' : 'var(--text-tertiary)',
          border: isPlaying ? 'none' : '1px solid var(--border-primary)',
        }}
      >
        {isPlaying ? (
          <Square className="w-3 h-3 fill-current" strokeWidth={0} />
        ) : (
          <Play className="w-3 h-3 ml-0.5" strokeWidth={2.5} />
        )}
      </motion.button>
    </motion.button>
  );
}

function VoiceContent({
  playingVoiceId,
  onSelectExplainer,
  onSelectLearner,
  onPreview,
}: {
  playingVoiceId: string | null;
  onSelectExplainer: (voice: VoiceMetadata) => void;
  onSelectLearner: (voice: VoiceMetadata) => void;
  onPreview: (voiceId: string) => void;
}) {
  const voicePair = useStore((s) => s.voicePair);
  const customVoiceNames = useStore((s) => s.customVoiceNames);
  const setCustomVoiceName = useStore((s) => s.setCustomVoiceName);

  return (
    <div className="flex flex-col gap-5 mt-1">
      {/* Explainer */}
      <div>
        <div className="flex items-center gap-2 mb-2 px-1">
          <div className="w-1.5 h-1.5 rounded-full bg-[var(--accent-primary)]" />
          <span className="text-[11px] font-semibold uppercase tracking-wider text-[var(--text-tertiary)]">Explainer</span>
        </div>
        <div className="flex flex-col gap-0.5">
          {PRESET_VOICES.map((voice) => (
            <VoiceRow
              key={`e-${voice.id}`}
              voice={voice}
              customName={customVoiceNames[voice.id]}
              isSelected={voicePair.explainer.voiceId === voice.id}
              isPlaying={playingVoiceId === voice.id}
              onSelect={() => onSelectExplainer(voice)}
              onPreview={() => onPreview(voice.id)}
              onRename={(name) => setCustomVoiceName(voice.id, name)}
            />
          ))}
        </div>
      </div>
      <div className="h-px bg-[var(--border-secondary)]" />
      {/* Learner */}
      <div>
        <div className="flex items-center gap-2 mb-2 px-1">
          <div className="w-1.5 h-1.5 rounded-full bg-[var(--accent-secondary)]" />
          <span className="text-[11px] font-semibold uppercase tracking-wider text-[var(--text-tertiary)]">Learner</span>
        </div>
        <div className="flex flex-col gap-0.5">
          {PRESET_VOICES.map((voice) => (
            <VoiceRow
              key={`l-${voice.id}`}
              voice={voice}
              customName={customVoiceNames[voice.id]}
              isSelected={voicePair.learner.voiceId === voice.id}
              isPlaying={playingVoiceId === voice.id}
              onSelect={() => onSelectLearner(voice)}
              onPreview={() => onPreview(voice.id)}
              onRename={(name) => setCustomVoiceName(voice.id, name)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

export function VoicePickerDialog({ open, onOpenChange }: VoicePickerDialogProps) {
  const voicePair = useStore((s) => s.voicePair);
  const setVoicePair = useStore((s) => s.setVoicePair);
  const isMobile = useIsMobile();
  const [playingVoiceId, setPlayingVoiceId] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const stopPreview = useCallback(() => {
    if (audioRef.current) { audioRef.current.pause(); audioRef.current.currentTime = 0; audioRef.current = null; }
    setPlayingVoiceId(null);
  }, []);

  const playPreview = useCallback((voiceId: string) => {
    stopPreview();
    if (playingVoiceId === voiceId) return;
    const audio = new Audio(`/api/voice-preview/${voiceId}`);
    audioRef.current = audio;
    setPlayingVoiceId(voiceId);
    audio.addEventListener('ended', () => setPlayingVoiceId(null));
    audio.addEventListener('error', () => setPlayingVoiceId(null));
    audio.play().catch(() => setPlayingVoiceId(null));
  }, [playingVoiceId, stopPreview]);

  useEffect(() => { if (!open) stopPreview(); }, [open, stopPreview]);

  const handleSelectExplainer = (voice: VoiceMetadata) => {
    setVoicePair({ ...voicePair, explainer: { voiceId: voice.id, name: voice.name } });
  };
  const handleSelectLearner = (voice: VoiceMetadata) => {
    setVoicePair({ ...voicePair, learner: { voiceId: voice.id, name: voice.name } });
  };

  const title = "Choose voices";
  const subtitle = `${voicePair.explainer.name} explains, ${voicePair.learner.name} asks questions`;

  const content = (
    <VoiceContent
      playingVoiceId={playingVoiceId}
      onSelectExplainer={handleSelectExplainer}
      onSelectLearner={handleSelectLearner}
      onPreview={playPreview}
    />
  );

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={onOpenChange}>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>{title}</DrawerTitle>
          </DrawerHeader>
          <div className="px-4 pb-6 overflow-y-auto max-h-[70vh]">{content}</div>
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md bg-[var(--bg-secondary)] border-[var(--border-primary)]" showCloseButton>
        <DialogHeader>
          <DialogTitle className="text-[var(--text-primary)]">{title}</DialogTitle>
          <p className="text-[13px] text-[var(--text-tertiary)] mt-1">{subtitle}</p>
        </DialogHeader>
        <div className="max-h-[60vh] overflow-y-auto -mx-1 px-1">{content}</div>
      </DialogContent>
    </Dialog>
  );
}
