/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from "react";
import confetti from "canvas-confetti";
import { FinanceState, SavingsGoal, CalculatedMetrics } from "../../types/finance";
import { formatINR } from "../../services/financeCalculations";
import { PlusCircle, PiggyBank, Edit2, Trash2, CheckCircle2, Sparkles, PartyPopper } from "lucide-react";

interface SavingsScreenProps {
  state: FinanceState;
  metrics: CalculatedMetrics;
  onUpdateGoalAllocation: (goalId: string, newAllocated: number) => void;
  onAddGoal: (goal: Omit<SavingsGoal, "id">) => void;
  onDeleteGoal: (goalId: string) => void;
}

/**
 * Multi-cannon celebratory confetti effect using canvas-confetti
 */
export const triggerGoalConfetti = () => {
  const duration = 2.2 * 1000;
  const animationEnd = Date.now() + duration;
  const colors = ["#2563EB", "#10B981", "#F59E0B", "#6366F1", "#EC4899", "#06B6D4"];

  // 1. Initial burst from center-bottom
  confetti({
    particleCount: 90,
    spread: 70,
    origin: { y: 0.65 },
    colors,
    zIndex: 9999
  });

  // 2. Continuous celebratory cannons from both flanks
  const interval: ReturnType<typeof setInterval> = setInterval(() => {
    const timeLeft = animationEnd - Date.now();

    if (timeLeft <= 0) {
      clearInterval(interval);
      return;
    }

    const particleCount = 45 * (timeLeft / duration);

    // Left cannon
    confetti({
      particleCount,
      angle: 60,
      spread: 55,
      origin: { x: 0, y: 0.7 },
      colors,
      zIndex: 9999
    });

    // Right cannon
    confetti({
      particleCount,
      angle: 120,
      spread: 55,
      origin: { x: 1, y: 0.7 },
      colors,
      zIndex: 9999
    });
  }, 220);
};

