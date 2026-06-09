import React, { useMemo, useState } from 'react';
import {
  LayoutDashboardIcon,
  FileTextIcon,
  FilePlusIcon,
  ListIcon,
  PaperclipIcon,
  MailIcon,
  BarChart3Icon,
  UserCircle2Icon,
  SearchIcon,
  ShieldIcon,
  SparklesIcon,
  ChevronDownIcon,
  LockIcon,
  PrinterIcon,
  UploadIcon } from
'lucide-react';
import { RouteKey } from '../../data/routes';
import { DOMAINS } from '../../data/authData';
import { useAuth } from '../../lib/auth';
import vcpmcLogo from '../../assets/vcpmc-logo-animated.webp';
type Item = {
  key: RouteKey;
  label: string;
  icon: React.ReactNode;
  badge?: string;
  requiredPerm?: string;
};
const TOP: Item[] = [
{
  key: 'dashboard',
  label: 'Dashboard',
  icon: <LayoutDashboardIcon className="h-[15px] w-[15px]" />,
  requiredPerm: 'portal.access'
}];

const CONTRACTS_CHILDREN: Item[] = [
{
  key: 'contracts.list',
  label: 'Danh sách hợp đồng',
  icon: <ListIcon className="h-[15px] w-[15px]" />,
  requiredPerm: 'contracts.read'
},
{
  key: 'contracts.create',
  label: 'Tạo hợp đồng',
  icon: <FilePlusIcon className="h-[15px] w-[15px]" />,
  requiredPerm: 'contracts.create'
},
{
  key: 'contracts.print',
  label: 'In GCN',
  icon: <PrinterIcon className="h-[15px] w-[15px]" />,
  requiredPerm: 'contracts.read'
}];

const BUSINESS_REST: Item[] = [
{
  key: 'annexes',
  label: 'Phụ lục',
  icon: <PaperclipIcon className="h-[15px] w-[15px]" />,
  requiredPerm: 'annexes.read'
},
{
  key: 'dispatch',
  label: 'Công văn',
  icon: <MailIcon className="h-[15px] w-[15px]" />,
  requiredPerm: 'annexes.read'
},
{
  key: 'reports',
  label: 'Báo cáo',
  icon: <BarChart3Icon className="h-[15px] w-[15px]" />,
  requiredPerm: 'reports.view'
},
{
  key: 'search',
  label: 'Tìm kiếm',
  icon: <SearchIcon className="h-[15px] w-[15px]" />,
  requiredPerm: 'works.read'
}];

const SYSTEM: Item[] = [
{
  key: 'admin.users',
  label: 'Quản lý người dùng',
  icon: <ShieldIcon className="h-[15px] w-[15px]" />,
  requiredPerm: 'admin.users.manage'
},
{
  key: 'admin.permissions',
  label: 'Ma trận phân quyền',
  icon: <ShieldIcon className="h-[15px] w-[15px]" />,
  requiredPerm: 'admin.users.manage'
},
{
  key: 'admin.import',
  label: 'Import Excel',
  icon: <UploadIcon className="h-[15px] w-[15px]" />,
  requiredPerm: 'admin.users.manage'
},
{
  key: 'assistant',
  label: 'AI Assistant',
  icon: <SparklesIcon className="h-[15px] w-[15px]" />,
  badge: 'Beta',
  requiredPerm: 'portal.access'
}];

