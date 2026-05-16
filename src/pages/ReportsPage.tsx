import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  RefreshCwIcon,
  DownloadIcon,
  WalletIcon,
  CalendarRangeIcon,
  CheckCircle2Icon,
  AlertTriangleIcon,
  AwardIcon,
  FileTextIcon,
  XCircleIcon,
  EyeIcon,
  BellRingIcon,
  FilePlusIcon,
  RotateCcwIcon,
  PrinterIcon,
  Music2Icon,
  AlertCircleIcon,
  GitCompareIcon,
  MoonIcon,
  DropletsIcon,
  UserCircle2Icon,
  TrophyIcon,
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
  ReferenceLine,
} from 'recharts';
import { PresentationIcon } from 'lucide-react';
import { Page, PageHeader } from '../components/app-ui/Page';
import { ContentCard } from '../components/app-ui/ContentCard';
import { MetricStrip } from '../components/app-ui/MetricCard';
import { Button } from '../components/app-ui/Button';
import { Select } from '../components/app-ui/Select';
import { StatusBadge } from '../components/app-ui/StatusBadge';
import { FilterBar, FilterField } from '../components/app-ui/FilterBar';
import { Tabs } from '../components/app-ui/Tabs';
import { EmployeePerformanceTable } from '../components/app-ui/EmployeePerformanceTable';
import { ExportReportDialog } from '../components/app-ui/ExportReportDialog';
import { RowActionsMenu } from '../components/app-ui/RowActionsMenu';
import { EmptyState } from '../components/app-ui/EmptyState';
import { TableSkeleton } from '../components/app-ui/TableSkeleton';
import { InsightCard } from '../components/app-ui/InsightCard';
import { SavedViews, type ViewState } from '../components/app-ui/SavedViews';
import { GoalProgressCard } from '../components/app-ui/GoalProgressCard';
import { DrilldownDrawer, type DrilldownItem } from '../components/app-ui/DrilldownDrawer';
import { ExportSnapshotMenu } from '../components/app-ui/ExportSnapshotMenu';
import { WidgetVisibilityMenu, useWidgetVisibility } from '../components/app-ui/WidgetVisibilityMenu';
import {
  FIELD_CATEGORIES,
  buildReportInsights,
  type ReportInsight,
} from '../data/reportData';
import {
  getPendingPriority,
  PENDING_CATEGORY_LABEL,
  filterSignedByScope,
  type SignedScope,
  type ResolvedPendingRow,
} from '../data/reportEmployees';
import {
  getReportsSummary,
  getEmployeeStats,
  listExpiringContracts,
  listReportsCertificates,
  type ReportsSummary,
  type ExpiringContractItem,
  type CertificateListItem,
  type SignedContractItem,
  type EmployeeStatsResponse,
} from '../lib/reportsClient';
import { TOKEN_KEY } from '../lib/authClient';
import { formatCurrency, formatDate, formatNumber } from '../lib/format';
import { RouteKey } from '../data/routes';
import { useAuth } from '../lib/auth';

const REPORT_TYPE_OPTIONS = [
  { value: 'overview', label: 'Tổng quan' },
  { value: 'employee', label: 'Theo nhân viên' },
  { value: 'signed', label: 'Hợp đồng đã ký' },
  { value: 'pending', label: 'Hợp đồng chưa ký' },
  { value: 'expiring', label: 'Hợp đồng sắp hết hạn' },
  { value: 'gcn', label: 'GCN' },
  { value: 'revenue', label: 'Doanh thu' },
];

const TIME_OPTIONS = [
  { value: 'week', label: 'Tuần này' },
  { value: 'month', label: 'Tháng này' },
  { value: 'quarter', label: 'Quý này' },
  { value: 'year', label: 'Năm này' },
  { value: 'custom', label: 'Tùy chỉnh' },
];

const EMPLOYEE_OPTIONS = [
  { value: 'Tuấn', label: 'Tuấn' },
  { value: 'Admin', label: 'Admin' },
  { value: 'Nhân viên 1', label: 'Nhân viên 1' },
];

const FIELD_OPTIONS = FIELD_CATEGORIES.map((c) => ({
  value: c.label,
  label: c.label,
}));

const STATUS_OPTIONS = [
  { value: 'signed', label: 'Đã ký' },
  { value: 'unsigned', label: 'Chưa ký' },
  { value: 'draft', label: 'Bản nháp' },
  { value: 'expiring', label: 'Sắp hết hạn' },
  { value: 'expired', label: 'Hết hạn' },
  { value: 'pending_renewal', label: 'Chờ tái ký' },
  { value: 'renewed', label: 'Đã tái ký' },
];

const EXPIRING_FILTER_TABS = [
  { value: '7d', label: '7 ngày' },
  { value: '30d', label: '30 ngày' },
  { value: '60d', label: '60 ngày' },
  { value: 'quarter', label: 'Quý tới' },
];

const SIGNED_TABS = [
  { value: 'week', label: 'Tuần' },
  { value: 'month', label: 'Tháng' },
  { value: 'quarter', label: 'Quý' },
  { value: 'year', label: 'Năm' },
];

const GCN_STATUS_LABEL: Record<string, string> = {
  draft: 'Bản nháp',
  test_printed: 'In thử',
  final_printed: 'In chính thức',
  no_gcn: 'Chưa tạo GCN',
};

