import { db, seedUserCategories, seedUserPreferences } from './index';
import crypto from 'node:crypto';

export interface UserRow {
  id: string;
  email: string;
  password_hash: string;
  display_name: string;
  currency: string;
  currency_symbol: string;
  monthly_salary: number;
  salary_day: number;
  opening_balance: number;
  monthly_budget: number;
  auto_recurring_salary: number;
  onboarding_completed: number;
  created_at: string;
  updated_at: string;
}

export interface TransactionRow {
  id: string;
  user_id: string;
  type: 'income' | 'expense';
  amount: number;
  description: string;
  category_id: string;
  category_name: string;
  payment_method: string;
  transaction_date: string;
  transaction_time: string;
  notes: string | null;
  tags: string | null;
  status: 'confirmed' | 'pending' | 'scheduled';
  is_recurring: number;
  recurring_frequency: string | null;
  created_at: string;
  updated_at: string;
  // joined from income_details if type === 'income'
  income_type?: string;
}

export interface MonthlyFinanceRow {
  id: string;
  user_id: string;
  month: string; // 'YYYY-MM'
  opening_balance: number;
  monthly_budget: number;
  savings_goal: number;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface CategoryRow {
  id: string;
  user_id: string;
  name: string;
  type: 'expense' | 'income';
  icon: string;
  color: string;
  budget_limit: number;
  is_default: number;
  created_at: string;
}

export interface UserPreferencesRow {
  user_id: string;
  theme: 'light' | 'dark' | 'system';
  salary_reminder_enabled: number;
  daily_expense_reminder: number;
  budget_alert_threshold: number;
  monthly_review_reminder: number;
  recurring_bills_reminder: number;
  reminder_time: string;
  updated_at: string;
}

// ========================
// USER QUERIES
// ========================

export function findUserByEmail(email: string): UserRow | null {
  const stmt = db.prepare('SELECT * FROM users WHERE LOWER(email) = LOWER(?) LIMIT 1');
  const user = stmt.get(email) as UserRow | undefined;
  return user || null;
}

export function findUserById(id: string): UserRow | null {
  const stmt = db.prepare('SELECT * FROM users WHERE id = ? LIMIT 1');
  const user = stmt.get(id) as UserRow | undefined;
  return user || null;
}

export function createUser(data: {
  email: string;
  passwordHash: string;
  displayName: string;
  currency?: string;
  currencySymbol?: string;
  monthlySalary?: number;
  salaryDay?: number;
  openingBalance?: number;
  monthlyBudget?: number;
  autoRecurringSalary?: boolean;
}): UserRow {
  const id = crypto.randomUUID();
  const now = new Date().toISOString();
  const currency = data.currency || 'INR';
  const currencySymbol = data.currencySymbol || (currency === 'INR' ? '₹' : '$');

  const stmt = db.prepare(`
    INSERT INTO users (
      id, email, password_hash, display_name, currency, currency_symbol,
      monthly_salary, salary_day, opening_balance, monthly_budget,
      auto_recurring_salary, onboarding_completed, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?)
  `);

  stmt.run(
    id,
    data.email.toLowerCase(),
    data.passwordHash,
    data.displayName,
    currency,
    currencySymbol,
    data.monthlySalary || 0,
    data.salaryDay || 1,
    data.openingBalance || 0,
    data.monthlyBudget || 0,
    data.autoRecurringSalary ? 1 : 0,
    now,
    now
  );

  // Seed default categories and preferences
  seedUserCategories(id);
  seedUserPreferences(id);

  return findUserById(id)!;
}

export function updateUserProfile(userId: string, data: Partial<{
  displayName: string;
  currency: string;
  currencySymbol: string;
  monthlySalary: number;
  salaryDay: number;
  openingBalance: number;
  monthlyBudget: number;
  autoRecurringSalary: boolean;
  onboardingCompleted: boolean;
}>): UserRow {
  const user = findUserById(userId);
  if (!user) throw new Error('User not found');

  const now = new Date().toISOString();
  const stmt = db.prepare(`
    UPDATE users SET
      display_name = COALESCE(?, display_name),
      currency = COALESCE(?, currency),
      currency_symbol = COALESCE(?, currency_symbol),
      monthly_salary = COALESCE(?, monthly_salary),
      salary_day = COALESCE(?, salary_day),
      opening_balance = COALESCE(?, opening_balance),
      monthly_budget = COALESCE(?, monthly_budget),
      auto_recurring_salary = COALESCE(?, auto_recurring_salary),
      onboarding_completed = COALESCE(?, onboarding_completed),
      updated_at = ?
    WHERE id = ?
  `);

  stmt.run(
    data.displayName !== undefined ? data.displayName : null,
    data.currency !== undefined ? data.currency : null,
    data.currencySymbol !== undefined ? data.currencySymbol : null,
    data.monthlySalary !== undefined ? data.monthlySalary : null,
    data.salaryDay !== undefined ? data.salaryDay : null,
    data.openingBalance !== undefined ? data.openingBalance : null,
    data.monthlyBudget !== undefined ? data.monthlyBudget : null,
    data.autoRecurringSalary !== undefined ? (data.autoRecurringSalary ? 1 : 0) : null,
    data.onboardingCompleted !== undefined ? (data.onboardingCompleted ? 1 : 0) : null,
    now,
    userId
  );

  return findUserById(userId)!;
}

// ========================
// CATEGORIES QUERIES
// ========================

export function getCategoriesByUser(userId: string, type?: 'expense' | 'income'): CategoryRow[] {
  let query = 'SELECT * FROM categories WHERE user_id = ?';
  const params: any[] = [userId];

  if (type) {
    query += ' AND type = ?';
    params.push(type);
  }

  query += ' ORDER BY name ASC';
  return db.prepare(query).all(...params) as CategoryRow[];
}

export function createCategory(userId: string, data: {
  name: string;
  type: 'expense' | 'income';
  icon: string;
  color: string;
  budgetLimit?: number;
}): CategoryRow {
  const id = crypto.randomUUID();
  const now = new Date().toISOString();

  const stmt = db.prepare(`
    INSERT INTO categories (id, user_id, name, type, icon, color, budget_limit, is_default, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, 0, ?)
  `);

  stmt.run(id, userId, data.name, data.type, data.icon, data.color, data.budgetLimit || 0, now);
  return db.prepare('SELECT * FROM categories WHERE id = ?').get(id) as CategoryRow;
}

export function updateCategory(userId: string, categoryId: string, data: {
  name?: string;
  icon?: string;
  color?: string;
  budgetLimit?: number;
}): CategoryRow | null {
  const stmt = db.prepare(`
    UPDATE categories SET
      name = COALESCE(?, name),
      icon = COALESCE(?, icon),
      color = COALESCE(?, color),
      budget_limit = COALESCE(?, budget_limit)
    WHERE id = ? AND user_id = ?
  `);

  stmt.run(
    data.name ?? null,
    data.icon ?? null,
    data.color ?? null,
    data.budgetLimit ?? null,
    categoryId,
    userId
  );

  return db.prepare('SELECT * FROM categories WHERE id = ? AND user_id = ?').get(categoryId, userId) as CategoryRow || null;
}

export function deleteCategory(userId: string, categoryId: string): boolean {
  // Check if any transactions reference this category
  const ref = db.prepare('SELECT COUNT(*) as count FROM transactions WHERE category_id = ? AND user_id = ?').get(categoryId, userId) as { count: number };
  if (ref && ref.count > 0) {
    throw new Error('Cannot delete category: it is used by existing transactions. Please reassign those transactions first.');
  }

  const result = db.prepare('DELETE FROM categories WHERE id = ? AND user_id = ?').run(categoryId, userId);
  return result.changes > 0;
}

// ========================
// TRANSACTIONS QUERIES
// ========================

export function getTransactions(userId: string, filters: {
  month?: string; // 'YYYY-MM'
  startDate?: string;
  endDate?: string;
  type?: 'income' | 'expense' | 'all';
  categoryId?: string;
  paymentMethod?: string;
  search?: string;
  minAmount?: number;
  maxAmount?: number;
  status?: string;
  sortBy?: 'newest' | 'oldest' | 'highest' | 'lowest';
  limit?: number;
  offset?: number;
}): { transactions: TransactionRow[]; totalCount: number; totalAmount: number } {
  let whereClauses = ['t.user_id = ?'];
  let params: any[] = [userId];

  if (filters.month) {
    whereClauses.push("strftime('%Y-%m', t.transaction_date) = ?");
    params.push(filters.month);
  }

  if (filters.startDate) {
    whereClauses.push('t.transaction_date >= ?');
    params.push(filters.startDate);
  }

  if (filters.endDate) {
    whereClauses.push('t.transaction_date <= ?');
    params.push(filters.endDate);
  }

  if (filters.type && filters.type !== 'all') {
    whereClauses.push('t.type = ?');
    params.push(filters.type);
  }

  if (filters.categoryId) {
    whereClauses.push('t.category_id = ?');
    params.push(filters.categoryId);
  }

  if (filters.paymentMethod) {
    whereClauses.push('t.payment_method = ?');
    params.push(filters.paymentMethod);
  }

  if (filters.status) {
    whereClauses.push('t.status = ?');
    params.push(filters.status);
  }

  if (filters.minAmount !== undefined && filters.minAmount !== null) {
    whereClauses.push('t.amount >= ?');
    params.push(filters.minAmount);
  }

  if (filters.maxAmount !== undefined && filters.maxAmount !== null) {
    whereClauses.push('t.amount <= ?');
    params.push(filters.maxAmount);
  }

  if (filters.search) {
    whereClauses.push('(LOWER(t.description) LIKE ? OR LOWER(t.notes) LIKE ? OR LOWER(t.category_name) LIKE ?)');
    const searchTerm = `%${filters.search.toLowerCase()}%`;
    params.push(searchTerm, searchTerm, searchTerm);
  }

  const whereSql = whereClauses.join(' AND ');

  // Count & Sum Query
  const countStmt = db.prepare(`
    SELECT COUNT(*) as count, COALESCE(SUM(amount), 0) as total_amount
    FROM transactions t
    WHERE ${whereSql}
  `);
  const countResult = countStmt.get(...params) as { count: number; total_amount: number };

  // Sort clause
  let orderSql = 't.transaction_date DESC, t.transaction_time DESC, t.created_at DESC';
  if (filters.sortBy === 'oldest') {
    orderSql = 't.transaction_date ASC, t.transaction_time ASC, t.created_at ASC';
  } else if (filters.sortBy === 'highest') {
    orderSql = 't.amount DESC';
  } else if (filters.sortBy === 'lowest') {
    orderSql = 't.amount ASC';
  }

  let limitSql = '';
  const queryParams = [...params];
  if (filters.limit) {
    limitSql = ' LIMIT ? OFFSET ?';
    queryParams.push(filters.limit, filters.offset || 0);
  }

  const dataStmt = db.prepare(`
    SELECT
      t.*,
      i.income_type
    FROM transactions t
    LEFT JOIN income_details i ON t.id = i.transaction_id
    WHERE ${whereSql}
    ORDER BY ${orderSql}
    ${limitSql}
  `);

  const transactions = dataStmt.all(...queryParams) as TransactionRow[];

  return {
    transactions,
    totalCount: countResult?.count || 0,
    totalAmount: countResult?.total_amount || 0,
  };
}

export function getTransactionById(userId: string, transactionId: string): TransactionRow | null {
  const stmt = db.prepare(`
    SELECT
      t.*,
      i.income_type
    FROM transactions t
    LEFT JOIN income_details i ON t.id = i.transaction_id
    WHERE t.id = ? AND t.user_id = ?
    LIMIT 1
  `);
  return (stmt.get(transactionId, userId) as TransactionRow) || null;
}

export function createTransaction(userId: string, data: {
  type: 'income' | 'expense';
  amount: number;
  description: string;
  categoryId: string;
  categoryName?: string;
  paymentMethod?: string;
  transactionDate?: string;
  transactionTime?: string;
  notes?: string;
  tags?: string[];
  status?: 'confirmed' | 'pending' | 'scheduled';
  isRecurring?: boolean;
  recurringFrequency?: string;
  incomeType?: string; // if type === 'income'
}): TransactionRow {
  const id = crypto.randomUUID();
  const now = new Date().toISOString();
  const localDate = data.transactionDate || now.split('T')[0];
  const localTime = data.transactionTime || now.split('T')[1].substring(0, 5);

  let categoryName = data.categoryName;
  if (!categoryName) {
    const cat = db.prepare('SELECT name FROM categories WHERE id = ?').get(data.categoryId) as { name: string } | undefined;
    categoryName = cat ? cat.name : (data.type === 'income' ? 'Income' : 'Expense');
  }

  const stmt = db.prepare(`
    INSERT INTO transactions (
      id, user_id, type, amount, description, category_id, category_name,
      payment_method, transaction_date, transaction_time, notes, tags,
      status, is_recurring, recurring_frequency, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  stmt.run(
    id,
    userId,
    data.type,
    data.amount,
    data.description,
    data.categoryId,
    categoryName,
    data.paymentMethod || 'cash',
    localDate,
    localTime,
    data.notes || null,
    data.tags ? JSON.stringify(data.tags) : null,
    data.status || 'confirmed',
    data.isRecurring ? 1 : 0,
    data.recurringFrequency || null,
    now,
    now
  );

  // If income, write to income_details
  if (data.type === 'income') {
    const incomeId = crypto.randomUUID();
    const monthApplied = localDate.substring(0, 7);
    const incomeStmt = db.prepare(`
      INSERT INTO income_details (id, transaction_id, user_id, income_type, month_applied)
      VALUES (?, ?, ?, ?, ?)
    `);
    incomeStmt.run(incomeId, id, userId, data.incomeType || 'salary', monthApplied);
  }

  return getTransactionById(userId, id)!;
}

export function updateTransaction(userId: string, transactionId: string, data: {
  amount?: number;
  description?: string;
  categoryId?: string;
  categoryName?: string;
  paymentMethod?: string;
  transactionDate?: string;
  transactionTime?: string;
  notes?: string;
  tags?: string[];
  status?: 'confirmed' | 'pending' | 'scheduled';
  incomeType?: string;
}): TransactionRow | null {
  const current = getTransactionById(userId, transactionId);
  if (!current) return null;

  const now = new Date().toISOString();

  let categoryName = data.categoryName;
  if (data.categoryId && !categoryName) {
    const cat = db.prepare('SELECT name FROM categories WHERE id = ?').get(data.categoryId) as { name: string } | undefined;
    categoryName = cat ? cat.name : current.category_name;
  }

  const stmt = db.prepare(`
    UPDATE transactions SET
      amount = COALESCE(?, amount),
      description = COALESCE(?, description),
      category_id = COALESCE(?, category_id),
      category_name = COALESCE(?, category_name),
      payment_method = COALESCE(?, payment_method),
      transaction_date = COALESCE(?, transaction_date),
      transaction_time = COALESCE(?, transaction_time),
      notes = COALESCE(?, notes),
      tags = COALESCE(?, tags),
      status = COALESCE(?, status),
      updated_at = ?
    WHERE id = ? AND user_id = ?
  `);

  stmt.run(
    data.amount ?? null,
    data.description ?? null,
    data.categoryId ?? null,
    categoryName ?? null,
    data.paymentMethod ?? null,
    data.transactionDate ?? null,
    data.transactionTime ?? null,
    data.notes !== undefined ? data.notes : null,
    data.tags ? JSON.stringify(data.tags) : null,
    data.status ?? null,
    now,
    transactionId,
    userId
  );

  // Update income_details if present and updated
  if (current.type === 'income' && (data.incomeType || data.transactionDate)) {
    const newDate = data.transactionDate || current.transaction_date;
    const monthApplied = newDate.substring(0, 7);
    db.prepare(`
      UPDATE income_details SET
        income_type = COALESCE(?, income_type),
        month_applied = ?
      WHERE transaction_id = ? AND user_id = ?
    `).run(data.incomeType ?? null, monthApplied, transactionId, userId);
  }

  return getTransactionById(userId, transactionId);
}

export function deleteTransaction(userId: string, transactionId: string): boolean {
  const result = db.prepare('DELETE FROM transactions WHERE id = ? AND user_id = ?').run(transactionId, userId);
  return result.changes > 0;
}

// ========================
// INCOME & SALARY QUERIES
// ========================

export function getSalaryForMonth(userId: string, month: string): TransactionRow | null {
  const stmt = db.prepare(`
    SELECT t.*, i.income_type
    FROM transactions t
    JOIN income_details i ON t.id = i.transaction_id
    WHERE t.user_id = ?
      AND i.income_type = 'salary'
      AND i.month_applied = ?
    ORDER BY t.transaction_date DESC
    LIMIT 1
  `);
  return (stmt.get(userId, month) as TransactionRow) || null;
}

export function getAllIncomeForMonth(userId: string, month: string): TransactionRow[] {
  const stmt = db.prepare(`
    SELECT t.*, i.income_type
    FROM transactions t
    JOIN income_details i ON t.id = i.transaction_id
    WHERE t.user_id = ?
      AND i.month_applied = ?
    ORDER BY t.transaction_date DESC
  `);
  return stmt.all(userId, month) as TransactionRow[];
}

// ========================
// MONTHLY FINANCES QUERIES
// ========================

export function getOrCreateMonthlyFinance(userId: string, month: string): MonthlyFinanceRow {
  let row = db.prepare('SELECT * FROM monthly_finances WHERE user_id = ? AND month = ?').get(userId, month) as MonthlyFinanceRow | undefined;

  if (!row) {
    // Check user default monthly budget and opening balance
    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    const defaultBudget = 0; // Only set if user explicitly configures a budget for this month
    const defaultOpening = 0; // carried balance is computed or set manually

    db.prepare(`
      INSERT INTO monthly_finances (id, user_id, month, opening_balance, monthly_budget, savings_goal, notes, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, 0, '', ?, ?)
    `).run(id, userId, month, defaultOpening, defaultBudget, now, now);

    row = db.prepare('SELECT * FROM monthly_finances WHERE id = ?').get(id) as MonthlyFinanceRow;
  }

  return row;
}

export function updateMonthlyFinance(userId: string, month: string, data: {
  openingBalance?: number;
  monthlyBudget?: number;
  savingsGoal?: number;
  notes?: string;
}): MonthlyFinanceRow {
  getOrCreateMonthlyFinance(userId, month); // ensure exists
  const now = new Date().toISOString();

  db.prepare(`
    UPDATE monthly_finances SET
      opening_balance = COALESCE(?, opening_balance),
      monthly_budget = COALESCE(?, monthly_budget),
      savings_goal = COALESCE(?, savings_goal),
      notes = COALESCE(?, notes),
      updated_at = ?
    WHERE user_id = ? AND month = ?
  `).run(
    data.openingBalance ?? null,
    data.monthlyBudget ?? null,
    data.savingsGoal ?? null,
    data.notes ?? null,
    now,
    userId,
    month
  );

  return db.prepare('SELECT * FROM monthly_finances WHERE user_id = ? AND month = ?').get(userId, month) as MonthlyFinanceRow;
}

// ========================
// PREFERENCES QUERIES
// ========================

export function getUserPreferences(userId: string): UserPreferencesRow {
  let prefs = db.prepare('SELECT * FROM user_preferences WHERE user_id = ?').get(userId) as UserPreferencesRow | undefined;
  if (!prefs) {
    seedUserPreferences(userId);
    prefs = db.prepare('SELECT * FROM user_preferences WHERE user_id = ?').get(userId) as UserPreferencesRow;
  }
  return prefs;
}

export function updateUserPreferences(userId: string, data: Partial<UserPreferencesRow>): UserPreferencesRow {
  const current = getUserPreferences(userId);
  const now = new Date().toISOString();

  db.prepare(`
    UPDATE user_preferences SET
      theme = COALESCE(?, theme),
      salary_reminder_enabled = COALESCE(?, salary_reminder_enabled),
      daily_expense_reminder = COALESCE(?, daily_expense_reminder),
      budget_alert_threshold = COALESCE(?, budget_alert_threshold),
      monthly_review_reminder = COALESCE(?, monthly_review_reminder),
      recurring_bills_reminder = COALESCE(?, recurring_bills_reminder),
      reminder_time = COALESCE(?, reminder_time),
      updated_at = ?
    WHERE user_id = ?
  `).run(
    data.theme ?? null,
    data.salary_reminder_enabled ?? null,
    data.daily_expense_reminder ?? null,
    data.budget_alert_threshold ?? null,
    data.monthly_review_reminder ?? null,
    data.recurring_bills_reminder ?? null,
    data.reminder_time ?? null,
    now,
    userId
  );

  return getUserPreferences(userId);
}
