/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from "react";
import {
  LayoutDashboard,
  Sparkles,
  TrendingUp,
  PiggyBank,
  Calendar,
  HeartPulse,
  Plus,
  RotateCcw,
  Download,
  Bell,
  Menu,
  X,
  ChevronDown,
  ShieldCheck,
  AlertTriangle,
  Wallet,
  Clock,
  ArrowUpRight
} from "lucide-react";
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
  onSelectSimulatorPreset
}: NavbarProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [pulseDropdownOpen, setPulseDropdownOpen] = useState(false);
  const [insightsDropdownOpen, setInsightsDropdownOpen] = useState(false);
  const [actionMenuOpen, setActionMenuOpen] = useState(false);

  const pulseRef = useRef<HTMLDivElement>(null);
  const insightsRef = useRef<HTMLDivElement>(null);
  const actionMenuRef = useRef<HTMLDivElement>(null);

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

  return (
    <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-zinc-200/80 shadow-xs transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-2 lg:gap-4">
          
          {/* LEFT: Brand & Cycle Tracker */}
          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={() => onSelectTab("overview")}
              className="flex items-center gap-2.5 group text-left cursor-pointer focus:outline-hidden focus-visible:ring-2 focus-visible:ring-blue-600 rounded-lg p-1 -m-1"
              aria-label="AFTERSPEND Home"
            >
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white flex items-center justify-center font-black font-mono text-sm tracking-tighter shadow-xs group-hover:scale-105 transition-transform">
                AS
              </div>
              <div className="flex flex-col">
                <span className="text-base font-black tracking-tight text-zinc-950 group-hover:text-blue-600 transition-colors leading-none">
                  AFTERSPEND
                </span>
                <span className="text-[10px] text-zinc-500 font-mono tracking-tight hidden sm:inline">
                  30-DAY DECISION ENGINE
                </span>
              </div>
            </button>

            {/* Cycle indicator: Day 1 of 30 */}
            <div className="hidden xl:flex items-center gap-2 pl-3 ml-2 border-l border-zinc-200">
              <div className="flex flex-col">
                <div className="flex items-center gap-1.5 text-[11px] font-mono text-zinc-600 font-semibold">
                  <Clock className="w-3 h-3 text-blue-600" />
                  <span>Day {state.currentDay} of {state.planningDays}</span>
                </div>
                <div className="w-24 h-1 bg-zinc-100 rounded-full overflow-hidden mt-0.5">
                  <div
                    className="h-full bg-blue-600 rounded-full"
                    style={{
                      width: `${Math.min(100, (state.currentDay / state.planningDays) * 100)}%`
                    }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* CENTER: Main Nav Links (Desktop) */}
          <nav className="hidden lg:flex items-center gap-1 xl:gap-2">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => onSelectTab(item.id)}
                  className={`relative px-2.5 xl:px-3 py-1.5 rounded-lg text-xs font-semibold tracking-tight transition-all flex items-center gap-1.5 cursor-pointer focus:outline-hidden focus-visible:ring-2 focus-visible:ring-blue-500 ${
                    isActive
                      ? "text-blue-700 bg-blue-50/80 font-bold"
                      : "text-zinc-600 hover:text-zinc-950 hover:bg-zinc-100/70"
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${isActive ? "text-blue-600" : "text-zinc-500"}`} />
                  <span>{item.label}</span>
                  {isActive && (
                    <span className="absolute bottom-0 left-2 right-2 h-0.5 bg-blue-600 rounded-full" />
                  )}
                </button>
              );
            })}
          </nav>

          {/* RIGHT: Live Pulse, Search, Quick Action & Utilities */}
          <div className="flex items-center gap-2 sm:gap-2.5">

            {/* Live Safe-to-Spend Ticker / Pulse Dropdown Trigger */}
            <div className="relative" ref={pulseRef}>
              <button
                onClick={() => setPulseDropdownOpen((prev) => !prev)}
                className={`hidden md:flex items-center gap-2 px-2.5 py-1.5 rounded-xl border transition-all cursor-pointer text-xs focus:outline-hidden focus-visible:ring-2 focus-visible:ring-blue-500 ${
                  isSafe
                    ? "bg-emerald-50/70 hover:bg-emerald-50 border-emerald-200/80 text-emerald-950"
                    : "bg-rose-50/70 hover:bg-rose-50 border-rose-200/80 text-rose-950"
                }`}
                title="View quick safe-to-spend balance pulse"
              >
                <span
                  className={`w-2 h-2 rounded-full ${
                    isSafe ? "bg-emerald-500 animate-pulse" : "bg-rose-500 animate-ping"
                  }`}
                />
                <div className="flex items-center gap-1">
                  <span className="text-[11px] font-medium text-zinc-500 hidden xl:inline">Safe:</span>
                  <span className={`font-mono font-bold ${isSafe ? "text-emerald-700" : "text-rose-600"}`}>
                    {formatINR(metrics.uncommittedFunds)}
                  </span>
                </div>
                <ChevronDown className={`w-3 h-3 text-zinc-500 transition-transform ${pulseDropdownOpen ? "rotate-180" : ""}`} />
              </button>

              {/* Quick Pulse Dropdown Menu */}
              {pulseDropdownOpen && (
                <div className="absolute right-0 mt-2 w-72 p-3.5 rounded-2xl bg-white border border-zinc-200 shadow-xl z-50 animate-in fade-in slide-in-from-top-1 text-xs space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-zinc-100">
                    <span className="font-bold text-zinc-900 flex items-center gap-1.5">
                      <Wallet className="w-3.5 h-3.5 text-blue-600" />
                      Live Financial Runway
                    </span>
                    <span
                      className={`px-1.5 py-0.5 rounded-md font-mono text-[10px] font-bold ${
                        isSafe ? "bg-emerald-100 text-emerald-800" : "bg-rose-100 text-rose-800"
                      }`}
                    >
                      {metrics.healthStatus}
                    </span>
                  </div>

                  <div className="space-y-2 font-mono">
                    <div className="flex justify-between items-center text-zinc-600">
                      <span>Total Starting Budget:</span>
                      <span className="font-semibold text-zinc-900">{formatINR(state.startingBudget)}</span>
                    </div>
                    <div className="flex justify-between items-center text-zinc-600">
                      <span>Protected Savings:</span>
                      <span className="font-semibold text-blue-600">{formatINR(metrics.reservedSavings)}</span>
                    </div>
                    <div className="flex justify-between items-center text-zinc-600">
                      <span>Upcoming Commitments ({upcomingCommitments.length}):</span>
                      <span className="font-semibold text-amber-600">-{formatINR(metrics.remainingCommitments)}</span>
                    </div>
                    <div className="pt-1.5 border-t border-zinc-100 flex justify-between items-center">
                      <span className="font-sans font-bold text-zinc-900">Safe-to-Spend Balance:</span>
                      <span className={`font-bold text-sm ${isSafe ? "text-emerald-600" : "text-rose-600"}`}>
                        {formatINR(metrics.uncommittedFunds)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-[11px] text-zinc-500">
                      <span>Daily Discretionary Allowance:</span>
                      <span className="font-bold text-zinc-800">
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
                      className="flex-1 py-1.5 px-2 bg-blue-50 hover:bg-blue-100 text-blue-700 font-semibold rounded-lg text-center transition-colors flex items-center justify-center gap-1 cursor-pointer"
                    >
                      <Sparkles className="w-3 h-3" />
                      Simulate
                    </button>
                    <button
                      onClick={() => {
                        setPulseDropdownOpen(false);
                        onSelectTab("health");
                      }}
                      className="flex-1 py-1.5 px-2 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 font-semibold rounded-lg text-center transition-colors flex items-center justify-center gap-1 cursor-pointer"
                    >
                      <HeartPulse className="w-3 h-3" />
                      Health {metrics.healthScore}/100
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Insights Notification Bell */}
            <div className="relative" ref={insightsRef}>
              <button
                onClick={() => setInsightsDropdownOpen((prev) => !prev)}
                className="relative p-2 rounded-xl text-zinc-600 hover:text-zinc-950 hover:bg-zinc-100 transition-colors cursor-pointer focus:outline-hidden focus-visible:ring-2 focus-visible:ring-blue-500"
                title="Financial Alerts & Insights"
                aria-label="Financial alerts and insights"
              >
                <Bell className="w-4 h-4" />
                {upcomingCommitments.length > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-blue-600 ring-2 ring-white" />
                )}
              </button>

              {/* Insights Dropdown */}
              {insightsDropdownOpen && (
                <div className="absolute right-0 mt-2 w-80 p-3.5 rounded-2xl bg-white border border-zinc-200 shadow-xl z-50 animate-in fade-in slide-in-from-top-1 text-xs space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-zinc-100">
                    <span className="font-bold text-zinc-900 flex items-center gap-1.5">
                      <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
                      Active Financial Alerts
                    </span>
                    <span className="text-[10px] font-mono text-zinc-400">
                      Day {state.currentDay} Status
                    </span>
                  </div>

                  <div className="space-y-2.5 max-h-64 overflow-y-auto pr-1">
                    {/* Safe Runway Insight */}
                    <div className="p-2.5 rounded-xl bg-blue-50/70 border border-blue-100/80 flex items-start gap-2">
                      <Sparkles className="w-3.5 h-3.5 text-blue-600 shrink-0 mt-0.5" />
                      <div>
                        <div className="font-semibold text-zinc-900 text-[11px]">Safe Runway Ticker</div>
                        <div className="text-[11px] text-zinc-600 mt-0.5">
                          {isSafe
                            ? `You have ${formatINR(metrics.uncommittedFunds)} safe before touching protected savings.`
                            : `Deficit of ${formatINR(Math.abs(metrics.uncommittedFunds))} detected. Postpone discretionary items!`}
                        </div>
                      </div>
                    </div>

                    {/* Upcoming Commitment Alert */}
                    {upcomingCommitments.length > 0 ? (
                      <div className="p-2.5 rounded-xl bg-amber-50/70 border border-amber-100/80 flex items-start gap-2">
                        <Calendar className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                        <div>
                          <div className="font-semibold text-zinc-900 text-[11px]">Upcoming Bills</div>
                          <div className="text-[11px] text-zinc-600 mt-0.5">
                            Next due: <span className="font-semibold">{upcomingCommitments[0].name}</span> ({formatINR(upcomingCommitments[0].amount)}) on Day {upcomingCommitments[0].dueDay}.
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="p-2 rounded-lg bg-zinc-50 text-zinc-500 text-center text-[11px]">
                        No upcoming commitments due.
                      </div>
                    )}

                    {/* Savings Goal Status */}
                    <div className="p-2.5 rounded-xl bg-emerald-50/70 border border-emerald-100/80 flex items-start gap-2">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                      <div>
                        <div className="font-semibold text-zinc-900 text-[11px]">Protected Reserve</div>
                        <div className="text-[11px] text-zinc-600 mt-0.5">
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
                      className="w-full py-1.5 text-center text-[11px] font-semibold text-blue-600 hover:text-blue-800 flex items-center justify-center gap-1 cursor-pointer"
                    >
                      <span>Open full 30-day forecast breakdown</span>
                      <ArrowUpRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Morphing Search Bar */}
            <MorphingSearchBar
              onNavigateTab={(tab) => onSelectTab(tab as NavTab)}
              onSelectSimulatorPreset={onSelectSimulatorPreset}
            />

            {/* PRIMARY QUICK ACTION: "+ Add Expense" or Split Dropdown */}
            <div className="relative" ref={actionMenuRef}>
              <div className="flex items-center rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow-xs transition-all overflow-hidden">
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
                  className="px-1.5 py-2 hover:bg-blue-800 border-l border-blue-500/60 transition-colors cursor-pointer focus:outline-hidden"
                  title="More actions"
                  aria-label="More actions"
                >
                  <ChevronDown className="w-3 h-3" />
                </button>
              </div>

              {/* Action Menu Dropdown */}
              {actionMenuOpen && (
                <div className="absolute right-0 mt-2 w-48 p-1.5 rounded-xl bg-white border border-zinc-200 shadow-xl z-50 text-xs animate-in fade-in">
                  <button
                    onClick={() => {
                      setActionMenuOpen(false);
                      onOpenAddExpense();
                    }}
                    className="w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-zinc-700 hover:text-zinc-950 hover:bg-zinc-100 font-medium text-left cursor-pointer transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5 text-blue-600" />
                    <span>Log Expense</span>
                  </button>
                  <button
                    onClick={() => {
                      setActionMenuOpen(false);
                      onOpenAddCommitment();
                    }}
                    className="w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-zinc-700 hover:text-zinc-950 hover:bg-zinc-100 font-medium text-left cursor-pointer transition-colors"
                  >
                    <Calendar className="w-3.5 h-3.5 text-amber-600" />
                    <span>Add Commitment</span>
                  </button>
                  <div className="my-1 border-t border-zinc-100" />
                  <button
                    onClick={() => {
                      setActionMenuOpen(false);
                      onSelectTab("simulator");
                    }}
                    className="w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-zinc-700 hover:text-zinc-950 hover:bg-zinc-100 font-medium text-left cursor-pointer transition-colors"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Simulate Choice</span>
                  </button>
                </div>
              )}
            </div>

            {/* Export JSON backup button */}
            <button
              onClick={onExportJSON}
              title="Export State Backup (JSON)"
              className="hidden xl:inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold text-zinc-600 hover:text-zinc-950 bg-white hover:bg-zinc-100 rounded-xl border border-zinc-200 shadow-2xs transition-colors cursor-pointer"
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

      {/* MOBILE DRAWER / DROPDOWN */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-zinc-200 bg-white px-4 py-4 space-y-4 animate-in slide-in-from-top-2">
          {/* Mobile Safe-to-Spend Summary Strip */}
          <div className="p-3 rounded-xl bg-zinc-50 border border-zinc-200 flex items-center justify-between">
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
                  className={`flex items-center gap-2 p-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
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

          {/* Mobile Action Buttons */}
          <div className="flex flex-col gap-2 pt-2 border-t border-zinc-100">
            <button
              onClick={() => {
                onOpenAddExpense();
                setMobileMenuOpen(false);
              }}
              className="w-full py-2.5 px-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-xs cursor-pointer"
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
              <Calendar className="w-4 h-4" />
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
        </div>
      )}
    </header>
  );
}
