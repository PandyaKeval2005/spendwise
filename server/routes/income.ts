import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { authenticateToken } from '../middleware/auth';
import {
  createTransaction,
  updateTransaction,
  deleteTransaction,
  getSalaryForMonth,
  getAllIncomeForMonth,
  getCategoriesByUser,
  findUserById,
} from '../db/queries';

export const incomeRouter = Router();
incomeRouter.use(authenticateToken);

const salaryInputSchema = z.object({
  month: z.string().regex(/^\d{4}-\d{2}$/, 'Month must be in YYYY-MM format'),
  amount: z.number().positive('Salary amount must be greater than zero'),
  description: z.string().default('Monthly Salary'),
  dateReceived: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  timeReceived: z.string().optional(),
  paymentMethod: z.enum(['cash', 'upi', 'debit_card', 'credit_card', 'bank_transfer', 'other']).default('bank_transfer'),
  notes: z.string().optional(),
  forceDuplicate: z.boolean().default(false), // when true, allows adding another salary for the same month
});

const bonusInputSchema = z.object({
  month: z.string().regex(/^\d{4}-\d{2}$/).optional(),
  amount: z.number().positive('Amount must be greater than zero'),
  incomeType: z.enum(['bonus', 'incentive', 'freelance', 'gift', 'reimbursement', 'other']).default('bonus'),
  description: z.string().min(1, 'Description is required'),
  dateReceived: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  timeReceived: z.string().optional(),
  paymentMethod: z.enum(['cash', 'upi', 'debit_card', 'credit_card', 'bank_transfer', 'other']).default('bank_transfer'),
  notes: z.string().optional(),
});

// GET /api/income?month=YYYY-MM
incomeRouter.get('/', (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const month = (req.query.month as string) || new Date().toISOString().substring(0, 7);

    const incomeList = getAllIncomeForMonth(userId, month);
    const existingSalary = getSalaryForMonth(userId, month);

    res.json({
      month,
      income: incomeList,
      existingSalary,
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to retrieve income records' });
  }
});

// POST /api/income/salary
incomeRouter.post('/salary', (req: Request, res: Response): void => {
  try {
    const parse = salaryInputSchema.safeParse(req.body);
    if (!parse.success) {
      res.status(400).json({ error: parse.error.issues[0]?.message || 'Invalid salary data' });
      return;
    }

    const { month, amount, description, dateReceived, timeReceived, paymentMethod, notes, forceDuplicate } = parse.data;
    const userId = req.user!.id;

    // Check if salary record already exists for this specific month
    const existingSalary = getSalaryForMonth(userId, month);
    if (existingSalary && !forceDuplicate) {
      res.status(409).json({
        error: `A salary record of ${existingSalary.amount} already exists for ${month}.`,
        existingSalaryId: existingSalary.id,
        existingAmount: existingSalary.amount,
        canUpdate: true,
      });
      return;
    }

    // Find or create 'Salary' category
    const categories = getCategoriesByUser(userId, 'income');
    let salaryCategory = categories.find((c) => c.name.toLowerCase() === 'salary');
    const categoryId = salaryCategory ? salaryCategory.id : (categories[0]?.id || 'salary');

    const defaultDate = `${month}-01`;
    const finalDate = dateReceived || defaultDate;
    const finalTime = timeReceived || '09:00';

    const transaction = createTransaction(userId, {
      type: 'income',
      amount,
      description,
      categoryId,
      categoryName: 'Salary',
      paymentMethod,
      transactionDate: finalDate,
      transactionTime: finalTime,
      notes,
      incomeType: 'salary',
      status: 'confirmed',
    });

    res.status(201).json({
      message: 'Monthly salary added successfully',
      salary: transaction,
    });
  } catch (err: any) {
    console.error('Add salary error:', err);
    res.status(500).json({ error: err.message || 'Failed to add salary' });
  }
});

// POST /api/income/bonus
incomeRouter.post('/bonus', (req: Request, res: Response): void => {
  try {
    const parse = bonusInputSchema.safeParse(req.body);
    if (!parse.success) {
      res.status(400).json({ error: parse.error.issues[0]?.message || 'Invalid bonus data' });
      return;
    }

    const { month, amount, incomeType, description, dateReceived, timeReceived, paymentMethod, notes } = parse.data;
    const userId = req.user!.id;

    const now = new Date();
    const finalDate = dateReceived || (month ? `${month}-01` : now.toISOString().split('T')[0]);
    const finalTime = timeReceived || now.toTimeString().substring(0, 5);

    // Find income category matching type or default
    const categories = getCategoriesByUser(userId, 'income');
    let category = categories.find((c) => c.name.toLowerCase().includes(incomeType.toLowerCase())) || categories[0];
    const categoryId = category ? category.id : 'income';
    const categoryName = category ? category.name : 'Other Income';

    const transaction = createTransaction(userId, {
      type: 'income',
      amount,
      description,
      categoryId,
      categoryName,
      paymentMethod,
      transactionDate: finalDate,
      transactionTime: finalTime,
      notes,
      incomeType,
      status: 'confirmed',
    });

    res.status(201).json({
      message: `${incomeType.charAt(0).toUpperCase() + incomeType.slice(1)} recorded successfully`,
      income: transaction,
    });
  } catch (err: any) {
    console.error('Add bonus error:', err);
    res.status(500).json({ error: err.message || 'Failed to add income' });
  }
});

// DELETE /api/income/:id
incomeRouter.delete('/:id', (req: Request, res: Response): void => {
  try {
    const userId = req.user!.id;
    const success = deleteTransaction(userId, req.params.id);
    if (!success) {
      res.status(404).json({ error: 'Income record not found or unauthorized' });
      return;
    }
    res.json({ message: 'Income record deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete income record' });
  }
});
