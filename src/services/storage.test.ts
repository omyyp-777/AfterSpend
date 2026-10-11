import test from "node:test";
import assert from "node:assert/strict";
import { INITIAL_DEMO_STATE } from "./financeCalculations";
import { isFinanceState, parseStoredFinanceState } from "./storage";
import { FinanceState } from "../types/finance";

const cloneState = (): FinanceState => JSON.parse(JSON.stringify(INITIAL_DEMO_STATE)) as FinanceState;

test("accepts the valid demo finance state", () => {
  assert.equal(isFinanceState(cloneState()), true);
});

test("rejects NaN, infinity, negative and excessively large financial amounts", () => {
  for (const invalidAmount of [Number.NaN, Number.POSITIVE_INFINITY, -1, 10_000_001]) {
    const state = cloneState();
    state.startingBudget = invalidAmount;
    assert.equal(isFinanceState(state), false);
  }
});

test("rejects malformed day ranges and invalid statuses", () => {
  const invalidDay = cloneState();
  invalidDay.transactions.push({ id: "bad", name: "Bad day", amount: 10, category: "Food", day: 31, status: "confirmed" });
  assert.equal(isFinanceState(invalidDay), false);

  const invalidStatus = cloneState();
  invalidStatus.commitments[0]!.status = "unknown" as FinanceState["commitments"][number]["status"];
  assert.equal(isFinanceState(invalidStatus), false);
});

test("rejects savings allocations above their target", () => {
  const state = cloneState();
  state.savingsGoals[0]!.allocatedAmount = state.savingsGoals[0]!.targetAmount + 1;
  assert.equal(isFinanceState(state), false);
});

test("rejects control characters and overly long names in stored records", () => {
  const state = cloneState();
  state.transactions.push({ id: "bad", name: "Unsafe\u0000name", amount: 10, category: "Food", day: 1, status: "confirmed" });
  assert.equal(isFinanceState(state), false);

  const tooLong = cloneState();
  tooLong.transactions.push({ id: "bad", name: "x".repeat(161), amount: 10, category: "Food", day: 1, status: "confirmed" });
  assert.equal(isFinanceState(tooLong), false);
});

test("rejects duplicate record IDs", () => {
  const state = cloneState();
  state.transactions.push({ id: state.commitments[0]!.id, name: "Duplicate ID", amount: 10, category: "Food", day: 1, status: "confirmed" });
  assert.equal(isFinanceState(state), false);
});


test("corrupted JSON recovers to the canonical demo state", () => {
  const recovered = parseStoredFinanceState("{not-json");
  assert.equal(isFinanceState(recovered), true);
  assert.equal(recovered.startingBudget, INITIAL_DEMO_STATE.startingBudget);
});

test("schema-invalid stored data recovers to the canonical demo state", () => {
  const invalid = cloneState();
  invalid.startingBudget = Number.POSITIVE_INFINITY;
  const recovered = parseStoredFinanceState(JSON.stringify(invalid));
  assert.equal(isFinanceState(recovered), true);
  assert.equal(recovered.startingBudget, INITIAL_DEMO_STATE.startingBudget);
});

test("missing stored data returns an independent default state", () => {
  const first = parseStoredFinanceState(null);
  first.transactions.pop();
  const second = parseStoredFinanceState(null);
  assert.equal(second.transactions.length, INITIAL_DEMO_STATE.transactions.length);
});
