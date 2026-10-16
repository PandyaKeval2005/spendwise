import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { authenticateToken } from '../middleware/auth';
import {
  getOrCreateMonthlyFinance,
  updateMonthlyFinance,
  findUserById,
} from '../db/queries';

export const financesRouter = Router();
financesRouter.use(authenticateToken);

const updateFinancesSchema = z.object({
  openingBalance: z.number().optional(),
  monthlyBudget: z.number().min(0).optional(),
  savingsGoal: z.number().min(0).optional(),
  notes: z.string().optional(),
});

// GET /api/finances/month/:month
financesRouter.get('/month/:month', (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const month = req.params.month;
    const finance = getOrCreateMonthlyFinance(userId, month);
    const user = findUserById(userId);

    res.json({
      finance,
      defaultBudget: user?.monthly_budget || 0,
      defaultOpeningBalance: user?.opening_balance || 0,
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to retrieve monthly finances' });
  }
});

// PUT /api/finances/month/:month
financesRouter.put('/month/:month', (req: Request, res: Response): void => {
  try {
    const parse = updateFinancesSchema.safeParse(req.body);
    if (!parse.success) {
      res.status(400).json({ error: parse.error.issues[0]?.message || 'Invalid data' });
      return;
    }

    const userId = req.user!.id;
    const month = req.params.month;
    const updated = updateMonthlyFinance(userId, month, parse.data);

    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update monthly finances' });
  }
});
