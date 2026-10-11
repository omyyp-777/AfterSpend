import test from "node:test";
import assert from "node:assert/strict";
import { calculateMetrics, formatINR, generate30DayForecast, INITIAL_DEMO_STATE } from "./financeCalculations";
import { FinanceState, PurchaseScenario } from "../types/finance";

const makeState = (overrides: Partial<FinanceState> = {}): FinanceState => ({
  ...INITIAL_DEMO_STATE,
  transactions: [],
  savingsGoals: [],
  commitments: [],
  ...overrides
});
const scenario = (overrides: Partial<PurchaseScenario> = {}): PurchaseScenario => ({
  name: "Test purchase",
  amount: 2_000,
  category: "Shopping",
  proposedDay: 1,
  priority: "discretionary",
  selectedOption: "now",
  postponeDay: 15,
  ...overrides
});

test("initial demo state starts with the required ₹10,000 and 30 days", () => {
  assert.equal(INITIAL_DEMO_STATE.startingBudget, 10_000);
  assert.equal(INITIAL_DEMO_STATE.planningDays, 30);
  assert.equal(generate30DayForecast(INITIAL_DEMO_STATE).length, 30);
});

test("metrics deduct only confirmed transactions through the current day", () => {
  const state = makeState({
    currentDay: 3,
    transactions: [
      { id: "past", name: "Past", amount: 100, category: "Food", day: 2, status: "confirmed" },
      { id: "future", name: "Future", amount: 300, category: "Food", day: 8, status: "confirmed" },
      { id: "planned", name: "Planned", amount: 400, category: "Food", day: 4, status: "planned" }
    ]
  });
  assert.equal(calculateMetrics(state).projectedBalance, 9_900);
  const forecast = generate30DayForecast(state);
  assert.equal(forecast[2]?.projectedBalance, 9_900);
  assert.equal(forecast[3]?.projectedBalance, 9_500);
});

test("buy now reduces current balance and safe-to-spend exactly once", () => {
  const state = makeState({ startingBudget: 10_000 });
  const metrics = calculateMetrics(state, scenario());
  assert.equal(metrics.projectedBalance, 8_000);
  assert.equal(metrics.uncommittedFunds, 8_000);
  assert.equal(generate30DayForecast(state, scenario())[0]?.scenarioBalance, 8_000);
});

test("postponing preserves current balance but reserves the purchase and forecasts it later", () => {
  const state = makeState({ startingBudget: 10_000, currentDay: 1 });
  const postponed = scenario({ selectedOption: "postpone", postponeDay: 15 });
  const metrics = calculateMetrics(state, postponed);
  const forecast = generate30DayForecast(state, postponed);
  assert.equal(metrics.projectedBalance, 10_000);
  assert.equal(metrics.uncommittedFunds, 8_000);
  assert.equal(forecast[0]?.scenarioBalance, 10_000);
  assert.equal(forecast[14]?.scenarioBalance, 8_000);
});

test("skipping a purchase has no impact on balance or safe-to-spend", () => {
  const state = makeState({ startingBudget: 10_000 });
  const metrics = calculateMetrics(state, scenario({ selectedOption: "skip" }));
  assert.equal(metrics.projectedBalance, 10_000);
  assert.equal(metrics.uncommittedFunds, 10_000);
});

test("planned expenses appear in the forecast without reducing today's balance", () => {
  const state = makeState({
    currentDay: 1,
    transactions: [{ id: "plan", name: "Planned", amount: 500, category: "Other", day: 5, status: "planned" }]
  });
  assert.equal(calculateMetrics(state).projectedBalance, 10_000);
  assert.equal(calculateMetrics(state).uncommittedFunds, 9_500);
  const forecast = generate30DayForecast(state);
  assert.equal(forecast[3]?.projectedBalance, 10_000);
  assert.equal(forecast[4]?.projectedBalance, 9_500);
});

test("unpaid overdue commitments are moved to today in the forecast", () => {
  const state = makeState({
    startingBudget: 100,
    currentDay: 4,
    commitments: [{ id: "bill", name: "Overdue bill", amount: 250, dueDay: 2, category: "Utilities", status: "upcoming", recurring: false }]
  });
  const forecast = generate30DayForecast(state);
  assert.equal(forecast[2]?.projectedBalance, 100);
  assert.equal(forecast[3]?.projectedBalance, -150);
  assert.equal(forecast[3]?.commitmentsDue.length, 1);
});

test("negative forecast balances remain visible", () => {
  const state = makeState({
    startingBudget: 100,
    commitments: [{ id: "bill", name: "Bill", amount: 500, dueDay: 2, category: "Utilities", status: "upcoming", recurring: false }]
  });
  assert.equal(generate30DayForecast(state)[1]?.projectedBalance, -400);
});

test("matching planned scenario is not deducted twice", () => {
  const planned = scenario({ selectedOption: "postpone", postponeDay: 15 });
  const state = makeState({
    transactions: [{ id: "plan", name: "[Planned] Test purchase", amount: 2_000, category: "Shopping", day: 15, status: "planned" }]
  });
  assert.equal(generate30DayForecast(state, planned)[14]?.scenarioBalance, 8_000);
  assert.equal(calculateMetrics(state, planned).projectedBalance, 10_000);
  assert.equal(calculateMetrics(state, planned).uncommittedFunds, 8_000);
});

test("currency formatting safely handles non-finite values and negative balances", () => {
  assert.equal(formatINR(Number.NaN), "₹0");
  assert.equal(formatINR(Number.POSITIVE_INFINITY), "₹0");
  assert.equal(formatINR(-1500), "-₹1,500");
});
