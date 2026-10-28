import React, { useState, useMemo } from 'react';
import { 
  Users, 
  UserPlus, 
  ShieldCheck, 
  Key, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  Edit3, 
  Lock, 
  Clock, 
  Save, 
  X,
  Search,
  Filter,
  Shield,
  LogOut,
  RefreshCw,
  Eye,
  Check,
  History,
  LayoutGrid,
  List,
  Trash2
} from 'lucide-react';
import { UserAccount, UserRole, UserPermissions, AuditEntry } from '../types/dms';
import { StorageService, DEFAULT_ROLE_PERMISSIONS } from '../services/storageService';

const USER_DELETION_PRESET_REASONS = [
  'Account created by mistake',
  'Duplicate account',
  'Employee/operator no longer authorized',
  'Security concern',
  'Other',
] as const;

interface UserManagementViewProps {
  currentUser: UserAccount;
  onRefreshUsers: () => void;
  showToast: (msg: string) => void;
}

export const UserManagementView: React.FC<UserManagementViewProps> = ({
  currentUser,
  onRefreshUsers,
  showToast,
}) => {
  const [users, setUsers] = useState<UserAccount[]>(StorageService.getUsers());
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [roleFilter, setRoleFilter] = useState<'all' | UserRole>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'deactivated'>('all');
  const [activeSubTab, setActiveSubTab] = useState<'accounts' | 'audit'>('accounts');
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState<boolean>(false);
  const [isResetModalOpen, setIsResetModalOpen] = useState<boolean>(false);
  const [isDeactivateConfirmOpen, setIsDeactivateConfirmOpen] = useState<boolean>(false);
  const [isPermanentDeleteOpen, setIsPermanentDeleteOpen] = useState<boolean>(false);
  const [selectedUser, setSelectedUser] = useState<UserAccount | null>(null);

  // Permanent user deletion state
  const [deleteReasonPreset, setDeleteReasonPreset] = useState<string>('');
  const [deleteReasonCustom, setDeleteReasonCustom] = useState<string>('');
  const [deleteAckConfirmed, setDeleteAckConfirmed] = useState<boolean>(false);
  const [deleteUserError, setDeleteUserError] = useState<string>('');
  const [deleteUserDeps, setDeleteUserDeps] = useState<{ reviewedRecordsCount: number; auditEventsCount: number }>({
    reviewedRecordsCount: 0,
    auditEventsCount: 0,
  });

  // New user form state
  const [newUsername, setNewUsername] = useState<string>('');
  const [newFullName, setNewFullName] = useState<string>('');
  const [newRole, setNewRole] = useState<UserRole>('operator');
  const [newPassword, setNewPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  const [newMustChangePassword, setNewMustChangePassword] = useState<boolean>(false);
  const [newPermissions, setNewPermissions] = useState<UserPermissions>(DEFAULT_ROLE_PERMISSIONS.operator);
  const [formError, setFormError] = useState<string>('');

  // Edit user state
  const [editFullName, setEditFullName] = useState<string>('');
  const [editRole, setEditRole] = useState<UserRole>('operator');
  const [editPermissions, setEditPermissions] = useState<UserPermissions>(DEFAULT_ROLE_PERMISSIONS.operator);
  const [editError, setEditError] = useState<string>('');

  // Password reset state
  const [resetPasswordValue, setResetPasswordValue] = useState<string>('');
  const [resetConfirmValue, setResetConfirmValue] = useState<string>('');
  const [resetMustChangePassword, setResetMustChangePassword] = useState<boolean>(true);
  const [resetError, setResetError] = useState<string>('');

  // Permission Guard: Only Super Admin and authorized Administrators can manage users
  const isAuthorized = StorageService.canPerform(currentUser, 'canManageUsers');

  if (!isAuthorized) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-slate-950 text-slate-100">
        <div className="w-16 h-16 rounded-full bg-rose-950/80 border border-rose-600/50 flex items-center justify-center text-rose-400 mb-4">
          <Lock className="w-8 h-8" />
        </div>
        <h2 className="text-lg font-bold text-white uppercase tracking-wider">
          Access Restricted: Administrator Role Required
        </h2>
        <p className="text-xs text-slate-400 max-w-md mt-1 leading-relaxed">
          User Management is an administrative function. Your current account ({currentUser.fullName}) is assigned the <strong className="text-cyan-400 uppercase">{currentUser.role}</strong> role and does not have administrative user management permissions.
        </p>
      </div>
    );
  }

  // Handle role change in Add form to apply preset permissions
  const handleNewRoleChange = (role: UserRole) => {
    setNewRole(role);
    setNewPermissions({ ...DEFAULT_ROLE_PERMISSIONS[role] });
  };

  const handleEditRoleChange = (role: UserRole) => {
    setEditRole(role);
    setEditPermissions({ ...DEFAULT_ROLE_PERMISSIONS[role] });
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (newPassword !== confirmPassword) {
      setFormError('Passwords do not match.');
      return;
    }

    const result = await StorageService.createUser(
      {
        username: newUsername,
        fullName: newFullName,
        role: newRole,
        password: newPassword,
        permissions: newPermissions,
        mustChangePassword: newMustChangePassword,
      },
      currentUser
    );

    if (result.success) {
      showToast(result.message);
      setUsers(StorageService.getUsers());
      onRefreshUsers();
      setIsAddModalOpen(false);
      setNewUsername('');
      setNewFullName('');
      setNewPassword('');
      setConfirmPassword('');
      setNewMustChangePassword(false);
    } else {
      setFormError(result.message);
    }
  };

  const openEditModal = (u: UserAccount) => {
    setSelectedUser(u);
    setEditFullName(u.fullName);
    setEditRole(u.role);
    setEditPermissions(u.permissions || DEFAULT_ROLE_PERMISSIONS[u.role] || DEFAULT_ROLE_PERMISSIONS.operator);
    setEditError('');
    setIsEditModalOpen(true);
  };

  const handleSaveEditUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;
    setEditError('');

    if (!editFullName.trim()) {
      setEditError('Please enter full name.');
      return;
    }

    const updated: UserAccount = {
      ...selectedUser,
      fullName: editFullName.trim(),
      role: editRole,
      permissions: editPermissions,
    };

    StorageService.updateUser(updated, currentUser);
    showToast(`User '${updated.username}' profile updated.`);
    setUsers(StorageService.getUsers());
    onRefreshUsers();
    setIsEditModalOpen(false);
    setSelectedUser(null);
  };

  const handleExecutePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;
    setResetError('');

    if (resetPasswordValue !== resetConfirmValue) {
      setResetError('Passwords do not match.');
      return;
    }

    const result = await StorageService.resetUserPassword(
      selectedUser.id,
      resetPasswordValue,
      currentUser,
      resetMustChangePassword
    );

    if (result.success) {
      showToast(result.message);
      setIsResetModalOpen(false);
      setSelectedUser(null);
      setResetPasswordValue('');
      setResetConfirmValue('');
    } else {
      setResetError(result.message);
    }
  };

  const confirmToggleStatus = (u: UserAccount) => {
    setSelectedUser(u);
    setIsDeactivateConfirmOpen(true);
  };

  const handleExecuteToggleStatus = () => {
    if (!selectedUser) return;
    const result = StorageService.toggleUserStatus(selectedUser.id, currentUser);
    showToast(result.message);
    setUsers(StorageService.getUsers());
    onRefreshUsers();
    setIsDeactivateConfirmOpen(false);
    setSelectedUser(null);
  };

  const handleForceRevokeSession = (u: UserAccount) => {
    StorageService.logAudit(
      `${currentUser.fullName} (${currentUser.username})`,
      'Session Revoked',
      `Forced session revocation for user account '${u.username}'.`
    );
    showToast(`Session revoked for '${u.username}'.`);
  };

  // Determine whether a user account is eligible for permanent deletion by currentUser
  const getPermanentDeleteEligibility = (target: UserAccount): { eligible: boolean; reason?: string } => {
    if (target.id === currentUser.id) {
      return { eligible: false, reason: 'Cannot permanently delete your currently logged-in account' };
    }
    if (target.role === 'super_admin' && currentUser.role !== 'super_admin') {
      return { eligible: false, reason: 'Only a Super Admin can delete a Super Admin account' };
    }
    if (target.role === 'super_admin') {
      const activeSuperAdmins = users.filter(u => u.id !== target.id && u.role === 'super_admin' && u.status === 'active');
      if (activeSuperAdmins.length === 0) {
        return { eligible: false, reason: 'Cannot delete the last active Super Admin account' };
      }
    }
    return { eligible: true };
  };

  const openPermanentDeleteModal = (u: UserAccount) => {
    const check = getPermanentDeleteEligibility(u);
    if (!check.eligible) {
      showToast(check.reason || 'This account cannot be permanently deleted.');
      return;
    }
    setSelectedUser(u);
    setDeleteReasonPreset('');
    setDeleteReasonCustom('');
    setDeleteAckConfirmed(false);
    setDeleteUserError('');
    setDeleteUserDeps(StorageService.getUserDependencies(u));
    setIsPermanentDeleteOpen(true);
  };

  const resolvedDeleteReason = useMemo(() => {
    if (!deleteReasonPreset) return '';
    if (deleteReasonPreset === 'Other') {
      return deleteReasonCustom.trim() ? `Other: ${deleteReasonCustom.trim()}` : '';
    }
    return deleteReasonCustom.trim()
      ? `${deleteReasonPreset} (${deleteReasonCustom.trim()})`
      : deleteReasonPreset;
  }, [deleteReasonPreset, deleteReasonCustom]);

  const handleExecutePermanentDelete = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;
    setDeleteUserError('');

    if (!deleteReasonPreset) {
      setDeleteUserError('Please select a reason for permanent account deletion.');
      return;
    }
    if (deleteReasonPreset === 'Other' && !deleteReasonCustom.trim()) {
      setDeleteUserError('Please enter a written explanation when selecting "Other".');
      return;
    }
    if (!deleteAckConfirmed) {
      setDeleteUserError('Please confirm that you understand the permanent deletion consequences.');
      return;
    }

    const result = StorageService.permanentlyDeleteUser(
      selectedUser.id,
      currentUser,
      resolvedDeleteReason
    );

    if (result.success) {
      showToast(result.message);
      setUsers(StorageService.getUsers());
      onRefreshUsers();
      setIsPermanentDeleteOpen(false);
      setSelectedUser(null);
    } else {
      setDeleteUserError(result.message);
    }
  };

  // Filtered users
  const filteredUsers = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return users.filter(u => {
      const matchQuery = 
        !q || 
        u.username.toLowerCase().includes(q) || 
        u.fullName.toLowerCase().includes(q);
      const matchRole = roleFilter === 'all' || u.role === roleFilter;
      const matchStatus = statusFilter === 'all' || u.status === statusFilter;
      return matchQuery && matchRole && matchStatus;
    });
  }, [users, searchQuery, roleFilter, statusFilter]);

  // Auth & user audit entries
  const userAuditEntries = useMemo(() => {
    const all = StorageService.getAuditLog();
    return all.filter(a => 
      a.action.toLowerCase().includes('user') ||
      a.action.toLowerCase().includes('login') ||
      a.action.toLowerCase().includes('password') ||
      a.action.toLowerCase().includes('session') ||
      a.action.toLowerCase().includes('pin') ||
      a.action.toLowerCase().includes('system initialized')
    );
  }, [users]);

  const renderRoleBadge = (role: UserRole) => {
    switch (role) {
      case 'super_admin':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-purple-950/80 border border-purple-500/70 text-purple-200 font-bold text-[11px] tracking-wide shadow-xs whitespace-nowrap">
            <ShieldCheck className="w-3.5 h-3.5 text-purple-400 shrink-0" />
            <span>Super Admin</span>
          </span>
        );
      case 'administrator':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-sky-950/80 border border-sky-500/70 text-sky-200 font-bold text-[11px] tracking-wide shadow-xs whitespace-nowrap">
            <Shield className="w-3.5 h-3.5 text-sky-400 shrink-0" />
            <span>Administrator</span>
          </span>
        );
      case 'operator':
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-800/95 border border-slate-600/70 text-slate-200 font-bold text-[11px] tracking-wide shadow-xs whitespace-nowrap">
            <Users className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
            <span>Authorized Operator</span>
          </span>
        );
    }
  };

  const renderPermissionsBadges = (u: UserAccount) => {
    if (u.role === 'super_admin') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-purple-950/60 border border-purple-700/60 text-purple-300 font-mono text-[11px] font-semibold whitespace-nowrap">
          <ShieldCheck className="w-3.5 h-3.5 text-purple-400 shrink-0" />
          <span>Full System Authority</span>
        </span>
      );
    }

    const p = u.permissions || DEFAULT_ROLE_PERMISSIONS[u.role] || DEFAULT_ROLE_PERMISSIONS.operator;
    const badges = [
      { key: 'users', label: 'User Admin', active: p.canManageUsers, color: 'bg-cyan-950/70 border-cyan-800 text-cyan-300' },
      { key: 'edit', label: 'Edit Dossiers', active: p.canEditRecords, color: 'bg-emerald-950/70 border-emerald-800 text-emerald-300' },
      { key: 'del', label: 'Delete Records', active: p.canDeleteRecords, color: 'bg-rose-950/70 border-rose-800 text-rose-300' },
      { key: 'verify', label: 'Doc Verification', active: p.canVerifyDocuments, color: 'bg-blue-950/70 border-blue-800 text-blue-300' },
      { key: 'backup', label: 'Backup & Export', active: p.canExportBackup, color: 'bg-amber-950/70 border-amber-800 text-amber-300' },
      { key: 'aadhaar', label: 'Unmask Aadhaar', active: p.canUnmaskAadhaar, color: 'bg-indigo-950/70 border-indigo-800 text-indigo-300' },
    ].filter(b => b.active);

    if (badges.length === 0) {
      return <span className="text-slate-500 font-mono text-[11px] italic">Read-Only Access</span>;
    }

    return (
      <div className="flex flex-wrap gap-1 max-w-[230px]">
        {badges.map(b => (
          <span key={b.key} className={`px-1.5 py-0.5 rounded border text-[10px] font-mono font-medium whitespace-nowrap ${b.color}`}>
            {b.label}
          </span>
        ))}
      </div>
    );
  };

  const formatCreatedDate = (iso?: string): string => {
    if (!iso) return '—';
    const d = new Date(iso);
    if (isNaN(d.getTime())) return '—';
    return d.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  const formatLastLoginDateTime = (u: UserAccount): string | null => {
    const rawTimestamp = u.lastLogin || (u.id === currentUser.id ? currentUser.lastLogin : undefined);
    if (!rawTimestamp) return null;
    const d = new Date(rawTimestamp);
    if (isNaN(d.getTime())) return null;
    const datePart = d.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
    const timePart = d.toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
    return `${datePart}, ${timePart}`;
  };

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-slate-950 text-slate-100 overflow-y-auto font-sans">
      {/* Top Header */}
      <div className="px-4 sm:px-6 py-4 bg-slate-900 border-b border-slate-800 shrink-0">
        <div className="max-w-[1600px] mx-auto flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <Users className="w-5 h-5 text-cyan-400 shrink-0" />
              <h2 className="text-base font-bold text-white uppercase tracking-wider font-mono">
                User & Access Control Management
              </h2>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800">
                Admin Exclusive
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Role-Based Access Control (RBAC) · Super Admin, Administrator & Operator permissions with salted SHA-256 hashes
            </p>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center bg-slate-950 p-1 rounded-lg border border-slate-800 text-xs font-mono">
              <button
                onClick={() => setActiveSubTab('accounts')}
                className={`px-3 py-1 rounded transition-colors cursor-pointer ${activeSubTab === 'accounts' ? 'bg-cyan-600 text-white' : 'text-slate-400 hover:text-white'}`}
              >
                Accounts ({users.length})
              </button>
              <button
                onClick={() => setActiveSubTab('audit')}
                className={`px-3 py-1 rounded transition-colors cursor-pointer ${activeSubTab === 'audit' ? 'bg-cyan-600 text-white' : 'text-slate-400 hover:text-white'}`}
              >
                Security Audit ({userAuditEntries.length})
              </button>
            </div>

            <button
              onClick={() => {
                setFormError('');
                setIsAddModalOpen(true);
              }}
              className="flex items-center gap-2 px-3.5 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg text-xs font-semibold transition-colors shadow-sm cursor-pointer whitespace-nowrap"
            >
              <UserPlus className="w-4 h-4 shrink-0" />
              <span>Create Application User</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="px-4 sm:px-6 py-5 max-w-[1600px] mx-auto w-full space-y-6">
        {activeSubTab === 'accounts' ? (
          <>
            {/* Filter & View Switcher Bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-slate-900 border border-slate-800 rounded-xl text-xs font-mono shadow-sm">
              <div className="flex items-center gap-2 flex-1 min-w-[220px]">
                <Search className="w-4 h-4 text-slate-500 shrink-0" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search user by username or full name..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-white placeholder-slate-600 focus:outline-none focus:border-cyan-500 text-xs"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="text-xs text-slate-400 hover:text-white cursor-pointer"
                  >
                    Clear
                  </button>
                )}
              </div>

              <div className="flex items-center gap-3 flex-wrap">
                <div className="flex items-center gap-1.5">
                  <span className="text-slate-500">Role:</span>
                  <select
                    value={roleFilter}
                    onChange={(e) => setRoleFilter(e.target.value as any)}
                    className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-slate-300 focus:outline-none focus:border-cyan-500 text-xs"
                  >
                    <option value="all">All Roles ({users.length})</option>
                    <option value="super_admin">Super Admin</option>
                    <option value="administrator">Administrator</option>
                    <option value="operator">Authorized Operator</option>
                  </select>
                </div>

                <div className="flex items-center gap-1.5">
                  <span className="text-slate-500">Status:</span>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value as any)}
                    className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-slate-300 focus:outline-none focus:border-cyan-500 text-xs"
                  >
                    <option value="all">All Statuses</option>
                    <option value="active">Active</option>
                    <option value="deactivated">Deactivated</option>
                  </select>
                </div>

                {/* View Switcher: Table vs Cards */}
                <div className="flex items-center bg-slate-950 p-1 rounded-lg border border-slate-800">
                  <button
                    onClick={() => setViewMode('table')}
                    className={`px-2.5 py-1 rounded text-xs transition-colors flex items-center gap-1 cursor-pointer ${
                      viewMode === 'table' ? 'bg-cyan-600 text-white font-semibold' : 'text-slate-400 hover:text-white'
                    }`}
                    title="Enterprise Table View"
                  >
                    <List className="w-3.5 h-3.5" />
                    <span>Table</span>
                  </button>
                  <button
                    onClick={() => setViewMode('cards')}
                    className={`px-2.5 py-1 rounded text-xs transition-colors flex items-center gap-1 cursor-pointer ${
                      viewMode === 'cards' ? 'bg-cyan-600 text-white font-semibold' : 'text-slate-400 hover:text-white'
                    }`}
                    title="Stacked Cards View"
                  >
                    <LayoutGrid className="w-3.5 h-3.5" />
                    <span>Cards</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Users Display Mode */}
            {viewMode === 'table' ? (
              <div className="rounded-xl border border-slate-800 bg-slate-900 shadow-md overflow-hidden">
                <div className="overflow-x-auto w-full">
                  <table className="w-full text-xs text-left border-collapse min-w-[1120px]">
                    <thead className="bg-slate-950 text-slate-400 border-b border-slate-800 font-mono uppercase text-[11px]">
                      <tr>
                        <th className="py-3 px-3.5 font-bold min-w-[185px] whitespace-nowrap">User & Identity</th>
                        <th className="py-3 px-3.5 font-bold min-w-[145px] whitespace-nowrap">Assigned Role</th>
                        <th className="py-3 px-3.5 font-bold min-w-[205px] whitespace-nowrap">RBAC Permissions</th>
                        <th className="py-3 px-3.5 font-bold min-w-[110px] whitespace-nowrap">Account Status</th>
                        <th className="py-3 px-3.5 font-bold min-w-[105px] whitespace-nowrap">Created</th>
                        <th className="py-3 px-3.5 font-bold min-w-[165px] whitespace-nowrap">Last Login</th>
                        <th className="py-3 px-3.5 font-bold text-right min-w-[305px] whitespace-nowrap">Account Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 font-sans">
                      {filteredUsers.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="py-12 text-center text-slate-500 font-mono">
                            No user accounts matched the filter criteria.
                          </td>
                        </tr>
                      ) : (
                        filteredUsers.map((u) => {
                          const isCurrent = u.id === currentUser.id;
                          const lastLoginFormatted = formatLastLoginDateTime(u);
                          return (
                            <tr key={u.id} className="hover:bg-slate-800/40 transition-colors">
                              <td className="py-3 px-3.5 align-middle">
                                <div className="flex items-center gap-2.5">
                                  <div className="w-8 h-8 rounded-full bg-slate-950 border border-slate-700 flex items-center justify-center font-mono font-bold text-xs text-cyan-400 shrink-0">
                                    {u.username.slice(0, 2).toUpperCase()}
                                  </div>
                                  <div className="min-w-0">
                                    <div className="flex items-center gap-1.5 flex-wrap">
                                      <span className="font-mono font-bold text-cyan-300 text-xs">
                                        {u.username}
                                      </span>
                                      {isCurrent && (
                                        <span className="px-1.5 py-0.2 rounded bg-cyan-950 text-cyan-300 border border-cyan-800 text-[10px] font-mono whitespace-nowrap">
                                          Current User
                                        </span>
                                      )}
                                      {u.mustChangePassword && (
                                        <span className="px-1.5 py-0.2 rounded bg-amber-950 text-amber-300 border border-amber-800 text-[10px] font-mono whitespace-nowrap" title="Temporary password assigned">
                                          Pwd Reset
                                        </span>
                                      )}
                                    </div>
                                    <div className="font-semibold text-white text-xs mt-0.5 truncate max-w-[165px] 2xl:max-w-[220px]" title={u.fullName}>
                                      {u.fullName}
                                    </div>
                                  </div>
                                </div>
                              </td>

                              <td className="py-3 px-3.5 align-middle whitespace-nowrap">
                                {renderRoleBadge(u.role)}
                              </td>

                              <td className="py-3 px-3.5 align-middle">
                                {renderPermissionsBadges(u)}
                              </td>

                              <td className="py-3 px-3.5 align-middle font-mono whitespace-nowrap">
                                {u.status === 'active' ? (
                                  <span className="inline-flex items-center gap-1.5 text-emerald-400 font-bold text-[11px] px-2 py-0.5 rounded bg-emerald-950/60 border border-emerald-800/60 whitespace-nowrap">
                                    <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                                    <span>Active</span>
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1.5 text-rose-400 font-bold text-[11px] px-2 py-0.5 rounded bg-rose-950/60 border border-rose-800/60 whitespace-nowrap">
                                    <XCircle className="w-3.5 h-3.5 shrink-0" />
                                    <span>Deactivated</span>
                                  </span>
                                )}
                              </td>

                              <td className="py-3 px-3.5 align-middle font-mono text-slate-300 text-[11px] whitespace-nowrap tabular-nums">
                                {formatCreatedDate(u.createdAt)}
                              </td>

                              <td className="py-3 px-3.5 align-middle font-mono text-[11px] whitespace-nowrap tabular-nums">
                                {lastLoginFormatted ? (
                                  <span className="inline-flex items-center gap-1.5 text-slate-200 bg-slate-950/80 border border-slate-800 px-2 py-1 rounded">
                                    <Clock className="w-3 h-3 text-cyan-400 shrink-0" />
                                    <span>{lastLoginFormatted}</span>
                                  </span>
                                ) : (
                                  <span className="text-slate-500 italic">Never</span>
                                )}
                              </td>

                              <td className="py-3 px-3.5 align-middle text-right whitespace-nowrap">
                                <div className="flex items-center justify-end gap-1.5 flex-nowrap">
                                  <button
                                    onClick={() => openEditModal(u)}
                                    className="inline-flex items-center gap-1 px-2 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded text-[11px] font-medium border border-slate-700 transition-colors cursor-pointer shrink-0 whitespace-nowrap"
                                    title="Edit user details and permissions"
                                  >
                                    <Edit3 className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                                    <span>Edit</span>
                                  </button>

                                  <button
                                    onClick={() => {
                                      setSelectedUser(u);
                                      setResetPasswordValue('');
                                      setResetConfirmValue('');
                                      setResetMustChangePassword(true);
                                      setResetError('');
                                      setIsResetModalOpen(true);
                                    }}
                                    className="inline-flex items-center gap-1 px-2 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded text-[11px] font-medium border border-slate-700 transition-colors cursor-pointer shrink-0 whitespace-nowrap"
                                    title="Reset Password"
                                  >
                                    <Key className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                                    <span>Reset Pwd</span>
                                  </button>

                                  <button
                                    onClick={() => confirmToggleStatus(u)}
                                    disabled={isCurrent}
                                    className={`inline-flex items-center gap-1 px-2 py-1.5 rounded text-[11px] font-medium transition-colors cursor-pointer shrink-0 whitespace-nowrap ${
                                      u.status === 'active'
                                        ? 'bg-rose-950/60 hover:bg-rose-900 text-rose-300 border border-rose-800/70 disabled:opacity-30 disabled:cursor-not-allowed'
                                        : 'bg-emerald-950/60 hover:bg-emerald-900 text-emerald-300 border border-emerald-800/70'
                                    }`}
                                    title={isCurrent ? 'Cannot deactivate currently active account' : 'Toggle status'}
                                  >
                                    {u.status === 'active' ? (
                                      <>
                                        <XCircle className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                                        <span>Deactivate</span>
                                      </>
                                    ) : (
                                      <>
                                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                                        <span>Activate</span>
                                      </>
                                    )}
                                  </button>

                                  <button
                                    onClick={() => handleForceRevokeSession(u)}
                                    className="inline-flex items-center p-1.5 bg-slate-800 hover:bg-rose-950 text-slate-400 hover:text-rose-300 rounded text-[11px] border border-slate-700 hover:border-rose-800 transition-colors cursor-pointer shrink-0"
                                    title="Revoke Session / Force Logout"
                                  >
                                    <LogOut className="w-3.5 h-3.5 shrink-0" />
                                  </button>

                                  {(() => {
                                    const delCheck = getPermanentDeleteEligibility(u);
                                    return (
                                      <button
                                        onClick={() => openPermanentDeleteModal(u)}
                                        disabled={!delCheck.eligible}
                                        className="inline-flex items-center gap-1 px-2 py-1.5 bg-rose-950/80 hover:bg-rose-900 text-rose-200 rounded text-[11px] font-semibold border border-rose-700/80 transition-colors cursor-pointer shrink-0 whitespace-nowrap disabled:opacity-30 disabled:cursor-not-allowed"
                                        title={delCheck.eligible ? 'Permanently Delete User Account (Requires Reason & Final Confirmation)' : delCheck.reason}
                                      >
                                        <Trash2 className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                                        <span>Delete Account</span>
                                      </button>
                                    );
                                  })()}
                                </div>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              /* Detailed Stacked Cards View */
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 font-sans">
                {filteredUsers.length === 0 ? (
                  <div className="col-span-full py-12 text-center text-slate-500 font-mono bg-slate-900 rounded-xl border border-slate-800">
                    No user accounts matched the filter criteria.
                  </div>
                ) : (
                  filteredUsers.map((u) => {
                    const isCurrent = u.id === currentUser.id;
                    const lastLoginFormatted = formatLastLoginDateTime(u);
                    return (
                      <div
                        key={u.id}
                        className="p-5 rounded-xl bg-slate-900 border border-slate-800 shadow-md flex flex-col justify-between space-y-4 hover:border-slate-700 transition-colors"
                      >
                        <div className="space-y-3">
                          {/* Card Header */}
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex items-center gap-3 min-w-0">
                              <div className="w-10 h-10 rounded-full bg-slate-950 border border-slate-700 flex items-center justify-center font-mono font-bold text-sm text-cyan-400 shrink-0">
                                {u.username.slice(0, 2).toUpperCase()}
                              </div>
                              <div className="min-w-0">
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <span className="font-mono font-bold text-cyan-300 text-sm">
                                    {u.username}
                                  </span>
                                  {isCurrent && (
                                    <span className="px-1.5 py-0.2 rounded bg-cyan-950 text-cyan-300 border border-cyan-800 text-[10px] font-mono">
                                      You
                                    </span>
                                  )}
                                  {u.mustChangePassword && (
                                    <span className="px-1.5 py-0.2 rounded bg-amber-950 text-amber-300 border border-amber-800 text-[10px] font-mono">
                                      Temp Pwd
                                    </span>
                                  )}
                                </div>
                                <h4 className="font-bold text-white text-sm mt-0.5 truncate" title={u.fullName}>
                                  {u.fullName}
                                </h4>
                              </div>
                            </div>
                            <div className="shrink-0">
                              {u.status === 'active' ? (
                                <span className="inline-flex items-center gap-1 text-emerald-400 font-bold text-[11px] px-2 py-0.5 rounded bg-emerald-950/60 border border-emerald-800/60 font-mono">
                                  <CheckCircle2 className="w-3 h-3" />
                                  <span>Active</span>
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 text-rose-400 font-bold text-[11px] px-2 py-0.5 rounded bg-rose-950/60 border border-rose-800/60 font-mono">
                                  <XCircle className="w-3 h-3" />
                                  <span>Deactivated</span>
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Role Banner */}
                          <div>
                            <span className="text-[10px] font-mono uppercase text-slate-500 block mb-1">System Role:</span>
                            {renderRoleBadge(u.role)}
                          </div>

                          {/* Permissions */}
                          <div className="space-y-1 pt-1 border-t border-slate-800/80">
                            <span className="text-[10px] font-mono uppercase text-slate-500 block">Granted Permissions:</span>
                            {renderPermissionsBadges(u)}
                          </div>

                          {/* Dates */}
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] font-mono pt-2 border-t border-slate-800/80 text-slate-300">
                            <div>
                              <span className="text-[10px] text-slate-500 block">Created</span>
                              <span className="whitespace-nowrap">{formatCreatedDate(u.createdAt)}</span>
                            </div>
                            <div>
                              <span className="text-[10px] text-slate-500 block">Last Login</span>
                              <span className="whitespace-nowrap">{lastLoginFormatted || 'Never'}</span>
                            </div>
                          </div>
                        </div>

                        {/* Actions Toolbar */}
                        <div className="pt-3 border-t border-slate-800 flex items-center justify-between gap-1.5 flex-wrap">
                          <button
                            onClick={() => openEditModal(u)}
                            className="flex-1 inline-flex items-center justify-center gap-1 px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded text-xs font-medium border border-slate-700 transition-colors cursor-pointer"
                          >
                            <Edit3 className="w-3 h-3 text-cyan-400" />
                            <span>Edit</span>
                          </button>

                          <button
                            onClick={() => {
                              setSelectedUser(u);
                              setResetPasswordValue('');
                              setResetConfirmValue('');
                              setResetMustChangePassword(true);
                              setResetError('');
                              setIsResetModalOpen(true);
                            }}
                            className="flex-1 inline-flex items-center justify-center gap-1 px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded text-xs font-medium border border-slate-700 transition-colors cursor-pointer"
                          >
                            <Key className="w-3 h-3 text-amber-400" />
                            <span>Reset</span>
                          </button>

                          <button
                            onClick={() => confirmToggleStatus(u)}
                            disabled={isCurrent}
                            className={`flex-1 inline-flex items-center justify-center gap-1 px-2.5 py-1.5 rounded text-xs font-medium transition-colors cursor-pointer ${
                              u.status === 'active'
                                ? 'bg-rose-950/60 hover:bg-rose-900 text-rose-300 border border-rose-800/70 disabled:opacity-30'
                                : 'bg-emerald-950/60 hover:bg-emerald-900 text-emerald-300 border border-emerald-800/70'
                            }`}
                          >
                            {u.status === 'active' ? 'Deactivate' : 'Activate'}
                          </button>

                          <button
                            onClick={() => handleForceRevokeSession(u)}
                            className="p-1.5 bg-slate-800 hover:bg-rose-950 text-slate-400 hover:text-rose-300 rounded text-xs border border-slate-700 hover:border-rose-800 transition-colors cursor-pointer"
                            title="Force Logout"
                          >
                            <LogOut className="w-3.5 h-3.5" />
                          </button>

                          {(() => {
                            const delCheck = getPermanentDeleteEligibility(u);
                            return (
                              <button
                                onClick={() => openPermanentDeleteModal(u)}
                                disabled={!delCheck.eligible}
                                className="w-full mt-1 inline-flex items-center justify-center gap-1.5 px-3 py-1.5 bg-rose-950/80 hover:bg-rose-900 text-rose-200 rounded text-xs font-semibold border border-rose-700/80 transition-colors cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                                title={delCheck.eligible ? 'Permanently Delete Account' : delCheck.reason}
                              >
                                <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                                <span>Permanently Delete Account</span>
                              </button>
                            );
                          })()}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            )}

            {/* Role Architecture Reference Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-mono">
              <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
                <h4 className="font-bold text-purple-400 text-sm flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4" />
                  <span>Super Admin</span>
                </h4>
                <p className="text-slate-400 text-[11px] leading-relaxed">
                  Supreme system authority. Unconditional access to User Management, role assignments, security PIN overrides, disaster recovery, and database backups.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
                <h4 className="font-bold text-cyan-400 text-sm flex items-center gap-2">
                  <Shield className="w-4 h-4" />
                  <span>Administrator</span>
                </h4>
                <p className="text-slate-400 text-[11px] leading-relaxed">
                  Operational administrator. Manages technician & partner dossiers, imports and reviews PDFs, verifies documents, and manages users according to granted permissions.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
                <h4 className="font-bold text-slate-300 text-sm flex items-center gap-2">
                  <Users className="w-4 h-4 text-slate-400" />
                  <span>Authorized Operator</span>
                </h4>
                <p className="text-slate-400 text-[11px] leading-relaxed">
                  Field intake & document inspection officer. Performs dossier searches, inspects OCR confidence, and views attachments with security PIN clearance.
                </p>
              </div>
            </div>
          </>
        ) : (
          /* Security & Authentication Audit Log */
          <div className="rounded-xl border border-slate-800 bg-slate-900 overflow-hidden shadow-md">
            <div className="p-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <History className="w-4 h-4 text-cyan-400" />
                <span className="text-xs font-bold text-white uppercase font-mono tracking-wider">
                  Authentication & Account Event Audit Log
                </span>
              </div>
              <span className="text-xs text-slate-500 font-mono">
                Immutable chronological security events
              </span>
            </div>

            <div className="divide-y divide-slate-800 max-h-[600px] overflow-y-auto font-mono text-xs">
              {userAuditEntries.length === 0 ? (
                <div className="p-8 text-center text-slate-500">No security audit events recorded.</div>
              ) : (
                userAuditEntries.map((entry) => (
                  <div key={entry.id} className="p-3.5 hover:bg-slate-800/40 transition-colors flex items-start justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-cyan-300">{entry.action}</span>
                        <span className="text-slate-600">·</span>
                        <span className="text-slate-400 font-semibold">{entry.actor}</span>
                      </div>
                      <p className="text-slate-300 text-[11px] leading-relaxed font-sans">{entry.details}</p>
                    </div>
                    <span className="text-[11px] text-slate-500 shrink-0 whitespace-nowrap">
                      {new Date(entry.timestamp).toLocaleString()}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>

      {/* MODAL 1: Create Authorized User */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-lg w-full p-6 shadow-2xl space-y-4 my-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <UserPlus className="w-4 h-4 text-cyan-400" />
                <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono">
                  Create Authorized Application User
                </h3>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="p-3 bg-rose-950/70 border border-rose-800 rounded-lg text-rose-300 text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleCreateUser} className="space-y-4 text-xs font-mono">
              <div className="space-y-1">
                <label className="text-slate-300 font-medium">Username / User ID <span className="text-rose-400">*</span></label>
                <input
                  type="text"
                  required
                  value={newUsername}
                  onChange={(e) => setNewUsername(e.target.value)}
                  placeholder="e.g. rajesh_verif"
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white placeholder-slate-600 focus:outline-none focus:border-cyan-500 font-mono text-xs"
                />
              </div>

              <div className="space-y-1">
                <label className="text-slate-300 font-medium">Full Name & Station Designation <span className="text-rose-400">*</span></label>
                <input
                  type="text"
                  required
                  value={newFullName}
                  onChange={(e) => setNewFullName(e.target.value)}
                  placeholder="e.g. Rajesh Kumar (Office Operator)"
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white placeholder-slate-600 focus:outline-none focus:border-cyan-500 font-sans text-xs"
                />
              </div>

              <div className="space-y-1">
                <label className="text-slate-300 font-medium">System Role <span className="text-rose-400">*</span></label>
                <select
                  value={newRole}
                  onChange={(e) => handleNewRoleChange(e.target.value as UserRole)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-cyan-500 font-mono text-xs"
                >
                  <option value="operator">Authorized Operator (Record Inspection & Verification)</option>
                  <option value="administrator">Administrator (Operations & Dossier Management)</option>
                  {currentUser.role === 'super_admin' && (
                    <option value="super_admin">Super Admin (Full Unrestricted System Authority)</option>
                  )}
                </select>
              </div>

              {/* Granular Permissions Checkboxes */}
              <div className="p-3 bg-slate-950 border border-slate-800 rounded-lg space-y-2">
                <label className="block text-[11px] font-bold text-slate-300 uppercase">
                  Explicit System Permissions:
                </label>
                <div className="grid grid-cols-2 gap-2 text-[11px] font-sans">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={newPermissions.canManageUsers}
                      onChange={(e) => setNewPermissions(p => ({ ...p, canManageUsers: e.target.checked }))}
                      className="rounded bg-slate-900 border-slate-700 text-cyan-600"
                    />
                    <span className="text-slate-300">Manage Users</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={newPermissions.canEditRecords}
                      onChange={(e) => setNewPermissions(p => ({ ...p, canEditRecords: e.target.checked }))}
                      className="rounded bg-slate-900 border-slate-700 text-cyan-600"
                    />
                    <span className="text-slate-300">Edit Records</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={newPermissions.canDeleteRecords}
                      onChange={(e) => setNewPermissions(p => ({ ...p, canDeleteRecords: e.target.checked }))}
                      className="rounded bg-slate-900 border-slate-700 text-cyan-600"
                    />
                    <span className="text-slate-300">Delete Records</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={newPermissions.canVerifyDocuments}
                      onChange={(e) => setNewPermissions(p => ({ ...p, canVerifyDocuments: e.target.checked }))}
                      className="rounded bg-slate-900 border-slate-700 text-cyan-600"
                    />
                    <span className="text-slate-300">Verify Documents</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={newPermissions.canExportBackup}
                      onChange={(e) => setNewPermissions(p => ({ ...p, canExportBackup: e.target.checked }))}
                      className="rounded bg-slate-900 border-slate-700 text-cyan-600"
                    />
                    <span className="text-slate-300">Export & Backup</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={newPermissions.canUnmaskAadhaar}
                      onChange={(e) => setNewPermissions(p => ({ ...p, canUnmaskAadhaar: e.target.checked }))}
                      className="rounded bg-slate-900 border-slate-700 text-cyan-600"
                    />
                    <span className="text-slate-300">Unmask Aadhaar</span>
                  </label>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-slate-300 font-medium">Password <span className="text-rose-400">*</span></label>
                  <input
                    type="password"
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Min 6 characters"
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-cyan-500 font-mono text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-slate-300 font-medium">Confirm Password <span className="text-rose-400">*</span></label>
                  <input
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Repeat password"
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-cyan-500 font-mono text-xs"
                  />
                </div>
              </div>

              {/* Temporary password option */}
              <label className="flex items-center gap-2 p-2.5 rounded bg-slate-950 border border-slate-800 cursor-pointer">
                <input
                  type="checkbox"
                  checked={newMustChangePassword}
                  onChange={(e) => setNewMustChangePassword(e.target.checked)}
                  className="rounded bg-slate-900 border-slate-700 text-cyan-600"
                />
                <span className="text-xs text-slate-300">
                  Temporary password: Require user to change password upon first sign in
                </span>
              </label>

              <div className="pt-2 flex justify-end gap-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Create User</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: Edit User & Permissions */}
      {isEditModalOpen && selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-lg w-full p-6 shadow-2xl space-y-4 my-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Edit3 className="w-4 h-4 text-cyan-400" />
                <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono">
                  Edit User Details & Permissions
                </h3>
              </div>
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {editError && (
              <div className="p-3 bg-rose-950/70 border border-rose-800 rounded-lg text-rose-300 text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400" />
                <span>{editError}</span>
              </div>
            )}

            <form onSubmit={handleSaveEditUser} className="space-y-4 text-xs font-mono">
              <div className="space-y-1">
                <label className="text-slate-400">Username (Immutable)</label>
                <input
                  type="text"
                  disabled
                  value={selectedUser.username}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-400 font-mono text-xs cursor-not-allowed"
                />
              </div>

              <div className="space-y-1">
                <label className="text-slate-300 font-medium">Full Name & Station Designation</label>
                <input
                  type="text"
                  required
                  value={editFullName}
                  onChange={(e) => setEditFullName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-cyan-500 font-sans text-xs"
                />
              </div>

              <div className="space-y-1">
                <label className="text-slate-300 font-medium">Assigned System Role</label>
                <select
                  value={editRole}
                  onChange={(e) => handleEditRoleChange(e.target.value as UserRole)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-cyan-500 font-mono text-xs"
                >
                  <option value="operator">Authorized Operator</option>
                  <option value="administrator">Administrator</option>
                  {currentUser.role === 'super_admin' && (
                    <option value="super_admin">Super Admin</option>
                  )}
                </select>
              </div>

              {/* Explicit Permissions */}
              <div className="p-3 bg-slate-950 border border-slate-800 rounded-lg space-y-2">
                <label className="block text-[11px] font-bold text-slate-300 uppercase">
                  Explicit System Permissions:
                </label>
                <div className="grid grid-cols-2 gap-2 text-[11px] font-sans">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={editPermissions.canManageUsers}
                      onChange={(e) => setEditPermissions(p => ({ ...p, canManageUsers: e.target.checked }))}
                      className="rounded bg-slate-900 border-slate-700 text-cyan-600"
                    />
                    <span className="text-slate-300">Manage Users</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={editPermissions.canEditRecords}
                      onChange={(e) => setEditPermissions(p => ({ ...p, canEditRecords: e.target.checked }))}
                      className="rounded bg-slate-900 border-slate-700 text-cyan-600"
                    />
                    <span className="text-slate-300">Edit Records</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={editPermissions.canDeleteRecords}
                      onChange={(e) => setEditPermissions(p => ({ ...p, canDeleteRecords: e.target.checked }))}
                      className="rounded bg-slate-900 border-slate-700 text-cyan-600"
                    />
                    <span className="text-slate-300">Delete Records</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={editPermissions.canVerifyDocuments}
                      onChange={(e) => setEditPermissions(p => ({ ...p, canVerifyDocuments: e.target.checked }))}
                      className="rounded bg-slate-900 border-slate-700 text-cyan-600"
                    />
                    <span className="text-slate-300">Verify Documents</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={editPermissions.canExportBackup}
                      onChange={(e) => setEditPermissions(p => ({ ...p, canExportBackup: e.target.checked }))}
                      className="rounded bg-slate-900 border-slate-700 text-cyan-600"
                    />
                    <span className="text-slate-300">Export & Backup</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={editPermissions.canUnmaskAadhaar}
                      onChange={(e) => setEditPermissions(p => ({ ...p, canUnmaskAadhaar: e.target.checked }))}
                      className="rounded bg-slate-900 border-slate-700 text-cyan-600"
                    />
                    <span className="text-slate-300">Unmask Aadhaar</span>
                  </label>
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Save Changes</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: Reset Password */}
      {isResetModalOpen && selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Key className="w-4 h-4 text-cyan-400" />
                <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono">
                  Administrative Password Reset
                </h3>
              </div>
              <button
                onClick={() => setIsResetModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-300 font-mono">
              Resetting password for: <strong className="text-cyan-300 font-bold">{selectedUser.username}</strong> ({selectedUser.fullName})
            </p>

            {resetError && (
              <div className="p-3 bg-rose-950/70 border border-rose-800 rounded-lg text-rose-300 text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400" />
                <span>{resetError}</span>
              </div>
            )}

            <form onSubmit={handleExecutePasswordReset} className="space-y-4 text-xs font-mono">
              <div className="space-y-1">
                <label className="text-slate-300 font-medium">New Password <span className="text-rose-400">*</span></label>
                <input
                  type="password"
                  required
                  value={resetPasswordValue}
                  onChange={(e) => setResetPasswordValue(e.target.value)}
                  placeholder="Min 6 characters"
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-cyan-500 font-mono text-xs"
                />
              </div>

              <div className="space-y-1">
                <label className="text-slate-300 font-medium">Confirm New Password <span className="text-rose-400">*</span></label>
                <input
                  type="password"
                  required
                  value={resetConfirmValue}
                  onChange={(e) => setResetConfirmValue(e.target.value)}
                  placeholder="Repeat new password"
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-cyan-500 font-mono text-xs"
                />
              </div>

              <label className="flex items-center gap-2 p-2.5 rounded bg-slate-950 border border-slate-800 cursor-pointer">
                <input
                  type="checkbox"
                  checked={resetMustChangePassword}
                  onChange={(e) => setResetMustChangePassword(e.target.checked)}
                  className="rounded bg-slate-900 border-slate-700 text-cyan-600"
                />
                <span className="text-xs text-slate-300">
                  Require user to change password after logging in with this temporary password
                </span>
              </label>

              <div className="pt-2 flex justify-end gap-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsResetModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5"
                >
                  <Key className="w-3.5 h-3.5" />
                  <span>Update Password</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 4: Deactivation Confirmation */}
      {isDeactivateConfirmOpen && selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-amber-400">
              <AlertTriangle className="w-6 h-6 shrink-0" />
              <h3 className="text-sm font-bold text-white uppercase font-mono">
                Confirm Account Status Change
              </h3>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed font-sans">
              Are you sure you want to {selectedUser.status === 'active' ? 'deactivate' : 'activate'} the account for{' '}
              <strong className="text-white font-mono">{selectedUser.username}</strong> ({selectedUser.fullName})?
              {selectedUser.status === 'active' && (
                <span className="block mt-2 text-rose-300">
                  Deactivated users cannot log in to the ORACLIME DMS system or access any dossiers.
                </span>
              )}
            </p>

            <div className="pt-2 flex justify-end gap-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setIsDeactivateConfirmOpen(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleExecuteToggleStatus}
                className={`px-4 py-2 rounded-lg text-xs font-semibold ${
                  selectedUser.status === 'active'
                    ? 'bg-rose-600 hover:bg-rose-500 text-white'
                    : 'bg-emerald-600 hover:bg-emerald-500 text-white'
                }`}
              >
                {selectedUser.status === 'active' ? 'Confirm Deactivation' : 'Confirm Activation'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 5: Permanently Delete User Account (Requires Reason & Explicit Confirmation) */}
      {isPermanentDeleteOpen && selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-slate-900 border-2 border-rose-700/80 rounded-xl max-w-lg w-full p-6 shadow-2xl space-y-4 my-auto">
            <div className="flex items-start justify-between gap-3 pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2.5 text-rose-400">
                <div className="p-2 rounded-lg bg-rose-950/90 border border-rose-700/70">
                  <Trash2 className="w-5 h-5 text-rose-400 shrink-0" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white uppercase font-mono tracking-wider">
                    Permanently Delete Application User Account
                  </h3>
                  <p className="text-[11px] text-rose-300/90 font-sans">
                    Irreversible removal · Distinct from temporary account deactivation
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsPermanentDeleteOpen(false)}
                className="text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Target Account Summary */}
            <div className="p-3.5 rounded-lg bg-slate-950 border border-slate-800 space-y-1.5 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-400 font-mono">Username / Login ID:</span>
                <span className="font-mono font-bold text-cyan-300">{selectedUser.username}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400 font-mono">Full Name:</span>
                <span className="font-semibold text-white">{selectedUser.fullName}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400 font-mono">Assigned Role:</span>
                <span className="font-mono uppercase text-slate-200">{selectedUser.role}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-400 font-mono">Current Status:</span>
                <span className={`font-mono uppercase font-bold ${selectedUser.status === 'active' ? 'text-emerald-400' : 'text-amber-400'}`}>
                  {selectedUser.status}
                </span>
              </div>
            </div>

            {/* Data Integrity & Linked Dependencies Notice */}
            <div className="p-3 rounded-lg bg-cyan-950/30 border border-cyan-800/60 text-[11px] text-slate-200 space-y-1">
              <div className="font-bold text-cyan-300 font-mono uppercase flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                <span>Data Integrity & Linked Records Protection</span>
              </div>
              <p className="text-slate-300 leading-relaxed">
                Deleting this login account will <strong className="text-white">NOT</strong> delete any Technician or Partner dossiers, uploaded KYC documents, or historical security audit logs:
              </p>
              <ul className="list-disc list-inside text-slate-300 font-mono text-[10px] space-y-0.5 pt-0.5">
                <li>
                  Linked Dossiers Reviewed / Modified by User: <strong className="text-cyan-300">{deleteUserDeps.reviewedRecordsCount} record(s)</strong> (Preserved intact)
                </li>
                <li>
                  Historical Security Audit Trail Entries: <strong className="text-cyan-300">{deleteUserDeps.auditEventsCount} event(s)</strong> (Retained for compliance)
                </li>
              </ul>
            </div>

            {deleteUserError && (
              <div className="p-3 bg-rose-950/80 border border-rose-700 rounded-lg text-rose-200 text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400" />
                <span>{deleteUserError}</span>
              </div>
            )}

            <form onSubmit={handleExecutePermanentDelete} className="space-y-4 text-xs">
              {/* Preset Reason Selection */}
              <div className="space-y-2">
                <label className="block text-slate-200 font-bold font-mono uppercase text-[11px]">
                  1. Select Mandatory Reason for Permanent Deletion <span className="text-rose-400">*</span>
                </label>
                <div className="space-y-1.5">
                  {USER_DELETION_PRESET_REASONS.map((preset) => (
                    <label
                      key={preset}
                      className={`flex items-center gap-2.5 p-2.5 rounded-lg border cursor-pointer transition-colors ${
                        deleteReasonPreset === preset
                          ? 'bg-rose-950/50 border-rose-500 text-white'
                          : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700'
                      }`}
                    >
                      <input
                        type="radio"
                        name="userDeleteReasonPreset"
                        value={preset}
                        checked={deleteReasonPreset === preset}
                        onChange={() => {
                          setDeleteReasonPreset(preset);
                          setDeleteUserError('');
                        }}
                        className="accent-rose-500"
                      />
                      <span className="text-xs font-medium">
                        {preset === 'Other' ? 'Other (Require written explanation)' : preset}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Written explanation input (Required for 'Other', optional note for presets) */}
              {deleteReasonPreset && (
                <div className="space-y-1">
                  <label className="block text-[11px] font-mono text-slate-300">
                    {deleteReasonPreset === 'Other' ? (
                      <>Written Explanation <span className="text-rose-400">* (Required)</span></>
                    ) : (
                      'Additional Administrative Context (Optional)'
                    )}
                  </label>
                  <input
                    type="text"
                    required={deleteReasonPreset === 'Other'}
                    value={deleteReasonCustom}
                    onChange={(e) => setDeleteReasonCustom(e.target.value)}
                    placeholder={
                      deleteReasonPreset === 'Other'
                        ? 'Enter detailed reason for permanently deleting this account...'
                        : 'Optional reference note or ticket ID...'
                    }
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:border-rose-500 text-xs"
                  />
                </div>
              )}

              {/* Consequences & Selected Reason Summary Box before Final Confirmation */}
              {resolvedDeleteReason && (
                <div className="p-3.5 rounded-lg bg-rose-950/40 border border-rose-700/70 space-y-2">
                  <div className="text-[11px] font-mono uppercase font-bold text-rose-300">
                    2. Review Selected Reason & Consequences Before Final Confirmation
                  </div>
                  <div className="text-xs text-slate-200 bg-slate-950/90 p-2.5 rounded border border-rose-800/60 font-mono">
                    <span className="text-slate-400">Recorded Audit Reason: </span>
                    <strong className="text-rose-200">{resolvedDeleteReason}</strong>
                  </div>
                  <ul className="text-[11px] text-rose-200/90 space-y-1 list-disc list-inside leading-relaxed">
                    <li>
                      Account <strong className="font-mono text-white">{selectedUser.username}</strong> will be permanently removed and can never authenticate again.
                    </li>
                    <li>
                      This action is logged in the immutable security audit log under your administrator identity (<strong className="font-mono text-white">{currentUser.username}</strong>).
                    </li>
                    <li>
                      If you only wish to temporarily suspend access, click Cancel and use <strong>Deactivate</strong> instead.
                    </li>
                  </ul>

                  <label className="flex items-start gap-2.5 pt-2 border-t border-rose-800/50 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={deleteAckConfirmed}
                      onChange={(e) => setDeleteAckConfirmed(e.target.checked)}
                      className="mt-0.5 accent-rose-500 rounded"
                    />
                    <span className="text-xs text-white font-semibold leading-snug">
                      I confirm permanent deletion of account <span className="font-mono text-rose-300">{selectedUser.username}</span> for the reason stated above.
                    </span>
                  </label>
                </div>
              )}

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsPermanentDeleteOpen(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!resolvedDeleteReason || !deleteAckConfirmed}
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-500 disabled:bg-rose-950 disabled:text-rose-400/50 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer disabled:cursor-not-allowed"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Confirm Permanent Account Deletion</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
