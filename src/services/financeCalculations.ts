/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  FinanceState,
  PurchaseScenario,
  CalculatedMetrics,
  DayForecast,
  HealthStatusLabel
} from "../types/finance";

export const INITIAL_DEMO_STATE: FinanceState = {
  startingBudget: 10000,
  confirmedIncome: 0,
  transactions: [],
  savingsGoals: [
    {
      id: "goal-1",
      name: "Emergency Reserve / Gadget Fund",
      targetAmount: 2000,
      allocatedAmount: 2000,
      targetDay: 30,
      category: "Savings"
    }
  ],
  commitments: [
    {
      id: "comm-1",
      name: "Mobile Recharge",
      amount: 299,
      dueDay: 8,
      category: "Utilities",
      status: "upcoming",
      recurring: true
    },
    {
      id: "comm-2",
      name: "Streaming Subscription",
      amount: 199,
      dueDay: 14,
      category: "Entertainment",
      status: "upcoming",
      recurring: true
    },
    {
      id: "comm-3",
      name: "Transport Pass",
      amount: 500,
      dueDay: 21,
      category: "Transport",
      status: "upcoming",
      recurring: true
    },
    {
      id: "comm-4",
      name: "Academic Essentials & Print",
      amount: 502,
      dueDay: 27,
      category: "Education",
      status: "upcoming",
      recurring: false
    }
  ],
  currentDay: 1,
  planningDays: 30
};

export function formatINR(val: number, showDecimals = false): string {
  if (isNaN(val)) return "₹0";
  const absVal = Math.abs(val);
  const formatted = showDecimals
    ? absVal.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    : absVal.toLocaleString("en-IN", { maximumFractionDigits: 0 });
  return val < 0 ? `-₹${formatted}` : `₹${formatted}`;
}

