import React, { useState } from 'react';
import {
  LayoutDashboardIcon,
  FileTextIcon,
  FilePlusIcon,
  ListIcon,
  AwardIcon,
  PaperclipIcon,
  MailIcon,
  BarChart3Icon,
  SearchIcon,
  ShieldIcon,
  SparklesIcon,
  ChevronDownIcon,
  LockIcon,
  PrinterIcon,
  UploadIcon } from
'lucide-react';
import { RouteKey } from '../../data/routes';
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
{ key: 'dashboard', label: 'Dashboard', icon: <LayoutDashboardIcon className="h-[15px] w-[15px]" />, requiredPerm: 'portal.access' }];

const CONTRACTS_CHILDREN: Item[] = [
{ key: 'contracts.list', label: 'Danh sách hợp đồng', icon: <ListIcon className="h-[15px] w-[15px]" />, requiredPerm: 'contracts.read' },
{ key: 'contracts.create', label: 'Tạo hợp đồng', icon: <FilePlusIcon className="h-[15px] w-[15px]" />, requiredPerm: 'contracts.create' },
{ key: 'contracts.gcn', label: 'Giấy chứng nhận', icon: <AwardIcon className="h-[15px] w-[15px]" />, requiredPerm: 'contracts.read' },
{ key: 'contracts.print', label: 'In GCN', icon: <PrinterIcon className="h-[15px] w-[15px]" />, requiredPerm: 'contracts.read' }];

const BUSINESS_REST: Item[] = [
{ key: 'annexes', label: 'Phụ lục', icon: <PaperclipIcon className="h-[15px] w-[15px]" />, requiredPerm: 'annexes.read' },
{ key: 'dispatch', label: 'Công văn', icon: <MailIcon className="h-[15px] w-[15px]" />, requiredPerm: 'annexes.read' },
{ key: 'reports', label: 'Báo cáo', icon: <BarChart3Icon className="h-[15px] w-[15px]" />, requiredPerm: 'reports.view' },
{ key: 'search', label: 'Tìm kiếm', icon: <SearchIcon className="h-[15px] w-[15px]" />, requiredPerm: 'works.read' }];

const SYSTEM: Item[] = [
{ key: 'admin.users', label: 'Quản lý người dùng', icon: <ShieldIcon className="h-[15px] w-[15px]" />, requiredPerm: 'admin.users.manage' },
{ key: 'admin.permissions', label: 'Ma trận phân quyền', icon: <ShieldIcon className="h-[15px] w-[15px]" />, requiredPerm: 'admin.users.manage' },
{ key: 'admin.import', label: 'Import Excel', icon: <UploadIcon className="h-[15px] w-[15px]" />, requiredPerm: 'admin.users.manage' },
{ key: 'assistant', label: 'AI Assistant', icon: <SparklesIcon className="h-[15px] w-[15px]" />, badge: 'Beta', requiredPerm: 'portal.access' }];

const CONTRACT_KEYS: RouteKey[] = [...CONTRACTS_CHILDREN.map((c) => c.key), 'contracts.detail'];

