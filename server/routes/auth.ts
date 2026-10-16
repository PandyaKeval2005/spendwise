import { Router, Request, Response } from 'express';
import { z } from 'zod';
import {
  findUserByEmail,
  findUserById,
  createUser,
  updateUserProfile,
  deleteTransaction,
} from '../db/queries';
import {
  hashPassword,
  comparePassword,
  generateToken,
  authenticateToken,
} from '../middleware/auth';
import { db } from '../db/index';

export const authRouter = Router();

const signupSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  displayName: z.string().min(2, 'Name must be at least 2 characters'),
  currency: z.string().default('INR'),
  currencySymbol: z.string().default('₹'),
  monthlySalary: z.number().min(0).optional(),
  openingBalance: z.number().optional(),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1, 'Password is required'),
});

const onboardingSchema = z.object({
  displayName: z.string().min(1),
  currency: z.string().default('INR'),
  currencySymbol: z.string().default('₹'),
  monthlySalary: z.number().min(0).default(0),
  salaryDay: z.number().min(1).max(31).default(1),
  openingBalance: z.number().default(0),
  monthlyBudget: z.number().min(0).default(0),
  autoRecurringSalary: z.boolean().default(false),
});

/**
 * Helper to set HTTP-only cookie with the auth token
 */
function setAuthCookie(res: Response, token: string) {
  res.cookie('spendwise_token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
    path: '/',
  });
}

// POST /api/auth/signup
authRouter.post('/signup', async (req: Request, res: Response): Promise<void> => {
  try {
    const parse = signupSchema.safeParse(req.body);
    if (!parse.success) {
      res.status(400).json({ error: parse.error.issues[0]?.message || 'Invalid input data' });
      return;
    }

    const { email, password, displayName, currency, currencySymbol, monthlySalary, openingBalance } = parse.data;

    const existingUser = findUserByEmail(email);
    if (existingUser) {
      res.status(409).json({ error: 'An account with this email already exists. Please log in.' });
      return;
    }

    const passwordHash = await hashPassword(password);
    const user = createUser({
      email,
      passwordHash,
      displayName,
      currency,
      currencySymbol,
      monthlySalary,
      openingBalance,
    });

    const token = generateToken({
      id: user.id,
      email: user.email,
      displayName: user.display_name,
    });

    setAuthCookie(res, token);

    res.status(201).json({
      message: 'Account created successfully',
      token,
      user: {
        id: user.id,
        email: user.email,
        displayName: user.display_name,
        currency: user.currency,
        currencySymbol: user.currency_symbol,
        monthlySalary: user.monthly_salary,
        salaryDay: user.salary_day,
        openingBalance: user.opening_balance,
        monthlyBudget: user.monthly_budget,
        onboardingCompleted: Boolean(user.onboarding_completed),
      },
    });
  } catch (err: any) {
    console.error('Signup error:', err);
    res.status(500).json({ error: err?.message || 'An unexpected error occurred during signup' });
  }
});

// POST /api/auth/login
authRouter.post('/login', async (req: Request, res: Response): Promise<void> => {
  try {
    const parse = loginSchema.safeParse(req.body);
    if (!parse.success) {
      res.status(400).json({ error: parse.error.issues[0]?.message || 'Invalid email or password' });
      return;
    }

    const { email, password } = parse.data;
    const user = findUserByEmail(email);
    if (!user) {
      res.status(401).json({ error: 'Incorrect email or password. Please try again.' });
      return;
    }

    const match = await comparePassword(password, user.password_hash);
    if (!match) {
      res.status(401).json({ error: 'Incorrect email or password. Please try again.' });
      return;
    }

    const token = generateToken({
      id: user.id,
      email: user.email,
      displayName: user.display_name,
    });

    setAuthCookie(res, token);

    res.json({
      message: 'Logged in successfully',
      token,
      user: {
        id: user.id,
        email: user.email,
        displayName: user.display_name,
        currency: user.currency,
        currencySymbol: user.currency_symbol,
        monthlySalary: user.monthly_salary,
        salaryDay: user.salary_day,
        openingBalance: user.opening_balance,
        monthlyBudget: user.monthly_budget,
        onboardingCompleted: Boolean(user.onboarding_completed),
      },
    });
  } catch (err: any) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'An unexpected error occurred during login' });
  }
});

// POST /api/auth/logout
authRouter.post('/logout', (req: Request, res: Response) => {
  res.clearCookie('spendwise_token', { path: '/' });
  res.json({ message: 'Logged out successfully' });
});

