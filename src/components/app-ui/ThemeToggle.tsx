import React from 'react';
import { MoonIcon, SunIcon } from 'lucide-react';

const STORAGE_KEY = 'vcpmc.theme.dark';

export function ThemeToggle({ variant = 'topbar' }: { variant?: 'topbar' | 'floating' }) {
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

  const label = dark ? 'Chuyển sang chế độ sáng' : 'Chuyển sang chế độ tối';
  const title = dark ? 'Chế độ sáng' : 'Chế độ tối';

  if (variant === 'floating') {
    return (
      <button
        type="button"
        onClick={() => setDark((v) => !v)}
        className="theme-toggle"
        aria-label={label}
        title={title}>
        {dark ? <SunIcon className="h-5 w-5" /> : <MoonIcon className="h-5 w-5" />}
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={() => setDark((v) => !v)}
      aria-label={label}
      title={title}
      className="relative h-9 w-9 inline-flex items-center justify-center rounded-lg text-fg-secondary hover:bg-surface-subtle hover:text-fg-primary transition-colors">
      {dark ? <SunIcon className="h-[17px] w-[17px]" /> : <MoonIcon className="h-[17px] w-[17px]" />}
    </button>
  );
}
