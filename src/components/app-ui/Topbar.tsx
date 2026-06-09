import React, { useEffect, useState, useRef } from 'react';
import {
  BellIcon,
  ChevronDownIcon,
  SearchIcon,
  LogOutIcon,
  UserIcon,
  SettingsIcon,
  KeyIcon,
  ChevronRightIcon } from
'lucide-react';
import { useAuth } from '../../lib/auth';
import { DOMAINS, ROLE_DEFS } from '../../data/authData';
import { Modal } from './Modal';
import { Button } from './Button';
import { Input } from './Input';
import { CommandPalette } from './CommandPalette';
import { NotificationsDropdown } from './NotificationsDropdown';
import { RouteKey } from '../../data/routes';
import { ThemeToggle } from './ThemeToggle';

const ROUTE_LABELS: Partial<Record<RouteKey, { label: string; group?: string }>> = {
  dashboard: { label: 'Dashboard', group: 'Tổng quan' },
  'contracts.list': { label: 'Danh sách hợp đồng', group: 'Hợp đồng' },
  'contracts.detail': { label: 'Chi tiết hợp đồng', group: 'Hợp đồng' },
  'contracts.edit': { label: 'Chỉnh sửa hợp đồng', group: 'Hợp đồng' },
  'contracts.create': { label: 'Tạo hợp đồng', group: 'Hợp đồng' },
  'contracts.print': { label: 'In GCN', group: 'Hợp đồng' },
  annexes: { label: 'Phụ lục', group: 'Nghiệp vụ' },
  dispatch: { label: 'Công văn', group: 'Nghiệp vụ' },
  reports: { label: 'Báo cáo', group: 'Nghiệp vụ' },
  search: { label: 'Tìm kiếm', group: 'Nghiệp vụ' },
  'admin.users': { label: 'Người dùng', group: 'Hệ thống' },
  'admin.permissions': { label: 'Phân quyền', group: 'Hệ thống' },
  assistant: { label: 'AI Assistant', group: 'Hệ thống' },
};
export function Topbar({
  workspace,
  onWorkspaceChange,
  userEmail,
  current,
  onNavigate,
}: {
  workspace: string;
  onWorkspaceChange: (id: string) => void;
  userEmail: string;
  current?: RouteKey;
  onNavigate?: (k: RouteKey) => void;
}) {
  const { currentUser, logout, hasDomain, hasPermission } = useAuth();
  const [wsOpen, setWsOpen] = useState(false);
  const [userOpen, setUserOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const wsRef = useRef<HTMLDivElement>(null);
  const userRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (wsRef.current && !wsRef.current.contains(e.target as Node))
      setWsOpen(false);
      if (userRef.current && !userRef.current.contains(e.target as Node))
      setUserOpen(false);
      if (notifRef.current && !notifRef.current.contains(e.target as Node))
      setNotifOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setPaletteOpen(true);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);
  const allowedDomains = DOMAINS.filter((d) => !d.adminOnly && hasDomain(d.id));
  const activeWs =
  allowedDomains.find((w) => w.id === workspace) ??
  allowedDomains[0] ??
  DOMAINS[0];
  const isAmber = activeWs.accent === 'amber';
  const wsDot = isAmber ? 'bg-amber-400' : 'bg-[#c89968]';
  const wsGlow = isAmber ?
  'shadow-[0_0_8px_rgba(251,191,36,0.55)]' :
  'shadow-[0_0_8px_rgba(200,153,104,0.6)]';
  const roleName = currentUser ?
  ROLE_DEFS[currentUser.role as keyof typeof ROLE_DEFS]?.name :
  '';

  const currentMeta = current ? ROUTE_LABELS[current] : undefined;

  return (
    <>
      <header className="vc-enterprise-topbar sticky top-0 z-20 h-16 px-4 sm:px-6 flex items-center gap-2 sm:gap-3">
        {/* Breadcrumb */}
        {currentMeta && (
          <nav className="hidden lg:flex items-center gap-1.5 text-[12.5px] mr-2 shrink-0">
            {currentMeta.group && (
              <>
            <span className="text-white/45 font-medium">{currentMeta.group}</span>
                <ChevronRightIcon className="h-3 w-3 text-white/28" />
              </>
            )}
            <span className="text-white font-semibold tracking-tight">{currentMeta.label}</span>
          </nav>
        )}

        <div className="relative flex-1 max-w-md group">
          <button
            type="button"
            onClick={() => setPaletteOpen(true)}
            className="vc-enterprise-search w-full h-9 pl-9 pr-14 text-sm rounded-xl text-left transition-all">
            <SearchIcon className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-white/36 group-hover:text-[var(--vc-enterprise-accent)] transition-colors" />
            <span className="truncate text-white/55">Tìm hợp đồng, GCN, đối tác... hoặc nhấn ⌘K</span>
            <kbd className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 px-1.5 h-5 inline-flex items-center text-[10px] font-semibold text-white/44 bg-black/20 border border-white/10 rounded shadow-xs">
              ⌘K
            </kbd>
          </button>
        </div>

        <div className="flex-1" />

        <div ref={wsRef} className="relative">
          <button
            type="button"
            onClick={() => setWsOpen((o) => !o)}
            className="vc-enterprise-topbar-chip h-9 px-3 inline-flex items-center gap-2 rounded-xl text-sm transition-all shadow-xs">
            
            <span className={`h-2 w-2 rounded-full ${wsDot} ${wsGlow}`} />
            <span className="font-semibold text-white hidden sm:inline">
              {activeWs.label}
            </span>
            <ChevronDownIcon className="h-3.5 w-3.5 text-white/36" />
          </button>
          {wsOpen &&
          <div className="absolute right-0 top-11 w-56 rounded-2xl bg-[#0f1b18] ring-1 ring-white/10 shadow-2xl py-1.5 z-30 origin-top-right max-h-96 overflow-y-auto">
              <p className="px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-white/42">
                Workspace
              </p>
              {allowedDomains.map((w) => {
              const dot =
              w.accent === 'amber' ? 'bg-amber-400' : 'bg-[#c89968]';
              const isActive = w.id === workspace;
              return (
                <button
                  key={w.id}
                  type="button"
                  onClick={() => {
                    onWorkspaceChange(w.id);
                    setWsOpen(false);
                  }}
                  className={`w-full text-left px-3 py-2 text-sm hover:bg-white/[0.05] inline-flex items-center gap-2 transition-colors ${isActive ? 'text-white font-semibold' : 'text-white/72'}`}>
                  
                    <span className={`h-2 w-2 rounded-full ${dot}`} />
                    {w.label}
                    {isActive &&
                  <span className="ml-auto text-[10px] font-bold tracking-wider uppercase text-[var(--vc-enterprise-accent)]">
                        Active
                      </span>
                  }
                  </button>);

            })}
            </div>
          }
        </div>

        <ThemeToggle />

        <div ref={notifRef} className="relative">
          <button
            type="button"
            aria-label="Thông báo"
            onClick={() => setNotifOpen((o) => !o)}
            className={`relative h-9 w-9 inline-flex items-center justify-center rounded-xl transition-colors ${
              notifOpen
                ? 'bg-white/8 text-[var(--vc-enterprise-accent)] ring-1 ring-white/10'
                : 'text-white/68 hover:bg-white/[0.05] hover:text-white'
            }`}>
            <BellIcon className="h-[17px] w-[17px]" />
            <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-danger ring-2 ring-[#0f1b18]" />
            <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-danger animate-ping opacity-60" />
          </button>
          {notifOpen && <NotificationsDropdown onClose={() => setNotifOpen(false)} />}
        </div>

        <div ref={userRef} className="relative">
          <button
            type="button"
            onClick={() => setUserOpen((o) => !o)}
            className="h-9 pl-1 pr-1 sm:pr-2.5 inline-flex items-center gap-2 rounded-xl ring-1 ring-transparent hover:ring-white/10 hover:bg-white/[0.04] transition-all">
            
            <span className="relative h-7 w-7 rounded-full bg-gradient-to-br from-zinc-700 to-zinc-950 text-white text-[11px] font-semibold flex items-center justify-center shadow-xs">
              {currentUser?.avatarInitial || 'U'}
              <span
                aria-hidden
                className="absolute inset-0 rounded-full ring-1 ring-inset ring-white/10" />
              
            </span>
            <span className="hidden md:inline text-sm text-white font-medium max-w-[180px] truncate">
              {userEmail}
            </span>
            <ChevronDownIcon className="hidden sm:inline h-3.5 w-3.5 text-white/36" />
          </button>
          {userOpen &&
          <div className="absolute right-0 top-11 w-64 rounded-2xl bg-[#0f1b18] ring-1 ring-white/10 shadow-2xl py-1.5 z-30">
              <div className="px-3 py-2.5 border-b border-white/10">
                <p className="text-sm font-semibold text-white truncate">
                  {currentUser?.name}
                </p>
                <p className="text-xs text-white/48 mt-0.5">{roleName}</p>
              </div>
              <button
              onClick={() => {
                setShowProfile(true);
                setUserOpen(false);
              }}
              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-white/72 hover:bg-white/[0.05] transition-colors">
              
                <UserIcon className="h-4 w-4 text-fg-muted" /> Hồ sơ cá nhân
              </button>
              <button
              onClick={() => {
                setShowPassword(true);
                setUserOpen(false);
              }}
              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-white/72 hover:bg-white/[0.05] transition-colors">
              
                <KeyIcon className="h-4 w-4 text-fg-muted" /> Đổi mật khẩu
              </button>
              <button className="w-full flex items-center gap-2 px-3 py-2 text-sm text-fg-secondary hover:bg-surface-subtle transition-colors">
                <SettingsIcon className="h-4 w-4 text-fg-muted" /> Cài đặt giao
                diện
              </button>
              <div className="my-1 border-t border-white/10" />
              <button
              onClick={logout}
              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-danger hover:bg-rose-500/10 transition-colors">
              
                <LogOutIcon className="h-4 w-4" /> Đăng xuất
              </button>
            </div>
          }
        </div>
      </header>

      {/* Command Palette */}
      <CommandPalette
        open={paletteOpen}
        onClose={() => setPaletteOpen(false)}
        onNavigate={(k) => onNavigate?.(k)}
        hasPermission={hasPermission}
      />

      {/* Modals */}
      <ProfileModal open={showProfile} onClose={() => setShowProfile(false)} />
      <ChangePasswordModal
        open={showPassword}
        onClose={() => setShowPassword(false)} />
      
    </>);

}
function ProfileModal({
  open,
  onClose



}: {open: boolean;onClose: () => void;}) {
  const { currentUser } = useAuth();
  if (!currentUser) return null;
  const roleName = ROLE_DEFS[currentUser.role as keyof typeof ROLE_DEFS]?.name;
  const domainsText = currentUser.domains.includes('__all__') ?
  'Tất cả lĩnh vực' :
  DOMAINS.filter((d) => currentUser.domains.includes(d.id)).
  map((d) => d.label).
  join(', ');
  return (
    <Modal open={open} onClose={onClose} title="Hồ sơ cá nhân" maxWidth="sm">
      <div className="p-6 space-y-6">
        <div className="flex items-center gap-4">
          <div className="h-16 w-16 rounded-full bg-gradient-to-br from-zinc-700 to-zinc-950 text-white text-2xl font-semibold flex items-center justify-center shadow-lg">
            {currentUser.avatarInitial}
          </div>
          <div>
            <h3 className="text-lg font-semibold text-zinc-900">
              {currentUser.name}
            </h3>
            <p className="text-sm text-zinc-500">{currentUser.email}</p>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-xs font-medium text-zinc-500 uppercase tracking-wider">
              Vai trò
            </label>
            <p className="mt-1 text-sm font-medium text-zinc-900">{roleName}</p>
          </div>
          <div>
            <label className="text-xs font-medium text-zinc-500 uppercase tracking-wider">
              Phạm vi nghiệp vụ
            </label>
            <p className="mt-1 text-sm text-zinc-900 leading-relaxed">
              {domainsText}
            </p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium text-zinc-500 uppercase tracking-wider">
                Trạng thái
              </label>
              <p className="mt-1 text-sm text-emerald-600 font-medium flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />{' '}
                Hoạt động
              </p>
            </div>
            <div>
              <label className="text-xs font-medium text-zinc-500 uppercase tracking-wider">
                Đăng nhập lần cuối
              </label>
              <p className="mt-1 text-sm text-zinc-900">
                {currentUser.lastLogin}
              </p>
            </div>
          </div>
        </div>

        <div className="pt-4 border-t border-zinc-100 flex justify-end">
          <Button variant="secondary" onClick={onClose}>
            Đóng
          </Button>
        </div>
      </div>
    </Modal>);

}
function ChangePasswordModal({
  open,
  onClose



}: {open: boolean;onClose: () => void;}) {
  const [current, setCurrent] = useState('');
  const [newPass, setNewPass] = useState('');
  const [confirm, setConfirm] = useState('');
  const [success, setSuccess] = useState(false);
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSuccess(true);
    setTimeout(() => {
      setSuccess(false);
      setCurrent('');
      setNewPass('');
      setConfirm('');
      onClose();
    }, 2000);
  };
  return (
    <Modal open={open} onClose={onClose} title="Đổi mật khẩu" maxWidth="sm">
      <div className="p-6">
        {success ?
        <div className="text-center py-6">
            <div className="mx-auto h-12 w-12 rounded-full bg-emerald-100 flex items-center justify-center mb-4">
              <KeyIcon className="h-6 w-6 text-emerald-600" />
            </div>
            <h3 className="text-lg font-medium text-zinc-900 mb-2">
              Đổi mật khẩu thành công
            </h3>
            <p className="text-sm text-zinc-500">
              Mật khẩu của bạn đã được cập nhật.
            </p>
          </div> :

        <form onSubmit={handleSubmit} className="space-y-4">
            <Input
            label="Mật khẩu hiện tại"
            type="password"
            required
            value={current}
            onChange={(e) => setCurrent(e.target.value)} />
          
            <Input
            label="Mật khẩu mới"
            type="password"
            required
            value={newPass}
            onChange={(e) => setNewPass(e.target.value)} />
          
            <Input
            label="Nhập lại mật khẩu mới"
            type="password"
            required
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)} />
          
            <div className="pt-4 flex justify-end gap-3">
              <Button variant="ghost" onClick={onClose}>
                Hủy
              </Button>
              <Button
              variant="primary"
              type="submit"
              disabled={!current || !newPass || newPass !== confirm}>
              
                Cập nhật
              </Button>
            </div>
          </form>
        }
      </div>
    </Modal>);

}