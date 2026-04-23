import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ALL_LENSES, getLensMetadata } from '@/lib/lenses';
import { LensIcon } from '@/components/ui/LensIcon';
import { SPRING_SNAPPY } from '@/lib/motion';
import { useStore } from '@/store';
import { LensPickerDialog } from './LensPickerDialog';

export function LensPills() {
  const selectedLens = useStore((s) => s.selectedLens);
  const storeLensPickerOpen = useStore((s) => s.lensPickerOpen);
  const setStoreLensPickerOpen = useStore((s) => s.setLensPickerOpen);
  const [pickerOpen, setPickerOpen] = useState(false);

  useEffect(() => {
    if (storeLensPickerOpen) {
      setPickerOpen(true);
      setStoreLensPickerOpen(false);
    }
  }, [storeLensPickerOpen, setStoreLensPickerOpen]);

  return (
    <>
      <div
        className="flex gap-1.5 overflow-x-auto flex-1"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        role="listbox"
        aria-label="Learning lens options"
      >
        {ALL_LENSES.map((lens) => {
          const meta = getLensMetadata(lens);
          const isSelected = selectedLens === lens;

          return (
            <motion.button
              key={lens}
              type="button"
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.96 }}
              transition={SPRING_SNAPPY}
              onClick={() => setPickerOpen(true)}
              role="option"
              aria-selected={isSelected}
              aria-label={`${meta.name} lens`}
              className="flex items-center gap-1.5 shrink-0 px-2.5 py-1.5 text-[12px] font-medium rounded-full border cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-[var(--border-focus)] transition-all duration-150"
              style={
                isSelected
                  ? {
                      backgroundColor: `${meta.accentColor}18`,
                      borderColor: `${meta.accentColor}50`,
                      color: meta.accentColor,
                    }
                  : {
                      backgroundColor: 'transparent',
                      borderColor: 'var(--border-primary)',
                      color: 'var(--text-tertiary)',
                    }
              }
            >
              <LensIcon iconName={meta.icon} size={14} strokeWidth={isSelected ? 2 : 1.75} color={isSelected ? meta.accentColor : undefined} />
              <span>{meta.name}</span>
            </motion.button>
          );
        })}
      </div>
      <LensPickerDialog open={pickerOpen} onOpenChange={setPickerOpen} />
    </>
  );
}
