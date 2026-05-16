import React from 'react';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';
import { ThemeToggle } from './ThemeToggle';
import { RouteKey } from '../../data/routes';
export function AppShell({
  current,
  onNavigate,
  workspace,
  onWorkspaceChange,
  userEmail,
  children







}: {current: RouteKey;onNavigate: (k: RouteKey) => void;workspace: string;onWorkspaceChange: (id: string) => void;userEmail: string;children: React.ReactNode;}) {
  const showDevBadge = import.meta.env.DEV;
  return (
    <div className="min-h-screen w-full flex bg-surface-app">
      <Sidebar current={current} onNavigate={onNavigate} />
      <div className="flex-1 min-w-0 flex flex-col">
        <Topbar
          workspace={workspace}
          onWorkspaceChange={onWorkspaceChange}
          userEmail={userEmail}
          current={current}
          onNavigate={onNavigate} />
        {showDevBadge ? (
          <div className="px-6 py-1.5 text-[11px] font-medium text-amber-900 bg-amber-50 border-b border-amber-200/70 flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse" />
            Development build
          </div>
        ) : null}
        
        <main
          key={current}
          className="flex-1 min-w-0 page-enter">
          
          {children}
        </main>
        <footer className="px-6 py-3 text-[11px] text-fg-muted border-t border-zinc-200/70 bg-surface/60 backdrop-blur">
          © 2026 VCPMC · Internal use only · Build prototype
        </footer>
      </div>
      <style>{`
        @keyframes fadein {
          from { opacity: 0; transform: translateY(4px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>);

}