export function ReportsPage({
  onNavigate,
}: {
  onNavigate: (k: RouteKey) => void;
}) {
  const { hasPermission, currentUser } = useAuth();
  const canExport = hasPermission('reports.export');

  // --- Data state ---
  const [summary, setSummary] = useState<ReportsSummary | null>(null);
  const [employeeStats, setEmployeeStats] = useState<EmployeeStatsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  // --- Filter state ---
  const [reportType, setReportType] = useState('overview');
  const [time, setTime] = useState('year');
  const [employee, setEmployee] = useState('');
  const [field, setField] = useState('');
  const [status, setStatus] = useState('');
  const [exportOpen, setExportOpen] = useState(false);

  // --- Data explorer tab ---
  const [dataTab, setDataTab] = useState<'performance' | 'signed' | 'pending' | 'expiring' | 'gcn'>('signed');

  // --- Section-local tab states ---
  const [signedScope, setSignedScope] = useState<SignedScope>('month');
  const [expiringScope, setExpiringScope] = useState('30d');
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);
  const [presenting, setPresenting] = useState(false);
  const [darkPreset, setDarkPreset] = useState(false);
  const [watermark, setWatermark] = useState('');
  const [comparePrev, setComparePrev] = useState(false);
  const [drilldown, setDrilldown] = useState<null | {
    title: string;
    subtitle?: string;
    primary?: { label: string; value: string; hint?: string };
    items: DrilldownItem[];
  }>(null);
  const { vis: sectionVis, toggle: toggleSection, reset: resetSections } = useWidgetVisibility();
  const snapshotRef = useRef<HTMLDivElement>(null);

  // Presentation mode — toggle body class to hide chrome
  useEffect(() => {
    const root = document.documentElement;
    if (presenting) {
      root.classList.add('presentation-mode');
      if (darkPreset) root.classList.add('dark-preset');
      else root.classList.remove('dark-preset');
      if (watermark) {
        root.classList.add('with-watermark');
        const main = document.querySelector('main');
        if (main) main.setAttribute('data-watermark', watermark);
      } else {
        root.classList.remove('with-watermark');
      }
    } else {
      root.classList.remove('presentation-mode', 'dark-preset', 'with-watermark');
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && presenting) setPresenting(false);
    };
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('keydown', onKey);
      root.classList.remove('presentation-mode', 'dark-preset', 'with-watermark');
    };
  }, [presenting, darkPreset, watermark]);

  // --- Data fetching ---
  const fetchData = React.useCallback(async () => {
    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) {
      setFetchError('Chưa đăng nhập.');
      setLoading(false);
      return;
    }
    setLoading(true);
    setFetchError(null);
    try {
      const [data, empStats] = await Promise.all([
        getReportsSummary(token),
        getEmployeeStats(token),
      ]);
      setSummary(data);
      setEmployeeStats(empStats);
    } catch (err: any) {
      setFetchError(err?.message || 'Không thể tải dữ liệu báo cáo.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // --- Derived data ---
  const insights = useMemo<ReportInsight[]>(() => {
    if (!summary) return [];
    return buildReportInsights(summary);
  }, [summary]);

  const today = useMemo(() => new Date().toISOString().slice(0, 10), []);

  const signedRows = useMemo<SignedContractItem[]>(() => {
    if (!summary) return [];
    const all = summary.signed_contracts ?? [];
    const todayDate = new Date(today);
    return all.filter((r) => {
      if (!r.signed_date) return false;
      const signed = new Date(r.signed_date);
      const days = Math.floor(
        (todayDate.getTime() - signed.getTime()) / (1000 * 60 * 60 * 24)
      );
      if (signedScope === 'week') return days <= 7;
      if (signedScope === 'month') return days <= 31;
      if (signedScope === 'quarter') return days <= 92;
      return true;
    });
  }, [summary, signedScope, today]);

  const signedSummary = useMemo(() => {
    const count = signedRows.length;
    const totalValue = signedRows.reduce((s, r) => s + (r.value ?? 0), 0);
    const avg = count > 0 ? totalValue / count : 0;
    return { count, totalValue, avg };
  }, [signedRows]);

  // Pending contracts: derive from contracts with missing data
  const pendingRows = useMemo<ResolvedPendingRow[]>(() => {
    if (!summary) return [];
    // Derive "pending" from contracts that have null values or status issues
    return summary.signed_contracts
      .filter((c) => {
        // Show contracts with null values as "pending" for missing finance
        return (
          c.value == null ||
          c.renewal_status === 'PENDING_RENEWAL'
        );
      })
      .slice(0, 20)
      .map((c, i) => ({
        id: `pending-${c.id}`,
        contractRecordId: c.id,
        category: c.value == null ? 'missing_finance' : 'awaiting_partner',
        assignee: '—',
        createdAt: c.signed_date ?? today,
        daysStuck: c.signed_date
          ? Math.floor(
              (new Date(today).getTime() - new Date(c.signed_date).getTime()) /
                (1000 * 60 * 60 * 24)
            )
          : 0,
        missingStep:
          c.value == null ? 'Thiếu giá trị hợp đồng' : 'Chờ phản hồi tái ký',
        contract: {
          id: c.id,
          don_vi_ten: c.partner,
          ten_bang_hieu: c.brand,
          linh_vuc_hien_thi: c.field ?? '',
        },
      }));
  }, [summary, today]);

  const filteredPending = useMemo(() => {
    if (!employee) return pendingRows;
    return pendingRows.filter((r) => r.assignee === employee);
  }, [pendingRows, employee]);

  // Expiring contracts from API
  const filteredExpiring = useMemo<ExpiringContractItem[]>(() => {
    if (!summary) return [];
    let rows = summary.expiring_contracts ?? [];
    if (expiringScope === '7d') rows = rows.filter((r) => r.days_left <= 7);
    else if (expiringScope === '30d') rows = rows.filter((r) => r.days_left <= 30);
    else if (expiringScope === '60d') rows = rows.filter((r) => r.days_left <= 60);
    else rows = rows.filter((r) => r.days_left <= 92);
    return rows;
  }, [summary, expiringScope]);

  // Certificate recent rows
  const certRows = useMemo<CertificateListItem[]>(() => {
    if (!summary) return [];
    return summary.certificate_recent ?? [];
  }, [summary]);

  // Revenue chart data + forecast (dự báo cuối năm dựa trên lũy kế hiện tại)
  const dayOfYearProgress = useMemo(() => {
    const now = new Date();
    const start = new Date(now.getFullYear(), 0, 0);
    const diff = now.getTime() - start.getTime();
    const day = Math.floor(diff / (1000 * 60 * 60 * 24));
    return Math.max(1, day) / 365;
  }, []);

  const revenueByYear = useMemo(() => {
    if (!summary) return [];
    const currentYear = new Date().getFullYear();
    const list = (summary.revenue_by_year ?? []).map((y) => {
      const revenueBn = y.total_revenue == null ? 0 : y.total_revenue / 1_000_000_000;
      const isCurrent = y.year === currentYear && y.cumulative && !y.isNull;
      const forecastBn = isCurrent ? revenueBn / dayOfYearProgress : 0;
      return {
        ...y,
        revenueBn,
        forecastBn,
        isNull: y.total_revenue == null,
        isCurrent,
      };
    });
    // Thêm prevRevenueBn = năm liền trước trong cùng dataset
    return list.map((y, i) => ({
      ...y,
      prevRevenueBn: i > 0 ? list[i - 1].revenueBn : 0,
    }));
  }, [summary, dayOfYearProgress]);

  // Forecast cho năm hiện tại — phục vụ insight/badge
  const yearForecast = useMemo(() => {
    const cur = revenueByYear.find((y) => y.isCurrent);
    if (!cur || cur.revenueBn === 0) return null;
    return {
      projectedBn: cur.forecastBn,
      currentBn: cur.revenueBn,
      progress: dayOfYearProgress,
    };
  }, [revenueByYear, dayOfYearProgress]);

  // Stats
  const stats = summary
    ? {
        totalContracts: summary.total_contracts,
        active: summary.active_count,
        expiringIn30Days: summary.expiring_30d_count,
        expiringIn60Days: summary.expiring_60d_count,
        expired: summary.expired_count,
        pendingRenewal: summary.pending_renewal_count,
        renewed: 0,
        totalWorks: summary.total_works,
        gcnDraft: summary.gcn_draft,
        gcnTestPrinted: summary.gcn_test_printed,
        gcnFinalPrinted: summary.gcn_final_printed,
        contracts2026: (summary.revenue_by_year ?? []).find((y) => y.year === new Date().getFullYear())?.contract_count ?? 0,
        contracts2025: (summary.revenue_by_year ?? []).find((y) => y.year === new Date().getFullYear() - 1)?.contract_count ?? 0,
        revenue2026: (summary.revenue_by_year ?? []).find((y) => y.year === new Date().getFullYear())?.total_revenue ?? 0,
        revenue2025: (summary.revenue_by_year ?? []).find((y) => y.year === new Date().getFullYear() - 1)?.total_revenue ?? 0,
      }
    : null;

  // Sparkline series từ revenue_by_year (dùng cho KPI cards)
  const contractSpark = useMemo(
    () => (summary?.revenue_by_year ?? []).map((y) => y.contract_count || 0),
    [summary]
  );
  const revenueSpark = useMemo(
    () =>
      (summary?.revenue_by_year ?? []).map((y) =>
        y.total_revenue == null ? 0 : y.total_revenue / 1_000_000_000
      ),
    [summary]
  );

  // YoY delta cho doanh thu năm nay
  const revenueDelta = useMemo(() => {
    if (!stats || !stats.revenue2025) return undefined;
    const diff = ((stats.revenue2026 - stats.revenue2025) / stats.revenue2025) * 100;
    if (!isFinite(diff)) return undefined;
    return {
      value: `${diff >= 0 ? '+' : ''}${diff.toFixed(1)}%`,
      tone: diff > 0.5 ? ('up' as const) : diff < -0.5 ? ('down' as const) : ('flat' as const),
    };
  }, [stats]);

  const contractsDelta = useMemo(() => {
    if (!stats || !stats.contracts2025) return undefined;
    const diff = ((stats.contracts2026 - stats.contracts2025) / stats.contracts2025) * 100;
    if (!isFinite(diff)) return undefined;
    return {
      value: `${diff >= 0 ? '+' : ''}${diff.toFixed(1)}%`,
      tone: diff > 0.5 ? ('up' as const) : diff < -0.5 ? ('down' as const) : ('flat' as const),
    };
  }, [stats]);

  const hasActiveFilter =
    reportType !== 'overview' ||
    time !== 'year' ||
    !!employee ||
    !!field ||
    !!status;

  const clearFilters = () => {
    setReportType('overview');
    setTime('year');
    setEmployee('');
    setField('');
    setStatus('');
  };

  // ---- Saved Views support ----
  const currentView: ViewState = useMemo(
    () => ({ reportType, time, employee, field, status }),
    [reportType, time, employee, field, status]
  );
  const applyView = (s: ViewState) => {
    setReportType(s.reportType ?? 'overview');
    setTime(s.time ?? 'year');
    setEmployee(s.employee ?? '');
    setField(s.field ?? '');
    setStatus(s.status ?? '');
  };
  const isViewActive = (s: ViewState) =>
    (s.reportType ?? 'overview') === reportType &&
    (s.time ?? 'year') === time &&
    (s.employee ?? '') === employee &&
    (s.field ?? '') === field &&
    (s.status ?? '') === status;

  // Build employee options dynamically from real data
  const dynamicEmployeeOptions = useMemo(() => {
    const opts = (employeeStats?.employees ?? []).map((e) => ({
      value: e.name,
      label: e.name,
    }));
    return [{ value: '', label: 'Tất cả' }, ...opts];
  }, [employeeStats]);

  // Khi scope bị khóa (staff hoặc personalMode), ép employee = currentUser
  useEffect(() => {
    if (scopeLocked && currentUser?.name && employee !== currentUser.name) {
      setEmployee(currentUser.name);
    }
  }, [scopeLocked, currentUser, employee]);

  // Người nhân viên đang được scope (có thể là chính user hoặc người admin chọn)
  const scopedEmployee = useMemo(() => {
    if (!employee) return null;
    return (employeeStats?.employees ?? []).find((e) => e.name === employee) ?? null;
  }, [employee, employeeStats]);

  // Ranking: thứ hạng của scopedEmployee theo doanh thu trong toàn đội
  const ranking = useMemo(() => {
    if (!scopedEmployee || !employeeStats) return null;
    const sorted = [...employeeStats.employees].sort(
      (a, b) => b.total_value - a.total_value
    );
    const rank = sorted.findIndex((e) => e.name === scopedEmployee.name) + 1;
    const total = sorted.length;
    const topRevenue = sorted[0]?.total_value ?? 0;
    return { rank, total, topRevenue };
  }, [scopedEmployee, employeeStats]);

  const handleRefresh = () => {
    fetchData();
  };

  // ---- Drilldown handlers ----
  const openRevenueDrilldown = () => {
    if (!summary) return;
    const items: DrilldownItem[] = (summary.revenue_by_year ?? []).map((y) => {
      const v = y.total_revenue ?? 0;
      const max = Math.max(
        ...(summary.revenue_by_year ?? []).map((r) => r.total_revenue ?? 0),
        1,
      );
      return {
        label: `Năm ${y.year}${y.cumulative ? ' (lũy kế)' : ''}`,
        value: v > 0 ? `${(v / 1_000_000_000).toFixed(2)} tỷ` : '—',
        hint: `${y.contract_count} hợp đồng`,
        bar: (v / max) * 100,
        tone: y.year === new Date().getFullYear() ? 'positive' : 'default',
      };
    });
    setDrilldown({
      title: 'Phân tích doanh thu',
      subtitle: 'Bóc tách doanh thu theo từng năm',
      primary: stats
        ? {
            label: `Doanh thu ${new Date().getFullYear()}`,
            value:
              stats.revenue2026 > 0
                ? `${(stats.revenue2026 / 1_000_000_000).toFixed(2)} tỷ VND`
                : 'Chưa có',
            hint: yearForecast
              ? `Dự báo cuối năm: ${yearForecast.projectedBn.toFixed(2)} tỷ`
              : undefined,
          }
        : undefined,
      items,
    });
  };

  const openContractsDrilldown = () => {
    if (!summary || !stats) return;
    const items: DrilldownItem[] = [
      { label: 'Còn hiệu lực', value: formatNumber(stats.active), tone: 'positive', bar: (stats.active / Math.max(1, stats.totalContracts)) * 100 },
      { label: 'Sắp hết 30 ngày', value: formatNumber(stats.expiringIn30Days), tone: 'warn', bar: (stats.expiringIn30Days / Math.max(1, stats.totalContracts)) * 100 },
      { label: 'Sắp hết 60 ngày', value: formatNumber(stats.expiringIn60Days), tone: 'warn', bar: (stats.expiringIn60Days / Math.max(1, stats.totalContracts)) * 100 },
      { label: 'Đã hết hạn', value: formatNumber(stats.expired), tone: 'negative', bar: (stats.expired / Math.max(1, stats.totalContracts)) * 100 },
      { label: 'Chờ tái ký', value: formatNumber(stats.pendingRenewal), tone: 'warn', bar: (stats.pendingRenewal / Math.max(1, stats.totalContracts)) * 100 },
    ];
    setDrilldown({
      title: 'Phân tích hợp đồng',
      subtitle: 'Tỷ trọng theo trạng thái',
      primary: {
        label: 'Tổng hợp đồng',
        value: formatNumber(stats.totalContracts),
        hint: contractsDelta ? `${contractsDelta.value} so với năm trước` : undefined,
      },
      items,
    });
  };

  const openExpiringDrilldown = () => {
    if (!summary || !stats) return;
    const items: DrilldownItem[] = [
      { label: '≤ 7 ngày', value: formatNumber((summary.expiring_contracts ?? []).filter((r) => r.days_left <= 7).length), tone: 'negative' },
      { label: '8 - 30 ngày', value: formatNumber((summary.expiring_contracts ?? []).filter((r) => r.days_left > 7 && r.days_left <= 30).length), tone: 'warn' },
      { label: '31 - 60 ngày', value: formatNumber((summary.expiring_contracts ?? []).filter((r) => r.days_left > 30 && r.days_left <= 60).length), tone: 'warn' },
      { label: '61 - 90 ngày', value: formatNumber((summary.expiring_contracts ?? []).filter((r) => r.days_left > 60 && r.days_left <= 90).length), tone: 'default' },
    ];
    setDrilldown({
      title: 'Hợp đồng sắp hết hạn',
      subtitle: 'Theo mức độ khẩn cấp',
      primary: {
        label: 'Sắp hết 60 ngày',
        value: formatNumber(stats.expiringIn60Days),
        hint: `Trong đó ${stats.expiringIn30Days} hợp đồng còn ≤ 30 ngày`,
      },
      items,
    });
  };

  const openGcnDrilldown = () => {
    if (!stats || !summary) return;
    const total = stats.gcnDraft + stats.gcnTestPrinted + stats.gcnFinalPrinted;
    const items: DrilldownItem[] = [
      { label: 'Bản nháp', value: formatNumber(stats.gcnDraft), tone: 'warn', bar: (stats.gcnDraft / Math.max(1, total)) * 100 },
      { label: 'In thử', value: formatNumber(stats.gcnTestPrinted), tone: 'default', bar: (stats.gcnTestPrinted / Math.max(1, total)) * 100 },
      { label: 'In chính thức', value: formatNumber(stats.gcnFinalPrinted), tone: 'positive', bar: (stats.gcnFinalPrinted / Math.max(1, total)) * 100 },
    ];
    setDrilldown({
      title: 'Phân tích GCN',
      subtitle: 'Trạng thái cấp số & in',
      primary: {
        label: 'Tổng GCN',
        value: formatNumber(summary.certificate_total ?? total),
      },
      items,
    });
  };

  // ---- Loading / Error states ----
  if (loading) {
    return (
      <Page>
        <PageHeader
          breadcrumb="/bg/reports"
          title="Báo cáo"
          description="Đang tải dữ liệu..."
          actions={
            <Button
              variant="secondary"
              leftIcon={<RefreshCwIcon className="h-4 w-4 animate-spin" />}
              disabled>
              Đang tải...
            </Button>
          }
        />
        <div className="space-y-6">
          <TableSkeleton rows={3} cols={5} />
          <TableSkeleton rows={6} cols={8} />
        </div>
      </Page>
    );
  }

  if (fetchError) {
    return (
      <Page>
        <PageHeader
          breadcrumb="/bg/reports"
          title="Báo cáo"
          description="Không thể tải dữ liệu báo cáo."
          actions={
            <Button
              variant="secondary"
              leftIcon={<RefreshCwIcon className="h-4 w-4" />}
              onClick={handleRefresh}>
              Thử lại
            </Button>
          }
        />
        <ContentCard>
          <EmptyState
            title="Không thể tải dữ liệu"
            description={fetchError}
            icon={<AlertCircleIcon className="h-5 w-5" />}
          />
        </ContentCard>
      </Page>
    );
  }

  return (
    <Page>
      <PageHeader
        breadcrumb={personalMode ? '/bg/reports/me' : '/bg/reports'}
        title={personalMode ? 'Báo cáo của tôi' : 'Báo cáo'}
        description={
          personalMode
            ? `Bảng tổng hợp hiệu suất cá nhân của ${currentUser?.name ?? 'bạn'} — KPI, xếp hạng, hợp đồng phụ trách.`
            : scopeLocked
            ? `Bạn chỉ xem dữ liệu của ${currentUser?.name ?? 'mình'}. Liên hệ quản lý để mở rộng quyền.`
            : 'Theo dõi hợp đồng, hiệu suất xử lý theo nhân viên, doanh thu, GCN và danh sách cần tái ký.'
        }
        actions={
          <>
            <Button
              variant="secondary"
              leftIcon={<RefreshCwIcon className="h-4 w-4" />}
              onClick={handleRefresh}>
              Làm mới
            </Button>
            <Button
              variant={comparePrev ? 'primary' : 'secondary'}
              leftIcon={<GitCompareIcon className="h-4 w-4" />}
              onClick={() => setComparePrev((v) => !v)}
              title="So sánh kỳ trước (overlay bar năm liền trước)">
              {comparePrev ? 'Đang so sánh' : 'So sánh kỳ'}
            </Button>
            <WidgetVisibilityMenu
              vis={sectionVis}
              onToggle={toggleSection}
              onReset={resetSections}
            />
            <ExportSnapshotMenu targetRef={snapshotRef} filename="bao-cao" />
            <Button
              variant="secondary"
              leftIcon={<PresentationIcon className="h-4 w-4" />}
              onClick={() => setPresenting((v) => !v)}
              title="Chế độ trình bày (ESC để thoát)">
              {presenting ? 'Thoát trình bày' : 'Trình bày'}
            </Button>
            {presenting && (
              <>
                <Button
                  variant={darkPreset ? 'primary' : 'secondary'}
                  leftIcon={<MoonIcon className="h-4 w-4" />}
                  onClick={() => setDarkPreset((v) => !v)}
                  title="Theme tối khi trình bày">
                  Dark
                </Button>
                <Button
                  variant={watermark ? 'primary' : 'secondary'}
                  leftIcon={<DropletsIcon className="h-4 w-4" />}
                  onClick={() => {
                    if (watermark) {
                      setWatermark('');
                    } else {
                      const v = window.prompt('Watermark (vd: DRAFT, CONFIDENTIAL):', 'CONFIDENTIAL');
                      if (v) setWatermark(v.trim().toUpperCase());
                    }
                  }}
                  title="Watermark trên nền">
                  {watermark || 'Watermark'}
                </Button>
              </>
            )}
            <Button
              variant="primary"
              leftIcon={<DownloadIcon className="h-4 w-4" />}
              onClick={() => setExportOpen(true)}
              disabled={!canExport}
              title={!canExport ? 'Không có quyền xuất báo cáo' : undefined}>
              Xuất báo cáo
            </Button>
          </>
        }
      />

      <div ref={snapshotRef}>

      {/* Saved Views — góc nhìn lưu nhanh */}
      <SavedViews
        scope="reports"
        current={currentView}
        onApply={applyView}
        isActive={isViewActive}
      />

      {/* Filter Bar */}
      <FilterBar
        hasActive={hasActiveFilter}
        onClear={clearFilters}
        resultSummary={
          <span>
            Đang xem{' '}
            <span className="font-semibold text-zinc-900">
              {REPORT_TYPE_OPTIONS.find((o) => o.value === reportType)?.label}
            </span>{' '}
            ·{' '}
            <span className="font-semibold text-zinc-900">
              {TIME_OPTIONS.find((o) => o.value === time)?.label}
            </span>
            {employee && (
              <>
                {' '}
                · nhân viên{' '}
                <span className="font-semibold text-zinc-900">{employee}</span>
              </>
            )}
            {field && (
              <>
                {' '}
                · lĩnh vực{' '}
                <span className="font-semibold text-zinc-900">{field}</span>
              </>
            )}
          </span>
        }>
        <FilterField label="Loại báo cáo" width="w-52">
          <Select
            value={reportType}
            onChange={setReportType}
            options={REPORT_TYPE_OPTIONS}
          />
        </FilterField>
        <FilterField label="Thời gian" width="w-36">
          <Select value={time} onChange={setTime} options={TIME_OPTIONS} />
        </FilterField>
        <FilterField label="Nhân viên" width="w-44">
          <Select
            value={employee}
            onChange={setEmployee}
            options={dynamicEmployeeOptions}
            placeholder="Tất cả"
            disabled={scopeLocked}
          />
        </FilterField>
        <FilterField label="Lĩnh vực" width="w-44">
          <Select
            value={field}
            onChange={setField}
            options={FIELD_OPTIONS}
            placeholder="Tất cả"
          />
        </FilterField>
        <FilterField label="Trạng thái" width="w-40">
          <Select
            value={status}
            onChange={setStatus}
            options={STATUS_OPTIONS}
            placeholder="Tất cả"
          />
        </FilterField>
        <FilterField label=" " width="w-auto">
          <Button variant="primary" size="md" onClick={handleRefresh}>
            Tạo báo cáo
          </Button>
        </FilterField>
      </FilterBar>

      {/* Scope Banner — hiển thị phạm vi đang xem */}
      {(scopedEmployee || scopeLocked) && (
        <div className={`flex items-center justify-between gap-3 px-4 py-3 rounded-lg border ${
          personalMode
            ? 'bg-gradient-to-r from-amber-50 via-amber-50/60 to-transparent border-amber-200/70'
            : 'bg-zinc-50 border-zinc-200'
        }`}>
          <div className="flex items-center gap-3">
            <span className={`h-9 w-9 rounded-full inline-flex items-center justify-center text-white text-sm font-bold shadow ${
              personalMode ? 'bg-gradient-to-br from-amber-500 to-amber-700' : 'bg-zinc-600'
            }`}>
              {(scopedEmployee?.name ?? currentUser?.name ?? '?').slice(0, 1).toUpperCase()}
            </span>
            <div>
              <p className="text-[13px] font-semibold text-zinc-900 flex items-center gap-2">
                Phạm vi: {scopedEmployee?.name ?? currentUser?.name ?? '—'}
                {scopeLocked && (
                  <span className="inline-flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded bg-zinc-200/70 text-zinc-600">
                    <LockIcon className="h-3 w-3" /> Khóa bởi quyền
                  </span>
                )}
                {ranking && (
                  <span className="inline-flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded bg-amber-100 text-amber-800">
                    <TrophyIcon className="h-3 w-3" /> #{ranking.rank}/{ranking.total} doanh thu
                  </span>
                )}
              </p>
              <p className="text-[11.5px] text-zinc-500 mt-0.5">
                {scopedEmployee
                  ? `${scopedEmployee.signed_this_year} HĐ năm nay · ${formatCurrency(scopedEmployee.total_value)} · ${scopedEmployee.pending_count} chờ xử lý`
                  : 'Chưa có thống kê cho nhân viên này.'}
              </p>
            </div>
          </div>
          {!scopeLocked && employee && (
            <Button variant="secondary" size="sm" onClick={() => setEmployee('')}>
              Xem toàn bộ
            </Button>
          )}
          {!personalMode && !employee && canPickAnyEmployee && (
            <Button
              variant="secondary"
              size="sm"
              leftIcon={<UserCircle2Icon className="h-4 w-4" />}
              onClick={() => onNavigate('reports.me')}>
              Báo cáo của tôi
            </Button>
          )}
        </div>
      )}
      {!scopedEmployee && !scopeLocked && (
        <div className="flex items-center justify-end">
          <Button
            variant="secondary"
            size="sm"
            leftIcon={<UserCircle2Icon className="h-4 w-4" />}
            onClick={() => onNavigate('reports.me')}>
            Báo cáo của tôi
          </Button>
        </div>
      )}

      {/* Personal KPI strip — chỉ khi đã có scopedEmployee */}
      {scopedEmployee && (
        <>
          <div className="flex items-center gap-2 text-[12px] uppercase tracking-[0.14em] font-bold text-amber-800">
            <UserCircle2Icon className="h-4 w-4" />
            KPI cá nhân — {scopedEmployee.name}
          </div>
          <MetricStrip
            items={[
              {
                label: 'HĐ ký năm nay',
                value: formatNumber(scopedEmployee.signed_this_year),
                tone: 'indigo',
                icon: <FileTextIcon className="h-4 w-4" />,
                hint: `Tuần này: ${scopedEmployee.signed_this_week} · Tháng: ${scopedEmployee.signed_this_month}`,
              },
              {
                label: 'Doanh thu cá nhân',
                value: scopedEmployee.total_value > 0
                  ? `${(scopedEmployee.total_value / 1_000_000_000).toFixed(2)} tỷ`
                  : '—',
                tone: 'cyan',
                icon: <WalletIcon className="h-4 w-4" />,
                hint: scopedEmployee.avg_value > 0
                  ? `TB/HĐ: ${formatCurrency(Math.round(scopedEmployee.avg_value))}`
                  : 'Chưa có giá trị',
              },
              {
                label: 'Đang chờ xử lý',
                value: formatNumber(scopedEmployee.pending_count),
                tone: scopedEmployee.pending_count >= 6 ? 'rose' : 'amber',
                icon: <AlertCircleIcon className="h-4 w-4" />,
                hint: scopedEmployee.pending_count >= 6 ? 'Quá tải — cần san tải' : 'Trong giới hạn',
              },
              {
                label: 'Sắp hết hạn (phụ trách)',
                value: formatNumber(scopedEmployee.expiring_soon),
                tone: 'amber',
                icon: <AlertTriangleIcon className="h-4 w-4" />,
                hint: 'HĐ NV này phụ trách',
              },
              ranking
                ? {
                    label: 'Xếp hạng đội',
                    value: `#${ranking.rank}/${ranking.total}`,
                    tone: ranking.rank === 1 ? 'emerald' : ranking.rank <= 3 ? 'violet' : 'amber',
                    icon: <TrophyIcon className="h-4 w-4" />,
                    hint: ranking.topRevenue > 0
                      ? `Top 1: ${(ranking.topRevenue / 1_000_000_000).toFixed(2)} tỷ`
                      : 'Theo doanh thu',
                  }
                : {
                    label: 'Xếp hạng đội',
                    value: '—',
                    tone: 'amber',
                    icon: <TrophyIcon className="h-4 w-4" />,
                  },
            ]}
          />
          {!personalMode && (
            <div className="-mt-2 mb-2 text-[11px] text-zinc-500 italic">
              KPI tổng hệ thống bên dưới — không bị ảnh hưởng bởi filter nhân viên.
            </div>
          )}
        </>
      )}

      {/* Section 1 — KPI tổng quan (ẩn trong personalMode để gọn) */}
      {stats && !personalMode && (
        <>
          <MetricStrip
            items={[
              {
                label: 'Tổng hợp đồng',
                value: formatNumber(stats.totalContracts),
                tone: 'indigo',
                icon: <FileTextIcon className="h-4 w-4" />,
                hint: 'Tất cả hợp đồng · Click để xem chi tiết',
                sparkline: contractSpark,
                delta: contractsDelta,
                onClick: openContractsDrilldown,
                compare: comparePrev && stats.contracts2025
                  ? { value: formatNumber(stats.contracts2025), label: 'Năm trước' }
                  : undefined,
              },
              {
                label: 'Còn hiệu lực',
                value: formatNumber(stats.active),
                tone: 'emerald',
                icon: <CheckCircle2Icon className="h-4 w-4" />,
                hint: 'Hợp đồng đang hoạt động',
                sparkline: contractSpark,
                onClick: openContractsDrilldown,
              },
              {
                label: 'Sắp hết 60 ngày',
                value: formatNumber(stats.expiringIn60Days),
                tone: 'amber',
                icon: <AlertTriangleIcon className="h-4 w-4" />,
                hint: `Trong đó ${stats.expiringIn30Days} hết 30 ngày · Click chi tiết`,
                onClick: openExpiringDrilldown,
              },
              {
                label: 'Hết hạn',
                value: formatNumber(stats.expired),
                tone: 'rose',
                icon: <XCircleIcon className="h-4 w-4" />,
                hint: 'Cần rà soát tái ký',
                onClick: openExpiringDrilldown,
              },
            ]}
          />

          <MetricStrip
            items={[
              {
                label: 'Doanh thu năm nay',
                value:
                  stats.revenue2026 > 0
                    ? `${(stats.revenue2026 / 1_000_000_000).toFixed(2)} tỷ`
                    : '—',
                tone: 'cyan',
                icon: <WalletIcon className="h-4 w-4" />,
                hint: 'Lũy kế đến hôm nay · Click để bóc tách',
                sparkline: revenueSpark,
                delta: revenueDelta,
                onClick: openRevenueDrilldown,
                compare: comparePrev && stats.revenue2025
                  ? {
                      value: `${(stats.revenue2025 / 1_000_000_000).toFixed(2)} tỷ`,
                      label: 'Năm trước',
                    }
                  : undefined,
              },
              {
                label: 'Doanh thu năm trước',
                value:
                  stats.revenue2025 > 0
                    ? `${(stats.revenue2025 / 1_000_000_000).toFixed(2)} tỷ`
                    : '—',
                tone: 'emerald',
                icon: <WalletIcon className="h-4 w-4" />,
                hint: 'Năm trước',
                sparkline: revenueSpark.slice(0, -1),
                onClick: openRevenueDrilldown,
              },
              {
                label: 'Tác phẩm',
                value: stats.totalWorks > 0 ? formatNumber(stats.totalWorks) : '—',
                tone: 'sky',
                icon: <Music2Icon className="h-4 w-4" />,
                hint: 'Đang quản lý',
              },
              {
                label: 'GCN bản nháp',
                value: formatNumber(stats.gcnDraft),
                tone: 'amber',
                icon: <FileTextIcon className="h-4 w-4" />,
                hint: 'Chờ cấp số & in · Click chi tiết',
                onClick: openGcnDrilldown,
              },
              {
                label: 'GCN in chính thức',
                value: formatNumber(stats.gcnFinalPrinted),
                tone: 'violet',
                icon: <AwardIcon className="h-4 w-4" />,
                hint: 'Đã phát hành',
                onClick: openGcnDrilldown,
              },
            ]}
          />
        </>
      )}

      {/* Insight Panel + Goal — phân tích tự động & mục tiêu */}
      {/* Insight Panel + Goal */}
      {sectionVis.insights && summary && (insights.length > 0 || stats) && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 stagger">
          {stats && (
            <GoalProgressCard
              current={stats.revenue2026}
              year={new Date().getFullYear()}
            />
          )}
          {insights.slice(0, 4).map((ins) => (
            <InsightCard
              key={ins.id}
              tone={ins.tone}
              title={ins.title}
              description={ins.description}
            />
          ))}
        </div>
      )}

      {/* Section 2 — Hiệu suất nhân viên */}
      {sectionVis.performance && employeeStats && employeeStats.employees.length > 0 && (
        <ContentCard
          title="Hiệu suất xử lý theo nhân viên"
          description="Theo dõi tải công việc và tỷ lệ hoàn thành. Dữ liệu từ hợp đồng đã ký."
          padded={false}
          accent
          actions={
            <Tabs
              tabs={[
                { value: '', label: 'Tất cả' },
                ...employeeStats.employees.map((e) => ({
                  value: e.name,
                  label: e.name,
                })),
              ]}
              value={employee}
              onChange={setEmployee}
            />
          }>
          <EmployeePerformanceTable
            items={
              employee
                ? employeeStats.employees.filter((e) => e.name === employee)
                : employeeStats.employees
            }
          />
        </ContentCard>
      )}

      {/* Section 3 — Hợp đồng đã ký */}
      {sectionVis.signed && (
      <ContentCard
        title="Hợp đồng đã ký"
        description="Danh sách hợp đồng đã ký với giá trị. Dữ liệu từ database thực."
        padded={false}
        accent
        actions={
          <Tabs
            tabs={SIGNED_TABS}
            value={signedScope}
            onChange={(v) => setSignedScope(v as SignedScope)}
          />
        }>
        {/* Summary strip */}
        <div className="grid grid-cols-3 gap-4 px-5 py-4 border-b border-zinc-100/80 bg-zinc-50/40">
          <SummaryStat
            label="Hợp đồng đã ký"
            value={formatNumber(signedSummary.count)}
            suffix="hợp đồng"
          />
          <SummaryStat
            label="Tổng giá trị"
            value={signedSummary.totalValue > 0 ? formatCurrency(signedSummary.totalValue) : '—'}
            highlight
          />
          <SummaryStat
            label="Trung bình / hợp đồng"
            value={
              signedSummary.count > 0
                ? formatCurrency(Math.round(signedSummary.avg))
                : '—'
            }
          />
        </div>

        {signedRows.length === 0 ? (
          <EmptyState
            title="Không có hợp đồng đã ký trong khoảng thời gian này"
            description="Thử mở rộng khoảng thời gian (tuần → tháng → quý → năm)."
            icon={<XCircleIcon className="h-5 w-5" />}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gradient-to-b from-amber-50/30 via-zinc-50 to-zinc-50/30 border-b border-zinc-200">
                  <Th>Số hợp đồng</Th>
                  <Th>Ngày ký</Th>
                  <Th>Đơn vị / Bảng hiệu</Th>
                  <Th>Lĩnh vực</Th>
                  <Th align="right">Giá trị</Th>
                  <Th>Thời hạn</Th>
                  <Th>GCN</Th>
                </tr>
              </thead>
              <tbody>
                {signedRows.map((r) => (
                  <tr
                    key={r.id}
                    className="border-b border-zinc-100 last:border-0 hover:bg-amber-50/30 transition-colors cursor-pointer"
                    onClick={() => onNavigate('contracts.list')}>
                    <td className="px-4 py-3.5 align-top whitespace-nowrap">
                      <span className="font-mono text-[13px] font-semibold text-amber-800">
                        {r.contract_no}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 align-top tabular-nums text-[13px] whitespace-nowrap text-zinc-700">
                      {r.signed_date ? formatDate(r.signed_date) : '—'}
                    </td>
                    <td className="px-4 py-3.5 align-top max-w-[260px]">
                      <p className="text-[14px] font-semibold text-zinc-900 leading-snug line-clamp-2">
                        {r.partner}
                      </p>
                      {r.brand && (
                        <p className="mt-0.5 text-[12px] text-zinc-500 truncate">
                          {r.brand}
                        </p>
                      )}
                    </td>
                    <td className="px-4 py-3.5 align-top text-[13px] text-zinc-700">
                      {r.field ?? '—'}
                    </td>
                    <td className="px-4 py-3.5 align-top text-right tabular-nums whitespace-nowrap">
                      {r.value == null ? (
                        <span className="text-zinc-400 italic text-xs">Chưa có</span>
                      ) : (
                        <span className="font-semibold text-zinc-900 text-[13px]">
                          {formatCurrency(r.value)}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3.5 align-top whitespace-nowrap">
                      <p className="text-zinc-700 tabular-nums text-[12px]">
                        {r.start_date ? formatDate(r.start_date) : '—'}
                      </p>
                      <p className="text-zinc-500 tabular-nums text-[11px]">
                        → {r.end_date ? formatDate(r.end_date) : '—'}
                      </p>
                    </td>
                    <td className="px-4 py-3.5 align-top">
                      <StatusBadge
                        tone={
                          r.gcn_status === 'final_printed'
                            ? 'success'
                            : r.gcn_status === 'test_printed'
                              ? 'warning'
                              : r.gcn_status === 'draft'
                                ? 'neutral'
                                : 'danger'
                        }
                        dot>
                        {GCN_STATUS_LABEL[r.gcn_status] ?? r.gcn_status}
                      </StatusBadge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </ContentCard>
      )}

      {/* Section 4 — Hợp đồng chưa ký / chờ xử lý */}
      {sectionVis.pending && (
      <ContentCard
        title="Hợp đồng chưa ký / chờ xử lý"
        description="Hồ sơ đang tồn — biết đang thiếu bước gì và ai phụ trách."
        padded={false}
        accent
        actions={
          <Button
            variant="ghost"
            size="sm"
            leftIcon={<EyeIcon className="h-3.5 w-3.5" />}
            onClick={() => onNavigate('contracts.list')}>
            Xem tất cả
          </Button>
        }>
        {/* Category strip */}
        <div className="flex flex-wrap gap-1.5 px-5 py-3 border-b border-zinc-100/80 bg-zinc-50/40">
          {(
            Object.keys(PENDING_CATEGORY_LABEL) as Array<
              keyof typeof PENDING_CATEGORY_LABEL
            >
          ).map((k) => {
            const count = filteredPending.filter((r) => r.category === k).length;
            return (
              <span
                key={k}
                className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-[11px] font-medium ring-1 ring-inset ${
                  count > 0
                    ? 'bg-amber-50 text-amber-800 ring-amber-700/15'
                    : 'bg-zinc-100 text-zinc-500 ring-zinc-900/5'
                }`}>
                <span
                  className={`h-1.5 w-1.5 rounded-full ${
                    count > 0 ? 'bg-amber-600' : 'bg-zinc-300'
                  }`}
                />
                {PENDING_CATEGORY_LABEL[k]}
                <span className="font-bold tabular-nums">{count}</span>
              </span>
            );
          })}
        </div>

        {filteredPending.length === 0 ? (
          <EmptyState
            title="Không có hồ sơ nào đang chờ xử lý"
            description="Tốt — workspace đang sạch."
            icon={<CheckCircle2Icon className="h-5 w-5" />}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gradient-to-b from-amber-50/30 via-zinc-50 to-zinc-50/30 border-b border-zinc-200">
                  <Th>Đơn vị / Bảng hiệu</Th>
                  <Th>Lĩnh vực</Th>
                  <Th>Người phụ trách</Th>
                  <Th>Ngày tạo</Th>
                  <Th align="right">Số ngày tồn</Th>
                  <Th>Thiếu bước</Th>
                  <Th>Ưu tiên</Th>
                  <th className="w-10 pr-3" />
                </tr>
              </thead>
              <tbody>
                {filteredPending.map((p) => {
                  const priority = getPendingPriority(p.daysStuck);
                  return (
                    <tr
                      key={p.id}
                      className="border-b border-zinc-100 last:border-0 hover:bg-amber-50/20 transition-colors">
                      <td className="px-4 py-3.5 align-top max-w-[260px]">
                        <p className="text-[14px] font-semibold text-zinc-900 leading-snug line-clamp-2">
                          {p.contract?.don_vi_ten ?? '—'}
                        </p>
                        {p.contract?.ten_bang_hieu && (
                          <p className="mt-0.5 text-[12px] text-zinc-500 truncate">
                            {p.contract.ten_bang_hieu}
                          </p>
                        )}
                      </td>
                      <td className="px-4 py-3.5 align-top text-[13px] text-zinc-700">
                        {p.contract?.linh_vuc_hien_thi ?? '—'}
                      </td>
                      <td className="px-4 py-3.5 align-top text-[13px]">
                        <span className="inline-flex items-center gap-1.5">
                          <span className="h-5 w-5 rounded-full bg-gradient-to-br from-amber-600 to-amber-600 text-white text-[10px] font-bold inline-flex items-center justify-center shrink-0">
                            {p.assignee && p.assignee !== '—' ? p.assignee.slice(0, 1).toUpperCase() : '?'}
                          </span>
                          <span className="text-zinc-700">{p.assignee}</span>
                        </span>
                      </td>
                      <td className="px-4 py-3.5 align-top tabular-nums text-[13px] whitespace-nowrap text-zinc-700">
                        {formatDate(p.createdAt)}
                      </td>
                      <td className="px-4 py-3.5 align-top text-right tabular-nums whitespace-nowrap text-[13px]">
                        <span
                          className={`font-semibold ${
                            p.daysStuck > 14
                              ? 'text-rose-700'
                              : p.daysStuck >= 7
                                ? 'text-amber-700'
                                : 'text-zinc-700'
                          }`}>
                          {p.daysStuck} ngày
                        </span>
                      </td>
                      <td className="px-4 py-3.5 align-top text-[13px] max-w-[220px]">
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[11px] font-medium bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-600/15">
                          {PENDING_CATEGORY_LABEL[p.category]}
                        </span>
                        <p className="mt-1 text-[11.5px] text-zinc-500 leading-snug line-clamp-1">
                          {p.missingStep}
                        </p>
                      </td>
                      <td className="px-4 py-3.5 align-top">
                        <StatusBadge tone={priority.tone} dot>
                          {priority.label}
                        </StatusBadge>
                      </td>
                      <td className="pr-3 pl-1 align-top text-right">
                        <RowActionsMenu
                          actions={[
                            {
                              label: 'Mở hồ sơ',
                              icon: <EyeIcon className="h-4 w-4" />,
                              onClick: () => onNavigate('contracts.list'),
                            },
                            {
                              label: 'Bổ sung thông tin',
                              icon: <FilePlusIcon className="h-4 w-4" />,
                              onClick: () => onNavigate('contracts.create'),
                            },
                            {
                              label: 'Gửi nhắc xử lý',
                              icon: <BellRingIcon className="h-4 w-4" />,
                              onClick: () => {},
                            },
                          ]}
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </ContentCard>
      )}

      {/* Section 5 — Hợp đồng sắp hết hạn cần tái ký */}
      {sectionVis.expiring && (
      <ContentCard
        title="Hợp đồng sắp hết hạn cần tái ký"
        description="Ưu tiên xử lý theo mức độ khẩn cấp. Dữ liệu từ database thực."
        padded={false}
        accent
        actions={
          <Tabs
            tabs={EXPIRING_FILTER_TABS}
            value={expiringScope}
            onChange={setExpiringScope}
          />
        }>
        {filteredExpiring.length === 0 ? (
          <EmptyState
            title="Không có hợp đồng sắp hết hạn"
            description="Không có hợp đồng nào hết hạn trong khoảng thời gian này."
            icon={<XCircleIcon className="h-5 w-5" />}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gradient-to-b from-rose-50/30 via-zinc-50 to-zinc-50/30 border-b border-zinc-200">
                  <Th>Số hợp đồng</Th>
                  <Th>Đơn vị</Th>
                  <Th>Ngày hết hạn</Th>
                  <Th align="right">Còn lại</Th>
                  <Th align="right">Giá trị</Th>
                  <Th>Lĩnh vực</Th>
                  <Th>Trạng thái tái ký</Th>
                  <Th>Ưu tiên</Th>
                  <th className="w-10 pr-3" />
                </tr>
              </thead>
              <tbody>
                {filteredExpiring.map((r) => {
                  const priority =
                    r.days_left <= 7
                      ? { label: 'Khẩn cấp', tone: 'danger' as const }
                      : r.days_left <= 30
                        ? { label: 'Cao', tone: 'warning' as const }
                        : { label: 'Theo dõi', tone: 'info' as const };
                  return (
                    <tr
                      key={r.id}
                      className="border-b border-zinc-100 last:border-0 hover:bg-rose-50/20 transition-colors">
                      <td className="px-4 py-3.5 align-top whitespace-nowrap">
                        <span className="font-mono text-[13px] font-semibold text-amber-800">
                          {r.contract_no}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 align-top max-w-[280px]">
                        <p className="text-[14px] font-semibold text-zinc-900 leading-snug line-clamp-2">
                          {r.partner}
                        </p>
                      </td>
                      <td className="px-4 py-3.5 align-top tabular-nums text-[13px] whitespace-nowrap text-zinc-700">
                        {r.expire_date ? formatDate(r.expire_date) : '—'}
                      </td>
                      <td className="px-4 py-3.5 align-top text-right tabular-nums whitespace-nowrap text-[13px]">
                        <span
                          className={`font-semibold ${
                            r.days_left <= 7
                              ? 'text-rose-700'
                              : r.days_left <= 30
                                ? 'text-amber-700'
                                : 'text-zinc-700'
                          }`}>
                          {r.days_left} ngày
                        </span>
                      </td>
                      <td className="px-4 py-3.5 align-top text-right tabular-nums whitespace-nowrap">
                        {r.value != null ? (
                          <span className="font-semibold text-zinc-900 text-[13px]">
                            {formatCurrency(r.value)}
                          </span>
                        ) : (
                          <span className="text-zinc-400 italic text-xs">Chưa có</span>
                        )}
                      </td>
                      <td className="px-4 py-3.5 align-top text-[13px] text-zinc-700">
                        {r.field || '—'}
                      </td>
                      <td className="px-4 py-3.5 align-top">
                        <StatusBadge tone="orange" dot>
                          Chờ tái ký
                        </StatusBadge>
                      </td>
                      <td className="px-4 py-3.5 align-top">
                        <StatusBadge tone={priority.tone} dot>
                          {priority.label}
                        </StatusBadge>
                      </td>
                      <td className="pr-3 pl-1 align-top text-right">
                        <RowActionsMenu
                          actions={[
                            {
                              label: 'Xem hợp đồng',
                              icon: <EyeIcon className="h-4 w-4" />,
                              onClick: () => onNavigate('contracts.list'),
                            },
                            {
                              label: 'Tạo hợp đồng tái ký',
                              icon: <RotateCcwIcon className="h-4 w-4" />,
                              onClick: () => onNavigate('contracts.create'),
                            },
                            {
                              label: 'Gửi nhắc xử lý',
                              icon: <BellRingIcon className="h-4 w-4" />,
                              onClick: () => {},
                            },
                            {
                              label: 'Xuất dòng này',
                              icon: <DownloadIcon className="h-4 w-4" />,
                              onClick: () => setExportOpen(true),
                            },
                          ]}
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </ContentCard>
      )}

      {/* Section 6 — Doanh thu */}
      {sectionVis.revenue && (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <ContentCard
          title="Doanh thu theo năm"
          description="Đơn vị: tỷ VND · Năm hiện tại là dữ liệu lũy kế đến hôm nay"
          className="lg:col-span-2"
          accent>
          <div className="h-72">
            <ResponsiveContainer>
              <BarChart
                data={revenueByYear}
                margin={{ top: 10, right: 16, left: -10, bottom: 0 }}
                barCategoryGap="35%"
                onMouseLeave={() => setHoverIdx(null)}>
                <defs>
                  <linearGradient id="rep2BarFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#e6c79a" stopOpacity={1} />
                    <stop offset="100%" stopColor="#c89968" stopOpacity={0.95} />
                  </linearGradient>
                  <linearGradient id="rep2BarFillHover" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#f0d4ad" stopOpacity={1} />
                    <stop offset="100%" stopColor="#9c6d3e" stopOpacity={1} />
                  </linearGradient>
                  <linearGradient id="rep2BarFillPrev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#efe4d2" stopOpacity={1} />
                    <stop offset="100%" stopColor="#c9b89a" stopOpacity={0.9} />
                  </linearGradient>
                  <pattern
                    id="rep2NullPattern"
                    patternUnits="userSpaceOnUse"
                    width="6"
                    height="6"
                    patternTransform="rotate(45)">
                    <rect width="6" height="6" fill="#faf5ec" />
                    <line
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="6"
                      stroke="#d9c8a8"
                      strokeWidth="2"
                    />
                  </pattern>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#ece3d2" vertical={false} />
                <XAxis
                  dataKey="year"
                  stroke="#9c8c6e"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  dy={4}
                />
                <YAxis
                  stroke="#9c8c6e"
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                  dx={-4}
                />
                <Tooltip
                  cursor={{ fill: 'rgba(200,153,104,0.10)' }}
                  contentStyle={{
                    border: '1px solid rgba(200,153,104,0.35)',
                    borderRadius: 12,
                    background: 'rgba(28, 22, 16, 0.94)',
                    backdropFilter: 'blur(8px)',
                    color: '#fff',
                    fontSize: 12,
                    padding: '8px 12px',
                    boxShadow: '0 14px 40px rgba(156,109,62,0.28)',
                  }}
                  labelStyle={{ color: '#e6c79a', fontWeight: 600, marginBottom: 2 }}
                  itemStyle={{ color: '#fff' }}
                  formatter={(_v: number, _n: unknown, p: any) => {
                    const d = p?.payload;
                    if (!d || d.isNull)
                      return ['Chưa có dữ liệu', 'Doanh thu'];
                    return [
                      `${d.revenueBn.toLocaleString('vi-VN', { maximumFractionDigits: 2 })} tỷ`,
                      'Doanh thu',
                    ];
                  }}
                />
                {comparePrev && (
                  <Bar
                    dataKey="prevRevenueBn"
                    radius={[6, 6, 0, 0]}
                    fill="#d4c4a8"
                    fillOpacity={0.55}
                    minPointSize={2}
                    name="Năm liền trước"
                  />
                )}
                <Bar
                  dataKey="revenueBn"
                  radius={[6, 6, 0, 0]}
                  onMouseEnter={(_: unknown, idx: number) => setHoverIdx(idx)}
                  minPointSize={4}
                  name="Năm hiện tại">
                  {revenueByYear.map((y, i) => {
                    if (y.isNull)
                      return <Cell key={i} fill="url(#rep2NullPattern)" />;
                    if (i === revenueByYear.length - 1)
                      return (
                        <Cell
                          key={i}
                          fill={hoverIdx === i ? 'url(#rep2BarFillHover)' : 'url(#rep2BarFill)'}
                        />
                      );
                    return <Cell key={i} fill="url(#rep2BarFillPrev)" />;
                  })}
                </Bar>
                {yearForecast && (
                  <ReferenceLine
                    y={yearForecast.projectedBn}
                    stroke="#9c6d3e"
                    strokeDasharray="5 4"
                    strokeWidth={1.5}
                    ifOverflow="extendDomain"
                    label={{
                      value: `Dự báo cuối năm · ${yearForecast.projectedBn.toFixed(2)} tỷ`,
                      position: 'insideTopRight',
                      fill: '#9c6d3e',
                      fontSize: 11,
                      fontWeight: 600,
                    }}
                  />
                )}
              </BarChart>
            </ResponsiveContainer>
          </div>
          <p className="mt-3 text-[11px] text-zinc-500 leading-relaxed border-t border-zinc-100 pt-3">
            Năm hiện tại là dữ liệu lũy kế đến hôm nay. Đường gạch nét là <span className="font-semibold text-amber-800">dự báo cuối năm</span> dựa trên tốc độ hiện tại ({(yearForecast?.progress ? yearForecast.progress * 100 : 0).toFixed(0)}% năm đã qua). Cột pattern gạch chéo nghĩa là chưa có dữ liệu.
          </p>
        </ContentCard>

        <ContentCard title="Tỷ lệ & trung bình" description="Số hợp đồng và giá trị trung bình" accent>
          <div className="space-y-4">
            {stats && revenueByYear.length > 0 ? (
              revenueByYear.map((y, i) => {
                const yearStats = {
                  contracts2026: (summary?.revenue_by_year ?? []).find(
                    (r) => r.year === y.year
                  )?.contract_count ?? 0,
                  revenue2026: (summary?.revenue_by_year ?? []).find(
                    (r) => r.year === y.year
                  )?.total_revenue ?? null,
                };
                const avg =
                  yearStats.contracts2026 > 0 && yearStats.revenue2026
                    ? yearStats.revenue2026 / yearStats.contracts2026
                    : null;
                return (
                  <YearStat
                    key={y.year}
                    year={String(y.year)}
                    count={y.contract_count}
                    revenue={y.total_revenue ?? null}
                    tone={i === revenueByYear.length - 1 ? 'indigo' : i === revenueByYear.length - 2 ? 'emerald' : 'neutral'}
                    note={y.isNull ? 'Chưa có dữ liệu tiền' : y.cumulative ? 'Lũy kế' : undefined}
                  />
                );
              })
            ) : (
              <p className="text-sm text-zinc-500 italic">Chưa có dữ liệu doanh thu.</p>
            )}
          </div>
        </ContentCard>
      </div>
      )}

      {/* Section 7 — GCN Report */}
      {sectionVis.gcn && (
      <ContentCard
        title="Báo cáo GCN"
        description="Trạng thái cấp số & in giấy chứng nhận. Dữ liệu từ database thực."
        padded={false}
        accent
        actions={
          <Button
            variant="ghost"
            size="sm"
            leftIcon={<EyeIcon className="h-3.5 w-3.5" />}
            onClick={() => onNavigate('contracts.gcn')}>
            Xem tất cả GCN
          </Button>
        }>
        {/* GCN metric strip */}
        {stats && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 px-5 py-4 border-b border-zinc-100/80 bg-zinc-50/40">
            <SummaryStat
              label="Bản nháp"
              value={formatNumber(stats.gcnDraft)}
              tone="amber"
            />
            <SummaryStat
              label="In thử"
              value={formatNumber(stats.gcnTestPrinted)}
              tone="cyan"
            />
            <SummaryStat
              label="In chính thức"
              value={formatNumber(stats.gcnFinalPrinted)}
              tone="emerald"
            />
            <SummaryStat
              label="Tổng cộng"
              value={formatNumber(summary?.certificate_total ?? 0)}
              tone="rose"
            />
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gradient-to-b from-amber-50/30 via-zinc-50 to-zinc-50/30 border-b border-zinc-200">
                <Th>Số GCN</Th>
                <Th>Số hợp đồng</Th>
                <Th>Đơn vị</Th>
                <Th>Trạng thái</Th>
                <Th align="right">Số lần in</Th>
                <Th>Ngày in</Th>
              </tr>
            </thead>
            <tbody>
              {certRows.map((c) => (
                <tr
                  key={c.id}
                  className="border-b border-zinc-100 last:border-0 hover:bg-amber-50/20 transition-colors cursor-pointer"
                  onClick={() => onNavigate('contracts.gcn')}>
                  <td className="px-4 py-3.5 align-top whitespace-nowrap">
                    {c.certificate_no ? (
                      <span className="font-mono text-[13px] font-semibold text-amber-800">
                        {c.certificate_no}
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium bg-rose-50 text-rose-700 ring-1 ring-inset ring-rose-600/15">
                        Chưa cấp số
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3.5 align-top whitespace-nowrap">
                    <span className="font-mono text-[13px] font-medium text-amber-800">
                      {c.contract_no || '—'}
                    </span>
                  </td>
                  <td className="px-4 py-3.5 align-top max-w-[260px]">
                    <p className="text-[13px] font-semibold text-zinc-900 leading-snug line-clamp-2">
                      {c.organization_name || '—'}
                    </p>
                  </td>
                  <td className="px-4 py-3.5 align-top">
                    <StatusBadge
                      tone={
                        c.status === 'final_printed'
                          ? 'success'
                          : c.status === 'test_printed'
                            ? 'warning'
                            : 'neutral'
                      }
                      dot>
                      {GCN_STATUS_LABEL[c.status] ?? c.status}
                    </StatusBadge>
                  </td>
                  <td className="px-4 py-3.5 align-top text-right tabular-nums whitespace-nowrap">
                    {c.print_count > 0 ? (
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[11px] font-semibold bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-600/15">
                        <PrinterIcon className="h-3 w-3" />
                        {c.print_count} lần
                      </span>
                    ) : (
                      <span className="text-[12px] text-zinc-400 italic">Chưa in</span>
                    )}
                  </td>
                  <td className="px-4 py-3.5 align-top tabular-nums text-[13px] whitespace-nowrap text-zinc-700">
                    {c.printed_at ? formatDate(c.printed_at.slice(0, 10)) : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </ContentCard>
      )}
      </div>

      <ExportReportDialog
        open={exportOpen}
        onClose={() => setExportOpen(false)}
        defaultType={
          reportType === 'overview'
            ? 'summary'
            : reportType === 'employee'
              ? 'employee'
              : reportType === 'signed'
                ? 'signed'
                : reportType === 'pending'
                  ? 'pending'
                  : reportType === 'expiring'
                    ? 'expiring'
                    : reportType === 'gcn'
                      ? 'gcn'
                      : 'revenue'
        }
        contractsFilters={{
          q: undefined,
          year: undefined,
          domain: field || undefined,
          status: status || undefined,
          date_from: undefined,
          date_to: undefined,
        }}
        expiringFilters={{
          days: expiringScope === '7d' ? 7 : expiringScope === '30d' ? 30 : expiringScope === '60d' ? 60 : 90,
          domain: field || undefined,
          q: undefined,
        }}
        revenueFilters={{
          year: undefined,
          domain: field || undefined,
          date_from: undefined,
          date_to: undefined,
        }}
        timeLabel={TIME_OPTIONS.find((t) => t.value === time)?.label ?? 'Năm này'}
      />

      <DrilldownDrawer
        open={!!drilldown}
        onClose={() => setDrilldown(null)}
        title={drilldown?.title ?? ''}
        subtitle={drilldown?.subtitle}
        primary={drilldown?.primary}
        items={drilldown?.items}
      />
    </Page>
  );
}

function Th({
  children,
  align = 'left',
}: {
  children: React.ReactNode;
  align?: 'left' | 'right' | 'center';
}) {
  return (
    <th
      className={`px-4 py-3.5 text-[11px] font-semibold uppercase tracking-[0.08em] text-zinc-700 ${
        align === 'right' ? 'text-right' : align === 'center' ? 'text-center' : 'text-left'
      }`}>
      {children}
    </th>
  );
}

function SummaryStat({
  label,
  value,
  suffix,
  highlight,
  tone,
}: {
  label: string;
  value: string;
  suffix?: string;
  highlight?: boolean;
  tone?: 'amber' | 'cyan' | 'emerald' | 'rose';
}) {
  const dotColor =
    tone === 'amber'
      ? 'bg-amber-500'
      : tone === 'cyan'
        ? 'bg-amber-600'
        : tone === 'emerald'
          ? 'bg-emerald-500'
          : tone === 'rose'
            ? 'bg-rose-500'
            : 'bg-amber-600';
  return (
    <div>
      <span className="inline-flex items-center gap-1.5 text-[10px] font-medium uppercase tracking-[0.1em] text-zinc-500">
        <span className={`h-1.5 w-1.5 rounded-full ${dotColor}`} />
        {label}
      </span>
      <p
        className={`mt-1 text-xl font-semibold tracking-tight tabular-nums ${
          highlight ? 'text-emerald-700' : 'text-zinc-900'
        }`}>
        {value}
        {suffix && (
          <span className="text-xs font-normal text-zinc-500 ml-1">{suffix}</span>
        )}
      </p>
    </div>
  );
}

function YearStat({
  year,
  count,
  revenue,
  tone,
  note,
}: {
  year: string;
  count: number;
  revenue: number | null;
  tone: 'indigo' | 'emerald' | 'neutral';
  note?: string;
}) {
  const dotColor =
    tone === 'indigo'
      ? 'bg-amber-600'
      : tone === 'emerald'
        ? 'bg-emerald-500'
        : 'bg-zinc-400';
  const avg = revenue && count > 0 ? Math.round(revenue / count) : null;
  return (
    <div className="rounded-xl ring-1 ring-zinc-900/[0.06] bg-white p-3">
      <div className="flex items-center justify-between mb-2">
        <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.1em] text-zinc-500">
          <span className={`h-1.5 w-1.5 rounded-full ${dotColor}`} />
          Năm {year}
        </span>
        {note && (
          <span className="text-[10px] text-zinc-400 italic">{note}</span>
        )}
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div>
          <p className="text-[10px] text-zinc-500 uppercase tracking-wider">
            Hợp đồng
          </p>
          <p className="text-base font-semibold text-zinc-900 tabular-nums">
            {formatNumber(count)}
          </p>
        </div>
        <div>
          <p className="text-[10px] text-zinc-500 uppercase tracking-wider">
            TB / HĐ
          </p>
          <p className="text-base font-semibold text-zinc-900 tabular-nums">
            {avg ? formatCurrency(avg) : '—'}
          </p>
        </div>
      </div>
    </div>
  );
}
