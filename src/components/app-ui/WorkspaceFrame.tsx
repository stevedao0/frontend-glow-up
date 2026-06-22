import React, { useEffect, useState } from 'react';
import { RouteKey } from '../../data/routes';
import { RefreshCwIcon, Maximize2Icon, Minimize2Icon } from 'lucide-react';

const ROUTE_LABELS: Partial<Record<RouteKey, { label: string; group?: string; badge?: string }>> = {
  dashboard: { label: 'Trung tâm điều hành', group: 'Tổng quan' },
  'contracts.list': { label: 'Danh sách hợp đồng', group: 'Hợp đồng' },
  'contracts.detail': { label: 'Chi tiết hợp đồng', group: 'Hợp đồng' },
  'contracts.edit': { label: 'Chỉnh sửa hợp đồng', group: 'Hợp đồng' },
  'contracts.create': { label: 'Tạo hợp đồng', group: 'Hợp đồng' },
  'contracts.print': { label: 'In GCN', group: 'GCN', badge: 'Print' },
  annexes: { label: 'Phụ lục', group: 'Nghiệp vụ' },
  dispatch: { label: 'Công văn', group: 'Nghiệp vụ' },
  reports: { label: 'Báo cáo', group: 'Nghiệp vụ' },
  search: { label: 'Tìm kiếm toàn cục', group: 'Nghiệp vụ' },
  'admin.users': { label: 'Người dùng', group: 'Hệ thống' },
  'admin.permissions': { label: 'Phân quyền', group: 'Hệ thống' },
  'admin.import': { label: 'Import Excel', group: 'Hệ thống' },
  assistant: { label: 'AI Assistant', group: 'Hệ thống' },
};

interface WorkspaceFrameProps {
  current: RouteKey;
  children: React.ReactNode;
  showDevBadge?: boolean;
}

export function WorkspaceFrame({ current, children, showDevBadge = false }: WorkspaceFrameProps) {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const meta = ROUTE_LABELS[current];

  // Track fullscreen state (browser native)
  useEffect(() => {
    const onChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', onChange);
    return () => document.removeEventListener('fullscreenchange', onChange);
  }, []);

  const toggleFullscreen = () => {
    if (document.fullscreenElement) {
      document.exitFullscreen();
    } else {
      const el = document.querySelector('.vc-workspace-frame');
      if (el && (el as HTMLElement).requestFullscreen) {
        (el as HTMLElement).requestFullscreen().catch(() => {});
      }
    }
  };

  const handleRefresh = () => {
    // Soft refresh: dispatch a custom event the page can listen to,
    // or fallback to a window.location.reload if the page doesn't opt-in.
    const evt = new CustomEvent('vc-workspace-refresh', { detail: { route: current } });
    window.dispatchEvent(evt);
    // If the page didn't preventDefault, do a soft reload of the route state
    setTimeout(() => {
      // The page may have set a flag to indicate it handled refresh
      // We don't force-reload; the page is responsible.
    }, 50);
  };

  return (
    <div className="vc-workspace-frame" data-workspace-frame>
      {/* Frame header */}
      <header className="vc-workspace-frame__header">
        <div className="vc-workspace-frame__crumb">
          <span className="vc-workspace-frame__crumb-group">{meta?.group ?? 'Workspace'}</span>
          <span className="vc-workspace-frame__crumb-sep">/</span>
          <span className="vc-workspace-frame__crumb-label">{meta?.label ?? current}</span>
        </div>
        <div className="vc-workspace-frame__actions">
          <span className="vc-workspace-frame__badge">Workspace</span>
          {meta?.badge && <span className="vc-workspace-frame__badge vc-workspace-frame__badge--accent">{meta.badge}</span>}
          <button
            type="button"
            className="vc-workspace-frame__btn"
            onClick={handleRefresh}
            aria-label="Làm mới"
            title="Làm mới"
          >
            <RefreshCwIcon />
          </button>
          <button
            type="button"
            className="vc-workspace-frame__btn"
            onClick={toggleFullscreen}
            aria-label={isFullscreen ? 'Thoát toàn màn hình' : 'Toàn màn hình'}
            title={isFullscreen ? 'Thoát toàn màn hình' : 'Toàn màn hình'}
          >
            {isFullscreen ? <Minimize2Icon /> : <Maximize2Icon />}
          </button>
        </div>
      </header>

      {/* Frame content area */}
      <div className="vc-workspace-frame__body page-enter" key={current}>
        {children}
      </div>

      {/* Dev badge removed — DEMO MODE pill (bottom-right) is the canonical preview indicator */}
      {false && showDevBadge && null}
    </div>
  );
}
