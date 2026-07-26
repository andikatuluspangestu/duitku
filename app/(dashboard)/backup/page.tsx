'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Download, Upload, RotateCcw, Trash2, Loader2, Database, Clock, FileText } from 'lucide-react';
import { useToast } from '@/components/ui/ToastContext';
import { ConfirmModal } from '@/components/ui/ConfirmModal';
import { formatDate, formatFileSize } from '@/lib/utils';

interface BackupItem {
  id: string;
  name: string;
  size: number;
  createdAt: string;
  data?: string;
}

export default function BackupPage() {
  const router = useRouter();
  const { showToast } = useToast();
  const [backups, setBackups] = useState<BackupItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [restoreTarget, setRestoreTarget] = useState<BackupItem | null>(null);
  const [isRestoring, setIsRestoring] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);

  const fetchBackups = async () => {
    try {
      const res = await fetch('/api/backup');
      const data = await res.json();
      if (res.ok) setBackups(data.backups || []);
    } catch {}
  };

  useEffect(() => {
    setIsLoading(true);
    Promise.all([
      fetch('/api/auth/me').then(r => r.json()).then(d => {
        if (!d.authenticated || d.user?.role !== 'SUPERADMIN') router.push('/dashboard');
      }),
      fetchBackups(),
    ]).finally(() => setIsLoading(false));
  }, []);

  const handleCreateBackup = async () => {
    setIsCreating(true);
    try {
      const res = await fetch('/api/backup/create', { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      showToast('Backup berhasil dibuat', 'success');
      fetchBackups();
    } catch (err: any) {
      showToast(err.message, 'error');
    } finally {
      setIsCreating(false);
    }
  };

  const handleDownloadBackup = (id: string) => {
    const backup = backups.find(b => b.id === id);
    if (!backup || !backup.data) return;
    const blob = new Blob([backup.data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `backup-${backup.name.replace(/\s+/g, '-').toLowerCase()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleRestore = async () => {
    if (!restoreTarget) return;
    setIsRestoring(true);
    try {
      const res = await fetch(`/api/backup/${restoreTarget.id}`, { method: 'POST' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      showToast(`Restore berhasil: ${data.data.users} user, ${data.data.categories} kategori, ${data.data.transactions} transaksi`, 'success');
      setRestoreTarget(null);
    } catch (err: any) {
      showToast(err.message, 'error');
    } finally {
      setIsRestoring(false);
    }
  };

  const handleUploadRestore = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch('/api/backup', { method: 'POST', body: formData });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      showToast(`Restore berhasil: ${data.data.users} user, ${data.data.categories} kategori, ${data.data.transactions} transaksi`, 'success');
      fetchBackups();
    } catch (err: any) {
      showToast(err.message, 'error');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      const res = await fetch(`/api/backup/${deleteTarget}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      showToast('Backup berhasil dihapus', 'success');
      setDeleteTarget(null);
      fetchBackups();
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="w-6 h-6 text-[#0070f3] animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="border-b border-[#ebebeb] dark:border-[#262626] pb-4">
        <span className="font-caption-mono text-xs text-[#0070f3] dark:text-[#50e3c2] font-semibold">SISTEM</span>
        <h1 className="text-xl sm:text-2xl font-bold text-[#171717] dark:text-[#ffffff] tracking-tight">Backup & Restore Data</h1>
        <p className="font-caption-mono text-xs text-[#888888] dark:text-[#a1a1a1] mt-0.5">Kelola backup database dan restore data jika diperlukan.</p>
      </div>

      {/* Actions */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <button onClick={handleCreateBackup} disabled={isCreating} className="vercel-card p-5 hover:border-[#0070f3] dark:hover:border-[#50e3c2] transition-colors text-left">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-[#0070f3]/10 flex items-center justify-center">
              <Database className="w-5 h-5 text-[#0070f3] dark:text-[#50e3c2]" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-[#171717] dark:text-[#ffffff]">Buat Backup Baru</h3>
              <p className="font-caption-mono text-[10px] text-[#888888] dark:text-[#a1a1a1]">Simpan snapshot data terkini</p>
            </div>
          </div>
          {isCreating && <p className="font-caption-mono text-xs text-[#0070f3] flex items-center gap-1"><Loader2 className="w-3 h-3 animate-spin" />Memproses...</p>}
        </button>

        <label className="vercel-card p-5 hover:border-[#0070f3] dark:hover:border-[#50e3c2] transition-colors cursor-pointer text-left">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-[#50e3c2]/10 flex items-center justify-center">
              <Upload className="w-5 h-5 text-[#50e3c2]" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-[#171717] dark:text-[#ffffff]">Restore dari File</h3>
              <p className="font-caption-mono text-[10px] text-[#888888] dark:text-[#a1a1a1]">Upload file backup .json</p>
            </div>
          </div>
          {isUploading && <p className="font-caption-mono text-xs text-[#50e3c2] flex items-center gap-1"><Loader2 className="w-3 h-3 animate-spin" />Merestore...</p>}
          <input type="file" accept=".json" onChange={handleUploadRestore} disabled={isUploading} className="hidden" />
        </label>

        <div className="vercel-card p-5 text-left">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-[#f5a623]/10 flex items-center justify-center">
              <Clock className="w-5 h-5 text-[#f5a623]" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-[#171717] dark:text-[#ffffff]">Auto Backup</h3>
              <p className="font-caption-mono text-[10px] text-[#888888] dark:text-[#a1a1a1]">Setiap hari pukul 01:00 WIB</p>
            </div>
          </div>
          <p className="font-caption-mono text-[10px] text-[#888888]">Menyimpan 30 backup terakhir</p>
        </div>
      </div>

      {/* Daftar Backup */}
      <div className="vercel-card p-6">
        <h2 className="text-sm font-bold text-[#171717] dark:text-[#ffffff] mb-4">Riwayat Backup</h2>
        {backups.length === 0 ? (
          <p className="font-caption-mono text-xs text-[#888888] dark:text-[#737373] text-center py-8">Belum ada backup tersimpan.</p>
        ) : (
          <div className="space-y-2">
            {backups.map((b) => (
              <div key={b.id} className="flex items-center justify-between p-3 rounded-xl bg-[#fafafa] dark:bg-[#000000] border border-[#ebebeb] dark:border-[#262626]">
                <div className="flex items-center gap-3 overflow-hidden">
                  <FileText className="w-4 h-4 text-[#0070f3] dark:text-[#50e3c2] shrink-0" />
                  <div className="overflow-hidden">
                    <p className="font-caption-mono text-xs text-[#171717] dark:text-[#ffffff] truncate font-semibold">{b.name}</p>
                    <p className="font-caption-mono text-[10px] text-[#888888] dark:text-[#737373]">{formatDate(b.createdAt)} &bull; {formatFileSize(b.size)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button onClick={() => handleDownloadBackup(b.id)} className="p-2 rounded text-[#4d4d4d] dark:text-[#a1a1a1] hover:text-[#0070f3] hover:bg-[#fafafa] dark:hover:bg-[#171717]" title="Download">
                    <Download className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={() => setRestoreTarget(b)} className="p-2 rounded text-[#4d4d4d] dark:text-[#a1a1a1] hover:text-[#f5a623] hover:bg-[#fafafa] dark:hover:bg-[#171717]" title="Restore">
                    <RotateCcw className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={() => setDeleteTarget(b.id)} className="p-2 rounded text-[#4d4d4d] dark:text-[#a1a1a1] hover:text-[#ee0000] hover:bg-[#fafafa] dark:hover:bg-[#171717]" title="Hapus">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Confirm Restore Modal */}
      <ConfirmModal
        isOpen={Boolean(restoreTarget)}
        onClose={() => setRestoreTarget(null)}
        onConfirm={handleRestore}
        title="Restore Data Backup"
        message={`Apakah Anda yakin ingin merestore data dari backup "${restoreTarget?.name}"? Data yang sudah ada akan ditimpa (di- upsert).`}
        confirmText="Restore Sekarang"
        cancelText="Batal"
        variant="warning"
        isLoading={isRestoring}
      />

      {/* Confirm Delete Modal */}
      <ConfirmModal
        isOpen={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Hapus Backup"
        message="Apakah Anda yakin ingin menghapus backup ini? Tindakan ini tidak dapat dikembalikan."
        confirmText="Hapus"
        cancelText="Batal"
        variant="danger"
      />
    </div>
  );
}
