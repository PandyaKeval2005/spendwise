import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

const JWT_SECRET = process.env.JWT_SECRET || 'spendwise_secret_key_development_2026_finance';
const JWT_EXPIRES_IN = '30d';

export interface AuthenticatedUser {
  id: string;
  email: string;
  displayName: string;
}

// Extend Express Request
declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
    }
  }
}

/**
 * Generate a JWT token for a user
 */
export function generateToken(user: AuthenticatedUser): string {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      displayName: user.displayName,
    },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );
}

/**
 * Hash a plain password using bcrypt
 */
export async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
}

/**
 * Compare plain password with hash
 */
export async function comparePassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}

/**
 * Authentication middleware: verifies JWT from cookie or Bearer header
 */
export function authenticateToken(req: Request, res: Response, next: NextFunction): void {
  let token: string | undefined;

  // 1. Check HTTP-only cookie
  if (req.cookies && req.cookies.spendwise_token) {
    token = req.cookies.spendwise_token;
  }

  // 2. Fallback to Authorization: Bearer <token> header
  const authHeader = req.headers['authorization'];
  if (!token && authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.substring(7);
  }

  // 3. Fallback to query param token (for direct browser file downloads via link)
  if (!token && req.query && req.query.token) {
    token = String(req.query.token);
  }

  if (!token) {
    res.status(401).json({ error: 'Authentication required. Please log in.' });
    return;
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as AuthenticatedUser;
    req.user = {
      id: decoded.id,
      email: decoded.email,
      displayName: decoded.displayName,
    };
    next();
  } catch (err) {
    res.status(401).json({ error: 'Session expired or invalid token. Please log in again.' });
  }
}
