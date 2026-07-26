'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Upload,
  FileText,
  CheckCircle,
  AlertCircle,
  Loader2,
  Calendar,
  Tag,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react';
import { CategoryItem, TransactionType } from '@/lib/types';
import { useToast } from '@/components/ui/ToastContext';

export default function CreateTransactionPage() {
  const router = useRouter();
  const { showToast } = useToast();

  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [type, setType] = useState<TransactionType>('INCOME');
  const [amount, setAmount] = useState<string>('');
  const [categoryId, setCategoryId] = useState<string>('');
  const [transactionDate, setTransactionDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [description, setDescription] = useState<string>('');

  const [attachmentUrl, setAttachmentUrl] = useState<string | null>(null);
  const [attachmentName, setAttachmentName] = useState<string | null>(null);
  const [attachmentSize, setAttachmentSize] = useState<number | null>(null);
  const [attachmentMimeType, setAttachmentMimeType] = useState<string | null>(null);

  const [isUploading, setIsUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/categories')
      .then((r) => r.json())
      .then((data) => {
        if (data.data) setCategories(data.data);
      })
      .catch(() => {});
  }, []);

  const filteredCategories = categories.filter((c) => c.type === type);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      showToast('Ukuran file maksimal 5 MB', 'error');
      return;
    }

    const formData = new FormData();
    formData.append('file', file);

    setIsUploading(true);
    setErrorMsg(null);

    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Gagal mengunggah lampiran');

      setAttachmentUrl(data.url);
      setAttachmentName(data.name);
      setAttachmentSize(data.size);
      setAttachmentMimeType(data.mimeType);
      showToast('Lampiran bukti transaksi berhasil diunggah', 'success');
    } catch (err: any) {
      setErrorMsg(err.message);
      showToast(err.message, 'error');
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!amount || Number(amount) < 1) {
      setErrorMsg('Nominal transaksi minimal Rp 1');
      return;
    }

    if (!categoryId) {
      setErrorMsg('Pilih kategori transaksi');
      return;
    }

    if (!transactionDate) {
      setErrorMsg('Pilih tanggal transaksi');
      return;
    }

    setIsSubmitting(true);

    try {
      const payload = {
        type,
        amount: Number(amount),
        categoryId,
        transactionDate,
        description: description || undefined,
        attachmentUrl,
        attachmentName,
        attachmentSize,
        attachmentMimeType,
      };

      const res = await fetch('/api/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Gagal menyimpan transaksi');

      showToast('Transaksi baru berhasil ditambahkan', 'success');
      router.push('/transactions');
      router.refresh();
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto animate-in fade-in duration-300">
      {/* Back Button & Header */}
      <div className="flex items-center justify-between border-b border-[#ebebeb] dark:border-[#262626] pb-4">
        <div className="flex items-center gap-3">
          <Link
            href="/transactions"
            className="p-2 rounded-lg bg-[#ffffff] dark:bg-[#0a0a0a] border border-[#ebebeb] dark:border-[#262626] text-[#4d4d4d] dark:text-[#a1a1a1] hover:text-[#171717] dark:hover:text-[#ffffff] transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <span className="font-caption-mono text-xs text-[#0070f3] dark:text-[#50e3c2] font-semibold">FORM TRANSAKSI KAS</span>
            <h1 className="text-xl sm:text-2xl font-bold text-[#171717] dark:text-[#ffffff] tracking-tight">Tambah Transaksi Baru</h1>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Link href="/transactions" className="vercel-button-secondary py-2 text-xs">
            Batal
          </Link>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting || isUploading}
            className="vercel-button-primary py-2 text-xs disabled:opacity-50"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Menyimpan...</span>
              </>
            ) : (
              <>
                <CheckCircle className="w-4 h-4" />
                <span>Simpan Transaksi</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Main Form Container */}
      <form onSubmit={handleSubmit} className="vercel-card p-6 sm:p-8 space-y-6">
        {errorMsg && (
          <div className="p-4 rounded-xl bg-[#ee0000]/10 border border-[#ee0000]/30 text-[#ee0000] text-xs font-caption-mono flex items-center gap-2.5">
            <AlertCircle className="w-4 h-4 shrink-0 text-[#ee0000]" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* 1. Jenis Transaksi */}
        <div className="space-y-2">
          <label className="block font-caption-mono text-[11px] text-[#888888] dark:text-[#a1a1a1] uppercase tracking-wider font-bold">
            PILIH JENIS TRANSAKSI *
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => {
                setType('INCOME');
                setCategoryId('');
              }}
              className={`p-4 sm:p-5 rounded-xl border-2 text-left transition-all flex flex-col justify-between min-h-[90px] ${
                type === 'INCOME'
                  ? 'bg-[#50e3c2]/10 dark:bg-[#50e3c2]/15 border-[#50e3c2] text-[#29bc9b] dark:text-[#50e3c2]'
                  : 'bg-[#ffffff] dark:bg-[#0a0a0a] border-[#ebebeb] dark:border-[#262626] text-[#888888] dark:text-[#a1a1a1] hover:border-[#a1a1a1]'
              }`}
            >
              <div className="flex items-center justify-between w-full">
                <span className="font-caption-mono text-xs font-bold uppercase">PEMASUKAN (INCOME)</span>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${type === 'INCOME' ? 'bg-[#50e3c2] text-[#000000]' : 'bg-[#fafafa] dark:bg-[#171717]'}`}>
                  <ArrowUpRight className="w-4 h-4" />
                </div>
              </div>
              <p className="text-xs opacity-80 mt-2 font-sans">Penerimaan arus kas bersih masuk (Penjualan, Modal, Operasional)</p>
            </button>

            <button
              type="button"
              onClick={() => {
                setType('EXPENSE');
                setCategoryId('');
              }}
              className={`p-4 sm:p-5 rounded-xl border-2 text-left transition-all flex flex-col justify-between min-h-[90px] ${
                type === 'EXPENSE'
                  ? 'bg-[#ee0000]/10 dark:bg-[#ee0000]/15 border-[#ee0000] text-[#ee0000]'
                  : 'bg-[#ffffff] dark:bg-[#0a0a0a] border-[#ebebeb] dark:border-[#262626] text-[#888888] dark:text-[#a1a1a1] hover:border-[#a1a1a1]'
              }`}
            >
              <div className="flex items-center justify-between w-full">
                <span className="font-caption-mono text-xs font-bold uppercase">PENGELUARAN (EXPENSE)</span>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${type === 'EXPENSE' ? 'bg-[#ee0000] text-[#ffffff]' : 'bg-[#fafafa] dark:bg-[#171717]'}`}>
                  <ArrowDownRight className="w-4 h-4" />
                </div>
              </div>
              <p className="text-xs opacity-80 mt-2 font-sans">Pengeluaran arus kas (Beli Barang, Pembayaran Gaji, Beban Usaha)</p>
            </button>
          </div>
        </div>

        {/* 2. Nominal Input */}
        <div className="space-y-2">
          <label className="block font-caption-mono text-[11px] text-[#888888] dark:text-[#a1a1a1] uppercase tracking-wider font-bold">
            NOMINAL TRANSAKSI (RP) *
          </label>
          <div className="relative flex items-center">
            <span className="absolute left-4 font-mono font-bold text-lg text-[#888888] dark:text-[#a1a1a1]">Rp</span>
            <input
              type="number"
              min="1"
              required
              placeholder="0"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full bg-[#ffffff] dark:bg-[#000000] border border-[#ebebeb] dark:border-[#262626] rounded-xl pl-12 pr-4 py-3.5 text-xl font-bold font-mono text-[#171717] dark:text-[#ffffff] focus:outline-none focus:border-[#0070f3] dark:focus:border-[#50e3c2] transition-colors"
            />
          </div>
        </div>

        {/* 3. Kategori & Tanggal */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="block font-caption-mono text-[11px] text-[#888888] dark:text-[#a1a1a1] uppercase tracking-wider font-bold">
              KATEGORI TRANSAKSI *
            </label>
            <div className="relative">
              <Tag className="w-4 h-4 text-[#888888] dark:text-[#737373] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <select
                required
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="w-full vercel-input !pl-10 text-sm font-semibold py-3"
              >
                <option value="">-- Pilih Kategori --</option>
                {filteredCategories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <label className="block font-caption-mono text-[11px] text-[#888888] dark:text-[#a1a1a1] uppercase tracking-wider font-bold">
              TANGGAL TRANSAKSI *
            </label>
            <div className="relative">
              <Calendar className="w-4 h-4 text-[#888888] dark:text-[#737373] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="date"
                required
                value={transactionDate}
                onChange={(e) => setTransactionDate(e.target.value)}
                className="w-full vercel-input !pl-10 text-sm font-mono py-3 font-semibold"
              />
            </div>
          </div>
        </div>

        {/* 4. Keterangan */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="block font-caption-mono text-[11px] text-[#888888] dark:text-[#a1a1a1] uppercase tracking-wider font-bold">
              KETERANGAN / CATATAN TRANSAKSI
            </label>
            <span className="font-caption-mono text-[10px] text-[#888888] dark:text-[#737373]">
              {description.length}/255
            </span>
          </div>
          <textarea
            rows={3}
            maxLength={255}
            placeholder="Catatan detail transaksi kas..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full vercel-input text-sm p-3.5"
          />
        </div>

        {/* 5. Lampiran Bukti */}
        <div className="space-y-2">
          <label className="block font-caption-mono text-[11px] text-[#888888] dark:text-[#a1a1a1] uppercase tracking-wider font-bold">
            LAMPIRAN BUKTI TRANSAKSI (MAKS 5MB JPG, PNG, PDF)
          </label>
          <div className="border border-dashed border-[#ebebeb] dark:border-[#262626] hover:border-[#0070f3] dark:hover:border-[#50e3c2] bg-[#fafafa] dark:bg-[#000000] rounded-xl p-6 text-center transition-colors">
            {attachmentUrl ? (
              <div className="flex items-center justify-between bg-[#ffffff] dark:bg-[#171717] border border-[#ebebeb] dark:border-[#262626] p-4 rounded-xl">
                <div className="flex items-center gap-3 overflow-hidden">
                  <FileText className="w-5 h-5 text-[#0070f3] dark:text-[#50e3c2] shrink-0" />
                  <span className="font-caption-mono text-xs text-[#171717] dark:text-[#ffffff] truncate font-semibold">
                    {attachmentName || 'Dokumen Bukti Terunggah'}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setAttachmentUrl(null);
                    setAttachmentName(null);
                    setAttachmentSize(null);
                    setAttachmentMimeType(null);
                  }}
                  className="text-[#ee0000] font-caption-mono text-xs hover:underline font-bold px-2 py-1"
                >
                  Hapus File
                </button>
              </div>
            ) : (
              <label className="cursor-pointer flex flex-col items-center justify-center gap-2 py-3">
                {isUploading ? (
                  <Loader2 className="w-6 h-6 text-[#0070f3] animate-spin" />
                ) : (
                  <Upload className="w-6 h-6 text-[#0070f3] dark:text-[#50e3c2]" />
                )}
                <span className="font-caption-mono text-xs text-[#171717] dark:text-[#ffffff] font-semibold">
                  {isUploading ? 'Mengunggah file...' : 'Klik untuk memilih dokumen bukti transaksi'}
                </span>
                <span className="font-caption-mono text-[10px] text-[#888888] dark:text-[#737373]">
                  Format yang didukung: JPG, PNG, PDF (Maksimal 5 MB)
                </span>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/jpg,application/pdf"
                  onChange={handleFileUpload}
                  disabled={isUploading}
                  className="hidden"
                />
              </label>
            )}
          </div>
        </div>

        {/* Submit Actions */}
        <div className="pt-4 border-t border-[#ebebeb] dark:border-[#262626] flex items-center justify-end gap-3">
          <Link href="/transactions" className="vercel-button-secondary py-2.5 px-5 text-xs font-semibold">
            Batal
          </Link>
          <button
            type="submit"
            disabled={isSubmitting || isUploading}
            className="vercel-button-primary py-2.5 px-6 text-xs font-semibold disabled:opacity-50"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Menyimpan Transaksi...</span>
              </>
            ) : (
              <>
                <CheckCircle className="w-4 h-4" />
                <span>Simpan Transaksi Baru</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
