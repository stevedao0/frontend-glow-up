import React, { useState, useEffect, useCallback, lazy, Suspense } from 'react';
import { createPortal } from 'react-dom';
import { AdaptiveWorkspaceShell } from './components/app-ui/AdaptiveWorkspaceShell';
import { AccessDenied } from './components/app-ui/AccessDenied';
import { RouteKey, ROUTE_PATHS, WORKSPACES } from './data/routes';
import { AuthProvider, useAuth } from './lib/auth';
import { isDemoMode } from './lib/demoMode';
import { DOMAINS } from './data/authData';
import { Loader2Icon } from 'lucide-react';
import { WorkflowSheet } from './components/app-ui/WorkflowSheet';
import type { WorkflowKind } from './components/app-ui/WorkflowSheet';

// Lazy-load ALL page components so a crash in one page cannot kill the app shell
const DashboardPage = lazy(() => import('./pages/DashboardPage').then(m => ({ default: m.DashboardPage })));
const ContractsListPage = lazy(() => import('./pages/ContractsListPage').then(m => ({ default: m.ContractsListPage })));
const ContractDetailPage = lazy(() => import('./pages/ContractDetailPage').then(m => ({ default: m.ContractDetailPage })));
const ContractEditPage = lazy(() => import('./pages/ContractEditPage').then(m => ({ default: m.ContractEditPage })));
const CreateContractPage = lazy(() => import('./pages/CreateContractPage').then(m => ({ default: m.CreateContractPage })));
const CertificatePrintPage = lazy(() => import('./pages/CertificatePrintPage').then(m => ({ default: m.CertificatePrintPage })));
const ReportsPage = lazy(() => import('./pages/ReportsPage').then(m => ({ default: m.ReportsPage })));
const UsersPage = lazy(() => import('./pages/UsersPage').then(m => ({ default: m.UsersPage })));
const PermissionsPage = lazy(() => import('./pages/PermissionsPage').then(m => ({ default: m.PermissionsPage })));
const GlobalSearchPage = lazy(() => import('./pages/GlobalSearchPage').then(m => ({ default: m.GlobalSearchPage })));
const ImportContractsPage = lazy(() => import('./pages/ImportContractsPage').then(m => ({ default: m.ImportContractsPage })));
const DispatchesPage = lazy(() => import('./pages/DispatchesPage').then(m => ({ default: m.DispatchesPage })));
const PlaceholderPage = lazy(() => import('./pages/PlaceholderPage').then(m => ({ default: m.PlaceholderPage })));
const LoginPage = lazy(() => import('./pages/LoginPage').then(m => ({ default: m.LoginPage })));

// ErrorBoundary: isolates a page crash so the AppShell + sidebar remain usable
class PageErrorBoundary extends React.Component<
  { routeKey: RouteKey; children: React.ReactNode },
  { hasError: boolean; error: string }
> {
  constructor(props: { routeKey: RouteKey; children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: '' };
  }
  static getDerivedStateFromError(e: Error) {
    return { hasError: true, error: e.message };
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 p-8">
          <div className="rounded-2xl border border-rose-200 bg-rose-50 p-6 max-w-lg text-center">
            <div className="text-rose-600 font-semibold text-lg mb-2">
              Lỗi khi tải trang
            </div>
            <div className="text-rose-500 text-sm mb-1">
              Trang <code className="bg-rose-100 px-1 rounded">{this.props.routeKey}</code> gặp lỗi.
            </div>
            <div className="text-zinc-400 text-xs font-mono mt-2 truncate" title={this.state.error}>
              {this.state.error}
            </div>
          </div>
          <button
            className="px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm hover:bg-indigo-700 transition-colors"
            onClick={() => window.location.reload()}
          >
            Tải lại trang
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

// Loading fallback for Suspense
function PageLoader() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
      <Loader2Icon className="h-8 w-8 animate-spin text-indigo-500" />
      <span className="text-zinc-400 text-sm">Đang tải trang...</span>
    </div>
  );
}
const PLACEHOLDER_META: Partial<
  Record<
    RouteKey,
    {
      title: string;
      description: string;
    }>> =

