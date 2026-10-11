/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */


import { motion } from "framer-motion";
import { FinanceState, CalculatedMetrics, PurchaseScenario } from "../../types/finance";
import { formatINR, generate30DayForecast, generateInsights } from "../../services/financeCalculations";
import ForecastChart from "../ForecastChart";
import { ShieldAlert, Calendar, Sparkles, ArrowRight, PlusCircle, FileText } from "lucide-react";

interface OverviewScreenProps {
  state: FinanceState;
  metrics: CalculatedMetrics;
  scenario?: PurchaseScenario;
  onNavigateTab: (tab: string) => void;
  onOpenAddExpense: () => void;
  onOpenAddCommitment: () => void;
  onMarkCommitmentPaid: (id: string) => void;
  onDownloadReport: () => void | Promise<void>;
  reportMessage?: string;
}

export default function OverviewScreen({
  state,
  metrics,
  scenario,
  onNavigateTab,
  onOpenAddExpense,
  onOpenAddCommitment,
  onMarkCommitmentPaid,
  onDownloadReport,
  reportMessage
}: OverviewScreenProps) {
  const forecastData = generate30DayForecast(state, scenario);
  const insights = generateInsights(state, metrics, scenario);
  const upcomingCommitments = state.commitments
    .filter((c) => c.status === "upcoming")
    .sort((a, b) => a.dueDay - b.dueDay);

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-bold text-zinc-950">Your financial overview</h2>
          <p className="text-sm text-zinc-500">A clear snapshot of your money, commitments, and 30-day runway.</p>
        </div>
        <button
          type="button"
          onClick={onDownloadReport}
          disabled={reportMessage === "Preparing your financial report…"}
          aria-busy={reportMessage === "Preparing your financial report…"}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:cursor-wait disabled:opacity-70"
        >
          <FileText className="h-4 w-4" aria-hidden="true" />
          Download Financial Report
        </button>
      </div>
      {reportMessage && (
        <p className="text-sm text-zinc-600" role="status" aria-live="polite">{reportMessage}</p>
      )}
      {/* Financial Summary Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {/* Card 1: Safe-To-Spend (Hero Metric) */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.15 }}
          transition={{ duration: 0.45, delay: 0.05, ease: [0.22, 1, 0.36, 1] }}
          whileHover={{ y: -2, transition: { duration: 0.2 } }}
          className="p-6 rounded-2xl bg-white border border-blue-200/80 relative overflow-hidden group shadow-sm hover:shadow-md transition-all"
        >
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-600 to-indigo-600" />
          <div className="flex items-center justify-between text-xs font-semibold text-zinc-500 mb-1.5 uppercase tracking-wider">
            <span>Safe-to-Spend</span>
            <span className="text-blue-600 text-[11px] font-mono bg-blue-50 px-2 py-0.5 rounded-md font-bold">Uncommitted</span>
          </div>
          <div
            className={`text-3xl sm:text-4xl font-extrabold font-mono tracking-tight ${
              metrics.uncommittedFunds >= 0 ? "text-emerald-600" : "text-rose-600"
            }`}
          >
            {formatINR(metrics.uncommittedFunds)}
          </div>
          <p className="mt-2.5 text-xs text-zinc-500 leading-relaxed">
            After reserving ₹{metrics.remainingCommitments} bills, ₹{metrics.plannedExpenses} planned purchases, and ₹{metrics.reservedSavings} savings.
          </p>
        </motion.div>

        {/* Card 2: Projected Balance */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.15 }}
          transition={{ duration: 0.45, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
          whileHover={{ y: -2, transition: { duration: 0.2 } }}
          className="p-6 rounded-2xl bg-white border border-zinc-200/80 relative shadow-sm hover:shadow-md transition-all"
        >
          <div className="flex items-center justify-between text-xs font-semibold text-zinc-500 mb-1.5 uppercase tracking-wider">
            <span>Projected Balance</span>
            <span className="font-mono text-zinc-400 font-medium">Day {state.currentDay} of 30</span>
          </div>
          <div className="text-3xl sm:text-4xl font-extrabold font-mono tracking-tight text-zinc-950">
            {formatINR(metrics.projectedBalance)}
          </div>
          <p className="mt-2.5 text-xs text-zinc-500 leading-relaxed">
            Starting ₹{state.startingBudget.toLocaleString()} minus confirmed transactions. Pending bills remain in this pool.
          </p>
        </motion.div>

        {/* Card 3: Daily Discretionary Allowance */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.15 }}
          transition={{ duration: 0.45, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
          whileHover={{ y: -2, transition: { duration: 0.2 } }}
          className="p-6 rounded-2xl bg-white border border-zinc-200/80 relative shadow-sm hover:shadow-md transition-all"
        >
          <div className="flex items-center justify-between text-xs font-semibold text-zinc-500 mb-1.5 uppercase tracking-wider">
            <span>Daily Allowance</span>
            <span className="text-blue-700 text-[11px] font-mono bg-blue-50 px-2 py-0.5 rounded-md font-bold">Discretionary</span>
          </div>
          <div className="text-3xl sm:text-4xl font-extrabold font-mono tracking-tight text-zinc-950">
            {formatINR(metrics.dailyDiscretionaryAllowance, true)}
            <span className="text-sm font-normal text-zinc-400">/day</span>
          </div>
          <p className="mt-2.5 text-xs text-zinc-500 leading-relaxed">
            Suggested daily safe spending rate across the remaining {state.planningDays - state.currentDay + 1} days.
          </p>
        </motion.div>

        {/* Card 4: Savings Goal Progress */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.15 }}
          transition={{ duration: 0.45, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
          whileHover={{ y: -2, transition: { duration: 0.2 } }}
          className="p-6 rounded-2xl bg-white border border-zinc-200/80 relative shadow-sm hover:shadow-md transition-all"
        >
          <div className="flex items-center justify-between text-xs font-semibold text-zinc-500 mb-1.5 uppercase tracking-wider">
            <span>Protected Savings</span>
            <span className="font-mono text-indigo-600 font-bold bg-indigo-50 px-2 py-0.5 rounded-md">{metrics.savingsProgressPercent}%</span>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold font-mono text-zinc-950">
            {formatINR(metrics.reservedSavings)}{" "}
            <span className="text-xs font-normal text-zinc-400">
              of {formatINR(metrics.totalSavingsTarget)}
            </span>
          </div>
          {/* Progress bar */}
          <div className="mt-3.5 w-full h-2 bg-zinc-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full transition-all duration-500"
              style={{ width: `${metrics.savingsProgressPercent}%` }}
            />
          </div>
        </motion.div>

        {/* Card 5: Upcoming Commitments */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.15 }}
          transition={{ duration: 0.45, delay: 0.25, ease: [0.22, 1, 0.36, 1] }}
          whileHover={{ y: -2, transition: { duration: 0.2 } }}
          className="p-6 rounded-2xl bg-white border border-zinc-200/80 relative shadow-sm hover:shadow-md transition-all"
        >
          <div className="flex items-center justify-between text-xs font-semibold text-zinc-500 mb-1.5 uppercase tracking-wider">
            <span>Upcoming Commitments</span>
            <span className="font-mono text-amber-700 font-bold bg-amber-50 px-2 py-0.5 rounded-md">{upcomingCommitments.length} Pending</span>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold font-mono text-zinc-950">
            {formatINR(metrics.remainingCommitments)}
          </div>
          <p className="mt-2.5 text-xs text-zinc-500">
            Essential obligations reserved and ring-fenced from safe-to-spend.
          </p>
        </motion.div>

        {/* Card 6: Explainable Health Score */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.15 }}
          transition={{ duration: 0.45, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
          whileHover={{ y: -2, transition: { duration: 0.2 } }}
          onClick={() => onNavigateTab("health")}
          className="p-6 rounded-2xl bg-white border border-zinc-200/80 hover:border-blue-300 cursor-pointer transition-all relative shadow-sm hover:shadow-md group"
        >
          <div className="flex items-center justify-between text-xs font-semibold text-zinc-500 mb-1.5 uppercase tracking-wider">
            <span>Financial Health</span>
            <span
              className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                metrics.healthStatus === "Strong"
                  ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                  : metrics.healthStatus === "Stable"
                  ? "bg-blue-50 text-blue-700 border border-blue-200"
                  : metrics.healthStatus === "Needs Attention"
                  ? "bg-amber-50 text-amber-700 border border-amber-200"
                  : "bg-rose-50 text-rose-700 border border-rose-200"
              }`}
            >
              {metrics.healthStatus}
            </span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl sm:text-4xl font-extrabold font-mono text-zinc-950">
              {metrics.healthScore}
            </span>
            <span className="text-xs text-zinc-400">/ 100</span>
          </div>
          <p className="mt-2.5 text-xs text-zinc-500 flex items-center justify-between">
            <span>Deterministic 4-pillar risk diagnosis</span>
            <ArrowRight className="w-3.5 h-3.5 text-blue-600 group-hover:translate-x-1 transition-transform" />
          </p>
        </motion.div>
      </div>

      {/* Quick Actions Strip */}
      <motion.div
        initial={{ opacity: 0, y: 18 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.2 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="p-4 sm:p-5 rounded-2xl bg-white border border-zinc-200/80 shadow-xs flex flex-wrap items-center justify-between gap-3"
      >
        <span className="text-xs font-bold text-zinc-500 uppercase tracking-wider pl-1">
          Decision Triggers:
        </span>
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => onNavigateTab("simulator")}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-colors shadow-sm cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5" />
            Simulate Purchase
          </button>
          <button
            onClick={onOpenAddExpense}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-zinc-800 bg-zinc-100 hover:bg-zinc-200 rounded-xl transition-colors cursor-pointer"
          >
            <PlusCircle className="w-3.5 h-3.5 text-blue-600" />
            Record Expense
          </button>
          <button
            onClick={onOpenAddCommitment}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-zinc-800 bg-zinc-100 hover:bg-zinc-200 rounded-xl transition-colors cursor-pointer"
          >
            <Calendar className="w-3.5 h-3.5 text-amber-600" />
            Add Commitment
          </button>
          <button
            onClick={() => onNavigateTab("health")}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-zinc-800 bg-zinc-100 hover:bg-zinc-200 rounded-xl transition-colors cursor-pointer"
          >
            <ShieldAlert className="w-3.5 h-3.5 text-rose-600" />
            Surprise Cost Test
          </button>
        </div>
      </motion.div>

      {/* 30-Day Runway Forecast Preview */}
      <motion.div
        initial={{ opacity: 0, y: 22 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.15 }}
        transition={{ duration: 0.5, delay: 0.08, ease: [0.22, 1, 0.36, 1] }}
        className="p-6 rounded-2xl bg-white border border-zinc-200/80 shadow-sm"
      >
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-bold text-zinc-950">30-Day Financial Runway</h3>
            <p className="text-xs text-zinc-500">
              Projected balance progression across the ₹10,000 planning window.
            </p>
          </div>
          <button
            onClick={() => onNavigateTab("forecast")}
            className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1 cursor-pointer"
          >
            Inspect Day-by-Day <ArrowRight className="w-3 h-3" />
          </button>
        </div>
        <ForecastChart data={forecastData} height={200} showScenario={false} />
      </motion.div>

      {/* 2-Column Split: Upcoming Commitments & Dynamic Insights */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Column 1: Upcoming Commitments List */}
        <motion.div
          initial={{ opacity: 0, y: 22 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.15 }}
          transition={{ duration: 0.5, delay: 0.12, ease: [0.22, 1, 0.36, 1] }}
          className="p-6 rounded-2xl bg-white border border-zinc-200/80 shadow-sm flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-zinc-900 uppercase tracking-wider">
                Upcoming Commitments ({upcomingCommitments.length})
              </h3>
              <button
                onClick={() => onNavigateTab("commitments")}
                className="text-xs font-semibold text-blue-600 hover:text-blue-700 cursor-pointer"
              >
                Manage All
              </button>
            </div>
            <div className="space-y-2.5">
              {upcomingCommitments.slice(0, 4).map((comm) => (
                <div
                  key={comm.id}
                  className="p-3.5 rounded-xl bg-zinc-50/80 border border-zinc-200/70 flex items-center justify-between hover:bg-zinc-100/60 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                    <div>
                      <div className="text-xs font-bold text-zinc-900">{comm.name}</div>
                      <div className="text-[11px] text-zinc-500">
                        Due on Day {comm.dueDay} · {comm.category}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-mono font-bold text-xs text-zinc-900">
                      {formatINR(comm.amount)}
                    </span>
                    <button
                      onClick={() => onMarkCommitmentPaid(comm.id)}
                      className="px-2.5 py-1 text-[11px] font-semibold rounded-lg bg-zinc-200/80 text-zinc-800 hover:bg-zinc-300 transition-colors cursor-pointer"
                    >
                      Pay
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="mt-4 pt-3.5 border-t border-zinc-100 text-[11px] text-zinc-500 flex justify-between font-medium">
            <span>Total Protected: {formatINR(metrics.remainingCommitments)}</span>
            <span>All 4 seeded bills covered</span>
          </div>
        </motion.div>

        {/* Column 2: Financial Insights */}
        <motion.div
          initial={{ opacity: 0, y: 22 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.15 }}
          transition={{ duration: 0.5, delay: 0.18, ease: [0.22, 1, 0.36, 1] }}
          className="p-6 rounded-2xl bg-white border border-zinc-200/80 shadow-sm flex flex-col justify-between"
        >
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-zinc-900 uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-blue-600" />
                Rule-Based Insights
              </h3>
              <span className="text-[10px] font-mono text-zinc-400 bg-zinc-100 px-2 py-0.5 rounded">Real-Time Derived</span>
            </div>
            <div className="space-y-3">
              {insights.map((text, idx) => (
                <div
                  key={idx}
                  className="p-3.5 rounded-xl bg-blue-50/50 border border-blue-100 text-xs text-zinc-700 leading-relaxed flex items-start gap-2.5"
                >
                  <span className="text-blue-600 font-bold text-sm leading-none mt-0.5">•</span>
                  <span>{text}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="mt-4 pt-3.5 border-t border-zinc-100 flex items-center justify-between text-xs text-zinc-500 font-medium">
            <span>Need to test a spending decision?</span>
            <button
              onClick={() => onNavigateTab("simulator")}
              className="text-blue-600 hover:text-blue-700 font-bold cursor-pointer"
            >
              Open Before You Spend →
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