// GET /api/auth/me (Protected)
authRouter.get('/me', authenticateToken, (req: Request, res: Response): void => {
  const user = findUserById(req.user!.id);
  if (!user) {
    res.status(404).json({ error: 'User not found' });
    return;
  }

  res.json({
    user: {
      id: user.id,
      email: user.email,
      displayName: user.display_name,
      currency: user.currency,
      currencySymbol: user.currency_symbol,
      monthlySalary: user.monthly_salary,
      salaryDay: user.salary_day,
      openingBalance: user.opening_balance,
      monthlyBudget: user.monthly_budget,
      autoRecurringSalary: Boolean(user.auto_recurring_salary),
      onboardingCompleted: Boolean(user.onboarding_completed),
    },
  });
});

// POST /api/auth/onboarding (Protected)
authRouter.post('/onboarding', authenticateToken, (req: Request, res: Response): void => {
  try {
    const parse = onboardingSchema.safeParse(req.body);
    if (!parse.success) {
      res.status(400).json({ error: parse.error.issues[0]?.message || 'Invalid setup data' });
      return;
    }

    const data = parse.data;
    const userId = req.user!.id;

    const updatedUser = updateUserProfile(userId, {
      displayName: data.displayName,
      currency: data.currency,
      currencySymbol: data.currencySymbol,
      monthlySalary: data.monthlySalary,
      salaryDay: data.salaryDay,
      openingBalance: data.openingBalance,
      monthlyBudget: data.monthlyBudget,
      autoRecurringSalary: data.autoRecurringSalary,
      onboardingCompleted: true,
    });

    res.json({
      message: 'Onboarding completed successfully',
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
        displayName: updatedUser.display_name,
        currency: updatedUser.currency,
        currencySymbol: updatedUser.currency_symbol,
        monthlySalary: updatedUser.monthly_salary,
        salaryDay: updatedUser.salary_day,
        openingBalance: updatedUser.opening_balance,
        monthlyBudget: updatedUser.monthly_budget,
        onboardingCompleted: true,
      },
    });
  } catch (err: any) {
    console.error('Onboarding error:', err);
    res.status(500).json({ error: 'Failed to complete onboarding' });
  }
});

// PUT /api/auth/profile (Protected)
authRouter.put('/profile', authenticateToken, (req: Request, res: Response): void => {
  try {
    const profileSchema = z.object({
      displayName: z.string().min(1).optional(),
      currency: z.string().optional(),
      currencySymbol: z.string().optional(),
      monthlySalary: z.number().min(0).optional(),
      salaryDay: z.number().min(1).max(31).optional(),
      openingBalance: z.number().optional(),
      monthlyBudget: z.number().min(0).optional(),
      autoRecurringSalary: z.boolean().optional(),
    });

    const parse = profileSchema.safeParse(req.body);
    if (!parse.success) {
      res.status(400).json({ error: parse.error.issues[0]?.message || 'Invalid profile data' });
      return;
    }

    const updatedUser = updateUserProfile(req.user!.id, parse.data);
    res.json({
      message: 'Profile updated successfully',
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
        displayName: updatedUser.display_name,
        currency: updatedUser.currency,
        currencySymbol: updatedUser.currency_symbol,
        monthlySalary: updatedUser.monthly_salary,
        salaryDay: updatedUser.salary_day,
        openingBalance: updatedUser.opening_balance,
        monthlyBudget: updatedUser.monthly_budget,
        autoRecurringSalary: Boolean(updatedUser.auto_recurring_salary),
        onboardingCompleted: Boolean(updatedUser.onboarding_completed),
      },
    });
  } catch (err: any) {
    console.error('Update profile error:', err);
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

// POST /api/auth/change-password (Protected)
authRouter.post('/change-password', authenticateToken, async (req: Request, res: Response): Promise<void> => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword || newPassword.length < 6) {
      res.status(400).json({ error: 'New password must be at least 6 characters' });
      return;
    }

    const user = findUserById(req.user!.id);
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    const match = await comparePassword(currentPassword, user.password_hash);
    if (!match) {
      res.status(401).json({ error: 'Current password is incorrect' });
      return;
    }

    const newHash = await hashPassword(newPassword);
    db.prepare('UPDATE users SET password_hash = ?, updated_at = ? WHERE id = ?')
      .run(newHash, new Date().toISOString(), user.id);

    res.json({ message: 'Password updated successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to change password' });
  }
});

// POST /api/auth/delete-account (Protected)
authRouter.post('/delete-account', authenticateToken, async (req: Request, res: Response): Promise<void> => {
  try {
    const { password } = req.body;
    const user = findUserById(req.user!.id);
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    const match = await comparePassword(password, user.password_hash);
    if (!match) {
      res.status(401).json({ error: 'Incorrect password for account deletion confirmation' });
      return;
    }

    // Delete user (cascades to all user records)
    db.prepare('DELETE FROM users WHERE id = ?').run(user.id);
    res.clearCookie('spendwise_token', { path: '/' });
    res.json({ message: 'Your account and all associated data have been permanently deleted.' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete account' });
  }
});
