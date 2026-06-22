import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  FilePlusIcon,
  PrinterIcon,
  BarChart3Icon,
  MailIcon,
  SearchIcon,
  LogOutIcon,
} from 'lucide-react';
import { RouteKey } from '../../data/routes';
import { useAuth } from '../../lib/auth';
import { DRAWER_QUICK_ACTIONS, DRAWER_GROUPS } from './navConfig';
import type { WorkflowKind } from './WorkflowSheet';

interface CommandLauncherProps {
  open: boolean;
  onClose: () => void;
  onNavigate: (k: RouteKey) => void;
  onOpenWorkflow?: (k: 'create-contract' | 'print-gcn' | 'dispatches') => void;
}

function quickActionToWorkflow(key: RouteKey): 'create-contract' | 'print-gcn' | 'dispatches' | null {
  switch (key) {
    case 'contracts.create': return 'create-contract';
    case 'contracts.print': return 'print-gcn';
    case 'dispatch': return 'dispatches';
    default: return null;
  }
}

export function CommandLauncher({ open, onClose, onNavigate, onOpenWorkflow }: CommandLauncherProps) {
  const { currentUser, logout, hasPermission } = useAuth();
  const [query, setQuery] = useState('');
  const searchRef = useRef<HTMLInputElement>(null);

  // Focus search when opened
  useEffect(() => {
    if (open) {
      setQuery('');
      requestAnimationFrame(() => searchRef.current?.focus());
    }
  }, [open]);

  // ESC to close
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  const visibleQuickActions = useMemo(
    () => DRAWER_QUICK_ACTIONS.filter((it) => !it.requiredPerm || hasPermission(it.requiredPerm)),
    [hasPermission],
  );

  // Filter nav groups by query
  const visibleGroups = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return DRAWER_GROUPS
      .map((g) => ({
        ...g,
        items: g.items.filter((it) => {
          if (it.requiredPerm && !hasPermission(it.requiredPerm)) return false;
          if (!needle) return true;
          return (
            it.label.toLowerCase().includes(needle) ||
            g.label.toLowerCase().includes(needle)
          );
        }),
      }))
      .filter((g) => g.items.length > 0 || g.quickOnly);
  }, [hasPermission, query]);

  const handleNavItemClick = (key: RouteKey) => {
    const workflowKind = quickActionToWorkflow(key);
    if (workflowKind && onOpenWorkflow) {
      onOpenWorkflow(workflowKind);
    } else {
      onNavigate(key);
    }
    onClose();
  };

  if (!open) return null;

  return createPortal(
    <div
      className="vc-launcher-overlay"
      role="dialog"
      aria-label="VCPMC Command Launcher"
      aria-modal="true"
    >
      {/* Backdrop */}
      <div
        className="vc-launcher-overlay__backdrop"
        onClick={onClose}
        aria-hidden
      />

      {/* Panel */}
      <div className="vc-launcher-overlay__panel" onClick={(e) => e.stopPropagation()}>
        {/* Search */}
        <div className="vc-launcher-overlay__search">
          <div className="vc-launcher-overlay__search-wrap">
            <SearchIcon className="vc-launcher-overlay__search-icon" />
            <input
              ref={searchRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Tìm hợp đồng, GCN, đối tác, menu..."
              className="vc-launcher-overlay__search-input"
              aria-label="Tìm kiếm"
            />
            {query ? (
              <button
                type="button"
                onClick={() => setQuery('')}
                className="vc-launcher-overlay__search-clear"
                aria-label="Xoá tìm kiếm"
              >
                ×
              </button>
            ) : (
              <span className="vc-launcher-overlay__kbd">ESC</span>
            )}
          </div>
        </div>

        {/* Body */}
        <div className="vc-launcher-overlay__body">
          {/* Quick Actions */}
          {visibleQuickActions.length > 0 && !query && (
            <>
              <p className="vc-launcher-overlay__section-label">Thao tác nhanh</p>
              <div className="vc-launcher-overlay__quick-row">
                {visibleQuickActions.map((qa) => (
                  <button
                    key={qa.key}
                    type="button"
                    onClick={() => handleNavItemClick(qa.key)}
                    className="vc-launcher-overlay__qa-btn"
                    title={qa.label}
                  >
                    {qa.icon}
                    <span>{qa.label}</span>
                  </button>
                ))}
              </div>
            </>
          )}

          {/* Navigation Groups */}
          {visibleGroups.map((g) => (
            <div key={g.label} className="vc-launcher-overlay__nav-group">
              <p className="vc-launcher-overlay__section-label">{g.label}</p>
              {g.items.length === 0 && !g.quickOnly && (
                <p className="vc-launcher-overlay__empty">Không có mục phù hợp.</p>
              )}
              {g.items.map((it) => (
                <button
                  key={it.key}
                  type="button"
                  onClick={() => handleNavItemClick(it.key)}
                  className="vc-launcher-overlay__nav-item"
                >
                  {it.icon}
                  <span>{it.label}</span>
                </button>
              ))}
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="vc-launcher-overlay__footer">
          {currentUser ? (
            <>
              <div className="vc-launcher-overlay__user">
                <span className="vc-launcher-overlay__user-avatar">
                  {currentUser.avatarInitial || currentUser.email[0].toUpperCase()}
                </span>
                <span>{currentUser.name || currentUser.email}</span>
              </div>
              <button
                type="button"
                onClick={() => { onClose(); logout(); }}
                className="vc-launcher-overlay__logout"
                aria-label="Đăng xuất"
              >
                <LogOutIcon />
                <span>Đăng xuất</span>
              </button>
            </>
          ) : null}
        </div>
      </div>
    </div>,
    document.body
  );
}
