# SpendWise — Personal Salary & Expense Manager

SpendWise is a production-quality, responsive personal finance web application built for tracking monthly salary, bonuses, daily expenses, savings, and monthly budgets with real-time financial calculations, interactive charts, and downloadable Excel (.xlsx) workbooks.

Designed with a **mobile-first fintech experience** (inspired by modern banking and personal finance apps), it offers an elegant warm light aesthetic with emerald green balances, coral expense indicators, a fixed mobile bottom navigation bar, floating expense entry, and a comprehensive desktop sidebar.

---

## 🌟 Key Features

### 1. Financial Accuracy & Real-time Calculations
- **Authoritative Calculations**:
  - **Current Available Balance**: `Opening Balance + Cumulative Net Income to date - Cumulative Expenses to date`.
  - **Net Amount for Period**: `Total Confirmed Income - Total Expenses`.
  - **Income Remaining**: `Month's Confirmed Income - Month's Expenses` (kept strictly distinct from opening balance).
  - **Spending Percentage**: `(Total Expenses / Total Income) * 100` (safe handling for zero income).
  - **Savings Rate**: `(Net Amount / Total Income) * 100`.
- **Indian Number Formatting**: Formatted with Indian grouping (e.g., `₹12,500.00` and `₹1,25,000.00`).
- **Zero Hardcoded Data**: All metrics, graphs, and summaries are derived live from the persistent database.

### 2. Salary & Income Management
- **Monthly Salary Workflow**:
  - Add salary for each month independently without overwriting previous months.
  - Accommodates salary increases, deductions, and irregular payment dates.
  - Duplicate salary protection: warns user if salary is already recorded for that month with options to update or add as an additional entry.
- **Multiple Income Streams**:
  - Record bonuses, quarterly incentives, commissions, freelance projects, gifts, and reimbursements.
  - History preserves past earnings accurately for annual and month-over-month comparisons.

### 3. Fast Expense Tracking
- **Touch-Friendly Entry**:
  - Large currency input, merchant description with quick-selection chips (*Groceries*, *Dining*, *Cab*, *Utilities*).
  - 15 default customizable categories with consistent icons and color palettes.
  - Payment method tagging: UPI / GPay, Debit Card, Credit Card, Cash, NetBanking, Other.
  - Inline editing, duplicate transaction in one tap, and deletion with confirmation dialog.

### 4. Interactive Charts & Visualizations
- **Spending Trend Chart**: Displays all calendar days of the month; zero-spending days are plotted as zero. Tap any day to inspect transactions.
- **Category Breakdown Doughnut Chart**: Shows spending distribution with percentage share, center total, and category legend.
- **Monthly Budget Progress**: Visual progress bar with auto-alert states (green when on track, amber at $\ge 80\%$, red when exceeded) and daily spending allowance recommendations.

### 5. Multi-Sheet Excel Reports (.xlsx)
Download formatted Excel workbooks generated with `ExcelJS` featuring styled headers, auto-fitting column widths, currency formats (`₹#,##0.00`), frozen panes, and formulas:
- **Sheet 1: Monthly Summary** (Income, Expenses, Net Amount, Opening Balance, Available Balance, Spending %)
- **Sheet 2: Expenses** (Date, Time, Merchant, Category, Payment Method, Amount, Notes, Total formula)
- **Sheet 3: Income** (Date, Time, Type, Description, Amount, Notes, Total formula)
- **Sheet 4: Daily Summary** (Date, Income, Expenses, Net Amount)
- **Sheet 5: Category Summary** (Category, Total Expenses, % of Expenses)
- **Sheet 6: Monthly Comparison** (Month-by-month historical trend)

### 6. Security & Multi-User Isolation
- **Authentication**: Secure bcrypt password hashing, HTTP-only cookie session management, and JWT token signatures.
- **Strict User Isolation**: Every database read, create, update, delete, and export operation requires authentication and enforces `WHERE user_id = ?`.
- **Production Supabase RLS Migration Included**: Complete PostgreSQL migration script with Row Level Security (`supabase/migrations/20261016000000_spendwise_schema.sql`) for cloud deployments.
- **Privacy by Design**: No bank logins, UPI PINs, or sensitive financial account numbers are ever requested.

---

## 🛠️ Technology Stack

| Layer | Technologies |
|---|---|
| **Frontend** | React 19, TypeScript, Vite, Tailwind CSS v4, Lucide Icons, Recharts, Canvas Confetti |
| **Backend** | Node.js (v24), Express 5, TypeScript (`tsx`), Cookie-Parser, CORS, Zod |
| **Database** | SQLite via built-in `node:sqlite` (local/standalone) + PostgreSQL / Supabase Schema with RLS |
| **Reports** | ExcelJS (Native .xlsx workbook generator with cell styles, formulas & multi-sheets) |
| **Testing** | Node.js native test runner (`node:test`) + `tsx` |

---

## 🚀 Getting Started Locally

### Prerequisites
- Node.js $\ge 20$ (Node.js 22 or 24 recommended)
- npm $\ge 9$

### 1. Installation
Clone or navigate to the project directory and install dependencies:
```bash
cd d:\SpendWise
npm install
```

