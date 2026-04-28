export enum BudgetCategory {
  TAGIHAN = "Tagihan",
  TRANSPORTASI = "Transportasi",
  TABUNGAN = "Tabungan",
  KEWAJIBAN = "Kewajiban",
  KESEHATAN = "Kesehatan",
}

export enum BudgetStatus {
  PAID = "Paid",
  UNPAID = "Unpaid",
}

export enum BudgetType {
  ANGGARAN = "Anggaran",
  TAGIHAN = "Tagihan",
}

export interface BudgetItem {
  id: string;
  name: string;
  notes?: string;
  deadline: string;
  type: BudgetType;
  category: BudgetCategory;
  amount: number;
  status: BudgetStatus;
}

export interface FinancialSummary {
  monthlyIncome: number;
  totalExpenses: number;
  nafas: number;
  runwayMonths: number;
  billRatio: number;
  budgetHealthScore: number;
}
