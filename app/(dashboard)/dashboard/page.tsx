'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, FileText, Loader2 } from 'lucide-react';
import { StatCards } from '@/components/dashboard/StatCards';
import { ProofViewerModal } from '@/components/transaction/ProofViewerModal';
import { DashboardSummary, TransactionItem } from '@/lib/types';
import { formatDate, formatRupiah } from '@/lib/utils';
import { useToast } from '@/components/ui/ToastContext';

export default function DashboardPage() {
  const { showToast } = useToast();
  const [data, setData] = useState<DashboardSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedProofTrx, setSelectedProofTrx] = useState<TransactionItem | null>(null);

  const fetchDashboardData = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/dashboard');
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || 'Gagal memuat dashboard');
      setData(result.data);
    } catch (err: any) {
      showToast(err.message, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <Loader2 className="w-6 h-6 text-[#0070f3] animate-spin" />
        <p className="font-caption-mono text-xs text-[#888888] dark:text-[#a1a1a1]">Memuat data dashboard...</p>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-300">
      {/* 3 Summary Stat Cards (Top Section Removed) */}
      <StatCards
        totalIncome={data.totalIncome}
        totalExpense={data.totalExpense}
        balance={data.balance}
        totalTransactions={data.totalTransactions}
      />

      {/* 5 Recent Transactions Table / Card Feed */}
      <div className="vercel-card p-4 sm:p-6">
        <div className="flex items-center justify-between mb-4 sm:mb-6">
          <div>
            <span className="font-caption-mono text-[10px] sm:text-xs text-[#888888] dark:text-[#a1a1a1] font-semibold">Aktivitas Terkini</span>
            <h3 className="text-sm sm:text-base font-bold text-[#171717] dark:text-[#ffffff] tracking-tight">5 Transaksi Terbaru</h3>
          </div>
          <Link
            href="/transactions"
            className="inline-flex items-center gap-1 font-caption-mono text-xs font-semibold text-[#0070f3] dark:text-[#50e3c2] hover:underline"
          >
            <span>Lihat Semua</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* Mobile View */}
        <div className="sm:hidden space-y-2.5">
          {data.recentTransactions.length > 0 ? (
            data.recentTransactions.map((t) => (
              <div
                key={t.id}
                className="p-3.5 rounded-xl bg-[#fafafa] dark:bg-[#000000] border border-[#ebebeb] dark:border-[#262626] flex items-center justify-between gap-2"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
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
                  <p className="text-xs font-semibold text-[#171717] dark:text-[#ffffff] truncate">{t.category?.name || '-'}</p>
                  <p className="text-[11px] text-[#4d4d4d] dark:text-[#a1a1a1] truncate">{t.description || '-'}</p>
                </div>

                <div className="text-right flex flex-col items-end shrink-0">
                  <p
                    className={`font-mono text-xs font-bold ${
                      t.type === 'INCOME' ? 'text-[#29bc9b] dark:text-[#50e3c2]' : 'text-[#ee0000]'
                    }`}
                  >
                    {t.type === 'INCOME' ? '+' : '-'} {formatRupiah(t.amount)}
                  </p>
                  {t.attachmentUrl && (
                    <button
                      onClick={() => setSelectedProofTrx(t)}
                      className="mt-1 inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-caption-mono bg-[#0070f3]/10 text-[#0070f3] dark:text-[#50e3c2] border border-[#0070f3]/30"
                    >
                      <FileText className="w-3 h-3" />
                      <span>Bukti</span>
                    </button>
                  )}
                </div>
              </div>
            ))
          ) : (
            <p className="font-caption-mono text-xs text-[#888888] dark:text-[#737373] text-center py-6">Belum ada transaksi terbaru.</p>
          )}
        </div>

        {/* Desktop View */}
        <div className="hidden sm:block overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[#ebebeb] dark:border-[#262626] font-caption-mono text-[11px] text-[#888888] dark:text-[#a1a1a1] uppercase tracking-wider bg-[#fafafa] dark:bg-[#000000]">
                <th className="py-3 px-4">TANGGAL</th>
                <th className="py-3 px-4">JENIS</th>
                <th className="py-3 px-4">KATEGORI</th>
                <th className="py-3 px-4">KETERANGAN</th>
                <th className="py-3 px-4 text-right">NOMINAL</th>
                <th className="py-3 px-4 text-center">LAMPIRAN</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#ebebeb] dark:divide-[#262626] text-xs font-sans">
              {data.recentTransactions.length > 0 ? (
                data.recentTransactions.map((t) => (
                  <tr key={t.id} className="hover:bg-[#fafafa] dark:hover:bg-[#171717]/50 transition-colors">
                    <td className="py-3.5 px-4 font-caption-mono text-[#888888] dark:text-[#a1a1a1]">
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
                    <td className="py-3.5 px-4 text-[#4d4d4d] dark:text-[#a1a1a1] max-w-xs truncate">
                      {t.description || '-'}
                    </td>
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
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="py-8 text-center font-caption-mono text-xs text-[#888888] dark:text-[#737373]">
                    Belum ada transaksi recorded.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Proof Viewer Modal */}
      <ProofViewerModal
        isOpen={Boolean(selectedProofTrx)}
        onClose={() => setSelectedProofTrx(null)}
        transaction={selectedProofTrx}
      />
    </div>
  );
}
