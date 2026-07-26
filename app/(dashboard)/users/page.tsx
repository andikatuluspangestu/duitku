'use client';

import React, { useEffect, useState } from 'react';
import { Plus, Edit2, Trash2, Loader2, X, CheckCircle, KeyRound, Sparkles } from 'lucide-react';
import { Role, UserItem, UserSession, ALL_PERMISSIONS } from '@/lib/types';
import { useToast } from '@/components/ui/ToastContext';
import { ConfirmModal } from '@/components/ui/ConfirmModal';

export default function UsersPage() {
  const { showToast } = useToast();
  const [currentUser, setCurrentUser] = useState<UserSession | null>(null);

  const [users, setUsers] = useState<UserItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserItem | null>(null);

  // Confirm Delete User State
  const [deleteTargetUser, setDeleteTargetUser] = useState<UserItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const [name, setName] = useState('');
  const [userCode, setUserCode] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<Role>('USER');
  const [isActive, setIsActive] = useState(true);
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/auth/me')
      .then((r) => r.json())
      .then((data) => {
        if (data.authenticated) setCurrentUser(data.user);
      });
  }, []);

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/users');
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Gagal memuat pengguna');
      setUsers(data.data);
    } catch (err: any) {
      showToast(err.message, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const generateNextUserCode = (existingUsers: UserItem[]): string => {
    let maxNum = 0;
    existingUsers.forEach((u) => {
      if (u.userCode) {
        const match = u.userCode.match(/^USR(\d+)$/i);
        if (match) {
          const num = parseInt(match[1], 10);
          if (num > maxNum) maxNum = num;
        }
      }
    });
    const nextNum = maxNum + 1;
    return `USR${nextNum.toString().padStart(3, '0')}`;
  };

  const getDefaultPermissionsForRole = (r: Role): string[] => {
    if (r === 'SUPERADMIN') return ALL_PERMISSIONS.map((p) => p.key);
    if (r === 'ADMIN') return ALL_PERMISSIONS.map((p) => p.key).filter((k) => k !== 'can_manage_users');
    return ['can_view_dashboard', 'can_view_transactions', 'can_view_categories'];
  };

  const handleRoleChange = (newRole: Role) => {
    setRole(newRole);
    setSelectedPermissions(getDefaultPermissionsForRole(newRole));
  };

  const togglePermission = (key: string) => {
    setSelectedPermissions((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );
  };

  const openCreateModal = () => {
    setEditingUser(null);
    setName('');
    const autoCode = generateNextUserCode(users);
    setUserCode(autoCode);
    setPassword('');
    setRole('USER');
    setIsActive(true);
    setSelectedPermissions(getDefaultPermissionsForRole('USER'));
    setErrorMsg(null);
    setIsModalOpen(true);
  };

  const openEditModal = (u: UserItem) => {
    setEditingUser(u);
    setName(u.name);
    setUserCode(u.userCode);
    setPassword('');
    setRole(u.role);
    setIsActive(u.isActive);
    setSelectedPermissions(u.permissions || getDefaultPermissionsForRole(u.role));
    setErrorMsg(null);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!name.trim()) {
      setErrorMsg('Nama pengguna wajib diisi');
      return;
    }
    if (!userCode.trim()) {
      setErrorMsg('Kode user wajib diisi');
      return;
    }
    if (!editingUser && (!password || password.length < 6)) {
      setErrorMsg('Password minimal 6 karakter');
      return;
    }

    setIsSubmitting(true);

    try {
      const url = editingUser ? `/api/users/${editingUser.id}` : '/api/users';
      const method = editingUser ? 'PUT' : 'POST';

      const payload = {
        name: name.trim(),
        userCode: userCode.trim().toUpperCase(),
        role,
        isActive,
        permissions: selectedPermissions,
        ...(password ? { password } : {}),
      };

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Gagal menyimpan pengguna');

      showToast(editingUser ? 'Data pengguna & hak akses berhasil diperbarui' : `Pengguna baru ${payload.userCode} berhasil ditambahkan`, 'success');
      setIsModalOpen(false);
      fetchUsers();
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleActive = async (u: UserItem) => {
    try {
      const res = await fetch(`/api/users/${u.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !u.isActive }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Gagal mengubah status pengguna');

      showToast(`Status pengguna ${u.name} berhasil diubah`, 'info');
      fetchUsers();
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  const onRequestDelete = (u: UserItem) => {
    if (u.id === currentUser?.id) {
      showToast('Anda tidak dapat menghapus akun Anda sendiri', 'error');
      return;
    }
    setDeleteTargetUser(u);
  };

  const confirmDeleteUser = async () => {
    if (!deleteTargetUser) return;
    setIsDeleting(true);

    try {
      const res = await fetch(`/api/users/${deleteTargetUser.id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Gagal menghapus pengguna');

      showToast('Pengguna berhasil dihapus', 'success');
      setDeleteTargetUser(null);
      fetchUsers();
    } catch (err: any) {
      showToast(err.message, 'error');
    } flex: {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6 animate-in fade-in duration-300">
      {/* Top Header */}
      <div className="flex items-center justify-between border-b border-[#ebebeb] dark:border-[#262626] pb-4">
        <div>
          <span className="font-caption-mono text-xs text-[#0070f3] dark:text-[#50e3c2] font-semibold">HAK AKSES PENGGUNA</span>
          <h1 className="text-xl sm:text-2xl font-bold text-[#171717] dark:text-[#ffffff] tracking-tight">Pengguna &amp; Matriks Hak Akses</h1>
        </div>

        <button onClick={openCreateModal} className="vercel-button-primary py-2 text-xs">
          <Plus className="w-4 h-4" />
          <span>Tambah Pengguna</span>
        </button>
      </div>

      {/* Mobile Feed */}
      <div className="sm:hidden space-y-3">
        {isLoading ? (
          <div className="py-12 text-center text-[#888888] dark:text-[#a1a1a1] bg-[#ffffff] dark:bg-[#0a0a0a] rounded-xl border border-[#ebebeb] dark:border-[#262626]">
            <Loader2 className="w-5 h-5 text-[#0070f3] animate-spin mx-auto mb-2" />
            <span className="font-caption-mono text-xs">Memuat data pengguna...</span>
          </div>
        ) : users.length > 0 ? (
          users.map((u) => (
            <div key={u.id} className="p-4 rounded-xl bg-[#ffffff] dark:bg-[#0a0a0a] border border-[#ebebeb] dark:border-[#262626] space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-[#171717] dark:text-[#ffffff]">{u.name}</h4>
                  <p className="font-caption-mono text-xs text-[#0070f3] dark:text-[#50e3c2] font-semibold">KODE: {u.userCode}</p>
                </div>
                <button
                  onClick={() => handleToggleActive(u)}
                  className={`vercel-badge-mono text-[9px] ${
                    u.isActive
                      ? 'bg-[#50e3c2]/10 text-[#29bc9b] dark:text-[#50e3c2] border-[#50e3c2]/30'
                      : 'bg-[#ee0000]/10 text-[#ee0000] border-[#ee0000]/30'
                  }`}
                >
                  {u.isActive ? 'AKTIF' : 'NONAKTIF'}
                </button>
              </div>

              <div className="pt-2 border-t border-[#ebebeb] dark:border-[#262626] flex items-center justify-between">
                {u.role === 'SUPERADMIN' ? (
                  <span className="vercel-badge-mono bg-[#ff0080]/10 text-[#ff0080] border-[#ff0080]/30 text-[9px]">
                    SUPERADMIN
                  </span>
                ) : u.role === 'ADMIN' ? (
                  <span className="vercel-badge-mono bg-[#0070f3]/10 text-[#0070f3] border-[#0070f3]/30 text-[9px]">
                    ADMIN
                  </span>
                ) : (
                  <span className="vercel-badge-mono bg-[#f5a623]/10 text-[#f5a623] border-[#f5a623]/30 text-[9px]">
                    USER (LIHAT)
                  </span>
                )}

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => openEditModal(u)}
                    className="p-1.5 rounded bg-[#fafafa] dark:bg-[#171717] text-[#4d4d4d] dark:text-[#a1a1a1] hover:text-[#171717] dark:hover:text-[#ffffff] border border-[#ebebeb] dark:border-[#262626]"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => onRequestDelete(u)}
                    disabled={u.id === currentUser?.id}
                    className="p-1.5 rounded bg-[#fafafa] dark:bg-[#171717] text-[#4d4d4d] dark:text-[#a1a1a1] hover:text-[#ee0000] border border-[#ebebeb] dark:border-[#262626] disabled:opacity-20"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="py-8 text-center font-caption-mono text-xs text-[#888888] dark:text-[#737373] bg-[#ffffff] dark:bg-[#0a0a0a] rounded-xl border border-[#ebebeb] dark:border-[#262626]">
            Belum ada pengguna terdaftar.
          </div>
        )}
      </div>

      {/* Desktop Users Table */}
      <div className="hidden sm:block vercel-card p-6">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[#ebebeb] dark:border-[#262626] font-caption-mono text-[11px] text-[#888888] dark:text-[#a1a1a1] uppercase tracking-wider bg-[#fafafa] dark:bg-[#000000]">
                <th className="py-3 px-4">KODE USER</th>
                <th className="py-3 px-4">NAMA LENGKAP</th>
                <th className="py-3 px-4 text-center">ROLE</th>
                <th className="py-3 px-4 text-center">HAK AKSES DIIZINKAN</th>
                <th className="py-3 px-4 text-center">STATUS</th>
                <th className="py-3 px-4 text-center">AKSI</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#ebebeb] dark:divide-[#262626] text-xs font-sans">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-[#888888] dark:text-[#a1a1a1]">
                    <Loader2 className="w-5 h-5 text-[#0070f3] animate-spin mx-auto mb-2" />
                    <span className="font-caption-mono text-xs">Memuat data pengguna...</span>
                  </td>
                </tr>
              ) : users.length > 0 ? (
                users.map((u) => (
                  <tr key={u.id} className="hover:bg-[#fafafa] dark:hover:bg-[#171717]/50 transition-colors">
                    <td className="py-3.5 px-4 font-caption-mono font-bold text-[#0070f3] dark:text-[#50e3c2]">{u.userCode}</td>
                    <td className="py-3.5 px-4 font-bold text-[#171717] dark:text-[#ffffff]">{u.name}</td>
                    <td className="py-3.5 px-4 text-center">
                      {u.role === 'SUPERADMIN' ? (
                        <span className="vercel-badge-mono bg-[#ff0080]/10 text-[#ff0080] border-[#ff0080]/30">
                          SUPERADMIN
                        </span>
                      ) : u.role === 'ADMIN' ? (
                        <span className="vercel-badge-mono bg-[#0070f3]/10 text-[#0070f3] border-[#0070f3]/30">
                          ADMIN
                        </span>
                      ) : (
                        <span className="vercel-badge-mono bg-[#f5a623]/10 text-[#f5a623] border-[#f5a623]/30">
                          USER
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-center font-caption-mono text-xs text-[#4d4d4d] dark:text-[#a1a1a1]">
                      {u.role === 'SUPERADMIN' ? (
                        <span className="text-[#ff0080] font-bold">Semua Fitur (Full Access)</span>
                      ) : (
                        <span>{u.permissions ? u.permissions.length : 0} Dari 8 Centang Akses</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <button
                        onClick={() => handleToggleActive(u)}
                        className={`vercel-badge-mono cursor-pointer transition-all ${
                          u.isActive
                            ? 'bg-[#50e3c2]/10 text-[#29bc9b] dark:text-[#50e3c2] border-[#50e3c2]/30'
                            : 'bg-[#ee0000]/10 text-[#ee0000] border-[#ee0000]/30'
                        }`}
                      >
                        {u.isActive ? 'AKTIF' : 'NONAKTIF'}
                      </button>
                    </td>
                    <td className="py-3.5 px-4 text-center whitespace-nowrap">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => openEditModal(u)}
                          className="p-1.5 rounded text-[#4d4d4d] dark:text-[#a1a1a1] hover:text-[#171717] dark:hover:text-[#ffffff] hover:bg-[#fafafa] dark:hover:bg-[#171717] transition-colors"
                          title="Edit Pengguna & Hak Akses"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => onRequestDelete(u)}
                          disabled={u.id === currentUser?.id}
                          className="p-1.5 rounded text-[#4d4d4d] dark:text-[#a1a1a1] hover:text-[#ee0000] hover:bg-[#ee0000]/10 transition-colors disabled:opacity-20"
                          title="Hapus Pengguna"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="py-8 text-center font-caption-mono text-xs text-[#888888] dark:text-[#737373]">
                    Belum ada pengguna terdaftar.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Granular Hak Akses & User Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 overflow-y-auto">
          <div className="bg-[#ffffff] dark:bg-[#0a0a0a] border-t sm:border border-[#ebebeb] dark:border-[#262626] rounded-t-2xl sm:rounded-xl w-full max-w-lg shadow-2xl overflow-hidden max-h-[92vh] sm:max-h-none flex flex-col animate-in slide-in-from-bottom sm:zoom-in duration-200 text-[#171717] dark:text-[#ffffff]">
            <div className="px-5 py-4 border-b border-[#ebebeb] dark:border-[#262626] flex items-center justify-between bg-[#fafafa] dark:bg-[#000000]">
              <h3 className="text-base font-bold text-[#171717] dark:text-[#ffffff] flex items-center gap-2">
                <KeyRound className="w-4 h-4 text-[#0070f3]" />
                <span>{editingUser ? 'Edit Pengguna & Hak Akses' : 'Tambah Pengguna Baru'}</span>
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-[#888888] dark:text-[#a1a1a1] hover:text-[#171717] dark:hover:text-[#ffffff] p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-4 overflow-y-auto flex-1">
              {errorMsg && (
                <div className="p-3.5 rounded-md bg-[#ee0000]/10 border border-[#ee0000]/30 text-[#ee0000] text-xs font-caption-mono">
                  {errorMsg}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block font-caption-mono text-[11px] text-[#4d4d4d] dark:text-[#a1a1a1] uppercase tracking-wider font-semibold">
                      Kode User (Otomatis) *
                    </label>
                    {!editingUser && (
                      <button
                        type="button"
                        onClick={() => setUserCode(generateNextUserCode(users))}
                        className="font-caption-mono text-[10px] text-[#0070f3] dark:text-[#50e3c2] hover:underline flex items-center gap-0.5 font-bold"
                        title="Generate Ulang Kode User"
                      >
                        <Sparkles className="w-3 h-3" />
                        <span>Auto</span>
                      </button>
                    )}
                  </div>
                  <input
                    type="text"
                    required
                    placeholder="cth: USR002"
                    value={userCode}
                    onChange={(e) => setUserCode(e.target.value)}
                    className="w-full vercel-input text-sm font-mono font-bold uppercase"
                  />
                </div>

                <div>
                  <label className="block font-caption-mono text-[11px] text-[#4d4d4d] dark:text-[#a1a1a1] uppercase tracking-wider mb-1.5 font-semibold">
                    Nama Lengkap *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="cth: Kasir Toko A"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full vercel-input text-sm font-semibold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-caption-mono text-[11px] text-[#4d4d4d] dark:text-[#a1a1a1] uppercase tracking-wider mb-1.5 font-semibold">
                    {editingUser ? 'Password (Kosongkan jika sama)' : 'Password *'}
                  </label>
                  <input
                    type="password"
                    placeholder="Min 6 karakter"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full vercel-input text-sm"
                  />
                </div>

                <div>
                  <label className="block font-caption-mono text-[11px] text-[#4d4d4d] dark:text-[#a1a1a1] uppercase tracking-wider mb-1.5 font-semibold">
                    Peran Utama (Role) *
                  </label>
                  <select
                    value={role}
                    onChange={(e) => handleRoleChange(e.target.value as Role)}
                    className="w-full vercel-input text-sm font-bold text-[#0070f3]"
                  >
                    <option value="SUPERADMIN">SUPERADMIN (Pemilik Penuh)</option>
                    <option value="ADMIN">ADMIN (Pengelola Kasir)</option>
                    <option value="USER">USER (Viewer Kustom)</option>
                  </select>
                </div>
              </div>

              {/* Granular Permissions Section */}
              <div className="pt-2">
                <div className="flex items-center justify-between mb-2">
                  <label className="block font-caption-mono text-[11px] text-[#0070f3] dark:text-[#50e3c2] uppercase font-bold tracking-wider">
                    MATRIKS CENTANG HAK AKSES
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      if (selectedPermissions.length === ALL_PERMISSIONS.length) {
                        setSelectedPermissions([]);
                      } else {
                        setSelectedPermissions(ALL_PERMISSIONS.map((p) => p.key));
                      }
                    }}
                    className="font-caption-mono text-[10px] text-[#4d4d4d] dark:text-[#a1a1a1] hover:underline font-semibold"
                  >
                    {selectedPermissions.length === ALL_PERMISSIONS.length ? 'Hapus Semua' : 'Pilih Semua'}
                  </button>
                </div>

                <div className="bg-[#fafafa] dark:bg-[#000000] border border-[#ebebeb] dark:border-[#262626] rounded-lg p-3 space-y-2 max-h-48 overflow-y-auto">
                  {ALL_PERMISSIONS.map((perm) => {
                    const isChecked = selectedPermissions.includes(perm.key);
                    return (
                      <label
                        key={perm.key}
                        className="flex items-center justify-between p-2.5 rounded-md hover:bg-[#f5f5f5] dark:hover:bg-[#171717] cursor-pointer transition-colors border border-transparent"
                      >
                        <div className="flex items-center gap-2.5">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => togglePermission(perm.key)}
                            className="w-4 h-4 rounded text-[#0070f3] bg-[#ffffff] dark:bg-[#000000] border-[#ebebeb] dark:border-[#262626]"
                          />
                          <span className="text-xs text-[#171717] dark:text-[#ffffff] font-semibold">{perm.label}</span>
                        </div>
                        <span className="font-caption-mono text-[9px] text-[#0070f3] dark:text-[#50e3c2] font-bold uppercase bg-[#0070f3]/10 px-2 py-0.5 rounded-full border border-[#0070f3]/30">
                          {perm.category}
                        </span>
                      </label>
                    );
                  })}
                </div>
              </div>

              <div className="flex items-center gap-3 pt-1">
                <input
                  type="checkbox"
                  id="isActiveCheck"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  className="w-4 h-4 rounded text-[#0070f3] bg-[#ffffff] dark:bg-[#000000] border-[#ebebeb] dark:border-[#262626]"
                />
                <label htmlFor="isActiveCheck" className="font-caption-mono text-xs text-[#4d4d4d] dark:text-[#a1a1a1] font-semibold">
                  Status Akun Aktif
                </label>
              </div>

              <div className="pt-3 border-t border-[#ebebeb] dark:border-[#262626] flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="vercel-button-secondary py-2 text-xs flex-1 sm:flex-initial"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="vercel-button-primary py-2 text-xs flex-1 sm:flex-initial disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <CheckCircle className="w-4 h-4" />
                  )}
                  <span>Simpan Pengguna</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirm Delete User Modal */}
      <ConfirmModal
        isOpen={Boolean(deleteTargetUser)}
        onClose={() => setDeleteTargetUser(null)}
        onConfirm={confirmDeleteUser}
        title="Hapus Akun Pengguna"
        message={`Apakah Anda yakin ingin menghapus akun pengguna "${deleteTargetUser?.name}" (${deleteTargetUser?.userCode})? Pengguna ini tidak akan dapat login lagi ke dalam sistem.`}
        confirmText="Hapus Pengguna"
        cancelText="Batal"
        variant="danger"
        isLoading={isDeleting}
      />
    </div>
  );
}
