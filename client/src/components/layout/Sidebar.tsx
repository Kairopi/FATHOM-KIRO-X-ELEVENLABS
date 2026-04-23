import { useLocation, useNavigate } from 'react-router-dom';
import { Home, Library, Settings } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { SPRING_SNAPPY } from '@/lib/motion';

const NAV_ITEMS = [
  { icon: Home, label: 'Home', path: '/' },
  { icon: Library, label: 'Library', path: '/library' },
  { icon: Settings, label: 'Settings', path: '/settings' },
] as const;

export function Sidebar() {
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <>
      {/* Desktop navbar */}
      <nav
        className="hidden md:flex fixed top-0 left-0 right-0 h-[52px] items-center justify-between px-5 z-40 border-b border-[var(--border-secondary)]"
        style={{
          backgroundColor: 'rgba(10, 10, 12, 0.8)',
          backdropFilter: 'saturate(180%) blur(16px)',
          WebkitBackdropFilter: 'saturate(180%) blur(16px)',
        }}
        aria-label="Main navigation"
      >
        {/* Brand */}
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          transition={SPRING_SNAPPY}
          onClick={() => navigate('/')}
          className="flex items-center gap-3 group focus:outline-none focus-visible:outline-2 focus-visible:outline-[var(--border-focus)] focus-visible:outline-offset-2 rounded-lg"
          aria-label="Go to home page"
        >
          <img src="/logo.svg" alt="" className="w-7 h-7" style={{ borderRadius: '8px' }} />
          <span className="text-[13px] font-semibold text-[var(--text-primary)] group-hover:text-[var(--accent-hover)] transition-colors" style={{ letterSpacing: '-0.025em' }}>
            Fathom
          </span>
        </motion.button>

        {/* Nav items */}
        <div className="flex items-center gap-0.5">
          {NAV_ITEMS.map(({ icon: Icon, label, path }) => {
            const isActive = location.pathname === path;
            return (
              <motion.button
                key={label}
                whileHover={!isActive ? { backgroundColor: 'var(--bg-tertiary)' } : {}}
                whileTap={{ scale: 0.97 }}
                transition={SPRING_SNAPPY}
                onClick={() => navigate(path)}
                aria-label={label}
                aria-current={isActive ? 'page' : undefined}
                className={cn(
                  'relative flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-all duration-100',
                  'focus:outline-none focus-visible:outline-2 focus-visible:outline-[var(--border-focus)] focus-visible:outline-offset-2',
                  isActive
                    ? 'text-[var(--text-primary)] bg-[var(--bg-tertiary)]'
                    : 'text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]'
                )}
              >
                <Icon size={16} strokeWidth={isActive ? 2 : 1.75} />
                <span className="text-[13px] font-medium">{label}</span>
              </motion.button>
            );
          })}
        </div>
      </nav>

      <nav className="md:hidden hidden" aria-label="Main navigation" />
    </>
  );
}
