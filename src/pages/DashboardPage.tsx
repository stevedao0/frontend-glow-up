import React, { useState } from 'react';
import {
  FilePlusIcon,
  SearchIcon,
  FileTextIcon,
  CheckCircle2Icon,
  AlertTriangleIcon,
  Music2Icon,
  WalletIcon,
  ArrowRightIcon,
  ChevronRightIcon } from
'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell } from
'recharts';
import { Page, PageHeader } from '../components/app-ui/Page';
import { ContentCard } from '../components/app-ui/ContentCard';
import { MetricStrip } from '../components/app-ui/MetricCard';
import { HeroPanel } from '../components/app-ui/HeroPanel';
import { Button } from '../components/app-ui/Button';
import { Select } from '../components/app-ui/Select';
import { ProgressStatusPanel } from '../components/app-ui/ProgressStatusPanel';
import { ActivityList } from '../components/app-ui/ActivityList';
import { ExpiringList } from '../components/app-ui/ExpiringList';
import { StatusBadge } from '../components/app-ui/StatusBadge';
import { RouteKey } from '../data/routes';
import {
  VCPMC_STATS,
  STATUS_BREAKDOWN,
  RECENT_ACTIVITIES,
  EXPIRING_CONTRACTS,
  REVENUE_BY_YEAR } from
'../data/mockDashboard';
import { RECENT_CONTRACTS } from '../data/mockContracts';
import { formatCurrency, formatDate, formatNumber } from '../lib/format';
const YEAR_OPTIONS = [
{
  value: '2024',
  label: '2024'
},
{
  value: '2025',
  label: '2025'
},
{
  value: '2026',
  label: '2026'
}];

