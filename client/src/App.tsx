import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'sonner';
import { useStore } from '@/store';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import { AuthScreen } from '@/screens/AuthScreen';
import { AppLayout } from '@/components/layout/AppLayout';
import { HomeScreen } from '@/screens/HomeScreen';
import { PlayerScreen } from '@/screens/PlayerScreen';
import { LibraryScreen } from '@/screens/LibraryScreen';
import { SettingsScreen } from '@/screens/SettingsScreen';
import { SharePage } from '@/screens/SharePage';

function AuthGuard({ children }: { children: React.ReactNode }) {
  const user = useStore((s) => s.user);
  if (!user) return <Navigate to="/auth" replace />;
  return <>{children}</>;
}

/** Inner component that has access to Router context for keyboard shortcuts */
function AppShell() {
  useKeyboardShortcuts();
  const user = useStore((s) => s.user);
  const logout = useStore((s) => s.logout);

  // Validate session on app load — if user ID is stale (server restarted), clear it
  useEffect(() => {
    if (!user) return;
    fetch('/api/health', { headers: { 'X-User-Id': user.id } })
      .then((res) => {
        if (!res.ok) throw new Error('Health check failed');
        // Also validate user exists by hitting tracks endpoint
        return fetch('/api/tracks', { headers: { 'X-User-Id': user.id } });
      })
      .then((res) => {
        if (res.status === 401) {
          console.warn('[App] Stale session detected, logging out');
          logout();
        }
      })
      .catch(() => {
        // Server unreachable — don't logout, might be temporary
      });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <>
      <Routes>
        {/* Public routes */}
        <Route
          path="/auth"
          element={user ? <Navigate to="/" replace /> : <AuthScreen />}
        />
        <Route path="/share/:shareId" element={<SharePage />} />

        {/* Authenticated routes with layout */}
        <Route
          element={
            <AuthGuard>
              <AppLayout />
            </AuthGuard>
          }
        >
          <Route path="/" element={<HomeScreen />} />
          <Route path="/player/:id" element={<PlayerScreen />} />
          <Route path="/library" element={<LibraryScreen />} />
          <Route path="/settings" element={<SettingsScreen />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}

function App() {
  return (
    <BrowserRouter>
      <Toaster
        position="top-center"
        duration={3000}
        toastOptions={{
          style: {
            background: 'var(--bg-secondary)',
            border: '1px solid var(--border-primary)',
            color: 'var(--text-primary)',
          },
        }}
      />
      <AppShell />
    </BrowserRouter>
  );
}

export default App;
