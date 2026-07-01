import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ChevronRightIcon } from 'lucide-react';
import { Topbar } from './Topbar';
import { CommandDrawer } from './CommandDrawer';
import { useAuth } from '../../lib/auth';
import {
  COMMAND_CENTER_FLAGS,
  SUBNAV_BY_MODULE,
  resolveActiveTopLevel,
} from './navConfig';
import { RouteKey } from '../../data/routes';
import vcpmcLogo from '../../assets/vcpmc-logo-animated.webp';

// Mirror of the ROUTE_LABELS map in Topbar.tsx — kept local so this shell is
// the single source of truth for the breadcrumb on the command-center topbar.
const ROUTE_LABELS: Partial<Record<RouteKey, { label: string; group?: string }>> = {
  dashboard: { label: 'Dashboard', group: 'Tổng quan' },
  'contracts.list': { label: 'Danh sách hợp đồng', group: 'Hợp đồng' },
  'contracts.detail': { label: 'Chi tiết hợp đồng', group: 'Hợp đồng' },
  'contracts.edit': { label: 'Chỉnh sửa hợp đồng', group: 'Hợp đồng' },
  'contracts.create': { label: 'Tạo hợp đồng', group: 'Hợp đồng' },
  'contracts.print': { label: 'In GCN', group: 'GCN' },
  annexes: { label: 'Phụ lục', group: 'Nghiệp vụ' },
  dispatch: { label: 'Công văn', group: 'Nghiệp vụ' },
  reports: { label: 'Báo cáo', group: 'Nghiệp vụ' },
  search: { label: 'Tìm kiếm', group: 'Nghiệp vụ' },
  'admin.users': { label: 'Người dùng', group: 'Hệ thống' },
  'admin.permissions': { label: 'Phân quyền', group: 'Hệ thống' },
  'admin.import': { label: 'Import Excel', group: 'Hệ thống' },
  'admin.deployment': { label: 'Triển khai', group: 'Hệ thống' },
  assistant: { label: 'AI Assistant', group: 'Hệ thống' },
};

/**
 * CommandCenter — final Orb Drawer edition (Phase 3: navigation dedup).
 *
 * The VCPMC Orb launches the drawer, which is the primary app map.
 * The topbar is a compact utility bar:
 *  [ORB]  [current page breadcrumb]   [search]   [+ Tạo mới]   [workspace]   [👤]
 *
 *  +----------------------------------------------------------------------+
 *  | [ORB] Hợp đồng / Danh sách            [🔍Tìm...] [+Tạo] [BG] [👤]  |  <- Topbar (60px)
 *  +----------------------------------------------------------------------+
 *  |                                                                     |
 *  |        <main content - full viewport width, content starts higher>  |
 *  |                                                                     |
 *  +----------------------------------------------------------------------+
 *
 * Removed by default (per spec):
 *  - topbar module label pills (duplicated drawer)
 *  - global subnav strip under the topbar
 *  - left-side pinned dock rail
 *
 * Optional via COMMAND_CENTER_FLAGS:
 *  - COMMAND_SUBNAV_ENABLED   — re-enables the global subnav
 *  - COMMAND_DOCK_ENABLED     — re-enables the left dock rail
 *  - COMMAND_TOPBAR_CREATE_ENABLED — toggles the + Tạo mới dropdown
 *
 * Sidebar cũ fallback is provided by AppShell (storage key vcpmc.layoutMode.v1).
 */
