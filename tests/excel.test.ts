import { test } from 'node:test';
import assert from 'node:assert';
import { generateMonthlyWorkbook } from '../server/services/excel.ts';

test('Excel Generator: generates valid 6-sheet workbook with proper data', async () => {
  const mockData = {
    month: '2026-10',
    currencySymbol: '₹',
    openingBalance: 10000,
    totalIncome: 27000,
    totalExpenses: 1000,
    netAmount: 26000,
    spendingPercentage: 3.7,
    savingsRate: 96.3,
    availableBalance: 36000,
    monthlyBudget: 15000,
    expenses: [
      {
        id: '1',
        user_id: 'u1',
        type: 'expense',
        amount: 300,
        description: 'Groceries at D-Mart',
        category_id: 'c1',
        category_name: 'Groceries',
        payment_method: 'upi',
        transaction_date: '2026-10-06',
        transaction_time: '14:30',
        notes: 'Vegetables & milk',
        tags: null,
        status: 'confirmed',
        is_recurring: 0,
        recurring_frequency: null,
        created_at: '2026-10-06T14:30:00Z',
        updated_at: '2026-10-06T14:30:00Z',
      },
      {
        id: '2',
        user_id: 'u1',
        type: 'expense',
        amount: 700,
        description: 'Electricity Bill',
        category_id: 'c2',
        category_name: 'Electricity & Utilities',
        payment_method: 'bank_transfer',
        transaction_date: '2026-10-07',
        transaction_time: '11:15',
        notes: 'Monthly power',
        tags: null,
        status: 'confirmed',
        is_recurring: 0,
        recurring_frequency: null,
        created_at: '2026-10-07T11:15:00Z',
        updated_at: '2026-10-07T11:15:00Z',
      },
    ],
    income: [
      {
        id: '3',
        user_id: 'u1',
        type: 'income',
        amount: 25000,
        description: 'Monthly Salary',
        category_id: 'c3',
        category_name: 'Salary',
        payment_method: 'bank_transfer',
        transaction_date: '2026-10-01',
        transaction_time: '10:00',
        notes: 'Tech Corp Salary',
        tags: null,
        status: 'confirmed',
        is_recurring: 1,
        recurring_frequency: 'monthly',
        created_at: '2026-10-01T10:00:00Z',
        updated_at: '2026-10-01T10:00:00Z',
        income_type: 'salary',
      },
      {
        id: '4',
        user_id: 'u1',
        type: 'income',
        amount: 2000,
        description: 'Festival Bonus',
        category_id: 'c4',
        category_name: 'Bonus',
        payment_method: 'bank_transfer',
        transaction_date: '2026-10-05',
        transaction_time: '15:00',
        notes: 'Diwali performance incentive',
        tags: null,
        status: 'confirmed',
        is_recurring: 0,
        recurring_frequency: null,
        created_at: '2026-10-05T15:00:00Z',
        updated_at: '2026-10-05T15:00:00Z',
        income_type: 'bonus',
      },
    ],
    dailySummaries: [
      { date: '2026-10-01', income: 25000, expenses: 0, net: 25000 },
      { date: '2026-10-05', income: 2000, expenses: 0, net: 2000 },
      { date: '2026-10-06', income: 0, expenses: 300, net: -300 },
      { date: '2026-10-07', income: 0, expenses: 700, net: -700 },
    ],
    categorySummaries: [
      { category: 'Electricity & Utilities', total: 700, percentage: 70 },
      { category: 'Groceries', total: 300, percentage: 30 },
    ],
    monthlyComparisons: [
      { month: '2026-09', income: 25000, expenses: 14000, net: 11000 },
      { month: '2026-10', income: 27000, expenses: 1000, net: 26000 },
    ],
  };

  const workbook = await generateMonthlyWorkbook(mockData);

  assert.strictEqual(workbook.worksheets.length, 6);
  assert.strictEqual(workbook.getWorksheet('Monthly Summary')?.name, 'Monthly Summary');
  assert.strictEqual(workbook.getWorksheet('Expenses')?.name, 'Expenses');
  assert.strictEqual(workbook.getWorksheet('Income')?.name, 'Income');
  assert.strictEqual(workbook.getWorksheet('Daily Summary')?.name, 'Daily Summary');
  assert.strictEqual(workbook.getWorksheet('Category Summary')?.name, 'Category Summary');
  assert.strictEqual(workbook.getWorksheet('Monthly Comparison')?.name, 'Monthly Comparison');

  const buffer = await workbook.xlsx.writeBuffer();
  assert.ok(buffer.byteLength > 1000, 'Excel buffer should be non-empty');
});
