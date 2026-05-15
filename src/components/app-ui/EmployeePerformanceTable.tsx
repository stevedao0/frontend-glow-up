import React from 'react';
import { UserIcon, TrendingUpIcon, AlertTriangleIcon } from 'lucide-react';
import {
  EmployeePerformance,
  getPerformanceTone } from
'../../data/reportEmployees';
import { formatShortVND, formatNumber } from '../../lib/format';
const toneBadge: Record<
  ReturnType<typeof getPerformanceTone>,
  {
    label: string;
    bg: string;
    text: string;
    ring: string;
    dot: string;
  }> =
{
  good: {
    label: 'Tốt',
    bg: 'bg-emerald-50',
    text: 'text-emerald-700',
    ring: 'ring-emerald-600/15',
    dot: 'bg-emerald-500'
  },
  watch: {
    label: 'Cần theo dõi',
    bg: 'bg-amber-50',
    text: 'text-amber-700',
    ring: 'ring-amber-600/15',
    dot: 'bg-amber-500'
  },
  overload: {
    label: 'Quá tải',
    bg: 'bg-rose-50',
    text: 'text-rose-700',
    ring: 'ring-rose-600/15',
    dot: 'bg-rose-500'
  }
};
export function EmployeePerformanceTable({
  items


}: {items: EmployeePerformance[];}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-gradient-to-b from-indigo-50/30 via-zinc-50 to-zinc-50/30 border-b border-zinc-200">
            <Th>Nhân viên</Th>
            <Th align="right">Tuần này</Th>
            <Th align="right">Tháng này</Th>
            <Th align="right">Năm nay</Th>
            <Th align="right">Chờ xử lý</Th>
            <Th align="right">Sắp hết hạn</Th>
            <Th align="right">Doanh thu</Th>
            <Th align="right">GCN</Th>
            <Th>Hoàn thành</Th>
            <Th>Đánh giá</Th>
          </tr>
        </thead>
        <tbody>
          {items.map((p) => {
            const tone = getPerformanceTone(p);
            const badge = toneBadge[tone];
            return (
              <tr
                key={p.key}
                className="border-b border-zinc-100 last:border-0 hover:bg-indigo-50/30 transition-colors">
                
                <td className="px-4 py-3.5 align-top">
                  <div className="flex items-center gap-3">
                    <span className="h-9 w-9 rounded-full bg-gradient-to-br from-indigo-500 to-violet-500 text-white text-xs font-bold inline-flex items-center justify-center shadow-sm shadow-indigo-500/20 shrink-0">
                      {p.name.slice(0, 1).toUpperCase()}
                    </span>
                    <div className="min-w-0">
                      <p className="text-[14px] font-semibold text-zinc-900 leading-tight">
                        {p.name}
                      </p>
                      <p className="text-[11px] text-zinc-500 mt-0.5 truncate">
                        {p.email}
                      </p>
                    </div>
                  </div>
                </td>
                <Td align="right">
                  <span className="font-semibold text-zinc-900 tabular-nums">
                    {p.signedThisWeek}
                  </span>
                </Td>
                <Td align="right">
                  <span className="font-semibold text-zinc-900 tabular-nums">
                    {p.signedThisMonth}
                  </span>
                </Td>
                <Td align="right">
                  <span className="font-semibold text-zinc-900 tabular-nums">
                    {p.signedThisYear}
                  </span>
                </Td>
                <Td align="right">
                  <span
                    className={`tabular-nums font-medium ${p.pending >= 6 ? 'text-rose-700' : 'text-zinc-700'}`}>
                    
                    {p.pending}
                  </span>
                </Td>
                <Td align="right">
                  <span
                    className={`tabular-nums font-medium ${p.expiringAssigned >= 7 ? 'text-amber-700' : 'text-zinc-700'}`}>
                    
                    {p.expiringAssigned}
                  </span>
                </Td>
                <Td align="right">
                  <span className="font-semibold text-zinc-900 tabular-nums whitespace-nowrap text-[13px]">
                    {formatShortVND(p.revenue)}
                  </span>
                </Td>
                <Td align="right">
                  <span className="font-semibold text-zinc-900 tabular-nums">
                    {p.gcnHandled}
                  </span>
                </Td>
                <td className="px-4 py-3.5 align-top w-44">
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-1.5 rounded-full bg-zinc-100 overflow-hidden">
                      <div
                        className={`h-full transition-all duration-500 ${p.completionRate >= 80 ? 'bg-gradient-to-r from-emerald-400 to-emerald-500' : p.completionRate >= 70 ? 'bg-gradient-to-r from-amber-400 to-amber-500' : 'bg-gradient-to-r from-rose-400 to-rose-500'}`}
                        style={{
                          width: `${p.completionRate}%`
                        }} />
                      
                    </div>
                    <span className="text-xs font-semibold text-zinc-700 tabular-nums shrink-0">
                      {p.completionRate}%
                    </span>
                  </div>
                </td>
                <td className="px-4 py-3.5 align-top">
                  <span
                    className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium ring-1 ring-inset ${badge.bg} ${badge.text} ${badge.ring}`}>
                    
                    <span className={`h-1.5 w-1.5 rounded-full ${badge.dot}`} />
                    {badge.label}
                  </span>
                </td>
              </tr>);

          })}
        </tbody>
      </table>
    </div>);

}
function Th({
  children,
  align = 'left'



}: {children: React.ReactNode;align?: 'left' | 'right' | 'center';}) {
  return (
    <th
      className={`px-4 py-3.5 text-[11px] font-semibold uppercase tracking-[0.08em] text-zinc-700 ${align === 'right' ? 'text-right' : align === 'center' ? 'text-center' : 'text-left'}`}>
      
      {children}
    </th>);

}
function Td({
  children,
  align = 'left'



}: {children: React.ReactNode;align?: 'left' | 'right' | 'center';}) {
  return (
    <td
      className={`px-4 py-3.5 align-top text-[13px] ${align === 'right' ? 'text-right' : align === 'center' ? 'text-center' : ''}`}>
      
      {children}
    </td>);

}