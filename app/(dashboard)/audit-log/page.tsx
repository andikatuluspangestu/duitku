'use client';

import React, { useEffect, useState } from 'react';
import { History, ChevronLeft, ChevronRight, Loader2, RefreshCw } from 'lucide-react';
import { AuditLogItem } from '@/lib/types';
import { formatDateTime } from '@/lib/utils';
import { useToast } from '@/components/ui/ToastContext';

export default function AuditLogPage() {
  const { showToast } = useToast();
  const [logs, setLogs] = useState<AuditLogItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [actionFilter, setActionFilter] = useState('');
  const [moduleFilter, setModuleFilter] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  const fetchAuditLogs = async () => {
    setIsLoading(true);
    try {
      const query = new URLSearchParams({
        page: page.toString(),
        limit: '15',
        ...(actionFilter && { action: actionFilter }),
        ...(moduleFilter && { module: moduleFilter }),
      });

      const res = await fetch(`/api/audit-logs?${query.toString()}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Gagal memuat Audit Log');

      setLogs(data.data);
      setTotalPages(data.pagination.totalPages);
      setTotalCount(data.pagination.total);
    } catch (err: any) {
      showToast(err.message, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAuditLogs();
  }, [page, actionFilter, moduleFilter]);

  return (
    <div className="space-y-4 sm:space-y-6 animate-in fade-in duration-300">
      {/* Top Header */}
      <div className="flex items-center justify-between border-b border-[#ebebeb] dark:border-[#262626] pb-4">
        <div>
          <span className="font-caption-mono text-xs text-[#0070f3] dark:text-[#50e3c2] font-semibold">LOG AKTIVITAS</span>
          <h1 className="text-xl sm:text-2xl font-bold text-[#171717] dark:text-[#ffffff] tracking-tight">Audit Log Sistem</h1>
        </div>

        <button onClick={fetchAuditLogs} className="vercel-button-secondary py-1.5 px-3.5 text-xs">
          <RefreshCw className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Refresh</span>
        </button>
      </div>

      {/* Filter Bar */}
      <div className="vercel-card p-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <select
            value={actionFilter}
            onChange={(e) => {
              setActionFilter(e.target.value);
              setPage(1);
            }}
            className="vercel-input text-xs w-full"
          >
            <option value="">Semua Aktivitas (LOGIN, CREATE, DELETE...)</option>
            <option value="LOGIN">LOGIN</option>
            <option value="LOGOUT">LOGOUT</option>
            <option value="LOGIN_FAILED">LOGIN_FAILED</option>
            <option value="CREATE_TRANSACTION">CREATE_TRANSACTION</option>
            <option value="UPDATE_TRANSACTION">UPDATE_TRANSACTION</option>
            <option value="DELETE_TRANSACTION">DELETE_TRANSACTION</option>
            <option value="CREATE_CATEGORY">CREATE_CATEGORY</option>
            <option value="UPDATE_CATEGORY">UPDATE_CATEGORY</option>
            <option value="DELETE_CATEGORY">DELETE_CATEGORY</option>
            <option value="CREATE_USER">CREATE_USER</option>
            <option value="UPDATE_USER">UPDATE_USER</option>
            <option value="DELETE_USER">DELETE_USER</option>
            <option value="UPLOAD_ATTACHMENT">UPLOAD_ATTACHMENT</option>
            <option value="EXPORT_EXCEL">EXPORT_EXCEL</option>
            <option value="EXPORT_PDF">EXPORT_PDF</option>
          </select>

          <select
            value={moduleFilter}
            onChange={(e) => {
              setModuleFilter(e.target.value);
              setPage(1);
            }}
            className="vercel-input text-xs w-full"
          >
            <option value="">Semua Modul</option>
            <option value="AUTH">AUTH</option>
            <option value="TRANSACTION">TRANSACTION</option>
            <option value="CATEGORY">CATEGORY</option>
            <option value="USER">USER</option>
            <option value="REPORT">REPORT</option>
            <option value="ATTACHMENT">ATTACHMENT</option>
          </select>
        </div>
      </div>

      {/* Mobile Card Feed */}
      <div className="sm:hidden space-y-2.5">
        {isLoading ? (
          <div className="py-12 text-center text-[#888888] dark:text-[#a1a1a1] bg-[#ffffff] dark:bg-[#0a0a0a] rounded-xl border border-[#ebebeb] dark:border-[#262626]">
            <Loader2 className="w-5 h-5 text-[#0070f3] animate-spin mx-auto mb-2" />
            <span className="font-caption-mono text-xs">Memuat audit log...</span>
          </div>
        ) : logs.length > 0 ? (
          logs.map((log) => (
            <div key={log.id} className="p-4 rounded-xl bg-[#ffffff] dark:bg-[#0a0a0a] border border-[#ebebeb] dark:border-[#262626] space-y-2">
              <div className="flex items-center justify-between">
                <span
                  className={`vercel-badge-mono text-[9px] ${
                    log.action.includes('FAILED') || log.action.includes('DELETE')
                      ? 'bg-[#ee0000]/10 text-[#ee0000] border-[#ee0000]/30'
                      : log.action.includes('CREATE')
                      ? 'bg-[#50e3c2]/10 text-[#29bc9b] dark:text-[#50e3c2] border-[#50e3c2]/30'
                      : 'bg-[#0070f3]/10 text-[#0070f3] dark:text-[#50e3c2] border-[#0070f3]/30'
                  }`}
                >
                  {log.action}
                </span>
                <span className="font-caption-mono text-[10px] text-[#888888] dark:text-[#a1a1a1]">
                  {formatDateTime(log.createdAt)}
                </span>
              </div>

              <p className="text-xs text-[#171717] dark:text-[#ffffff] font-medium">{log.description || '-'}</p>

              <div className="pt-2 border-t border-[#ebebeb] dark:border-[#262626] flex items-center justify-between font-caption-mono text-[10px] text-[#888888] dark:text-[#a1a1a1]">
                <span>{log.user?.userCode || (log.user as any)?.email || 'Sistem'}</span>
                <span>{log.ipAddress || '127.0.0.1'}</span>
              </div>
            </div>
          ))
        ) : (
          <div className="py-8 text-center font-caption-mono text-xs text-[#888888] dark:text-[#737373] bg-[#ffffff] dark:bg-[#0a0a0a] rounded-xl border border-[#ebebeb] dark:border-[#262626]">
            Belum ada audit log terdaftar.
          </div>
        )}
      </div>

      {/* Desktop Audit Log Table */}
      <div className="hidden sm:block vercel-card p-6">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[#ebebeb] dark:border-[#262626] font-caption-mono text-[11px] text-[#888888] dark:text-[#a1a1a1] uppercase tracking-wider bg-[#fafafa] dark:bg-[#000000]">
                <th className="py-3 px-4">WAKTU</th>
                <th className="py-3 px-4">KODE USER</th>
                <th className="py-3 px-4">AKTIVITAS</th>
                <th className="py-3 px-4">MODUL</th>
                <th className="py-3 px-4">KETERANGAN</th>
                <th className="py-3 px-4 text-center">IP ADDRESS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#ebebeb] dark:divide-[#262626] text-xs font-sans">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-[#888888] dark:text-[#a1a1a1]">
                    <Loader2 className="w-5 h-5 text-[#0070f3] animate-spin mx-auto mb-2" />
                    <span className="font-caption-mono text-xs">Memuat audit log...</span>
                  </td>
                </tr>
              ) : logs.length > 0 ? (
                logs.map((log) => (
                  <tr key={log.id} className="hover:bg-[#fafafa] dark:hover:bg-[#171717]/50 transition-colors">
                    <td className="py-3.5 px-4 font-caption-mono text-[#888888] dark:text-[#a1a1a1] whitespace-nowrap">
                      {formatDateTime(log.createdAt)}
                    </td>
                    <td className="py-3.5 px-4 font-caption-mono text-[#0070f3] dark:text-[#50e3c2] font-semibold">
                      {log.user?.userCode || (log.user as any)?.email || 'Sistem'}
                    </td>
                    <td className="py-3.5 px-4">
                      <span
                        className={`vercel-badge-mono ${
                          log.action.includes('FAILED') || log.action.includes('DELETE')
                            ? 'bg-[#ee0000]/10 text-[#ee0000] border-[#ee0000]/30'
                            : log.action.includes('CREATE')
                            ? 'bg-[#50e3c2]/10 text-[#29bc9b] dark:text-[#50e3c2] border-[#50e3c2]/30'
                            : 'bg-[#0070f3]/10 text-[#0070f3] dark:text-[#50e3c2] border-[#0070f3]/30'
                        }`}
                      >
                        {log.action}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-caption-mono text-[#4d4d4d] dark:text-[#a1a1a1] uppercase font-semibold">
                      {log.module}
                    </td>
                    <td className="py-3.5 px-4 text-[#171717] dark:text-[#ffffff] max-w-md font-medium">{log.description || '-'}</td>
                    <td className="py-3.5 px-4 text-center font-caption-mono text-[#888888] dark:text-[#737373]">
                      {log.ipAddress || '127.0.0.1'}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="py-8 text-center font-caption-mono text-xs text-[#888888] dark:text-[#737373]">
                    Belum ada audit log recorded.
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
    </div>
  );
}
