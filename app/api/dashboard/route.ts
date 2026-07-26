import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
  const session = getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const transactions = await prisma.transaction.findMany({
    include: { category: true, user: { select: { id: true, name: true, userCode: true } } },
    orderBy: { transactionDate: 'desc' },
  });

  let totalIncome = 0;
  let totalExpense = 0;
  transactions.forEach((t) => {
    const amt = Number(t.amount);
    if (t.type === 'INCOME') totalIncome += amt;
    else totalExpense += amt;
  });

  const balance = totalIncome - totalExpense;
  const recentTransactions = transactions.slice(0, 5);

  // Line chart grouped by date
  const dateMap: { [key: string]: { income: number; expense: number } } = {};
  const chronoTrx = [...transactions].sort((a, b) => new Date(a.transactionDate).getTime() - new Date(b.transactionDate).getTime());
  chronoTrx.forEach((t) => {
    const dateStr = new Date(t.transactionDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
    if (!dateMap[dateStr]) dateMap[dateStr] = { income: 0, expense: 0 };
    if (t.type === 'INCOME') dateMap[dateStr].income += Number(t.amount);
    else dateMap[dateStr].expense += Number(t.amount);
  });

  let runningBalance = 0;
  const monthlyChart = Object.keys(dateMap).map((dateKey) => {
    const inc = dateMap[dateKey].income;
    const exp = dateMap[dateKey].expense;
    runningBalance += inc - exp;
    return { date: dateKey, income: inc, expense: exp, balance: runningBalance };
  });

  // Expense by category
  const expCategoryMap: { [catName: string]: number } = {};
  transactions.filter((t) => t.type === 'EXPENSE').forEach((t) => {
    const catName = t.category?.name || 'Lain-lain';
    expCategoryMap[catName] = (expCategoryMap[catName] || 0) + Number(t.amount);
  });
  const expenseByCategory = Object.keys(expCategoryMap).map((catName) => ({
    name: catName,
    value: expCategoryMap[catName],
    percentage: totalExpense > 0 ? Math.round((expCategoryMap[catName] / totalExpense) * 100) : 0,
  }));

  // Income by category
  const incCategoryMap: { [catName: string]: number } = {};
  transactions.filter((t) => t.type === 'INCOME').forEach((t) => {
    const catName = t.category?.name || 'Lain-lain';
    incCategoryMap[catName] = (incCategoryMap[catName] || 0) + Number(t.amount);
  });
  const incomeByCategory = Object.keys(incCategoryMap).map((catName) => ({
    name: catName,
    value: incCategoryMap[catName],
    percentage: totalIncome > 0 ? Math.round((incCategoryMap[catName] / totalIncome) * 100) : 0,
  }));

  const summaryData = {
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
