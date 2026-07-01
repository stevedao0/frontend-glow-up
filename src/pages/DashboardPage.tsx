import React, { useEffect, useMemo, useState } from 'react';
import {
  FileTextIcon,
  CheckCircle2Icon,
  AlertTriangleIcon,
  Music2Icon,
  WalletIcon,
  ArrowRightIcon,
  RefreshCwIcon,
  AwardIcon,
  ShieldAlertIcon,
  LayoutGridIcon,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import { Page, PageHeader } from '../components/app-ui/Page';
import { ContentCard } from '../components/app-ui/ContentCard';
import { Button } from '../components/app-ui/Button';
import { Select } from '../components/app-ui/Select';
import { ProgressStatusPanel } from '../components/app-ui/ProgressStatusPanel';
import { RouteKey } from '../data/routes';
import { formatCurrency, formatNumber } from '../lib/format';
import { TOKEN_KEY } from '../lib/authClient';
import { apiRequest } from '../lib/apiClient';
import { EnterpriseBadge, EnterprisePanel, EnterpriseSectionHeader, EnterpriseSummaryStrip } from '../components/enterprise';


const YEAR_OPTIONS = [
  { value: '2024', label: '2024' },
  { value: '2025', label: '2025' },
  { value: '2026', label: '2026' },
];

// =============================================================================
// Types — mirror backend Pydantic schemas
// =============================================================================

type RevenueYearItem = {
  year: number;
  contract_count: number;
  total_revenue: number | null;
  cumulative: boolean;
  isNull?: boolean;
  isCurrent?: boolean;
};

type ExpiringContractItem = {
  id: number;
  contract_no: string;
  partner: string;
  field: string;
  expire_date: string | null;
  days_left: number;
  value: number | null;
};

type ReportsSummary = {
  total_contracts: number;
  active_count: number;
  expiring_30d_count: number;
  expiring_60d_count: number;
  expired_count: number;
  pending_renewal_count: number;
  new_count: number;
  unknown_status_count: number;
  revenue_by_year: RevenueYearItem[];
  expiring_contracts: ExpiringContractItem[];
  field_breakdown: { key: string; label: string; count: number }[];
  certificate_total: number;
  gcn_draft: number;
  gcn_test_printed: number;
  gcn_final_printed: number;
  total_works: number;
};

// Visual tone policy (per dashboard polish spec):
//  - success / teal  → healthy, active, revenue
//  - warning / amber  → attention, soon, expiring
//  - danger / red     → real risk, expired
//  - neutral / slate  → draft, passive, informational
//  - accent / teal-2  → highlighted
// Decorative violet/purple removed from the queue + strip.
function daysTone(daysLeft: number): 'danger' | 'warning' | 'neutral' {
  if (daysLeft <= 7) return 'danger';
  if (daysLeft <= 30) return 'warning';
  return 'neutral';
}

export function DashboardPage({
  userEmail,
  onNavigate,
}: {
  userEmail: string;
  onNavigate: (k: RouteKey) => void;
}) {
  const [year, setYear] = useState('2026');
  const [summary, setSummary] = useState<ReportsSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);
  const [reloadTick, setReloadTick] = useState(0);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const token = localStorage.getItem(TOKEN_KEY);
        if (!token) {
          if (!cancelled) {
            setError('Không có phiên đăng nhập.');
            setLoading(false);
          }
          return;
        }
        const data = await apiRequest<ReportsSummary>('/reports/summary', { token });
        if (!cancelled) setSummary(data);
      } catch (err: any) {
        if (!cancelled) setError(String(err?.message || 'Không tải được dữ liệu tổng quan.'));
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [reloadTick]);

  const triggerRefresh = () => setReloadTick((v) => v + 1);

  // Derive stats from real API response
  const stats = summary
    ? {
        totalContracts: summary.total_contracts,
        active: summary.active_count,
        expiring30: summary.expiring_30d_count,
        expiring60: summary.expiring_60d_count,
        expired: summary.expired_count,
        pendingRenewal: summary.pending_renewal_count,
        gcnDraft: summary.gcn_draft,
        gcnFinalPrinted: summary.gcn_final_printed,
        totalWorks: summary.total_works,
        revenueCurrent:
          (summary.revenue_by_year ?? []).find((y) => y.year === new Date().getFullYear())
            ?.total_revenue ?? 0,
        revenuePrev:
          (summary.revenue_by_year ?? [])
            .find((y) => y.year === new Date().getFullYear() - 1)
            ?.total_revenue ?? 0,
        contractsCurrent:
          (summary.revenue_by_year ?? [])
            .find((y) => y.year === new Date().getFullYear())
            ?.contract_count ?? 0,
      }
    : null;

  const revenueCurrent = useMemo(() => stats?.revenueCurrent ?? 0, [stats?.revenueCurrent]);
  const revenuePrev = useMemo(() => stats?.revenuePrev ?? 0, [stats?.revenuePrev]);

  const revenueDeltaPct =
    revenuePrev > 0 ? ((revenueCurrent - revenuePrev) / revenuePrev) * 100 : null;

  // Revenue chart data from API — stable reference, no NaN risk
  const chartData = useMemo(
    () =>
      (summary?.revenue_by_year ?? []).map((y) => ({
        year: String(y.year),
        revenue: y.total_revenue ?? 0,
        revenueBn: y.total_revenue != null ? y.total_revenue / 1_000_000_000 : 0,
        contract_count: y.contract_count,
      })),
    [summary?.revenue_by_year]
  );

  // Status breakdown from real data (calmer tones: no violet decoration)
  const statusBreakdown = useMemo(
    () =>
      stats
        ? [
            { name: 'Đang hiệu lực', value: stats.active, tone: 'success' as const },
            { name: 'Sắp hết 60 ngày', value: stats.expiring60, tone: 'warning' as const },
            { name: 'Hết hạn', value: stats.expired, tone: 'danger' as const },
            { name: 'Chờ tái ký', value: stats.pendingRenewal, tone: 'neutral' as const },
          ]
        : [],
    [stats]
  );

  // Expiring list from API — default to empty array
  const expiringItems = useMemo(
    () =>
      (summary?.expiring_contracts ?? []).map((c) => ({
        id: String(c.id),
        partner: c.partner,
        contractNo: c.contract_no,
        expireDate: c.expire_date ?? '',
        daysLeft: c.days_left,
        value: c.value,
      })),
    [summary?.expiring_contracts]
  );
  // Show the most-urgent 4 in the right rail queue; the full table shows
  // up to 8 (so the table can include a few more rows than the rail).
  const railQueue = expiringItems.slice(0, 4);
  const tableQueue = expiringItems.slice(0, 8);

  // Real signal items for the right rail (no decorative values).
  const signalItems = useMemo(
    () =>
      stats
        ? [
            {
              key: 'gcn-draft',
              label: 'GCN chưa cấp số',
              sub: 'Bản nháp chờ phát hành',
              value: formatNumber(stats.gcnDraft),
              tone: 'warning' as const,
            },
            {
              key: 'pending-renewal',
              label: 'Chờ tái ký',
              sub: 'Cần theo dõi trước deadline',
              value: formatNumber(stats.pendingRenewal),
              tone: 'neutral' as const,
            },
            {
              key: 'expired',
              label: 'Hết hạn',
              sub: 'Cần xử lý ngay',
              value: formatNumber(stats.expired),
              tone: 'danger' as const,
            },
          ]
        : [],
    [stats]
  );

  const currentYear = new Date().getFullYear();
  const prevYear = currentYear - 1;

  return (
    <Page>
      <div className="mx-auto max-w-[1600px] space-y-5 px-6 py-6 lg:px-8">
        <PageHeader
          title="Command Center"
          description="Operational summary cho workspace Background Music với dữ liệu thật từ hệ thống."
          actions={
            <div className="flex items-center gap-2">
              <Button
                variant="secondary"
                size="sm"
                leftIcon={<RefreshCwIcon className="h-4 w-4" />}
                onClick={triggerRefresh}
                disabled={loading}
              />
              <Select
                value={year}
                onChange={setYear}
                options={YEAR_OPTIONS}
                className="w-32"
              />
            </div>
          }
        />

        {/* Greeting / context strip — calm, no decorative badge. */}
        <div className="vc-dashboard-greeting">
          <p className="text-[13.5px] leading-relaxed text-zinc-600">
            Xin chào, <span className="font-semibold text-zinc-900">{userEmail || '—'}</span>.
            {stats
              ? ` Đang theo dõi ${formatNumber(stats.totalContracts)} hợp đồng, ${formatNumber(stats.expiring30 + stats.expiring60)} việc cần chú ý và ${formatNumber(stats.gcnDraft)} GCN chưa cấp số.`
              : error
                ? ` ${error}`
                : ' Đang tải dữ liệu vận hành...'}
          </p>
        </div>

        <EnterpriseSummaryStrip
          items={[
            {
              label: 'Tổng hợp đồng',
              value: loading ? '—' : formatNumber(stats?.totalContracts ?? 0),
              tone: 'accent',
              icon: <FileTextIcon className="h-4 w-4" />,
              hint: 'Workspace Background',
            },
            {
              label: 'Còn hiệu lực',
              value: loading ? '—' : formatNumber(stats?.active ?? 0),
              tone: 'success',
              icon: <CheckCircle2Icon className="h-4 w-4" />,
              hint:
                stats && stats.totalContracts > 0
                  ? `${((stats.active / stats.totalContracts) * 100).toFixed(1)}% tổng số`
                  : 'Tổng Background',
            },
            {
              label: 'Sắp hết 60 ngày',
              value: loading ? '—' : formatNumber(stats?.expiring60 ?? 0),
              tone: 'warning',
              icon: <AlertTriangleIcon className="h-4 w-4" />,
              hint:
                stats && stats.expiring30 > 0
                  ? `Trong đó ${stats.expiring30} hết trong 30 ngày`
                  : 'Cần xử lý sớm',
            },
            {
              label: 'Tác phẩm',
              value: loading ? '—' : formatNumber(stats?.totalWorks ?? 0),
              tone: 'neutral',
              icon: <Music2Icon className="h-4 w-4" />,
              hint: 'Đang quản lý',
            },
            {
              label: 'GCN đã in',
              value: loading ? '—' : formatNumber(stats?.gcnFinalPrinted ?? 0),
              tone: 'success',
              icon: <AwardIcon className="h-4 w-4" />,
              hint:
                stats && stats.gcnDraft > 0
                  ? `${formatNumber(stats.gcnDraft)} bản nháp chờ phát hành`
                  : 'Bản chính thức',
            },
            {
              label: `Doanh thu ${currentYear}`,
              value:
                loading
                  ? '—'
                  : revenueCurrent > 0
                    ? `${(revenueCurrent / 1_000_000_000).toFixed(2)} tỷ`
                    : 'Chưa có',
              tone: 'teal',
              icon: <WalletIcon className="h-4 w-4" />,
              delta:
                revenueDeltaPct !== null
                  ? `${revenueDeltaPct >= 0 ? '+' : ''}${revenueDeltaPct.toFixed(1)}% so với ${prevYear}`
                  : undefined,
              hint: revenueDeltaPct !== null ? `So với ${prevYear}` : 'Chưa có dữ liệu năm trước',
            },
          ]}
        />

        {/* Row 1: chart + contract health. Equal-height row. */}
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-12">
          <ContentCard
            title="Doanh thu theo năm"
            description="Đơn vị: tỷ VND · So sánh qua các năm (lũy kế đến nay)"
            className="vc-dashboard-equal-card xl:col-span-8"
            accent
            actions={
              <div className="flex flex-wrap items-center gap-3 text-[11px]">
                {chartData.map((d, i) => (
                  <div key={d.year} className="inline-flex items-center gap-1.5 text-zinc-500">
                    <span
                      className={`h-2 w-2 rounded-full ${
                        i === chartData.length - 1
                          ? 'bg-gradient-to-br from-emerald-600 to-teal-600'
                          : 'bg-zinc-400'
                      }`}
                    />
                    {d.year}
                  </div>
                ))}
              </div>
            }
          >
            {chartData.length === 0 || chartData.every((d) => d.revenueBn === 0) ? (
              <div className="flex h-[280px] items-center justify-center text-sm text-zinc-400">
                Chưa có dữ liệu doanh thu để hiển thị
              </div>
            ) : (
              <div className="h-[280px]">
                <ResponsiveContainer>
                  <BarChart
                    data={chartData}
                    margin={{ top: 8, right: 12, left: -14, bottom: 0 }}
                    barCategoryGap="32%"
                    onMouseLeave={() => setHoverIdx(null)}
                  >
                    <defs>
                      <linearGradient id="barFill" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#0f8f72" stopOpacity={1} />
                        <stop offset="100%" stopColor="#0b6d58" stopOpacity={0.88} />
                      </linearGradient>
                      <linearGradient id="barFillHover" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#2dd4bf" stopOpacity={1} />
                        <stop offset="100%" stopColor="#0f766e" stopOpacity={1} />
                      </linearGradient>
                      <linearGradient id="barFillPrev" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#d6d3d1" stopOpacity={1} />
                        <stop offset="100%" stopColor="#a8a29e" stopOpacity={1} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e7e5e4" vertical={false} />
                    <XAxis
                      dataKey="year"
                      stroke="#a8a29e"
                      fontSize={12}
                      tickLine={false}
                      axisLine={false}
                      dy={4}
                    />
                    <YAxis
                      stroke="#a8a29e"
                      fontSize={11}
                      tickLine={false}
                      axisLine={false}
                      dx={-4}
                      tickFormatter={(v) => `${v}`}
                    />
                    <Tooltip
                      cursor={{ fill: 'rgba(15,143,114,0.06)' }}
                      contentStyle={{
                        border: 'none',
                        borderRadius: 10,
                        background: 'rgba(15, 23, 42, 0.94)',
                        color: '#fff',
                        fontSize: 12,
                        padding: '8px 12px',
                        boxShadow: '0 10px 30px rgba(15,23,42,0.25)',
                      }}
                      labelStyle={{
                        color: '#99f6e4',
                        fontWeight: 600,
                        marginBottom: 2,
                      }}
                      itemStyle={{ color: '#fff' }}
                      formatter={(v: number) => [
                        `${v.toLocaleString('vi-VN', { maximumFractionDigits: 2 })} tỷ`,
                        'Doanh thu',
                      ]}
                    />
                    <Bar
                      dataKey="revenueBn"
                      radius={[6, 6, 0, 0]}
                      maxBarSize={48}
                      onMouseEnter={(_, idx) => setHoverIdx(idx)}
                    >
                      {chartData.map((_, i) => (
                        <Cell
                          key={i}
                          fill={
                            i === chartData.length - 1
                              ? hoverIdx === i
                                ? 'url(#barFillHover)'
                                : 'url(#barFill)'
                              : 'url(#barFillPrev)'
                          }
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </ContentCard>

          <EnterprisePanel className="vc-dashboard-equal-card xl:col-span-4">
            <EnterpriseSectionHeader
              eyebrow="Command status"
              title="Contract health"
              description="Phân bổ toàn bộ workspace Background"
              actions={stats ? <EnterpriseBadge tone="neutral">{formatNumber(stats.totalContracts)} hợp đồng</EnterpriseBadge> : undefined}
            />
            {statusBreakdown.length > 0 && stats ? (
              <ProgressStatusPanel
                items={statusBreakdown}
                mode="relative"
                helper={`Tổng ${formatNumber(stats.totalContracts)} hợp đồng. Số "Còn hiệu lực" đã bao gồm ${stats.expiring60} đang sắp hết 60 ngày.`}
              />
            ) : (
              <div className="py-8 text-center text-sm text-zinc-400">
                {loading ? 'Đang tải...' : 'Chưa có dữ liệu'}
              </div>
            )}
          </EnterprisePanel>
        </div>

        {/* Row 2: full-width attention table (the single source of truth for
            "Sắp hết hạn" / "Hợp đồng cần chú ý"). The earlier compact queue
            was removed because it duplicated this same data. */}
        <ContentCard
          title="Hợp đồng cần chú ý"
          description={
            expiringItems.length > 0
              ? `${expiringItems.length} hợp đồng sắp hết · hiển thị tối đa 8 dòng đầu tiên`
              : 'Trong 60 ngày tới'
          }
          padded={false}
          actions={
            <div className="flex items-center gap-2">
              <EnterpriseBadge tone="warning">{formatNumber(expiringItems.length)}</EnterpriseBadge>
              <Button
                variant="ghost"
                size="sm"
                rightIcon={<ArrowRightIcon className="h-3.5 w-3.5" />}
                onClick={() => onNavigate('contracts.list')}
              >
                Xem tất cả
              </Button>
            </div>
          }
        >
          {tableQueue.length > 0 ? (
            <div className="overflow-hidden">
              <div className="divide-y divide-stone-200">
                <div className="grid grid-cols-[minmax(0,1.15fr)_minmax(0,1.7fr)_116px_140px] gap-3 px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-stone-500">
                  <span>Hợp đồng</span>
                  <span>Đơn vị</span>
                  <span>Deadline</span>
                  <span className="text-right">Giá trị</span>
                </div>
                {tableQueue.map((item) => (
                  <div
                    key={item.id}
                    className="grid grid-cols-[minmax(0,1.15fr)_minmax(0,1.7fr)_116px_140px] gap-3 px-4 py-3 text-sm text-zinc-800 transition hover:bg-stone-50/80"
                  >
                    <div className="min-w-0">
                      <div className="truncate font-mono text-[12px] font-semibold text-zinc-900">{item.contractNo || '—'}</div>
                      <div className="mt-1 text-xs text-stone-500">{item.expireDate || '—'}</div>
                    </div>
                    <div className="min-w-0">
                      <div className="line-clamp-2 text-sm font-medium leading-5 text-zinc-800">{item.partner || '—'}</div>
                    </div>
                    <div>
                      <EnterpriseBadge tone={daysTone(item.daysLeft)}>
                        {item.daysLeft <= 0 ? 'Hôm nay' : `${item.daysLeft} ngày`}
                      </EnterpriseBadge>
                    </div>
                    <div className="truncate text-right font-medium tabular-nums text-zinc-700">
                      {item.value != null && item.value > 0 ? formatCurrency(item.value) : '—'}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="py-10 text-center text-sm text-zinc-400">
              {loading ? 'Đang tải...' : 'Không có hợp đồng sắp hết trong 60 ngày tới'}
            </div>
          )}
        </ContentCard>

        {/* Right rail: operational signals + risk summary. The drawer
            already covers navigation actions (topbar + Tạo mới + drawer
            quick actions), so the previous "Suggested actions" block
            (5 nav buttons) and the empty "Activity feed" block were
            removed to eliminate navigation duplication. */}
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-12">
          <div className="xl:col-span-9" />
          <div className="space-y-4 xl:col-span-3">
            <EnterprisePanel>
              <EnterpriseSectionHeader
                eyebrow="Intelligence"
                title="Operational signals"
                description="Tín hiệu ưu tiên được tổng hợp từ dữ liệu dashboard đang có."
                actions={stats ? <EnterpriseBadge tone="neutral">Real data only</EnterpriseBadge> : undefined}
              />

              <div className="mt-4 grid gap-2.5">
                {signalItems.map((s) => (
                  <div key={s.key} className="vc-enterprise-queue-item vc-dashboard-signal">
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-medium text-zinc-900">
                        {s.label}
                      </div>
                      <div className="mt-0.5 truncate text-xs text-zinc-500">{s.sub}</div>
                    </div>
                    <div className="flex flex-col items-end gap-1.5">
                      <span className="text-base font-semibold tabular-nums text-zinc-900">
                        {loading ? '—' : s.value}
                      </span>
                      <EnterpriseBadge tone={s.tone}>
                        {s.tone === 'danger' ? 'Risk' : s.tone === 'warning' ? 'Soon' : 'Watch'}
                      </EnterpriseBadge>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-4 rounded-2xl border border-[rgba(18,45,37,0.08)] bg-[rgba(15,143,114,0.04)] px-4 py-4">
                <div className="flex items-start gap-3">
                  <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-white text-[var(--vc-enterprise-accent-strong)] shadow-sm">
                    <ShieldAlertIcon className="h-4 w-4" />
                  </span>
                  <div>
                    <div className="vc-enterprise-label">Risk summary</div>
                    <div className="mt-1 text-sm text-zinc-700">
                      {loading
                        ? 'Đang tải tổng hợp rủi ro...'
                        : `${formatNumber(stats?.expired ?? 0)} hồ sơ hết hạn, ${formatNumber(stats?.gcnDraft ?? 0)} GCN chưa cấp số và ${formatNumber(expiringItems.length)} hợp đồng nằm trong vùng theo dõi.`}
                    </div>
                  </div>
                </div>
              </div>
            </EnterprisePanel>

            {/* Compact "Sắp hết hạn" rail queue — distinct from the
                full attention table because it lives in the side rail and
                shows only the top 4 most-urgent rows as a glance summary. */}
            <EnterprisePanel>
              <EnterpriseSectionHeader
                eyebrow="Queue"
                title="Sắp hết hạn"
                description={`Top ${railQueue.length} ưu tiên`}
                actions={<EnterpriseBadge tone="warning">{formatNumber(railQueue.length)}</EnterpriseBadge>}
              />
              <div className="mt-3 grid gap-2">
                {railQueue.length > 0 ? railQueue.map((item) => (
                  <div
                    key={item.id}
                    className="vc-enterprise-queue-item vc-dashboard-queue-row"
                    title={`${item.contractNo || '—'} — ${item.partner || '—'}`}
                  >
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-semibold text-zinc-900">
                        {item.partner || '—'}
                      </div>
                      <div className="mt-0.5 truncate font-mono text-[11px] tracking-wider text-zinc-500">
                        {item.contractNo || '—'}
                      </div>
                    </div>
                    <EnterpriseBadge tone={daysTone(item.daysLeft)}>
                      {item.daysLeft <= 0 ? 'Hôm nay' : `${item.daysLeft}d`}
                    </EnterpriseBadge>
                  </div>
                )) : (
                  <div className="py-6 text-center text-sm text-zinc-400">
                    {loading ? 'Đang tải...' : 'Không có hàng đợi ưu tiên'}
                  </div>
                )}
              </div>
              <div className="mt-3">
                <Button
                  variant="ghost"
                  size="sm"
                  rightIcon={<ArrowRightIcon className="h-3.5 w-3.5" />}
                  onClick={() => onNavigate('contracts.list')}
                >
                  Xem danh sách đầy đủ
                </Button>
              </div>
            </EnterprisePanel>

            <div className="vc-dashboard-drawer-hint">
              <LayoutGridIcon className="h-3.5 w-3.5" />
              <span>Mở Command Drawer (phím <kbd>Esc</kbd> / click Orb) để truy cập nhanh các module khác.</span>
            </div>
          </div>
        </div>
      </div>
    </Page>
  );
}
