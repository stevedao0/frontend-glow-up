import React from 'react';
import { RouteKey } from '../../data/routes';
import { WorkspaceFrame } from './WorkspaceFrame';

interface WorkspaceCanvasProps {
  children: React.ReactNode;
  current: RouteKey;
  showDevBadge?: boolean;
}

export function WorkspaceCanvas({ children, current, showDevBadge = false }: WorkspaceCanvasProps) {
  return (
    <div className="vc-workspace-canvas">
      <WorkspaceFrame current={current} showDevBadge={showDevBadge}>
        {children}
      </WorkspaceFrame>
    </div>
  );
}
