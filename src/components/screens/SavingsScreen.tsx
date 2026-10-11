/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import {
  FinanceState,
  SavingsGoal,
  CalculatedMetrics
} from "../../types/finance";
import { formatINR } from "../../services/financeCalculations";
import {
  ShieldCheck,
  PlusCircle,
  PiggyBank,
  Edit2,
  Trash2,
  CheckCircle,
  AlertTriangle,
  ArrowRight
} from "lucide-react";

interface SavingsScreenProps {
  state: FinanceState;
  metrics: CalculatedMetrics;
  onUpdateGoalAllocation: (goalId: string, newAllocated: number) => void;
  onAddGoal: (goal: Omit<SavingsGoal, "id">) => void;
  onDeleteGoal: (goalId: string) => void;
}

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
  const [category, setCategory] = useState("Emergency Reserve");

  const handleStartEdit = (goal: SavingsGoal) => {
    setEditingId(goal.id);
    setEditAllocatedAmount(goal.allocatedAmount);
  };

  const handleSaveEdit = (goalId: string) => {
    onUpdateGoalAllocation(goalId, editAllocatedAmount);
    setEditingId(null);
  };

  const handleCreateGoal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || targetAmount <= 0) return;
    onAddGoal({
      name,
      targetAmount,
      allocatedAmount: Math.min(targetAmount, allocatedAmount),
      targetDay: 30,
      category
    });
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
          <h2 className="text-2xl md:text-3xl font-extrabold text-zinc-950 tracking-tight">
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
      <div className="p-6 rounded-2xl bg-gradient-to-r from-blue-50/80 via-white to-indigo-50/80 border border-blue-200/80 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
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
          const isEditing = editingId === goal.id;

          return (
            <div
              key={goal.id}
              className="p-6 rounded-2xl bg-white border border-zinc-200/80 shadow-sm hover:shadow-md transition-all flex flex-col justify-between space-y-5 relative"
            >
              <div>
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2.5 rounded-xl bg-blue-50 text-blue-600">
                      <PiggyBank className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-zinc-900">{goal.name}</h4>
                      <span className="text-[11px] text-zinc-500 font-medium">{goal.category}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5">
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
                <div className="mt-3 w-full h-2 bg-zinc-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full transition-all duration-300"
                    style={{ width: `${percent}%` }}
                  />
                </div>
                <div className="mt-1 flex justify-between text-[11px] font-mono text-zinc-500">
                  <span>{percent}% Completed</span>
                  <span>{formatINR(Math.max(0, goal.targetAmount - goal.allocatedAmount))} remaining</span>
                </div>
              </div>

              {/* In-place Allocation Editor */}
              {isEditing && (
                <div className="p-3.5 rounded-xl bg-blue-50/60 border border-blue-200 space-y-2 animate-in fade-in">
                  <label className="block text-xs font-semibold text-blue-900">
                    Update Allocated Reserve (INR):
                  </label>
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
                      onClick={() => handleSaveEdit(goal.id)}
                      className="px-3 py-1.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg cursor-pointer"
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