{
  annexes: {
    title: 'Phụ lục hợp đồng',
    description: 'Quản lý phụ lục đính kèm hợp đồng.'
  },
  dispatch: {
    title: 'Công văn',
    description: 'Theo dõi công văn gửi đi và nhận về.'
  },
  search: {
    title: 'Tìm kiếm toàn cục',
    description: 'Truy vấn nhanh trên hợp đồng, GCN, phụ lục, công văn.'
  },
  assistant: {
    title: 'AI Assistant',
    description: 'Trợ lý AI cho nghiệp vụ hợp đồng.'
  }
};
const ROUTE_TITLES: Record<RouteKey, string> = {
  dashboard: 'Trung tâm điều hành',
  'contracts.list': 'Danh sách hợp đồng',
  'contracts.detail': 'Chi tiết hợp đồng',
  'contracts.edit': 'Chỉnh sửa hợp đồng',
  'contracts.create': 'Tạo hợp đồng',
  'contracts.print': 'In giấy chứng nhận',
  annexes: 'Phụ lục hợp đồng',
  dispatch: 'Công văn',
  reports: 'Báo cáo',
  search: 'Tìm kiếm',
  'admin.users': 'Quản trị người dùng',
  'admin.permissions': 'Phân quyền',
  'admin.import': 'Nhập dữ liệu',
  assistant: 'AI Assistant',
};

function routeFromPath(pathname: string): RouteKey | null {
  // Exact match first
  for (const [key, path] of Object.entries(ROUTE_PATHS) as [RouteKey, string][]) {
    if (path === pathname) return key;
  }
  // Pattern match for parameterised routes (e.g. /bg/contracts/:id)
  for (const [key, path] of Object.entries(ROUTE_PATHS) as [RouteKey, string][]) {
    if (!path.includes(':')) continue;
    const regex = new RegExp('^' + path.replace(/:[^/]+/g, '[^/]+') + '$');
    if (regex.test(pathname)) return key;
  }
  // Prefix fallback (e.g. /bg/contracts/123 → contracts.detail family)
  if (pathname.startsWith('/bg/contracts/certificates')) return 'contracts.print';
  if (pathname.startsWith('/bg/contracts')) return 'contracts.list';
  if (pathname.startsWith('/admin/users')) return 'admin.users';
  return null;
}

