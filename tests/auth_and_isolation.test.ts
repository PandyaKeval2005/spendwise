import { test, after } from 'node:test';
import assert from 'node:assert';
import { server, serverReady } from '../server/index.ts';
import { db } from '../server/db/index.ts';

after(() => {
  server.close();
});

// Clean test db tables before tests
db.exec("DELETE FROM users WHERE email LIKE '%testuser%'");

test('Integration: Full User Flow & Strict Isolation', async () => {
  await serverReady;
  // 1. Register User 1
  const signupRes = await fetch('http://localhost:5000/api/auth/signup', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'testuser1@spendwise.app',
      password: 'password123',
      displayName: 'Priya Sharma',
      currency: 'INR',
      currencySymbol: '₹',
      monthlySalary: 25000,
      openingBalance: 5000,
    }),
  });

  const signupData = await signupRes.json();
  assert.strictEqual(signupRes.status, 201);
  assert.ok(signupData.token);
  const user1Token = signupData.token;

  // 2. Add Monthly Salary of ₹25,000 for October 2026
  const salaryRes = await fetch('http://localhost:5000/api/income/salary', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${user1Token}`,
    },
    body: JSON.stringify({
      month: '2026-10',
      amount: 25000,
      description: 'Tech Corp Monthly Salary',
      dateReceived: '2026-10-01',
      paymentMethod: 'bank_transfer',
    }),
  });
  const salaryData = await salaryRes.json();
  assert.strictEqual(salaryRes.status, 201);
  assert.strictEqual(salaryData.salary.amount, 25000);

  // 3. Add Bonus of ₹2,000 for October 2026
  const bonusRes = await fetch('http://localhost:5000/api/income/bonus', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${user1Token}`,
    },
    body: JSON.stringify({
      month: '2026-10',
      amount: 2000,
      incomeType: 'bonus',
      description: 'Quarterly Incentive',
      dateReceived: '2026-10-05',
    }),
  });
  assert.strictEqual(bonusRes.status, 201);

  // Get categories for user 1
  const catRes = await fetch('http://localhost:5000/api/categories?type=expense', {
    headers: { 'Authorization': `Bearer ${user1Token}` },
  });
  const categories = await catRes.json();
  const groceriesCat = categories.find((c: any) => c.name.includes('Groceries')) || categories[0];
  const diningCat = categories.find((c: any) => c.name.includes('Food')) || categories[1];

  // 4. Add expense ₹300
  const exp1Res = await fetch('http://localhost:5000/api/transactions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${user1Token}`,
    },
    body: JSON.stringify({
      type: 'expense',
      amount: 300,
      description: 'Groceries at D-Mart',
      categoryId: groceriesCat.id,
      paymentMethod: 'upi',
      transactionDate: '2026-10-06',
    }),
  });
  assert.strictEqual(exp1Res.status, 201);

  // 5. Add expense ₹700
  const exp2Res = await fetch('http://localhost:5000/api/transactions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${user1Token}`,
    },
    body: JSON.stringify({
      type: 'expense',
      amount: 700,
      description: 'Family Dinner',
      categoryId: diningCat.id,
      paymentMethod: 'debit_card',
      transactionDate: '2026-10-07',
    }),
  });
  assert.strictEqual(exp2Res.status, 201);

  // 6. Check Dashboard for October 2026
  const dashRes = await fetch('http://localhost:5000/api/reports/dashboard?month=2026-10', {
    headers: { 'Authorization': `Bearer ${user1Token}` },
  });
  const dashData = await dashRes.json();

  assert.strictEqual(dashData.summary.totalIncome, 27000, 'Total income should be 27,000 (25k + 2k)');
  assert.strictEqual(dashData.summary.totalExpenses, 1000, 'Total expenses should be 1,000 (300 + 700)');
  assert.strictEqual(dashData.summary.incomeRemaining, 26000, 'Income remaining after expenses should be 26,000');
  assert.strictEqual(dashData.summary.availableBalance, 31000, 'Available balance should be 5,000 opening + 26,000 net');

  // 7. Verify User 2 cannot access or view User 1's records (Strict Isolation)
  const signup2Res = await fetch('http://localhost:5000/api/auth/signup', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'testuser2@spendwise.app',
      password: 'password456',
      displayName: 'Rahul Verma',
      currency: 'INR',
    }),
  });
  const signup2Data = await signup2Res.json();
  const user2Token = signup2Data.token;

  // User 2 queries transactions
  const user2TransRes = await fetch('http://localhost:5000/api/transactions?month=2026-10', {
    headers: { 'Authorization': `Bearer ${user2Token}` },
  });
  const user2Trans = await user2TransRes.json();
  assert.strictEqual(user2Trans.totalCount, 0, 'User 2 should see 0 transactions');
  assert.strictEqual(user2Trans.transactions.length, 0);

  // User 2 dashboard
  const user2DashRes = await fetch('http://localhost:5000/api/reports/dashboard?month=2026-10', {
    headers: { 'Authorization': `Bearer ${user2Token}` },
  });
  const user2Dash = await user2DashRes.json();
  assert.strictEqual(user2Dash.summary.totalIncome, 0);
  assert.strictEqual(user2Dash.summary.totalExpenses, 0);

  // 8. Updating future month salary does NOT modify previous month
  const novSalaryRes = await fetch('http://localhost:5000/api/income/salary', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${user1Token}`,
    },
    body: JSON.stringify({
      month: '2026-11',
      amount: 32000, // Salary hike!
      description: 'Promoted Salary',
      dateReceived: '2026-11-01',
    }),
  });
  assert.strictEqual(novSalaryRes.status, 201);

  // Re-verify October 2026 salary is still exactly 25,000
  const octSalaryCheck = await fetch('http://localhost:5000/api/income?month=2026-10', {
    headers: { 'Authorization': `Bearer ${user1Token}` },
  });
  const octSalaryData = await octSalaryCheck.json();
  assert.strictEqual(octSalaryData.existingSalary.amount, 25000, 'October salary must remain 25,000 after November change');
});
