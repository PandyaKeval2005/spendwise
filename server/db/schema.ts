export const SCHEMA_SQL = `
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  display_name TEXT NOT NULL,
  currency TEXT NOT NULL DEFAULT 'INR',
  currency_symbol TEXT NOT NULL DEFAULT '₹',
  monthly_salary REAL NOT NULL DEFAULT 0,
  salary_day INTEGER NOT NULL DEFAULT 1,
  opening_balance REAL NOT NULL DEFAULT 0,
  monthly_budget REAL NOT NULL DEFAULT 0,
  auto_recurring_salary INTEGER NOT NULL DEFAULT 0,
  onboarding_completed INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS categories (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK(type IN ('expense', 'income')),
  icon TEXT NOT NULL,
  color TEXT NOT NULL,
  budget_limit REAL DEFAULT 0,
  is_default INTEGER DEFAULT 0,
  created_at TEXT NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS transactions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  type TEXT NOT NULL CHECK(type IN ('income', 'expense')),
  amount REAL NOT NULL CHECK(amount > 0),
  description TEXT NOT NULL,
  category_id TEXT NOT NULL,
  category_name TEXT NOT NULL,
  payment_method TEXT NOT NULL DEFAULT 'cash',
  transaction_date TEXT NOT NULL,
  transaction_time TEXT NOT NULL,
  notes TEXT,
  tags TEXT,
  status TEXT NOT NULL DEFAULT 'confirmed' CHECK(status IN ('confirmed', 'pending', 'scheduled')),
  is_recurring INTEGER NOT NULL DEFAULT 0,
  recurring_frequency TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE RESTRICT
);

CREATE TABLE IF NOT EXISTS income_details (
  id TEXT PRIMARY KEY,
  transaction_id TEXT UNIQUE NOT NULL,
  user_id TEXT NOT NULL,
  income_type TEXT NOT NULL CHECK(income_type IN ('salary', 'bonus', 'incentive', 'freelance', 'gift', 'reimbursement', 'other')),
  month_applied TEXT NOT NULL,
  FOREIGN KEY (transaction_id) REFERENCES transactions(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS monthly_finances (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  month TEXT NOT NULL,
  opening_balance REAL DEFAULT 0,
  monthly_budget REAL DEFAULT 0,
  savings_goal REAL DEFAULT 0,
  notes TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  UNIQUE(user_id, month),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS user_preferences (
  user_id TEXT PRIMARY KEY,
  theme TEXT NOT NULL DEFAULT 'light' CHECK(theme IN ('light', 'dark', 'system')),
  salary_reminder_enabled INTEGER NOT NULL DEFAULT 1,
  daily_expense_reminder INTEGER NOT NULL DEFAULT 1,
  budget_alert_threshold INTEGER NOT NULL DEFAULT 80,
  monthly_review_reminder INTEGER NOT NULL DEFAULT 1,
  recurring_bills_reminder INTEGER NOT NULL DEFAULT 1,
  reminder_time TEXT NOT NULL DEFAULT '20:00',
  updated_at TEXT NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS recurring_schedules (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  type TEXT NOT NULL CHECK(type IN ('income', 'expense')),
  amount REAL NOT NULL,
  description TEXT NOT NULL,
  category_id TEXT NOT NULL,
  income_type TEXT,
  frequency TEXT NOT NULL DEFAULT 'monthly',
  day_of_month INTEGER NOT NULL DEFAULT 1,
  payment_method TEXT NOT NULL DEFAULT 'upi',
  auto_confirm INTEGER NOT NULL DEFAULT 0,
  is_active INTEGER NOT NULL DEFAULT 1,
  last_generated_month TEXT,
  created_at TEXT NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_trans_user_date ON transactions(user_id, transaction_date DESC);
CREATE INDEX IF NOT EXISTS idx_trans_user_month ON transactions(user_id, strftime('%Y-%m', transaction_date));
CREATE INDEX IF NOT EXISTS idx_trans_user_type ON transactions(user_id, type);
CREATE INDEX IF NOT EXISTS idx_trans_category ON transactions(category_id);
CREATE INDEX IF NOT EXISTS idx_income_user_month ON income_details(user_id, month_applied);
CREATE INDEX IF NOT EXISTS idx_categories_user ON categories(user_id);
CREATE INDEX IF NOT EXISTS idx_finances_user_month ON monthly_finances(user_id, month);
`;