function AppContent() {
  const { currentUser, hasPermission, hasDomain } = useAuth();
  // Initial route — URL wins over sessionStorage so demo links and reloads land where expected.
  const [route, setRoute] = useState<RouteKey>(() => {
    if (typeof window !== 'undefined') {
      const fromUrl = routeFromPath(window.location.pathname);
      if (fromUrl) return fromUrl;
    }
    const saved = sessionStorage.getItem('app_route');
    return (saved as RouteKey) || 'dashboard';
  });
  const [demoRouted, setDemoRouted] = useState(false);
  const [activeContractId, setActiveContractId] = useState<number | null>(() => {
    const saved = sessionStorage.getItem('app_active_contract_id');
    return saved ? Number(saved) : null;
  });
  const [pendingPrintContractId, setPendingPrintContractId] = useState<number | null>(() => {
    const saved = sessionStorage.getItem('app_pending_print_contract_id');
    return saved ? Number(saved) : null;
  });
  const [pendingPrintCertificateId, setPendingPrintCertificateId] = useState<number | null>(() => {
    const saved = sessionStorage.getItem('app_pending_print_certificate_id');
    return saved ? Number(saved) : null;
  });

  // Persist route + sync URL + document.title so pages feel deep-linkable
  useEffect(() => {
    sessionStorage.setItem('app_route', route);
    const title = ROUTE_TITLES[route] || 'VCPMC Command OS';
    document.title = `${title} · VCPMC Command OS`;
    try {
      const path = ROUTE_PATHS[route] || '/';
      const search = window.location.search; // preserve ?demo=1 etc.
      const next = `${path}${search}`;
      if (window.location.pathname + window.location.search !== next) {
        window.history.pushState({ route }, '', next);
      }
    } catch {
      /* ignore */
    }
  }, [route]);

  // Browser back/forward → sync state to URL
  useEffect(() => {
    const onPop = () => {
      const fromUrl = routeFromPath(window.location.pathname);
      if (fromUrl) setRoute(fromUrl);
    };
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);

  useEffect(() => {
    // Only force dashboard on demo if the URL did NOT specify a route
    if (!currentUser || demoRouted || !isDemoMode()) return;
    const fromUrl = typeof window !== 'undefined' ? routeFromPath(window.location.pathname) : null;
    if (!fromUrl) setRoute('dashboard');
    setDemoRouted(true);
  }, [currentUser, demoRouted]);

  // Persist active contract ID
  useEffect(() => {
    if (activeContractId) {
      sessionStorage.setItem('app_active_contract_id', String(activeContractId));
    } else {
      sessionStorage.removeItem('app_active_contract_id');
    }
  }, [activeContractId]);

  // Persist pending print contract ID
  useEffect(() => {
    if (pendingPrintContractId) {
      sessionStorage.setItem('app_pending_print_contract_id', String(pendingPrintContractId));
    } else {
      sessionStorage.removeItem('app_pending_print_contract_id');
    }
  }, [pendingPrintContractId]);

  // Persist pending print certificate ID
  useEffect(() => {
    if (pendingPrintCertificateId) {
      sessionStorage.setItem('app_pending_print_certificate_id', String(pendingPrintCertificateId));
    } else {
      sessionStorage.removeItem('app_pending_print_certificate_id');
    }
  }, [pendingPrintCertificateId]);

  const [latestContractForCreate, setLatestContractForCreate] = useState<import('./data/contractRecords').ContractRecord | undefined>(undefined);

  // WorkflowSheet state: when set, a floating task workspace overlays the
  // current page. The normal route is NEVER changed by opening/closing a
  // sheet — only the "Mở trang đầy đủ" button navigates.
  const [workflow, setWorkflow] = useState<WorkflowKind>(null);
  const openWorkflow = useCallback((kind: Exclude<WorkflowKind, null>) => {
    setWorkflow(kind);
  }, []);
  const closeWorkflow = useCallback(() => {
    setWorkflow(null);
  }, []);
  const navigateToWorkflowRoute = useCallback((kind: Exclude<WorkflowKind, null>) => {
    const routeForKind: Record<Exclude<WorkflowKind, null>, RouteKey> = {
      'create-contract': 'contracts.create',
      'print-gcn': 'contracts.print',
      'dispatches': 'dispatch',
    };
    setWorkflow(null);
    setRoute(routeForKind[kind]);
  }, []);
  // Default workspace to first allowed domain
  const allowedWorkspaces = DOMAINS.filter(
    (d) => !d.adminOnly && hasDomain(d.id)
  );
  const [workspace, setWorkspace] = useState(
    allowedWorkspaces[0]?.id || WORKSPACES[0].id
  );
  if (!currentUser) {
    return (
      <Suspense fallback={<PageLoader />}>
        <LoginPage />
      </Suspense>
    );
  }
  const renderPage = () => {
    // Permission checks
    if (route === 'contracts.list' && !hasPermission('contracts.read'))
    return (
      <AccessDenied
        requiredPermission="contracts.read"
        onBack={() => setRoute('dashboard')} />);


    if (route === 'contracts.detail' && !hasPermission('contracts.read'))
    return (
      <AccessDenied
        requiredPermission="contracts.read"
        onBack={() => setRoute('dashboard')} />);

    if (route === 'contracts.edit' && !hasPermission('contracts.update'))
    return (
      <AccessDenied
        requiredPermission="contracts.update"
        onBack={() => setRoute('contracts.list')} />);


    if (route === 'reports' && !hasPermission('reports.view'))
    return (
      <AccessDenied
        requiredPermission="reports.view"
        onBack={() => setRoute('dashboard')} />);


    if (route === 'search' && !hasPermission('works.read'))
    return (
      <AccessDenied
        requiredPermission="works.read"
        onBack={() => setRoute('dashboard')} />);


    if (route === 'admin.users' && !hasPermission('admin.users.manage'))
    return (
      <AccessDenied
        requiredPermission="admin.users.manage"
        onBack={() => setRoute('dashboard')} />);


    if (route === 'admin.permissions' && !hasPermission('admin.users.manage'))
    return (
      <AccessDenied
        requiredPermission="admin.users.manage"
        onBack={() => setRoute('dashboard')} />);


    if (route === 'assistant' && !hasPermission('portal.access'))
    return (
      <AccessDenied
        requiredPermission="portal.access"
        onBack={() => setRoute('dashboard')} />);

    if (route === 'admin.import' && !['admin', 'mod'].includes(currentUser.backendRole))
    return (
      <AccessDenied
        requiredPermission="admin.users.manage"
        onBack={() => setRoute('dashboard')} />);


    if (route === 'dashboard') {
      return (
        <DashboardPage userEmail={currentUser.email} onNavigate={setRoute} />);

    }
    if (route === 'contracts.list') {
      return (
        <ContractsListPage
          onNavigate={setRoute}
          onOpenDetail={(id) => {
            setActiveContractId(id);
            setRoute('contracts.detail');
          }}
          onPrintCertificate={(contractId) => {
            setPendingPrintContractId(contractId);
            setRoute('contracts.print');
          }}
          onCreateNew={(latest) => setLatestContractForCreate(latest)}
          onOpenCreateContract={() => openWorkflow('create-contract')}
        />
      );
    }
    if (route === 'contracts.detail') {
      return (
        <ContractDetailPage
          contractId={activeContractId}
          onBack={() => setRoute('contracts.list')}
          onEdit={(id) => {
            setActiveContractId(id);
            setRoute('contracts.edit');
          }}
          onNavigate={setRoute}
          onCreateGcn={(contractId) => {
            setPendingPrintContractId(contractId);
            setRoute('contracts.print');
          }}
        />
      );
    }
    if (route === 'contracts.edit') {
      return (
        <ContractEditPage
          contractId={activeContractId}
          onBack={() => {
            setActiveContractId(null);
            setRoute('contracts.list');
          }}
          onSaved={(id) => {
            setActiveContractId(id);
            setRoute('contracts.detail');
          }}
        />
      );
    }
    if (route === 'contracts.create') {
      return (
        <CreateContractPage
          onNavigate={setRoute}
          onOpenCreatedContract={(id) => {
            setActiveContractId(id);
            setRoute('contracts.detail');
          }}
          initialDraftFromContract={latestContractForCreate}
        />
      );
    }
    if (route === 'contracts.print') {
      return <CertificatePrintPage onNavigate={setRoute} initialContractId={pendingPrintContractId} initialCertificateId={pendingPrintCertificateId} onPrinted={() => { setPendingPrintContractId(null); setPendingPrintCertificateId(null); }} />;
    }
    if (route === 'reports') {
      return <ReportsPage onNavigate={setRoute} />;
    }
    if (route === 'admin.users') {
      return <UsersPage />;
    }
    if (route === 'admin.permissions') {
      return <PermissionsPage />;
    }
    if (route === 'admin.import') {
      return <ImportContractsPage onNavigate={setRoute} />;
    }
    if (route === 'search') {
      return (
        <GlobalSearchPage
          onNavigate={setRoute}
          onOpenDetail={(id) => {
            setActiveContractId(id);
            setRoute('contracts.detail');
          }}
        />
      );
    }
    if (route === 'dispatch') {
      return <DispatchesPage onNavigate={setRoute} />;
    }
    const meta = PLACEHOLDER_META[route];
    if (!meta) return null;
    return (
      <PlaceholderPage
        title={meta.title}
        description={meta.description}
        routePath={ROUTE_PATHS[route]}
        onBack={setRoute} />);


  };
  return (
    <>
      <AdaptiveWorkspaceShell
        current={route}
        onNavigate={setRoute}
        workspace={workspace}
        onWorkspaceChange={setWorkspace}
        userEmail={currentUser.email}
        workflow={workflow}
        onOpenWorkflow={openWorkflow}
        onCloseWorkflow={closeWorkflow}>
        {/* Normal page slot — renders inside WorkspaceCanvas */}
        <PageErrorBoundary routeKey={route}>
          <Suspense fallback={<PageLoader />}>
            {renderPage()}
          </Suspense>
        </PageErrorBoundary>
      </AdaptiveWorkspaceShell>
      {/* WorkflowSheet is portaled to <body> so it overlays the entire shell.
          WorkflowSheet is NOT inside AdaptiveWorkspaceShell to avoid z-index
          conflicts and ensure it floats above everything. */}
      {workflow && createPortal(
        <WorkflowSheet
          workflow={workflow}
          onClose={closeWorkflow}
          onOpenFullPage={() => navigateToWorkflowRoute(workflow)}
          title={workflowTitle(workflow)}
          subtitle={workflowSubtitle(workflow)}
          routePath={workflowRoutePath(workflow)}
        />,
        document.body
      )}
      {isDemoMode() && (
        <div
          className="fixed bottom-3 right-3 z-[120] flex items-center gap-1.5 rounded-full border border-indigo-400/40 bg-zinc-900/90 px-3 py-1.5 text-[11px] font-semibold tracking-wide text-indigo-200 shadow-lg backdrop-blur"
          title="Đang chạy ở chế độ Demo (dữ liệu mô phỏng)"
        >
          <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
          PREVIEW · DEMO MODE
        </div>
      )}
    </>
  );
}

function workflowTitle(kind: WorkflowKind): string {
  switch (kind) {
    case 'create-contract': return 'Tạo hợp đồng';
    case 'print-gcn': return 'In GCN';
    case 'dispatches': return 'Công văn';
    default: return 'Workflow';
  }
}

function workflowSubtitle(kind: WorkflowKind): string {
  switch (kind) {
    case 'create-contract': return 'Tạo mới hợp đồng bản quyền tác giả âm nhạc';
    case 'print-gcn': return 'In giấy chứng nhận theo hợp đồng đã chọn';
    case 'dispatches': return 'Theo dõi và quản lý công văn gửi đi/nhận về';
    default: return '';
  }
}

function workflowRoutePath(kind: WorkflowKind): string {
  switch (kind) {
    case 'create-contract': return '/bg/contracts/new';
    case 'print-gcn': return '/bg/contracts/certificates/print';
    case 'dispatches': return '/bg/dispatches';
    default: return '';
  }
}
export function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>);

}
