/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useRef } from "react";
import { useDialogAccessibility } from "./hooks/useDialogAccessibility";
import { readThemePreference, writeThemePreference } from "./services/themePreference";
import Lenis from "lenis";
import { motion, MotionConfig } from "framer-motion";
import { FinanceState, PurchaseScenario, Transaction, Commitment, SavingsGoal } from "./types/finance";
import { calculateMetrics, formatINR, generate30DayForecast } from "./services/financeCalculations";
import { loadFinanceState, saveFinanceState, resetFinanceState, exportFinanceStateJSON, isFinanceState } from "./services/storage";

// Components & Screens
import HeroGeometric from "./components/HeroGeometric";
import Navbar, { NavTab } from "./components/Navbar";

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
import type { LucideIcon } from "lucide-react";
import { LayoutDashboard, Sparkles, TrendingUp, PiggyBank, Calendar, HeartPulse } from "lucide-react";

// Navigation items
const NAV_ITEMS: { id: NavTab; label: string; icon: LucideIcon }[] = [
  { id: "overview", label: "Overview", icon: LayoutDashboard },
  { id: "simulator", label: "Decision Simulator", icon: Sparkles },
  { id: "forecast", label: "30-Day Forecast", icon: TrendingUp },
  { id: "savings", label: "Savings Goals", icon: PiggyBank },
  { id: "commitments", label: "Commitments", icon: Calendar },
  { id: "health", label: "Financial Health", icon: HeartPulse }
];

const MAX_FINANCIAL_AMOUNT = 10_000_000;
const createId = (prefix: string): string => {
  const uniquePart = typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  return `${prefix}-${uniquePart}`;
};
const isValidName = (value: string): boolean =>
  value.trim().length > 0 && value.trim().length <= 120 &&
  // eslint-disable-next-line no-control-regex -- reject ASCII control characters in user-entered names
  !/[\u0000-\u001F\u007F]/.test(value);
const isValidAmount = (value: number): boolean =>
  Number.isFinite(value) && value > 0 && value <= MAX_FINANCIAL_AMOUNT;

