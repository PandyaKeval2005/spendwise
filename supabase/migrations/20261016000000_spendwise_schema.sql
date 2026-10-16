-- SpendWise Supabase / PostgreSQL Production Schema with Row Level Security (RLS)

-- 1. Profiles (matches auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT NOT NULL,
  currency TEXT NOT NULL DEFAULT 'INR',
  currency_symbol TEXT NOT NULL DEFAULT '₹',
  monthly_salary NUMERIC(12, 2) NOT NULL DEFAULT 0,
  salary_day INTEGER NOT NULL DEFAULT 1,
  opening_balance NUMERIC(12, 2) NOT NULL DEFAULT 0,
  monthly_budget NUMERIC(12, 2) NOT NULL DEFAULT 0,
  auto_recurring_salary BOOLEAN NOT NULL DEFAULT false,
  onboarding_completed BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 2. Categories
CREATE TABLE IF NOT EXISTS public.categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK(type IN ('expense', 'income')),
  icon TEXT NOT NULL,
  color TEXT NOT NULL,
  budget_limit NUMERIC(12, 2) DEFAULT 0,
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 3. Transactions
CREATE TABLE IF NOT EXISTS public.transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK(type IN ('income', 'expense')),
  amount NUMERIC(12, 2) NOT NULL CHECK(amount > 0),
  description TEXT NOT NULL,
  category_id UUID NOT NULL REFERENCES public.categories(id) ON DELETE RESTRICT,
  category_name TEXT NOT NULL,
  payment_method TEXT NOT NULL DEFAULT 'cash',
  transaction_date DATE NOT NULL,
  transaction_time TIME NOT NULL DEFAULT '12:00:00',
  notes TEXT,
  tags TEXT[],
  status TEXT NOT NULL DEFAULT 'confirmed' CHECK(status IN ('confirmed', 'pending', 'scheduled')),
  is_recurring BOOLEAN NOT NULL DEFAULT false,
  recurring_frequency TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 4. Income Details
CREATE TABLE IF NOT EXISTS public.income_details (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_id UUID UNIQUE NOT NULL REFERENCES public.transactions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  income_type TEXT NOT NULL CHECK(income_type IN ('salary', 'bonus', 'incentive', 'freelance', 'gift', 'reimbursement', 'other')),
  month_applied TEXT NOT NULL
);

-- 5. Monthly Finances
CREATE TABLE IF NOT EXISTS public.monthly_finances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  month TEXT NOT NULL,
  opening_balance NUMERIC(12, 2) DEFAULT 0,
  monthly_budget NUMERIC(12, 2) DEFAULT 0,
  savings_goal NUMERIC(12, 2) DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  UNIQUE(user_id, month)
);

-- 6. User Preferences
CREATE TABLE IF NOT EXISTS public.user_preferences (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  theme TEXT NOT NULL DEFAULT 'light' CHECK(theme IN ('light', 'dark', 'system')),
  salary_reminder_enabled BOOLEAN NOT NULL DEFAULT true,
  daily_expense_reminder BOOLEAN NOT NULL DEFAULT true,
  budget_alert_threshold INTEGER NOT NULL DEFAULT 80,
  monthly_review_reminder BOOLEAN NOT NULL DEFAULT true,
  recurring_bills_reminder BOOLEAN NOT NULL DEFAULT true,
  reminder_time TEXT NOT NULL DEFAULT '20:00',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 7. Recurring Schedules
CREATE TABLE IF NOT EXISTS public.recurring_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK(type IN ('income', 'expense')),
  amount NUMERIC(12, 2) NOT NULL,
  description TEXT NOT NULL,
  category_id UUID NOT NULL REFERENCES public.categories(id),
  income_type TEXT,
  frequency TEXT NOT NULL DEFAULT 'monthly',
  day_of_month INTEGER NOT NULL DEFAULT 1,
  payment_method TEXT NOT NULL DEFAULT 'upi',
  auto_confirm BOOLEAN NOT NULL DEFAULT false,
  is_active BOOLEAN NOT NULL DEFAULT true,
  last_generated_month TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Enable Row Level Security (RLS) on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.income_details ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.monthly_finances ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recurring_schedules ENABLE ROW LEVEL SECURITY;

-- Create RLS Policies guaranteeing strict User Isolation
CREATE POLICY "Users can only view their own profile" ON public.profiles FOR ALL USING (auth.uid() = id);
CREATE POLICY "Users can only view/manage their own categories" ON public.categories FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can only view/manage their own transactions" ON public.transactions FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can only view/manage their own income details" ON public.income_details FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can only view/manage their own monthly finances" ON public.monthly_finances FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can only view/manage their own preferences" ON public.user_preferences FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can only view/manage their own recurring schedules" ON public.recurring_schedules FOR ALL USING (auth.uid() = user_id);

-- Performance indices
CREATE INDEX IF NOT EXISTS idx_pg_trans_user_date ON public.transactions(user_id, transaction_date DESC);
CREATE INDEX IF NOT EXISTS idx_pg_trans_user_type ON public.transactions(user_id, type);
CREATE INDEX IF NOT EXISTS idx_pg_categories_user ON public.categories(user_id);
CREATE INDEX IF NOT EXISTS idx_pg_income_user_month ON public.income_details(user_id, month_applied);
