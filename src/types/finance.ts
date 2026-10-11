/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type TransactionStatus = "confirmed" | "planned";
export type CommitmentStatus = "upcoming" | "paid" | "cancelled";
export type ScenarioOption = "now" | "postpone" | "skip";
export type HealthStatusLabel = "Strong" | "Stable" | "Needs Attention" | "High Risk";

export interface Transaction {
  id: string;
  name: string;
  amount: number;
  category: string;
  day: number; // 1 to 30
  status: TransactionStatus;
}

export interface SavingsGoal {
  id: string;
  name: string;
  targetAmount: number;
  allocatedAmount: number;
  targetDay?: number;
  category: string;
}

export interface Commitment {
  id: string;
  name: string;
  amount: number;
  dueDay: number; // 1 to 30
  category: string;
  status: CommitmentStatus;
  recurring: boolean;
}

export interface FinanceState {
  startingBudget: number;
  confirmedIncome: number;
  transactions: Transaction[];
  savingsGoals: SavingsGoal[];
  commitments: Commitment[];
  currentDay: number;
  planningDays: number;
}

export interface PurchaseScenario {
  name: string;
  amount: number;
  category: string;
  proposedDay: number;
  priority: "essential" | "discretionary" | "luxury";
  selectedOption: ScenarioOption;
  postponeDay: number;
}

export interface CalculatedMetrics {
  projectedBalance: number;
  remainingCommitments: number;
  plannedExpenses: number;
  reservedSavings: number;
  uncommittedFunds: number; // Safe-to-spend
  dailyDiscretionaryAllowance: number;
  savingsProgressPercent: number;
  totalSavingsTarget: number;
  healthScore: number;
  healthStatus: HealthStatusLabel;
  healthBreakdown: {
    commitmentCoverage: number;
    emergencyResilience: number;
    savingsProgress: number;
    budgetSustainability: number;
  };
  explanations: {
    positive: string[];
    risks: string[];
  };
}

export interface DayForecast {
  day: number;
  projectedBalance: number;
  scenarioBalance?: number;
  commitmentsDue: Commitment[];
  transactionsOnDay: Transaction[];
  isPast: boolean;
  isToday: boolean;
}
