import { BudgetItem, FinancialSummary, BudgetType } from "../types/finance";
import { MONTHLY_INCOME } from "../constants/finance";

export const calculateFinancialSummary = (items: BudgetItem[]): FinancialSummary => {
  const totalExpenses = items.reduce((sum, item) => sum + item.amount, 0);
  const nafas = MONTHLY_INCOME - totalExpenses;
  
  // Fixed Expense Ratio: (Total Tagihan + Tabungan/Cicilan) / Income
  const fixedExpenses = items
    .filter(item => item.type === BudgetType.TAGIHAN)
    .reduce((sum, item) => sum + item.amount, 0);
  
  const billRatio = fixedExpenses / MONTHLY_INCOME;
  
  // Runway: How many months Nafas can cover if emergency occurs (Total Savings / Total Expenses)
  // Simplified for this dashboard: MonthlyIncome / TotalExpenses (as a ratio of sustainability)
  // Real Runway usually depends on cash at hand, but here we'll use a health relative ratio
  const runwayMonths = totalExpenses > 0 ? nafas / totalExpenses : 12;
  
  // Budget Health Score (0-100)
  // Factors: Nafas positive, Bill Ratio < 50%, runway sustainability
  let score = 100;
  if (nafas < 0) score -= 50;
  if (billRatio > 0.5) score -= 20;
  if (billRatio > 0.7) score -= 20;
  
  return {
    monthlyIncome: MONTHLY_INCOME,
    totalExpenses,
    nafas,
    runwayMonths: Number(runwayMonths.toFixed(1)),
    billRatio: Number((billRatio * 100).toFixed(1)),
    budgetHealthScore: Math.max(0, score),
  };
};

export const getDebtSimulation = (
  currentNafas: number,
  newDebtAmount: number,
  tenureMonths: number
) => {
  const monthlyInstallment = newDebtAmount / tenureMonths;
  const newNafas = currentNafas - monthlyInstallment;
  const isOvercapacity = newNafas < 0;
  
  return {
    monthlyInstallment,
    newNafas,
    isOvercapacity,
  };
};
