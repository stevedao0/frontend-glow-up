import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  PlusIcon,
  DownloadIcon,
  RefreshCwIcon,
  SearchIcon,
  ShieldIcon,
  LockIcon,
  UnlockIcon,
  Edit2Icon,
  KeyIcon,
  Trash2Icon,
  EyeIcon,
  LoaderIcon,
  AlertTriangleIcon,
  CheckCircleIcon,
} from "lucide-react";
import { Page, PageHeader } from "../components/app-ui/Page";
import { ContentCard } from "../components/app-ui/ContentCard";
import { Button } from "../components/app-ui/Button";
import { Input } from "../components/app-ui/Input";
import { Select } from "../components/app-ui/Select";
import { StatusBadge } from "../components/app-ui/StatusBadge";
import { RowActionsMenu } from "../components/app-ui/RowActionsMenu";
import { Modal } from "../components/app-ui/Modal";
import { Checkbox } from "../components/app-ui/Checkbox";
import { ROLE_DEFS, DOMAINS } from "../data/authData";
import {
  listUsers,
  createUser,
  updateUser,
  deleteUser,
  lockUser,
  unlockUser,
  changeUserPassword,
  getAuditLogs,
  UserListItem,
  AuditLogEntry,
} from "../lib/usersClient";

function mapRoleLabel(role: string): string {
  const r = (role || "").toLowerCase();
  if (r === "admin") return ROLE_DEFS.super_admin.name;
  if (r === "mod") return ROLE_DEFS.manager.name;
  return ROLE_DEFS.staff.name;
}

function mapRoleKey(role: string): string {
  const r = (role || "").toLowerCase();
  if (r === "admin") return "super_admin";
  if (r === "mod") return "manager";
  return "staff";
}

function mapRoleValue(roleKey: string): string {
  if (roleKey === "super_admin") return "admin";
  if (roleKey === "manager") return "mod";
  return "user";
}

