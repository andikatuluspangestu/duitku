'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Search,
  FileText,
  Edit2,
  Trash2,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  ChevronDown,
  Loader2,
  X,
  Lock,
  Filter,
} from 'lucide-react';
import { CategoryItem, TransactionItem, UserSession } from '@/lib/types';
import { formatDate, formatRupiah } from '@/lib/utils';
import { ProofViewerModal } from '@/components/transaction/ProofViewerModal';
import { ConfirmModal } from '@/components/ui/ConfirmModal';
import { useToast } from '@/components/ui/ToastContext';

export default function TransactionsPage() {
  const { showToast } = useToast();
  const [currentUser, setCurrentUser] = useState<UserSession | null>(null);

  const [transactions, setTransactions] = useState<TransactionItem[]>([]);
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Mobile Filter Drawer toggle
  const [showMobileFilter, setShowMobileFilter] = useState(false);

  // Pagination & Filtering state
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const [sortBy, setSortBy] = useState('transactionDate');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  const [selectedProofTrx, setSelectedProofTrx] = useState<TransactionItem | null>(null);

  // Custom Delete Confirm Modal State
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    fetch('/api/auth/me')
      .then((r) => r.json())
      .then((data) => {
        if (data.authenticated) setCurrentUser(data.user);
      });
  }, []);

  const fetchCategories = async () => {
    try {
      const res = await fetch('/api/categories');
      const data = await res.json();
      if (res.ok) setCategories(data.data);
    } catch {}
  };

  const fetchTransactions = async () => {
    setIsLoading(true);
    try {
      const query = new URLSearchParams({
        page: page.toString(),
        limit: '10',
        ...(search && { search }),
        ...(typeFilter && { type: typeFilter }),
        ...(categoryFilter && { categoryId: categoryFilter }),
        ...(dateFrom && { dateFrom }),
        ...(dateTo && { dateTo }),
        ...(sortBy && { sortBy }),
        ...(sortOrder && { sortOrder }),
      });

      const res = await fetch(`/api/transactions?${query.toString()}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Gagal memuat transaksi');

      setTransactions(data.data);
      setTotalPages(data.pagination.totalPages);
      setTotalCount(data.pagination.total);
    } catch (err: any) {
      showToast(err.message, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    fetchTransactions();
  }, [page, search, typeFilter, categoryFilter, dateFrom, dateTo, sortBy, sortOrder]);

  const isAdmin = currentUser?.role === 'ADMIN' || currentUser?.role === 'SUPERADMIN';

  const confirmDeleteTransaction = async () => {
    if (!deleteTargetId) return;
    setIsDeleting(true);

    try {
      const res = await fetch(`/api/transactions/${deleteTargetId}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Gagal menghapus transaksi');

      showToast('Transaksi berhasil dihapus', 'success');
      setDeleteTargetId(null);
      fetchTransactions();
    } catch (err: any) {
      showToast(err.message, 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleResetFilters = () => {
    setSearch('');
    setTypeFilter('');
    setCategoryFilter('');
    setDateFrom('');
    setDateTo('');
    setPage(1);
  };

  const handleSort = (column: string) => {
    if (sortBy === column) {
      setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortBy(column);
      setSortOrder(column === 'transactionDate' ? 'desc' : 'asc');
    }
    setPage(1);
  };

  const SortIcon = ({ column }: { column: string }) => {
    if (sortBy !== column) return null;
    return sortOrder === 'asc' ? (
      <ChevronUp className="w-3 h-3 inline-block ml-0.5" />
    ) : (
      <ChevronDown className="w-3 h-3 inline-block ml-0.5" />
    );
  };

  const hasActiveFilters = Boolean(search || typeFilter || categoryFilter || dateFrom || dateTo);

  return (
    <div className="space-y-4 sm:space-y-6 animate-in fade-in duration-300">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#ebebeb] dark:border-[#262626] pb-4">
        <div>
          <span className="font-caption-mono text-xs text-[#0070f3] dark:text-[#50e3c2] font-semibold">LOG BUKU KAS</span>
          <h1 className="text-xl sm:text-2xl font-bold text-[#171717] dark:text-[#ffffff] tracking-tight">Riwayat Transaksi</h1>
          <p className="font-caption-mono text-xs text-[#888888] dark:text-[#a1a1a1] mt-0.5">
            Total {totalCount} record transaksi terdaftar dalam sistem.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Mobile Filter Toggle */}
          <button
            onClick={() => setShowMobileFilter(!showMobileFilter)}
            className="sm:hidden vercel-button-secondary py-2 px-3 text-xs"
          >
            <Filter className="w-3.5 h-3.5" />
            <span>Filter</span>
            {hasActiveFilters && <span className="w-2 h-2 rounded-full bg-[#0070f3]" />}
          </button>

          {!isAdmin && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#f5a623]/10 border border-[#f5a623]/30 text-[#f5a623] font-caption-mono text-xs font-semibold">
              <Lock className="w-3.5 h-3.5" />
              <span>MODE LIHAT</span>
            </div>
          )}
        </div>
      </div>

      {/* Filter Bar */}
      <div className="hidden sm:block border-b border-[#ebebeb] dark:border-[#262626] pb-4">
        <div className="flex flex-wrap items-end gap-3">
          <div className="flex-1 min-w-[180px]">
            <label className="block font-caption-mono text-[10px] text-[#888888] dark:text-[#737373] uppercase tracking-wider mb-1">Pencarian</label>
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-[#888888] dark:text-[#737373] absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                placeholder="Cari keterangan..."
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                className="w-full vercel-input pl-8 pr-3 py-2 text-xs"
              />
            </div>
          </div>
          <div className="min-w-[150px]">
            <label className="block font-caption-mono text-[10px] text-[#888888] dark:text-[#737373] uppercase tracking-wider mb-1">Jenis Transaksi</label>
            <select
              value={typeFilter}
              onChange={(e) => { setTypeFilter(e.target.value); setPage(1); }}
              className="vercel-input text-xs w-full"
            >
              <option value="">Semua Jenis</option>
              <option value="INCOME">Pemasukan</option>
              <option value="EXPENSE">Pengeluaran</option>
            </select>
          </div>
          <div className="min-w-[150px]">
            <label className="block font-caption-mono text-[10px] text-[#888888] dark:text-[#737373] uppercase tracking-wider mb-1">Kategori</label>
            <select
              value={categoryFilter}
              onChange={(e) => { setCategoryFilter(e.target.value); setPage(1); }}
              className="vercel-input text-xs w-full"
            >
              <option value="">Semua Kategori</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
          <div className="min-w-[130px]">
            <label className="block font-caption-mono text-[10px] text-[#888888] dark:text-[#737373] uppercase tracking-wider mb-1">Dari Tgl</label>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => { setDateFrom(e.target.value); setPage(1); }}
              className="vercel-input text-xs w-full font-mono"
            />
          </div>
          <div className="min-w-[130px]">
            <label className="block font-caption-mono text-[10px] text-[#888888] dark:text-[#737373] uppercase tracking-wider mb-1">Sampai Tgl</label>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => { setDateTo(e.target.value); setPage(1); }}
              className="vercel-input text-xs w-full font-mono"
            />
          </div>
          {hasActiveFilters && (
            <div className="flex items-end pb-0.5">
              <button
                onClick={handleResetFilters}
                className="font-caption-mono text-[11px] text-[#ee0000] hover:underline flex items-center gap-1 font-semibold pb-2 px-2"
              >
                <X className="w-3 h-3" />
                <span>Reset</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Mobile Filter Drawer */}
      <div className={`sm:hidden border-b border-[#ebebeb] dark:border-[#262626] pb-4 ${showMobileFilter ? 'block' : 'hidden'}`}>
        <div className="space-y-3">
          <div>
            <label className="block font-caption-mono text-[10px] text-[#888888] dark:text-[#737373] uppercase tracking-wider mb-1">Pencarian</label>
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-[#888888] dark:text-[#737373] absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                placeholder="Cari keterangan..."
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                className="w-full vercel-input pl-8 pr-3 py-2 text-xs"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <select
              value={typeFilter}
              onChange={(e) => { setTypeFilter(e.target.value); setPage(1); }}
              className="vercel-input text-xs w-full"
            >
              <option value="">Semua Jenis</option>
              <option value="INCOME">Pemasukan</option>
              <option value="EXPENSE">Pengeluaran</option>
            </select>
            <select
              value={categoryFilter}
              onChange={(e) => { setCategoryFilter(e.target.value); setPage(1); }}
              className="vercel-input text-xs w-full"
            >
              <option value="">Semua Kategori</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-caption-mono text-[10px] text-[#888888] dark:text-[#737373] mb-1">Dari</label>
              <input type="date" value={dateFrom} onChange={(e) => { setDateFrom(e.target.value); setPage(1); }} className="vercel-input text-xs w-full font-mono" />
            </div>
            <div>
              <label className="block font-caption-mono text-[10px] text-[#888888] dark:text-[#737373] mb-1">Sampai</label>
              <input type="date" value={dateTo} onChange={(e) => { setDateTo(e.target.value); setPage(1); }} className="vercel-input text-xs w-full font-mono" />
            </div>
          </div>
          {hasActiveFilters && (
            <div className="flex justify-end">
              <button onClick={handleResetFilters} className="font-caption-mono text-xs text-[#ee0000] hover:underline flex items-center gap-1 font-semibold">
                <X className="w-3 h-3" />
                <span>Reset Filter</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Mobile Feed */}
      <div className="sm:hidden space-y-3">
        {isLoading ? (
          <div className="py-12 text-center text-[#888888] dark:text-[#a1a1a1] bg-[#ffffff] dark:bg-[#0a0a0a] rounded-xl border border-[#ebebeb] dark:border-[#262626]">
            <Loader2 className="w-5 h-5 text-[#0070f3] animate-spin mx-auto mb-2" />
            <span className="font-caption-mono text-xs">Memuat daftar transaksi...</span>
          </div>
        ) : transactions.length > 0 ? (
          transactions.map((t) => (
            <div
              key={t.id}
              className="p-4 rounded-xl bg-[#ffffff] dark:bg-[#0a0a0a] border border-[#ebebeb] dark:border-[#262626] space-y-2.5"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {t.type === 'INCOME' ? (
                    <span className="vercel-badge-mono bg-[#50e3c2]/10 text-[#29bc9b] dark:text-[#50e3c2] border-[#50e3c2]/30 text-[9px]">
                      PEMASUKAN
                    </span>
                  ) : (
                    <span className="vercel-badge-mono bg-[#ee0000]/10 text-[#ee0000] border-[#ee0000]/30 text-[9px]">
                      PENGELUARAN
                    </span>
                  )}
                  <span className="font-caption-mono text-[10px] text-[#888888] dark:text-[#a1a1a1]">
                    {formatDate(t.transactionDate)}
                  </span>
                </div>

                <p
                  className={`font-mono text-sm font-bold ${
                    t.type === 'INCOME' ? 'text-[#29bc9b] dark:text-[#50e3c2]' : 'text-[#ee0000]'
                  }`}
                >
                  {t.type === 'INCOME' ? '+' : '-'} {formatRupiah(t.amount)}
                </p>
              </div>

              <div>
                <p className="text-xs font-semibold text-[#171717] dark:text-[#ffffff]">{t.category?.name || '-'}</p>
                <p className="text-xs text-[#4d4d4d] dark:text-[#a1a1a1] mt-0.5">{t.description || '-'}</p>
              </div>

              <div className="pt-2 border-t border-[#ebebeb] dark:border-[#262626] flex items-center justify-between">
                {t.attachmentUrl ? (
                  <button
                    onClick={() => setSelectedProofTrx(t)}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded text-[10px] font-caption-mono bg-[#0070f3]/10 text-[#0070f3] dark:text-[#50e3c2] border border-[#0070f3]/30"
                  >
                    <FileText className="w-3 h-3" />
                    <span>Bukti Lampiran</span>
                  </button>
                ) : (
                  <span className="font-caption-mono text-[10px] text-[#888888] dark:text-[#737373]">Tidak Ada File</span>
                )}

                {isAdmin && (
                  <div className="flex items-center gap-2">
                    <Link
                      href={`/transactions/${t.id}/edit`}
                      className="p-1.5 rounded bg-[#fafafa] dark:bg-[#171717] text-[#4d4d4d] dark:text-[#a1a1a1] hover:text-[#171717] dark:hover:text-[#ffffff] border border-[#ebebeb] dark:border-[#262626]"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </Link>
                    <button
                      onClick={() => setDeleteTargetId(t.id)}
                      className="p-1.5 rounded bg-[#fafafa] dark:bg-[#171717] text-[#4d4d4d] dark:text-[#a1a1a1] hover:text-[#ee0000] border border-[#ebebeb] dark:border-[#262626]"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))
        ) : (
          <div className="py-12 text-center font-caption-mono text-xs text-[#888888] dark:text-[#737373] bg-[#ffffff] dark:bg-[#0a0a0a] rounded-xl border border-[#ebebeb] dark:border-[#262626]">
            Tidak ada transaksi ditemukan.
          </div>
        )}
      </div>

      {/* Desktop Table */}
      <div className="hidden sm:block vercel-card p-6">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[#ebebeb] dark:border-[#262626] font-caption-mono text-[11px] text-[#888888] dark:text-[#a1a1a1] uppercase tracking-wider bg-[#fafafa] dark:bg-[#000000]">
                <th className="py-3 px-4 cursor-pointer select-none hover:text-[#171717] dark:hover:text-[#ffffff] transition-colors" onClick={() => handleSort('transactionDate')}>
                  <span className="inline-flex items-center">TANGGAL <SortIcon column="transactionDate" /></span>
                </th>
                <th className="py-3 px-4 cursor-pointer select-none hover:text-[#171717] dark:hover:text-[#ffffff] transition-colors" onClick={() => handleSort('type')}>
                  <span className="inline-flex items-center">JENIS <SortIcon column="type" /></span>
                </th>
                <th className="py-3 px-4 cursor-pointer select-none hover:text-[#171717] dark:hover:text-[#ffffff] transition-colors" onClick={() => handleSort('categoryName')}>
                  <span className="inline-flex items-center">KATEGORI <SortIcon column="categoryName" /></span>
                </th>
                <th className="py-3 px-4">KETERANGAN</th>
                <th className="py-3 px-4 text-right cursor-pointer select-none hover:text-[#171717] dark:hover:text-[#ffffff] transition-colors" onClick={() => handleSort('amount')}>
                  <span className="inline-flex items-center justify-end">NOMINAL <SortIcon column="amount" /></span>
                </th>
                <th className="py-3 px-4 text-center">LAMPIRAN</th>
                {isAdmin && <th className="py-3 px-4 text-center">AKSI</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#ebebeb] dark:divide-[#262626] text-xs font-sans">
              {isLoading ? (
                <tr>
                  <td colSpan={isAdmin ? 7 : 6} className="py-12 text-center text-[#888888] dark:text-[#a1a1a1]">
                    <Loader2 className="w-5 h-5 text-[#0070f3] animate-spin mx-auto mb-2" />
                    <span className="font-caption-mono text-xs">Memuat data transaksi...</span>
                  </td>
                </tr>
              ) : transactions.length > 0 ? (
                transactions.map((t) => (
                  <tr key={t.id} className="hover:bg-[#fafafa] dark:hover:bg-[#171717]/50 transition-colors">
                    <td className="py-3.5 px-4 font-caption-mono text-[#888888] dark:text-[#a1a1a1] whitespace-nowrap">
                      {formatDate(t.transactionDate)}
                    </td>
                    <td className="py-3.5 px-4">
                      {t.type === 'INCOME' ? (
                        <span className="vercel-badge-mono bg-[#50e3c2]/10 text-[#29bc9b] dark:text-[#50e3c2] border-[#50e3c2]/30">
                          PEMASUKAN
                        </span>
                      ) : (
                        <span className="vercel-badge-mono bg-[#ee0000]/10 text-[#ee0000] border-[#ee0000]/30">
                          PENGELUARAN
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 font-bold text-[#171717] dark:text-[#ffffff]">{t.category?.name || '-'}</td>
                    <td className="py-3.5 px-4 text-[#4d4d4d] dark:text-[#a1a1a1] max-w-xs truncate">{t.description || '-'}</td>
                    <td
                      className={`py-3.5 px-4 text-right font-bold font-mono ${
                        t.type === 'INCOME' ? 'text-[#29bc9b] dark:text-[#50e3c2]' : 'text-[#ee0000]'
                      }`}
                    >
                      {t.type === 'INCOME' ? '+' : '-'} {formatRupiah(t.amount)}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      {t.attachmentUrl ? (
                        <button
                          onClick={() => setSelectedProofTrx(t)}
                          className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-[11px] font-caption-mono bg-[#0070f3]/10 text-[#0070f3] dark:text-[#50e3c2] border border-[#0070f3]/30 hover:bg-[#0070f3]/20 transition-colors"
                        >
                          <FileText className="w-3 h-3" />
                          <span>Bukti</span>
                        </button>
                      ) : (
                        <span className="font-caption-mono text-[11px] text-[#888888] dark:text-[#737373]">-</span>
                      )}
                    </td>
                    {isAdmin && (
                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center gap-2">
                          <Link
                            href={`/transactions/${t.id}/edit`}
                            className="p-1.5 rounded text-[#4d4d4d] dark:text-[#a1a1a1] hover:text-[#171717] dark:hover:text-[#ffffff] hover:bg-[#fafafa] dark:hover:bg-[#171717] transition-colors"
                            title="Edit Transaksi"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </Link>
                          <button
                            onClick={() => setDeleteTargetId(t.id)}
                            className="p-1.5 rounded text-[#4d4d4d] dark:text-[#a1a1a1] hover:text-[#ee0000] hover:bg-[#ee0000]/10 transition-colors"
                            title="Hapus Transaksi"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={isAdmin ? 7 : 6} className="py-12 text-center font-caption-mono text-xs text-[#888888] dark:text-[#737373]">
                    Tidak ada transaksi ditemukan.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination Footer */}
      {totalPages > 1 && (
        <div className="pt-2 flex items-center justify-between font-caption-mono text-xs text-[#888888] dark:text-[#a1a1a1]">
          <span>
            Halaman {page} dari {totalPages}
          </span>
          <div className="flex items-center gap-2">
            <button
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
              className="p-2 rounded-md bg-[#ffffff] dark:bg-[#0a0a0a] border border-[#ebebeb] dark:border-[#262626] text-[#171717] dark:text-[#ffffff] disabled:opacity-30 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
              className="p-2 rounded-md bg-[#ffffff] dark:bg-[#0a0a0a] border border-[#ebebeb] dark:border-[#262626] text-[#171717] dark:text-[#ffffff] disabled:opacity-30 transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Proof Viewer Modal */}
      <ProofViewerModal
        isOpen={Boolean(selectedProofTrx)}
        onClose={() => setSelectedProofTrx(null)}
        transaction={selectedProofTrx}
      />

      {/* Confirm Delete Transaction Modal */}
      <ConfirmModal
        isOpen={Boolean(deleteTargetId)}
        onClose={() => setDeleteTargetId(null)}
        onConfirm={confirmDeleteTransaction}
        title="Hapus Record Transaksi"
        message="Apakah Anda yakin ingin menghapus record transaksi ini? Data yang dihapus akan dicatat dalam Audit Log dan tidak dapat dikembalikan."
        confirmText="Hapus Transaksi"
        cancelText="Batal"
        variant="danger"
        isLoading={isDeleting}
      />
    </div>
  );
}
