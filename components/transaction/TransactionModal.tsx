'use client';

import React, { useState, useEffect } from 'react';
import { X, Upload, FileText, CheckCircle, AlertCircle, Loader2, DollarSign, Calendar, Tag, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { CategoryItem, TransactionItem, TransactionType } from '@/lib/types';
import { useToast } from '../ui/ToastContext';

interface TransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  initialData?: TransactionItem | null;
  categories: CategoryItem[];
}

export const TransactionModal: React.FC<TransactionModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  initialData,
  categories,
}) => {
  const { showToast } = useToast();
  const [type, setType] = useState<TransactionType>('INCOME');
  const [amount, setAmount] = useState<string>('');
  const [categoryId, setCategoryId] = useState<string>('');
  const [transactionDate, setTransactionDate] = useState<string>('');
  const [description, setDescription] = useState<string>('');

  const [attachmentUrl, setAttachmentUrl] = useState<string | null>(null);
  const [attachmentName, setAttachmentName] = useState<string | null>(null);
  const [attachmentSize, setAttachmentSize] = useState<number | null>(null);
  const [attachmentMimeType, setAttachmentMimeType] = useState<string | null>(null);

  const [isUploading, setIsUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (initialData) {
      setType(initialData.type);
      setAmount(initialData.amount.toString());
      setCategoryId(initialData.categoryId);
      setTransactionDate(initialData.transactionDate.split('T')[0]);
      setDescription(initialData.description || '');
      setAttachmentUrl(initialData.attachmentUrl || null);
      setAttachmentName(initialData.attachmentName || null);
      setAttachmentSize(initialData.attachmentSize || null);
      setAttachmentMimeType(initialData.attachmentMimeType || null);
    } else {
      setType('INCOME');
      setAmount('');
      setCategoryId('');
      setTransactionDate(new Date().toISOString().split('T')[0]);
      setDescription('');
      setAttachmentUrl(null);
      setAttachmentName(null);
      setAttachmentSize(null);
      setAttachmentMimeType(null);
    }
    setErrorMsg(null);
  }, [initialData, isOpen]);

  if (!isOpen) return null;

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

      const url = initialData ? `/api/transactions/${initialData.id}` : '/api/transactions';
      const method = initialData ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Gagal menyimpan transaksi');

      showToast(initialData ? 'Transaksi berhasil diperbarui' : 'Transaksi baru berhasil dibuat', 'success');
      onSuccess();
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#ffffff] dark:bg-[#000000] text-[#171717] dark:text-[#ffffff] flex flex-col w-full h-full overflow-hidden animate-in fade-in duration-200 font-sans">
      {/* Fullscreen Sticky Header */}
      <header className="h-16 px-4 sm:px-8 border-b border-[#ebebeb] dark:border-[#262626] bg-[#ffffff] dark:bg-[#0a0a0a] flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <button
            onClick={onClose}
            className="p-2 rounded-full text-[#888888] dark:text-[#a1a1a1] hover:text-[#171717] dark:hover:text-[#ffffff] hover:bg-[#fafafa] dark:hover:bg-[#171717] transition-colors"
            title="Tutup (Esc)"
          >
            <X className="w-5 h-5" />
          </button>
          <div>
            <h2 className="text-base sm:text-lg font-extrabold text-[#171717] dark:text-[#ffffff] tracking-tight">
              {initialData ? 'Edit Record Transaksi' : 'Tambah Transaksi Kas Baru'}
            </h2>
            <p className="font-caption-mono text-[10px] sm:text-[11px] text-[#888888] dark:text-[#a1a1a1] hidden sm:block">
              Isi data transaksi pencatatan kas sesuai dokumen bukti.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onClose}
            className="vercel-button-secondary py-1.5 px-4 text-xs font-semibold"
          >
            Batal
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting || isUploading}
            className="vercel-button-primary py-1.5 px-4 text-xs font-semibold disabled:opacity-50"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span className="hidden sm:inline">Menyimpan...</span>
              </>
            ) : (
              <>
                <CheckCircle className="w-4 h-4" />
                <span>{initialData ? 'Simpan Edit' : 'Simpan Transaksi'}</span>
              </>
            )}
          </button>
        </div>
      </header>

      {/* Fullscreen Scrollable Body Form Container */}
      <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 sm:p-8 max-w-3xl mx-auto w-full space-y-6">
        {errorMsg && (
          <div className="p-4 rounded-xl bg-[#ee0000]/10 border border-[#ee0000]/30 text-[#ee0000] text-xs font-caption-mono flex items-center gap-2.5">
            <AlertCircle className="w-4 h-4 shrink-0 text-[#ee0000]" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* 1. Transaction Type Selector */}
        <div className="space-y-2">
          <label className="block font-caption-mono text-[11px] text-[#888888] dark:text-[#a1a1a1] uppercase tracking-wider font-bold">
            PILIH JENIS TRANSAKSI *
          </label>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => {
                setType('INCOME');
                setCategoryId('');
              }}
              className={`p-4 sm:p-5 rounded-2xl border-2 text-left transition-all flex flex-col justify-between min-h-[96px] ${
                type === 'INCOME'
                  ? 'bg-[#50e3c2]/10 dark:bg-[#50e3c2]/15 border-[#50e3c2] text-[#29bc9b] dark:text-[#50e3c2]'
                  : 'bg-[#ffffff] dark:bg-[#0a0a0a] border-[#ebebeb] dark:border-[#262626] text-[#888888] dark:text-[#a1a1a1] hover:border-[#a1a1a1]'
              }`}
            >
              <div className="flex items-center justify-between w-full">
                <span className="font-caption-mono text-xs font-bold uppercase">PEMASUKAN</span>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${type === 'INCOME' ? 'bg-[#50e3c2] text-[#000000]' : 'bg-[#fafafa] dark:bg-[#171717]'}`}>
                  <ArrowUpRight className="w-4 h-4" />
                </div>
              </div>
              <p className="text-xs font-medium opacity-80 mt-2">Arus kas masuk (Penjualan, Modal, dll)</p>
            </button>

            <button
              type="button"
              onClick={() => {
                setType('EXPENSE');
                setCategoryId('');
              }}
              className={`p-4 sm:p-5 rounded-2xl border-2 text-left transition-all flex flex-col justify-between min-h-[96px] ${
                type === 'EXPENSE'
                  ? 'bg-[#ee0000]/10 dark:bg-[#ee0000]/15 border-[#ee0000] text-[#ee0000]'
                  : 'bg-[#ffffff] dark:bg-[#0a0a0a] border-[#ebebeb] dark:border-[#262626] text-[#888888] dark:text-[#a1a1a1] hover:border-[#a1a1a1]'
              }`}
            >
              <div className="flex items-center justify-between w-full">
                <span className="font-caption-mono text-xs font-bold uppercase">PENGELUARAN</span>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${type === 'EXPENSE' ? 'bg-[#ee0000] text-[#ffffff]' : 'bg-[#fafafa] dark:bg-[#171717]'}`}>
                  <ArrowDownRight className="w-4 h-4" />
                </div>
              </div>
              <p className="text-xs font-medium opacity-80 mt-2">Arus kas keluar (Operasional, Gaji, dll)</p>
            </button>
          </div>
        </div>

        {/* 2. Amount Input */}
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
              className="w-full bg-[#ffffff] dark:bg-[#0a0a0a] border-2 border-[#ebebeb] dark:border-[#262626] rounded-2xl pl-12 pr-4 py-3.5 text-xl font-bold font-mono text-[#171717] dark:text-[#ffffff] focus:outline-none focus:border-[#0070f3] dark:focus:border-[#50e3c2] transition-colors"
            />
          </div>
        </div>

        {/* 3. Category & Date Grid */}
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
                className="w-full vercel-input pl-10 text-sm font-semibold py-3"
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
                className="w-full vercel-input pl-10 text-sm font-mono py-3 font-semibold"
              />
            </div>
          </div>
        </div>

        {/* 4. Description */}
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
            placeholder="Tambahkan rincian/keterangan transaksi kas..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full vercel-input text-sm p-3.5"
          />
        </div>

        {/* 5. File Upload Dropzone */}
        <div className="space-y-2">
          <label className="block font-caption-mono text-[11px] text-[#888888] dark:text-[#a1a1a1] uppercase tracking-wider font-bold">
            LAMPIRAN BUKTI TRANSAKSI (MAKS 5MB — JPG / PNG, DIKOMPRES KE AVIF)
          </label>
          <div className="border-2 border-dashed border-[#ebebeb] dark:border-[#262626] hover:border-[#0070f3] dark:hover:border-[#50e3c2] bg-[#fafafa] dark:bg-[#0a0a0a] rounded-2xl p-6 text-center transition-colors">
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
              <label className="cursor-pointer flex flex-col items-center justify-center gap-2 py-4">
                {isUploading ? (
                  <Loader2 className="w-6 h-6 text-[#0070f3] animate-spin" />
                ) : (
                  <Upload className="w-6 h-6 text-[#0070f3] dark:text-[#50e3c2]" />
                )}
                <span className="font-caption-mono text-xs text-[#171717] dark:text-[#ffffff] font-semibold">
                  {isUploading ? 'Mengunggah file...' : 'Klik untuk memilih dokumen bukti transaksi'}
                </span>
                <span className="font-caption-mono text-[10px] text-[#888888] dark:text-[#737373]">
                  Format: JPG / PNG — dikompres otomatis ke AVIF (Maks 5 MB)
                </span>
                <input
                  type="file"
                  accept="image/jpeg,image/png"
                  onChange={handleFileUpload}
                  disabled={isUploading}
                  className="hidden"
                />
              </label>
            )}
          </div>
        </div>
      </form>
    </div>
  );
};
