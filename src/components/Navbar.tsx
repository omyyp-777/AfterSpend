/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { LayoutDashboard, Sparkles, TrendingUp, PiggyBank, Calendar, HeartPulse, Plus, RotateCcw, Download, Bell, Menu, X, ChevronDown, ShieldCheck, Wallet, Clock, ArrowUpRight, Activity, Moon, Sun } from "lucide-react";
import MorphingSearchBar from "./MorphingSearchBar";
import { formatINR } from "../services/financeCalculations";
import { CalculatedMetrics, FinanceState } from "../types/finance";

export type NavTab = "overview" | "simulator" | "forecast" | "savings" | "commitments" | "health";

export interface NavbarProps {
  activeTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  state: FinanceState;
  metrics: CalculatedMetrics;
  onOpenAddExpense: () => void;
  onOpenAddCommitment: () => void;
  onExportJSON: () => void;
  onResetDemo: () => void;
  onSelectSimulatorPreset: (name: string, amount: number) => void;
  theme: "light" | "dark";
  onToggleTheme: () => void;
}

const NAV_ITEMS: { id: NavTab; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: "overview", label: "Overview", icon: LayoutDashboard },
  { id: "simulator", label: "Simulator", icon: Sparkles },
  { id: "forecast", label: "30-Day Forecast", icon: TrendingUp },
  { id: "savings", label: "Savings Goals", icon: PiggyBank },
  { id: "commitments", label: "Commitments", icon: Calendar },
  { id: "health", label: "Health Score", icon: HeartPulse }
];

