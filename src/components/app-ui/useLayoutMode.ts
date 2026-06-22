import { useEffect, useState } from 'react';

export type LayoutMode = 'command-center' | 'sidebar';

const STORAGE_KEY = 'vcpmc.layoutMode.v1';

const VALID_MODES: LayoutMode[] = ['command-center', 'sidebar'];

function readStored(): LayoutMode {
  if (typeof window === 'undefined') return 'command-center';
  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (raw && (VALID_MODES as string[]).includes(raw)) {
    return raw as LayoutMode;
  }
  return 'command-center';
}

/**
 * useLayoutMode — reads/writes the current shell layout mode.
 *
 * Default is 'command-center'. Persists in localStorage under
 * 'vcpmc.layoutMode.v1'. Survives reloads.
 */
export function useLayoutMode(): [LayoutMode, (m: LayoutMode) => void] {
  const [mode, setMode] = useState<LayoutMode>(readStored);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      window.localStorage.setItem(STORAGE_KEY, mode);
    } catch {
      // ignore quota / private-mode errors
    }
  }, [mode]);

  return [mode, setMode];
}

export const LAYOUT_MODE_STORAGE_KEY = STORAGE_KEY;
