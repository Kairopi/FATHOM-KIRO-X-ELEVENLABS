import { Outlet, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Sidebar } from './Sidebar';
import { BottomTabBar } from './BottomTabBar';
import { MiniPlayer } from './MiniPlayer';
import { useStore } from '@/store';
import { PAGE_VARIANTS, PAGE_TRANSITION } from '@/lib/motion';

export function AppLayout() {
  const currentTrack = useStore((s) => s.currentTrack);
  const hasMiniPlayer = !!currentTrack;
  const location = useLocation();

  return (
    <div className="min-h-screen bg-[var(--bg-primary)]">
      <Sidebar />
      <BottomTabBar />
      <MiniPlayer />

      <main
        className={`
          pt-16 md:pt-[60px]
          ${hasMiniPlayer ? 'pb-[160px] md:pb-[80px]' : 'pb-[80px] md:pb-8'}
        `}
      >
        <div
          style={{
            width: '100%',
            maxWidth: '800px',
            marginLeft: 'auto',
            marginRight: 'auto',
            paddingLeft: '16px',
            paddingRight: '16px',
            position: 'relative',
            minHeight: '100vh'
          }}
        >
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ 
                duration: 0.3,
                ease: "easeInOut"
              }}
              style={{
                position: 'absolute',
                width: '100%',
                top: 0,
                left: 0
              }}
            >
              <Outlet />
            </motion.div>
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}
