/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from "react";
import Lenis from "lenis";
import {
  FinanceState,
  PurchaseScenario,
  Transaction,
  Commitment,
  SavingsGoal
} from "./types/finance";
import {
  calculateMetrics,
  formatINR
} from "./services/financeCalculations";
import {
  loadFinanceState,
  saveFinanceState,
  resetFinanceState,
  exportFinanceStateJSON
} from "./services/storage";

// Components & Screens
import HeroGeometric from "./components/HeroGeometric";
import Navbar, { NavTab } from "./components/Navbar";
import MorphingSearchBar from "./components/MorphingSearchBar";
import OverviewScreen from "./components/screens/OverviewScreen";
import SimulatorScreen from "./components/screens/SimulatorScreen";
import ForecastScreen from "./components/screens/ForecastScreen";
import SavingsScreen from "./components/screens/SavingsScreen";
import CommitmentsScreen from "./components/screens/CommitmentsScreen";
import HealthScreen from "./components/screens/HealthScreen";

// Modals
import AddExpenseModal from "./components/modals/AddExpenseModal";
import AddCommitmentModal from "./components/modals/AddCommitmentModal";

// Icons
import {
  LayoutDashboard,
  Sparkles,
  TrendingUp,
  PiggyBank,
  Calendar,
  HeartPulse,
  RotateCcw,
  Download,
  AlertCircle,
  Shield,
  CheckCircle,
  HelpCircle
} from "lucide-react";

// Navigation items
const NAV_ITEMS: { id: NavTab; label: string; icon: any }[] = [
  { id: "overview", label: "Overview", icon: LayoutDashboard },
  { id: "simulator", label: "Decision Simulator", icon: Sparkles },
  { id: "forecast", label: "30-Day Forecast", icon: TrendingUp },
  { id: "savings", label: "Savings Goals", icon: PiggyBank },
  { id: "commitments", label: "Commitments", icon: Calendar },
  { id: "health", label: "Financial Health", icon: HeartPulse }
];