export function Sidebar({
  current,
  onNavigate,
}: { current: RouteKey; onNavigate: (k: RouteKey) => void; }) {
  const { hasPermission, currentUser } = useAuth();
  const [contractsOpen, setContractsOpen] = useState(CONTRACT_KEYS.includes(current));

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
          className={`group relative w-full flex items-center gap-3 ${indent ? 'pl-9 pr-3' : 'px-3'} py-1.5 rounded-md text-[13px] font-medium text-[#5d7a6e]/60 cursor-not-allowed`}
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
          className={`group relative w-full flex items-center gap-3 pl-7 pr-3 py-1.5 text-[13px] transition-colors -ml-px border-l ${
            active
              ? 'text-[#f4ecd8] border-[#c89968] font-semibold'
              : 'text-[#9db5aa] hover:text-[#f4ecd8] border-white/10 hover:border-[#c89968]/60'
          }`}>
          <span className="flex-1 text-left truncate">{it.label}</span>
        </button>);
    }

    return (
      <button
        key={it.key}
        type="button"
        onClick={() => onNavigate(it.key)}
        className={`group relative w-full flex items-center gap-3 px-3 py-2 rounded-lg text-[13px] font-medium transition-all duration-fast ease-out ${
          active
            ? 'text-[#fbf3e0] premium-sidebar-active-dark'
            : 'text-[#b8cdc1] hover:text-[#fbf3e0] hover:bg-white/[0.05]'
        }`}>
        {active && (
          <span className="absolute left-0 top-1 bottom-1 w-[3px] rounded-r bg-gradient-to-b from-[#e8c4a0] via-[#c89968] to-[#9c6d3e] shadow-[0_0_12px_rgba(200,153,104,0.85)]" />
        )}
        <span className={`shrink-0 h-7 w-7 inline-flex items-center justify-center rounded-md transition-all ${
          active
            ? 'bg-gradient-to-br from-[#c89968] to-[#9c6d3e] text-white ring-1 ring-[#f0d4a8]/50 shadow-[0_0_14px_rgba(200,153,104,0.55)]'
            : 'text-[#9db5aa] group-hover:text-[#f0d4a8] group-hover:bg-white/[0.06]'
        }`}>
          {it.icon}
        </span>
        <span className="flex-1 text-left truncate">{it.label}</span>
        {it.badge && (
          <span className="text-[9px] font-bold uppercase tracking-[0.1em] px-1.5 py-0.5 rounded bg-gradient-to-b from-[#e8c4a0] to-[#c89968] text-[#3d2410] ring-1 ring-inset ring-[#f0d4a8]/60 shadow-sm">
            {it.badge}
          </span>
        )}
      </button>);
  };

  const groupLabel = (label: string) =>
    <div className="px-3 mt-5 mb-2 flex items-center gap-2">
      <span className="h-px flex-1 bg-gradient-to-r from-transparent via-[#c89968]/35 to-transparent" />
      <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#c89968]">{label}</p>
      <span className="h-px flex-1 bg-gradient-to-r from-[#c89968]/35 via-transparent to-transparent" />
    </div>;

  const contractsActive = CONTRACT_KEYS.includes(current);

  return (
    <aside className="hidden md:flex w-64 shrink-0 flex-col h-screen sticky top-0 z-30 premium-sidebar-dark text-[#e8e0cf] relative overflow-hidden">
      {/* decorative top aura */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-48 opacity-60"
        style={{
          background:
            'radial-gradient(ellipse 80% 60% at 50% 0%, rgba(200,153,104,0.22), transparent 70%)',
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-0 h-40 opacity-50"
        style={{
          background:
            'radial-gradient(ellipse 90% 70% at 50% 100%, rgba(13,122,95,0.30), transparent 70%)',
        }}
      />

      {/* Brand */}
      <div className="relative px-5 py-4 border-b border-white/10 flex items-center gap-3">
        <div className="relative h-10 w-10 rounded-md bg-[#f7efdf] flex items-center justify-center shadow-lg shadow-black/40 ring-1 ring-[#c89968]/60 overflow-hidden">
          <img src={vcpmcLogo} alt="VCPMC" className="h-full w-full object-cover" />
          <span className="absolute -bottom-0.5 -right-0.5 h-1.5 w-1.5 rounded-full bg-[#c89968] shadow-[0_0_8px_rgba(200,153,104,0.95)]" />
        </div>
        <div className="flex flex-col leading-tight min-w-0">
          <span className="text-[12px] font-bold text-[#f4ecd8] tracking-tight uppercase">
            VCPMC
          </span>
          <span className="text-[9px] text-[#c89968] uppercase tracking-[0.18em] font-semibold leading-tight">
            Quyền tác giả Âm nhạc · Hợp đồng
          </span>
        </div>
      </div>

      <nav className="relative flex-1 overflow-y-auto scrollbar-thin px-3 pb-4">
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
              className={`group w-full flex items-center gap-3 px-3 py-2 rounded-md text-[13px] font-medium transition-colors ${
                contractsActive
                  ? 'text-[#fbf3e0] bg-white/[0.06] ring-1 ring-inset ring-[#c89968]/30'
                  : 'text-[#b8cdc1] hover:text-[#fbf3e0] hover:bg-white/[0.04]'
              }`}>
                <span className={`shrink-0 ${contractsActive ? 'text-[#e8c4a0]' : 'text-[#9db5aa] group-hover:text-[#f0d4a8]'}`}>
                  <FileTextIcon className="h-[15px] w-[15px]" />
                </span>
                <span className="flex-1 text-left">Hợp đồng</span>
                <ChevronDownIcon
                className={`h-3 w-3 text-[#9db5aa] transition-transform duration-fast ${contractsOpen ? 'rotate-0' : '-rotate-90'}`} />
              </button>
              <div
              className={`flex flex-col overflow-hidden transition-all duration-base ml-4 ${contractsOpen ? 'max-h-72 opacity-100 mt-1' : 'max-h-0 opacity-0'}`}>
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

      <div className="relative px-4 py-3 border-t border-white/10 flex items-center justify-between text-[10px] text-[#8ea69a]">
        <span className="font-mono font-medium tracking-tight">v1.0 · INTERNAL</span>
        <span className="inline-flex items-center gap-1.5">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.7)]" />
          <span className="font-bold uppercase tracking-wider text-[#b8cdc1]">Online</span>
        </span>
      </div>
    </aside>);

}
