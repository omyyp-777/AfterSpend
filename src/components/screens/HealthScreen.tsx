/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import {
  FinanceState,
  CalculatedMetrics
} from "../../types/finance";
import {
  calculateMetrics,
  formatINR
} from "../../services/financeCalculations";
import {
  HeartPulse,
  ShieldAlert,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  ArrowRight,
  TrendingDown,
  Info
} from "lucide-react";

interface HealthScreenProps {
  state: FinanceState;
  metrics: CalculatedMetrics;
}

export default function HealthScreen({ state, metrics }: HealthScreenProps) {
  // Unexpected Expense Simulator state (Feature F)
  const [surpriseAmount, setSurpriseAmount] = useState<number>(1000);
  const [customSurprise, setCustomSurprise] = useState<string>("");

  // Calculate hypothetical shock scenario
  const shockScenarioMetrics = calculateMetrics(state, {
    name: "Unexpected Emergency Expense",
    amount: surpriseAmount,
    category: "Emergency",
    proposedDay: state.currentDay,
    priority: "essential",
    selectedOption: "now",
    postponeDay: state.currentDay
  });

  const shockShortfall = shockScenarioMetrics.uncommittedFunds < 0;

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 text-xs font-semibold text-zinc-500 mb-1">
          <span>Deterministic Scoring</span>
          <span aria-hidden="true">·</span>
          <span>4-Pillar Evaluation</span>
          <span aria-hidden="true">·</span>
          <span>Zero Black-Box Logic</span>
        </div>
        <h2 className="text-2xl md:text-3xl font-extrabold text-zinc-950 tracking-tight">
          Explainable Financial Health
        </h2>
        <p className="mt-1 text-xs text-zinc-600 max-w-2xl leading-relaxed">
          Unlike opaque credit scores, AFTERSPEND explains every point. Each score is deterministically
          calculated from commitment coverage, emergency resilience, protected savings, and burn-rate sustainability.
        </p>
      </div>

      {/* Main Health Score Showcase Card */}
      <div className="p-8 rounded-2xl bg-white border border-zinc-200/80 flex flex-col md:flex-row items-start md:items-center justify-between gap-8 relative overflow-hidden shadow-sm">
        <div className="space-y-3">
          <div className="flex items-center gap-2.5">
            <span
              className={`px-3 py-1 rounded-md text-xs font-bold uppercase tracking-wider ${
                metrics.healthStatus === "Strong"
                  ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                  : metrics.healthStatus === "Stable"
                  ? "bg-blue-50 text-blue-700 border border-blue-200"
                  : metrics.healthStatus === "Needs Attention"
                  ? "bg-amber-50 text-amber-700 border border-amber-200"
                  : "bg-rose-50 text-rose-700 border border-rose-200"
              }`}
            >
              {metrics.healthStatus} Condition
            </span>
            <span className="text-xs text-zinc-400 font-mono font-medium">Status Grade</span>
          </div>

          <div className="flex items-baseline gap-3">
            <span className="text-6xl font-black font-mono tracking-tight text-zinc-950">
              {metrics.healthScore}
            </span>
            <span className="text-xl font-normal text-zinc-400">/ 100</span>
          </div>

          <p className="text-xs text-zinc-600 max-w-md leading-relaxed">
            {metrics.healthScore >= 80
              ? "Your ₹10,000 budget is solidly structured with full bill coverage and healthy discretionary leeway."
              : metrics.healthScore >= 60
              ? "Financial position is stable, though discretionary spending should be monitored closely."
              : metrics.healthScore >= 40
              ? "Budget leeway is tight. Any surprise expense may jeopardize upcoming bills or savings."
              : "High risk of funding shortfall. Safe-to-spend is depleted or bills exceed liquid cash."}
          </p>
        </div>

        {/* 4 Dimension Breakdown */}
        <div className="w-full md:w-96 space-y-3.5 pt-4 md:pt-0 border-t md:border-t-0 md:border-l border-zinc-100 md:pl-8">
          <div className="text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2">
            Deterministic Weights:
          </div>

          <div>
            <div className="flex justify-between text-xs font-mono text-zinc-600 mb-1 font-medium">
              <span>Commitment Coverage (30%)</span>
              <span className="text-zinc-900 font-bold">
                {metrics.healthBreakdown.commitmentCoverage}/100
              </span>
            </div>
            <div className="w-full h-2 bg-zinc-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-600 rounded-full"
                style={{ width: `${metrics.healthBreakdown.commitmentCoverage}%` }}
              />
            </div>
          </div>

          <div>
            <div className="flex justify-between text-xs font-mono text-zinc-600 mb-1 font-medium">
              <span>Emergency Resilience (25%)</span>
              <span className="text-zinc-900 font-bold">
                {metrics.healthBreakdown.emergencyResilience}/100
              </span>
            </div>
            <div className="w-full h-2 bg-zinc-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-indigo-600 rounded-full"
                style={{ width: `${metrics.healthBreakdown.emergencyResilience}%` }}
              />
            </div>
          </div>

          <div>
            <div className="flex justify-between text-xs font-mono text-zinc-600 mb-1 font-medium">
              <span>Savings Progress (20%)</span>
              <span className="text-zinc-900 font-bold">
                {metrics.healthBreakdown.savingsProgress}/100
              </span>
            </div>
            <div className="w-full h-2 bg-zinc-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-amber-500 rounded-full"
                style={{ width: `${metrics.healthBreakdown.savingsProgress}%` }}
              />
            </div>
          </div>

          <div>
            <div className="flex justify-between text-xs font-mono text-zinc-600 mb-1 font-medium">
              <span>Budget Sustainability (25%)</span>
              <span className="text-zinc-900 font-bold">
                {metrics.healthBreakdown.budgetSustainability}/100
              </span>
            </div>
            <div className="w-full h-2 bg-zinc-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-cyan-600 rounded-full"
                style={{ width: `${metrics.healthBreakdown.budgetSustainability}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Explanations Panel: Positive Factors vs Risk Factors */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Positive Factors */}
        <div className="p-6 rounded-2xl bg-white border border-emerald-200/80 shadow-sm space-y-3">
          <h3 className="text-xs font-bold text-emerald-700 uppercase tracking-wider flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            Positive Score Drivers ({metrics.explanations.positive.length})
          </h3>
          <div className="space-y-2">
            {metrics.explanations.positive.map((item, idx) => (
              <div
                key={idx}
                className="p-3.5 rounded-xl bg-emerald-50/60 border border-emerald-100 text-xs text-emerald-900 leading-relaxed font-medium"
              >
                {item}
              </div>
            ))}
          </div>
        </div>

        {/* Risk Factors */}
        <div className="p-6 rounded-2xl bg-white border border-amber-200/80 shadow-sm space-y-3">
          <h3 className="text-xs font-bold text-amber-700 uppercase tracking-wider flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-600" />
            Risk Factors & Bottlenecks ({metrics.explanations.risks.length})
          </h3>
          <div className="space-y-2">
            {metrics.explanations.risks.length > 0 ? (
              metrics.explanations.risks.map((item, idx) => (
                <div
                  key={idx}
                  className="p-3.5 rounded-xl bg-amber-50/60 border border-amber-100 text-xs text-amber-900 leading-relaxed font-medium"
                >
                  {item}
                </div>
              ))
            ) : (
              <div className="p-3.5 rounded-xl bg-zinc-50 border border-zinc-200 text-xs text-zinc-500 font-medium">
                No acute financial risk bottlenecks identified under current plan.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Feature F: Unexpected Expense Simulator */}
      <div className="p-6 rounded-2xl bg-white border border-zinc-200/80 shadow-sm space-y-6">
        <div>
          <span className="text-[10px] font-mono font-bold text-blue-600 uppercase tracking-wider bg-blue-50 px-2 py-0.5 rounded">
            Feature F · Stress Test Engine
          </span>
          <h3 className="text-lg font-bold text-zinc-950 mt-2">
            Unexpected Expense Simulator
          </h3>
          <p className="text-xs text-zinc-600 mt-1">
            Simulate a surprise emergency cost (medical, travel, gadget repair) to stress-test your financial resilience.
          </p>
        </div>

        {/* Quick Amount Selectors */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => {
              setSurpriseAmount(300);
              setCustomSurprise("");
            }}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              surpriseAmount === 300
                ? "bg-blue-600 text-white shadow-xs"
                : "bg-zinc-50 border border-zinc-200 text-zinc-700 hover:bg-zinc-100"
            }`}
          >
            Small Surprise (₹300)
          </button>
          <button
            onClick={() => {
              setSurpriseAmount(1000);
              setCustomSurprise("");
            }}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              surpriseAmount === 1000
                ? "bg-blue-600 text-white shadow-xs"
                : "bg-zinc-50 border border-zinc-200 text-zinc-700 hover:bg-zinc-100"
            }`}
          >
            Medium Surprise (₹1,000)
          </button>
          <button
            onClick={() => {
              setSurpriseAmount(2500);
              setCustomSurprise("");
            }}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              surpriseAmount === 2500
                ? "bg-blue-600 text-white shadow-xs"
                : "bg-zinc-50 border border-zinc-200 text-zinc-700 hover:bg-zinc-100"
            }`}
          >
            Large Shock (₹2,500)
          </button>

          <div className="flex items-center gap-2">
            <input
              type="number"
              placeholder="Custom ₹..."
              value={customSurprise}
              onChange={(e) => {
                setCustomSurprise(e.target.value);
                const val = parseFloat(e.target.value);
                if (!isNaN(val) && val >= 0) setSurpriseAmount(val);
              }}
              className="w-32 px-3 py-2 rounded-xl bg-zinc-50 border border-zinc-200 text-xs font-mono font-bold text-zinc-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
          </div>
        </div>

        {/* Stress Test Impact Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-2">
          <div className="p-4 rounded-xl bg-zinc-50 border border-zinc-200">
            <span className="text-[11px] text-zinc-500 block mb-1 font-medium">Projected Balance</span>
            <div className="text-lg font-bold font-mono text-zinc-950">
              {formatINR(shockScenarioMetrics.projectedBalance)}
            </div>
            <span className="text-[11px] text-rose-600 font-semibold">-{formatINR(surpriseAmount)}</span>
          </div>

          <div className="p-4 rounded-xl bg-zinc-50 border border-zinc-200">
            <span className="text-[11px] text-zinc-500 block mb-1 font-medium">Safe-to-Spend</span>
            <div
              className={`text-lg font-bold font-mono ${
                shockScenarioMetrics.uncommittedFunds >= 0
                  ? "text-emerald-600"
                  : "text-rose-600"
              }`}
            >
              {formatINR(shockScenarioMetrics.uncommittedFunds)}
            </div>
            <span className="text-[10px] text-zinc-500 font-medium">
              {shockShortfall ? "Shortfall deficit!" : "Remaining runway"}
            </span>
          </div>

          <div className="p-4 rounded-xl bg-zinc-50 border border-zinc-200">
            <span className="text-[11px] text-zinc-500 block mb-1 font-medium">Daily Allowance</span>
            <div className="text-lg font-bold font-mono text-zinc-950">
              {formatINR(shockScenarioMetrics.dailyDiscretionaryAllowance, true)}/d
            </div>
            <span className="text-[10px] text-zinc-500 font-medium">Per remaining day</span>
          </div>

          <div className="p-4 rounded-xl bg-zinc-50 border border-zinc-200">
            <span className="text-[11px] text-zinc-500 block mb-1 font-medium">Shock Health Score</span>
            <div
              className={`text-lg font-bold font-mono ${
                shockScenarioMetrics.healthScore >= 70
                  ? "text-emerald-600"
                  : shockScenarioMetrics.healthScore >= 50
                  ? "text-amber-600"
                  : "text-rose-600"
              }`}
            >
              {shockScenarioMetrics.healthScore} ({shockScenarioMetrics.healthStatus})
            </div>
            <span className="text-[11px] text-rose-600 font-semibold">
              {shockScenarioMetrics.healthScore - metrics.healthScore} pts impact
            </span>
          </div>
        </div>

        {/* Rule-Based Emergency Suggestions */}
        <div className="p-4 rounded-xl bg-blue-50/50 border border-blue-100 space-y-2">
          <span className="text-xs font-bold text-blue-900 uppercase tracking-wider block">
            Rule-Based Recovery Tactics:
          </span>
          <ul className="text-xs text-zinc-700 space-y-1.5 list-disc pl-4 font-medium leading-relaxed">
            {shockShortfall ? (
              <>
                <li className="text-rose-700 font-bold">
                  Immediate deficit: Reduce non-essential dining/shopping by at least{" "}
                  {formatINR(Math.abs(shockScenarioMetrics.uncommittedFunds))} this month.
                </li>
                <li>
                  Consider pausing discretionary subscriptions like Streaming (saves ₹199) until the next budget cycle.
                </li>
                <li>
                  Temporarily decrease protected savings allocation to absorb the emergency shock without defaulting on bills.
                </li>
              </>
            ) : (
              <>
                <li>
                  Your plan absorbs a {formatINR(surpriseAmount)} emergency without breaching the ₹
                  {metrics.remainingCommitments} commitments or ₹{metrics.reservedSavings} savings reserves!
                </li>
                <li>
                  Daily allowance drops to {formatINR(shockScenarioMetrics.dailyDiscretionaryAllowance, true)}/day.
                  Maintain disciplined day-to-day spending.
                </li>
              </>
            )}
          </ul>
        </div>
      </div>
    </div>
  );
}
