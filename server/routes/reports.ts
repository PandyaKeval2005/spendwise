import { Router, Request, Response } from 'express';
import { authenticateToken } from '../middleware/auth';
import { db } from '../db/index';
import {
  findUserById,
  getOrCreateMonthlyFinance,
  TransactionRow,
} from '../db/queries';
import {
  calculatePeriodSummary,
  calculateDailyStats,
} from '../services/calculations';

export const reportsRouter = Router();
reportsRouter.use(authenticateToken);

// Helper: Get number of days in month
function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate();
}

// GET /api/reports/dashboard?month=YYYY-MM
reportsRouter.get('/dashboard', (req: Request, res: Response): void => {
  try {
    const userId = req.user!.id;
    const now = new Date();
    const currentMonthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const month = (req.query.month as string) || currentMonthStr;

    const [yearStr, monthNumStr] = month.split('-');
    const year = parseInt(yearStr, 10);
    const monthNum = parseInt(monthNumStr, 10);
    const daysCount = getDaysInMonth(year, monthNum);

    const user = findUserById(userId);
    const finance = getOrCreateMonthlyFinance(userId, month);

    // 1. Fetch all confirmed transactions for this month
    const monthTransactions = db.prepare(`
      SELECT t.*, i.income_type
      FROM transactions t
      LEFT JOIN income_details i ON t.id = i.transaction_id
      WHERE t.user_id = ?
        AND strftime('%Y-%m', t.transaction_date) = ?
        AND t.status = 'confirmed'
      ORDER BY t.transaction_date DESC, t.transaction_time DESC
    `).all(userId, month) as TransactionRow[];

    // 2. Fetch cumulative net before this month to compute exact Available Balance
    const priorNetResult = db.prepare(`
      SELECT
        COALESCE(SUM(CASE WHEN type = 'income' THEN amount ELSE -amount END), 0) as prior_net
      FROM transactions
      WHERE user_id = ?
        AND strftime('%Y-%m', transaction_date) < ?
        AND status = 'confirmed'
    `).get(userId, month) as { prior_net: number };

    const priorNet = priorNetResult?.prior_net || 0;
    
    // If browsing a historical month before account creation with zero activity, show 0
    const userStartMonth = user?.created_at ? user.created_at.substring(0, 7) : month;
    const isPriorToAccount = month < userStartMonth && monthTransactions.length === 0 && priorNet === 0;

    const openingBalance = isPriorToAccount ? 0 : ((user?.opening_balance || 0) + (finance?.opening_balance || 0));

    // 3. Compute authoritative summary
    const summary = calculatePeriodSummary(monthTransactions, openingBalance, priorNet);
    if (isPriorToAccount) {
      summary.availableBalance = 0;
    }

    // 4. Daily spending trend: all calendar days in month (1 to daysCount)
    const dailyMap: Record<string, { day: number; date: string; expense: number; income: number }> = {};
    for (let day = 1; day <= daysCount; day++) {
      const dateStr = `${month}-${String(day).padStart(2, '0')}`;
      dailyMap[dateStr] = {
        day,
        date: dateStr,
        expense: 0,
        income: 0,
      };
    }

    const dailyExpenseMap: Record<string, number> = {};

    for (const t of monthTransactions) {
      if (dailyMap[t.transaction_date]) {
        if (t.type === 'expense') {
          dailyMap[t.transaction_date].expense += t.amount;
          dailyExpenseMap[t.transaction_date] = (dailyExpenseMap[t.transaction_date] || 0) + t.amount;
        } else if (t.type === 'income') {
          dailyMap[t.transaction_date].income += t.amount;
        }
      }
    }

    const dailyTrends = Object.values(dailyMap).sort((a, b) => a.day - b.day);
    const dailyStats = calculateDailyStats(daysCount, dailyExpenseMap);

    // 5. Category breakdown for expenses
    const categoryAgg: Record<string, { categoryId: string; categoryName: string; icon: string; color: string; total: number }> = {};
    for (const t of monthTransactions) {
      if (t.type === 'expense') {
        if (!categoryAgg[t.category_name]) {
          // get category metadata
          const cat = db.prepare('SELECT icon, color FROM categories WHERE id = ?').get(t.category_id) as { icon: string; color: string } | undefined;
          categoryAgg[t.category_name] = {
            categoryId: t.category_id,
            categoryName: t.category_name,
            icon: cat?.icon || 'Tag',
            color: cat?.color || '#059669',
            total: 0,
          };
        }
        categoryAgg[t.category_name].total += t.amount;
      }
    }

    const categoryBreakdown = Object.values(categoryAgg)
      .map((c) => ({
        ...c,
        total: Math.round(c.total * 100) / 100,
        percentage: summary.totalExpenses > 0
          ? Math.round((c.total / summary.totalExpenses) * 10000) / 100
          : 0,
      }))
      .sort((a, b) => b.total - a.total);

    // 6. Salary vs Bonus breakdown
    let totalSalary = 0;
    let totalBonus = 0;
    let totalOtherIncome = 0;

    for (const t of monthTransactions) {
      if (t.type === 'income') {
        if (t.income_type === 'salary') {
          totalSalary += t.amount;
        } else if (t.income_type === 'bonus' || t.income_type === 'incentive') {
          totalBonus += t.amount;
        } else {
          totalOtherIncome += t.amount;
        }
      }
    }

    // 7. Monthly budget progress (only if explicitly set for this month)
    const monthlyBudget = finance.monthly_budget > 0 ? finance.monthly_budget : 0;
    const budgetRemaining = Math.max(0, monthlyBudget - summary.totalExpenses);
    const budgetUsedPercentage = monthlyBudget > 0
      ? Math.round((summary.totalExpenses / monthlyBudget) * 10000) / 100
      : 0;

    // 8. Recent 8 transactions
    const recentTransactions = monthTransactions.slice(0, 8);

    res.json({
      month,
      summary,
      budget: {
        monthlyBudget,
        budgetSpent: summary.totalExpenses,
        budgetRemaining,
        budgetUsedPercentage,
        isExceeded: monthlyBudget > 0 && summary.totalExpenses > monthlyBudget,
        isWarning: monthlyBudget > 0 && budgetUsedPercentage >= 80,
      },
      incomeBreakdown: {
        totalSalary,
        totalBonus,
        totalOtherIncome,
      },
      dailyTrends,
      dailyStats,
      categoryBreakdown,
      recentTransactions,
    });
  } catch (err: any) {
    console.error('Dashboard report error:', err);
    res.status(500).json({ error: 'Failed to generate dashboard report' });
  }
});

