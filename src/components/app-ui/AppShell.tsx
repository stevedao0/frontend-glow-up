import React from 'react';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';
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
    <div className="min-h-screen w-full flex bg-[#fafafa]">
      <Sidebar current={current} onNavigate={onNavigate} />
      <div className="flex-1 min-w-0 flex flex-col">
        <Topbar
          workspace={workspace}
          onWorkspaceChange={onWorkspaceChange}
          userEmail={userEmail} />
        {showDevBadge ? (
          <div className="px-6 py-2 text-[12px] font-medium text-amber-900 bg-amber-100 border-y border-amber-200">
            NEW APP DEV -- F:\APPs -- port 5199
          </div>
        ) : null}
        
        <main
          key={current}
          className="flex-1 min-w-0 animate-[fadein_220ms_ease-out]">
          
          {children}
        </main>
        <footer className="px-6 py-3 text-[11px] text-zinc-500 border-t border-zinc-200 bg-white/60 backdrop-blur">
          Â© 2026 VCPMC Â· Internal use only Â· Build prototype
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

