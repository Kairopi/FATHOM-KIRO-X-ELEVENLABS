import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '@/store';

/** Tags where we should NOT intercept Space, N, M, etc. */
const TEXT_INPUT_TAGS = new Set(['INPUT', 'TEXTAREA', 'SELECT']);

function isTextInput(el: Element | null): boolean {
  if (!el) return false;
  if (TEXT_INPUT_TAGS.has(el.tagName)) return true;
  if ((el as HTMLElement).isContentEditable) return true;
  return false;
}

/**
 * Global keyboard shortcuts hook.
 * Mount once at the App level.
 *
 * - Space: toggle play/pause (Req 8.5)
 * - ArrowRight: skip forward 15s (Req 8.6)
 * - ArrowLeft: skip backward 15s (Req 8.7)
 * - M: toggle mute (Req 8.8)
 * - Escape: close dialogs/modals (Req 15.1)
 * - N: navigate to Home for new generation (Req 15.2)
 */
export function useKeyboardShortcuts() {
  const navigate = useNavigate();

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      const active = document.activeElement;
      const inTextInput = isTextInput(active);

      switch (e.key) {
        case ' ': {
          // Only toggle play/pause when NOT in a text input
          if (inTextInput) return;
          e.preventDefault();
          window.dispatchEvent(new CustomEvent('fathom:play-pause'));
          break;
        }

        case 'ArrowRight': {
          if (inTextInput) return;
          e.preventDefault();
          // Dispatch a custom event that WaveformPlayer can listen to
          window.dispatchEvent(new CustomEvent('fathom:skip-forward'));
          break;
        }

        case 'ArrowLeft': {
          if (inTextInput) return;
          e.preventDefault();
          window.dispatchEvent(new CustomEvent('fathom:skip-backward'));
          break;
        }

        case 'm':
        case 'M': {
          if (inTextInput) return;
          // Toggle both soundscape and music as the "mute" action
          const store = useStore.getState();
          if (store.currentTrack) {
            store.toggleSoundscape();
            store.toggleMusic();
          }
          break;
        }

        case 'Escape': {
          // Radix Dialog/Vaul Drawer handle Escape natively,
          // but we dispatch a custom event for any custom popovers
          window.dispatchEvent(new CustomEvent('fathom:escape'));
          break;
        }

        case 'n':
        case 'N': {
          if (inTextInput) return;
          navigate('/');
          break;
        }
      }
    }

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [navigate]);
}