export function DashboardPage({
  userEmail,
  onNavigate



}: {userEmail: string;onNavigate: (k: RouteKey) => void;}) {
  const [year, setYear] = useState('2026');
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);
  const revenueRevenuePct =
  (VCPMC_STATS.revenue2026 - VCPMC_STATS.revenue2025) /
  VCPMC_STATS.revenue2025 *
  100;
  return (
    <Page>
      <PageHeader
        title={
        <>
            Xin chào, <span className="text-indigo-600">{userEmail}</span>
          </>
        }
        description="Tổng quan vận hành hôm nay."
        actions={
        <Select
          value={year}
          onChange={setYear}
          options={YEAR_OPTIONS}
          className="w-32" />

        } />
      

      {/* Hero */}
      <HeroPanel
        eyebrow="Tổng quan vận hành"
        title={
        <>
            <span className="tabular-nums">
              {formatNumber(VCPMC_STATS.totalBackground)}
            </span>{' '}
            hợp đồng đang quản lý
            <span className="text-indigo-300"> · </span>
            <span className="tabular-nums">27</span> hành động cần xử lý
          </>
        }
        description={`Có ${VCPMC_STATS.expiringIn30Days} hợp đồng sắp hết trong 30 ngày · ${VCPMC_STATS.expiringIn60Days} sắp hết trong 60 ngày · ${formatNumber(VCPMC_STATS.gcnDraft)} GCN bản nháp đang chờ phát hành.`}
        stats={[
        {
          label: 'GCN bản nháp',
          value: formatNumber(VCPMC_STATS.gcnDraft)
        },
        {
          label: 'Sắp hết 60 ngày',
          value: formatNumber(VCPMC_STATS.expiringIn60Days)
        },
        {
          label: 'Chờ tái ký',
          value: formatNumber(VCPMC_STATS.pendingRenewal)
        }]
        }
        actions={
        <>
            <Button
            variant="glassPrimary"
            size="lg"
            leftIcon={<FilePlusIcon className="h-4 w-4" />}
            onClick={() => onNavigate('contracts.create')}>
            
              Tạo hợp đồng mới
            </Button>
            <Button
            variant="glass"
            size="lg"
            leftIcon={<SearchIcon className="h-4 w-4" />}
            onClick={() => onNavigate('search')}>
            
              Tìm kiếm
            </Button>
          </>
        } />
      

      {/* KPIs — all real numbers */}
      <MetricStrip
        items={[
        {
          label: 'Tổng hợp đồng',
          value: formatNumber(VCPMC_STATS.totalBackground),
          tone: 'indigo',
          icon: <FileTextIcon className="h-4 w-4" />,
          hint: 'Workspace Background'
        },
        {
          label: 'Còn hiệu lực',
          value: formatNumber(VCPMC_STATS.active),
          tone: 'emerald',
          icon: <CheckCircle2Icon className="h-4 w-4" />,
          hint: '3,6% tổng số'
        },
        {
          label: 'Sắp hết 60 ngày',
          value: formatNumber(VCPMC_STATS.expiringIn60Days),
          tone: 'amber',
          icon: <AlertTriangleIcon className="h-4 w-4" />,
          hint: `Trong đó ${VCPMC_STATS.expiringIn30Days} hết trong 30 ngày`
        },
        {
          label: 'Tác phẩm',
          value: formatNumber(VCPMC_STATS.totalWorks),
          tone: 'violet',
          icon: <Music2Icon className="h-4 w-4" />,
          hint: 'Đang quản lý'
        },
        {
          label: 'Doanh thu 2026',
          value: '1,075 tỷ',
          tone: 'cyan',
          icon: <WalletIcon className="h-4 w-4" />,
          delta: {
            value: `${revenueRevenuePct.toFixed(1)}%`,
            tone: 'down'
          },
          hint: 'So với 2025'
        }]
        } />
      

      {/* Year compare + Status breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <ContentCard
          title="Doanh thu theo năm"
          description="Đơn vị: tỷ VND · So sánh 2025 và 2026 (lũy kế đến nay)"
          className="lg:col-span-2"
          accent
          actions={
          <div className="flex items-center gap-3 text-[11px]">
              <div className="inline-flex items-center gap-1.5 text-zinc-500">
                <span className="h-2 w-2 rounded-full bg-zinc-400" />
                2025
              </div>
              <div className="inline-flex items-center gap-1.5 text-zinc-500">
                <span className="h-2 w-2 rounded-full bg-gradient-to-br from-indigo-500 to-violet-500" />
                2026
              </div>
            </div>
          }>
          
          <div className="h-72">
            <ResponsiveContainer>
              <BarChart
                data={REVENUE_BY_YEAR.map((y) => ({
                  ...y,
                  // billions VND for cleaner chart axis
                  revenueBn: y.revenue / 1000000000
                }))}
                margin={{
                  top: 10,
                  right: 16,
                  left: -10,
                  bottom: 0
                }}
                barCategoryGap="35%"
                onMouseLeave={() => setHoverIdx(null)}>
                
                <defs>
                  <linearGradient id="barFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#818cf8" stopOpacity={1} />
                    <stop
                      offset="100%"
                      stopColor="#6366f1"
                      stopOpacity={0.85} />
                    
                  </linearGradient>
                  <linearGradient id="barFillHover" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#a78bfa" stopOpacity={1} />
                    <stop offset="100%" stopColor="#7c3aed" stopOpacity={1} />
                  </linearGradient>
                  <linearGradient id="barFillPrev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#d4d4d8" stopOpacity={1} />
                    <stop offset="100%" stopColor="#a1a1aa" stopOpacity={1} />
                  </linearGradient>
                </defs>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="#e4e4e7"
                  vertical={false} />
                
                <XAxis
                  dataKey="year"
                  stroke="#a1a1aa"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  dy={4} />
                
                <YAxis
                  stroke="#a1a1aa"
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                  dx={-4}
                  tickFormatter={(v) => `${v}`} />
                
                <Tooltip
                  cursor={{
                    fill: 'rgba(99,102,241,0.06)'
                  }}
                  contentStyle={{
                    border: 'none',
                    borderRadius: 10,
                    background: 'rgba(15, 15, 25, 0.92)',
                    color: '#fff',
                    fontSize: 12,
                    padding: '8px 12px',
                    boxShadow: '0 10px 30px rgba(15,15,25,0.25)'
                  }}
                  labelStyle={{
                    color: '#a5b4fc',
                    fontWeight: 600,
                    marginBottom: 2
                  }}
                  itemStyle={{
                    color: '#fff'
                  }}
                  formatter={(v: number) => [
                  `${v.toLocaleString('vi-VN', {
                    maximumFractionDigits: 2
                  })} tỷ`,
                  'Doanh thu']
                  } />
                
                <Bar
                  dataKey="revenueBn"
                  radius={[6, 6, 0, 0]}
                  onMouseEnter={(_, idx) => setHoverIdx(idx)}>
                  
                  {REVENUE_BY_YEAR.map((_, i) =>
                  <Cell
                    key={i}
                    fill={
                    i === REVENUE_BY_YEAR.length - 1 ?
                    hoverIdx === i ?
                    'url(#barFillHover)' :
                    'url(#barFill)' :
                    'url(#barFillPrev)'
                    } />

                  )}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ContentCard>

        <ContentCard
          title="Tỷ lệ trạng thái hợp đồng"
          description="Phân bổ toàn bộ workspace Background"
          accent>
          
          <ProgressStatusPanel
            items={STATUS_BREAKDOWN}
            mode="relative"
            helper={`Tổng ${formatNumber(VCPMC_STATS.totalBackground)} hợp đồng. Số "Còn hiệu lực" đã bao gồm ${VCPMC_STATS.expiringIn60Days} đang sắp hết 60 ngày.`} />
          
        </ContentCard>
      </div>

      {/* Lists */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <ContentCard
          title="Hợp đồng sắp hết hạn"
          description="Trong 7 ngày tới · giá trị thật"
          className="lg:col-span-2"
          padded={false}
          actions={
          <Button
            variant="ghost"
            size="sm"
            rightIcon={<ArrowRightIcon className="h-3.5 w-3.5" />}
            onClick={() => onNavigate('contracts.list')}>
            
              Xem tất cả
            </Button>
          }>
          
          <ExpiringList items={EXPIRING_CONTRACTS} />
        </ContentCard>

        <ContentCard title="Hoạt động gần đây" padded={false}>
          <ActivityList items={RECENT_ACTIVITIES} />
        </ContentCard>
      </div>

      {/* Recent contracts */}
      <ContentCard
        title="Hợp đồng gần đây"
        description="6 hợp đồng được ký gần nhất từ workspace Background"
        padded={false}
        actions={
        <Button
          variant="secondary"
          size="sm"
          rightIcon={<ArrowRightIcon className="h-3.5 w-3.5" />}
          onClick={() => onNavigate('contracts.list')}>
          
            Xem danh sách
          </Button>
        }>
        
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gradient-to-b from-indigo-50/30 via-zinc-50 to-zinc-50/40 border-b border-zinc-200">
                <th className="px-5 py-3 text-[11px] font-semibold uppercase tracking-[0.08em] text-zinc-600 text-left">
                  Số hợp đồng
                </th>
                <th className="px-5 py-3 text-[11px] font-semibold uppercase tracking-[0.08em] text-zinc-600 text-left">
                  Đơn vị / Bảng hiệu
                </th>
                <th className="px-5 py-3 text-[11px] font-semibold uppercase tracking-[0.08em] text-zinc-600 text-left">
                  Lĩnh vực
                </th>
                <th className="px-5 py-3 text-[11px] font-semibold uppercase tracking-[0.08em] text-zinc-600 text-left">
                  Ngày lập
                </th>
                <th className="px-5 py-3 text-[11px] font-semibold uppercase tracking-[0.08em] text-zinc-600 text-right">
                  Giá trị
                </th>
                <th className="px-5 py-3 text-[11px] font-semibold uppercase tracking-[0.08em] text-zinc-600 text-left">
                  Trạng thái
                </th>
                <th className="w-10 px-2" aria-label="Hành động" />
              </tr>
            </thead>
            <tbody>
              {RECENT_CONTRACTS.map((c) =>
              <tr
                key={c.id}
                className="group/row relative border-b border-zinc-100/70 last:border-0 hover:bg-indigo-50/40 transition-colors cursor-pointer">
                
                  <td className="relative px-5 py-3.5 align-top">
                    <span
                    aria-hidden
                    className="absolute left-0 top-0 bottom-0 w-0.5 bg-gradient-to-b from-indigo-400 to-violet-400 opacity-0 group-hover/row:opacity-100 transition-opacity" />
                  
                    <span className="font-mono text-[13px] font-semibold text-indigo-700 group-hover/row:text-indigo-900 group-hover/row:underline underline-offset-2 decoration-indigo-300/60 transition-colors">
                      {c.contractNo}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 align-top max-w-xs">
                    <p className="font-medium text-zinc-900 leading-snug line-clamp-2">
                      {c.partner}
                    </p>
                    {c.brand &&
                  <p className="text-[12px] text-zinc-500 truncate mt-0.5">
                        {c.brand}
                      </p>
                  }
                  </td>
                  <td className="px-5 py-3.5 align-top text-zinc-600">
                    {c.field}
                  </td>
                  <td className="px-5 py-3.5 align-top text-zinc-600 tabular-nums">
                    {formatDate(c.signedDate)}
                  </td>
                  <td className="px-5 py-3.5 align-top text-right tabular-nums">
                    {c.value == null ?
                  <span className="text-zinc-400 italic text-xs">
                        Chưa có
                      </span> :
                  c.value === 0 ?
                  <span className="text-zinc-500 text-xs">Chưa tính</span> :

                  <span className="font-semibold text-zinc-900">
                        {formatCurrency(c.value)}
                      </span>
                  }
                  </td>
                  <td className="px-5 py-3.5 align-top">
                    {c.status === 'active' &&
                  <StatusBadge tone="success" dot>
                        Còn hiệu lực
                      </StatusBadge>
                  }
                    {c.status === 'expiring' &&
                  <StatusBadge tone="warning" dot>
                        Sắp hết hạn
                      </StatusBadge>
                  }
                    {c.status === 'expired' &&
                  <StatusBadge tone="danger" dot>
                        Hết hạn
                      </StatusBadge>
                  }
                    {c.status === 'pending' &&
                  <StatusBadge tone="orange" dot>
                        Chờ tái ký
                      </StatusBadge>
                  }
                    {c.status === 'draft' &&
                  <StatusBadge tone="neutral" dot>
                        Bản nháp
                      </StatusBadge>
                  }
                  </td>
                  <td className="pr-4 pl-1 text-right">
                    <ChevronRightIcon className="h-4 w-4 text-zinc-300 opacity-0 group-hover/row:opacity-100 group-hover/row:text-indigo-500 group-hover/row:translate-x-0.5 transition-all" />
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </ContentCard>
    </Page>);

}