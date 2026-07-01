import React from 'react';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';
import { CommandCenter } from './CommandCenter';
import { useLayoutMode } from './useLayoutMode';

import { RouteKey } from '../../data/routes';
import type { WorkflowKind } from './WorkflowSheet';

export function AppShell({
  current,
  onNavigate,
  workspace,
  onWorkspaceChange,
  userEmail,
  workflow,
  onOpenWorkflow,
  onCloseWorkflow,
  children,
}: {
  current: RouteKey;
  onNavigate: (k: RouteKey) => void;
  workspace: string;
  onWorkspaceChange: (id: string) => void;
  userEmail: string;
  workflow?: WorkflowKind;
  onOpenWorkflow?: (k: Exclude<WorkflowKind, null>) => void;
  onCloseWorkflow?: () => void;
  children: React.ReactNode;
}) {
  const [layoutMode, setLayoutMode] = useLayoutMode();
  const showDevBadge = import.meta.env.DEV;

  // -- Command Center (default for internal pilot) --
  if (layoutMode === 'command-center') {
    return (
      <CommandCenter
        current={current}
        onNavigate={onNavigate}
        workspace={workspace}
        onWorkspaceChange={onWorkspaceChange}
        userEmail={userEmail}
        layoutMode={layoutMode}
        onLayoutModeChange={setLayoutMode}
        workflow={workflow}
        onOpenWorkflow={onOpenWorkflow}
        onCloseWorkflow={onCloseWorkflow}
      >
        {children}
      </CommandCenter>
    );
  }

  // -- Legacy sidebar fallback --
  return (
    <div className="vc-enterprise-shell h-screen w-full overflow-hidden">
      <div className="vc-enterprise-shell__frame">
        <Sidebar current={current} onNavigate={onNavigate} workspace={workspace} />
        <div className="vc-enterprise-main">
          <Topbar
            workspace={workspace}
            onWorkspaceChange={onWorkspaceChange}
            userEmail={userEmail}
            current={current}
            onNavigate={onNavigate}
            layoutMode={layoutMode}
            onLayoutModeChange={setLayoutMode}
          />
          {showDevBadge ? (
            <div className="vc-enterprise-dev-badge px-6 py-1.5 text-[11px] font-medium flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse" />
              Development build
            </div>
          ) : null}
          <main key={current} className="vc-enterprise-content page-enter">
            {children}
          </main>
        </div>
      </div>

      <style>{`
        @keyframes fadein {
          from { opacity: 0; transform: translateY(4px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
