import ExcelJS from 'exceljs';
import { TransactionRow } from '../db/queries';

export interface MonthlyReportData {
  month: string; // 'YYYY-MM'
  currencySymbol: string;
  openingBalance: number;
  totalIncome: number;
  totalExpenses: number;
  netAmount: number;
  spendingPercentage: number;
  savingsRate: number;
  availableBalance: number;
  monthlyBudget: number;
  expenses: TransactionRow[];
  income: TransactionRow[];
  dailySummaries: Array<{
    date: string;
    income: number;
    expenses: number;
    net: number;
  }>;
  categorySummaries: Array<{
    category: string;
    total: number;
    percentage: number;
  }>;
  monthlyComparisons: Array<{
    month: string;
    income: number;
    expenses: number;
    net: number;
  }>;
}

// Styling Constants for a Premium Fintech Look (Emerald & Slate Theme)
const HEADER_FILL: ExcelJS.Fill = {
  type: 'pattern',
  pattern: 'solid',
  fgColor: { argb: 'FF065F46' }, // Deep Emerald (Emerald-800)
};

const HEADER_FONT: Partial<ExcelJS.Font> = {
  name: 'Segoe UI',
  size: 11,
  bold: true,
  color: { argb: 'FFFFFFFF' },
};

const TITLE_FONT: Partial<ExcelJS.Font> = {
  name: 'Segoe UI',
  size: 14,
  bold: true,
  color: { argb: 'FF0F172A' },
};

const BORDER_THIN: Partial<ExcelJS.Borders> = {
  top: { style: 'thin', color: { argb: 'FFE2E8F0' } },
  left: { style: 'thin', color: { argb: 'FFE2E8F0' } },
  bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } },
  right: { style: 'thin', color: { argb: 'FFE2E8F0' } },
};

const TOTAL_ROW_FILL: ExcelJS.Fill = {
  type: 'pattern',
  pattern: 'solid',
  fgColor: { argb: 'FFF1F5F9' }, // Slate-100
};

/**
 * Creates a comprehensive multi-sheet Excel workbook for a monthly financial report
 */
