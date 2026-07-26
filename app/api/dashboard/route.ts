import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
  const session = getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const [incomeAgg, expenseAgg, totalCount, recentTransactions, chartData, expenseGroup, incomeGroup] =
    await Promise.all([
      prisma.transaction.aggregate({ where: { type: 'INCOME' }, _sum: { amount: true } }),
      prisma.transaction.aggregate({ where: { type: 'EXPENSE' }, _sum: { amount: true } }),
      prisma.transaction.count(),
      prisma.transaction.findMany({
        take: 5,
        orderBy: { transactionDate: 'desc' },
        include: { category: { select: { id: true, name: true, type: true } }, user: { select: { id: true, name: true, userCode: true } } },
      }),
      prisma.transaction.findMany({
        select: { type: true, amount: true, transactionDate: true },
        orderBy: { transactionDate: 'asc' },
      }),
      prisma.transaction.groupBy({
        by: ['categoryId'],
        where: { type: 'EXPENSE' },
        _sum: { amount: true },
      }),
      prisma.transaction.groupBy({
        by: ['categoryId'],
        where: { type: 'INCOME' },
        _sum: { amount: true },
      }),
    ]);

  const totalIncome = Number(incomeAgg._sum.amount) || 0;
  const totalExpense = Number(expenseAgg._sum.amount) || 0;
  const balance = totalIncome - totalExpense;

  // Chart: running balance grouped by date
  const dateMap: Record<string, { income: number; expense: number }> = {};
  for (const t of chartData) {
    const dateStr = new Date(t.transactionDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
    if (!dateMap[dateStr]) dateMap[dateStr] = { income: 0, expense: 0 };
    if (t.type === 'INCOME') dateMap[dateStr].income += Number(t.amount);
    else dateMap[dateStr].expense += Number(t.amount);
  }
  let runningBalance = 0;
  const monthlyChart = Object.entries(dateMap).map(([date, val]) => {
    runningBalance += val.income - val.expense;
    return { date, income: val.income, expense: val.expense, balance: runningBalance };
  });

  // Category names lookup
  const catIds = Array.from(new Set([...expenseGroup.map((g) => g.categoryId), ...incomeGroup.map((g) => g.categoryId)]));
  const categories = await prisma.category.findMany({ where: { id: { in: catIds } }, select: { id: true, name: true } });
  const catNameMap = Object.fromEntries(categories.map((c) => [c.id, c.name]));

  const expenseByCategory = expenseGroup.map((g) => ({
    name: catNameMap[g.categoryId] || 'Lain-lain',
    value: Number(g._sum.amount) || 0,
    percentage: totalExpense > 0 ? Math.round(((Number(g._sum.amount) || 0) / totalExpense) * 100) : 0,
  }));

  const incomeByCategory = incomeGroup.map((g) => ({
    name: catNameMap[g.categoryId] || 'Lain-lain',
    value: Number(g._sum.amount) || 0,
    percentage: totalIncome > 0 ? Math.round(((Number(g._sum.amount) || 0) / totalIncome) * 100) : 0,
  }));

  return NextResponse.json({
    data: {
      totalIncome,
      totalExpense,
      balance,
      totalTransactions: totalCount,
      recentTransactions,
      monthlyChart,
      expenseByCategory,
      incomeByCategory,
    },
  });
}
