import { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Play, Share2, Trash2 } from 'lucide-react';
import { SPRING_GENTLE } from '@/lib/motion';
import type { Track } from '@/types';

interface Props {
  track: Track;
  position: { x: number; y: number };
  onClose: () => void;
  onPlay: (track: Track) => void;
  onShare: (track: Track) => void;
  onDelete: (track: Track) => void;
}

const MENU_ITEMS = [
  { key: 'play', label: 'Play', icon: Play, action: 'onPlay' as const },
  { key: 'share', label: 'Share', icon: Share2, action: 'onShare' as const },
  { key: 'delete', label: 'Delete', icon: Trash2, action: 'onDelete' as const, danger: true },
];

export function TrackContextMenu({ track, position, onClose, onPlay, onShare, onDelete }: Props) {
  const menuRef = useRef<HTMLDivElement>(null);
  const isOwner = (track as any).isOwner;

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    }
    function handleEscape(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    document.addEventListener('mousedown', handleClick);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handleClick);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [onClose]);

  const actions = { onPlay, onShare, onDelete };
  
  // Filter menu items: only show delete if user owns the track
  const menuItems = MENU_ITEMS.filter(item => item.key !== 'delete' || isOwner);

  return (
    <motion.div
      ref={menuRef}
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.98 }}
      transition={SPRING_GENTLE}
      className="fixed z-50 min-w-[140px] py-1 bg-[var(--bg-tertiary)] border border-[var(--border-primary)] rounded-[var(--radius-button)]"
      style={{
        top: position.y,
        left: position.x,
        boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
      }}
      role="menu"
      aria-label="Track actions"
    >
      {menuItems.map((item) => (
        <button
          key={item.key}
          onClick={() => {
            actions[item.action](track);
            onClose();
          }}
          className={`w-full text-left px-3 py-1.5 min-h-[48px] sm:min-h-[40px] text-xs flex items-center gap-2 transition-colors hover:bg-[var(--bg-secondary)] ${
            item.danger ? 'text-[var(--error)]' : 'text-[var(--text-secondary)]'
          }`}
          role="menuitem"
          aria-label={`${item.label} track`}
        >
          <item.icon className="w-4 h-4" strokeWidth={2} />
          <span>{item.label}</span>
        </button>
      ))}
    </motion.div>
  );
}
