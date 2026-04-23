import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Heart, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ALL_LENSES, getLensMetadata } from '@/lib/lenses';
import { LensIcon } from '@/components/ui/LensIcon';
import { SPRING_SNAPPY } from '@/lib/motion';
import type { LearningLens } from '@/types';

interface Props {
  selectedLens: LearningLens | null;
  onLensChange: (lens: LearningLens | null) => void;
  favoritesOnly: boolean;
  onFavoritesToggle: () => void;
}

export function FilterControls({ selectedLens, onLensChange, favoritesOnly, onFavoritesToggle }: Props) {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    }
    if (dropdownOpen) {
      document.addEventListener('mousedown', handleClick);
      return () => document.removeEventListener('mousedown', handleClick);
    }
  }, [dropdownOpen]);

  const currentLensMeta = selectedLens ? getLensMetadata(selectedLens) : null;

  return (
    <div className="flex items-center gap-2">
      {/* Lens filter dropdown */}
      <div className="relative" ref={dropdownRef}>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          transition={SPRING_SNAPPY}
          onClick={() => setDropdownOpen(!dropdownOpen)}
          className={cn(
            'flex items-center gap-1.5 px-3 py-1.5 min-h-[48px] sm:min-h-[40px] min-w-[48px] sm:min-w-[40px] text-xs font-medium rounded-[var(--radius-button)]',
            'border border-[var(--border-primary)] transition-colors',
            selectedLens
              ? 'text-[var(--text-primary)] bg-[var(--bg-tertiary)]'
              : 'text-[var(--text-secondary)] bg-transparent hover:bg-[var(--bg-tertiary)]'
          )}
          aria-label="Filter by lens"
          aria-expanded={dropdownOpen}
        >
          {currentLensMeta ? (
            <>
              <LensIcon iconName={currentLensMeta.icon} size={14} strokeWidth={1.75} color={currentLensMeta.accentColor} />
              <span>{currentLensMeta.name}</span>
            </>
          ) : (
            <span>All Lenses</span>
          )}
          <ChevronDown className="w-3.5 h-3.5" strokeWidth={2} />
        </motion.button>

        {dropdownOpen && (
          <div
            className="absolute top-full left-0 mt-1 z-50 min-w-[160px] py-1 bg-[var(--bg-tertiary)] border border-[var(--border-primary)] rounded-[var(--radius-button)]"
            style={{ boxShadow: '0 8px 24px rgba(0,0,0,0.3)' }}
            role="menu"
            aria-label="Lens filter options"
          >
            <button
              onClick={() => { onLensChange(null); setDropdownOpen(false); }}
              className={cn(
                'w-full text-left px-3 py-1.5 min-h-[48px] sm:min-h-[40px] text-xs transition-colors hover:bg-[var(--bg-secondary)] flex items-center',
                !selectedLens ? 'text-[var(--text-primary)] font-medium' : 'text-[var(--text-secondary)]'
              )}
              role="menuitem"
              aria-label="Show all lenses"
            >
              All Lenses
            </button>
            {ALL_LENSES.map((lens) => {
              const meta = getLensMetadata(lens);
              return (
                <button
                  key={lens}
                  onClick={() => { onLensChange(lens); setDropdownOpen(false); }}
                  className={cn(
                    'w-full text-left px-3 py-1.5 min-h-[48px] sm:min-h-[40px] text-xs transition-colors hover:bg-[var(--bg-secondary)] flex items-center gap-2',
                    selectedLens === lens ? 'text-[var(--text-primary)] font-medium' : 'text-[var(--text-secondary)]'
                  )}
                  role="menuitem"
                  aria-label={`Filter by ${meta.name}`}
                >
                  <LensIcon iconName={meta.icon} size={14} strokeWidth={1.75} color={selectedLens === lens ? meta.accentColor : undefined} />
                  <span>{meta.name}</span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Favorites toggle */}
      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        transition={SPRING_SNAPPY}
        onClick={onFavoritesToggle}
        className={cn(
          'flex items-center gap-1.5 px-3 py-1.5 min-h-[48px] sm:min-h-[40px] min-w-[48px] sm:min-w-[40px] text-xs font-medium rounded-[var(--radius-button)]',
          'border border-[var(--border-primary)] transition-colors',
          favoritesOnly
            ? 'text-[var(--error)] bg-[var(--bg-tertiary)]'
            : 'text-[var(--text-secondary)] bg-transparent hover:bg-[var(--bg-tertiary)]'
        )}
        aria-label={favoritesOnly ? 'Show all tracks' : 'Show favorites only'}
        aria-pressed={favoritesOnly}
      >
        <Heart className={cn('w-3.5 h-3.5', favoritesOnly && 'fill-[var(--error)]')} strokeWidth={2} />
        <span>Favorites</span>
      </motion.button>
    </div>
  );
}
