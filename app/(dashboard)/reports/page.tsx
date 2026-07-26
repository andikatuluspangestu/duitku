'use client';

import React, { useState } from 'react';
import { FileSpreadsheet, FileText, Download, Calendar, Loader2, CheckCircle2 } from 'lucide-react';
import { useToast } from '@/components/ui/ToastContext';

export default function ReportsPage() {
  const { showToast } = useToast();
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [isExportingExcel, setIsExportingExcel] = useState(false);
  const [isExportingPdf, setIsExportingPdf] = useState(false);

  const handleExportExcel = async () => {
    setIsExportingExcel(true);
    try {
      const query = new URLSearchParams({
        ...(dateFrom && { dateFrom }),
        ...(dateTo && { dateTo }),
      });

      const res = await fetch(`/api/reports/excel?${query.toString()}`);
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Gagal mengekspor laporan Excel');
      }

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `laporan-keuangan-${Date.now()}.xlsx`;
      document.body.appendChild(a);
      a.click();
      a.remove();

      showToast('Laporan Excel (.xlsx) berhasil diunduh', 'success');
    } catch (err: any) {
      showToast(err.message, 'error');
    } finally {
      setIsExportingExcel(false);
    }
  };

  const handleExportPdf = async () => {
    setIsExportingPdf(true);
    try {
      const query = new URLSearchParams({
        ...(dateFrom && { dateFrom }),
        ...(dateTo && { dateTo }),
      });

      const res = await fetch(`/api/reports/pdf?${query.toString()}`);
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Gagal mengekspor laporan PDF');
      }

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `laporan-keuangan-${Date.now()}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();

      showToast('Laporan PDF berhasil diunduh', 'success');
    } catch (err: any) {
      showToast(err.message, 'error');
    } finally {
      setIsExportingPdf(false);
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6 animate-in fade-in duration-300">
      {/* Top Header */}
      <div className="border-b border-[#ebebeb] dark:border-[#262626] pb-4">
        <span className="font-caption-mono text-xs text-[#0070f3] dark:text-[#50e3c2] font-semibold">EXPORT LAPORAN</span>
        <h1 className="text-xl sm:text-2xl font-bold text-[#171717] dark:text-[#ffffff] tracking-tight">Export Laporan Keuangan</h1>
      </div>

      {/* Date Filter Card */}
      <div className="vercel-card p-5 sm:p-6 space-y-4">
        <div className="flex items-center gap-2 border-b border-[#ebebeb] dark:border-[#262626] pb-3">
          <Calendar className="w-4 h-4 text-[#0070f3] dark:text-[#50e3c2]" />
          <h3 className="font-caption-mono text-xs font-semibold text-[#171717] dark:text-[#ffffff] uppercase tracking-wider">
            Filter Periode Laporan
          </h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block font-caption-mono text-[11px] text-[#4d4d4d] dark:text-[#a1a1a1] uppercase tracking-wider mb-1.5 font-semibold">
              Dari Tanggal
            </label>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="vercel-input w-full font-mono text-xs"
            />
          </div>

          <div>
            <label className="block font-caption-mono text-[11px] text-[#4d4d4d] dark:text-[#a1a1a1] uppercase tracking-wider mb-1.5 font-semibold">
              Sampai Tanggal
            </label>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="vercel-input w-full font-mono text-xs"
            />
          </div>
        </div>

        {(dateFrom || dateTo) && (
          <div className="flex justify-end">
            <button
              onClick={() => {
                setDateFrom('');
                setDateTo('');
              }}
              className="font-caption-mono text-xs text-[#ee0000] hover:underline font-semibold"
            >
              Reset Periode
            </button>
          </div>
        )}
      </div>

      {/* Export Options Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
        {/* Excel Export */}
        <div className="vercel-card p-6 flex flex-col justify-between group hover:border-[#0070f3] transition-all">
          <div>
            <div className="w-10 h-10 rounded-lg bg-[#50e3c2]/10 text-[#29bc9b] dark:text-[#50e3c2] border border-[#50e3c2]/30 flex items-center justify-center mb-3">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold text-[#171717] dark:text-[#ffffff] mb-1">Microsoft Excel (.xlsx)</h3>
            <p className="font-caption-mono text-xs text-[#888888] dark:text-[#a1a1a1] leading-relaxed mb-4">
              Baris data transaksi lengkap dengan format rumus angka mata uang Rp.
            </p>
            <ul className="space-y-2 font-caption-mono text-xs text-[#4d4d4d] dark:text-[#a1a1a1] mb-6">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#29bc9b] dark:text-[#50e3c2]" />
                <span>Kolom Lengkap &amp; Metadata Dibuat Oleh</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#29bc9b] dark:text-[#50e3c2]" />
                <span>Format Rumus Angka Mata Uang Rp</span>
              </li>
            </ul>
          </div>

          <button
            onClick={handleExportExcel}
            disabled={isExportingExcel}
            className="vercel-button-primary w-full py-2.5 text-xs active:scale-95 disabled:opacity-50"
          >
            {isExportingExcel ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Mengolah Excel...</span>
              </>
            ) : (
              <>
                <Download className="w-4 h-4" />
                <span>Unduh File Excel (.xlsx)</span>
              </>
            )}
          </button>
        </div>

        {/* PDF Export */}
        <div className="vercel-card p-6 flex flex-col justify-between group hover:border-[#0070f3] transition-all">
          <div>
            <div className="w-10 h-10 rounded-lg bg-[#0070f3]/10 text-[#0070f3] dark:text-[#50e3c2] border border-[#0070f3]/30 flex items-center justify-center mb-3">
              <FileText className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold text-[#171717] dark:text-[#ffffff] mb-1">Dokumen PDF Resmi</h3>
            <p className="font-caption-mono text-xs text-[#888888] dark:text-[#a1a1a1] leading-relaxed mb-4">
              Dokumen siap cetak dengan logo UangKasir dan ringkasan kas.
            </p>
            <ul className="space-y-2 font-caption-mono text-xs text-[#4d4d4d] dark:text-[#a1a1a1] mb-6">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#0070f3] dark:text-[#50e3c2]" />
                <span>Kop Header Resmi &amp; Waktu Cetak</span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#0070f3] dark:text-[#50e3c2]" />
                <span>Tabel Data Berpenomoran Halaman</span>
              </li>
            </ul>
          </div>

          <button
            onClick={handleExportPdf}
            disabled={isExportingPdf}
            className="vercel-button-secondary w-full py-2.5 text-xs active:scale-95 disabled:opacity-50"
          >
            {isExportingPdf ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Mengolah PDF...</span>
              </>
            ) : (
              <>
                <Download className="w-4 h-4" />
                <span>Unduh Dokumen PDF</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
