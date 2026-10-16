import { DatabaseSync } from 'node:sqlite';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { SCHEMA_SQL } from './schema';

const DATA_DIR = process.env.DATA_DIR
  ? path.resolve(process.env.DATA_DIR)
  : process.env.VERCEL
  ? path.resolve('/tmp', 'spendwise-data')
  : path.resolve(process.cwd(), 'data');

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

const DB_PATH = path.resolve(DATA_DIR, 'spendwise.db');
export const db = new DatabaseSync(DB_PATH);

// Enable foreign keys and appropriate journal mode
db.exec('PRAGMA foreign_keys = ON;');
if (process.env.VERCEL) {
  db.exec('PRAGMA journal_mode = DELETE;');
} else {
  db.exec('PRAGMA journal_mode = WAL;');
}

// Initialize tables from embedded schema
db.exec(SCHEMA_SQL);

export const DEFAULT_EXPENSE_CATEGORIES = [
  { name: 'Food & Dining', icon: 'Utensils', color: '#F59E0B' },
  { name: 'Groceries', icon: 'ShoppingBag', color: '#10B981' },
  { name: 'Transportation', icon: 'Car', color: '#3B82F6' },
  { name: 'Shopping', icon: 'Shirt', color: '#EC4899' },
  { name: 'Rent & Housing', icon: 'Home', color: '#6366F1' },
  { name: 'Electricity & Utilities', icon: 'Zap', color: '#EAB308' },
  { name: 'Mobile & Internet', icon: 'Wifi', color: '#06B6D4' },
  { name: 'Health & Medicine', icon: 'HeartPulse', color: '#EF4444' },
  { name: 'Education', icon: 'GraduationCap', color: '#8B5CF6' },
  { name: 'Entertainment', icon: 'Film', color: '#F97316' },
  { name: 'Personal Care', icon: 'Sparkles', color: '#D946EF' },
  { name: 'Travel', icon: 'Plane', color: '#14B8A6' },
  { name: 'Family', icon: 'Users', color: '#84CC16' },
  { name: 'Subscriptions', icon: 'CreditCard', color: '#64748B' },
  { name: 'Other', icon: 'MoreHorizontal', color: '#94A3B8' },
];

export const DEFAULT_INCOME_CATEGORIES = [
  { name: 'Salary', icon: 'Briefcase', color: '#059669' },
  { name: 'Bonus', icon: 'Award', color: '#10B981' },
  { name: 'Incentive / Commission', icon: 'TrendingUp', color: '#3B82F6' },
  { name: 'Freelance', icon: 'Laptop', color: '#8B5CF6' },
  { name: 'Gift', icon: 'Gift', color: '#EC4899' },
  { name: 'Reimbursement', icon: 'Receipt', color: '#06B6D4' },
  { name: 'Other Income', icon: 'DollarSign', color: '#64748B' },
];

/**
 * Seeds default categories for a new user
 */
export function seedUserCategories(userId: string) {
  const insertStmt = db.prepare(`
    INSERT INTO categories (id, user_id, name, type, icon, color, budget_limit, is_default, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, 1, ?)
  `);

  const now = new Date().toISOString();

  for (const cat of DEFAULT_EXPENSE_CATEGORIES) {
    insertStmt.run(crypto.randomUUID(), userId, cat.name, 'expense', cat.icon, cat.color, 0, now);
  }

  for (const cat of DEFAULT_INCOME_CATEGORIES) {
    insertStmt.run(crypto.randomUUID(), userId, cat.name, 'income', cat.icon, cat.color, 0, now);
  }
}

/**
 * Seeds default preferences for a new user
 */
export function seedUserPreferences(userId: string) {
  const stmt = db.prepare(`
    INSERT OR IGNORE INTO user_preferences (user_id, theme, salary_reminder_enabled, daily_expense_reminder, budget_alert_threshold, monthly_review_reminder, recurring_bills_reminder, reminder_time, updated_at)
    VALUES (?, 'light', 1, 1, 80, 1, 1, '20:00', ?)
  `);
  stmt.run(userId, new Date().toISOString());
}
