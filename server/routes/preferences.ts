import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { authenticateToken } from '../middleware/auth';
import { getUserPreferences, updateUserPreferences } from '../db/queries';

export const preferencesRouter = Router();
preferencesRouter.use(authenticateToken);

const preferencesSchema = z.object({
  theme: z.enum(['light', 'dark', 'system']).optional(),
  salary_reminder_enabled: z.number().min(0).max(1).optional(),
  daily_expense_reminder: z.number().min(0).max(1).optional(),
  budget_alert_threshold: z.number().min(1).max(100).optional(),
  monthly_review_reminder: z.number().min(0).max(1).optional(),
  recurring_bills_reminder: z.number().min(0).max(1).optional(),
  reminder_time: z.string().regex(/^\d{2}:\d{2}$/).optional(),
});

// GET /api/preferences
preferencesRouter.get('/', (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const prefs = getUserPreferences(userId);
    res.json(prefs);
  } catch (err) {
    res.status(500).json({ error: 'Failed to retrieve preferences' });
  }
});

// PUT /api/preferences
preferencesRouter.put('/', (req: Request, res: Response): void => {
  try {
    const parse = preferencesSchema.safeParse(req.body);
    if (!parse.success) {
      res.status(400).json({ error: parse.error.issues[0]?.message || 'Invalid preferences data' });
      return;
    }

    const userId = req.user!.id;
    const updated = updateUserPreferences(userId, parse.data);
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update preferences' });
  }
});
