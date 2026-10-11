/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { FinanceState, PurchaseScenario, CalculatedMetrics, DayForecast, HealthStatusLabel } from "../types/finance";

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
  if (!Number.isFinite(val)) return "₹0";
  const absVal = Math.abs(val);
  const formatted = absVal.toLocaleString("en-IN", showDecimals
    ? { minimumFractionDigits: 2, maximumFractionDigits: 2 }
    : { maximumFractionDigits: 0 });
  return val < 0 ? `-₹${formatted}` : `₹${formatted}`;
}

const MAX_SCENARIO_AMOUNT = 10_000_000;

function isUsableScenario(scenario?: PurchaseScenario): scenario is PurchaseScenario {
  return Boolean(
    scenario &&
    typeof scenario.name === "string" && scenario.name.trim().length > 0 &&
    Number.isFinite(scenario.amount) && scenario.amount > 0 && scenario.amount <= MAX_SCENARIO_AMOUNT &&
    Number.isInteger(scenario.proposedDay) && scenario.proposedDay >= 1 && scenario.proposedDay <= 365 &&
    Number.isInteger(scenario.postponeDay) && scenario.postponeDay >= 1 && scenario.postponeDay <= 365 &&
    ["now", "postpone", "skip"].includes(scenario.selectedOption)
  );
}

