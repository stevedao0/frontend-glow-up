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
  PrinterIcon } from
'lucide-react';
import { RouteKey } from '../../data/routes';
import { useAuth } from '../../lib/auth';
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
    // Special case for Manager seeing Admin as disabled
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
          className={`group relative w-full flex items-center gap-2.5 ${indent ? 'pl-9 pr-3' : 'px-3'} py-2.5 rounded-lg text-[13px] font-medium text-zinc-600 cursor-not-allowed`}
          title="Không có quyền">
          
          <span className="shrink-0 text-zinc-600 opacity-50">{it.icon}</span>
          <span className="flex-1 text-left truncate opacity-50">
            {it.label}
          </span>
          <LockIcon className="h-3 w-3 text-zinc-600 opacity-50" />
        </div>);

    }
    return (
      <button
        key={it.key}
        type="button"
        onClick={() => onNavigate(it.key)}
        className={`group relative w-full flex items-center gap-2.5 ${indent ? 'pl-9 pr-3' : 'px-3'} py-2.5 rounded-lg text-[13px] font-medium transition-all duration-150 ${active ? 'text-white bg-gradient-to-r from-indigo-500/15 via-violet-500/8 to-transparent ring-1 ring-inset ring-indigo-500/15 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]' : 'text-zinc-400 hover:text-zinc-100 hover:bg-white/[0.04]'}`}>
        
        {active &&
        <span
          aria-hidden
          className="absolute left-0 top-1/2 -translate-y-1/2 h-5 w-0.5 rounded-r-full bg-gradient-to-b from-indigo-400 to-violet-400 shadow-[0_0_10px_rgba(129,140,248,0.7)]" />

        }
        <span
          className={`shrink-0 transition-colors ${active ? 'text-indigo-300' : 'text-zinc-500 group-hover:text-zinc-300'}`}>
          
          {it.icon}
        </span>
        <span className="flex-1 text-left truncate">{it.label}</span>
        {it.badge &&
        <span className="text-[9px] font-bold uppercase tracking-[0.1em] px-1.5 py-0.5 rounded-md bg-violet-500/15 text-violet-300 ring-1 ring-inset ring-violet-400/20">
            {it.badge}
          </span>
        }
      </button>);

  };
  const groupLabel = (label: string) =>
  <p className="px-3 mt-6 mb-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-zinc-500/80">
      {label}
    </p>;

  const contractsActive = CONTRACT_KEYS.includes(current);
  return (
    <aside className="hidden md:flex w-64 shrink-0 flex-col h-screen sticky top-0 z-30 text-zinc-200 relative">
      {/* Background */}
      <div
        aria-hidden
        className="absolute inset-0 -z-10"
        style={{
          background:
          'linear-gradient(180deg, #0a0a14 0%, #0a0a14 60%, #0d0d1a 100%)'
        }} />
      
      {/* Top accent glow */}
      <div
        aria-hidden
        className="absolute inset-x-0 top-0 h-32 -z-10 opacity-60"
        style={{
          background:
          'radial-gradient(ellipse at top, rgba(99,102,241,0.15) 0%, transparent 60%)'
        }} />
      
      {/* Right border */}
      <div
        aria-hidden
        className="absolute top-0 bottom-0 right-0 w-px bg-gradient-to-b from-white/5 via-white/[0.03] to-transparent" />
      

      {/* Brand */}
      <div className="h-16 px-4 flex items-center gap-3 border-b border-white/[0.06]">
        <div className="relative h-8 w-8 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-500/30">
          <span className="text-white text-sm font-bold tracking-tight">V</span>
          <span
            aria-hidden
            className="absolute inset-0 rounded-lg ring-1 ring-inset ring-white/20" />
          
        </div>
        <div className="flex flex-col leading-tight min-w-0">
          <span className="text-[13px] font-semibold text-white tracking-tight">
            VCPMC
          </span>
          <span className="text-[10px] text-zinc-500 uppercase tracking-[0.16em]">
            Contract Suite
          </span>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto scrollbar-thin px-3 pb-4">
        {groupLabel('Tổng quan')}
        <div className="flex flex-col gap-1">
          {TOP.map((it) => renderItem(it))}
        </div>

        {hasPermission('contracts.view') &&
        <>
            {groupLabel('Nghiệp vụ')}
            <div className="flex flex-col gap-1">
              <button
              type="button"
              onClick={() => setContractsOpen((o) => !o)}
              className={`group w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-[13px] font-medium transition-colors ${contractsActive ? 'text-white' : 'text-zinc-400 hover:text-zinc-100 hover:bg-white/[0.04]'}`}>
              
                <span
                className={`shrink-0 ${contractsActive ? 'text-indigo-300' : 'text-zinc-500 group-hover:text-zinc-300'}`}>
                
                  <FileTextIcon className="h-[15px] w-[15px]" />
                </span>
                <span className="flex-1 text-left">Hợp đồng</span>
                <ChevronDownIcon
                className={`h-3.5 w-3.5 text-zinc-500 transition-transform duration-200 ${contractsOpen ? 'rotate-0' : '-rotate-90'}`} />
              
              </button>
              <div
              className={`flex flex-col gap-1 overflow-hidden transition-all duration-200 ${contractsOpen ? 'max-h-56 opacity-100 mt-0.5' : 'max-h-0 opacity-0'}`}>
              
                {CONTRACTS_CHILDREN.map((c) => renderItem(c, true))}
              </div>
              {BUSINESS_REST.map((it) => renderItem(it))}
            </div>
          </>
        }

        {groupLabel('Hệ thống')}
        <div className="flex flex-col gap-1">
          {SYSTEM.map((it) => renderItem(it))}
        </div>
      </nav>

      <div className="px-4 py-3 border-t border-white/[0.06] flex items-center justify-between text-[10px] text-zinc-500">
        <span className="font-medium tracking-wide">v1.0 · Internal</span>
        <span className="inline-flex items-center gap-1">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.6)]" />
          Online
        </span>
      </div>
    </aside>);

}
