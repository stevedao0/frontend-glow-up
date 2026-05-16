import React from 'react';
import { MoonIcon, SunIcon } from 'lucide-react';

const STORAGE_KEY = 'vcpmc.theme.dark';

export function ThemeToggle() {
  const [dark, setDark] = React.useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return localStorage.getItem(STORAGE_KEY) === '1';
  });

  React.useEffect(() => {
    const el = document.documentElement;
    if (dark) el.classList.add('theme-obsidian');
    else el.classList.remove('theme-obsidian');
    localStorage.setItem(STORAGE_KEY, dark ? '1' : '0');
  }, [dark]);

  return (
    <button
      type="button"
      onClick={() => setDark((v) => !v)}
      className="theme-toggle"
      aria-label={dark ? 'Chuyển sang chế độ sáng' : 'Chuyển sang chế độ tối'}
      title={dark ? 'Chế độ sáng' : 'Chế độ tối'}>
      {dark ? <SunIcon className="h-5 w-5" /> : <MoonIcon className="h-5 w-5" />}
    </button>
  );
}
