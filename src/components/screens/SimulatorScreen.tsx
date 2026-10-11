/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import {
  FinanceState,
  PurchaseScenario,
  ScenarioOption,
  CalculatedMetrics
} from "../../types/finance";
import {
  calculateMetrics,
  formatINR,
  generate30DayForecast
} from "../../services/financeCalculations";
import ForecastChart from "../ForecastChart";
import {
  Sparkles,
  ArrowRight,
  RotateCcw,
  CheckCircle,
  AlertOctagon,
  Calendar,
  Tag,
  Clock,
  Layers,
  HeartPulse,
  Info
} from "lucide-react";

interface SimulatorScreenProps {
  state: FinanceState;
  currentScenario: PurchaseScenario;
  onUpdateScenario: (scenario: PurchaseScenario) => void;
  onApplyToPlan: (scenario: PurchaseScenario) => void;
  onMarkAsPurchased: (scenario: PurchaseScenario) => void;
  onResetScenario: () => void;
}

const PRESET_PURCHASES = [
  { name: "Wireless Headphones", amount: 2000, category: "Shopping", priority: "discretionary" },
  { name: "Café Outing & Dinner", amount: 500, category: "Food", priority: "discretionary" },
  { name: "Live Concert Ticket", amount: 1500, category: "Entertainment", priority: "luxury" },
  { name: "Course Textbook", amount: 800, category: "Education", priority: "essential" }
];

export const CATEGORIES = [
  "Shopping",
  "Food",
  "Entertainment",
  "Transport",
  "Education",
  "Health",
  "Other"
];