export function CommandCenter({
  current,
  onNavigate,
  workspace,
  onWorkspaceChange,
  userEmail,
  layoutMode,
  onLayoutModeChange,
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
  layoutMode: import('./useLayoutMode').LayoutMode;
  onLayoutModeChange: (m: import('./useLayoutMode').LayoutMode) => void;
  workflow?: WorkflowKind;
  onOpenWorkflow?: (k: Exclude<WorkflowKind, null>) => void;
  onCloseWorkflow?: () => void;
  children: React.ReactNode;
}) {
  const { hasPermission } = useAuth();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const showDevBadge = import.meta.env.DEV;
  const drawerRef = useRef<HTMLDivElement | null>(null);
  // Imperative ref to call focusSearch() on the CommandDrawer's internal input.
  const drawerApiRef = useRef<{ focusSearch: () => void } | null>(null);

  // Ctrl K / Cmd K: open the Orb Launcher and focus its search field.
  // Runs at capture phase so it fires before any focused input can intercept.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        e.stopPropagation();
        setDrawerOpen(true);
        // Focus the search field once the drawer has rendered.
        requestAnimationFrame(() => {
          drawerApiRef.current?.focusSearch();
        });
      }
    };
    window.addEventListener('keydown', onKey, { capture: true });
    return () => window.removeEventListener('keydown', onKey, { capture: true } as EventListenerOptions);
  }, []);

  // Close drawer on route change so the user lands cleanly on the new page.
  useEffect(() => {
    setDrawerOpen(false);
  }, [current]);

  // Subnav items (only used when COMMAND_SUBNAV_ENABLED is true).
  const subnavItems = useMemo(() => {
    const activeTopLevel = resolveActiveTopLevel(current);
    const list = SUBNAV_BY_MODULE[activeTopLevel] ?? [];
    return list.filter((it) => !it.requiredPerm || hasPermission(it.requiredPerm));
  }, [current, hasPermission]);

  const breadcrumb = useMemo(() => {
    const meta = ROUTE_LABELS[current];
    if (!meta) {
      return { group: 'VCPMC', label: 'Command Center' };
    }
    return { group: meta.group ?? 'VCPMC', label: meta.label };
  }, [current]);

  return (
    <div className="vc-command-center h-screen w-full overflow-hidden bg-[#0c0d0e]">
      {/* ─── Topbar (compact utility bar) ─── */}
      <header className="vc-command-topbar vc-command-topbar--minimal sticky top-0 z-30">
        <div className="vc-command-topbar__inner">
          {/* LEFT ZONE — orb + current page breadcrumb */}
          <div className="vc-command-topbar__zone vc-command-topbar__zone--left">
            <button
              type="button"
              onClick={() => setDrawerOpen((o) => !o)}
              className={`vc-command-orb ${drawerOpen ? 'is-open' : ''}`}
              aria-label="Mở trung tâm điều hướng VCPMC"
              aria-expanded={drawerOpen}
              aria-haspopup="dialog"
              title="VCPMC Command Center"
            >
              <span className="vc-command-orb__halo" aria-hidden />
              <span className="vc-command-orb__core">
                <img src={vcpmcLogo} alt="VCPMC" className="vc-command-orb__logo" />
              </span>
            </button>

            <nav
              className="vc-command-breadcrumb"
              aria-label="Vị trí hiện tại"
              key={current}
            >
              <span className="vc-command-breadcrumb__group">{breadcrumb.group}</span>
              <ChevronRightIcon className="vc-command-breadcrumb__sep" aria-hidden />
              <span className="vc-command-breadcrumb__label">{breadcrumb.label}</span>
            </nav>
          </div>

          {/* CENTER ZONE — breathing space; all search lives in the Orb Launcher. */}
          <div className="vc-command-topbar__zone vc-command-topbar__zone--center" />

          {/* RIGHT ZONE — date pill + bare avatar, anchored to far right. */}
          <div className="vc-command-topbar__zone vc-command-topbar__zone--right">
            {/* The topbar is intentionally minimal in V5: it carries only
                persistent global context. Everything else (workspace chip,
                theme, layout switch, logout, all workflow actions, system
                menus) lives in the Orb Launcher so the topbar reads as a
                calm, premium context bar instead of a duplicated control
                panel. */}
            <Topbar
              workspace={workspace}
              onWorkspaceChange={onWorkspaceChange}
              userEmail={userEmail}
              current={current}
              onNavigate={onNavigate}
              bare
              layoutMode={layoutMode}
              onLayoutModeChange={onLayoutModeChange}
            />

            <CommandDatePill />
          </div>
        </div>
      </header>

      {/* ─── Optional subnav (default: hidden) ─── */}
      {COMMAND_CENTER_FLAGS.COMMAND_SUBNAV_ENABLED && subnavItems.length > 0 && (
        <div className="vc-command-subnav sticky top-[56px] z-20">
          <div className="vc-command-subnav__inner">
            {subnavItems.map((it, idx) => {
              const active = current === it.key;
              return (
                <button
                  key={`${it.key}-${idx}`}
                  type="button"
                  onClick={() => onNavigate(it.key)}
                  className={`vc-command-subnav__item ${active ? 'is-active' : ''}`}
                >
                  {it.icon}
                  <span>{it.label}</span>
                  {it.badge && <span className="vc-command-subnav__badge">{it.badge}</span>}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* ─── Body: content only (no dock rail by default) ─── */}
      <div className="vc-command-body">
        <main className="vc-command-main" key={current}>
          {showDevBadge && (
            <div className="vc-command-dev-badge">
              <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse" />
              Development build
            </div>
          )}
          <div className="vc-command-content page-enter">{children}</div>
        </main>
      </div>

      {/* ─── Command Drawer (orb) ─── */}
      <CommandDrawer
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        current={current}
        onNavigate={onNavigate}
        workspace={workspace}
        onWorkspaceChange={onWorkspaceChange}
        layoutMode={layoutMode}
        onLayoutModeChange={onLayoutModeChange}
        onOpenWorkflow={onOpenWorkflow}
        ref={drawerApiRef}
        drawerRef={drawerRef}
      />
    </div>
  );
}

/**
 * Compact topbar date pill.
 *
 * Renders the current local date in Vietnamese short format (e.g. "Th 4, 18/06").
 * Uses native Intl APIs only — no external libs, no network calls, no fake
 * lunar/solar conversion. Updates once per minute so the pill never flickers
 * but stays accurate enough for a calm ambient indicator.
 */
function CommandDatePill() {
  const [now, setNow] = React.useState(() => new Date());
  React.useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), 60_000);
    return () => window.clearInterval(id);
  }, []);
  const weekday = new Intl.DateTimeFormat('vi-VN', { weekday: 'short' }).format(now);
  const dayMonth = new Intl.DateTimeFormat('vi-VN', { day: '2-digit', month: '2-digit' }).format(now);
  return (
    <span
      className="vc-command-date-pill"
      aria-label={`Hôm nay: ${weekday} ${dayMonth}`}
      title="Giờ trình duyệt — không đồng bộ máy chủ"
    >
      <span className="vc-command-date-pill__weekday">{weekday}</span>
      <span className="vc-command-date-pill__sep" aria-hidden>·</span>
      <span className="vc-command-date-pill__day">{dayMonth}</span>
    </span>
  );
}
