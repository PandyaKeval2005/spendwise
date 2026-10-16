import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { authenticateToken } from '../middleware/auth';
import {
  getTransactions,
  getTransactionById,
  createTransaction,
  updateTransaction,
  deleteTransaction,
} from '../db/queries';

export const transactionsRouter = Router();

// Require auth for all transaction operations
transactionsRouter.use(authenticateToken);

const transactionInputSchema = z.object({
  type: z.enum(['income', 'expense']),
  amount: z.number().positive('Amount must be greater than zero'),
  description: z.string().min(1, 'Description is required').trim(),
  categoryId: z.string().min(1, 'Category is required'),
  categoryName: z.string().optional(),
  paymentMethod: z.enum(['cash', 'upi', 'debit_card', 'credit_card', 'bank_transfer', 'other']).default('cash'),
  transactionDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format').optional(),
  transactionTime: z.string().optional(),
  notes: z.string().optional(),
  tags: z.array(z.string()).optional(),
  status: z.enum(['confirmed', 'pending', 'scheduled']).default('confirmed'),
  isRecurring: z.boolean().default(false),
  recurringFrequency: z.string().optional(),
  incomeType: z.string().optional(),
});

// GET /api/transactions
transactionsRouter.get('/', (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const {
      month,
      startDate,
      endDate,
      type,
      categoryId,
      paymentMethod,
      search,
      minAmount,
      maxAmount,
      status,
      sortBy,
      limit,
      offset,
    } = req.query;

    const result = getTransactions(userId, {
      month: month ? String(month) : undefined,
      startDate: startDate ? String(startDate) : undefined,
      endDate: endDate ? String(endDate) : undefined,
      type: (type as 'income' | 'expense' | 'all') || 'all',
      categoryId: categoryId ? String(categoryId) : undefined,
      paymentMethod: paymentMethod ? String(paymentMethod) : undefined,
      search: search ? String(search) : undefined,
      minAmount: minAmount !== undefined && minAmount !== '' ? Number(minAmount) : undefined,
      maxAmount: maxAmount !== undefined && maxAmount !== '' ? Number(maxAmount) : undefined,
      status: status ? String(status) : undefined,
      sortBy: (sortBy as 'newest' | 'oldest' | 'highest' | 'lowest') || 'newest',
      limit: limit ? Number(limit) : undefined,
      offset: offset ? Number(offset) : undefined,
    });

    res.json(result);
  } catch (err: any) {
    console.error('Fetch transactions error:', err);
    res.status(500).json({ error: 'Failed to retrieve transactions' });
  }
});

// GET /api/transactions/:id
transactionsRouter.get('/:id', (req: Request, res: Response): void => {
  try {
    const userId = req.user!.id;
    const transaction = getTransactionById(userId, req.params.id);
    if (!transaction) {
      res.status(404).json({ error: 'Transaction not found' });
      return;
    }
    res.json(transaction);
  } catch (err) {
    res.status(500).json({ error: 'Failed to retrieve transaction' });
  }
});

// POST /api/transactions
transactionsRouter.post('/', (req: Request, res: Response): void => {
  try {
    const parse = transactionInputSchema.safeParse(req.body);
    if (!parse.success) {
      res.status(400).json({ error: parse.error.issues[0]?.message || 'Invalid transaction data' });
      return;
    }

    const userId = req.user!.id;
    const newTransaction = createTransaction(userId, parse.data);
    res.status(201).json(newTransaction);
  } catch (err: any) {
    console.error('Create transaction error:', err);
    res.status(500).json({ error: err.message || 'Failed to record transaction' });
  }
});

// PUT /api/transactions/:id
transactionsRouter.put('/:id', (req: Request, res: Response): void => {
  try {
    const parse = transactionInputSchema.partial().safeParse(req.body);
    if (!parse.success) {
      res.status(400).json({ error: parse.error.issues[0]?.message || 'Invalid update data' });
      return;
    }

    const userId = req.user!.id;
    const updated = updateTransaction(userId, req.params.id, parse.data);
    if (!updated) {
      res.status(404).json({ error: 'Transaction not found or unauthorized' });
      return;
    }

    res.json(updated);
  } catch (err: any) {
    console.error('Update transaction error:', err);
    res.status(500).json({ error: err.message || 'Failed to update transaction' });
  }
});

// DELETE /api/transactions/:id
transactionsRouter.delete('/:id', (req: Request, res: Response): void => {
  try {
    const userId = req.user!.id;
    const success = deleteTransaction(userId, req.params.id);
    if (!success) {
      res.status(404).json({ error: 'Transaction not found or unauthorized' });
      return;
    }
    res.json({ message: 'Transaction deleted successfully' });
  } catch (err: any) {
    console.error('Delete transaction error:', err);
    res.status(500).json({ error: err.message || 'Failed to delete transaction' });
  }
});

// POST /api/transactions/:id/duplicate
transactionsRouter.post('/:id/duplicate', (req: Request, res: Response): void => {
  try {
    const userId = req.user!.id;
    const original = getTransactionById(userId, req.params.id);
    if (!original) {
      res.status(404).json({ error: 'Original transaction not found' });
      return;
    }

    const now = new Date();
    const todayDate = now.toISOString().split('T')[0];
    const todayTime = now.toTimeString().substring(0, 5);

    const duplicated = createTransaction(userId, {
      type: original.type,
      amount: original.amount,
      description: `${original.description} (Copy)`,
      categoryId: original.category_id,
      categoryName: original.category_name,
      paymentMethod: original.payment_method,
      transactionDate: todayDate,
      transactionTime: todayTime,
      notes: original.notes || undefined,
      incomeType: original.income_type,
    });

    res.status(201).json(duplicated);
  } catch (err: any) {
    console.error('Duplicate transaction error:', err);
    res.status(500).json({ error: 'Failed to duplicate transaction' });
  }
});
