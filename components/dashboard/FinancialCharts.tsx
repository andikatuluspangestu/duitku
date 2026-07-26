'use client';

import React from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import { formatRupiah } from '@/lib/utils';

interface FinancialChartsProps {
  monthlyChart: Array<{
    date: string;
    income: number;
    expense: number;
    balance: number;
  }>;
  expenseByCategory: Array<{
    name: string;
    value: number;
    percentage: number;
  }>;
  incomeByCategory: Array<{
    name: string;
    value: number;
    percentage: number;
  }>;
}

const VERCEL_EXPENSE_COLORS = ['#ee0000', '#eb367f', '#7928ca', '#f5a623', '#ab570a'];
const VERCEL_INCOME_COLORS = ['#50e3c2', '#0070f3', '#00dfd8', '#29bc9b', '#0761d1'];

export const FinancialCharts: React.FC<FinancialChartsProps> = ({
  monthlyChart,
  expenseByCategory,
  incomeByCategory,
}) => {
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-[#0a0a0a] border border-[#262626] p-3 rounded-lg shadow-vercel-modal font-caption-mono text-xs space-y-1">
          <p className="font-bold text-white border-b border-[#262626] pb-1 mb-1">{label}</p>
          {payload.map((entry: any, index: number) => (
            <div key={index} className="flex items-center justify-between gap-4">
              <span className="flex items-center gap-1.5" style={{ color: entry.color }}>
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
                {entry.name}:
              </span>
              <span className="font-semibold text-[#f2f2f2]">{formatRupiah(entry.value)}</span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  const hasExpenseCategories = expenseByCategory && expenseByCategory.length > 0;
  const hasIncomeCategories = incomeByCategory && incomeByCategory.length > 0;

  return (
    <div className="space-y-6 mt-6">
      {/* 2 Main Charts: Line Chart & Bar Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 1. Line Chart */}
        <div className="vercel-card p-4 sm:p-6 flex flex-col">
          <div className="mb-4">
            <span className="font-caption-mono text-xs text-[#0070f3]">ANALISIS TREN</span>
            <h3 className="text-base font-bold text-white tracking-tight">Tren Pertumbuhan Saldo Kas</h3>
            <p className="font-caption-mono text-xs text-[#737373] mt-0.5">
              Metrik perkembangan saldo kas harian
            </p>
          </div>
          <div className="h-56 sm:h-64 w-full flex-1">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={monthlyChart}>
                <CartesianGrid strokeDasharray="2 2" stroke="#262626" />
                <XAxis dataKey="date" stroke="#737373" fontSize={11} fontFamily="JetBrains Mono" />
                <YAxis stroke="#737373" fontSize={11} fontFamily="JetBrains Mono" tickFormatter={(v) => `${v / 1000}k`} />
                <Tooltip content={<CustomTooltip />} />
                <Line
                  type="monotone"
                  dataKey="balance"
                  name="Saldo Kas"
                  stroke="#0070f3"
                  strokeWidth={2}
                  dot={{ r: 3, fill: '#0070f3' }}
                  activeDot={{ r: 6, fill: '#50e3c2' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 2. Bar Chart */}
        <div className="vercel-card p-4 sm:p-6 flex flex-col">
          <div className="mb-4">
            <span className="font-caption-mono text-xs text-[#50e3c2]">VOLUME TRANSAKSI</span>
            <h3 className="text-base font-bold text-white tracking-tight">Perbandingan Pemasukan vs Pengeluaran</h3>
            <p className="font-caption-mono text-xs text-[#737373] mt-0.5">
              Arus pemasukan dan pengeluaran kas
            </p>
          </div>
          <div className="h-56 sm:h-64 w-full flex-1">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyChart}>
                <CartesianGrid strokeDasharray="2 2" stroke="#262626" />
                <XAxis dataKey="date" stroke="#737373" fontSize={11} fontFamily="JetBrains Mono" />
                <YAxis stroke="#737373" fontSize={11} fontFamily="JetBrains Mono" tickFormatter={(v) => `${v / 1000}k`} />
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ fontSize: '11px', fontFamily: 'JetBrains Mono', paddingTop: '10px' }} />
                <Bar dataKey="income" name="Pemasukan" fill="#50e3c2" radius={[3, 3, 0, 0]} />
                <Bar dataKey="expense" name="Pengeluaran" fill="#ee0000" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Category Breakdown Charts (Only rendered if data exists) */}
      {(hasExpenseCategories || hasIncomeCategories) && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {hasExpenseCategories && (
            <div className="vercel-card p-4 sm:p-6 flex flex-col">
              <div className="mb-4">
                <span className="font-caption-mono text-xs text-[#eb367f]">KOMPOSISI PENGELUARAN</span>
                <h3 className="text-base font-bold text-white tracking-tight">Pengeluaran Per Kategori</h3>
              </div>
              <div className="h-56 w-full flex-1 flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={expenseByCategory}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={70}
                      label={({ name, percentage }) => `${name} ${percentage}%`}
                    >
                      {expenseByCategory.map((_, index) => (
                        <Cell key={`exp-${index}`} fill={VERCEL_EXPENSE_COLORS[index % VERCEL_EXPENSE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: any) => formatRupiah(value)} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {hasIncomeCategories && (
            <div className="vercel-card p-4 sm:p-6 flex flex-col">
              <div className="mb-4">
                <span className="font-caption-mono text-xs text-[#00dfd8]">SUMBER PEMASUKAN</span>
                <h3 className="text-base font-bold text-white tracking-tight">Pemasukan Per Kategori</h3>
              </div>
              <div className="h-56 w-full flex-1 flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={incomeByCategory}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={40}
                      outerRadius={70}
                      paddingAngle={3}
                      label={({ name, percentage }) => `${name} ${percentage}%`}
                    >
                      {incomeByCategory.map((_, index) => (
                        <Cell key={`inc-${index}`} fill={VERCEL_INCOME_COLORS[index % VERCEL_INCOME_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: any) => formatRupiah(value)} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
