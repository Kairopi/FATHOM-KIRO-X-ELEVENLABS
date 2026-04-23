import { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Headphones } from 'lucide-react';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import { useStore } from '@/store';
import { STAGGER_NORMAL } from '@/lib/motion';
import { TrackRow } from '@/components/library/TrackRow';
import { FilterControls } from '@/components/library/FilterControls';
import { TrackContextMenu } from '@/components/library/TrackContextMenu';
import { SkeletonTrackRow } from '@/components/ui/skeleton';
import type { Track, LearningLens } from '@/types';

export function LibraryScreen() {
  const navigate = useNavigate();
  const tracks = useStore((s) => s.tracks);
  const setTracks = useStore((s) => s.setTracks);
  const setTrack = useStore((s) => s.setTrack);
  const [search, setSearch] = useState('');
  const [lensFilter, setLensFilter] = useState<LearningLens | null>(null);
  const [favoritesOnly, setFavoritesOnly] = useState(false);
  const [loading, setLoading] = useState(true);
  const [contextMenu, setContextMenu] = useState<{
    track: Track; position: { x: number; y: number };
  } | null>(null);

  useEffect(() => {
    setLoading(true);
    api.get<Track[]>('/api/tracks')
      .then((data) => setTracks(data))
      .catch((err) => {
        console.error('[Library] Failed to fetch tracks:', err);
      })
      .finally(() => setLoading(false));
  }, [setTracks]);

  const filteredTracks = useMemo(() => {
    let result = tracks;
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter((t) => t.title.toLowerCase().includes(q));
    }
    if (lensFilter) result = result.filter((t) => t.lens === lensFilter);
    if (favoritesOnly) result = result.filter((t) => t.isFavorite);
    return result;
  }, [tracks, search, lensFilter, favoritesOnly]);

  const handlePlay = useCallback((track: Track) => {
    setTrack(track); navigate(`/player/${track.id}`);
  }, [navigate, setTrack]);
  const handleContextMenu = useCallback((e: React.MouseEvent, track: Track) => {
    e.preventDefault(); setContextMenu({ track, position: { x: e.clientX, y: e.clientY } });
  }, []);
  const handleToggleFavorite = useCallback(async (track: Track) => {
    try {
      const updated = await api.patch<Track>(`/api/tracks/${track.id}/favorite`);
      const current = useStore.getState().tracks;
      setTracks(current.map((t) => (t.id === updated.id ? updated : t)));
    } catch {}
  }, [setTracks]);
  const handleShare = useCallback((track: Track) => {
    navigator.clipboard.writeText(`${window.location.origin}/share/${track.shareId}`)
      .then(() => toast.success('Share link copied'));
  }, []);
  const handleDelete = useCallback(async (track: Track) => {
    try {
      await api.delete(`/api/tracks/${track.id}`);
      const current = useStore.getState().tracks;
      setTracks(current.filter((t) => t.id !== track.id));
      toast.success('Track deleted');
    } catch {}
  }, [setTracks]);

  return (
    <div className="flex flex-col gap-10 w-full">
      <motion.h1 
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        className="text-h1 text-[var(--text-primary)]"
      >
        Library
      </motion.h1>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-[var(--text-muted)]" strokeWidth={2} aria-hidden="true" />
        <motion.input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search tracks..."
          transition={{ duration: 0.15 }}
          className="w-full pl-11 pr-4 py-2.5 min-h-[48px] sm:min-h-[40px] text-body bg-[var(--bg-secondary)] border border-[var(--border-primary)] rounded-[var(--radius-button)] text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--border-focus)] transition-colors"
          aria-label="Search tracks"
        />
      </div>

      <FilterControls
        selectedLens={lensFilter}
        onLensChange={setLensFilter}
        favoritesOnly={favoritesOnly}
        onFavoritesToggle={() => setFavoritesOnly(!favoritesOnly)}
      />

      {/* Screen reader announcement for filtered results */}
      <div role="status" aria-live="polite" className="sr-only">
        {loading ? 'Loading tracks...' : `${filteredTracks.length} track${filteredTracks.length !== 1 ? 's' : ''} found`}
      </div>

      {loading ? (
        <motion.div
          initial="hidden"
          animate="visible"
          variants={{
            visible: { transition: { staggerChildren: STAGGER_NORMAL } },
          }}
          className="flex flex-col gap-2"
        >
          {Array.from({ length: 5 }).map((_, i) => (
            <motion.div
              key={i}
              variants={{
                hidden: { opacity: 0, y: 4 },
                visible: { opacity: 1, y: 0 },
              }}
            >
              <SkeletonTrackRow />
            </motion.div>
          ))}
        </motion.div>
      ) : filteredTracks.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-4 py-20">
          <div className="w-16 h-16 rounded-full bg-[var(--bg-secondary)] border border-[var(--border-primary)] flex items-center justify-center">
            <Headphones className="w-7 h-7 text-[var(--text-tertiary)]" strokeWidth={1.75} />
          </div>
          <p className="text-body text-[var(--text-tertiary)]">
            {tracks.length === 0 ? 'No tracks yet. Generate your first podcast!' : 'No matching tracks'}
          </p>
        </div>
      ) : (
        <motion.div 
          initial="hidden" 
          animate="visible" 
          variants={{
            hidden: { opacity: 0 },
            visible: { 
              opacity: 1,
              transition: { staggerChildren: STAGGER_NORMAL } 
            }
          }}
          className="flex flex-col gap-2"
        >
          {filteredTracks.map((track) => (
            <TrackRow key={track.id} track={track} onPlay={handlePlay} onContextMenu={handleContextMenu} onToggleFavorite={handleToggleFavorite} />
          ))}
        </motion.div>
      )}

      <AnimatePresence>
        {contextMenu && (
          <TrackContextMenu track={contextMenu.track} position={contextMenu.position} onClose={() => setContextMenu(null)} onPlay={handlePlay} onShare={handleShare} onDelete={handleDelete} />
        )}
      </AnimatePresence>
    </div>
  );
}