export default function SimulatorScreen({
  state,
  currentScenario,
  onUpdateScenario,
  onApplyToPlan,
  onMarkAsPurchased,
  onResetScenario
}: SimulatorScreenProps) {
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  // Baseline metrics without hypothetical scenario
  const baselineMetrics = calculateMetrics(state, undefined);

  // Scenario metrics with the active option
  const scenarioMetrics = calculateMetrics(state, currentScenario);

  const forecastData = generate30DayForecast(state, currentScenario);

  const handleApply = () => {
    onApplyToPlan(currentScenario);
    setSuccessToast("Scenario applied to your 30-day plan!");
    setTimeout(() => setSuccessToast(null), 3000);
  };

  const handleConfirmPurchase = () => {
    onMarkAsPurchased(currentScenario);
    setConfirmModalOpen(false);
    setSuccessToast("Purchase recorded as a confirmed expense!");
    setTimeout(() => setSuccessToast(null), 3000);
  };

  const isShortfall = scenarioMetrics.uncommittedFunds < 0;
  const isPostpone = currentScenario.selectedOption === "postpone";
  const isSkip = currentScenario.selectedOption === "skip";

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Toast message */}
      {successToast && (
        <div className="fixed bottom-6 right-6 z-50 px-4 py-3 rounded-xl bg-blue-600 text-white font-semibold text-xs shadow-2xl flex items-center gap-2 animate-in slide-in-from-bottom-4">
          <CheckCircle className="w-4 h-4" />
          <span>{successToast}</span>
        </div>
      )}

      {/* Screen Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-zinc-500 mb-1">
            <span>Signature Feature</span>
            <span aria-hidden="true">·</span>
            <span>Zero-Risk Simulation</span>
            <span aria-hidden="true">·</span>
            <span>Does Not Affect Confirmed History</span>
          </div>
          <h2 className="text-2xl md:text-3xl font-extrabold text-zinc-950 tracking-tight">
            Before You Spend Simulator
          </h2>
          <p className="mt-1 text-xs text-zinc-600 max-w-2xl leading-relaxed">
            Test hypothetical purchases in real time. See exactly how buying now, postponing, or skipping
            shifts your safe-to-spend balance, bills, and 30-day runway.
          </p>
        </div>

        <button
          onClick={onResetScenario}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-zinc-600 hover:text-zinc-900 bg-white hover:bg-zinc-100 rounded-xl border border-zinc-200 shadow-xs transition-colors shrink-0 cursor-pointer"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          Reset to Baseline
        </button>
      </div>

      {/* 2-Column Grid: Inputs & Presets on Left, Before-and-After Analysis on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Purchase Definition Form & Presets */}
        <div className="lg:col-span-5 space-y-6">
          <div className="p-6 rounded-2xl bg-white border border-zinc-200/80 shadow-sm space-y-5">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-wider">
                1. Define Potential Purchase
              </h3>
              <span className="text-[11px] font-mono text-blue-600 font-bold bg-blue-50 px-2 py-0.5 rounded">Scenario Draft</span>
            </div>

            {/* Quick Presets */}
            <div>
              <span className="block text-[11px] font-semibold text-zinc-500 mb-2">
                Quick Test Ideas:
              </span>
              <div className="grid grid-cols-2 gap-2">
                {PRESET_PURCHASES.map((p, idx) => (
                  <button
                    key={idx}
                    onClick={() =>
                      onUpdateScenario({
                        ...currentScenario,
                        name: p.name,
                        amount: p.amount,
                        category: p.category,
                        priority: p.priority as any
                      })
                    }
                    className="p-2.5 rounded-xl bg-zinc-50 border border-zinc-200/80 hover:bg-blue-50/60 hover:border-blue-200 text-left transition-all cursor-pointer group"
                  >
                    <div className="text-xs font-semibold text-zinc-900 truncate group-hover:text-blue-600">{p.name}</div>
                    <div className="text-[11px] font-mono font-bold text-blue-600">{formatINR(p.amount)}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Form Fields */}
            <div className="space-y-4 pt-2 border-t border-zinc-100">
              <div>
                <label className="block text-xs font-semibold text-zinc-700 mb-1.5">
                  Item or Experience Name
                </label>
                <input
                  type="text"
                  value={currentScenario.name}
                  onChange={(e) =>
                    onUpdateScenario({ ...currentScenario, name: e.target.value })
                  }
                  className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-50 border border-zinc-200 text-xs text-zinc-900 font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                  placeholder="e.g. Noise Cancelling Headphones"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 mb-1.5">
                    Amount (INR)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="50"
                    value={currentScenario.amount || ""}
                    onChange={(e) =>
                      onUpdateScenario({
                        ...currentScenario,
                        amount: Math.max(0, parseFloat(e.target.value) || 0)
                      })
                    }
                    className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-50 border border-zinc-200 text-xs font-mono font-bold text-blue-600 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                    placeholder="2000"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-700 mb-1.5">Category</label>
                  <select
                    value={currentScenario.category}
                    onChange={(e) =>
                      onUpdateScenario({ ...currentScenario, category: e.target.value })
                    }
                    className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-50 border border-zinc-200 text-xs text-zinc-900 font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all cursor-pointer"
                  >
                    {CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 mb-1.5">
                    Proposed Day (1–30)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="30"
                    value={currentScenario.proposedDay}
                    onChange={(e) =>
                      onUpdateScenario({
                        ...currentScenario,
                        proposedDay: Math.min(30, Math.max(1, parseInt(e.target.value) || 1))
                      })
                    }
                    className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-50 border border-zinc-200 text-xs font-mono text-zinc-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-700 mb-1.5">Priority</label>
                  <select
                    value={currentScenario.priority}
                    onChange={(e) =>
                      onUpdateScenario({ ...currentScenario, priority: e.target.value as any })
                    }
                    className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-50 border border-zinc-200 text-xs text-zinc-900 font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all cursor-pointer"
                  >
                    <option value="essential">Essential</option>
                    <option value="discretionary">Discretionary</option>
                    <option value="luxury">Luxury / Impulse</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Scenario Strategy Selector (Option 1, 2, 3) */}
            <div className="pt-4 border-t border-zinc-100">
              <span className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2.5">
                2. Test Decision Pathway
              </span>
              <div className="grid grid-cols-3 gap-2 p-1 bg-zinc-100/80 rounded-xl border border-zinc-200/60">
                <button
                  onClick={() =>
                    onUpdateScenario({ ...currentScenario, selectedOption: "now" })
                  }
                  className={`py-2 px-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                    currentScenario.selectedOption === "now"
                      ? "bg-blue-600 text-white shadow-sm"
                      : "text-zinc-600 hover:text-zinc-900"
                  }`}
                >
                  Buy Now
                </button>
                <button
                  onClick={() =>
                    onUpdateScenario({ ...currentScenario, selectedOption: "postpone" })
                  }
                  className={`py-2 px-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                    currentScenario.selectedOption === "postpone"
                      ? "bg-indigo-600 text-white shadow-sm"
                      : "text-zinc-600 hover:text-zinc-900"
                  }`}
                >
                  Postpone
                </button>
                <button
                  onClick={() =>
                    onUpdateScenario({ ...currentScenario, selectedOption: "skip" })
                  }
                  className={`py-2 px-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                    currentScenario.selectedOption === "skip"
                      ? "bg-emerald-600 text-white shadow-sm"
                      : "text-zinc-600 hover:text-zinc-900"
                  }`}
                >
                  Skip
                </button>
              </div>

              {/* Postpone specific day picker */}
              {isPostpone && (
                <div className="mt-3 p-3.5 rounded-xl bg-indigo-50/60 border border-indigo-200 animate-in fade-in">
                  <div className="flex items-center justify-between text-xs text-indigo-900 mb-1.5 font-medium">
                    <span>Postpone until Day:</span>
                    <span className="font-mono text-indigo-700 font-bold">
                      Day {currentScenario.postponeDay}
                    </span>
                  </div>
                  <input
                    type="range"
                    min={Math.max(1, state.currentDay + 1)}
                    max="30"
                    value={currentScenario.postponeDay}
                    onChange={(e) =>
                      onUpdateScenario({
                        ...currentScenario,
                        postponeDay: parseInt(e.target.value)
                      })
                    }
                    className="w-full accent-indigo-600 cursor-pointer"
                  />
                  <p className="mt-1 text-[11px] text-indigo-800">
                    Keeps liquid funds available before earlier bills arrive. Total expense remains identical.
                  </p>
                </div>
              )}

              {/* Skip message */}
              {isSkip && (
                <div className="mt-3 p-3.5 rounded-xl bg-emerald-50/70 border border-emerald-200 text-xs text-emerald-900 animate-in fade-in flex items-start gap-2">
                  <Info className="w-4 h-4 shrink-0 text-emerald-600 mt-0.5" />
                  <span>
                    Avoiding this purchase preserves <strong>{formatINR(currentScenario.amount)}</strong>,
                    retaining max flexibility and boosting your safety runway.
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Before-and-After Comparison & Actions */}
        <div className="lg:col-span-7 space-y-6">
          {/* Critical Shortfall Warning Banner (if uncommitted funds < 0) */}
          {isShortfall && !isSkip && (
            <div className="p-4 sm:p-5 rounded-2xl bg-rose-50 border border-rose-200 flex items-start gap-3 text-xs text-rose-900 animate-in shake">
              <AlertOctagon className="w-5 h-5 shrink-0 text-rose-600 mt-0.5" />
              <div>
                <strong className="font-bold text-sm block text-rose-700">Funding Shortfall Warning!</strong>
                Purchasing this item leaves a deficit of{" "}
                <span className="font-mono font-bold text-rose-700">
                  {formatINR(Math.abs(scenarioMetrics.uncommittedFunds))}
                </span>
                . This decision will eat into your ₹{baselineMetrics.reservedSavings} protected savings or
                risk unpaid essential bills!
              </div>
            </div>
          )}

          {/* Side-by-Side Comparison Matrix */}
          <div className="p-6 rounded-2xl bg-white border border-zinc-200/80 shadow-sm">
            <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-4">
              Before & After Consequence Matrix
            </h3>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead>
                  <tr className="border-b border-zinc-200 text-zinc-500 font-mono">
                    <th className="pb-3 font-semibold">Metric Dimension</th>
                    <th className="pb-3 font-semibold text-right">Current Plan</th>
                    <th className="pb-3 font-semibold text-right">
                      {isSkip
                        ? "If Skipped"
                        : isPostpone
                        ? `Postponed (D${currentScenario.postponeDay})`
                        : "Buy Now"}
                    </th>
                    <th className="pb-3 font-semibold text-right">Net Impact</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 font-mono">
                  {/* Row 1: Projected Balance */}
                  <tr>
                    <td className="py-3 font-sans font-semibold text-zinc-900">
                      Projected Balance
                    </td>
                    <td className="py-3 text-right text-zinc-500">
                      {formatINR(baselineMetrics.projectedBalance)}
                    </td>
                    <td className="py-3 text-right font-bold text-zinc-950">
                      {formatINR(scenarioMetrics.projectedBalance)}
                    </td>
                    <td className="py-3 text-right">
                      {isSkip ? (
                        <span className="text-emerald-600 font-semibold">₹0 (Preserved)</span>
                      ) : (
                        <span className="text-rose-600 font-semibold">-{formatINR(currentScenario.amount)}</span>
                      )}
                    </td>
                  </tr>

                  {/* Row 2: Safe-to-Spend */}
                  <tr>
                    <td className="py-3 font-sans font-semibold text-zinc-900">
                      Safe-to-Spend
                    </td>
                    <td className="py-3 text-right text-zinc-500">
                      {formatINR(baselineMetrics.uncommittedFunds)}
                    </td>
                    <td
                      className={`py-3 text-right font-bold ${
                        scenarioMetrics.uncommittedFunds >= 0
                          ? "text-emerald-600"
                          : "text-rose-600"
                      }`}
                    >
                      {formatINR(scenarioMetrics.uncommittedFunds)}
                    </td>
                    <td className="py-3 text-right">
                      {isSkip ? (
                        <span className="text-emerald-600 font-semibold">+₹0</span>
                      ) : (
                        <span className="text-rose-600 font-semibold">-{formatINR(currentScenario.amount)}</span>
                      )}
                    </td>
                  </tr>

                  {/* Row 3: Daily Discretionary Allowance */}
                  <tr>
                    <td className="py-3 font-sans font-semibold text-zinc-900">
                      Daily Allowance
                    </td>
                    <td className="py-3 text-right text-zinc-500">
                      {formatINR(baselineMetrics.dailyDiscretionaryAllowance, true)}/day
                    </td>
                    <td className="py-3 text-right font-bold text-zinc-950">
                      {formatINR(scenarioMetrics.dailyDiscretionaryAllowance, true)}/day
                    </td>
                    <td className="py-3 text-right">
                      {isSkip ? (
                        <span className="text-emerald-600 font-semibold">No reduction</span>
                      ) : (
                        <span className="text-rose-600 font-semibold">
                          -
                          {formatINR(
                            baselineMetrics.dailyDiscretionaryAllowance -
                              scenarioMetrics.dailyDiscretionaryAllowance,
                            true
                          )}
                          /d
                        </span>
                      )}
                    </td>
                  </tr>

                  {/* Row 4: Savings Coverage */}
                  <tr>
                    <td className="py-3 font-sans font-semibold text-zinc-900">
                      Savings Goal Coverage
                    </td>
                    <td className="py-3 text-right text-zinc-500">
                      {baselineMetrics.savingsProgressPercent}%
                    </td>
                    <td className="py-3 text-right font-bold text-zinc-950">
                      {scenarioMetrics.savingsProgressPercent}%
                    </td>
                    <td className="py-3 text-right">
                      {scenarioMetrics.uncommittedFunds < 0 ? (
                        <span className="text-rose-600 font-semibold">Deficit risk</span>
                      ) : (
                        <span className="text-emerald-600 font-semibold">100% Protected</span>
                      )}
                    </td>
                  </tr>

                  {/* Row 5: Financial Health */}
                  <tr>
                    <td className="py-3 font-sans font-semibold text-zinc-900">
                      Financial Health
                    </td>
                    <td className="py-3 text-right text-zinc-500">
                      {baselineMetrics.healthScore} ({baselineMetrics.healthStatus})
                    </td>
                    <td
                      className={`py-3 text-right font-bold ${
                        scenarioMetrics.healthScore >= 70
                          ? "text-emerald-600"
                          : scenarioMetrics.healthScore >= 50
                          ? "text-amber-600"
                          : "text-rose-600"
                      }`}
                    >
                      {scenarioMetrics.healthScore} ({scenarioMetrics.healthStatus})
                    </td>
                    <td className="py-3 text-right">
                      {scenarioMetrics.healthScore >= baselineMetrics.healthScore ? (
                        <span className="text-emerald-600 font-semibold">0 pts</span>
                      ) : (
                        <span className="text-rose-600 font-semibold">
                          {scenarioMetrics.healthScore - baselineMetrics.healthScore} pts
                        </span>
                      )}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Scenario Runway Comparison Chart Preview */}
            <div className="mt-6 pt-5 border-t border-zinc-100">
              <div className="flex items-center justify-between text-xs text-zinc-500 mb-2 font-medium">
                <span>Runway Trajectory: Base (Blue) vs Proposed (Red Dashed)</span>
                <span className="font-mono text-[11px]">30-Day Period</span>
              </div>
              <ForecastChart data={forecastData} height={170} showScenario={!isSkip} />
            </div>

            {/* Scenario Action Controls */}
            <div className="mt-6 pt-5 border-t border-zinc-100 flex flex-wrap items-center justify-between gap-3">
              <div className="text-xs text-zinc-500 font-medium">
                Ready to commit this decision?
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleApply}
                  className="px-3.5 py-2 text-xs font-semibold text-zinc-700 bg-zinc-100 hover:bg-zinc-200 rounded-xl transition-colors cursor-pointer"
                >
                  Apply to Plan (Temporary)
                </button>
                <button
                  onClick={() => setConfirmModalOpen(true)}
                  className="px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-colors shadow-sm cursor-pointer"
                >
                  Mark as Purchased
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Confirmation Modal to ensure hypothetical scenarios do NOT silently become confirmed expenses */}
      {confirmModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/40 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-md p-6 rounded-2xl bg-white border border-zinc-200 shadow-2xl space-y-4">
            <h4 className="text-base font-bold text-zinc-950">
              Confirm Real Purchase
            </h4>
            <p className="text-xs text-zinc-600 leading-relaxed">
              Are you sure you want to record <strong>{currentScenario.name}</strong> (
              {formatINR(currentScenario.amount)}) as a confirmed expense?
              <br />
              This will officially deduct {formatINR(currentScenario.amount)} from your ₹
              {state.startingBudget.toLocaleString()} starting budget.
            </p>
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setConfirmModalOpen(false)}
                className="px-3.5 py-2 text-xs font-semibold text-zinc-700 hover:text-zinc-900 bg-zinc-100 hover:bg-zinc-200 rounded-xl cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmPurchase}
                className="px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs cursor-pointer"
              >
                Confirm Purchase
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
