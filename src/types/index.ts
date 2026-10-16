export type TransactionType = 'income' | 'expense';

export type PaymentMethod = 'cash' | 'upi' | 'debit_card' | 'credit_card' | 'bank_transfer' | 'other';

export type IncomeType = 'salary' | 'bonus' | 'incentive' | 'freelance' | 'gift' | 'reimbursement' | 'other';

export interface User {
  id: string;
  email: string;
  displayName: string;
  currency: string;
  currencySymbol: string;
  monthlySalary: number;
  salaryDay: number;
  openingBalance: number;
  monthlyBudget: number;
  autoRecurringSalary?: boolean;
  onboardingCompleted: boolean;
}

export interface Category {
  id: string;
  user_id: string;
  name: string;
  type: TransactionType;
  icon: string;
  color: string;
  budget_limit: number;
  is_default: number;
  created_at: string;
}

export interface Transaction {
  id: string;
  user_id: string;
  type: TransactionType;
  amount: number;
  description: string;
  category_id: string;
  category_name: string;
  payment_method: PaymentMethod;
  transaction_date: string; // 'YYYY-MM-DD'
  transaction_time: string; // 'HH:MM'
  notes: string | null;
  tags: string | null;
  status: 'confirmed' | 'pending' | 'scheduled';
  is_recurring: number;
  recurring_frequency: string | null;
  created_at: string;
  updated_at: string;
  income_type?: IncomeType;
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

export interface DashboardData {
  month: string;
  summary: PeriodSummary;
  budget: {
    monthlyBudget: number;
    budgetSpent: number;
    budgetRemaining: number;
    budgetUsedPercentage: number;
    isExceeded: boolean;
    isWarning: boolean;
  };
  incomeBreakdown: {
    totalSalary: number;
    totalBonus: number;
    totalOtherIncome: number;
  };
  dailyTrends: Array<{
    day: number;
    date: string;
    expense: number;
    income: number;
  }>;
  dailyStats: {
    averageDailySpending: number;
    highestSpendingDay: { date: string; amount: number };
    lowestSpendingDay: { date: string; amount: number };
    activeSpendingDays: number;
    totalMonthSpending: number;
  };
  categoryBreakdown: Array<{
    categoryId: string;
    categoryName: string;
    icon: string;
    color: string;
    total: number;
    percentage: number;
  }>;
  recentTransactions: Transaction[];
}

export interface MonthlyFinance {
  id: string;
  user_id: string;
  month: string;
  opening_balance: number;
  monthly_budget: number;
  savings_goal: number;
  notes: string | null;
}

export interface UserPreferences {
  user_id: string;
  theme: 'light' | 'dark' | 'system';
  salary_reminder_enabled: number;
  daily_expense_reminder: number;
  budget_alert_threshold: number;
  monthly_review_reminder: number;
  recurring_bills_reminder: number;
  reminder_time: string;
}
