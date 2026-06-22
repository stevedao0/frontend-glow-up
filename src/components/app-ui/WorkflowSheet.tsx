import React, { useEffect, lazy, Suspense } from 'react';
import {
  XIcon,
  FilePlusIcon,
  AwardIcon,
  MailIcon,
  Maximize2Icon,
} from 'lucide-react';
import { Loader2Icon } from 'lucide-react';
import { RouteKey } from '../../data/routes';

// Lazy-load the target page components. Same lazy modules are shared with
// App.tsx via dynamic import paths, so the browser caches them and the
// second visit is instant.
const CreateContractPage = lazy(() => import('../../pages/CreateContractPage').then(m => ({ default: m.CreateContractPage })));
const CertificatePrintPage = lazy(() => import('../../pages/CertificatePrintPage').then(m => ({ default: m.CertificatePrintPage })));
const DispatchesPage = lazy(() => import('../../pages/DispatchesPage').then(m => ({ default: m.DispatchesPage })));

function WorkflowBodyLoader() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[40vh] gap-3">
      <Loader2Icon className="h-6 w-6 animate-spin text-indigo-500" />
      <span className="text-zinc-400 text-sm">Đang mở không gian làm việc...</span>
    </div>
  );
}

export type WorkflowKind = 'create-contract' | 'print-gcn' | 'dispatches' | null;

/**
 * Workflows that contain data-entry forms. These MUST NOT close silently
 * via backdrop/Esc — accidental close loses unsaved input. Close X must
 * always ask for confirmation.
 *
 * "Mở trang đầy đủ" remains a direct action (it navigates to the real page
 * where the user continues), so it never asks for confirmation.
 */
const PROTECTED_KINDS: ReadonlyArray<Exclude<WorkflowKind, null>> = [
  'create-contract',
  'print-gcn',
  'dispatches',
];

function isProtectedKind(kind: WorkflowKind): kind is Exclude<WorkflowKind, null> {
  return !!kind && (PROTECTED_KINDS as readonly string[]).includes(kind);
}

const KIND_META: Record<
  Exclude<WorkflowKind, null>,
  { icon: React.ReactNode; tone: string }
> = {
  'create-contract': {
    icon: <FilePlusIcon className="h-4 w-4" />,
    tone: 'create',
  },
  'print-gcn': {
    icon: <AwardIcon className="h-4 w-4" />,
    tone: 'print',
  },
  'dispatches': {
    icon: <MailIcon className="h-4 w-4" />,
    tone: 'dispatch',
  },
};

/**
 * WorkflowSheet — large floating task workspace.
 *
 * Renders business content inside a centered, app-surface modal. The
 * underlying route is set by App.tsx so business logic that reads the
 * route continues to work; the page is mounted in the normal slot AND
 * inside this sheet via the same JSX, but the sheet covers the viewport
 * so only the sheet is visible.
 *
 * Behavior:
 *  - Esc closes (unless CommandPalette is open — handled by listening
 *    for keydown and checking for palettedialog).
 *  - Backdrop click closes (clicking outside the sheet on the dimmed
 *    overlay).
 *  - Close X button closes.
 *  - Optional "Mở trang đầy đủ" button lets user dismiss sheet and
 *    navigate normally to the page (handled by App.tsx via the same
 *    onClose path).
 *
 * Accessibility:
 *  - role="dialog", aria-modal="true"
 *  - Close X has aria-label="Đóng không gian làm việc"
 */
