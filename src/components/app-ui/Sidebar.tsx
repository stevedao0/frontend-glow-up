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
  UserCircle2Icon,
  SearchIcon,
  ShieldIcon,
  SparklesIcon,
  ChevronDownIcon,
  LockIcon,
  PrinterIcon } from
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
{
  key: 'dashboard',
  label: 'Dashboard',
  icon: <LayoutDashboardIcon className="h-[15px] w-[15px]" />,
  requiredPerm: 'dashboard.view'
}];

const CONTRACTS_CHILDREN: Item[] = [
{
  key: 'contracts.list',
  label: 'Danh sách hợp đồng',
  icon: <ListIcon className="h-[15px] w-[15px]" />,
  requiredPerm: 'contracts.view'
},
{
  key: 'contracts.create',
  label: 'Tạo hợp đồng',
  icon: <FilePlusIcon className="h-[15px] w-[15px]" />,
  requiredPerm: 'contracts.create'
},
{
  key: 'contracts.gcn',
  label: 'Giấy chứng nhận',
  icon: <AwardIcon className="h-[15px] w-[15px]" />,
  requiredPerm: 'certificates.view'
},
{
  key: 'contracts.print',
  label: 'In GCN',
  icon: <PrinterIcon className="h-[15px] w-[15px]" />,
  requiredPerm: 'certificates.view'
}];

const BUSINESS_REST: Item[] = [
{
  key: 'annexes',
  label: 'Phụ lục',
  icon: <PaperclipIcon className="h-[15px] w-[15px]" />,
  requiredPerm: 'contracts.view'
},
{
  key: 'dispatch',
  label: 'Công văn',
  icon: <MailIcon className="h-[15px] w-[15px]" />,
  requiredPerm: 'contracts.view'
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
  requiredPerm: 'search.view'
}];

const SYSTEM: Item[] = [
{
  key: 'admin.users',
  label: 'Quản lý người dùng',
  icon: <ShieldIcon className="h-[15px] w-[15px]" />,
  requiredPerm: 'admin.users.view'
},
{
  key: 'admin.permissions',
  label: 'Ma trận phân quyền',
  icon: <ShieldIcon className="h-[15px] w-[15px]" />,
  requiredPerm: 'admin.roles.view'
},
{
  key: 'assistant',
  label: 'AI Assistant',
  icon: <SparklesIcon className="h-[15px] w-[15px]" />,
  badge: 'Beta',
  requiredPerm: 'ai.view'
}];

