import { useLocation, useNavigate } from 'react-router-dom';
import { Home, Library, Settings } from 'lucide-react';
import { cn } from '@/lib/utils';

const TABS = [
  { icon: Home, label: 'Home', path: '/' },
  { icon: Library, label: 'Library', path: '/library' },
  { icon: Settings, label: 'Settings', path: '/settings' },
] as const;

export function BottomTabBar() {
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <nav
      className="md:hidden fixed bottom-0 left-0 right-0 h-16 flex items-center justify-around z-40 border-t border-[var(--border-secondary)]"
      style={{
        backgroundColor: 'rgba(10, 10, 12, 0.85)',
        backdropFilter: 'saturate(180%) blur(16px)',
        WebkitBackdropFilter: 'saturate(180%) blur(16px)',
      }}
      aria-label="Bottom navigation"
    >
      {TABS.map(({ icon: Icon, label, path }) => {
        const isActive = location.pathname === path;
        return (
          <button
            key={label}
            onClick={() => navigate(path)}
            aria-label={label}
            aria-current={isActive ? 'page' : undefined}
            className={cn(
              'flex flex-col items-center justify-center gap-1 min-w-[56px] min-h-[48px] py-2 px-3 rounded-xl',
              'focus:outline-none focus-visible:outline-2 focus-visible:outline-[var(--border-focus)] focus-visible:outline-offset-2',
              isActive
                ? 'text-[var(--accent)]'
                : 'text-[var(--text-tertiary)] active:text-[var(--text-secondary)]'
            )}
          >
            <Icon size={22} strokeWidth={isActive ? 2 : 1.75} />
            <span className="text-[11px] font-medium leading-none">{label}</span>
          </button>
        );
      })}
    </nav>
  );
}
