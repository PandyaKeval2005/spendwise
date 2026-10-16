import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

// Load environment variables
dotenv.config();

// Initialize database schema
import './db/index';

import { authRouter } from './routes/auth';
import { transactionsRouter } from './routes/transactions';
import { incomeRouter } from './routes/income';
import { financesRouter } from './routes/finances';
import { categoriesRouter } from './routes/categories';
import { reportsRouter } from './routes/reports';
import { exportRouter } from './routes/export';
import { preferencesRouter } from './routes/preferences';

const app = express();
const PORT = process.env.PORT || 5000;

// Security & utility middleware
app.use(cors({
  origin: true, // Allow frontend origin with credentials
  credentials: true,
  exposedHeaders: ['Content-Disposition'],
}));

app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health Check
app.get('/api/health', (req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    application: 'SpendWise — Personal Finance Manager',
    timestamp: new Date().toISOString(),
  });
});

// Register API Routes
app.use('/api/auth', authRouter);
app.use('/api/transactions', transactionsRouter);
app.use('/api/income', incomeRouter);
app.use('/api/finances', financesRouter);
app.use('/api/categories', categoriesRouter);
app.use('/api/reports', reportsRouter);
app.use('/api/export', exportRouter);
app.use('/api/preferences', preferencesRouter);

// Serve static frontend files in production if dist/ exists
const DIST_PATH = path.resolve(process.cwd(), 'dist');
if (fs.existsSync(DIST_PATH)) {
  app.use(express.static(DIST_PATH));
  app.use((req: Request, res: Response, next: NextFunction) => {
    if (req.method === 'GET' && !req.path.startsWith('/api/')) {
      return res.sendFile(path.join(DIST_PATH, 'index.html'));
    }
    next();
  });
}

// Global error handling middleware
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error('Unhandled server error:', err);
  res.status(500).json({
    error: 'Internal server error occurred',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined,
  });
});

export let server: any = null;
if (!process.env.VERCEL) {
  server = app.listen(PORT, () => {
    console.log(`[SpendWise Server] Running on http://localhost:${PORT}`);
  });
}

export const serverReady = new Promise<void>((resolve) => {
  if (process.env.VERCEL || (server && server.listening)) {
    resolve();
  } else if (server) {
    server.once('listening', resolve);
  } else {
    resolve();
  }
});

export { app };