// GET /api/reports/analytics?period=...&startDate=...&endDate=...
reportsRouter.get('/analytics', (req: Request, res: Response): void => {
  try {
    const userId = req.user!.id;
    const { period = 'this_month', startDate: customStart, endDate: customEnd } = req.query;

    const now = new Date();
    let startDate = '';
    let endDate = '';

    const formatDate = (d: Date) => d.toISOString().split('T')[0];

    if (period === 'today') {
      startDate = formatDate(now);
      endDate = formatDate(now);
    } else if (period === 'yesterday') {
      const y = new Date(now);
      y.setDate(y.getDate() - 1);
      startDate = formatDate(y);
      endDate = formatDate(y);
    } else if (period === 'this_week') {
      const day = now.getDay();
      const diff = now.getDate() - day + (day === 0 ? -6 : 1); // Monday
      const monday = new Date(now.setDate(diff));
      startDate = formatDate(monday);
      endDate = formatDate(new Date());
    } else if (period === 'this_month') {
      startDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
      endDate = formatDate(now);
    } else if (period === 'prev_month') {
      const prev = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const prevEnd = new Date(now.getFullYear(), now.getMonth(), 0);
      startDate = formatDate(prev);
      endDate = formatDate(prevEnd);
    } else if (period === 'last_3_months') {
      const threeMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 2, 1);
      startDate = formatDate(threeMonthsAgo);
      endDate = formatDate(now);
    } else if (period === 'this_year') {
      startDate = `${now.getFullYear()}-01-01`;
      endDate = formatDate(now);
    } else if (period === 'custom') {
      startDate = (customStart as string) || `${now.getFullYear()}-01-01`;
      endDate = (customEnd as string) || formatDate(now);
    } else {
      startDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
      endDate = formatDate(now);
    }

    // Fetch transactions in range
    const transactions = db.prepare(`
      SELECT t.*, i.income_type
      FROM transactions t
      LEFT JOIN income_details i ON t.id = i.transaction_id
      WHERE t.user_id = ?
        AND t.transaction_date >= ?
        AND t.transaction_date <= ?
        AND t.status = 'confirmed'
      ORDER BY t.transaction_date DESC, t.transaction_time DESC
    `).all(userId, startDate, endDate) as TransactionRow[];

    const user = findUserById(userId);
    const summary = calculatePeriodSummary(transactions, user?.opening_balance || 0);

    // Most expensive expense transaction
    const expenses = transactions.filter((t) => t.type === 'expense');
    let mostExpensiveTransaction: TransactionRow | null = null;
    let maxExpAmount = 0;
    for (const e of expenses) {
      if (e.amount > maxExpAmount) {
        maxExpAmount = e.amount;
        mostExpensiveTransaction = e;
      }
    }

    // Daily spending aggregation
    const dailySpendMap: Record<string, number> = {};
    for (const e of expenses) {
      dailySpendMap[e.transaction_date] = (dailySpendMap[e.transaction_date] || 0) + e.amount;
    }

    // Category breakdown
    const catMap: Record<string, { categoryName: string; total: number; color: string; icon: string }> = {};
    for (const e of expenses) {
      if (!catMap[e.category_name]) {
        const cat = db.prepare('SELECT icon, color FROM categories WHERE id = ?').get(e.category_id) as { icon: string; color: string } | undefined;
        catMap[e.category_name] = {
          categoryName: e.category_name,
          total: 0,
          color: cat?.color || '#059669',
          icon: cat?.icon || 'Tag',
        };
      }
      catMap[e.category_name].total += e.amount;
    }

    const categoryBreakdown = Object.values(catMap)
      .map((c) => ({
        ...c,
        total: Math.round(c.total * 100) / 100,
        percentage: summary.totalExpenses > 0
          ? Math.round((c.total / summary.totalExpenses) * 10000) / 100
          : 0,
      }))
      .sort((a, b) => b.total - a.total);

    // Monthly comparison (last 6 months)
    const monthlyComparisonRows = db.prepare(`
      SELECT
        strftime('%Y-%m', transaction_date) as month,
        COALESCE(SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END), 0) as income,
        COALESCE(SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END), 0) as expenses
      FROM transactions
      WHERE user_id = ?
        AND status = 'confirmed'
        AND transaction_date >= date('now', '-6 months')
      GROUP BY strftime('%Y-%m', transaction_date)
      ORDER BY month ASC
    `).all(userId) as Array<{ month: string; income: number; expenses: number }>;

    const monthlyComparisons = monthlyComparisonRows.map((m) => ({
      month: m.month,
      income: m.income,
      expenses: m.expenses,
      net: Math.round((m.income - m.expenses) * 100) / 100,
    }));

    // Daily statistics
    const startObj = new Date(startDate);
    const endObj = new Date(endDate);
    const diffTime = Math.abs(endObj.getTime() - startObj.getTime());
    const totalDays = Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1);
    const dailyStats = calculateDailyStats(totalDays, dailySpendMap);

    res.json({
      period,
      startDate,
      endDate,
      totalDays,
      summary,
      dailyStats,
      mostExpensiveTransaction,
      categoryBreakdown,
      monthlyComparisons,
      transactionsCount: transactions.length,
    });
  } catch (err: any) {
    console.error('Analytics error:', err);
    res.status(500).json({ error: 'Failed to generate analytics' });
  }
});
