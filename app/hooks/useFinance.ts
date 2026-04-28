import { useState, useMemo, useEffect } from "react";
import { BudgetItem, BudgetStatus } from "../types/finance";
import { DEFAULT_BUDGET_ITEMS } from "../constants/finance";
import { calculateFinancialSummary } from "../nexus/finance";
import { collection, query, orderBy, onSnapshot, Timestamp, addDoc } from "firebase/firestore";
import { db, auth, handleFirestoreError, OperationType } from "../nexus/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { FinanceService, type UserProfile } from "../services/financeService";

export interface Transaction {
  id: string;
  title: string;
  amount: number;
  category: string;
  subCategory?: string | null;
  type: 'income' | 'expense';
  notes?: string;
  date: Date;
  walletId?: string;
}

export interface Category {
  id: string;
  name: string;
  type: 'income' | 'expense';
  commitmentType?: 'debt' | 'fixed' | 'savings' | 'regular' | 'catatan'; // New: mapping for commitments
  icon: string;
  color: string;
  subCategories: string[];
}

export interface Wallet {
  id: string;
  name: string;
  balance: number;
  type: 'debit' | 'credit'; // New: Debit vs Credit
  walletType?: 'Bank' | 'E-Wallet' | 'Cash'; // Sub-category
  limit?: number; // Optional limit for credit types
  icon: string;
  color: string;
}

export interface Bill {
  id: string;
  name: string;
  amount: number;
  dueDate: Date;
  status: 'paid' | 'unpaid';
  category: string;
}

export interface RecurringTransaction {
  id: string;
  title: string;
  amount: number;
  frequency: 'Monthly' | 'Weekly' | 'Daily';
  startDate: Date;
  endDate?: Date | null;
  walletId?: string;
  category?: string;
  notes?: string;
  relatedId?: string;
  paidMonths?: string[];
  type?: 'income' | 'expense';
}

export interface Debt {
  id: string;
  personName: string;
  amount: number;
  paidAmount?: number;
  type: 'debt' | 'receivable';
  borrowDate: Date;
  dueDate?: Date | null;
  walletId?: string;
  notes?: string;
  status: 'active' | 'paid';
  isInstallment?: boolean;
  interestRate?: number;
  tenor?: number;
  dueDateDay?: number;
}

export interface SavingsTarget {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  deadline?: Date | null;
  color?: string;
  icon?: string;
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'success';
  date: Date;
  read: boolean;
  link?: string;
  relatedId?: string;
}

export interface BundleItem {
  name: string;
  amount: number;
  isChecked: boolean;
}

export interface Bundle {
  id: string;
  name: string;
  date: Date;
  status: 'active' | 'paid';
  walletId?: string;
  notes?: string;
  items: BundleItem[];
  createdBy?: string;
}

