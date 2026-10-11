/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { FinanceState } from "../types/finance";
import { INITIAL_DEMO_STATE } from "./financeCalculations";

const STORAGE_KEY = "afterspend_finance_state_v1";

export function loadFinanceState(): FinanceState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return INITIAL_DEMO_STATE;
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed.startingBudget === "number" && Array.isArray(parsed.commitments)) {
      return parsed;
    }
  } catch (e) {
    console.warn("Failed to parse stored finance state, using demo data", e);
  }
  return INITIAL_DEMO_STATE;
}

export function saveFinanceState(state: FinanceState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (e) {
    console.warn("Failed to save finance state to localStorage", e);
  }
}

export function resetFinanceState(): FinanceState {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (e) {
    console.warn("Failed to reset localStorage", e);
  }
  return JSON.parse(JSON.stringify(INITIAL_DEMO_STATE));
}

export function exportFinanceStateJSON(state: FinanceState): void {
  const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(state, null, 2));
  const downloadAnchor = document.createElement("a");
  downloadAnchor.setAttribute("href", dataStr);
  downloadAnchor.setAttribute("download", `afterspend_backup_day${state.currentDay}.json`);
  document.body.appendChild(downloadAnchor);
  downloadAnchor.click();
  downloadAnchor.remove();
}
