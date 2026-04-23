import { useCallback, useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Check } from 'lucide-react';
import { LensIcon } from '@/components/ui/LensIcon';
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
import { ALL_LENSES, getLensMetadata } from '@/lib/lenses';
import { SPRING_SNAPPY } from '@/lib/motion';
import { useStore } from '@/store';
import { useIsMobile } from '@/hooks/useIsMobile';
import type { LearningLens } from '@/types';
import type { LensMetadata } from '@/lib/lenses';

interface LensPickerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function LensCard({ meta, isSelected, onSelect, index, disabled }: {
  meta: LensMetadata;
  isSelected: boolean;
  onSelect: () => void;
  index: number;
  disabled?: boolean;
}) {
  return (
    <motion.button
      type="button"
      disabled={disabled}
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ ...SPRING_SNAPPY, delay: index * 0.025 }}
      whileHover={!isSelected ? { y: -1, backgroundColor: 'var(--bg-tertiary)' } : {}}
      whileTap={{ scale: 0.98 }}
      onClick={onSelect}
      aria-label={`Select ${meta.name} lens`}
      aria-pressed={isSelected}
      className="flex items-center gap-3.5 px-3.5 py-3 w-full text-left rounded-xl cursor-pointer outline-none focus-visible:outline-3 focus-visible:outline-[var(--border-focus)] focus-visible:outline-offset-2 transition-all duration-200"
      style={{
        backgroundColor: isSelected ? `${meta.accentColor}0C` : 'transparent',
        border: isSelected ? `1.5px solid ${meta.accentColor}40` : '1.5px solid transparent',
      }}
    >
      {/* Icon with accent glow */}
      <div className="shrink-0 w-11 h-11 rounded-xl flex items-center justify-center relative"
        style={{ backgroundColor: `${meta.accentColor}14` }}>
        <LensIcon iconName={meta.icon} size={22} strokeWidth={1.75} color={meta.accentColor} />
        {isSelected && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute -top-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center"
            style={{ backgroundColor: meta.accentColor }}
          >
            <Check className="w-2.5 h-2.5 text-white" strokeWidth={3} />
          </motion.div>
        )}
      </div>

      {/* Text */}
      <div className="flex-1 min-w-0 overflow-hidden">
        <div className="text-[14px] font-semibold text-[var(--text-primary)]">{meta.name}</div>
        <div className="text-[12px] text-[var(--text-tertiary)] leading-relaxed line-clamp-2 mt-0.5">{meta.description}</div>
      </div>
    </motion.button>
  );
}

function LensGrid({ onSelect }: { onSelect: (lens: LearningLens) => void }) {
  const selectedLens = useStore((s) => s.selectedLens);

  return (
    <>
      <div role="status" aria-live="polite" className="sr-only">
        {selectedLens ? `${getLensMetadata(selectedLens).name} lens selected` : ''}
      </div>
      <div role="listbox" aria-label="Learning lenses" className="flex flex-col gap-0.5 mt-1 max-h-[55vh] overflow-y-auto">
      {ALL_LENSES.map((lens, index) => {
        const meta = getLensMetadata(lens);
        return (
          <LensCard
            key={lens}
            meta={meta}
            isSelected={selectedLens === lens}
            onSelect={() => onSelect(lens)}
            index={index}
          />
        );
      })}
      </div>
    </>
  );
}

export function LensPickerDialog({ open, onOpenChange }: LensPickerDialogProps) {
  const setSelectedLens = useStore((s) => s.setSelectedLens);
  const isMobile = useIsMobile();
  const [previews, setPreviews] = useState<Record<string, string> | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (!open || previews) return;
    fetch('/api/lens-previews')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => { if (data) setPreviews(data); })
      .catch(() => {});
  }, [open, previews]);

  const playPreview = useCallback((lens: LearningLens) => {
    if (!previews?.[lens]) return;
    if (audioRef.current) { audioRef.current.pause(); audioRef.current.currentTime = 0; }
    const audio = new Audio(previews[lens]);
    audioRef.current = audio;
    audio.play().catch(() => {});
    setTimeout(() => { audio.pause(); audio.currentTime = 0; }, 2000);
  }, [previews]);

  useEffect(() => {
    if (!open && audioRef.current) { audioRef.current.pause(); audioRef.current = null; }
  }, [open]);

  const handleSelect = (lens: LearningLens) => {
    setSelectedLens(lens);
    playPreview(lens);
    onOpenChange(false);
  };

  const title = "Choose a learning lens";
  const subtitle = "This shapes the tone and style of your podcast";

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={onOpenChange}>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>{title}</DrawerTitle>
          </DrawerHeader>
          <div className="px-4 pb-6 overflow-y-auto max-h-[70vh]">
            <LensGrid onSelect={handleSelect} />
          </div>
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md bg-[var(--bg-secondary)] border-[var(--border-primary)]" showCloseButton>
        <DialogHeader>
          <DialogTitle className="text-[var(--text-primary)]">{title}</DialogTitle>
          <p className="text-xs text-[var(--text-tertiary)] mt-1">{subtitle}</p>
        </DialogHeader>
        <LensGrid onSelect={handleSelect} />
      </DialogContent>
    </Dialog>
  );
}
