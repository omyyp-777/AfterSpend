/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { FinanceState, Transaction, Commitment, SavingsGoal } from "../types/finance";
import { INITIAL_DEMO_STATE } from "./financeCalculations";

const STORAGE_KEY = "afterspend_finance_state_v1";
const MAX_FINANCIAL_AMOUNT = 10_000_000;
const MAX_TRANSACTIONS = 2000;
const MAX_COMMITMENTS = 500;
const MAX_SAVINGS_GOALS = 500;
const cloneInitialState = (): FinanceState => JSON.parse(JSON.stringify(INITIAL_DEMO_STATE)) as FinanceState;
const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);
const finiteNumber = (value: unknown, min = 0, max = MAX_FINANCIAL_AMOUNT): value is number =>
  typeof value === "number" && Number.isFinite(value) && value >= min && value <= max;
const safeText = (value: unknown, maxLength = 120): value is string =>
  typeof value === "string" && value.trim().length > 0 && value.length <= maxLength &&
  // eslint-disable-next-line no-control-regex -- reject ASCII control characters in stored user text
  !/[\u0000-\u001F\u007F]/.test(value);

export function isValidTransaction(value: unknown, planningDays: number): value is Transaction {
  if (!isRecord(value)) return false;
  return safeText(value.id, 160) && safeText(value.name, 160) && finiteNumber(value.amount, 0.01) &&
    safeText(value.category, 80) && finiteNumber(value.day, 1, planningDays) && Number.isInteger(value.day) &&
    (value.status === "confirmed" || value.status === "planned");
}

export function isValidCommitment(value: unknown, planningDays: number): value is Commitment {
  if (!isRecord(value)) return false;
  return safeText(value.id, 160) && safeText(value.name) && finiteNumber(value.amount, 0.01) &&
    finiteNumber(value.dueDay, 1, planningDays) && Number.isInteger(value.dueDay) &&
    safeText(value.category, 80) && ["upcoming", "paid", "cancelled"].includes(String(value.status)) &&
    typeof value.recurring === "boolean";
}

export function isValidSavingsGoal(value: unknown, planningDays: number): value is SavingsGoal {
  if (!isRecord(value)) return false;
  return safeText(value.id, 160) && safeText(value.name) && finiteNumber(value.targetAmount, 0.01) &&
    finiteNumber(value.allocatedAmount) && value.allocatedAmount <= value.targetAmount &&
    (value.targetDay === undefined || (finiteNumber(value.targetDay, 1, planningDays) && Number.isInteger(value.targetDay))) &&
    safeText(value.category, 80);
}

export function isFinanceState(value: unknown): value is FinanceState {
  if (!isRecord(value) || !finiteNumber(value.planningDays, 1, 365) || !Number.isInteger(value.planningDays) ||
      !finiteNumber(value.currentDay, 1, value.planningDays) || !Number.isInteger(value.currentDay)) return false;
  if (!finiteNumber(value.startingBudget) || !finiteNumber(value.confirmedIncome)) return false;
  if (!Array.isArray(value.transactions) || !Array.isArray(value.commitments) || !Array.isArray(value.savingsGoals)) return false;
  if (value.transactions.length > MAX_TRANSACTIONS || value.commitments.length > MAX_COMMITMENTS ||
      value.savingsGoals.length > MAX_SAVINGS_GOALS) return false;
  if (!value.transactions.every((item) => isValidTransaction(item, value.planningDays as number)) ||
      !value.commitments.every((item) => isValidCommitment(item, value.planningDays as number)) ||
      !value.savingsGoals.every((item) => isValidSavingsGoal(item, value.planningDays as number))) return false;
  const allIds = [
    ...value.transactions.map((item) => item.id),
    ...value.commitments.map((item) => item.id),
    ...value.savingsGoals.map((item) => item.id)
  ];
  return new Set(allIds).size === allIds.length;
}

export function parseStoredFinanceState(raw: string | null): FinanceState {
  if (!raw) return cloneInitialState();
  try {
    const parsed: unknown = JSON.parse(raw);
    return isFinanceState(parsed) ? parsed : cloneInitialState();
  } catch {
    return cloneInitialState();
  }
}

export function loadFinanceState(): FinanceState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const state = parseStoredFinanceState(raw);
    // Remove corrupt or schema-invalid saved data instead of repeatedly parsing it.
    if (raw) {
      let valid = false;
      try { valid = isFinanceState(JSON.parse(raw)); } catch { valid = false; }
      if (!valid) localStorage.removeItem(STORAGE_KEY);
    }
    return state;
  } catch (error) {
    console.warn("Unable to load saved finance data; using demo data.", error);
    try { localStorage.removeItem(STORAGE_KEY); } catch { /* Storage may be unavailable. */ }
    return cloneInitialState();
  }
}

export function saveFinanceState(state: FinanceState): void {
  try {
    if (!isFinanceState(state)) {
      console.warn("Skipped saving invalid finance state.");
      return;
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (error) {
    console.warn("Unable to save finance data in this browser.", error);
  }
}

export function resetFinanceState(): FinanceState {
  try { localStorage.removeItem(STORAGE_KEY); } catch (error) {
    console.warn("Unable to clear saved finance data.", error);
  }
  return cloneInitialState();
}

export function exportFinanceStateJSON(state: FinanceState): void {
  if (!isFinanceState(state)) {
    console.warn("Skipped exporting invalid finance state.");
    return;
  }
  const blob = new Blob([JSON.stringify(state, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const downloadAnchor = document.createElement("a");
  downloadAnchor.href = url;
  downloadAnchor.download = `afterspend_backup_day${state.currentDay}.json`;
  downloadAnchor.hidden = true;
  document.body.appendChild(downloadAnchor);
  downloadAnchor.click();
  downloadAnchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}
