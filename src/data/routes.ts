export type RouteKey =
|'dashboard' |
'contracts.list' |
'contracts.detail' |
'contracts.edit' |
'contracts.create' |
'contracts.print' |
'annexes' |
'dispatch' |
'reports' |
'search' |
'admin.users' |
'admin.permissions' |
'admin.import' |
'assistant';

export const ROUTE_PATHS: Record<RouteKey, string> = {
  dashboard: '/bg',
  'contracts.list': '/bg/contracts',
  'contracts.detail': '/bg/contracts/:id',
  'contracts.edit': '/bg/contracts/:id/edit',
  'contracts.create': '/bg/contracts/new',
  'contracts.print': '/bg/contracts/certificates/print',
  annexes: '/bg/annexes',
  dispatch: '/bg/dispatches',
  reports: '/bg/reports',
  search: '/bg/search',
  'admin.users': '/admin/users',
  'admin.permissions': '/admin/permissions',
  'admin.import': '/admin/import',
  assistant: '/assistant'
};

export const WORKSPACES = [
{ id: 'background', label: 'Background', accent: 'indigo' as const },
{ id: 'karaoke', label: 'Karaoke', accent: 'amber' as const }];
