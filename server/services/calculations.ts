/**
 * SpendWise Financial Calculations Engine
 * Authoritative financial calculations matching exact specifications.
 */

export interface TransactionRecord {
  id: string;
  type: 'income' | 'expense';
  amount: number;
  transaction_date: string; // 'YYYY-MM-DD'
  status?: string;
  category_name?: string;
  income_type?: string;
}

export interface PeriodSummary {
  totalIncome: number;
  totalExpenses: number;
  netAmount: number;
  spendingPercentage: number;
  savingsRate: number;
  incomeRemaining: number;
  availableBalance: number;
  openingBalance: number;
}

/**
 * Format numbers using Indian numbering system (e.g., ₹1,25,000.00)
 */
export function formatCurrency(amount: number, currency = 'INR', symbol = '₹'): string {
  if (isNaN(amount) || amount === null || amount === undefined) {
    amount = 0;
  }
  const isNegative = amount < 0;
  const absAmount = Math.abs(amount);

  // Format with Indian locale grouping
  const formatted = new Intl.NumberFormat('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(absAmount);

  return `${isNegative ? '-' : ''}${symbol}${formatted}`;
}

/**
 * Calculate totals and ratios for a given set of transactions within a period
 */
export function calculatePeriodSummary(
  transactions: TransactionRecord[],
  openingBalance = 0,
  cumulativeBalanceBeforePeriod = 0
): PeriodSummary {
  let totalIncome = 0;
  let totalExpenses = 0;

  for (const t of transactions) {
    // Only confirmed transactions are counted as actual money received or spent
    if (t.status && t.status !== 'confirmed') {
      continue;
    }
    const amt = Number(t.amount) || 0;
    if (t.type === 'income') {
      totalIncome += amt;
    } else if (t.type === 'expense') {
      totalExpenses += amt;
    }
  }

  // Round to 2 decimal places to avoid floating point inaccuracies
  totalIncome = Math.round(totalIncome * 100) / 100;
  totalExpenses = Math.round(totalExpenses * 100) / 100;

  // Net amount for period: Total income - Total expenses
  const netAmount = Math.round((totalIncome - totalExpenses) * 100) / 100;

  // Income remaining after expenses (excluding opening balance)
  const incomeRemaining = netAmount;

  // Spending percentage: (Total expenses / Total income) * 100 when income > 0
  const spendingPercentage = totalIncome > 0
    ? Math.round((totalExpenses / totalIncome) * 10000) / 100
    : 0;

  // Savings rate: (Net amount / Total income) * 100 when income > 0
  const savingsRate = totalIncome > 0
    ? Math.round((netAmount / totalIncome) * 10000) / 100
    : 0;

  // Available balance: Opening balance + cumulative historical balance + period net
  const availableBalance = Math.round((openingBalance + cumulativeBalanceBeforePeriod + netAmount) * 100) / 100;

  return {
    totalIncome,
    totalExpenses,
    netAmount,
    spendingPercentage,
    savingsRate,
    incomeRemaining,
    availableBalance,
    openingBalance,
  };
}

/**
 * Calculate daily expense statistics: average, highest, lowest day
 */
export function calculateDailyStats(
  daysInMonth: number,
  dailyExpenseMap: Record<string, number>
) {
  let highestDay = { date: '', amount: 0 };
  let lowestDay = { date: '', amount: Infinity };
  let totalSpending = 0;
  let activeSpendingDays = 0;

  for (const [date, amount] of Object.entries(dailyExpenseMap)) {
    totalSpending += amount;
    if (amount > highestDay.amount) {
      highestDay = { date, amount };
    }
    if (amount > 0 && amount < lowestDay.amount) {
      lowestDay = { date, amount };
    }
    if (amount > 0) {
      activeSpendingDays++;
    }
  }

  if (lowestDay.amount === Infinity) {
    lowestDay = { date: '', amount: 0 };
  }

  const averageDailySpending = daysInMonth > 0
    ? Math.round((totalSpending / daysInMonth) * 100) / 100
    : 0;

  return {
    averageDailySpending,
    highestSpendingDay: highestDay,
    lowestSpendingDay: lowestDay,
    activeSpendingDays,
    totalMonthSpending: totalSpending,
  };
}