export async function generateMonthlyWorkbook(data: MonthlyReportData): Promise<ExcelJS.Workbook> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'SpendWise Financial Manager';
  workbook.lastModifiedBy = 'SpendWise';
  workbook.created = new Date();
  workbook.modified = new Date();

  const currFormat = `"${data.currencySymbol}"#,##0.00;[Red]("-""${data.currencySymbol}"#,##0.00)`;

  // ==========================================
  // SHEET 1: Monthly Summary
  // ==========================================
  const summarySheet = workbook.addWorksheet('Monthly Summary', {
    views: [{ state: 'frozen', ySplit: 2 }],
  });

  summarySheet.columns = [
    { header: 'Financial Metric', key: 'metric', width: 32 },
    { header: 'Amount / Value', key: 'value', width: 24 },
    { header: 'Notes / Explanation', key: 'notes', width: 45 },
  ];

  // Header row styling
  const sumHeader = summarySheet.getRow(1);
  sumHeader.eachCell((cell) => {
    cell.fill = HEADER_FILL;
    cell.font = HEADER_FONT;
    cell.alignment = { vertical: 'middle', horizontal: 'center' };
  });
  sumHeader.height = 26;

  const summaryRows = [
    ['Reporting Month', data.month, 'Selected financial period'],
    ['Opening Balance', data.openingBalance, 'Carried forward from previous balance'],
    ['Total Income', data.totalIncome, 'Salary, bonuses, and all verified earnings'],
    ['Total Expenses', data.totalExpenses, 'All recorded living and personal expenses'],
    ['Net Savings for Period', data.netAmount, 'Total Income minus Total Expenses'],
    ['Income Remaining', data.netAmount, 'Income left from this month alone'],
    ['Current Available Balance', data.availableBalance, 'Opening Balance + Net Savings'],
    ['Monthly Budget', data.monthlyBudget, 'Target monthly spending limit'],
    ['Spending Percentage', `${data.spendingPercentage}%`, 'Total Expenses / Total Income'],
    ['Savings Rate', `${data.savingsRate}%`, 'Net Savings / Total Income'],
  ];

  for (const rowData of summaryRows) {
    const row = summarySheet.addRow(rowData);
    row.height = 22;
    row.eachCell((cell, colNumber) => {
      cell.border = BORDER_THIN;
      if (colNumber === 2 && typeof rowData[1] === 'number') {
        cell.numFmt = currFormat;
        cell.alignment = { horizontal: 'right' };
      }
    });
  }

  // Highlight Net Savings
  const netRow = summarySheet.getRow(6);
  netRow.getCell(1).font = { bold: true };
  netRow.getCell(2).font = { bold: true, color: { argb: data.netAmount >= 0 ? 'FF059669' : 'FFDC2626' } };

  // ==========================================
  // SHEET 2: Expenses
  // ==========================================
  const expenseSheet = workbook.addWorksheet('Expenses', {
    views: [{ state: 'frozen', ySplit: 1 }],
  });

  expenseSheet.columns = [
    { header: 'Date', key: 'date', width: 14 },
    { header: 'Time', key: 'time', width: 10 },
    { header: 'Description / Merchant', key: 'description', width: 34 },
    { header: 'Category', key: 'category', width: 20 },
    { header: 'Payment Method', key: 'paymentMethod', width: 18 },
    { header: 'Amount', key: 'amount', width: 18 },
    { header: 'Notes', key: 'notes', width: 30 },
  ];

  const expHeader = expenseSheet.getRow(1);
  expHeader.eachCell((cell) => {
    cell.fill = HEADER_FILL;
    cell.font = HEADER_FONT;
    cell.alignment = { vertical: 'middle', horizontal: 'center' };
  });
  expHeader.height = 26;

  for (const exp of data.expenses) {
    const row = expenseSheet.addRow([
      exp.transaction_date,
      exp.transaction_time,
      exp.description,
      exp.category_name,
      exp.payment_method?.toUpperCase(),
      exp.amount,
      exp.notes || '',
    ]);
    row.height = 20;
    row.eachCell((cell, colNumber) => {
      cell.border = BORDER_THIN;
      if (colNumber === 6) {
        cell.numFmt = currFormat;
        cell.alignment = { horizontal: 'right' };
      }
    });
  }

  // Total Row for Expenses
  const expTotalRow = expenseSheet.addRow([
    'TOTAL',
    '',
    '',
    '',
    '',
    data.expenses.length > 0
      ? { formula: `SUM(F2:F${data.expenses.length + 1})`, result: data.totalExpenses }
      : data.totalExpenses,
    '',
  ]);
  expTotalRow.height = 24;
  expTotalRow.eachCell((cell, colNumber) => {
    cell.fill = TOTAL_ROW_FILL;
    cell.font = { bold: true };
    cell.border = BORDER_THIN;
    if (colNumber === 6) {
      cell.numFmt = currFormat;
      cell.alignment = { horizontal: 'right' };
    }
  });

  // ==========================================
  // SHEET 3: Income
  // ==========================================
  const incomeSheet = workbook.addWorksheet('Income', {
    views: [{ state: 'frozen', ySplit: 1 }],
  });

  incomeSheet.columns = [
    { header: 'Date', key: 'date', width: 14 },
    { header: 'Time', key: 'time', width: 10 },
    { header: 'Income Type', key: 'incomeType', width: 18 },
    { header: 'Description', key: 'description', width: 34 },
    { header: 'Amount', key: 'amount', width: 18 },
    { header: 'Notes', key: 'notes', width: 30 },
  ];

  const incHeader = incomeSheet.getRow(1);
  incHeader.eachCell((cell) => {
    cell.fill = HEADER_FILL;
    cell.font = HEADER_FONT;
    cell.alignment = { vertical: 'middle', horizontal: 'center' };
  });
  incHeader.height = 26;

  for (const inc of data.income) {
    const row = incomeSheet.addRow([
      inc.transaction_date,
      inc.transaction_time,
      (inc.income_type || 'income').toUpperCase(),
      inc.description,
      inc.amount,
      inc.notes || '',
    ]);
    row.height = 20;
    row.eachCell((cell, colNumber) => {
      cell.border = BORDER_THIN;
      if (colNumber === 5) {
        cell.numFmt = currFormat;
        cell.alignment = { horizontal: 'right' };
      }
    });
  }

  // Total Row for Income
  const incTotalRow = incomeSheet.addRow([
    'TOTAL',
    '',
    '',
    '',
    data.income.length > 0
      ? { formula: `SUM(E2:E${data.income.length + 1})`, result: data.totalIncome }
      : data.totalIncome,
    '',
  ]);
  incTotalRow.height = 24;
  incTotalRow.eachCell((cell, colNumber) => {
    cell.fill = TOTAL_ROW_FILL;
    cell.font = { bold: true };
    cell.border = BORDER_THIN;
    if (colNumber === 5) {
      cell.numFmt = currFormat;
      cell.alignment = { horizontal: 'right' };
    }
  });

  // ==========================================
  // SHEET 4: Daily Summary
  // ==========================================
  const dailySheet = workbook.addWorksheet('Daily Summary', {
    views: [{ state: 'frozen', ySplit: 1 }],
  });

  dailySheet.columns = [
    { header: 'Date', key: 'date', width: 16 },
    { header: 'Income', key: 'income', width: 18 },
    { header: 'Expenses', key: 'expenses', width: 18 },
    { header: 'Net Amount', key: 'net', width: 18 },
  ];

  const dailyHeader = dailySheet.getRow(1);
  dailyHeader.eachCell((cell) => {
    cell.fill = HEADER_FILL;
    cell.font = HEADER_FONT;
    cell.alignment = { vertical: 'middle', horizontal: 'center' };
  });
  dailyHeader.height = 26;

  for (const d of data.dailySummaries) {
    const row = dailySheet.addRow([d.date, d.income, d.expenses, d.net]);
    row.height = 20;
    row.eachCell((cell, colNumber) => {
      cell.border = BORDER_THIN;
      if (colNumber >= 2) {
        cell.numFmt = currFormat;
        cell.alignment = { horizontal: 'right' };
      }
    });
  }

  // Daily totals
  const dailyTotalRow = dailySheet.addRow([
    'TOTAL',
    data.totalIncome,
    data.totalExpenses,
    data.netAmount,
  ]);
  dailyTotalRow.height = 24;
  dailyTotalRow.eachCell((cell, colNumber) => {
    cell.fill = TOTAL_ROW_FILL;
    cell.font = { bold: true };
    cell.border = BORDER_THIN;
    if (colNumber >= 2) {
      cell.numFmt = currFormat;
      cell.alignment = { horizontal: 'right' };
    }
  });

  // ==========================================
  // SHEET 5: Category Summary
  // ==========================================
  const catSheet = workbook.addWorksheet('Category Summary', {
    views: [{ state: 'frozen', ySplit: 1 }],
  });

  catSheet.columns = [
    { header: 'Expense Category', key: 'category', width: 26 },
    { header: 'Total Expenses', key: 'total', width: 20 },
    { header: 'Percentage of Expenses', key: 'percentage', width: 24 },
  ];

  const catHeader = catSheet.getRow(1);
  catHeader.eachCell((cell) => {
    cell.fill = HEADER_FILL;
    cell.font = HEADER_FONT;
    cell.alignment = { vertical: 'middle', horizontal: 'center' };
  });
  catHeader.height = 26;

  for (const cat of data.categorySummaries) {
    const row = catSheet.addRow([
      cat.category,
      cat.total,
      `${cat.percentage}%`,
    ]);
    row.height = 20;
    row.eachCell((cell, colNumber) => {
      cell.border = BORDER_THIN;
      if (colNumber === 2) {
        cell.numFmt = currFormat;
        cell.alignment = { horizontal: 'right' };
      } else if (colNumber === 3) {
        cell.alignment = { horizontal: 'right' };
      }
    });
  }

  // ==========================================
  // SHEET 6: Monthly Comparison
  // ==========================================
  const compSheet = workbook.addWorksheet('Monthly Comparison', {
    views: [{ state: 'frozen', ySplit: 1 }],
  });

  compSheet.columns = [
    { header: 'Month', key: 'month', width: 16 },
    { header: 'Total Income', key: 'income', width: 20 },
    { header: 'Total Expenses', key: 'expenses', width: 20 },
    { header: 'Net Savings', key: 'net', width: 20 },
  ];

  const compHeader = compSheet.getRow(1);
  compHeader.eachCell((cell) => {
    cell.fill = HEADER_FILL;
    cell.font = HEADER_FONT;
    cell.alignment = { vertical: 'middle', horizontal: 'center' };
  });
  compHeader.height = 26;

  for (const m of data.monthlyComparisons) {
    const row = compSheet.addRow([m.month, m.income, m.expenses, m.net]);
    row.height = 20;
    row.eachCell((cell, colNumber) => {
      cell.border = BORDER_THIN;
      if (colNumber >= 2) {
        cell.numFmt = currFormat;
        cell.alignment = { horizontal: 'right' };
      }
    });
  }

  return workbook;
}

