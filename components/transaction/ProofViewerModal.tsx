'use client';

import React from 'react';
import { X, Download, FileText } from 'lucide-react';
import { TransactionItem } from '@/lib/types';
import { formatFileSize } from '@/lib/utils';

interface ProofViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
  transaction: TransactionItem | null;
}

export const ProofViewerModal: React.FC<ProofViewerModalProps> = ({
  isOpen,
  onClose,
  transaction,
}) => {
  if (!isOpen || !transaction || !transaction.attachmentUrl) return null;

  const isPdf =
    transaction.attachmentMimeType === 'application/pdf' ||
    transaction.attachmentUrl.startsWith('data:application/pdf') ||
    transaction.attachmentUrl.endsWith('.pdf');

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-[#ffffff] dark:bg-[#0a0a0a] border border-[#ebebeb] dark:border-[#262626] rounded-xl w-full max-w-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in duration-200 text-[#171717] dark:text-[#ffffff]">
        {/* Header */}
        <div className="px-5 py-4 border-b border-[#ebebeb] dark:border-[#262626] flex items-center justify-between bg-[#fafafa] dark:bg-[#000000]">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[#0070f3]/10 text-[#0070f3] dark:text-[#50e3c2] border border-[#0070f3]/30 flex items-center justify-center font-mono">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-[#171717] dark:text-[#ffffff] font-caption-mono">
                BUKTI LAMPIRAN TRANSAKSI &bull; {transaction.attachmentName || 'Dokumen Bukti'}
              </h3>
              <p className="font-caption-mono text-[10px] text-[#888888] dark:text-[#a1a1a1]">
                Ukuran: {formatFileSize(transaction.attachmentSize)} &bull; ID: {transaction.id}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <a
              href={transaction.attachmentUrl}
              download={transaction.attachmentName || 'bukti-transaksi'}
              target="_blank"
              rel="noopener noreferrer"
              className="vercel-button-secondary py-1 px-3 text-xs font-caption-mono font-bold"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Unduh</span>
            </a>
            <button
              onClick={onClose}
              className="text-[#888888] dark:text-[#a1a1a1] hover:text-[#171717] dark:hover:text-[#ffffff] p-1 rounded-md transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 p-4 sm:p-6 overflow-auto bg-[#fafafa] dark:bg-[#000000] flex items-center justify-center min-h-[280px]">
          {isPdf ? (
            <iframe
              src={transaction.attachmentUrl}
              className="w-full h-[550px] rounded-lg border border-[#ebebeb] dark:border-[#262626]"
              title="PDF Viewer"
            />
          ) : (
            <div className="relative max-h-[600px] flex items-center justify-center">
              <img
                src={transaction.attachmentUrl}
                alt={transaction.attachmentName || 'Bukti Transaksi'}
                className="max-h-[550px] w-auto max-w-full rounded-lg border border-[#ebebeb] dark:border-[#262626] object-contain"
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