function formatDate(iso: string | null): string {
  if (!iso) return "—";
  try {
    const d = new Date(iso);
    return d.toLocaleString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

type Toast = {
  id: number;
  type: "success" | "error" | "info";
  message: string;
};

export function UsersPage() {
  const [users, setUsers] = useState<UserListItem[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [loadingAudit, setLoadingAudit] = useState(false);
  const [userError, setUserError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  // Modal states
  const [showUserModal, setShowUserModal] = useState(false);
  const [editingUser, setEditingUser] = useState<UserListItem | null>(null);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordTargetUser, setPasswordTargetUser] = useState<UserListItem | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteTargetUser, setDeleteTargetUser] = useState<UserListItem | null>(null);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [profileUser, setProfileUser] = useState<UserListItem | null>(null);

  // Action loading states
  const [actionLoadingId, setActionLoadingId] = useState<number | null>(null);

  // Toast notifications
  const [toasts, setToasts] = useState<Toast[]>([]);
  const toastCounter = useRef(0);

  const showToast = useCallback((type: Toast["type"], message: string) => {
    const id = ++toastCounter.current;
    setToasts((prev) => [...prev, { id, type, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  const fetchUsers = useCallback(async () => {
    setLoadingUsers(true);
    setUserError(null);
    try {
      const data = await listUsers();
      setUsers(data);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Tải danh sách người dùng thất bại";
      setUserError(msg);
      showToast("error", msg);
    } finally {
      setLoadingUsers(false);
    }
  }, [showToast]);

  const fetchAuditLogs = useCallback(async () => {
    setLoadingAudit(true);
    try {
      const logs = await getAuditLogs(20);
      setAuditLogs(logs);
    } catch {
      // Non-critical — show mock data on failure
      setAuditLogs([]);
    } finally {
      setLoadingAudit(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
    fetchAuditLogs();
  }, [fetchUsers, fetchAuditLogs]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchUsers();
    await fetchAuditLogs();
    setRefreshing(false);
    showToast("success", "Đã làm mới danh sách");
  };

  const handleExport = () => {
    const rows = [
      ["ID", "Username", "Họ tên", "Email", "Role", "Trạng thái", "Đăng nhập cuối", "Ngày tạo"],
      ...filteredUsers.map((u) => [
        u.id,
        u.username,
        u.display_name,
        u.email || "",
        mapRoleLabel(u.role),
        u.is_active ? "Hoạt động" : "Tạm khóa",
        formatDate(u.last_seen_at),
        formatDate(u.created_at),
      ]),
    ];
    const csv = rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `users_export_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    showToast("success", "Đã xuất danh sách người dùng");
  };

  const handleLockToggle = async (user: UserListItem) => {
    setActionLoadingId(user.id);
    try {
      if (user.is_active) {
        await lockUser(user.id);
        showToast("success", `Đã khóa tài khoản ${user.username}`);
      } else {
        await unlockUser(user.id);
        showToast("success", `Đã mở khóa tài khoản ${user.username}`);
      }
      await fetchUsers();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Thao tác thất bại";
      showToast("error", msg);
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleDelete = async () => {
    if (!deleteTargetUser) return;
    setActionLoadingId(deleteTargetUser.id);
    try {
      await deleteUser(deleteTargetUser.id);
      showToast("success", `Đã xóa người dùng ${deleteTargetUser.username}`);
      setShowDeleteModal(false);
      setDeleteTargetUser(null);
      await fetchUsers();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Xóa thất bại";
      showToast("error", msg);
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleUserSaved = async () => {
    setShowUserModal(false);
    setEditingUser(null);
    await fetchUsers();
    await fetchAuditLogs();
  };

  const handlePasswordChanged = async () => {
    setShowPasswordModal(false);
    setPasswordTargetUser(null);
    showToast("success", "Đổi mật khẩu thành công");
  };

  const filteredUsers = users.filter((u) => {
    const q = search.toLowerCase();
    if (
      search &&
      !u.username.toLowerCase().includes(q) &&
      !u.display_name.toLowerCase().includes(q) &&
      !(u.email || "").toLowerCase().includes(q)
    )
      return false;
    if (roleFilter && mapRoleValue(roleFilter) !== u.role) return false;
    if (statusFilter === "active" && !u.is_active) return false;
    if (statusFilter === "locked" && u.is_active) return false;
    return true;
  });

  return (
    <Page>
      {/* Toast container */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`px-4 py-3 rounded-xl shadow-xl flex items-center gap-3 text-sm font-medium animate-[fadein_0.2s_ease-out] text-white min-w-[280px] ${
              t.type === "success" ? "bg-emerald-600" : t.type === "error" ? "bg-rose-600" : "bg-indigo-600"
            }`}
          >
            {t.type === "success" && <CheckCircleIcon className="h-5 w-5 shrink-0" />}
            {t.type === "error" && <AlertTriangleIcon className="h-5 w-5 shrink-0" />}
            {t.type === "info" && <CheckCircleIcon className="h-5 w-5 shrink-0" />}
            <span>{t.message}</span>
          </div>
        ))}
      </div>

      <PageHeader
        breadcrumb="/admin/users"
        title="Quản lý người dùng"
        description="Tạo tài khoản, phân quyền và quản lý phạm vi xử lý nghiệp vụ."
        actions={
          <>
            <Button
              variant="secondary"
              leftIcon={
                <RefreshCwIcon className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
              }
              onClick={handleRefresh}
              disabled={refreshing}
            >
              Làm mới
            </Button>
            <Button
              variant="secondary"
              leftIcon={<DownloadIcon className="h-4 w-4" />}
              onClick={handleExport}
            >
              Xuất danh sách
            </Button>
            <Button
              variant="primary"
              leftIcon={<PlusIcon className="h-4 w-4" />}
              onClick={() => {
                setEditingUser(null);
                setShowUserModal(true);
              }}
            >
              Thêm người dùng
            </Button>
          </>
        }
      />

      <ContentCard padded={false} accent>
        <div className="p-4 border-b border-zinc-100 flex flex-wrap gap-3 bg-zinc-50/50">
          <div className="relative w-64">
            <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
            <input
              type="text"
              placeholder="Tìm tên, email, username..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full h-9 pl-9 pr-3 text-sm rounded-lg border border-zinc-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
            />
          </div>
          <div className="w-40">
            <Select
              value={roleFilter}
              onChange={setRoleFilter}
              placeholder="Tất cả Role"
              options={Object.values(ROLE_DEFS).map((r) => ({ value: r.id, label: r.name }))}
            />
          </div>
          <div className="w-40">
            <Select
              value={statusFilter}
              onChange={setStatusFilter}
              placeholder="Tất cả trạng thái"
              options={[
                { value: "active", label: "Hoạt động" },
                { value: "locked", label: "Tạm khóa" },
              ]}
            />
          </div>
          {loadingUsers && (
            <div className="flex items-center gap-2 text-sm text-zinc-500 ml-auto">
              <LoaderIcon className="h-4 w-4 animate-spin" />
              Đang tải...
            </div>
          )}
          {!loadingUsers && (
            <div className="ml-auto flex items-center text-sm text-zinc-500">
              {filteredUsers.length} / {users.length} người dùng
            </div>
          )}
        </div>

        <div className="overflow-x-auto">
          {userError && !loadingUsers ? (
            <div className="p-8 text-center text-rose-600 flex flex-col items-center gap-3">
              <AlertTriangleIcon className="h-8 w-8" />
              <p className="font-medium">{userError}</p>
              <Button variant="secondary" onClick={fetchUsers} size="sm">
                Thử lại
              </Button>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-zinc-50/80 border-b border-zinc-200">
                  <th className="px-4 py-3 text-left text-xs font-semibold text-zinc-500 uppercase tracking-wider">
                    Người dùng
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-zinc-500 uppercase tracking-wider">
                    Role
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-zinc-500 uppercase tracking-wider">
                    Domains
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-zinc-500 uppercase tracking-wider">
                    Trạng thái
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-zinc-500 uppercase tracking-wider">
                    Đăng nhập cuối
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-zinc-500 uppercase tracking-wider">
                    Ngày tạo
                  </th>
                  <th className="w-10 pr-4"></th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.length === 0 && !loadingUsers ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-12 text-center text-zinc-400">
                      Không có người dùng nào phù hợp
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((u) => (
                    <tr
                      key={u.id}
                      className="border-b border-zinc-100 hover:bg-zinc-50/50 transition-colors"
                    >
                      <td className="px-4 py-3 align-top">
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-full bg-gradient-to-br from-indigo-100 to-violet-100 text-indigo-700 font-semibold flex items-center justify-center shrink-0">
                            {(u.display_name || u.username).charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-semibold text-zinc-900">{u.display_name || u.username}</p>
                            <p className="text-xs text-zinc-500">{u.email || u.username}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 align-top">
                        <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium bg-zinc-100 text-zinc-700 ring-1 ring-inset ring-zinc-200">
                          <ShieldIcon className="h-3 w-3 text-zinc-400" />
                          {mapRoleLabel(u.role)}
                        </span>
                      </td>
                      <td className="px-4 py-3 align-top max-w-[200px]">
                        {u.domains.includes("__all__") || u.domains.length === 0 ? (
                          <span className="text-xs font-medium text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded">
                            Tất cả
                          </span>
                        ) : (
                          <p className="text-xs text-zinc-600 line-clamp-2 leading-relaxed">
                            {u.domains.join(", ")}
                          </p>
                        )}
                      </td>
                      <td className="px-4 py-3 align-top">
                        <StatusBadge tone={u.is_active ? "success" : "danger"} dot>
                          {u.is_active ? "Hoạt động" : "Tạm khóa"}
                        </StatusBadge>
                      </td>
                      <td className="px-4 py-3 align-top text-xs text-zinc-600 tabular-nums">
                        {formatDate(u.last_seen_at)}
                      </td>
                      <td className="px-4 py-3 align-top text-xs text-zinc-600 tabular-nums">
                        {formatDate(u.created_at)}
                      </td>
                      <td className="pr-4 py-3 align-top text-right">
                        <RowActionsMenu
                          actions={[
                            {
                              label: "Xem hồ sơ",
                              icon: <EyeIcon className="h-4 w-4" />,
                              onClick: () => {
                                setProfileUser(u);
                                setShowProfileModal(true);
                              },
                            },
                            {
                              label: "Chỉnh sửa",
                              icon: <Edit2Icon className="h-4 w-4" />,
                              onClick: () => {
                                setEditingUser(u);
                                setShowUserModal(true);
                              },
                            },
                            {
                              label: "Đổi mật khẩu",
                              icon: <KeyIcon className="h-4 w-4" />,
                              onClick: () => {
                                setPasswordTargetUser(u);
                                setShowPasswordModal(true);
                              },
                            },
                            {
                              label: u.is_active ? "Khóa tài khoản" : "Mở khóa",
                              icon:
                                u.is_active ? (
                                  <LockIcon className="h-4 w-4" />
                                ) : (
                                  <UnlockIcon className="h-4 w-4" />
                                ),
                              onClick: () => handleLockToggle(u),
                              tone: u.is_active ? "danger" : "default",
                            },
                            {
                              label: "Xóa",
                              icon: <Trash2Icon className="h-4 w-4" />,
                              onClick: () => {
                                setDeleteTargetUser(u);
                                setShowDeleteModal(true);
                              },
                              tone: "danger",
                            },
                          ]}
                        />
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}
        </div>
      </ContentCard>

      {/* Audit Log Panel */}
      <div className="mt-6">
        <ContentCard
          title="Nhật ký hoạt động gần đây"
          description="Lịch sử thao tác nghiệp vụ và bảo mật hệ thống."
          padded={false}
        >
          <div className="divide-y divide-zinc-100">
            {loadingAudit ? (
              <div className="p-8 text-center text-zinc-400 flex items-center justify-center gap-2">
                <LoaderIcon className="h-4 w-4 animate-spin" />
                Đang tải nhật ký...
              </div>
            ) : auditLogs.length === 0 ? (
              <div className="p-8 text-center text-zinc-400">Chưa có nhật ký hoạt động</div>
            ) : (
              auditLogs.map((log) => (
                <div
                  key={log.id}
                  className="p-4 flex items-start gap-4 hover:bg-zinc-50/50 transition-colors"
                >
                  <div
                    className={`mt-0.5 h-8 w-8 rounded-full flex items-center justify-center shrink-0 ${
                      log.type === "security"
                        ? "bg-rose-100 text-rose-600"
                        : log.type === "permission"
                          ? "bg-amber-100 text-amber-600"
                          : log.type === "login"
                            ? "bg-emerald-100 text-emerald-600"
                            : "bg-indigo-100 text-indigo-600"
                    }`}
                  >
                    {log.type === "security" ? (
                      <ShieldIcon className="h-4 w-4" />
                    ) : log.type === "permission" ? (
                      <KeyIcon className="h-4 w-4" />
                    ) : log.type === "login" ? (
                      <UnlockIcon className="h-4 w-4" />
                    ) : (
                      <Edit2Icon className="h-4 w-4" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-zinc-900">
                      {log.action}{" "}
                      <span className="text-zinc-500 font-normal">bởi</span> {log.actor}
                    </p>
                    <p className="text-sm text-zinc-600 mt-0.5">{log.description}</p>
                    <p className="text-xs text-zinc-400 mt-1.5 tabular-nums">{log.timestamp}</p>
                  </div>
                  {log.target && (
                    <div className="hidden sm:block text-right">
                      <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-zinc-100 text-zinc-600">
                        Target: {log.target}
                      </span>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </ContentCard>
      </div>

      {/* User Create/Edit Modal */}
      {showUserModal && (
        <UserFormModal
          user={editingUser}
          onClose={() => {
            setShowUserModal(false);
            setEditingUser(null);
          }}
          onSaved={handleUserSaved}
          showToast={showToast}
        />
      )}

      {/* Password Change Modal */}
      {showPasswordModal && passwordTargetUser && (
        <PasswordModal
          user={passwordTargetUser}
          onClose={() => {
            setShowPasswordModal(false);
            setPasswordTargetUser(null);
          }}
          onChanged={handlePasswordChanged}
          showToast={showToast}
        />
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && deleteTargetUser && (
        <DeleteConfirmModal
          user={deleteTargetUser}
          onClose={() => {
            setShowDeleteModal(false);
            setDeleteTargetUser(null);
          }}
          onConfirm={handleDelete}
          isLoading={actionLoadingId === deleteTargetUser.id}
        />
      )}

      {/* Profile View Modal */}
      {showProfileModal && profileUser && (
        <ProfileModal
          user={profileUser}
          onClose={() => {
            setShowProfileModal(false);
            setProfileUser(null);
          }}
        />
      )}
    </Page>
  );
}

// ─── User Create / Edit Modal ─────────────────────────────────────────────────

function UserFormModal({
  user,
  onClose,
  onSaved,
  showToast,
}: {
  user: UserListItem | null;
  onClose: () => void;
  onSaved: () => void;
  showToast: (type: "success" | "error", msg: string) => void;
}) {
  const isEdit = user !== null;

  const [username, setUsername] = useState(isEdit ? user.username : "");
  const [displayName, setDisplayName] = useState(isEdit ? user.display_name : "");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [role, setRole] = useState(isEdit ? mapRoleKey(user.role) : "staff");
  const [selectedDomains, setSelectedDomains] = useState<string[]>(
    isEdit ? user.domains : []
  );
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = (): boolean => {
    const errs: Record<string, string> = {};
    if (!isEdit && (!password || password.length < 6)) {
      errs.password = "Mật khẩu phải có ít nhất 6 ký tự";
    }
    if (!isEdit && password !== confirmPassword) {
      errs.confirmPassword = "Mật khẩu xác nhận không khớp";
    }
    if (!displayName.trim()) {
      errs.displayName = "Họ tên không được để trống";
    }
    if (!isEdit && !username.trim()) {
      errs.username = "Username không được để trống";
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setSaving(true);
    try {
      const payload = {
        display_name: displayName.trim(),
        role: mapRoleValue(role),
        ...(password ? { password } : {}),
      };
      if (isEdit) {
        await updateUser(user.id, payload);
        showToast("success", `Đã cập nhật người dùng ${user.username}`);
      } else {
        await createUser({
          username: username.trim(),
          password,
          display_name: displayName.trim(),
          role: mapRoleValue(role),
          domain_ids: [],
        });
        showToast("success", `Đã tạo người dùng ${username}`);
      }
      onSaved();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Thao tác thất bại";
      showToast("error", msg);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      open={true}
      onClose={onClose}
      title={isEdit ? `Chỉnh sửa: ${user.username}` : "Thêm người dùng mới"}
      maxWidth="2xl"
    >
      <form onSubmit={handleSubmit}>
        <div className="p-6">
          <div className="grid grid-cols-2 gap-6 mb-6">
            <div className="space-y-4">
              <h4 className="text-sm font-semibold text-zinc-900 border-b border-zinc-100 pb-2">
                Thông tin cơ bản
              </h4>
              {!isEdit && (
                <Input
                  label="Username"
                  placeholder="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  error={errors.username}
                />
              )}
              <Input
                label="Họ và tên"
                placeholder="Nhập họ tên đầy đủ"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                required
                error={errors.displayName}
              />
              {!isEdit && (
                <Input
                  label="Mật khẩu"
                  type="password"
                  placeholder="Ít nhất 6 ký tự"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  error={errors.password}
                />
              )}
              {!isEdit && (
                <Input
                  label="Xác nhận mật khẩu"
                  type="password"
                  placeholder="Nhập lại mật khẩu"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  error={errors.confirmPassword}
                />
              )}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-zinc-700 mb-1.5">Role</label>
                  <Select
                    value={role}
                    onChange={(v) => setRole(v)}
                    options={Object.values(ROLE_DEFS).map((r) => ({
                      value: r.id,
                      label: r.name,
                    }))}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-700 mb-1.5">
                    Trạng thái
                  </label>
                  <Select
                    value={isEdit && user ? (user.is_active ? "active" : "locked") : "active"}
                    onChange={() => {}}
                    options={[
                      { value: "active", label: "Hoạt động" },
                      { value: "locked", label: "Tạm khóa" },
                    ]}
                    disabled
                  />
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="text-sm font-semibold text-zinc-900 border-b border-zinc-100 pb-2">
                Phạm vi nghiệp vụ (Domains)
              </h4>
              <p className="text-xs text-zinc-500">
                Chọn các domain mà người dùng được phép truy cập.
              </p>
              <div className="h-64 overflow-y-auto border border-zinc-200 rounded-lg p-3 space-y-2 bg-zinc-50/50">
                <Checkbox
                  checked={selectedDomains.length === 0 && !selectedDomains.includes("__all__")}
                  onChange={() => setSelectedDomains([])}
                  label={<span className="text-sm font-medium text-zinc-700">Tất cả domain</span>}
                />
                {DOMAINS.filter((d) => !d.adminOnly).map((d) => (
                  <Checkbox
                    key={d.id}
                    checked={selectedDomains.includes(d.id)}
                    onChange={(checked) => {
                      if (checked) {
                        setSelectedDomains((prev) => [...prev, d.id]);
                      } else {
                        setSelectedDomains((prev) => prev.filter((x) => x !== d.id));
                      }
                    }}
                    label={<span className="text-sm text-zinc-700">{d.label}</span>}
                  />
                ))}
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-zinc-100 flex justify-end gap-3">
            <Button variant="ghost" onClick={onClose} type="button" disabled={saving}>
              Hủy
            </Button>
            <Button variant="primary" type="submit" disabled={saving}>
              {saving ? (
                <>
                  <LoaderIcon className="h-4 w-4 animate-spin" />
                  Đang lưu...
                </>
              ) : isEdit ? (
                "Lưu thay đổi"
              ) : (
                "Tạo người dùng"
              )}
            </Button>
          </div>
        </div>
      </form>
    </Modal>
  );
}

// ─── Password Change Modal ────────────────────────────────────────────────────

function PasswordModal({
  user,
  onClose,
  onChanged,
  showToast,
}: {
  user: UserListItem;
  onClose: () => void;
  onChanged: () => void;
  showToast: (type: "success" | "error", msg: string) => void;
}) {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) {
      setError("Mật khẩu phải có ít nhất 6 ký tự");
      return;
    }
    if (password !== confirm) {
      setError("Mật khẩu xác nhận không khớp");
      return;
    }
    setSaving(true);
    try {
      await changeUserPassword(user.id, password);
      onChanged();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Đổi mật khẩu thất bại";
      showToast("error", msg);
      setSaving(false);
    }
  };

  return (
    <Modal open={true} onClose={onClose} title={`Đổi mật khẩu: ${user.username}`} maxWidth="sm">
      <form onSubmit={handleSubmit}>
        <div className="p-6 space-y-4">
          <p className="text-sm text-zinc-600">
            Nhập mật khẩu mới cho tài khoản <strong>{user.username}</strong>.
          </p>
          <Input
            label="Mật khẩu mới"
            type="password"
            placeholder="Ít nhất 6 ký tự"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              setError("");
            }}
            required
          />
          <Input
            label="Xác nhận mật khẩu mới"
            type="password"
            placeholder="Nhập lại mật khẩu"
            value={confirm}
            onChange={(e) => {
              setConfirm(e.target.value);
              setError("");
            }}
            required
            error={error}
          />
        </div>
        <div className="px-6 pb-6 flex justify-end gap-3">
          <Button variant="ghost" onClick={onClose} type="button" disabled={saving}>
            Hủy
          </Button>
          <Button variant="primary" type="submit" disabled={saving}>
            {saving ? (
              <>
                <LoaderIcon className="h-4 w-4 animate-spin" />
                Đang lưu...
              </>
            ) : (
              "Đổi mật khẩu"
            )}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

// ─── Delete Confirmation Modal ────────────────────────────────────────────────

function DeleteConfirmModal({
  user,
  onClose,
  onConfirm,
  isLoading,
}: {
  user: UserListItem;
  onClose: () => void;
  onConfirm: () => void;
  isLoading: boolean;
}) {
  return (
    <Modal open={true} onClose={onClose} title="Xác nhận xóa người dùng" maxWidth="sm">
      <div className="p-6">
        <div className="flex items-start gap-4 mb-4">
          <div className="h-10 w-10 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
            <AlertTriangleIcon className="h-5 w-5" />
          </div>
          <div>
            <p className="font-semibold text-zinc-900">Xóa người dùng?</p>
            <p className="text-sm text-zinc-600 mt-1">
              Bạn có chắc chắn muốn xóa tài khoản{" "}
              <strong>{user.username}</strong>? Hành động này không thể hoàn tác.
            </p>
          </div>
        </div>
      </div>
      <div className="px-6 pb-6 flex justify-end gap-3">
        <Button variant="ghost" onClick={onClose} disabled={isLoading}>
          Hủy
        </Button>
        <Button variant="primary" tone="danger" onClick={onConfirm} disabled={isLoading}>
          {isLoading ? (
            <>
              <LoaderIcon className="h-4 w-4 animate-spin" />
              Đang xóa...
            </>
          ) : (
            "Xóa người dùng"
          )}
        </Button>
      </div>
    </Modal>
  );
}

// ─── Profile View Modal ───────────────────────────────────────────────────────

function ProfileModal({ user, onClose }: { user: UserListItem; onClose: () => void }) {
  return (
    <Modal open={true} onClose={onClose} title="Hồ sơ người dùng" maxWidth="md">
      <div className="p-6">
        <div className="flex items-center gap-4 mb-6 pb-6 border-b border-zinc-100">
          <div className="h-16 w-16 rounded-full bg-gradient-to-br from-indigo-100 to-violet-100 text-indigo-700 text-2xl font-bold flex items-center justify-center">
            {(user.display_name || user.username).charAt(0).toUpperCase()}
          </div>
          <div>
            <h3 className="text-lg font-bold text-zinc-900">{user.display_name || user.username}</h3>
            <p className="text-sm text-zinc-500">{user.email || user.username}</p>
            <StatusBadge tone={user.is_active ? "success" : "danger"} dot className="mt-1">
              {user.is_active ? "Hoạt động" : "Tạm khóa"}
            </StatusBadge>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-6">
          <div className="space-y-4">
            <div>
              <label className="text-xs font-medium text-zinc-400 uppercase tracking-wider">
                Username
              </label>
              <p className="text-sm font-medium text-zinc-900 mt-1">{user.username}</p>
            </div>
            <div>
              <label className="text-xs font-medium text-zinc-400 uppercase tracking-wider">
                Role
              </label>
              <p className="text-sm font-medium text-zinc-900 mt-1 flex items-center gap-1.5">
                <ShieldIcon className="h-4 w-4 text-zinc-400" />
                {mapRoleLabel(user.role)}
              </p>
            </div>
          </div>
          <div className="space-y-4">
            <div>
              <label className="text-xs font-medium text-zinc-400 uppercase tracking-wider">
                ID tài khoản
              </label>
              <p className="text-sm font-medium text-zinc-900 mt-1 font-mono">#{user.id}</p>
            </div>
            <div>
              <label className="text-xs font-medium text-zinc-400 uppercase tracking-wider">
                Đăng nhập cuối
              </label>
              <p className="text-sm font-medium text-zinc-900 mt-1 tabular-nums">
                {formatDate(user.last_seen_at)}
              </p>
            </div>
          </div>
        </div>

        <div className="mt-6 pt-6 border-t border-zinc-100">
          <label className="text-xs font-medium text-zinc-400 uppercase tracking-wider">
            Phạm vi domains
          </label>
          <div className="mt-2 flex flex-wrap gap-2">
            {user.domains.length === 0 ? (
              <span className="text-sm text-zinc-500">Không có domain</span>
            ) : user.domains.includes("__all__") ? (
              <span className="text-xs font-medium text-indigo-600 bg-indigo-50 px-2 py-1 rounded">
                Tất cả domain
              </span>
            ) : (
              user.domains.map((d) => (
                <span
                  key={d}
                  className="text-xs font-medium text-zinc-600 bg-zinc-100 px-2 py-1 rounded"
                >
                  {d}
                </span>
              ))
            )}
          </div>
        </div>

        <div className="mt-6 flex justify-end">
          <Button variant="ghost" onClick={onClose}>
            Đóng
          </Button>
        </div>
      </div>
    </Modal>
  );
}