export function calculateMetrics(
  state: FinanceState,
  scenario?: PurchaseScenario
): CalculatedMetrics {
  // 1. Confirmed expenses (confirmed transactions only)
  const confirmedExpenses = state.transactions
    .filter((t) => t.status === "confirmed")
    .reduce((sum, t) => sum + t.amount, 0);

  // 2. Projected balance: Starting budget + confirmed additional income - confirmed expenses
  let projectedBalance = state.startingBudget + state.confirmedIncome - confirmedExpenses;

  // 3. Remaining commitments: Unpaid commitments within planning period
  const remainingCommitments = state.commitments
    .filter((c) => c.status === "upcoming")
    .reduce((sum, c) => sum + c.amount, 0);

  // 4. Reserved savings: Sum of active allocated amounts
  const reservedSavings = state.savingsGoals.reduce((sum, g) => sum + g.allocatedAmount, 0);
  const totalSavingsTarget = state.savingsGoals.reduce((sum, g) => sum + g.targetAmount, 0);

  // 5. Uncommitted funds: Projected balance - remaining commitments - reserved savings
  let uncommittedFunds = projectedBalance - remainingCommitments - reservedSavings;

  // Apply hypothetical scenario if present
  let scenarioDeduction = 0;
  if (scenario && scenario.amount > 0) {
    if (scenario.selectedOption === "now" || scenario.selectedOption === "postpone") {
      scenarioDeduction = scenario.amount;
      projectedBalance -= scenarioDeduction;
      uncommittedFunds -= scenarioDeduction;
    }
    // "skip" option preserves funds (scenarioDeduction = 0)
  }

  // 6. Remaining planning days
  const remainingDays = Math.max(1, state.planningDays - state.currentDay + 1);

  // 7. Daily discretionary allowance: Safe uncommitted funds / remaining days
  const dailyDiscretionaryAllowance = Math.max(0, uncommittedFunds / remainingDays);

  // 8. Savings progress percentage
  const savingsProgressPercent =
    totalSavingsTarget > 0
      ? Math.min(100, Math.round((reservedSavings / totalSavingsTarget) * 100))
      : 100;

  // 9. Financial health scoring (Section 10.9)
  // Dimension 1: Essential commitment coverage (30%)
  // Can available balance cover unpaid commitments?
  const availableForCommitments = projectedBalance - (scenario?.selectedOption === "now" ? scenario.amount : 0);
  let commitmentCoverageScore = 100;
  if (remainingCommitments > 0) {
    const coverageRatio = availableForCommitments / remainingCommitments;
    commitmentCoverageScore = Math.min(100, Math.max(0, Math.round(coverageRatio * 100)));
  }

  // Dimension 2: Emergency resilience (25%)
  // Does uncommitted fund stay above emergency benchmark (₹1,500)?
  const emergencyTarget = 1500;
  let emergencyResilienceScore = 0;
  if (uncommittedFunds > 0) {
    emergencyResilienceScore = Math.min(100, Math.round((uncommittedFunds / emergencyTarget) * 100));
  }

  // Dimension 3: Savings goal progress (20%)
  const savingsProgressScore = savingsProgressPercent;

  // Dimension 4: Budget sustainability (25%)
  // Daily allowance compared to baseline healthy daily allowance (₹200/day)
  let budgetSustainabilityScore = 0;
  const targetDaily = 200;
  if (dailyDiscretionaryAllowance > 0) {
    budgetSustainabilityScore = Math.min(
      100,
      Math.round((dailyDiscretionaryAllowance / targetDaily) * 100)
    );
  }

  // Weighted overall health score (0 to 100)
  const healthScore = Math.round(
    0.3 * commitmentCoverageScore +
      0.25 * emergencyResilienceScore +
      0.2 * savingsProgressScore +
      0.25 * budgetSustainabilityScore
  );

  let healthStatus: HealthStatusLabel = "High Risk";
  if (healthScore >= 80) healthStatus = "Strong";
  else if (healthScore >= 60) healthStatus = "Stable";
  else if (healthScore >= 40) healthStatus = "Needs Attention";

  // Explanations & Factor attribution (Section 8.7 & 8.8)
  const positive: string[] = [];
  const risks: string[] = [];

  if (commitmentCoverageScore >= 100) {
    positive.push("All upcoming essential commitments (₹" + remainingCommitments + ") are fully covered.");
  } else {
    risks.push(
      "Upcoming commitments exceed available funds by ₹" +
        Math.abs(availableForCommitments - remainingCommitments) +
        "."
    );
  }

  if (reservedSavings >= totalSavingsTarget && totalSavingsTarget > 0) {
    positive.push("100% of your ₹" + totalSavingsTarget + " savings goal is safely protected.");
  } else if (reservedSavings > 0) {
    positive.push("₹" + reservedSavings + " is actively reserved in your savings fund.");
  } else {
    risks.push("No funds are currently allocated to protected savings.");
  }

  if (uncommittedFunds < 0) {
    risks.push(
      "Funding shortfall of ₹" +
        Math.abs(uncommittedFunds) +
        "! This scenario consumes protected reserves."
    );
  } else if (uncommittedFunds < 1000) {
    risks.push("Limited emergency buffer (₹" + uncommittedFunds + ") leaves you vulnerable to surprise costs.");
  } else {
    positive.push("Solid discretionary runway of ₹" + uncommittedFunds + " available for flexible spending.");
  }

  if (scenario && scenario.amount > 0) {
    if (scenario.selectedOption === "skip") {
      positive.push(
        "Skipping '" +
          scenario.name +
          "' preserves ₹" +
          scenario.amount +
          ", boosting your discretionary safety cushion."
      );
    } else if (scenario.selectedOption === "postpone") {
      positive.push(
        "Postponing '" +
          scenario.name +
          "' to Day " +
          scenario.postponeDay +
          " ensures funds remain liquid before earlier commitments."
      );
    } else {
      if (uncommittedFunds < 0) {
        risks.push("Purchasing '" + scenario.name + "' now causes a negative safe-to-spend balance.");
      } else {
        positive.push("'" + scenario.name + "' can be accommodated without breaking commitments.");
      }
    }
  }

  return {
    projectedBalance,
    remainingCommitments,
    reservedSavings,
    uncommittedFunds,
    dailyDiscretionaryAllowance,
    savingsProgressPercent,
    totalSavingsTarget,
    healthScore,
    healthStatus,
    healthBreakdown: {
      commitmentCoverage: commitmentCoverageScore,
      emergencyResilience: emergencyResilienceScore,
      savingsProgress: savingsProgressScore,
      budgetSustainability: budgetSustainabilityScore
    },
    explanations: { positive, risks }
  };
}

