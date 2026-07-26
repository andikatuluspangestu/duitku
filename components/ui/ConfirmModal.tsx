'use client';

import React from 'react';
import { AlertTriangle, Trash2, X, Loader2 } from 'lucide-react';

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'warning' | 'info';
  isLoading?: boolean;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Hapus',
  cancelText = 'Batal',
  variant = 'danger',
  isLoading = false,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto animate-in fade-in zoom-in duration-150">
      <div className="bg-[#ffffff] dark:bg-[#0a0a0a] border border-[#ebebeb] dark:border-[#262626] rounded-xl max-w-md w-full p-6 shadow-2xl space-y-5 text-[#171717] dark:text-[#ffffff]">
        {/* Header Icon & Title */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center border shrink-0 ${
                variant === 'danger'
                  ? 'bg-[#ee0000]/10 text-[#ee0000] border-[#ee0000]/30'
                  : variant === 'warning'
                  ? 'bg-[#f5a623]/10 text-[#f5a623] border-[#f5a623]/30'
                  : 'bg-[#0070f3]/10 text-[#0070f3] dark:text-[#50e3c2] border-[#0070f3]/30'
              }`}
            >
              {variant === 'danger' ? (
                <Trash2 className="w-5 h-5" />
              ) : (
                <AlertTriangle className="w-5 h-5" />
              )}
            </div>
            <div>
              <h3 className="text-base font-bold tracking-tight text-[#171717] dark:text-[#ffffff]">
                {title}
              </h3>
              <p className="font-caption-mono text-[10px] text-[#888888] dark:text-[#737373] uppercase tracking-wider mt-0.5">
                Konfirmasi Tindakan
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isLoading}
            className="text-[#888888] dark:text-[#a1a1a1] hover:text-[#171717] dark:hover:text-[#ffffff] p-1 rounded-md transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Message Content */}
        <p className="text-xs text-[#4d4d4d] dark:text-[#a1a1a1] leading-relaxed font-sans bg-[#fafafa] dark:bg-[#000000] p-3.5 rounded-lg border border-[#ebebeb] dark:border-[#262626]">
          {message}
        </p>

        {/* Modal Actions */}
        <div className="flex items-center justify-end gap-3 pt-1">
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="vercel-button-secondary py-2 px-4 text-xs font-semibold flex-1 sm:flex-initial"
          >
            {cancelText}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isLoading}
            className={`py-2 px-5 rounded-full text-xs font-semibold transition-all flex items-center justify-center gap-2 flex-1 sm:flex-initial text-white disabled:opacity-50 ${
              variant === 'danger'
                ? 'bg-[#ee0000] hover:bg-[#c50000] active:scale-95'
                : variant === 'warning'
                ? 'bg-[#f5a623] hover:bg-[#ab570a] active:scale-95'
                : 'bg-[#0070f3] hover:bg-[#0761d1] active:scale-95'
            }`}
          >
            {isLoading ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <span>{confirmText}</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
