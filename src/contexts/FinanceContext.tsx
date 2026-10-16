import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { DashboardData, Category, Transaction } from '../types';
import { api } from '../api/client';
import { getCurrentMonth } from '../utils/dates';
import { useAuth } from './AuthContext';

interface FinanceContextType {
  currentMonth: string;
  setCurrentMonth: (month: string) => void;
  dashboardData: DashboardData | null;
  loadingDashboard: boolean;
  refreshDashboard: () => Promise<void>;
  categories: Category[];
  refreshCategories: () => Promise<void>;

  // Modals & Action Triggers
  isAddExpenseOpen: boolean;
  expensePrefill: Partial<Transaction> | null;
  openAddExpense: (prefill?: Partial<Transaction>) => void;
  closeAddExpense: () => void;

  isAddSalaryOpen: boolean;
  openAddSalary: () => void;
  closeAddSalary: () => void;

  isAddIncomeOpen: boolean;
  openAddIncome: () => void;
  closeAddIncome: () => void;

  selectedTransaction: Transaction | null;
  openTransactionDetail: (t: Transaction) => void;
  closeTransactionDetail: () => void;

  isExportOpen: boolean;
  openExportModal: () => void;
  closeExportModal: () => void;
}

const FinanceContext = createContext<FinanceContextType | undefined>(undefined);

export const FinanceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [currentMonth, setCurrentMonth] = useState<string>(getCurrentMonth());
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [loadingDashboard, setLoadingDashboard] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);

  // Modal states
  const [isAddExpenseOpen, setIsAddExpenseOpen] = useState(false);
  const [expensePrefill, setExpensePrefill] = useState<Partial<Transaction> | null>(null);
  const [isAddSalaryOpen, setIsAddSalaryOpen] = useState(false);
  const [isAddIncomeOpen, setIsAddIncomeOpen] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [isExportOpen, setIsExportOpen] = useState(false);

  const refreshDashboard = useCallback(async () => {
    if (!user) return;
    setLoadingDashboard(true);
    try {
      const data = await api.get<DashboardData>(`/reports/dashboard?month=${currentMonth}`);
      setDashboardData(data);
    } catch (err) {
      console.error('Failed to load dashboard:', err);
    } finally {
      setLoadingDashboard(false);
    }
  }, [user, currentMonth]);

  const refreshCategories = useCallback(async () => {
    if (!user) return;
    try {
      const data = await api.get<Category[]>('/categories');
      setCategories(data);
    } catch (err) {
      console.error('Failed to load categories:', err);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      refreshDashboard();
      refreshCategories();
    } else {
      setDashboardData(null);
      setCategories([]);
    }
  }, [user, currentMonth, refreshDashboard, refreshCategories]);

  const openAddExpense = (prefill?: Partial<Transaction>) => {
    setExpensePrefill(prefill || null);
    setIsAddExpenseOpen(true);
  };
  const closeAddExpense = () => {
    setIsAddExpenseOpen(false);
    setExpensePrefill(null);
  };

  const openAddSalary = () => setIsAddSalaryOpen(true);
  const closeAddSalary = () => setIsAddSalaryOpen(false);

  const openAddIncome = () => setIsAddIncomeOpen(true);
  const closeAddIncome = () => setIsAddIncomeOpen(false);

  const openTransactionDetail = (t: Transaction) => setSelectedTransaction(t);
  const closeTransactionDetail = () => setSelectedTransaction(null);

  const openExportModal = () => setIsExportOpen(true);
  const closeExportModal = () => setIsExportOpen(false);

  return (
    <FinanceContext.Provider
      value={{
        currentMonth,
        setCurrentMonth,
        dashboardData,
        loadingDashboard,
        refreshDashboard,
        categories,
        refreshCategories,

        isAddExpenseOpen,
        expensePrefill,
        openAddExpense,
        closeAddExpense,

        isAddSalaryOpen,
        openAddSalary,
        closeAddSalary,

        isAddIncomeOpen,
        openAddIncome,
        closeAddIncome,

        selectedTransaction,
        openTransactionDetail,
        closeTransactionDetail,

        isExportOpen,
        openExportModal,
        closeExportModal,
      }}
    >
      {children}
    </FinanceContext.Provider>
  );
};

export const useFinance = () => {
  const context = useContext(FinanceContext);
  if (!context) {
    throw new Error('useFinance must be used within a FinanceProvider');
  }
  return context;
};