/**
 * Generates an Excel workbook for custom transactions export (Expenses, Income, or All)
 */
export async function generateTransactionsWorkbook(
  title: string,
  transactions: TransactionRow[],
  currencySymbol = '₹'
): Promise<ExcelJS.Workbook> {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet('Transactions', {
    views: [{ state: 'frozen', ySplit: 1 }],
  });

  const currFormat = `"${currencySymbol}"#,##0.00;[Red]("-""${currencySymbol}"#,##0.00)`;

  sheet.columns = [
    { header: 'Date', key: 'date', width: 14 },
    { header: 'Time', key: 'time', width: 10 },
    { header: 'Type', key: 'type', width: 12 },
    { header: 'Description', key: 'description', width: 34 },
    { header: 'Category', key: 'category', width: 22 },
    { header: 'Payment Method', key: 'paymentMethod', width: 16 },
    { header: 'Amount', key: 'amount', width: 18 },
    { header: 'Status', key: 'status', width: 14 },
    { header: 'Notes', key: 'notes', width: 30 },
  ];

  const header = sheet.getRow(1);
  header.eachCell((cell) => {
    cell.fill = HEADER_FILL;
    cell.font = HEADER_FONT;
    cell.alignment = { vertical: 'middle', horizontal: 'center' };
  });
  header.height = 26;

  let totalAmount = 0;

  for (const t of transactions) {
    totalAmount += t.amount;
    const row = sheet.addRow([
      t.transaction_date,
      t.transaction_time,
      t.type.toUpperCase(),
      t.description,
      t.category_name,
      t.payment_method?.toUpperCase(),
      t.amount,
      t.status.toUpperCase(),
      t.notes || '',
    ]);
    row.height = 20;
    row.eachCell((cell, colNumber) => {
      cell.border = BORDER_THIN;
      if (colNumber === 7) {
        cell.numFmt = currFormat;
        cell.alignment = { horizontal: 'right' };
      }
    });
  }

  const totalRow = sheet.addRow([
    'TOTAL',
    '',
    '',
    '',
    '',
    '',
    totalAmount,
    '',
    '',
  ]);
  totalRow.height = 24;
  totalRow.eachCell((cell, colNumber) => {
    cell.fill = TOTAL_ROW_FILL;
    cell.font = { bold: true };
    cell.border = BORDER_THIN;
    if (colNumber === 7) {
      cell.numFmt = currFormat;
      cell.alignment = { horizontal: 'right' };
    }
  });

  return workbook;
}