### 2. Environment Configuration
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```
Default `.env` values:
```env
PORT=5000
NODE_ENV=development
JWT_SECRET=spendwise_local_dev_secret_2026_finance_key
```

### 3. Run Automated Tests
SpendWise includes automated tests covering calculations, zero-division protection, Indian currency formatting, multi-sheet Excel generation, and multi-user cross-account data isolation:
```bash
npm test
```

### 4. Start the Application
Run both backend API and frontend Vite dev server concurrently:
```bash
npm run dev
```
- Frontend UI: `http://localhost:5173`
- Backend API: `http://localhost:5000` (proxied by Vite)

Alternatively, to build and run the production server on a single port:
```bash
npm run build
npm start
```
Open `http://localhost:5000`.

---

## 🧪 Testing Verification Criteria

SpendWise has been tested against the following core cases:
1. **User Registration & Login**: Successful registration, JWT session creation, and onboarding persistence.
2. **Salary & Bonus Calculation**: ₹25,000 salary + ₹2,000 bonus = ₹27,000 Total Income.
3. **Expense Tracking**: ₹300 + ₹700 expenses = ₹1,000 Total Expenses.
4. **Income Remaining**: ₹27,000 - ₹1,000 = ₹26,000 Income Remaining.
5. **Opening Balance Isolation**: Opening balance (e.g. ₹5,000) is added to Available Balance (₹31,000) without inflating monthly income.
6. **Cross-User Data Isolation**: User 2 cannot access or view User 1's records or dashboard.
7. **Salary Hike Preservation**: Updating November salary to ₹32,000 leaves October salary intact at ₹25,000.
8. **Excel Export**: Generates 6-sheet `.xlsx` files with totals, formatting, and formulas.

---

## ☁️ Production Deployment

### Option A: Standalone Node / Docker / Render / Railway
1. Build the frontend:
   ```bash
   npm run build
   ```
2. Start the server:
   ```bash
   npm start
   ```
The Express server serves the optimized `dist/` static assets and API routes together on `PORT`.

### Option B: Deploying to Supabase (PostgreSQL + RLS)
1. In your Supabase Project dashboard, go to the **SQL Editor**.
2. Run the SQL script located at:
   ```
   supabase/migrations/20261016000000_spendwise_schema.sql
   ```
3. This creates all tables (`profiles`, `categories`, `transactions`, `income_details`, `monthly_finances`, `user_preferences`, `recurring_schedules`) and enables Row Level Security (RLS) policies.

### Option C: Frontend Deployment on Vercel
Deploy frontend via `vercel.json` and connect API proxy to your hosted backend.

---

## 📂 Project Structure

```
SpendWise/
├── server/
│   ├── db/
│   │   ├── index.ts           # SQLite DatabaseSync connection & category seeding
│   │   ├── schema.sql         # Local SQLite schema with indexes & foreign keys
│   │   └── queries.ts         # Scoped SQL queries with strict user ownership
│   ├── middleware/
│   │   └── auth.ts            # JWT authentication & password hashing
│   ├── routes/
│   │   ├── auth.ts            # Signup, login, logout, onboarding, account deletion
│   │   ├── transactions.ts    # Filtered transactions CRUD & duplicate
│   │   ├── income.ts          # Monthly salary workflow & bonus additions
│   │   ├── finances.ts        # Monthly budget & opening balance settings
│   │   ├── categories.ts      # Custom category CRUD
│   │   ├── reports.ts         # Live dashboard metrics & flexible analytics
│   │   ├── export.ts          # Excel (.xlsx) file downloads
│   │   └── preferences.ts     # User reminder toggles
│   ├── services/
│   │   ├── calculations.ts    # Authoritative financial calculation engine
│   │   └── excel.ts           # ExcelJS 6-sheet workbook generator
│   └── index.ts               # Express server setup & static dist hosting
├── src/
│   ├── api/client.ts          # Fetch API client with file download helper
│   ├── components/
│   │   ├── common/            # Modal, ConfirmDialog, MonthSelector, EmptyState
│   │   ├── dashboard/         # Hero Card, SpendingTrend, CategoryDoughnut, BudgetProgress
│   │   ├── layout/            # MobileBottomNav, DesktopSidebar, TopHeader, AppLayout
│   │   └── modals/            # AddExpenseModal, AddSalaryModal, AddIncomeModal, ExportModal
│   ├── contexts/              # AuthContext, FinanceContext
│   ├── pages/                 # AuthPage, OnboardingWizard, Dashboard, Transactions, Income, Reports, Budgets, Settings
│   ├── utils/                 # Indian currency formatter, date utilities, category icons
│   ├── App.tsx
│   ├── main.tsx
│   └── index.css              # Tailwind v4 styles and PWA safe-areas
├── supabase/migrations/       # Production PostgreSQL + Supabase RLS script
├── tests/                     # Automated unit and integration test suites
├── public/                    # PWA manifest, service worker, favicon
├── package.json
├── tsconfig.json
└── vite.config.ts
```

---

## 🔒 Security & Privacy Notice

SpendWise never connects to external banking credentials, requests OTPs, or stores payment card pins. All data is private to the user account.