export default function App() {
  const [state, setState] = useState<FinanceState>(() => loadFinanceState());
  const [activeTab, setActiveTab] = useState<NavTab>("overview");

  // Signature decision scenario
  const [currentScenario, setCurrentScenario] = useState<PurchaseScenario>({
    name: "Wireless Headphones",
    amount: 2000,
    category: "Shopping",
    proposedDay: 1,
    priority: "discretionary",
    selectedOption: "now",
    postponeDay: 15
  });

  // Modals
  const [expenseModalOpen, setExpenseModalOpen] = useState(false);
  const [commitmentModalOpen, setCommitmentModalOpen] = useState(false);
  const [resetModalOpen, setResetModalOpen] = useState(false);

  const lenisRef = useRef<Lenis | null>(null);

  // Initialize Lenis smooth scroll
  useEffect(() => {
    const lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      orientation: "vertical",
      gestureOrientation: "vertical",
      smoothWheel: true
    });
    lenisRef.current = lenis;

    function raf(time: number) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    }
    const rafId = requestAnimationFrame(raf);

    return () => {
      cancelAnimationFrame(rafId);
      lenis.destroy();
    };
  }, []);

  // Save state to localStorage on state changes
  useEffect(() => {
    saveFinanceState(state);
  }, [state]);

  const scrollToAppMain = () => {
    const el = document.getElementById("main-content");
    if (el) {
      if (lenisRef.current) {
        lenisRef.current.scrollTo(el, { offset: -80 });
      } else {
        el.scrollIntoView({ behavior: "smooth" });
      }
    }
  };

  const handleSelectTab = (tab: NavTab) => {
    setActiveTab(tab);
    scrollToAppMain();
  };

  // Centralized calculations
  const baselineMetrics = calculateMetrics(state, undefined);

  // --- Handlers for Shared Financial State ---

  const handleApplyToPlan = (scenario: PurchaseScenario) => {
    if (scenario.amount <= 0) return;
    const newTx: Transaction = {
      id: "tx-planned-" + Date.now(),
      name: `[Planned] ${scenario.name}`,
      amount: scenario.amount,
      category: scenario.category,
      day: scenario.selectedOption === "postpone" ? scenario.postponeDay : scenario.proposedDay,
      status: "planned"
    };

    setState((prev) => ({
      ...prev,
      transactions: [
        ...prev.transactions.filter((t) => t.id !== newTx.id),
        newTx
      ]
    }));
  };

  const handleMarkAsPurchased = (scenario: PurchaseScenario) => {
    if (scenario.amount <= 0) return;
    const newTx: Transaction = {
      id: "tx-conf-" + Date.now(),
      name: scenario.name,
      amount: scenario.amount,
      category: scenario.category,
      day: state.currentDay,
      status: "confirmed"
    };

    setState((prev) => ({
      ...prev,
      transactions: [
        ...prev.transactions.filter((t) => !t.name.includes(scenario.name)),
        newTx
      ]
    }));
  };

  const handleResetScenario = () => {
    setCurrentScenario({
      name: "Wireless Headphones",
      amount: 2000,
      category: "Shopping",
      proposedDay: 1,
      priority: "discretionary",
      selectedOption: "now",
      postponeDay: 15
    });
  };

  const handleAddExpense = (expense: Omit<Transaction, "id">) => {
    const newTx: Transaction = {
      ...expense,
      id: "tx-" + Date.now()
    };
    setState((prev) => ({
      ...prev,
      transactions: [...prev.transactions, newTx]
    }));
  };

  const handleAddCommitment = (comm: Omit<Commitment, "id">) => {
    const newComm: Commitment = {
      ...comm,
      id: "comm-" + Date.now()
    };
    setState((prev) => ({
      ...prev,
      commitments: [...prev.commitments, newComm]
    }));
  };

  const handleMarkCommitmentPaid = (commId: string) => {
    const target = state.commitments.find((c) => c.id === commId);
    if (!target) return;

    // Convert reserved commitment to confirmed transaction without double deduction
    const autoTx: Transaction = {
      id: "tx-comm-paid-" + Date.now(),
      name: `Paid: ${target.name}`,
      amount: target.amount,
      category: target.category,
      day: state.currentDay,
      status: "confirmed"
    };

    setState((prev) => ({
      ...prev,
      commitments: prev.commitments.map((c) =>
        c.id === commId ? { ...c, status: "paid" as const } : c
      ),
      transactions: [...prev.transactions, autoTx]
    }));
  };

  const handleCancelCommitment = (commId: string) => {
    setState((prev) => ({
      ...prev,
      commitments: prev.commitments.map((c) =>
        c.id === commId ? { ...c, status: "cancelled" as const } : c
      )
    }));
  };

  const handleDeleteCommitment = (commId: string) => {
    setState((prev) => ({
      ...prev,
      commitments: prev.commitments.filter((c) => c.id !== commId)
    }));
  };

  const handleUpdateGoalAllocation = (goalId: string, newAllocated: number) => {
    setState((prev) => ({
      ...prev,
      savingsGoals: prev.savingsGoals.map((g) =>
        g.id === goalId ? { ...g, allocatedAmount: newAllocated } : g
      )
    }));
  };

  const handleAddGoal = (goal: Omit<SavingsGoal, "id">) => {
    const newGoal: SavingsGoal = {
      ...goal,
      id: "goal-" + Date.now()
    };
    setState((prev) => ({
      ...prev,
      savingsGoals: [...prev.savingsGoals, newGoal]
    }));
  };

  const handleDeleteGoal = (goalId: string) => {
    setState((prev) => ({
      ...prev,
      savingsGoals: prev.savingsGoals.filter((g) => g.id !== goalId)
    }));
  };

  const handleConfirmResetState = () => {
    const fresh = resetFinanceState();
    setState(fresh);
    setResetModalOpen(false);
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-zinc-900 font-sans selection:bg-blue-600 selection:text-white">
      {/* 1. TOP NAVBAR */}
      <Navbar
        activeTab={activeTab}
        onSelectTab={handleSelectTab}
        state={state}
        metrics={baselineMetrics}
        onOpenAddExpense={() => setExpenseModalOpen(true)}
        onOpenAddCommitment={() => setCommitmentModalOpen(true)}
        onExportJSON={() => exportFinanceStateJSON(state)}
        onResetDemo={() => setResetModalOpen(true)}
        onSelectSimulatorPreset={(pName, pAmount) => {
          setCurrentScenario((prev) => ({
            ...prev,
            name: pName,
            amount: pAmount
          }));
          handleSelectTab("simulator");
        }}
      />

      {/* 2. HERO SECTION WITH EXACT HeroGeometric WEBGL SHADER */}
      <section className="relative w-full border-b border-zinc-200/80 overflow-hidden bg-white">
        <HeroGeometric
          title1="AFTERSPEND"
          title2="Spend in the present. See consequences in advance."
          description="A 100% client-side financial decision simulator for ₹10,000 / 30-day budgets. Test spending choices, protect ₹2,000 savings, and audit upcoming commitments before spending a single rupee."
          color1="#3B82F6"
          color2="#F0F9FF"
          speed={0.5}
        >
          <div className="flex flex-wrap items-center justify-center gap-3 mt-2">
            <button
              onClick={() => handleSelectTab("simulator")}
              className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs sm:text-sm shadow-md hover:shadow-lg transition-all flex items-center gap-2 cursor-pointer"
            >
              <Sparkles className="w-4 h-4" />
              <span>Simulate ₹2,000 Purchase</span>
            </button>
            <button
              onClick={() => handleSelectTab("forecast")}
              className="px-5 py-2.5 rounded-xl bg-white/90 hover:bg-white text-zinc-800 font-semibold text-xs sm:text-sm border border-zinc-200 shadow-xs hover:shadow-md transition-all flex items-center gap-2 cursor-pointer"
            >
              <TrendingUp className="w-4 h-4 text-blue-600" />
              <span>View 30-Day Runway</span>
            </button>
          </div>
        </HeroGeometric>

        {/* Floating Quick Summary Bar Overlaid At Base Of Hero */}
        <div className="relative z-20 -mt-10 mb-8 max-w-5xl mx-auto px-4">
          <div className="p-4 sm:p-5 rounded-2xl bg-white/95 backdrop-blur-xl border border-zinc-200/80 shadow-xl flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-6">
              <div>
                <span className="text-[11px] text-zinc-500 block font-semibold uppercase tracking-wider">Safe-to-Spend</span>
                <span
                  className={`text-2xl font-black font-mono tracking-tight ${
                    baselineMetrics.uncommittedFunds >= 0
                      ? "text-emerald-600"
                      : "text-rose-600"
                  }`}
                >
                  {formatINR(baselineMetrics.uncommittedFunds)}
                </span>
              </div>

              <div className="h-8 w-px bg-zinc-200 hidden sm:block" />

              <div>
                <span className="text-[11px] text-zinc-500 block font-semibold uppercase tracking-wider">Daily Allowance</span>
                <span className="text-2xl font-bold font-mono text-zinc-900">
                  {formatINR(baselineMetrics.dailyDiscretionaryAllowance, true)}/d
                </span>
              </div>

              <div className="h-8 w-px bg-zinc-200 hidden sm:block" />

              <div className="hidden sm:block">
                <span className="text-[11px] text-zinc-500 block font-semibold uppercase tracking-wider">Health Score</span>
                <span className="text-2xl font-bold font-mono text-indigo-600">
                  {baselineMetrics.healthScore}/100 <span className="text-xs font-medium text-zinc-500 font-sans">({baselineMetrics.healthStatus})</span>
                </span>
              </div>
            </div>

            <button
              onClick={() => handleSelectTab("simulator")}
              className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-all shadow-sm shrink-0 cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5" />
              Simulate ₹2,000 Purchase
            </button>
          </div>
        </div>
      </section>

      {/* 3. MAIN DASHBOARD CONTENT AREA */}
      <main id="main-content" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12 py-8 space-y-8">
        {/* Navigation Tabs Bar (PRD Section 7) */}
        <div className="flex items-center overflow-x-auto no-scrollbar gap-2 p-1.5 rounded-2xl bg-white/90 backdrop-blur-md border border-zinc-200/80 shadow-xs">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleSelectTab(item.id)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                  isActive
                    ? "bg-blue-600 text-white shadow-sm"
                    : "text-zinc-600 hover:text-zinc-950 hover:bg-zinc-100/80"
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>

        {/* Active Screen View */}
        {activeTab === "overview" && (
          <OverviewScreen
            state={state}
            metrics={baselineMetrics}
            scenario={currentScenario}
            onNavigateTab={(tab) => handleSelectTab(tab as NavTab)}
            onOpenAddExpense={() => setExpenseModalOpen(true)}
            onOpenAddCommitment={() => setCommitmentModalOpen(true)}
            onMarkCommitmentPaid={handleMarkCommitmentPaid}
          />
        )}

        {activeTab === "simulator" && (
          <SimulatorScreen
            state={state}
            currentScenario={currentScenario}
            onUpdateScenario={(sc) => setCurrentScenario(sc)}
            onApplyToPlan={handleApplyToPlan}
            onMarkAsPurchased={handleMarkAsPurchased}
            onResetScenario={handleResetScenario}
          />
        )}

        {activeTab === "forecast" && (
          <ForecastScreen
            state={state}
            metrics={baselineMetrics}
            scenario={currentScenario}
          />
        )}

        {activeTab === "savings" && (
          <SavingsScreen
            state={state}
            metrics={baselineMetrics}
            onUpdateGoalAllocation={handleUpdateGoalAllocation}
            onAddGoal={handleAddGoal}
            onDeleteGoal={handleDeleteGoal}
          />
        )}

        {activeTab === "commitments" && (
          <CommitmentsScreen
            state={state}
            metrics={baselineMetrics}
            onAddCommitment={handleAddCommitment}
            onMarkPaid={handleMarkCommitmentPaid}
            onCancelCommitment={handleCancelCommitment}
            onDeleteCommitment={handleDeleteCommitment}
          />
        )}

        {activeTab === "health" && (
          <HealthScreen state={state} metrics={baselineMetrics} />
        )}
      </main>

      {/* 4. MODALS */}
      <AddExpenseModal
        isOpen={expenseModalOpen}
        onClose={() => setExpenseModalOpen(false)}
        onAddExpense={handleAddExpense}
        currentDay={state.currentDay}
      />

      <AddCommitmentModal
        isOpen={commitmentModalOpen}
        onClose={() => setCommitmentModalOpen(false)}
        onAddCommitment={handleAddCommitment}
      />

      {/* Reset Confirmation Modal */}
      {resetModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/40 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-md p-6 rounded-2xl bg-white border border-zinc-200 shadow-2xl space-y-4">
            <h4 className="text-base font-bold text-rose-600">Reset to Demo State?</h4>
            <p className="text-xs text-zinc-600 leading-relaxed">
              This will clear local edits and restore the canonical hackathon scenario:
              <br />
              <strong className="text-zinc-900">₹10,000 starting budget, ₹2,000 protected savings, and ₹1,500 across 4 seeded commitments.</strong>
            </p>
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setResetModalOpen(false)}
                className="px-3.5 py-2 text-xs font-semibold text-zinc-700 hover:text-zinc-900 bg-zinc-100 hover:bg-zinc-200/80 rounded-xl cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmResetState}
                className="px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-xs cursor-pointer"
              >
                Reset Everything
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 5. QUIET FINTECH FOOTER */}
      <footer className="mt-20 border-t border-zinc-200/80 py-10 px-4 sm:px-8 lg:px-12 bg-white text-xs text-zinc-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="font-bold text-zinc-900">AFTERSPEND</span>
            <span>·</span>
            <span>100% Frontend-Only Financial Decision Simulator</span>
          </div>
          <div className="flex items-center gap-6 font-mono text-[11px] text-zinc-500">
            <span>PROMPT RUN 2026</span>
            <span>·</span>
            <span>₹10,000 / 30-Day Engine</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