export default function SavingsScreen({
  state,
  metrics,
  onUpdateGoalAllocation,
  onAddGoal,
  onDeleteGoal
}: SavingsScreenProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editAllocatedAmount, setEditAllocatedAmount] = useState<number>(0);

  // New goal form state
  const [name, setName] = useState("");
  const [targetAmount, setTargetAmount] = useState<number>(1000);
  const [allocatedAmount, setAllocatedAmount] = useState<number>(500);
  const category = "Emergency Reserve";

  // Track previous allocation ratios to fire confetti only on transitioning to 100%
  const prevAllocationsRef = useRef<Map<string, number>>(new Map());
  const isFirstRender = useRef(true);

  useEffect(() => {
    // On subsequent updates, detect if any goal crossed into 100% completion
    if (!isFirstRender.current) {
      let newlyCompleted = false;

      state.savingsGoals.forEach((goal) => {
        const prevAllocated = prevAllocationsRef.current.get(goal.id) ?? 0;
        const wasCompleted = prevAllocated >= goal.targetAmount;
        const isNowCompleted = goal.allocatedAmount >= goal.targetAmount;

        if (!wasCompleted && isNowCompleted) {
          newlyCompleted = true;
        }
      });

      if (newlyCompleted) {
        triggerGoalConfetti();
      }
    } else {
      isFirstRender.current = false;
    }

    // Update map for next comparison
    const newMap = new Map<string, number>();
    state.savingsGoals.forEach((g) => newMap.set(g.id, g.allocatedAmount));
    prevAllocationsRef.current = newMap;
  }, [state.savingsGoals]);

  const handleStartEdit = (goal: SavingsGoal) => {
    setEditingId(goal.id);
    setEditAllocatedAmount(goal.allocatedAmount);
  };

  const handleSaveEdit = (goalId: string, currentGoalTarget: number) => {
    const finalAllocated = Math.min(currentGoalTarget, Math.max(0, editAllocatedAmount));
    onUpdateGoalAllocation(goalId, finalAllocated);
    
    // Explicit celebratory check
    if (finalAllocated >= currentGoalTarget) {
      triggerGoalConfetti();
    }
    
    setEditingId(null);
  };

  const handleCreateGoal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || targetAmount <= 0) return;
    const finalAllocated = Math.min(targetAmount, allocatedAmount);
    
    onAddGoal({
      name,
      targetAmount,
      allocatedAmount: finalAllocated,
      targetDay: 30,
      category
    });

    if (finalAllocated >= targetAmount) {
      triggerGoalConfetti();
    }

    setName("");
    setTargetAmount(1000);
    setAllocatedAmount(500);
    setIsAdding(false);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-zinc-500 mb-1">
            <span>Ring-Fenced Assets</span>
            <span aria-hidden="true">·</span>
            <span>Zero Double-Counting</span>
            <span aria-hidden="true">·</span>
            <span>Protected Reserves</span>
          </div>
          <h2 className="text-2xl md:text-3xl font-extrabold text-zinc-950 tracking-tight font-montserrat">
            Protected Savings Goals
          </h2>
          <p className="mt-1 text-xs text-zinc-600 max-w-2xl leading-relaxed">
            Reserved savings are deliberately excluded from your safe-to-spend balance. Even if your
            account shows available funds, this money is locked to safeguard your long-term goals.
          </p>
        </div>

        <button
          onClick={() => setIsAdding(!isAdding)}
          className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-colors shrink-0 shadow-sm cursor-pointer"
        >
          <PlusCircle className="w-4 h-4" />
          {isAdding ? "Close Form" : "Create Goal"}
        </button>
      </div>

      {/* Aggregate Savings Banner */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-blue-50/80 via-white to-indigo-50/80 border border-blue-200/80 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div>
          <div className="text-xs text-blue-700 uppercase tracking-wider font-bold mb-1">
            Total Savings Protected
          </div>
          <div className="text-3xl font-extrabold font-mono text-zinc-950">
            {formatINR(metrics.reservedSavings)}{" "}
            <span className="text-sm font-normal text-zinc-500">
              / {formatINR(metrics.totalSavingsTarget)} Target
            </span>
          </div>
          <p className="text-xs text-zinc-600 mt-1">
            {metrics.savingsProgressPercent}% of total target is fully funded and protected from discretionary shopping.
          </p>
        </div>

        <div className="w-full md:w-64">
          <div className="flex justify-between text-xs font-mono text-zinc-600 mb-1.5 font-medium">
            <span>Funding Ratio</span>
            <span className="text-blue-700 font-bold">{metrics.savingsProgressPercent}%</span>
          </div>
          <div className="w-full h-2.5 bg-zinc-200/80 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full transition-all duration-500"
              style={{ width: `${metrics.savingsProgressPercent}%` }}
            />
          </div>
        </div>
      </div>

      {/* Add Goal Form (when opened) */}
      {isAdding && (
        <form
          onSubmit={handleCreateGoal}
          className="p-6 rounded-2xl bg-white border border-blue-200 shadow-md space-y-4 animate-in slide-in-from-top-4"
        >
          <h3 className="text-sm font-bold text-zinc-900 uppercase tracking-wider">
            Create New Savings Target
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-zinc-700 mb-1">Goal Name</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Festival Trip Fund"
                className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-50 border border-zinc-200 text-xs text-zinc-900 font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-700 mb-1">
                Target Amount (INR)
              </label>
              <input
                type="number"
                min="100"
                step="100"
                required
                value={targetAmount}
                onChange={(e) => setTargetAmount(parseFloat(e.target.value) || 0)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-50 border border-zinc-200 text-xs font-mono font-bold text-blue-600 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-700 mb-1">
                Initial Allocation (INR)
              </label>
              <input
                type="number"
                min="0"
                step="50"
                value={allocatedAmount}
                onChange={(e) => setAllocatedAmount(parseFloat(e.target.value) || 0)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-50 border border-zinc-200 text-xs font-mono font-bold text-zinc-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setIsAdding(false)}
              className="px-3.5 py-2 text-xs font-semibold text-zinc-600 hover:text-zinc-900 bg-zinc-100 hover:bg-zinc-200 rounded-xl cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs cursor-pointer"
            >
              Save Goal
            </button>
          </div>
        </form>
      )}

      {/* Savings Goals Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {state.savingsGoals.map((goal) => {
          const percent = Math.min(
            100,
            Math.round((goal.allocatedAmount / goal.targetAmount) * 100)
          );
          const isComplete = percent >= 100;
          const isEditing = editingId === goal.id;

          return (
            <div
              key={goal.id}
              className={`p-6 rounded-2xl bg-white border transition-all flex flex-col justify-between space-y-5 relative shadow-xs hover:shadow-md ${
                isComplete
                  ? "border-emerald-200/90 ring-1 ring-emerald-500/10"
                  : "border-zinc-200/80"
              }`}
            >
              <div>
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="flex items-center gap-2.5">
                    <div
                      className={`p-2.5 rounded-xl ${
                        isComplete
                          ? "bg-emerald-50 text-emerald-600 ring-1 ring-emerald-200/70"
                          : "bg-blue-50 text-blue-600"
                      }`}
                    >
                      <PiggyBank className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-bold text-zinc-900">{goal.name}</h4>
                        {isComplete && (
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-bold font-mono bg-emerald-100 text-emerald-800">
                            <CheckCircle2 className="w-3 h-3" />
                            100%
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] text-zinc-500 font-medium">{goal.category}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5">
                    {/* If goal is 100% complete, provide celebratory confetti trigger */}
                    {isComplete && (
                      <button
                        onClick={() => triggerGoalConfetti()}
                        title="Celebrate 100% Completion with Confetti!"
                        className="p-1.5 text-emerald-600 hover:text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-lg cursor-pointer transition-colors shadow-2xs flex items-center gap-1 text-[11px] font-bold"
                      >
                        <PartyPopper className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">Celebrate!</span>
                      </button>
                    )}

                    <button
                      onClick={() => handleStartEdit(goal)}
                      title="Adjust Allocation"
                      className="p-1.5 text-zinc-400 hover:text-blue-600 rounded-lg hover:bg-zinc-100 cursor-pointer transition-colors"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    {state.savingsGoals.length > 1 && (
                      <button
                        onClick={() => onDeleteGoal(goal.id)}
                        title="Delete Goal"
                        className="p-1.5 text-zinc-400 hover:text-rose-600 rounded-lg hover:bg-zinc-100 cursor-pointer transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                <div className="flex items-baseline justify-between pt-3">
                  <span className="text-xs text-zinc-500 font-medium">Allocated Amount:</span>
                  <span className="font-mono text-xl font-bold text-zinc-950">
                    {formatINR(goal.allocatedAmount)}{" "}
                    <span className="text-xs font-normal text-zinc-400">
                      / {formatINR(goal.targetAmount)}
                    </span>
                  </span>
                </div>

                {/* Progress bar */}
                <div className="mt-3 w-full h-2.5 bg-zinc-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      isComplete
                        ? "bg-gradient-to-r from-emerald-500 to-teal-500 shadow-sm shadow-emerald-500/30"
                        : "bg-gradient-to-r from-blue-600 to-indigo-600"
                    }`}
                    style={{ width: `${percent}%` }}
                  />
                </div>
                <div className="mt-1.5 flex justify-between text-[11px] font-mono text-zinc-500">
                  <span className={isComplete ? "text-emerald-700 font-bold" : ""}>
                    {percent}% Completed
                  </span>
                  <span>
                    {isComplete
                      ? "Fully Ring-Fenced"
                      : `${formatINR(Math.max(0, goal.targetAmount - goal.allocatedAmount))} remaining`}
                  </span>
                </div>

                {/* Celebratory Callout Banner when 100% complete */}
                {isComplete && (
                  <div className="mt-3 p-2.5 rounded-xl bg-emerald-50/70 border border-emerald-200/80 flex items-center justify-between gap-2 animate-in fade-in">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span className="text-xs font-semibold text-emerald-950">
                        Goal achieved! ₹{goal.targetAmount.toLocaleString("en-IN")} ring-fenced & safe.
                      </span>
                    </div>
                    <button
                      onClick={() => triggerGoalConfetti()}
                      className="text-[11px] font-bold text-emerald-700 hover:text-emerald-800 bg-white hover:bg-emerald-100/60 px-2 py-1 rounded-lg border border-emerald-300/80 cursor-pointer transition-colors shadow-2xs whitespace-nowrap"
                    >
                      🎉 Blast Confetti
                    </button>
                  </div>
                )}
              </div>

              {/* In-place Allocation Editor */}
              {isEditing && (
                <div className="p-4 rounded-xl bg-blue-50/80 border border-blue-200 space-y-3 animate-in fade-in">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-bold text-blue-950">
                      Update Allocated Reserve (INR):
                    </label>
                    {/* Quick 100% Fill Button */}
                    <button
                      type="button"
                      onClick={() => setEditAllocatedAmount(goal.targetAmount)}
                      className="text-[11px] font-bold text-blue-700 hover:text-blue-900 bg-white hover:bg-blue-100/70 px-2 py-0.5 rounded-md border border-blue-200 cursor-pointer transition-colors"
                    >
                      Fill to 100% (₹{goal.targetAmount})
                    </button>
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min="0"
                      max={goal.targetAmount}
                      step="50"
                      value={editAllocatedAmount}
                      onChange={(e) => setEditAllocatedAmount(parseFloat(e.target.value) || 0)}
                      className="flex-1 px-3 py-1.5 rounded-lg bg-white border border-blue-300 text-xs font-mono font-bold text-blue-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                    <button
                      onClick={() => handleSaveEdit(goal.id, goal.targetAmount)}
                      className="px-3.5 py-1.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg cursor-pointer transition-colors shadow-xs"
                    >
                      Update
                    </button>
                    <button
                      onClick={() => setEditingId(null)}
                      className="px-2 py-1.5 text-xs text-zinc-500 hover:text-zinc-800 cursor-pointer"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              <div className="pt-3 border-t border-zinc-100 text-[11px] text-zinc-500 flex items-center justify-between font-medium">
                <span>Rule: Protected from discretionary budget</span>
                <span className="text-blue-600 font-mono font-semibold">100% Client-Side</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