export function generate30DayForecast(
  state: FinanceState,
  scenario?: PurchaseScenario
): DayForecast[] {
  const days: DayForecast[] = [];
  let runningBaseBalance = state.startingBudget + state.confirmedIncome;
  let runningScenarioBalance = state.startingBudget + state.confirmedIncome;

  for (let d = 1; d <= state.planningDays; d++) {
    // 1. Confirmed transactions on this day
    const dayTransactions = state.transactions.filter(
      (t) => t.day === d && t.status === "confirmed"
    );
    const dayExpenses = dayTransactions.reduce((sum, t) => sum + t.amount, 0);

    // 2. Commitments due on this day (if unpaid, deduct when due date arrives)
    const dayCommitments = state.commitments.filter(
      (c) => c.dueDay === d && c.status === "upcoming"
    );
    const dayCommitmentsAmount = dayCommitments.reduce((sum, c) => sum + c.amount, 0);

    runningBaseBalance -= dayExpenses + dayCommitmentsAmount;
    runningScenarioBalance -= dayExpenses + dayCommitmentsAmount;

    // 3. Apply scenario impact if configured
    if (scenario && scenario.amount > 0) {
      if (scenario.selectedOption === "now" && d === scenario.proposedDay) {
        runningScenarioBalance -= scenario.amount;
      } else if (scenario.selectedOption === "postpone" && d === scenario.postponeDay) {
        runningScenarioBalance -= scenario.amount;
      }
    }

    days.push({
      day: d,
      projectedBalance: Math.max(0, runningBaseBalance),
      scenarioBalance: scenario ? Math.max(0, runningScenarioBalance) : undefined,
      commitmentsDue: dayCommitments,
      transactionsOnDay: dayTransactions,
      isPast: d < state.currentDay,
      isToday: d === state.currentDay
    });
  }

  return days;
}

export function generateInsights(
  state: FinanceState,
  metrics: CalculatedMetrics,
  scenario?: PurchaseScenario
): string[] {
  const insights: string[] = [];

  insights.push(
    `You have ${formatINR(metrics.uncommittedFunds)} available after your planned commitments (${formatINR(metrics.remainingCommitments)}) and savings reserve (${formatINR(metrics.reservedSavings)}).`
  );

  insights.push(
    `Your daily discretionary allowance is currently ${formatINR(metrics.dailyDiscretionaryAllowance, true)}/day over the remaining ${Math.max(1, state.planningDays - state.currentDay + 1)} days.`
  );

  if (scenario && scenario.amount > 0) {
    if (scenario.selectedOption === "skip") {
      insights.push(
        `Avoiding this purchase preserves ${formatINR(scenario.amount)}, keeping your emergency flexibility at peak level.`
      );
    } else {
      const dropInDaily = scenario.amount / Math.max(1, state.planningDays - state.currentDay + 1);
      insights.push(
        `This purchase reduces your remaining daily allowance by ${formatINR(dropInDaily, true)} per day.`
      );
    }
  }

  const nextCommitment = state.commitments
    .filter((c) => c.status === "upcoming" && c.dueDay >= state.currentDay)
    .sort((a, b) => a.dueDay - b.dueDay)[0];

  if (nextCommitment) {
    insights.push(
      `Next upcoming commitment is ${nextCommitment.name} (${formatINR(nextCommitment.amount)}) due on Day ${nextCommitment.dueDay}.`
    );
  }

  return insights;
}
