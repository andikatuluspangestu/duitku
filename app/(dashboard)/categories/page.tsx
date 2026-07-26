'use client';

import React, { useEffect, useState } from 'react';
import { Plus, Edit2, Trash2, Loader2, X, Lock, CheckCircle } from 'lucide-react';
import { CategoryItem, TransactionType, UserSession } from '@/lib/types';
import { useToast } from '@/components/ui/ToastContext';
import { ConfirmModal } from '@/components/ui/ConfirmModal';

export default function CategoriesPage() {
  const { showToast } = useToast();
  const [currentUser, setCurrentUser] = useState<UserSession | null>(null);

  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCat, setEditingCat] = useState<CategoryItem | null>(null);

  // Confirm Modal State
  const [deleteTargetCat, setDeleteTargetCat] = useState<CategoryItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const [name, setName] = useState('');
  const [type, setType] = useState<TransactionType>('INCOME');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/auth/me')
      .then((r) => r.json())
      .then((data) => {
        if (data.authenticated) setCurrentUser(data.user);
      });
  }, []);

  const fetchCategories = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/categories');
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Gagal memuat kategori');
      setCategories(data.data);
    } catch (err: any) {
      showToast(err.message, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const isAdmin = currentUser?.role === 'ADMIN' || currentUser?.role === 'SUPERADMIN';

  const openCreateModal = () => {
    setEditingCat(null);
    setName('');
    setType('INCOME');
    setErrorMsg(null);
    setIsModalOpen(true);
  };

  const openEditModal = (cat: CategoryItem) => {
    setEditingCat(cat);
    setName(cat.name);
    setType(cat.type);
    setErrorMsg(null);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrorMsg('Nama kategori wajib diisi');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);

    try {
      const url = editingCat ? `/api/categories/${editingCat.id}` : '/api/categories';
      const method = editingCat ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), type }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Gagal menyimpan kategori');

      showToast(editingCat ? 'Kategori berhasil diperbarui' : 'Kategori baru berhasil dibuat', 'success');
      setIsModalOpen(false);
      fetchCategories();
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const onRequestDelete = (cat: CategoryItem) => {
    if (cat._count && cat._count.transactions > 0) {
      showToast('Kategori ini tidak dapat dihapus karena sudah digunakan dalam transaksi', 'error');
      return;
    }
    setDeleteTargetCat(cat);
  };

  const confirmDelete = async () => {
    if (!deleteTargetCat) return;
    setIsDeleting(true);

    try {
      const res = await fetch(`/api/categories/${deleteTargetCat.id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Gagal menghapus kategori');

      showToast('Kategori berhasil dihapus', 'success');
      setDeleteTargetCat(null);
      fetchCategories();
    } catch (err: any) {
      showToast(err.message, 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  const incomeCategories = categories.filter((c) => c.type === 'INCOME');
  const expenseCategories = categories.filter((c) => c.type === 'EXPENSE');

  return (
    <div className="space-y-4 sm:space-y-6 animate-in fade-in duration-300">
      {/* Top Header */}
      <div className="flex items-center justify-between border-b border-[#ebebeb] dark:border-[#262626] pb-4">
        <div>
          <span className="font-caption-mono text-[11px] text-[#ff0080] dark:text-[#ff0080] font-semibold">KATEGORI TRANSAKSI</span>
          <h1 className="text-xl sm:text-2xl font-bold text-[#171717] dark:text-[#ffffff] tracking-tight">Manajemen Kategori</h1>
        </div>

        {isAdmin ? (
          <button onClick={openCreateModal} className="vercel-button-primary py-2 text-xs">
            <Plus className="w-4 h-4" />
            <span>Kategori Baru</span>
          </button>
        ) : (
          <div className="flex items-center gap-1 px-3 py-1 rounded-full bg-[#f5a623]/10 border border-[#f5a623]/30 text-[#f5a623] font-caption-mono text-[10px]">
            <Lock className="w-3 h-3" />
            <span>MODE LIHAT</span>
          </div>
        )}
      </div>

      {/* Grid Categories */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
        {/* Income Categories */}
        <div className="vercel-card p-5 sm:p-6">
          <div className="flex items-center justify-between mb-4 border-b border-[#ebebeb] dark:border-[#262626] pb-3">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-[#50e3c2]" />
              <h3 className="text-base font-bold text-[#171717] dark:text-[#ffffff] tracking-tight">Pemasukan (Income)</h3>
            </div>
            <span className="vercel-badge-mono bg-[#50e3c2]/10 text-[#29bc9b] dark:text-[#50e3c2] border-[#50e3c2]/30 text-[10px]">
              {incomeCategories.length} Kategori
            </span>
          </div>

          <div className="space-y-2.5">
            {incomeCategories.length > 0 ? (
              incomeCategories.map((cat) => (
                <div
                  key={cat.id}
                  className="flex items-center justify-between p-3.5 rounded-lg bg-[#fafafa] dark:bg-[#171717] border border-[#ebebeb] dark:border-[#262626] hover:border-[#a1a1a1] dark:hover:border-[#404040] transition-colors"
                >
                  <div>
                    <p className="text-xs font-semibold text-[#171717] dark:text-[#ffffff]">{cat.name}</p>
                    <p className="font-caption-mono text-[10px] text-[#888888] dark:text-[#737373] mt-0.5">
                      Dipakai: {cat._count?.transactions || 0} Transaksi
                    </p>
                  </div>
                  {isAdmin && (
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => openEditModal(cat)}
                        className="p-1.5 rounded-md text-[#4d4d4d] dark:text-[#a1a1a1] hover:text-[#171717] dark:hover:text-[#ffffff] hover:bg-[#ebebeb] dark:hover:bg-[#262626] transition-colors"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => onRequestDelete(cat)}
                        className="p-1.5 rounded-md text-[#4d4d4d] dark:text-[#a1a1a1] hover:text-[#ee0000] dark:hover:text-[#ee0000] hover:bg-[#ee0000]/10 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              ))
            ) : (
              <p className="font-caption-mono text-xs text-[#888888] dark:text-[#737373] py-6 text-center">Belum ada kategori pemasukan.</p>
            )}
          </div>
        </div>

        {/* Expense Categories */}
        <div className="vercel-card p-5 sm:p-6">
          <div className="flex items-center justify-between mb-4 border-b border-[#ebebeb] dark:border-[#262626] pb-3">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-[#ee0000]" />
              <h3 className="text-base font-bold text-[#171717] dark:text-[#ffffff] tracking-tight">Pengeluaran (Expense)</h3>
            </div>
            <span className="vercel-badge-mono bg-[#ee0000]/10 text-[#ee0000] border-[#ee0000]/30 text-[10px]">
              {expenseCategories.length} Kategori
            </span>
          </div>

          <div className="space-y-2.5">
            {expenseCategories.length > 0 ? (
              expenseCategories.map((cat) => (
                <div
                  key={cat.id}
                  className="flex items-center justify-between p-3.5 rounded-lg bg-[#fafafa] dark:bg-[#171717] border border-[#ebebeb] dark:border-[#262626] hover:border-[#a1a1a1] dark:hover:border-[#404040] transition-colors"
                >
                  <div>
                    <p className="text-xs font-semibold text-[#171717] dark:text-[#ffffff]">{cat.name}</p>
                    <p className="font-caption-mono text-[10px] text-[#888888] dark:text-[#737373] mt-0.5">
                      Dipakai: {cat._count?.transactions || 0} Transaksi
                    </p>
                  </div>
                  {isAdmin && (
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => openEditModal(cat)}
                        className="p-1.5 rounded-md text-[#4d4d4d] dark:text-[#a1a1a1] hover:text-[#171717] dark:hover:text-[#ffffff] hover:bg-[#ebebeb] dark:hover:bg-[#262626] transition-colors"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => onRequestDelete(cat)}
                        className="p-1.5 rounded-md text-[#4d4d4d] dark:text-[#a1a1a1] hover:text-[#ee0000] dark:hover:text-[#ee0000] hover:bg-[#ee0000]/10 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              ))
            ) : (
              <p className="font-caption-mono text-xs text-[#888888] dark:text-[#737373] py-6 text-center">Belum ada kategori pengeluaran.</p>
            )}
          </div>
        </div>
      </div>

      {/* Category Create/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-[#ffffff] dark:bg-[#0a0a0a] border-t sm:border border-[#ebebeb] dark:border-[#262626] rounded-t-2xl sm:rounded-xl w-full max-w-md shadow-2xl overflow-hidden animate-in slide-in-from-bottom sm:zoom-in duration-200 text-[#171717] dark:text-[#ffffff]">
            <div className="px-5 py-4 border-b border-[#ebebeb] dark:border-[#262626] flex items-center justify-between bg-[#fafafa] dark:bg-[#000000]">
              <h3 className="text-base font-bold text-[#171717] dark:text-[#ffffff]">
                {editingCat ? 'Edit Kategori' : 'Tambah Kategori Baru'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-[#888888] dark:text-[#a1a1a1] hover:text-[#171717] dark:hover:text-[#ffffff] p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-4">
              {errorMsg && (
                <div className="p-3.5 rounded-md bg-[#ee0000]/10 border border-[#ee0000]/30 text-[#ee0000] text-xs font-caption-mono">
                  {errorMsg}
                </div>
              )}

              <div>
                <label className="block font-caption-mono text-[11px] text-[#4d4d4d] dark:text-[#a1a1a1] uppercase tracking-wider mb-2 font-semibold">
                  Jenis Transaksi *
                </label>
                <div className="grid grid-cols-2 gap-2 p-1.5 bg-[#f5f5f5] dark:bg-[#171717] rounded-lg border border-[#ebebeb] dark:border-[#262626]">
                  <button
                    type="button"
                    onClick={() => setType('INCOME')}
                    className={`py-2 rounded-md text-xs font-caption-mono font-semibold ${
                      type === 'INCOME' ? 'bg-[#ffffff] dark:bg-[#000000] text-[#29bc9b] dark:text-[#50e3c2] border border-[#50e3c2]/30' : 'text-[#888888] dark:text-[#a1a1a1]'
                    }`}
                  >
                    PEMASUKAN
                  </button>
                  <button
                    type="button"
                    onClick={() => setType('EXPENSE')}
                    className={`py-2 rounded-md text-xs font-caption-mono font-semibold ${
                      type === 'EXPENSE' ? 'bg-[#ffffff] dark:bg-[#000000] text-[#ee0000] border border-[#ee0000]/30' : 'text-[#888888] dark:text-[#a1a1a1]'
                    }`}
                  >
                    PENGELUARAN
                  </button>
                </div>
              </div>

              <div>
                <label className="block font-caption-mono text-[11px] text-[#4d4d4d] dark:text-[#a1a1a1] uppercase tracking-wider mb-2 font-semibold">
                  Nama Kategori *
                </label>
                <input
                  type="text"
                  required
                  placeholder="cth: Penjualan, Operasional"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full vercel-input text-sm"
                />
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
                  <span>Simpan Kategori</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirm Delete Category Modal */}
      <ConfirmModal
        isOpen={Boolean(deleteTargetCat)}
        onClose={() => setDeleteTargetCat(null)}
        onConfirm={confirmDelete}
        title="Hapus Kategori Transaksi"
        message={`Apakah Anda yakin ingin menghapus kategori "${deleteTargetCat?.name}"? Tindakan ini tidak dapat dibatalkan.`}
        confirmText="Hapus Kategori"
        cancelText="Batal"
        variant="danger"
        isLoading={isDeleting}
      />
    </div>
  );
}
