import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { readDb } from '@/lib/db';
import { DashboardSummary } from '@/lib/types';

export async function GET() {
  const session = getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const db = readDb();
  const transactions = [...db.transactions];

  let totalIncome = 0;
  let totalExpense = 0;

  transactions.forEach((t) => {
    const amt = Number(t.amount);
    if (t.type === 'INCOME') totalIncome += amt;
    else totalExpense += amt;
  });

  const balance = totalIncome - totalExpense;

  // Recent 5 transactions
  const sorted = [...transactions]
    .sort((a, b) => new Date(b.transactionDate).getTime() - new Date(a.transactionDate).getTime())
    .map((t) => ({
      ...t,
      category: db.categories.find((c) => c.id === t.categoryId),
      user: db.users.find((u) => u.id === t.userId),
    }));

  const recentTransactions = sorted.slice(0, 5);

  // Group by Date for Line Chart (Balance / Income / Expense trend)
  const dateMap: { [key: string]: { income: number; expense: number } } = {};

  // Sort chronological for charts
  const chronoTrx = [...transactions].sort(
    (a, b) => new Date(a.transactionDate).getTime() - new Date(b.transactionDate).getTime()
  );

  chronoTrx.forEach((t) => {
    const dateStr = new Date(t.transactionDate).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
    });

    if (!dateMap[dateStr]) {
      dateMap[dateStr] = { income: 0, expense: 0 };
    }

    if (t.type === 'INCOME') dateMap[dateStr].income += Number(t.amount);
    else dateMap[dateStr].expense += Number(t.amount);
  });

  let runningBalance = 0;
  const monthlyChart = Object.keys(dateMap).map((dateKey) => {
    const inc = dateMap[dateKey].income;
    const exp = dateMap[dateKey].expense;
    runningBalance += inc - exp;

    return {
      date: dateKey,
      income: inc,
      expense: exp,
      balance: runningBalance,
    };
  });

  // Expense breakdown by category (Pie chart)
  const expCategoryMap: { [catName: string]: number } = {};
  transactions
    .filter((t) => t.type === 'EXPENSE')
    .forEach((t) => {
      const catName = db.categories.find((c) => c.id === t.categoryId)?.name || 'Lain-lain';
      expCategoryMap[catName] = (expCategoryMap[catName] || 0) + Number(t.amount);
    });

  const expenseByCategory = Object.keys(expCategoryMap).map((catName) => ({
    name: catName,
    value: expCategoryMap[catName],
    percentage: totalExpense > 0 ? Math.round((expCategoryMap[catName] / totalExpense) * 100) : 0,
  }));

  // Income breakdown by category (Donut chart)
  const incCategoryMap: { [catName: string]: number } = {};
  transactions
    .filter((t) => t.type === 'INCOME')
    .forEach((t) => {
      const catName = db.categories.find((c) => c.id === t.categoryId)?.name || 'Lain-lain';
      incCategoryMap[catName] = (incCategoryMap[catName] || 0) + Number(t.amount);
    });

  const incomeByCategory = Object.keys(incCategoryMap).map((catName) => ({
    name: catName,
    value: incCategoryMap[catName],
    percentage: totalIncome > 0 ? Math.round((incCategoryMap[catName] / totalIncome) * 100) : 0,
  }));

  const summaryData: DashboardSummary = {
    totalIncome,
    totalExpense,
    balance,
    totalTransactions: transactions.length,
    recentTransactions,
    monthlyChart,
    expenseByCategory,
    incomeByCategory,
  };

  return NextResponse.json({ data: summaryData });
}
