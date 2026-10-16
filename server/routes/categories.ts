import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { authenticateToken } from '../middleware/auth';
import {
  getCategoriesByUser,
  createCategory,
  updateCategory,
  deleteCategory,
} from '../db/queries';

export const categoriesRouter = Router();
categoriesRouter.use(authenticateToken);

const categorySchema = z.object({
  name: z.string().min(1, 'Category name is required').trim(),
  type: z.enum(['expense', 'income']),
  icon: z.string().min(1, 'Icon name is required'),
  color: z.string().regex(/^#([0-9A-F]{3}){1,2}$/i, 'Color must be a valid hex code'),
  budgetLimit: z.number().min(0).optional(),
});

// GET /api/categories?type=expense|income
categoriesRouter.get('/', (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const type = req.query.type as 'expense' | 'income' | undefined;
    const categories = getCategoriesByUser(userId, type);
    res.json(categories);
  } catch (err) {
    res.status(500).json({ error: 'Failed to retrieve categories' });
  }
});

// POST /api/categories
categoriesRouter.post('/', (req: Request, res: Response): void => {
  try {
    const parse = categorySchema.safeParse(req.body);
    if (!parse.success) {
      res.status(400).json({ error: parse.error.issues[0]?.message || 'Invalid category data' });
      return;
    }

    const userId = req.user!.id;
    const newCategory = createCategory(userId, parse.data);
    res.status(201).json(newCategory);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to create category' });
  }
});

// PUT /api/categories/:id
categoriesRouter.put('/:id', (req: Request, res: Response): void => {
  try {
    const parse = categorySchema.partial().safeParse(req.body);
    if (!parse.success) {
      res.status(400).json({ error: parse.error.issues[0]?.message || 'Invalid category update' });
      return;
    }

    const userId = req.user!.id;
    const updated = updateCategory(userId, req.params.id, parse.data);
    if (!updated) {
      res.status(404).json({ error: 'Category not found or unauthorized' });
      return;
    }

    res.json(updated);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to update category' });
  }
});

// DELETE /api/categories/:id
categoriesRouter.delete('/:id', (req: Request, res: Response): void => {
  try {
    const userId = req.user!.id;
    deleteCategory(userId, req.params.id);
    res.json({ message: 'Category deleted successfully' });
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Failed to delete category' });
  }
});