const CONTRACT_KEYS: RouteKey[] = [...CONTRACTS_CHILDREN.map((c) => c.key), 'contracts.detail'];
export function Sidebar({
  current,
  onNavigate



}: {current: RouteKey;onNavigate: (k: RouteKey) => void;}) {
  const { hasPermission, currentUser } = useAuth();
  const [contractsOpen, setContractsOpen] = useState(
    CONTRACT_KEYS.includes(current)
  );
  const renderItem = (it: Item, indent = false) => {
    const isManager = currentUser?.role === 'manager';
    const isAdminItem = it.key === 'admin.users' || it.key === 'admin.permissions';
    const showDisabled = isManager && isAdminItem;
    const hasAccess = it.requiredPerm ? hasPermission(it.requiredPerm) : true;
    if (!hasAccess && !showDisabled) return null;
    const active = current === it.key;
    if (showDisabled) {
      return (
        <div
          key={it.key}
          className={`group relative w-full flex items-center gap-3 ${indent ? 'pl-9 pr-3' : 'px-3'} py-1.5 rounded-md text-[13px] font-medium text-[#8a7560] cursor-not-allowed`}
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
              ? 'text-[#2d1f14] border-[#c89968] font-medium'
              : 'text-[#8a7560] hover:text-[#2d1f14] border-[#d9c9b3]'
          }`}>
          <span className="flex-1 text-left truncate">{it.label}</span>
        </button>);
    }
    return (
      <button
        key={it.key}
        type="button"
        onClick={() => onNavigate(it.key)}
        className={`group relative w-full flex items-center gap-3 px-3 py-2 rounded-md text-[13px] font-medium transition-all duration-fast ease-out ${
          active
            ? 'text-[#2d1f14] bg-gradient-to-r from-[#c89968]/25 via-[#c89968]/10 to-transparent ring-1 ring-inset ring-[#c89968]/40'
            : 'text-[#6b5641] hover:text-[#2d1f14] hover:bg-[#2d1f14]/[0.04]'
        }`}>
        {active && (
          <span className="absolute left-0 top-1.5 bottom-1.5 w-[2px] rounded-r bg-[#c89968] shadow-[0_0_8px_rgba(200,153,104,0.6)]" />
        )}
        <span className={`shrink-0 ${active ? 'text-[#9c6d3e]' : 'text-[#8a7560] group-hover:text-[#5a4533]'}`}>
          {it.icon}
        </span>
        <span className="flex-1 text-left truncate">{it.label}</span>
        {it.badge &&
        <span className="text-[9px] font-bold uppercase tracking-[0.1em] px-1.5 py-0.5 rounded bg-[#c89968]/15 text-[#7a4a22] ring-1 ring-inset ring-[#c89968]/30">
            {it.badge}
          </span>
        }
      </button>);
  };
  const groupLabel = (label: string) =>
  <p className="px-3 mt-5 mb-2 text-[10px] font-bold uppercase tracking-[0.18em] text-[#9c8569]">
      {label}
    </p>;

  const contractsActive = CONTRACT_KEYS.includes(current);
  return (
    <aside className="hidden md:flex w-64 shrink-0 flex-col h-screen sticky top-0 z-30 bg-[#f5efe2] border-r border-[#d9c9b3] text-[#2d1f14] relative overflow-hidden">
      {/* Subtle staff lines decoration — top of sidebar */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-32 opacity-[0.18]"
        style={{
          backgroundImage:
            'repeating-linear-gradient(to bottom, transparent 0, transparent 5px, #c89968 5px, #c89968 6px)',
          maskImage: 'linear-gradient(to bottom, black, transparent)',
          WebkitMaskImage: 'linear-gradient(to bottom, black, transparent)',
        }}
      />

      {/* Brand — official VCPMC logo on white tile + rose-gold ring */}
      <div className="relative px-5 py-4 border-b border-[#d9c9b3] flex items-center gap-3">
        <div className="relative h-10 w-10 rounded-md bg-white flex items-center justify-center shadow-md shadow-[#9c6d3e]/20 ring-1 ring-inset ring-[#c89968]/60 overflow-hidden">
          <img src={vcpmcLogo} alt="VCPMC" className="h-full w-full object-cover" />
          <span className="absolute -bottom-0.5 -right-0.5 h-1.5 w-1.5 rounded-full bg-[#c89968] shadow-[0_0_6px_rgba(200,153,104,0.8)]" />
        </div>
        <div className="flex flex-col leading-tight min-w-0">
          <span className="text-[12px] font-bold text-[#2d1f14] tracking-tight uppercase">
            VCPMC
          </span>
          <span className="text-[9px] text-[#9c6d3e] uppercase tracking-[0.18em] font-semibold leading-tight">
            Quyền tác giả Âm nhạc · Hợp đồng
          </span>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto scrollbar-thin px-3 pb-4">
        {groupLabel('Tổng quan')}
        <div className="flex flex-col gap-0.5">
          {TOP.map((it) => renderItem(it))}
        </div>

        {hasPermission('contracts.view') &&
        <>
            {groupLabel('Nghiệp vụ')}
            <div className="flex flex-col gap-0.5">
              <button
              type="button"
              onClick={() => setContractsOpen((o) => !o)}
              className={`group w-full flex items-center gap-3 px-3 py-2 rounded-md text-[13px] font-medium transition-colors ${
                contractsActive
                  ? 'text-[#7a4a22] bg-[#c89968]/15 ring-1 ring-inset ring-[#c89968]/35'
                  : 'text-[#6b5641] hover:text-[#2d1f14] hover:bg-[#2d1f14]/[0.04]'
              }`}>
                <span className={`shrink-0 ${contractsActive ? 'text-[#9c6d3e]' : 'text-[#8a7560] group-hover:text-[#5a4533]'}`}>
                  <FileTextIcon className="h-[15px] w-[15px]" />
                </span>
                <span className="flex-1 text-left">Hợp đồng</span>
                <ChevronDownIcon
                className={`h-3 w-3 text-[#8a7560] transition-transform duration-fast ${contractsOpen ? 'rotate-0' : '-rotate-90'}`} />
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

      <div className="px-4 py-3 border-t border-[#d9c9b3] flex items-center justify-between text-[10px] text-[#8a7560]">
        <span className="font-mono font-medium tracking-tight">v1.0 · INTERNAL</span>
        <span className="inline-flex items-center gap-1.5">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-600 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
          <span className="font-bold uppercase tracking-wider">Online</span>
        </span>
      </div>
    </aside>);

}