export function calculateMetrics(
  state: FinanceState,
  scenario?: PurchaseScenario
): CalculatedMetrics {
  // Metrics describe the user's position as of the current day. Planned expenses
  // and confirmed expenses dated in the future belong in the forecast, not today's cash.
  const confirmedExpensesToDate = state.transactions
    .filter((transaction) => transaction.status === "confirmed" && transaction.day <= state.currentDay)
    .reduce((sum, transaction) => sum + transaction.amount, 0);
  const balanceBeforeScenario = state.startingBudget + state.confirmedIncome - confirmedExpensesToDate;
  let projectedBalance = balanceBeforeScenario;

  const remainingCommitments = state.commitments
    .filter((commitment) => commitment.status === "upcoming" && commitment.dueDay <= state.planningDays)
    .reduce((sum, commitment) => sum + commitment.amount, 0);
  const plannedExpenses = state.transactions
    .filter((transaction) => transaction.status === "planned" && transaction.day >= state.currentDay)
    .reduce((sum, transaction) => sum + transaction.amount, 0);
  const reservedSavings = state.savingsGoals.reduce((sum, goal) => sum + goal.allocatedAmount, 0);
  const totalSavingsTarget = state.savingsGoals.reduce((sum, goal) => sum + goal.targetAmount, 0);

  const usableScenario = isUsableScenario(scenario) ? scenario : undefined;
  const scenarioDay = usableScenario
    ? usableScenario.selectedOption === "now"
      ? state.currentDay
      : usableScenario.selectedOption === "postpone"
        ? Math.max(state.currentDay, usableScenario.postponeDay)
        : -1
    : -1;
  const scenarioAlreadyPlanned = Boolean(usableScenario && state.transactions.some((transaction) =>
    transaction.status === "planned" &&
    transaction.name === `[Planned] ${usableScenario.name.trim()}` &&
    transaction.amount === usableScenario.amount &&
    transaction.day === scenarioDay
  ));
  const scenarioActive = Boolean(
    usableScenario && usableScenario.selectedOption !== "skip" && !scenarioAlreadyPlanned
  );
  // A planned purchase reserves funds but is not yet a cash outflow. A hypothetical
  // purchase already present as a planned transaction must not be counted twice.
  if (scenarioActive && usableScenario?.selectedOption === "now") projectedBalance -= usableScenario.amount;

  let uncommittedFunds = balanceBeforeScenario - remainingCommitments - reservedSavings - plannedExpenses;
  if (scenarioActive && usableScenario) uncommittedFunds -= usableScenario.amount;

  const remainingDays = Math.max(1, state.planningDays - state.currentDay + 1);
  const dailyDiscretionaryAllowance = Math.max(0, uncommittedFunds / remainingDays);
  const savingsProgressPercent = totalSavingsTarget > 0
    ? Math.min(100, Math.round((reservedSavings / totalSavingsTarget) * 100))
    : 100;

  const commitmentCoverageScore = remainingCommitments > 0
    ? Math.min(100, Math.max(0, Math.round((projectedBalance / remainingCommitments) * 100)))
    : 100;
  const emergencyResilienceScore = uncommittedFunds > 0
    ? Math.min(100, Math.round((uncommittedFunds / 1500) * 100))
    : 0;
  const budgetSustainabilityScore = dailyDiscretionaryAllowance > 0
    ? Math.min(100, Math.round((dailyDiscretionaryAllowance / 200) * 100))
    : 0;
  const healthScore = Math.round(
    0.3 * commitmentCoverageScore +
    0.25 * emergencyResilienceScore +
    0.2 * savingsProgressPercent +
    0.25 * budgetSustainabilityScore
  );

  let healthStatus: HealthStatusLabel = "High Risk";
  if (healthScore >= 80) healthStatus = "Strong";
  else if (healthScore >= 60) healthStatus = "Stable";
  else if (healthScore >= 40) healthStatus = "Needs Attention";

  const positive: string[] = [];
  const risks: string[] = [];
  if (commitmentCoverageScore >= 100) {
    positive.push(`Your current balance covers all upcoming commitments (${formatINR(remainingCommitments)}).`);
  } else {
    risks.push(`Upcoming commitments exceed your current balance by ${formatINR(remainingCommitments - projectedBalance)}.`);
  }
  if (totalSavingsTarget > 0 && reservedSavings >= totalSavingsTarget) {
    positive.push(`Your savings allocation meets ${formatINR(totalSavingsTarget)} of savings goals.`);
  } else if (reservedSavings > 0) {
    positive.push(`${formatINR(reservedSavings)} is currently allocated to savings.`);
  } else {
    risks.push("No funds are currently allocated to protected savings.");
  }
  if (uncommittedFunds < 0) {
    risks.push(`Your plan has a funding shortfall of ${formatINR(Math.abs(uncommittedFunds))}.`);
  } else if (uncommittedFunds < 1000) {
    risks.push(`Your emergency buffer is limited to ${formatINR(uncommittedFunds)}.`);
  } else {
    positive.push(`${formatINR(uncommittedFunds)} remains after planned commitments and savings.`);
  }
  if (usableScenario) {
    if (usableScenario.selectedOption === "skip") {
      positive.push(`Skipping “${usableScenario.name.trim()}” avoids a ${formatINR(usableScenario.amount)} expense.`);
    } else if (usableScenario.selectedOption === "postpone") {
      positive.push(`Postponing “${usableScenario.name.trim()}” keeps the money in today's balance; the forecast models it on Day ${Math.max(state.currentDay, usableScenario.postponeDay)}.`);
    } else if (uncommittedFunds < 0) {
      risks.push(`Buying “${usableScenario.name.trim()}” now creates a safe-to-spend shortfall.`);
    } else {
      positive.push(`Buying “${usableScenario.name.trim()}” now leaves a non-negative safe-to-spend balance.`);
    }
  }

  return {
    projectedBalance,
    remainingCommitments,
    plannedExpenses,
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
      savingsProgress: savingsProgressPercent,
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
  const usableScenario = isUsableScenario(scenario) ? scenario : undefined;
  const scenarioDay = usableScenario
    ? usableScenario.selectedOption === "now"
      ? state.currentDay
      : usableScenario.selectedOption === "postpone"
        ? Math.max(state.currentDay, usableScenario.postponeDay)
        : -1
    : -1;
  const plannedScenarioAlreadyInState = Boolean(usableScenario && state.transactions.some((transaction) =>
    transaction.status === "planned" &&
    transaction.name === `[Planned] ${usableScenario.name.trim()}` &&
    transaction.amount === usableScenario.amount &&
    transaction.day === scenarioDay
  ));

  for (let day = 1; day <= state.planningDays; day += 1) {
    const dayTransactions = state.transactions.filter((transaction) =>
      transaction.day === day && (
        transaction.status === "confirmed" ||
        (transaction.status === "planned" && day >= state.currentDay)
      )
    );
    const dayExpenses = dayTransactions.reduce((sum, transaction) => sum + transaction.amount, 0);

    // Unpaid overdue commitments are shown as due today rather than being silently
    // deducted in the historical part of the forecast.
    const dayCommitments = state.commitments.filter((commitment) =>
      commitment.status === "upcoming" && Math.max(state.currentDay, commitment.dueDay) === day
    );
    const commitmentExpenses = dayCommitments.reduce((sum, commitment) => sum + commitment.amount, 0);
    runningBaseBalance -= dayExpenses + commitmentExpenses;
    runningScenarioBalance -= dayExpenses + commitmentExpenses;

    if (
      usableScenario &&
      !plannedScenarioAlreadyInState &&
      usableScenario.selectedOption !== "skip" &&
      day === scenarioDay
    ) {
      runningScenarioBalance -= usableScenario.amount;
    }

    days.push({
      day,
      // Keep negative values visible: they represent a real projected shortfall.
      projectedBalance: runningBaseBalance,
      scenarioBalance: usableScenario ? runningScenarioBalance : undefined,
      commitmentsDue: dayCommitments,
      transactionsOnDay: dayTransactions,
      isPast: day < state.currentDay,
      isToday: day === state.currentDay
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
    `You have ${formatINR(metrics.uncommittedFunds)} available after upcoming commitments (${formatINR(metrics.remainingCommitments)}), planned purchases (${formatINR(metrics.plannedExpenses)}), and savings reserves (${formatINR(metrics.reservedSavings)}).`
  );

  insights.push(
    `Your daily discretionary allowance is currently ${formatINR(metrics.dailyDiscretionaryAllowance, true)}/day over the remaining ${Math.max(1, state.planningDays - state.currentDay + 1)} days.`
  );

  if (isUsableScenario(scenario)) {
    if (scenario.selectedOption === "skip") {
      insights.push(`Skipping this purchase avoids a ${formatINR(scenario.amount)} expense.`);
    } else {
      const dropInDaily = scenario.amount / Math.max(1, state.planningDays - state.currentDay + 1);
      insights.push(`This decision reserves ${formatINR(scenario.amount)} and reduces safe-to-spend by about ${formatINR(dropInDaily, true)} per remaining day.`);
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
