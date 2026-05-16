import React, { useState, useEffect } from 'react';
import { AppShell } from './components/app-ui/AppShell';
import { DashboardPage } from './pages/DashboardPage';
import { ContractsListPage } from './pages/ContractsListPage';
import { ContractDetailPage } from './pages/ContractDetailPage';
import { ContractEditPage } from './pages/ContractEditPage';
import { CreateContractPage } from './pages/CreateContractPage';
import { CertificatesPage } from './pages/CertificatesPage';
import { CertificatePrintPage } from './pages/CertificatePrintPage';
import { ReportsPage } from './pages/ReportsPage';
import { PlaceholderPage } from './pages/PlaceholderPage';
import { LoginPage } from './pages/LoginPage';
import { UsersPage } from './pages/UsersPage';
import { PermissionsPage } from './pages/PermissionsPage';
import { GlobalSearchPage } from './pages/GlobalSearchPage';
import { AccessDenied } from './components/app-ui/AccessDenied';
import { RouteKey, ROUTE_PATHS, WORKSPACES } from './data/routes';
import { AuthProvider, useAuth } from './lib/auth';
import { DOMAINS } from './data/authData';
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
function AppContent() {
  const { currentUser, hasPermission, hasDomain } = useAuth();
  // Restore route from sessionStorage to preserve state on F5
  const [route, setRoute] = useState<RouteKey>(() => {
    const saved = sessionStorage.getItem('app_route');
    return (saved as RouteKey) || 'dashboard';
  });
  const [activeContractId, setActiveContractId] = useState<number | null>(() => {
    const saved = sessionStorage.getItem('app_active_contract_id');
    return saved ? Number(saved) : null;
  });
  const [pendingPrintContractId, setPendingPrintContractId] = useState<number | null>(() => {
    const saved = sessionStorage.getItem('app_pending_print_contract_id');
    return saved ? Number(saved) : null;
  });

  // Persist route changes to sessionStorage
  useEffect(() => {
    sessionStorage.setItem('app_route', route);
  }, [route]);

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

  const [latestContractForCreate, setLatestContractForCreate] = useState<import('./data/contractRecords').ContractRecord | undefined>(undefined);
  // Default workspace to first allowed domain
  const allowedWorkspaces = DOMAINS.filter(
    (d) => !d.adminOnly && hasDomain(d.id)
  );
  const [workspace, setWorkspace] = useState(
    allowedWorkspaces[0]?.id || WORKSPACES[0].id
  );
  if (!currentUser) {
    return <LoginPage />;
  }
  const renderPage = () => {
    // Permission checks
    if (route === 'contracts.list' && !hasPermission('contracts.view'))
    return (
      <AccessDenied
        requiredPermission="contracts.view"
        onBack={() => setRoute('dashboard')} />);


    if (route === 'contracts.detail' && !hasPermission('contracts.view'))
    return (
      <AccessDenied
        requiredPermission="contracts.view"
        onBack={() => setRoute('dashboard')} />);

    if (route === 'contracts.edit' && !hasPermission('contracts.view'))
    return (
      <AccessDenied
        requiredPermission="contracts.view"
        onBack={() => setRoute('contracts.list')} />);


    if (route === 'contracts.gcn' && !hasPermission('certificates.view'))
    return (
      <AccessDenied
        requiredPermission="certificates.view"
        onBack={() => setRoute('dashboard')} />);


    if ((route === 'reports' || route === 'reports.me') && !hasPermission('reports.view'))
    return (
      <AccessDenied
        requiredPermission="reports.view"
        onBack={() => setRoute('dashboard')} />);


    if (route === 'search' && !hasPermission('search.view'))
    return (
      <AccessDenied
        requiredPermission="search.view"
        onBack={() => setRoute('dashboard')} />);


    if (route === 'admin.users' && !hasPermission('admin.users.view'))
    return (
      <AccessDenied
        requiredPermission="admin.users.view"
        onBack={() => setRoute('dashboard')} />);


    if (route === 'admin.permissions' && !hasPermission('admin.roles.view'))
    return (
      <AccessDenied
        requiredPermission="admin.roles.view"
        onBack={() => setRoute('dashboard')} />);


    if (route === 'assistant' && !hasPermission('ai.view'))
    return (
      <AccessDenied
        requiredPermission="ai.view"
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
    if (route === 'contracts.gcn') {
      return <CertificatesPage onNavigate={setRoute} />;
    }
    if (route === 'contracts.print') {
      return <CertificatePrintPage onNavigate={setRoute} initialContractId={pendingPrintContractId} onPrinted={() => setPendingPrintContractId(null)} />;
    }
    if (route === 'reports') {
      return <ReportsPage onNavigate={setRoute} />;
    }
    if (route === 'reports.me') {
      return <ReportsPage onNavigate={setRoute} personalMode />;
    }
    if (route === 'admin.users') {
      return <UsersPage />;
    }
    if (route === 'admin.permissions') {
      return <PermissionsPage />;
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
    <AppShell
      current={route}
      onNavigate={setRoute}
      workspace={workspace}
      onWorkspaceChange={setWorkspace}
      userEmail={currentUser.email}>
      
      {renderPage()}
    </AppShell>);

}
export function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>);

}