export function WorkflowSheet({
  workflow,
  onClose,
  onOpenFullPage,
  title,
  subtitle,
  routePath,
}: {
  workflow: WorkflowKind;
  onClose: () => void;
  onOpenFullPage?: () => void;
  title: string;
  subtitle?: string;
  routePath?: string;
}) {
  // Centralized close policy. Used by backdrop click, Esc, and close X.
  // - Protected kinds (data-entry workflows): always confirm via window.confirm.
  // - Future non-protected kinds: close immediately.
  const requestClose = React.useCallback(() => {
    if (isProtectedKind(workflow)) {
      const ok = window.confirm(
        'Đóng không gian làm việc?\n\nDữ liệu đang nhập có thể chưa được lưu. Bạn chắc chắn muốn đóng?'
      );
      if (!ok) return;
    }
    onClose();
  }, [workflow, onClose]);

  // Esc closes the sheet (unless CommandPalette is open). For protected
  // kinds (data-entry workflows), we IGNORE Esc silently — the user must
  // press X and confirm, or use "Mở trang đầy đủ". This prevents accidental
  // data loss from a stray keypress.
  useEffect(() => {
    if (!workflow) return;
    if (isProtectedKind(workflow)) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      // Don't steal Esc from CommandPalette if it's currently open.
      const paletteOpen = Array.from(document.querySelectorAll('[role="dialog"]')).some(
        (el) => {
          const label = el.getAttribute('aria-label') || '';
          return /command|palette/i.test(label) && el !== document.activeElement?.closest('[role="dialog"]');
        }
      );
      if (paletteOpen) return;
      e.preventDefault();
      e.stopPropagation();
      onClose();
    };
    // capture: true so we fire before CommandDrawer's own Esc handler
    window.addEventListener('keydown', onKey, { capture: true });
    return () => window.removeEventListener('keydown', onKey, { capture: true });
  }, [workflow, onClose]);

  if (!workflow) return null;

  const meta = KIND_META[workflow];
  // Per-kind safe content min-width. Prevents the embedded page from being
  // squeezed into an unreadable layout when the viewport is narrow. On
  // narrow viewports, the workspace frame shows a horizontal scrollbar
  // instead of compressing the page.
  const minContentWidth =
    workflow === 'print-gcn' ? 1280 :
    workflow === 'create-contract' ? 1180 :
    workflow === 'dispatches' ? 1180 :
    1024;

  return (
    <div
      className="vc-workflow-root"
      role="dialog"
      aria-modal="true"
      aria-label="Không gian làm việc"
    >
      {/* Backdrop — dims + blurs content below. For protected kinds
          (data-entry workflows), clicking the backdrop is a NO-OP: this
          prevents accidental form loss when the user clicks outside the
          sheet. To close, the user must press the X button (and confirm)
          or use "Mở trang đầy đủ". */}
      <div
        className="vc-workflow-backdrop"
        onClick={isProtectedKind(workflow) ? undefined : onClose}
        aria-hidden
      />

      {/* Sheet — Workspace Frame (V3 browser-like chrome). Acts as a
          controlled browser/app frame: dark graphite outer shell, traffic-
          light style window controls on top-left, workflow identity in the
          middle, viewport chrome around the embedded page. The page
          itself lives in an inset inner viewport with a subtle border so
          the visual hierarchy (chrome vs page) is obvious. */}
      <div
        className={`vc-workflow-sheet vc-workflow-sheet--${meta.tone} vc-workspace-frame`}
        style={{ ['--workflow-min-width' as any]: `${minContentWidth}px` }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Window chrome bar — traffic-light dots + workspace identity */}
        <header className="vc-workspace-chrome">
          <div className="vc-workspace-chrome__left" aria-hidden>
            <span className="vc-workspace-dot vc-workspace-dot--red" />
            <span className="vc-workspace-dot vc-workspace-dot--yellow" />
            <span className="vc-workspace-dot vc-workspace-dot--green" />
          </div>

          <div className="vc-workspace-chrome__center">
            <div className="vc-workspace-chrome__icon">{meta.icon}</div>
            <div className="vc-workspace-chrome__text">
              <div className="vc-workspace-chrome__title-row">
                <h2 className="vc-workspace-chrome__title">{title}</h2>
                <span className="vc-workspace-chrome__chip" title="Không gian làm việc">
                  Workspace
                </span>
              </div>
              {routePath && (
                <p className="vc-workspace-chrome__path" title="Đường dẫn">
                  <code>{routePath}</code>
                </p>
              )}
            </div>
          </div>

          <div className="vc-workspace-chrome__right">
            {routePath && (
              <a
                className="vc-workspace-chrome__fullpage"
                href={routePath}
                onClick={(e) => {
                  e.preventDefault();
                  // "Mở trang đầy đủ": close the sheet AND navigate to the
                  // real route. Caller provides the navigation logic so the
                  // sheet doesn't need to know the route table.
                  // No confirmation needed: the user explicitly chose to
                  // continue the workflow on the full page.
                  if (onOpenFullPage) {
                    onOpenFullPage();
                  } else {
                    onClose();
                  }
                }}
                title="Đóng sheet và xem trang đầy đủ"
              >
                <Maximize2Icon className="h-3.5 w-3.5" aria-hidden />
                <span>Mở trang đầy đủ</span>
              </a>
            )}
            <button
              type="button"
              onClick={requestClose}
              className="vc-workspace-chrome__close"
              aria-label="Đóng không gian làm việc"
              title="Đóng (sẽ hỏi xác nhận)"
            >
              <XIcon className="h-4 w-4" aria-hidden />
            </button>
          </div>
        </header>

        {/* Sub-header row — optional workflow subtitle */}
        {subtitle && (
          <div className="vc-workspace-subbar">
            <p className="vc-workspace-subbar__text">{subtitle}</p>
            <p className="vc-workspace-subbar__hint">Không gian làm việc được kiểm soát — bảo vệ dữ liệu đang nhập.</p>
          </div>
        )}

        {/* Inner viewport — controlled browser-like content area where
            the page actually renders. Distinct from the outer chrome so
            the user can immediately see the workspace protects the page. */}
        <div className="vc-workspace-viewport">
          <div className="vc-workspace-body">
            <div className="vc-workspace-frame-inner">
              <Suspense fallback={<WorkflowBodyLoader />}>
                {renderWorkflowBody(workflow, onOpenFullPage, true)}
              </Suspense>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Renders the target page for a given workflow kind. The `onOpenFullPage`
 * callback (provided by the parent) handles closing the sheet and
 * navigating to the real route. We pass it to the page as `onNavigate` so
 * any in-page navigation (e.g. "Back" / "Cancel") also takes the user
 * out of the sheet and onto the real page — matching the user's
 * expectation that the sheet is a temporary overlay.
 *
 * `embedded=true` tells the page it's mounted inside the Workspace Frame,
 * so it can suppress its own outer page chrome (PageHeader + max-width)
 * since the workspace frame already provides them. Form data, business
 * logic, validation, and save/payload behavior are NOT touched.
 */
function renderWorkflowBody(
  workflow: Exclude<WorkflowKind, null>,
  onOpenFullPage: () => void,
  embedded: boolean = false,
): React.ReactNode {
  switch (workflow) {
    case 'create-contract':
      return (
        <CreateContractPage
          onNavigate={onOpenFullPage}
          onOpenCreatedContract={onOpenFullPage}
          embedded={embedded}
        />
      );
    case 'print-gcn':
      return (
        <CertificatePrintPage
          onNavigate={onOpenFullPage}
          onPrinted={onOpenFullPage}
          embedded={embedded}
        />
      );
    case 'dispatches':
      return (
        <DispatchesPage
          onNavigate={onOpenFullPage}
          embedded={embedded}
        />
      );
    default:
      return null;
  }
}
