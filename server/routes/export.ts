import { Router, Request, Response } from 'express';
import { authenticateToken } from '../middleware/auth';
import { db } from '../db/index';
import {
  findUserById,
  getOrCreateMonthlyFinance,
  TransactionRow,
} from '../db/queries';
import { calculatePeriodSummary } from '../services/calculations';
import {
  generateMonthlyWorkbook,
  generateTransactionsWorkbook,
} from '../services/excel';

export const exportRouter = Router();
exportRouter.use(authenticateToken);

// Helper for days in month
function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate();
}

// GET /api/export/monthly-xlsx?month=YYYY-MM
exportRouter.get('/monthly-xlsx', async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const now = new Date();
    const currentMonthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const month = (req.query.month as string) || currentMonthStr;

    const user = findUserById(userId);
    const finance = getOrCreateMonthlyFinance(userId, month);
    const currencySymbol = user?.currency_symbol || '₹';

    const [yearStr, monthNumStr] = month.split('-');
    const year = parseInt(yearStr, 10);
    const monthNum = parseInt(monthNumStr, 10);
    const daysCount = getDaysInMonth(year, monthNum);

    // Fetch transactions
    const transactions = db.prepare(`
      SELECT t.*, i.income_type
      FROM transactions t
      LEFT JOIN income_details i ON t.id = i.transaction_id
      WHERE t.user_id = ?
        AND strftime('%Y-%m', t.transaction_date) = ?
        AND t.status = 'confirmed'
      ORDER BY t.transaction_date ASC, t.transaction_time ASC
    `).all(userId, month) as TransactionRow[];

    const priorNetResult = db.prepare(`
      SELECT COALESCE(SUM(CASE WHEN type = 'income' THEN amount ELSE -amount END), 0) as prior_net
      FROM transactions
      WHERE user_id = ?
        AND strftime('%Y-%m', transaction_date) < ?
        AND status = 'confirmed'
    `).get(userId, month) as { prior_net: number };

    const priorNet = priorNetResult?.prior_net || 0;
    const userStartMonth = user?.created_at ? user.created_at.substring(0, 7) : month;
    const isPriorToAccount = month < userStartMonth && transactions.length === 0 && priorNet === 0;

    const openingBalance = isPriorToAccount ? 0 : ((user?.opening_balance || 0) + (finance?.opening_balance || 0));
    const summary = calculatePeriodSummary(transactions, openingBalance, priorNet);
    if (isPriorToAccount) {
      summary.availableBalance = 0;
    }

    const expenses = transactions.filter((t) => t.type === 'expense');
    const income = transactions.filter((t) => t.type === 'income');

    // Daily summary data
    const dailyMap: Record<string, { income: number; expenses: number }> = {};
    for (let day = 1; day <= daysCount; day++) {
      const dateStr = `${month}-${String(day).padStart(2, '0')}`;
      dailyMap[dateStr] = { income: 0, expenses: 0 };
    }

    for (const t of transactions) {
      if (dailyMap[t.transaction_date]) {
        if (t.type === 'income') dailyMap[t.transaction_date].income += t.amount;
        if (t.type === 'expense') dailyMap[t.transaction_date].expenses += t.amount;
      }
    }

    const dailySummaries = Object.entries(dailyMap).map(([date, val]) => ({
      date,
      income: val.income,
      expenses: val.expenses,
      net: Math.round((val.income - val.expenses) * 100) / 100,
    }));

    // Category summary data
    const catMap: Record<string, number> = {};
    for (const e of expenses) {
      catMap[e.category_name] = (catMap[e.category_name] || 0) + e.amount;
    }

    const categorySummaries = Object.entries(catMap)
      .map(([category, total]) => ({
        category,
        total: Math.round(total * 100) / 100,
        percentage: summary.totalExpenses > 0
          ? Math.round((total / summary.totalExpenses) * 10000) / 100
          : 0,
      }))
      .sort((a, b) => b.total - a.total);

    // Monthly comparison
    const compRows = db.prepare(`
      SELECT
        strftime('%Y-%m', transaction_date) as m,
        COALESCE(SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END), 0) as inc,
        COALESCE(SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END), 0) as exp
      FROM transactions
      WHERE user_id = ? AND status = 'confirmed'
      GROUP BY strftime('%Y-%m', transaction_date)
      ORDER BY m DESC
      LIMIT 12
    `).all(userId) as Array<{ m: string; inc: number; exp: number }>;

    const monthlyComparisons = compRows.reverse().map((r) => ({
      month: r.m,
      income: r.inc,
      expenses: r.exp,
      net: Math.round((r.inc - r.exp) * 100) / 100,
    }));

    const workbook = await generateMonthlyWorkbook({
      month,
      currencySymbol,
      openingBalance,
      totalIncome: summary.totalIncome,
      totalExpenses: summary.totalExpenses,
      netAmount: summary.netAmount,
      spendingPercentage: summary.spendingPercentage,
      savingsRate: summary.savingsRate,
      availableBalance: summary.availableBalance,
      monthlyBudget: finance.monthly_budget,
      expenses,
      income,
      dailySummaries,
      categorySummaries,
      monthlyComparisons,
    });

    const buffer = await workbook.xlsx.writeBuffer();
    const filename = `SpendWise-Monthly-Report-${month}.xlsx`;
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Length', String(buffer.byteLength));
    res.send(Buffer.from(buffer));
  } catch (err: any) {
    console.error('Export monthly xlsx error:', err);
    res.status(500).json({ error: 'Failed to export monthly Excel report' });
  }
});

// GET /api/export/transactions-xlsx?type=all|expense|income&startDate=...&endDate=...
exportRouter.get('/transactions-xlsx', async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { type = 'all', startDate, endDate, month } = req.query;

    const user = findUserById(userId);
    const currencySymbol = user?.currency_symbol || '₹';

    let whereClauses = ['user_id = ?', "status = 'confirmed'"];
    let params: any[] = [userId];

    if (type !== 'all') {
      whereClauses.push('type = ?');
      params.push(type);
    }

    if (month) {
      whereClauses.push("strftime('%Y-%m', transaction_date) = ?");
      params.push(month);
    }

    if (startDate) {
      whereClauses.push('transaction_date >= ?');
      params.push(startDate);
    }

    if (endDate) {
      whereClauses.push('transaction_date <= ?');
      params.push(endDate);
    }

    const whereSql = whereClauses.join(' AND ');

    const transactions = db.prepare(`
      SELECT t.*, i.income_type
      FROM transactions t
      LEFT JOIN income_details i ON t.id = i.transaction_id
      WHERE ${whereSql}
      ORDER BY transaction_date DESC, transaction_time DESC
    `).all(...params) as TransactionRow[];

    const typeTitle = type === 'expense' ? 'Expenses' : type === 'income' ? 'Income' : 'Transactions';
    const workbook = await generateTransactionsWorkbook(typeTitle, transactions, currencySymbol);

    const buffer = await workbook.xlsx.writeBuffer();
    const filename = `SpendWise-${typeTitle}-Export-${new Date().toISOString().split('T')[0]}.xlsx`;
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Length', String(buffer.byteLength));
    res.send(Buffer.from(buffer));
  } catch (err: any) {
    console.error('Export transactions xlsx error:', err);
    res.status(500).json({ error: 'Failed to export transactions Excel file' });
  }
});
