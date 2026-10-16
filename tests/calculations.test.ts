import { test } from 'node:test';
import assert from 'node:assert';
import { calculatePeriodSummary, formatCurrency, calculateDailyStats } from '../server/services/calculations.ts';

test('Financial Calculations: salary ₹25,000 + bonus ₹2,000, expenses ₹300 + ₹700', () => {
  const transactions = [
    { id: '1', type: 'income', amount: 25000, transaction_date: '2026-10-01', status: 'confirmed', income_type: 'salary' },
    { id: '2', type: 'income', amount: 2000, transaction_date: '2026-10-05', status: 'confirmed', income_type: 'bonus' },
    { id: '3', type: 'expense', amount: 300, transaction_date: '2026-10-06', status: 'confirmed' },
    { id: '4', type: 'expense', amount: 700, transaction_date: '2026-10-07', status: 'confirmed' },
  ];

  const openingBalance = 5000;
  const summary = calculatePeriodSummary(transactions, openingBalance);

  // Total income = 25,000 + 2,000 = 27,000
  assert.strictEqual(summary.totalIncome, 27000);

  // Total expenses = 300 + 700 = 1,000
  assert.strictEqual(summary.totalExpenses, 1000);

  // Income remaining after expenses = 27,000 - 1,000 = 26,000
  assert.strictEqual(summary.incomeRemaining, 26000);
  assert.strictEqual(summary.netAmount, 26000);

  // Opening balance is kept separate from monthly income
  assert.strictEqual(summary.openingBalance, 5000);

  // Available balance = Opening balance (5,000) + Net amount (26,000) = 31,000
  assert.strictEqual(summary.availableBalance, 31000);

  // Spending percentage = (1000 / 27000) * 100 = 3.7%
  assert.strictEqual(summary.spendingPercentage, 3.7);

  // Savings rate = (26000 / 27000) * 100 = 96.3%
  assert.strictEqual(summary.savingsRate, 96.3);
});

test('Financial Calculations: zero income period does not cause division by zero', () => {
  const transactions = [
    { id: '1', type: 'expense', amount: 1500, transaction_date: '2026-10-02', status: 'confirmed' }
  ];

  const summary = calculatePeriodSummary(transactions, 10000);
  assert.strictEqual(summary.totalIncome, 0);
  assert.strictEqual(summary.totalExpenses, 1500);
  assert.strictEqual(summary.netAmount, -1500);
  assert.strictEqual(summary.incomeRemaining, -1500);
  assert.strictEqual(summary.spendingPercentage, 0);
  assert.strictEqual(summary.savingsRate, 0);
  assert.strictEqual(summary.availableBalance, 8500);
});

test('Currency formatting: Indian Rupee formatting', () => {
  const formatted = formatCurrency(12500, 'INR', '₹');
  assert.ok(formatted.includes('12,500.00'), `Expected formatted currency to contain 12,500.00, got ${formatted}`);
  assert.ok(formatted.startsWith('₹'), `Expected symbol ₹ at start, got ${formatted}`);

  const formattedLarge = formatCurrency(1250000, 'INR', '₹');
  // Indian numbering: 12,50,000.00
  assert.ok(formattedLarge.includes('12,50,000.00'), `Expected Indian grouping 12,50,000.00, got ${formattedLarge}`);
});
