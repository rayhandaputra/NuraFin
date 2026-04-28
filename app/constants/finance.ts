import { BudgetCategory, BudgetType, BudgetStatus } from "../types/finance";

export const MONTHLY_INCOME = 15000000; // Default 15jt

export const DEFAULT_BUDGET_ITEMS = [
  {
    id: "1",
    name: "Sewa Kost",
    notes: "Bayar di awal bulan",
    deadline: "2026-05-01",
    type: BudgetType.TAGIHAN,
    category: BudgetCategory.KEWAJIBAN,
    amount: 2500000,
    status: BudgetStatus.UNPAID,
  },
  {
    id: "2",
    name: "Listrik & Air",
    notes: "",
    deadline: "2026-05-10",
    type: BudgetType.TAGIHAN,
    category: BudgetCategory.TAGIHAN,
    amount: 500000,
    status: BudgetStatus.UNPAID,
  },
  {
    id: "3",
    name: "Transport Kantor",
    notes: "Bensin + Parkir",
    deadline: "2026-05-30",
    type: BudgetType.ANGGARAN,
    category: BudgetCategory.TRANSPORTASI,
    amount: 1200000,
    status: BudgetStatus.UNPAID,
  },
  {
    id: "4",
    name: "Emergency Fund",
    notes: "Target 6 bulan pengeluaran",
    deadline: "2026-05-25",
    type: BudgetType.ANGGARAN,
    category: BudgetCategory.TABUNGAN,
    amount: 2000000,
    status: BudgetStatus.PAID,
  },
];