const CONTRACT_KEYS: RouteKey[] = [...CONTRACTS_CHILDREN.map((c) => c.key), 'contracts.detail'];
export function Sidebar({
  current,
  onNavigate,
  workspace,



}: {current: RouteKey;onNavigate: (k: RouteKey) => void;workspace?: string;}) {
  const { hasPermission, currentUser } = useAuth();
  const [contractsOpen, setContractsOpen] = useState(
    CONTRACT_KEYS.includes(current)
  );
  const renderItem = (it: Item, indent = false) => {
    const isManager = currentUser?.role === 'manager';
    const isAdminItem = it.key === 'admin.users' || it.key === 'admin.permissions' || it.key === 'admin.import';
    const showDisabled = isManager && isAdminItem;
    const hasAccess = it.requiredPerm ? hasPermission(it.requiredPerm) : true;
    if (!hasAccess && !showDisabled) return null;
    const active = current === it.key;
    if (showDisabled) {
      return (
        <div
          key={it.key}
          className={`group relative w-full flex items-center gap-3 ${indent ? 'pl-9 pr-3' : 'px-3'} py-1.5 rounded-xl text-[13px] font-medium text-white/35 cursor-not-allowed`}
          title="Không có quyền">
          <span className="shrink-0 opacity-50">{it.icon}</span>
          <span className="flex-1 text-left truncate opacity-50">{it.label}</span>
          <LockIcon className="h-3 w-3 opacity-50" />
        </div>);
    }
    if (indent) {
      return (
        <button
          key={it.key}
          type="button"
          onClick={() => onNavigate(it.key)}
          className={`group relative w-full flex items-center gap-3 pl-7 pr-3 py-2 text-[13px] transition-colors -ml-px border-l ${
            active
              ? 'text-white border-[var(--vc-enterprise-accent)] font-medium bg-white/6'
              : 'text-white/62 hover:text-white border-white/10 hover:border-white/22'
          }`}>
          <span className="flex-1 text-left truncate">{it.label}</span>
        </button>);
    }
    return (
      <button
        key={it.key}
        type="button"
        onClick={() => onNavigate(it.key)}
        className={`group relative w-full flex items-center gap-3 px-3 py-2.5 rounded-2xl text-[13px] font-medium transition-all duration-fast ease-out ${
          active
            ? 'text-white bg-white/8 ring-1 ring-inset ring-white/10 shadow-[0_10px_24px_-18px_rgba(56,184,153,0.8)]'
            : 'text-white/68 hover:text-white hover:bg-white/[0.045]'
        }`}>
        {active && (
          <span className="absolute left-0 top-2 bottom-2 w-[3px] rounded-r bg-[var(--vc-enterprise-accent)] shadow-[0_0_12px_rgba(56,184,153,0.55)]" />
        )}
        <span className={`shrink-0 ${active ? 'text-[var(--vc-enterprise-accent)]' : 'text-white/42 group-hover:text-white/78'}`}>
          {it.icon}
        </span>
        <span className="flex-1 text-left truncate">{it.label}</span>
        {it.badge &&
        <span className="text-[9px] font-bold uppercase tracking-[0.1em] px-1.5 py-0.5 rounded-full bg-white/8 text-[var(--vc-enterprise-accent)] ring-1 ring-inset ring-white/10">
            {it.badge}
          </span>
        }
      </button>);
  };
  const groupLabel = (label: string) =>
  <p className="px-3 mt-5 mb-2 text-[10px] font-bold uppercase tracking-[0.18em] text-white/42">
      {label}
    </p>;

  const contractsActive = CONTRACT_KEYS.includes(current);
  const activeWorkspace = useMemo(() => DOMAINS.find((item) => item.id === workspace), [workspace]);
  const primaryRailItems = [
    TOP[0],
    { key: 'contracts.list' as RouteKey, label: 'Hợp đồng', icon: <FileTextIcon className="h-[16px] w-[16px]" /> },
    { key: 'dispatch' as RouteKey, label: 'Công văn', icon: <MailIcon className="h-[16px] w-[16px]" /> },
    { key: 'reports' as RouteKey, label: 'Báo cáo', icon: <BarChart3Icon className="h-[16px] w-[16px]" /> },
    { key: 'search' as RouteKey, label: 'Tìm kiếm', icon: <SearchIcon className="h-[16px] w-[16px]" /> },
  ].filter((item) => {
    const match = item.key === 'contracts.list'
      ? hasPermission('contracts.read')
      : item.key === 'dispatch'
        ? hasPermission('annexes.read')
        : item.key === 'reports'
          ? hasPermission('reports.view')
          : item.key === 'search'
            ? hasPermission('works.read')
            : hasPermission('portal.access');
    return match;
  });

  const railActive = (key: RouteKey) => key === 'contracts.list' ? contractsActive : current === key;

  return (
    <aside className="vc-enterprise-sidebar hidden md:flex h-screen shrink-0 sticky top-0 z-30 overflow-hidden">
      <div className="vc-enterprise-icon-rail">
        <div className="vc-enterprise-icon-rail__top">
          <button type="button" className="vc-enterprise-rail-logo" onClick={() => onNavigate('dashboard')} aria-label="Go to dashboard">
            <img src={vcpmcLogo} alt="VCPMC" className="h-8 w-8 rounded-xl object-cover" />
          </button>
          <div className="vc-enterprise-rail-stack">
            {primaryRailItems.map((item) => {
              const active = railActive(item.key);
              return (
                <button
                  key={item.key}
                  type="button"
                  title={item.label}
                  onClick={() => onNavigate(item.key)}
                  className={`vc-enterprise-rail-button ${active ? 'is-active' : ''}`}
                >
                  {item.icon}
                </button>
              );
            })}
          </div>
        </div>
        <div className="vc-enterprise-rail-bottom">
          <div className="vc-enterprise-rail-status" title="Internal workspace online">
            <UserCircle2Icon className="h-4 w-4" />
          </div>
        </div>
      </div>

      <div className="vc-enterprise-sidebar-panel w-64 flex flex-col relative overflow-hidden">
      {/* Workspace panel accent lines */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-32 opacity-[0.18]"
        style={{
          backgroundImage:
            'repeating-linear-gradient(to bottom, transparent 0, transparent 7px, rgba(45,212,191,0.24) 7px, rgba(45,212,191,0.24) 8px)',
          maskImage: 'linear-gradient(to bottom, black, transparent)',
          WebkitMaskImage: 'linear-gradient(to bottom, black, transparent)',
        }}
      />

      <div className="relative px-5 py-5 border-b border-white/8 flex items-center gap-3">
        <div className="relative h-10 w-10 rounded-xl bg-white/95 flex items-center justify-center shadow-sm ring-1 ring-inset ring-white/70 overflow-hidden">
          <img src={vcpmcLogo} alt="VCPMC" className="h-full w-full object-cover" />
          <span className="absolute -bottom-0.5 -right-0.5 h-1.5 w-1.5 rounded-full bg-[var(--vc-enterprise-accent)] shadow-[0_0_6px_rgba(45,212,191,0.8)]" />
        </div>
        <div className="flex flex-col leading-tight min-w-0">
          <span className="text-[12px] font-bold text-white tracking-tight uppercase">
            VCPMC
          </span>
          <span className="text-[9px] text-[var(--vc-enterprise-accent)] uppercase tracking-[0.18em] font-semibold leading-tight">
            Quyền tác giả Âm nhạc · Hợp đồng
          </span>
        </div>
      </div>

      <div className="px-4 pt-4 pb-2">
        <div className="rounded-2xl border border-white/10 bg-white/[0.045] px-4 py-3">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-white/40">Workspace</p>
              <p className="mt-1 text-sm font-semibold text-white">{activeWorkspace?.label ?? 'Background'}</p>
            </div>
            <span className="vc-enterprise-badge vc-enterprise-tone-neutral">Background</span>
          </div>
          <p className="mt-2 text-xs leading-relaxed text-white/52">
            Điều hướng theo quyền truy cập thật, cùng một shell thống nhất cho dashboard và contracts.
          </p>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto scrollbar-thin px-3 pb-4 pt-3">
        {groupLabel('Tổng quan')}
        <div className="flex flex-col gap-0.5">
          {TOP.map((it) => renderItem(it))}
        </div>

        {hasPermission('contracts.read') &&
        <>
            {groupLabel('Nghiệp vụ')}
            <div className="flex flex-col gap-0.5">
              <button
              type="button"
              onClick={() => setContractsOpen((o) => !o)}
              className={`group w-full flex items-center gap-3 px-3 py-2.5 rounded-2xl text-[13px] font-medium transition-colors ${
                contractsActive
                  ? 'text-white bg-white/8 ring-1 ring-inset ring-white/10'
                  : 'text-white/68 hover:text-white hover:bg-white/[0.045]'
              }`}>
                <span className={`shrink-0 ${contractsActive ? 'text-[var(--vc-enterprise-accent)]' : 'text-white/42 group-hover:text-white/78'}`}>
                  <FileTextIcon className="h-[15px] w-[15px]" />
                </span>
                <span className="flex-1 text-left">Hợp đồng</span>
                <ChevronDownIcon
                className={`h-3 w-3 text-white/42 transition-transform duration-fast ${contractsOpen ? 'rotate-0' : '-rotate-90'}`} />
              </button>
              <div
              className={`flex flex-col overflow-hidden transition-all duration-base ml-4 ${contractsOpen ? 'max-h-72 opacity-100 mt-2' : 'max-h-0 opacity-0'}`}>
                {CONTRACTS_CHILDREN.map((c) => renderItem(c, true))}
              </div>
              {BUSINESS_REST.map((it) => renderItem(it))}
            </div>
          </>
        }

        {groupLabel('Hệ thống')}
        <div className="flex flex-col gap-0.5">
          {SYSTEM.map((it) => renderItem(it))}
        </div>
      </nav>

      <div className="mt-auto px-4 py-4 border-t border-white/10 flex items-center justify-between text-[10px] text-white/48">
          <span className="font-mono font-medium tracking-tight text-white/56">v1.0 · INTERNAL</span>
        <span className="inline-flex items-center gap-1.5">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-600 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
          <span className="font-bold uppercase tracking-wider text-white/72">Online</span>
        </span>
      </div>
      </div>
    </aside>);

}