async function downloadFinancialReport(state: FinanceState, metrics: ReturnType<typeof calculateMetrics>) {
  // Load the PDF engine only when the user requests a report to keep initial JS lighter.
  const { jsPDF } = await import("jspdf");
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const left = 16;
  const right = pageWidth - 16;
  const money = (amount: number) => `${amount < 0 ? "-" : ""}INR ${Math.abs(amount).toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;
  const forecast = generate30DayForecast(state);
  const today = new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
  let y = 18;

  const ensureSpace = (height: number) => {
    if (y + height > pageHeight - 16) {
      doc.addPage();
      y = 18;
    }
  };
  const section = (heading: string) => {
    ensureSpace(12);
    doc.setFillColor(235, 242, 255);
    doc.roundedRect(left, y, right - left, 8, 2, 2, "F");
    doc.setTextColor(29, 78, 216);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.text(heading, left + 3, y + 5.4);
    y += 13;
  };

  // Header
  doc.setFillColor(15, 23, 42);
  doc.roundedRect(left, y, right - left, 29, 3, 3, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(20);
  doc.text("AFTERSPEND", left + 5, y + 10);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(203, 213, 225);
  doc.text("30-Day Financial Health Report", left + 5, y + 17);
  doc.text(`Generated ${today}  |  Current day ${state.currentDay} of ${state.planningDays}`, left + 5, y + 23);
  y += 37;

  section("FINANCIAL SNAPSHOT");
  const cards = [
    ["Starting budget", money(state.startingBudget + state.confirmedIncome)],
    ["Projected balance", money(metrics.projectedBalance)],
    ["Safe-to-spend", money(metrics.uncommittedFunds)],
    ["Daily allowance", `${money(metrics.dailyDiscretionaryAllowance)} / day`]
  ];
  const cardGap = 4;
  const cardW = (right - left - cardGap) / 2;
  cards.forEach(([label, value], index) => {
    const col = index % 2;
    const row = Math.floor(index / 2);
    const x = left + col * (cardW + cardGap);
    const cy = y + row * 18;
    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(x, cy, cardW, 14, 2, 2, "FD");
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.text(label, x + 3, cy + 5);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(label === "Safe-to-spend" && metrics.uncommittedFunds < 0 ? 190 : 15, label === "Safe-to-spend" && metrics.uncommittedFunds < 0 ? 24 : 23, label === "Safe-to-spend" && metrics.uncommittedFunds < 0 ? 39 : 42);
    doc.text(value, x + 3, cy + 10.5);
  });
  y += 43;

  section("FINANCIAL HEALTH STATUS");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.setTextColor(metrics.healthScore >= 75 ? 5 : 180, metrics.healthScore >= 75 ? 150 : 83, metrics.healthScore >= 75 ? 105 : 9);
  doc.text(`${metrics.healthStatus}  ·  ${metrics.healthScore}/100`, left, y);
  y += 7;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(71, 85, 105);
  const healthLines = [
    `Commitment coverage: ${Math.round(metrics.healthBreakdown.commitmentCoverage)}%`,
    `Emergency resilience: ${Math.round(metrics.healthBreakdown.emergencyResilience)}%`,
    `Savings progress: ${Math.round(metrics.healthBreakdown.savingsProgress)}%`,
    `Budget sustainability: ${Math.round(metrics.healthBreakdown.budgetSustainability)}%`
  ];
  healthLines.forEach((line, index) => doc.text(line, left + (index % 2) * 88, y + Math.floor(index / 2) * 6));
  y += 17;

  section("30-DAY FORECAST");
  const cols = [left, left + 23, left + 73, left + 123, right];
  doc.setFillColor(15, 23, 42);
  doc.rect(left, y - 2, right - left, 8, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(255, 255, 255);
  doc.text("Day", cols[0] + 2, y + 3);
  doc.text("Projected balance", cols[1] + 2, y + 3);
  doc.text("Commitments", cols[2] + 2, y + 3);
  doc.text("Transactions", cols[3] + 2, y + 3);
  y += 9;
  forecast.forEach((day) => {
    ensureSpace(7);
    if (day.day % 2 === 0) {
      doc.setFillColor(248, 250, 252);
      doc.rect(left, y - 4, right - left, 6.5, "F");
    }
    const commitmentTotal = day.commitmentsDue.reduce((sum, item) => sum + item.amount, 0);
    const transactionTotal = day.transactionsOnDay.reduce((sum, item) => sum + item.amount, 0);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(51, 65, 85);
    doc.text(String(day.day), cols[0] + 2, y);
    doc.text(money(day.projectedBalance), cols[1] + 2, y);
    doc.text(money(commitmentTotal), cols[2] + 2, y);
    doc.text(money(transactionTotal), cols[3] + 2, y);
    y += 6.5;
  });

  ensureSpace(28);
  y += 4;
  section("SAVINGS & COMMITMENTS");
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(71, 85, 105);
  const savingsTarget = state.savingsGoals.reduce((sum, goal) => sum + goal.targetAmount, 0);
  const savingsAllocated = state.savingsGoals.reduce((sum, goal) => sum + goal.allocatedAmount, 0);
  const openCommitments = state.commitments.filter((item) => item.status === "upcoming");
  const commitmentAmount = openCommitments.reduce((sum, item) => sum + item.amount, 0);
  doc.text(`Savings allocated: ${money(savingsAllocated)} of ${money(savingsTarget)}`, left, y);
  y += 6;
  doc.text(`Upcoming commitments: ${openCommitments.length} totaling ${money(commitmentAmount)}`, left, y);
  y += 8;
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  doc.text("This report is a planning estimate based on the information currently entered in AFTERSPEND. It is not financial advice.", left, Math.min(y, pageHeight - 12), { maxWidth: right - left });

  const pageCount = doc.getNumberOfPages();
  for (let page = 1; page <= pageCount; page += 1) {
    doc.setPage(page);
    doc.setDrawColor(226, 232, 240);
    doc.line(left, pageHeight - 10, right, pageHeight - 10);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    doc.setTextColor(100, 116, 139);
    doc.text("AFTERSPEND · Personal Finance Decision Simulator", left, pageHeight - 5);
    doc.text(`Page ${page} of ${pageCount}`, right, pageHeight - 5, { align: "right" });
  }
  doc.save(`afterspend-financial-report-${new Date().toISOString().slice(0, 10)}.pdf`);
}

export default function App() {
  const [state, setState] = useState<FinanceState>(() => loadFinanceState());
  const [activeTab, setActiveTab] = useState<NavTab>("overview");
  const [theme, setTheme] = useState<"light" | "dark">(() => readThemePreference());

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    document.documentElement.style.colorScheme = theme;
    writeThemePreference(theme);
  }, [theme]);

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
  const [reportMessage, setReportMessage] = useState("");
  const resetDialogRef = useRef<HTMLDivElement>(null);
  useDialogAccessibility(resetModalOpen, resetDialogRef, () => setResetModalOpen(false));

  const lenisRef = useRef<Lenis | null>(null);

  // Initialize smooth scrolling only when the user has not requested reduced motion.
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      orientation: "vertical",
      gestureOrientation: "vertical",
      smoothWheel: true
    });
    lenisRef.current = lenis;

    let rafId = 0;
    const raf = (time: number) => {
      lenis.raf(time);
      rafId = requestAnimationFrame(raf);
    };
    rafId = requestAnimationFrame(raf);

    return () => {
      // Cancel the latest frame in the recursive loop before destroying Lenis.
      cancelAnimationFrame(rafId);
      lenisRef.current = null;
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
        const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        el.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth" });
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
    if (!isValidName(scenario.name) || !isValidAmount(scenario.amount) || scenario.selectedOption === "skip") return;
    const targetDay = scenario.selectedOption === "postpone"
      ? Math.max(state.currentDay, Math.min(state.planningDays, scenario.postponeDay))
      : state.currentDay;
    if (!Number.isInteger(targetDay) || targetDay < 1 || targetDay > state.planningDays) return;
    const newTx: Transaction = {
      id: createId("tx-planned"),
      name: `[Planned] ${scenario.name.trim()}`,
      amount: scenario.amount,
      category: scenario.category.trim().slice(0, 80) || "Other",
      day: targetDay,
      status: "planned"
    };

    setState((prev) => {
      const next: FinanceState = {
        ...prev,
        transactions: [
          ...prev.transactions.filter((transaction) => !(
            transaction.status === "planned" && transaction.name === newTx.name
          )),
          newTx
        ]
      };
      return isFinanceState(next) ? next : prev;
    });
  };

  const handleMarkAsPurchased = (scenario: PurchaseScenario) => {
    if (!isValidName(scenario.name) || !isValidAmount(scenario.amount)) return;
    const newTx: Transaction = {
      id: createId("tx-confirmed"),
      name: scenario.name.trim(),
      amount: scenario.amount,
      category: scenario.category.trim().slice(0, 80) || "Other",
      day: state.currentDay,
      status: "confirmed"
    };

    setState((prev) => {
      const next: FinanceState = {
        ...prev,
        // Remove only the matching draft; keep unrelated historical transactions.
        transactions: [
          ...prev.transactions.filter((transaction) => !(
            transaction.status === "planned" && transaction.name === `[Planned] ${scenario.name.trim()}`
          )),
          newTx
        ]
      };
      return isFinanceState(next) ? next : prev;
    });
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
    if (!isValidName(expense.name) || !isValidAmount(expense.amount) ||
        !Number.isInteger(expense.day) || expense.day < 1 || expense.day > state.currentDay ||
        !expense.category.trim()) return;
    const newTx: Transaction = {
      ...expense,
      name: expense.name.trim(),
      category: expense.category.trim().slice(0, 80),
      id: createId("tx")
    };
    setState((prev) => {
      const next: FinanceState = { ...prev, transactions: [...prev.transactions, newTx] };
      return isFinanceState(next) ? next : prev;
    });
  };

  const handleAddCommitment = (comm: Omit<Commitment, "id">) => {
    if (!isValidName(comm.name) || !isValidAmount(comm.amount) ||
        !Number.isInteger(comm.dueDay) || comm.dueDay < 1 || comm.dueDay > state.planningDays ||
        !comm.category.trim()) return;
    const newComm: Commitment = {
      ...comm,
      name: comm.name.trim(),
      category: comm.category.trim().slice(0, 80),
      id: createId("comm")
    };
    setState((prev) => {
      const next: FinanceState = { ...prev, commitments: [...prev.commitments, newComm] };
      return isFinanceState(next) ? next : prev;
    });
  };

  const handleMarkCommitmentPaid = (commId: string) => {
    setState((prev) => {
      const target = prev.commitments.find((commitment) => commitment.id === commId);
      if (!target || target.status !== "upcoming") return prev;
      // Marking a commitment paid removes it from the reserved commitments and
      // adds one confirmed transaction, so the expense is deducted exactly once.
      const autoTx: Transaction = {
        id: createId("tx-commitment-paid"),
        name: `Paid: ${target.name}`,
        amount: target.amount,
        category: target.category,
        day: prev.currentDay,
        status: "confirmed"
      };
      const next: FinanceState = {
        ...prev,
        commitments: prev.commitments.map((commitment) =>
          commitment.id === commId ? { ...commitment, status: "paid" as const } : commitment
        ),
        transactions: [...prev.transactions, autoTx]
      };
      return isFinanceState(next) ? next : prev;
    });
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
    if (!Number.isFinite(newAllocated) || newAllocated < 0 || newAllocated > MAX_FINANCIAL_AMOUNT) return;
    setState((prev) => {
      const next: FinanceState = {
        ...prev,
        savingsGoals: prev.savingsGoals.map((goal) => goal.id === goalId
          ? { ...goal, allocatedAmount: Math.min(goal.targetAmount, newAllocated) }
          : goal)
      };
      return isFinanceState(next) ? next : prev;
    });
  };

  const handleAddGoal = (goal: Omit<SavingsGoal, "id">) => {
    if (!isValidName(goal.name) || !isValidAmount(goal.targetAmount) ||
        !Number.isFinite(goal.allocatedAmount) || goal.allocatedAmount < 0 ||
        !goal.category.trim()) return;
    const newGoal: SavingsGoal = {
      ...goal,
      name: goal.name.trim(),
      targetAmount: goal.targetAmount,
      allocatedAmount: Math.min(goal.targetAmount, goal.allocatedAmount),
      category: goal.category.trim().slice(0, 80),
      id: createId("goal")
    };
    setState((prev) => {
      const next: FinanceState = { ...prev, savingsGoals: [...prev.savingsGoals, newGoal] };
      return isFinanceState(next) ? next : prev;
    });
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
    <MotionConfig reducedMotion="user">
    <div data-theme={theme} className="app-shell min-h-screen bg-[#F8FAFC] text-zinc-900 font-sans selection:bg-blue-600 selection:text-white transition-colors duration-200">
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
        theme={theme}
        onToggleTheme={() => setTheme((current) => current === "dark" ? "light" : "dark")}
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

        {/* Floating Quick Summary Dashboard Cards Overlaid At Base Of Hero */}
        <motion.div
          initial={{ opacity: 0, y: 32 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="relative z-20 -mt-10 mb-8 max-w-5xl mx-auto px-4"
        >
          <div className="p-3.5 sm:p-4 rounded-2xl bg-white/95 backdrop-blur-xl border border-zinc-200/80 shadow-xl grid grid-cols-2 md:grid-cols-4 gap-3">
            {/* Card 1: Safe-to-Spend */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.45, delay: 0.05, ease: [0.22, 1, 0.36, 1] }}
              whileHover={{ y: -2, transition: { duration: 0.2 } }}
              className="p-3.5 rounded-xl bg-zinc-50/70 border border-zinc-200/60 hover:bg-white hover:border-emerald-200 transition-all flex flex-col justify-between"
            >
              <div className="flex items-center justify-between gap-1">
                <span className="text-[10px] sm:text-[11px] text-zinc-500 font-semibold uppercase tracking-wider">Safe-to-Spend</span>
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              </div>
              <div
                className={`text-xl sm:text-2xl font-black font-mono tracking-tight mt-1 ${
                  baselineMetrics.uncommittedFunds >= 0
                    ? "text-emerald-600"
                    : "text-rose-600"
                }`}
              >
                {formatINR(baselineMetrics.uncommittedFunds)}
              </div>
              <span className="text-[10px] text-zinc-400 font-mono mt-0.5">Uncommitted funds</span>
            </motion.div>

            {/* Card 2: Daily Allowance */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.45, delay: 0.12, ease: [0.22, 1, 0.36, 1] }}
              whileHover={{ y: -2, transition: { duration: 0.2 } }}
              className="p-3.5 rounded-xl bg-zinc-50/70 border border-zinc-200/60 hover:bg-white hover:border-blue-200 transition-all flex flex-col justify-between"
            >
              <span className="text-[10px] sm:text-[11px] text-zinc-500 font-semibold uppercase tracking-wider">Daily Allowance</span>
              <div className="text-xl sm:text-2xl font-bold font-mono text-zinc-900 mt-1">
                {formatINR(baselineMetrics.dailyDiscretionaryAllowance, true)}
                <span className="text-xs font-normal text-zinc-400 font-sans">/d</span>
              </div>
              <span className="text-[10px] text-zinc-400 font-mono mt-0.5">30-day runway pace</span>
            </motion.div>

            {/* Card 3: Health Score */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.45, delay: 0.19, ease: [0.22, 1, 0.36, 1] }}
              whileHover={{ y: -2, transition: { duration: 0.2 } }}
              onClick={() => handleSelectTab("health")}
              className="p-3.5 rounded-xl bg-zinc-50/70 border border-zinc-200/60 hover:bg-white hover:border-indigo-200 transition-all flex flex-col justify-between cursor-pointer group"
            >
              <div className="flex items-center justify-between gap-1">
                <span className="text-[10px] sm:text-[11px] text-zinc-500 font-semibold uppercase tracking-wider">Health Score</span>
                <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded">
                  {baselineMetrics.healthStatus}
                </span>
              </div>
              <div className="text-xl sm:text-2xl font-bold font-mono text-indigo-600 mt-1">
                {baselineMetrics.healthScore}<span className="text-xs text-zinc-400 font-sans font-medium">/100</span>
              </div>
              <span className="text-[10px] text-zinc-400 group-hover:text-indigo-600 transition-colors mt-0.5">Audit diagnosis →</span>
            </motion.div>

            {/* Card 4: Quick Action Trigger */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.45, delay: 0.26, ease: [0.22, 1, 0.36, 1] }}
              whileHover={{ y: -2, transition: { duration: 0.2 } }}
              className="p-3.5 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white shadow-sm flex flex-col justify-between cursor-pointer hover:shadow-md transition-all group"
              onClick={() => handleSelectTab("simulator")}
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] sm:text-[11px] text-blue-100 font-semibold uppercase tracking-wider">Quick Action</span>
                <Sparkles className="w-3.5 h-3.5 text-blue-200 group-hover:rotate-12 transition-transform" />
              </div>
              <div className="text-sm font-bold tracking-tight text-white mt-1 leading-tight">
                Simulate ₹2,000 Spend
              </div>
              <span className="text-[10px] text-blue-100 font-medium mt-0.5 group-hover:underline">
                Run scenario test →
              </span>
            </motion.div>
          </div>
        </motion.div>
      </section>

      {/* 3. MAIN DASHBOARD CONTENT AREA */}
      <main id="main-content" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12 py-8 space-y-8">
        {/* Navigation Tabs Bar (PRD Section 7) */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.5, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
          className="flex items-center overflow-x-auto no-scrollbar gap-2 p-1.5 rounded-2xl bg-white/90 backdrop-blur-md border border-zinc-200/80 shadow-xs"
        >
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
        </motion.div>

        {/* Active Screen View */}
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
        >
          {activeTab === "overview" && (
            <OverviewScreen
              state={state}
              metrics={baselineMetrics}
              scenario={currentScenario}
              onNavigateTab={(tab) => handleSelectTab(tab as NavTab)}
              onOpenAddExpense={() => setExpenseModalOpen(true)}
              onOpenAddCommitment={() => setCommitmentModalOpen(true)}
              onMarkCommitmentPaid={handleMarkCommitmentPaid}
              reportMessage={reportMessage}
              onDownloadReport={async () => {
                setReportMessage("Preparing your financial report…");
                try {
                  await downloadFinancialReport(state, baselineMetrics);
                  setReportMessage("Financial report downloaded successfully.");
                } catch (error) {
                  console.error("Financial report generation failed.", error);
                  setReportMessage("Unable to generate the report. Please try again.");
                }
              }}
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
        </motion.div>
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
          <div ref={resetDialogRef} tabIndex={-1} role="dialog" aria-modal="true" aria-labelledby="reset-dialog-title" className="w-full max-w-md p-6 rounded-2xl bg-white border border-zinc-200 shadow-2xl space-y-4">
            <h4 id="reset-dialog-title" className="text-base font-bold text-rose-600">Reset to Demo State?</h4>
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
    </MotionConfig>
  );
}