export const useFinanceData = (period: 'Hari' | 'Minggu' | 'Bulan' | 'Tahun' | 'Semua' = 'Bulan') => {
  const [items, setItems] = useState<BudgetItem[]>(DEFAULT_BUDGET_ITEMS);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [budgets, setBudgets] = useState<any[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [bills, setBills] = useState<Bill[]>([]);
  const [debts, setDebts] = useState<any[]>([]);
  const [recurringTransactions, setRecurringTransactions] = useState<RecurringTransaction[]>([]);
  const [savingsTargets, setSavingsTargets] = useState<SavingsTarget[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [bundles, setBundles] = useState<Bundle[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, async (user) => {
      if (user) {
        // Ensure profile exists and get it
        const userProfile = await FinanceService.ensureProfile(user);
        setProfile(userProfile);

        const uid = user.uid;
        const linkedUid = userProfile?.linkedUserId || null;

        // Use FinanceService for subscriptions
        const unsubTx = FinanceService.subscribeCollection(uid, linkedUid, 'transactions', setTransactions, 'date');
        const unsubBg = FinanceService.subscribeCollection(uid, linkedUid, 'budgets', setBudgets);
        const unsubCat = FinanceService.subscribeCollection(uid, linkedUid, 'categories', setCategories);
        const unsubWal = FinanceService.subscribeCollection(uid, linkedUid, 'wallets', setWallets);
        const unsubBil = FinanceService.subscribeCollection(uid, linkedUid, 'bills', setBills, 'dueDate');
        const unsubDeb = FinanceService.subscribeCollection(uid, linkedUid, 'debts', setDebts, 'createdAt');
        const unsubRec = FinanceService.subscribeCollection(uid, linkedUid, 'recurring_transactions', setRecurringTransactions, 'startDate');
        const unsubSav = FinanceService.subscribeCollection(uid, linkedUid, 'savings_targets', setSavingsTargets);
        const unsubNotif = FinanceService.subscribeCollection(uid, linkedUid, 'notifications', setNotifications, 'date');
        const unsubBun = FinanceService.subscribeCollection(uid, linkedUid, 'bundles', setBundles, 'date');

        setLoading(false);

        return () => {
          unsubTx();
          unsubBg();
          unsubCat();
          unsubWal();
          unsubBil();
          unsubDeb();
          unsubRec();
          unsubSav();
          unsubNotif();
          unsubBun();
        };
      } else {
        setProfile(null);
        setTransactions([]);
        setBudgets([]);
        setCategories([]);
        setWallets([]);
        setBills([]);
        setDebts([]);
        setRecurringTransactions([]);
        setSavingsTargets([]);
        setNotifications([]);
        setBundles([]);
        setLoading(false);
      }
    });

    return () => unsubAuth();
  }, []);

  // Notification Generator Logic (H-1 Alerts)
  useEffect(() => {
    const user = auth.currentUser;
    if (!user || loading) return;

    const checkUpcoming = async () => {
      const now = new Date();
      const tomorrow = new Date(now);
      tomorrow.setDate(now.getDate() + 1);
      tomorrow.setHours(23, 59, 59, 999);

      // Check Bills
      for (const bill of bills) {
        if (bill.status === 'unpaid' && bill.dueDate <= tomorrow && bill.dueDate > now) {
          const existingNotif = notifications.find(n => n.relatedId === bill.id);
          if (!existingNotif) {
            await FinanceService.addData(user.uid, profile.linkedUserId || null, 'notifications', {
              title: "Tagihan Mendatang",
              message: `Tagihan ${bill.name} sebesar Rp${bill.amount.toLocaleString('id-ID')} jatuh tempo besok!`,
              type: "warning",
              date: new Date(),
              read: false,
              relatedId: bill.id,
              link: "bills"
            });
          }
        }
      }

      // Check Recurring
      for (const rec of recurringTransactions) {
        const nextDue = new Date(rec.startDate);
        // Simplistic check for next due date based on frequency
        while (nextDue < now) {
          if (rec.frequency === 'Monthly') nextDue.setMonth(nextDue.getMonth() + 1);
          else if (rec.frequency === 'Weekly') nextDue.setDate(nextDue.getDate() + 7);
          else nextDue.setDate(nextDue.getDate() + 1);
        }

        if (nextDue <= tomorrow && nextDue > now) {
           const existingNotif = notifications.find(n => n.relatedId === rec.id && n.date.getTime() > (now.getTime() - 86400000));
           if (!existingNotif) {
              await FinanceService.addData(user.uid, profile.linkedUserId || null, 'notifications', {
                title: "Transaksi Berulang",
                message: `Transaksi ${rec.title} akan didebet besok!`,
                type: "info",
                date: new Date(),
                read: false,
                relatedId: rec.id,
                link: "recurring"
              });
           }
        }
      }
    };

    checkUpcoming();
  }, [bills, recurringTransactions, loading]);

  const summary = useMemo(() => calculateFinancialSummary(items), [items]);

    const periodTransactions = useMemo(() => {
    const startOfPeriod = new Date();
    startOfPeriod.setHours(0, 0, 0, 0);

    if (period === 'Hari') {
      // already set to today
    } else if (period === 'Minggu') {
      const day = startOfPeriod.getDay();
      const diff = startOfPeriod.getDate() - day + (day === 0 ? -6 : 1);
      startOfPeriod.setDate(diff);
    } else if (period === 'Bulan') {
      startOfPeriod.setDate(1);
    } else if (period === 'Tahun') {
      startOfPeriod.setMonth(0, 1);
    }

    return period === 'Semua' 
      ? transactions 
      : transactions.filter(t => t.date >= startOfPeriod);
  }, [transactions, period]);

  const stats = useMemo(() => {
    const income = periodTransactions.filter(t => t.type === 'income').reduce((acc, t) => acc + t.amount, 0);
    const expense = periodTransactions.filter(t => t.type === 'expense').reduce((acc, t) => acc + t.amount, 0);
    const totalBudgetLimit = budgets.reduce((acc, b) => acc + (Number(b.limit) || 0), 0);
    const totalDebitBalance = wallets.filter(w => w.type === 'debit' || !w.type).reduce((acc, w) => acc + (Number(w.balance) || 0), 0);
    const totalCreditLimit = wallets.filter(w => w.type === 'credit').reduce((acc, w) => acc + (Number(w.limit) || 0), 0);
    const totalCreditUsed = wallets.filter(w => w.type === 'credit').reduce((acc, w) => acc + (Number(w.balance) || 0), 0);

    return {
      income,
      expense,
      balance: income - expense,
      totalWalletBalance: totalDebitBalance,
      totalCreditAvailable: totalCreditLimit - totalCreditUsed,
      totalBudgetLimit: totalBudgetLimit || 5000000 
    };
  }, [periodTransactions, budgets, wallets]);

  const toggleStatus = (id: string) => {
    setItems((prev) =>
      prev.map((item) =>
        item.id === id
          ? {
              ...item,
              status: item.status === BudgetStatus.PAID ? BudgetStatus.UNPAID : BudgetStatus.PAID,
            }
          : item
      )
    );
  };

  const sortedItems = useMemo(() => {
    return [...items].sort((a, b) => {
      return new Date(a.deadline).getTime() - new Date(b.deadline).getTime();
    });
  }, [items]);

    return {
    items: sortedItems,
    profile,
    transactions: periodTransactions, // Use filtered transactions
    budgets,
    categories,
    wallets,
    bills,
    debts,
    recurringTransactions,
    savingsTargets,
    notifications,
    bundles,
    summary,
    stats,
    loading,
    toggleStatus,
  };
};
