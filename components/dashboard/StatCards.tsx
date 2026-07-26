'use client';

import React from 'react';
import { ArrowUpRight, ArrowDownRight, Banknote } from 'lucide-react';
import { formatRupiah } from '@/lib/utils';

interface StatCardsProps {
  totalIncome: number;
  totalExpense: number;
  balance: number;
  totalTransactions: number;
}

export const StatCards: React.FC<StatCardsProps> = ({
  totalIncome,
  totalExpense,
  balance,
}) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-5">
      {/* 1. Saldo Kas */}
      <div className="vercel-card p-5 sm:p-6 relative overflow-hidden bg-[#ffffff] dark:bg-[#0a0a0a] border border-[#ebebeb] dark:border-[#262626]">
        <div className="flex items-center justify-between">
          <span className="font-caption-mono text-[10px] sm:text-[11px] uppercase tracking-wider text-[#0070f3] dark:text-[#50e3c2] font-semibold">
            TOTAL SALDO KAS
          </span>
          <div className="w-8 h-8 rounded-lg bg-[#0070f3]/10 text-[#0070f3] dark:text-[#50e3c2] border border-[#0070f3]/30 flex items-center justify-center">
            <Banknote className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-4">
          <p className="text-2xl sm:text-3xl font-bold text-[#171717] dark:text-[#ffffff] tracking-tight font-sans truncate">
            {formatRupiah(balance)}
          </p>
          <p className="mt-1 font-caption-mono text-[11px] text-[#888888] dark:text-[#737373] truncate">
            Akumulasi kas bersih
          </p>
        </div>
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#007cf0] via-[#7928ca] to-[#ff0080]" />
      </div>

      {/* 2. Total Pemasukan */}
      <div className="vercel-card p-5 sm:p-6 relative overflow-hidden bg-[#ffffff] dark:bg-[#0a0a0a] border border-[#ebebeb] dark:border-[#262626]">
        <div className="flex items-center justify-between">
          <span className="font-caption-mono text-[10px] sm:text-[11px] uppercase tracking-wider text-[#888888] dark:text-[#a1a1a1] font-semibold">
            PEMASUKAN
          </span>
          <div className="w-8 h-8 rounded-lg bg-[#50e3c2]/10 text-[#29bc9b] dark:text-[#50e3c2] border border-[#50e3c2]/30 flex items-center justify-center">
            <ArrowUpRight className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-4">
          <p className="text-xl sm:text-2xl font-bold text-[#29bc9b] dark:text-[#50e3c2] tracking-tight font-sans truncate">
            {formatRupiah(totalIncome)}
          </p>
          <p className="mt-1 font-caption-mono text-[11px] text-[#888888] dark:text-[#737373] truncate">
            Total penerimaan kas
          </p>
        </div>
      </div>

      {/* 3. Total Pengeluaran */}
      <div className="vercel-card p-5 sm:p-6 relative overflow-hidden bg-[#ffffff] dark:bg-[#0a0a0a] border border-[#ebebeb] dark:border-[#262626]">
        <div className="flex items-center justify-between">
          <span className="font-caption-mono text-[10px] sm:text-[11px] uppercase tracking-wider text-[#888888] dark:text-[#a1a1a1] font-semibold">
            PENGELUARAN
          </span>
          <div className="w-8 h-8 rounded-lg bg-[#ee0000]/10 text-[#ee0000] border border-[#ee0000]/30 flex items-center justify-center">
            <ArrowDownRight className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-4">
          <p className="text-xl sm:text-2xl font-bold text-[#ee0000] tracking-tight font-sans truncate">
            {formatRupiah(totalExpense)}
          </p>
          <p className="mt-1 font-caption-mono text-[11px] text-[#888888] dark:text-[#737373] truncate">
            Total pengeluaran kas
          </p>
        </div>
      </div>
    </div>
  );
};