export default function Navbar({
  activeTab,
  onSelectTab,
  state,
  metrics,
  onOpenAddExpense,
  onOpenAddCommitment,
  onExportJSON,
  onResetDemo,
  onSelectSimulatorPreset,
  theme,
  onToggleTheme
}: NavbarProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [pulseDropdownOpen, setPulseDropdownOpen] = useState(false);
  const [insightsDropdownOpen, setInsightsDropdownOpen] = useState(false);
  const [actionMenuOpen, setActionMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  const pulseRef = useRef<HTMLDivElement>(null);
  const insightsRef = useRef<HTMLDivElement>(null);
  const actionMenuRef = useRef<HTMLDivElement>(null);

  // Track scroll state for enhanced glassmorphism elevation
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Close dropdowns on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const target = event.target as Node;
      if (pulseRef.current && !pulseRef.current.contains(target)) {
        setPulseDropdownOpen(false);
      }
      if (insightsRef.current && !insightsRef.current.contains(target)) {
        setInsightsDropdownOpen(false);
      }
      if (actionMenuRef.current && !actionMenuRef.current.contains(target)) {
        setActionMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const upcomingCommitments = state.commitments.filter(
    (c) => c.status === "upcoming" && c.dueDay >= state.currentDay
  );

  const isSafe = metrics.uncommittedFunds >= 0;
  const cyclePercent = Math.min(100, Math.round((state.currentDay / state.planningDays) * 100));

  return (
    <header
      className={`sticky top-0 z-50 transition-all duration-300 ${
        scrolled
          ? "bg-white/85 backdrop-blur-xl border-b border-zinc-200/80 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.06)]"
          : "bg-white/95 backdrop-blur-md border-b border-zinc-200/70 shadow-xs"
      }`}
    >
      {/* Top Hairline Gradient Accent Line */}
      <div className="h-[2px] w-full bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-500 opacity-90" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-2 lg:gap-4">
          
          {/* ================= LEFT: Brand & Cycle Tracker ================= */}
          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={() => onSelectTab("overview")}
              className="flex items-center gap-3 group text-left cursor-pointer focus:outline-hidden focus-visible:ring-2 focus-visible:ring-blue-600 rounded-xl p-1 -m-1 transition-transform"
              aria-label="AFTERSPEND Home"
            >
              {/* Premium Brand Monogram Squircle */}
              <div className="relative w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 via-blue-700 to-indigo-600 text-white flex items-center justify-center font-black font-mono text-sm tracking-tighter shadow-sm shadow-blue-500/20 ring-1 ring-white/30 group-hover:scale-105 group-hover:shadow-blue-500/30 transition-all duration-200">
                <span className="font-mono tracking-tighter font-extrabold text-[13px]">AS</span>
                <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-cyan-400 ring-2 ring-white" />
              </div>

              <div className="flex flex-col">
                <div className="flex items-center gap-1.5">
                  <span className="font-montserrat text-[17px] font-black tracking-tight text-zinc-950 group-hover:text-blue-600 transition-colors leading-none">
                    AFTERSPEND
                  </span>
                  <span className="hidden sm:inline-flex items-center px-1.5 py-0.2 text-[9px] font-mono font-bold uppercase tracking-wider text-blue-700 bg-blue-50 border border-blue-200/60 rounded">
                    PRO
                  </span>
                </div>
                <div className="flex items-center gap-1 text-[11px] text-zinc-500 font-medium tracking-tight mt-0.5">
                  <span className="font-mono">₹10K</span>
                  <span>·</span>
                  <span>30-Day Decision Simulator</span>
                </div>
              </div>
            </button>

            {/* Subtle Divider & Live Cycle Progress */}
            <div className="hidden xl:flex items-center gap-3 pl-3.5 ml-2 border-l border-zinc-200/90">
              <div className="flex flex-col">
                <div className="flex items-center justify-between gap-3 text-[11px] font-mono">
                  <div className="flex items-center gap-1.5 font-semibold text-zinc-700">
                    <Clock className="w-3 h-3 text-blue-600" />
                    <span>Day {state.currentDay} of {state.planningDays}</span>
                  </div>
                  <span className="text-[10px] text-zinc-400 font-normal">
                    {state.planningDays - state.currentDay}d left
                  </span>
                </div>
                <div className="w-28 h-1.5 bg-zinc-100 rounded-full overflow-hidden mt-1 ring-1 ring-zinc-200/50">
                  <div
                    className="h-full bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full transition-all duration-500"
                    style={{ width: `${cyclePercent}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* ================= CENTER: Nav Links with Animated Gliding Pill ================= */}
          <nav className="hidden lg:flex items-center p-1 bg-zinc-100/70 border border-zinc-200/60 rounded-xl relative">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => onSelectTab(item.id)}
                  className={`relative px-3 py-1.5 rounded-lg text-xs font-semibold tracking-tight transition-all duration-200 flex items-center gap-1.5 cursor-pointer focus:outline-hidden focus-visible:ring-2 focus-visible:ring-blue-500 z-10 ${
                    isActive
                      ? "text-blue-700 font-bold"
                      : "text-zinc-600 hover:text-zinc-950"
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 transition-colors ${isActive ? "text-blue-600" : "text-zinc-400"}`} />
                  <span className="font-medium">{item.label}</span>

                  {/* Commitments badge if any upcoming */}
                  {item.id === "commitments" && upcomingCommitments.length > 0 && (
                    <span className={`text-[10px] font-mono px-1 py-0.2 rounded-full font-bold ${
                      isActive ? "bg-blue-200/70 text-blue-900" : "bg-zinc-200 text-zinc-700"
                    }`}>
                      {upcomingCommitments.length}
                    </span>
                  )}

                  {/* Active Tab Sliding Pill via Framer Motion */}
                  {isActive && (
                    <motion.div
                      layoutId="navbar-active-pill"
                      className="absolute inset-0 bg-white rounded-lg shadow-xs border border-zinc-200/70 -z-10"
                      transition={{ type: "spring", stiffness: 450, damping: 35 }}
                    />
                  )}
                </button>
              );
            })}
          </nav>

          {/* ================= RIGHT: Live Status, Search & Action Triggers ================= */}
          <div className="flex items-center gap-2 sm:gap-2.5">

            {/* Live Safe-to-Spend Ticker / Runway Pulse Dropdown */}
            <div className="relative" ref={pulseRef}>
              <button
                onClick={() => setPulseDropdownOpen((prev) => !prev)}
                className={`hidden md:flex items-center gap-2 px-3 py-1.5 rounded-xl border transition-all cursor-pointer text-xs shadow-2xs focus:outline-hidden focus-visible:ring-2 focus-visible:ring-blue-500 ${
                  isSafe
                    ? "bg-emerald-50/90 hover:bg-emerald-100/70 border-emerald-200/80 text-emerald-950"
                    : "bg-rose-50/90 hover:bg-rose-100/70 border-rose-200/80 text-rose-950"
                }`}
                title="View quick safe-to-spend balance pulse"
                aria-label="View live financial runway status"
              >
                <div className="relative flex items-center justify-center">
                  <span
                    className={`w-2 h-2 rounded-full ${
                      isSafe ? "bg-emerald-500" : "bg-rose-500"
                    }`}
                  />
                  <span
                    className={`absolute w-3 h-3 rounded-full animate-ping opacity-60 ${
                      isSafe ? "bg-emerald-400" : "bg-rose-400"
                    }`}
                  />
                </div>
                <div className="flex items-center gap-1 font-mono">
                  <span className="text-[11px] font-sans font-medium text-zinc-500 hidden xl:inline">Safe:</span>
                  <span className={`font-bold ${isSafe ? "text-emerald-700" : "text-rose-600"}`}>
                    {formatINR(metrics.uncommittedFunds)}
                  </span>
                </div>
                <ChevronDown className={`w-3 h-3 text-zinc-400 transition-transform duration-200 ${pulseDropdownOpen ? "rotate-180" : ""}`} />
              </button>

              {/* Quick Pulse Dropdown Menu */}
              <AnimatePresence>
                {pulseDropdownOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 8, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 6, scale: 0.98 }}
                    transition={{ duration: 0.18, ease: "easeOut" }}
                    className="absolute right-0 mt-2 w-80 p-4 rounded-2xl bg-white/95 backdrop-blur-xl border border-zinc-200/90 shadow-2xl z-50 text-xs space-y-3.5"
                  >
                    <div className="flex items-center justify-between pb-2.5 border-b border-zinc-100">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-blue-50 border border-blue-200/70 flex items-center justify-center text-blue-600">
                          <Wallet className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="font-bold text-zinc-900 text-xs">Financial Runway</div>
                          <div className="text-[10px] text-zinc-400">Day {state.currentDay} Snapshot</div>
                        </div>
                      </div>
                      <span
                        className={`px-2 py-0.5 rounded-full font-mono text-[10px] font-bold ${
                          isSafe ? "bg-emerald-100 text-emerald-800" : "bg-rose-100 text-rose-800"
                        }`}
                      >
                        {metrics.healthStatus}
                      </span>
                    </div>

                    <div className="space-y-2 font-mono text-[11px]">
                      <div className="flex justify-between items-center text-zinc-600">
                        <span className="font-sans">Starting Budget</span>
                        <span className="font-semibold text-zinc-900">{formatINR(state.startingBudget)}</span>
                      </div>
                      <div className="flex justify-between items-center text-zinc-600">
                        <span className="font-sans">Protected Savings</span>
                        <span className="font-semibold text-blue-600">{formatINR(metrics.reservedSavings)}</span>
                      </div>
                      <div className="flex justify-between items-center text-zinc-600">
                        <span className="font-sans">Upcoming Commitments</span>
                        <span className="font-semibold text-amber-600">-{formatINR(metrics.remainingCommitments)}</span>
                      </div>
                      <div className="pt-2 border-t border-zinc-100 flex justify-between items-center">
                        <span className="font-sans font-bold text-zinc-900">Safe-to-Spend</span>
                        <span className={`font-bold text-sm ${isSafe ? "text-emerald-600" : "text-rose-600"}`}>
                          {formatINR(metrics.uncommittedFunds)}
                        </span>
                      </div>
                      <div className="flex justify-between items-center text-[10px] text-zinc-500 pt-0.5">
                        <span className="font-sans">Daily Discretionary</span>
                        <span className="font-bold text-zinc-800 font-mono">
                          {formatINR(metrics.dailyDiscretionaryAllowance, true)}/day
                        </span>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-zinc-100 flex items-center justify-between gap-2">
                      <button
                        onClick={() => {
                          setPulseDropdownOpen(false);
                          onSelectTab("simulator");
                        }}
                        className="flex-1 py-1.5 px-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl text-center transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-xs text-xs"
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        Simulate
                      </button>
                      <button
                        onClick={() => {
                          setPulseDropdownOpen(false);
                          onSelectTab("health");
                        }}
                        className="flex-1 py-1.5 px-2 bg-zinc-100 hover:bg-zinc-200 text-zinc-800 font-semibold rounded-xl text-center transition-colors flex items-center justify-center gap-1.5 cursor-pointer text-xs"
                      >
                        <HeartPulse className="w-3.5 h-3.5 text-blue-600" />
                        Health {metrics.healthScore}/100
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Financial Alerts & Insights Notification Bell */}
            <div className="relative" ref={insightsRef}>
              <button
                onClick={() => setInsightsDropdownOpen((prev) => !prev)}
                className="relative p-2 rounded-xl text-zinc-600 hover:text-zinc-950 hover:bg-zinc-100/80 transition-colors cursor-pointer focus:outline-hidden focus-visible:ring-2 focus-visible:ring-blue-500 border border-transparent hover:border-zinc-200/80"
                title="Financial Alerts & Insights"
                aria-label="Financial alerts and insights"
              >
                <Bell className="w-4 h-4" />
                {upcomingCommitments.length > 0 && (
                  <span className="absolute top-1.5 right-1.5 flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-600 ring-2 ring-white" />
                  </span>
                )}
              </button>

              {/* Insights Dropdown */}
              <AnimatePresence>
                {insightsDropdownOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 8, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 6, scale: 0.98 }}
                    transition={{ duration: 0.18, ease: "easeOut" }}
                    className="absolute right-0 mt-2 w-80 p-4 rounded-2xl bg-white/95 backdrop-blur-xl border border-zinc-200/90 shadow-2xl z-50 text-xs space-y-3"
                  >
                    <div className="flex items-center justify-between pb-2 border-b border-zinc-100">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-blue-50 border border-blue-200/70 flex items-center justify-center text-blue-600">
                          <Activity className="w-4 h-4" />
                        </div>
                        <span className="font-bold text-zinc-900">Financial Alerts</span>
                      </div>
                      <span className="text-[10px] font-mono text-zinc-400">
                        Day {state.currentDay} Status
                      </span>
                    </div>

                    <div className="space-y-2.5 max-h-64 overflow-y-auto pr-1">
                      {/* Safe Runway Insight */}
                      <div className="p-2.5 rounded-xl bg-blue-50/70 border border-blue-100/80 flex items-start gap-2.5">
                        <Sparkles className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                        <div>
                          <div className="font-semibold text-zinc-900 text-xs">Safe Runway Status</div>
                          <div className="text-[11px] text-zinc-600 mt-0.5 leading-relaxed">
                            {isSafe
                              ? `You have ${formatINR(metrics.uncommittedFunds)} safe before touching protected savings.`
                              : `Deficit of ${formatINR(Math.abs(metrics.uncommittedFunds))} detected. Postpone discretionary items!`}
                          </div>
                        </div>
                      </div>

                      {/* Upcoming Commitment Alert */}
                      {upcomingCommitments.length > 0 ? (
                        <div className="p-2.5 rounded-xl bg-amber-50/70 border border-amber-100/80 flex items-start gap-2.5">
                          <Calendar className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                          <div>
                            <div className="font-semibold text-zinc-900 text-xs">Upcoming Commitments</div>
                            <div className="text-[11px] text-zinc-600 mt-0.5 leading-relaxed">
                              Next bill: <span className="font-semibold text-zinc-900">{upcomingCommitments[0].name}</span> ({formatINR(upcomingCommitments[0].amount)}) on Day {upcomingCommitments[0].dueDay}.
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="p-2 rounded-lg bg-zinc-50 text-zinc-500 text-center text-[11px]">
                          No upcoming commitments due.
                        </div>
                      )}

                      {/* Savings Goal Status */}
                      <div className="p-2.5 rounded-xl bg-emerald-50/70 border border-emerald-100/80 flex items-start gap-2.5">
                        <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                        <div>
                          <div className="font-semibold text-zinc-900 text-xs">Protected Reserve</div>
                          <div className="text-[11px] text-zinc-600 mt-0.5 leading-relaxed">
                            {formatINR(metrics.reservedSavings)} locked in Emergency Reserve ({metrics.savingsProgressPercent}% of target).
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-zinc-100">
                      <button
                        onClick={() => {
                          setInsightsDropdownOpen(false);
                          onSelectTab("forecast");
                        }}
                        className="w-full py-1.5 text-center text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
                      >
                        <span>Open 30-Day Forecast breakdown</span>
                        <ArrowUpRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Morphing Search Bar */}
            <MorphingSearchBar
              onNavigateTab={(tab) => onSelectTab(tab as NavTab)}
              onSelectSimulatorPreset={onSelectSimulatorPreset}
            />

            {/* PRIMARY QUICK ACTION: "+ Add Expense" or Split Dropdown */}
            <div className="relative" ref={actionMenuRef}>
              <div className="flex items-center rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-sm shadow-blue-500/20 hover:shadow-md hover:shadow-blue-500/30 transition-all overflow-hidden">
                <button
                  onClick={onOpenAddExpense}
                  className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold transition-colors cursor-pointer focus:outline-hidden"
                  title="Record a confirmed expense"
                >
                  <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                  <span className="hidden sm:inline">Add Expense</span>
                </button>
                <button
                  onClick={() => setActionMenuOpen((prev) => !prev)}
                  className="px-2 py-2 hover:bg-black/10 border-l border-white/20 transition-colors cursor-pointer focus:outline-hidden"
                  title="More actions"
                  aria-label="More actions"
                >
                  <ChevronDown className="w-3 h-3" />
                </button>
              </div>

              {/* Action Menu Dropdown */}
              <AnimatePresence>
                {actionMenuOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 8, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 6, scale: 0.98 }}
                    transition={{ duration: 0.18, ease: "easeOut" }}
                    className="absolute right-0 mt-2 w-52 p-1.5 rounded-2xl bg-white/95 backdrop-blur-xl border border-zinc-200/90 shadow-2xl z-50 text-xs"
                  >
                    <button
                      onClick={() => {
                        setActionMenuOpen(false);
                        onOpenAddExpense();
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-zinc-700 hover:text-zinc-950 hover:bg-zinc-100 font-medium text-left cursor-pointer transition-colors"
                    >
                      <Plus className="w-4 h-4 text-blue-600" />
                      <span>Log New Expense</span>
                    </button>
                    <button
                      onClick={() => {
                        setActionMenuOpen(false);
                        onOpenAddCommitment();
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-zinc-700 hover:text-zinc-950 hover:bg-zinc-100 font-medium text-left cursor-pointer transition-colors"
                    >
                      <Calendar className="w-4 h-4 text-amber-600" />
                      <span>Add Commitment</span>
                    </button>
                    <div className="my-1 border-t border-zinc-100" />
                    <button
                      onClick={() => {
                        setActionMenuOpen(false);
                        onSelectTab("simulator");
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-zinc-700 hover:text-zinc-950 hover:bg-zinc-100 font-medium text-left cursor-pointer transition-colors"
                    >
                      <Sparkles className="w-4 h-4 text-indigo-600" />
                      <span>Simulate Choice</span>
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Global theme toggle */}
            <button
              type="button"
              onClick={onToggleTheme}
              aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
              aria-pressed={theme === "dark"}
              title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
              className="inline-flex items-center justify-center gap-1.5 p-2 sm:px-2.5 sm:py-1.5 text-xs font-semibold text-zinc-600 hover:text-zinc-950 bg-white hover:bg-zinc-100/80 rounded-xl border border-zinc-200 shadow-2xs transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
            >
              {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              <span className="hidden 2xl:inline">{theme === "dark" ? "Light mode" : "Dark mode"}</span>
            </button>

            {/* Export JSON backup button */}
            <button
              onClick={onExportJSON}
              title="Export State Backup (JSON)"
              className="hidden xl:inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold text-zinc-600 hover:text-zinc-950 bg-white hover:bg-zinc-100/80 rounded-xl border border-zinc-200 shadow-2xs transition-colors cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export</span>
            </button>

            {/* Reset Demo button */}
            <button
              onClick={onResetDemo}
              title="Reset Demo (₹10,000 / 30 Days)"
              className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold text-zinc-600 hover:text-rose-600 bg-white hover:bg-rose-50/80 rounded-xl border border-zinc-200 shadow-2xs transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span className="hidden xl:inline">Reset</span>
            </button>

            {/* Mobile Menu Hamburger Button */}
            <button
              onClick={() => setMobileMenuOpen((prev) => !prev)}
              className="lg:hidden p-2 rounded-xl text-zinc-700 hover:text-zinc-950 hover:bg-zinc-100 transition-colors cursor-pointer focus:outline-hidden"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>

          </div>
        </div>
      </div>

      {/* ================= MOBILE DRAWER WITH FRAMER MOTION ================= */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25, ease: "easeInOut" }}
            className="lg:hidden overflow-hidden border-t border-zinc-200 bg-white/95 backdrop-blur-xl px-4 py-4 space-y-4"
          >
            {/* Mobile Safe-to-Spend Summary Strip */}
            <div className="p-3.5 rounded-2xl bg-zinc-50 border border-zinc-200/80 shadow-2xs flex items-center justify-between">
              <div>
                <div className="text-[10px] text-zinc-500 uppercase tracking-wider font-semibold">Safe to Spend</div>
                <div className={`font-mono font-bold text-base ${isSafe ? "text-emerald-600" : "text-rose-600"}`}>
                  {formatINR(metrics.uncommittedFunds)}
                </div>
              </div>
              <div className="text-right">
                <div className="text-[10px] text-zinc-500 uppercase tracking-wider font-semibold">Health Score</div>
                <div className="font-mono font-bold text-base text-blue-600">
                  {metrics.healthScore}/100
                </div>
              </div>
              <div className="text-right">
                <div className="text-[10px] text-zinc-500 uppercase tracking-wider font-semibold">Cycle Day</div>
                <div className="font-mono font-bold text-base text-zinc-800">
                  {state.currentDay}/30
                </div>
              </div>
            </div>

            {/* Navigation Links */}
            <div className="grid grid-cols-2 gap-2">
              {NAV_ITEMS.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      onSelectTab(item.id);
                      setMobileMenuOpen(false);
                    }}
                    className={`flex items-center gap-2.5 p-3 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                      isActive
                        ? "bg-blue-600 text-white shadow-xs"
                        : "text-zinc-700 hover:text-zinc-950 hover:bg-zinc-100"
                    }`}
                  >
                    <Icon className="w-4 h-4 shrink-0" />
                    <span className="truncate">{item.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Mobile theme control */}
            <button
              type="button"
              onClick={onToggleTheme}
              aria-pressed={theme === "dark"}
              className="w-full py-2.5 px-3 rounded-xl border border-zinc-200 text-zinc-700 text-xs font-semibold flex items-center justify-center gap-2 cursor-pointer hover:bg-zinc-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
            >
              {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              <span>Switch to {theme === "dark" ? "light" : "dark"} mode</span>
            </button>

            {/* Mobile Action Buttons */}
            <div className="flex flex-col gap-2 pt-2 border-t border-zinc-100">
              <button
                onClick={() => {
                  onOpenAddExpense();
                  setMobileMenuOpen(false);
                }}
                className="w-full py-2.5 px-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-xs cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Log New Expense</span>
              </button>
              <button
                onClick={() => {
                  onOpenAddCommitment();
                  setMobileMenuOpen(false);
                }}
                className="w-full py-2.5 px-3 rounded-xl bg-zinc-100 hover:bg-zinc-200 text-zinc-800 text-xs font-bold flex items-center justify-center gap-2 cursor-pointer"
              >
                <Calendar className="w-4 h-4 text-amber-600" />
                <span>Add Recurring Commitment</span>
              </button>

              <div className="flex items-center gap-2 pt-1">
                <button
                  onClick={() => {
                    onExportJSON();
                    setMobileMenuOpen(false);
                  }}
                  className="flex-1 py-2 px-3 rounded-xl border border-zinc-200 text-zinc-700 text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer hover:bg-zinc-50"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Export JSON</span>
                </button>
                <button
                  onClick={() => {
                    onResetDemo();
                    setMobileMenuOpen(false);
                  }}
                  className="flex-1 py-2 px-3 rounded-xl border border-rose-200 text-rose-600 text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer hover:bg-rose-50"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Reset Demo</span>
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
