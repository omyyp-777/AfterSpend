/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { FinanceState, Commitment, CalculatedMetrics } from "../../types/finance";
import { formatINR } from "../../services/financeCalculations";
import { Calendar, PlusCircle, Trash2, Repeat } from "lucide-react";

interface CommitmentsScreenProps {
  state: FinanceState;
  metrics: CalculatedMetrics;
  onAddCommitment: (comm: Omit<Commitment, "id">) => void;
  onMarkPaid: (id: string) => void;
  onCancelCommitment: (id: string) => void;
  onDeleteCommitment: (id: string) => void;
}

const CATEGORIES = ["Utilities", "Entertainment", "Transport", "Education", "Living", "Other"];

export default function CommitmentsScreen({
  state,
  metrics,
  onAddCommitment,
  onMarkPaid,
  onCancelCommitment,
  onDeleteCommitment
}: CommitmentsScreenProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [name, setName] = useState("");
  const [amount, setAmount] = useState<number>(299);
  const [dueDay, setDueDay] = useState<number>(15);
  const [category, setCategory] = useState("Utilities");
  const [recurring, setRecurring] = useState(true);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || amount <= 0) return;
    onAddCommitment({
      name,
      amount,
      dueDay: Math.min(30, Math.max(1, dueDay)),
      category,
      status: "upcoming",
      recurring
    });
    setName("");
    setAmount(299);
    setDueDay(15);
    setIsAdding(false);
  };

  const upcoming = state.commitments.filter((c) => c.status === "upcoming");
  const paid = state.commitments.filter((c) => c.status === "paid");
  const cancelled = state.commitments.filter((c) => c.status === "cancelled");

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-zinc-500 mb-1">
            <span>Essential Obligations</span>
            <span aria-hidden="true">·</span>
            <span>Pre-Allocated Buffer</span>
            <span aria-hidden="true">·</span>
            <span>Recurring & Fixed</span>
          </div>
          <h2 className="text-2xl md:text-3xl font-extrabold text-zinc-950 tracking-tight">
            Commitments & Subscriptions
          </h2>
          <p className="mt-1 text-xs text-zinc-600 max-w-2xl leading-relaxed">
            Unpaid bills and subscriptions are deducted from your Safe-to-Spend balance in advance.
            When you mark an item as paid, it seamlessly transitions into a confirmed expense without double-deduction.
          </p>
        </div>

        <button
          onClick={() => setIsAdding(!isAdding)}
          className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-colors shrink-0 shadow-sm cursor-pointer"
        >
          <PlusCircle className="w-4 h-4" />
          {isAdding ? "Close Form" : "Add Commitment"}
        </button>
      </div>

      {/* Aggregate Commitments Card */}
      <div className="p-6 rounded-2xl bg-white border border-zinc-200/80 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="text-xs text-zinc-500 uppercase tracking-wider font-semibold mb-1">
            Pending Scheduled Bills
          </div>
          <div className="text-3xl font-extrabold font-mono text-zinc-950">
            {formatINR(metrics.remainingCommitments)}{" "}
            <span className="text-sm font-normal text-zinc-400">
              across {upcoming.length} upcoming obligations
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2.5 text-xs font-mono">
          <span className="px-2.5 py-1 rounded-lg bg-amber-50 text-amber-700 border border-amber-200 font-semibold">
            {upcoming.length} Upcoming
          </span>
          <span className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 font-semibold">
            {paid.length} Paid
          </span>
          {cancelled.length > 0 && (
            <span className="px-2.5 py-1 rounded-lg bg-zinc-100 text-zinc-500 font-medium">
              {cancelled.length} Cancelled
            </span>
          )}
        </div>
      </div>

      {/* Add Commitment Form (when opened) */}
      {isAdding && (
        <form
          onSubmit={handleSubmit}
          className="p-6 rounded-2xl bg-white border border-blue-200 shadow-md space-y-4 animate-in slide-in-from-top-4"
        >
          <h3 className="text-sm font-bold text-zinc-900 uppercase tracking-wider">
            Schedule New Bill or Subscription
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-semibold text-zinc-700 mb-1">Name</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. WiFi Bill"
                className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-50 border border-zinc-200 text-xs text-zinc-900 font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-700 mb-1">Amount (INR)</label>
              <input
                type="number"
                min="10"
                step="10"
                required
                value={amount}
                onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-50 border border-zinc-200 text-xs font-mono font-bold text-blue-600 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-700 mb-1">Due Day (1–30)</label>
              <input
                type="number"
                min="1"
                max="30"
                required
                value={dueDay}
                onChange={(e) => setDueDay(parseInt(e.target.value) || 1)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-50 border border-zinc-200 text-xs font-mono text-zinc-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-700 mb-1">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-50 border border-zinc-200 text-xs text-zinc-900 font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all cursor-pointer"
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex items-center justify-between pt-2">
            <label className="flex items-center gap-2 text-xs font-medium text-zinc-700 cursor-pointer">
              <input
                type="checkbox"
                checked={recurring}
                onChange={(e) => setRecurring(e.target.checked)}
                className="rounded accent-blue-600"
              />
              <span>Monthly Recurring Subscription</span>
            </label>

            <div className="flex gap-2">
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
                Add Commitment
              </button>
            </div>
          </div>
        </form>
      )}

      {/* Commitments Table List */}
      <div className="p-6 rounded-2xl bg-white border border-zinc-200/80 shadow-sm space-y-4">
        <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-wider">
          Scheduled Bills & Active Subscriptions ({state.commitments.length})
        </h3>

        <div className="divide-y divide-zinc-100">
          {state.commitments.map((comm) => (
            <div
              key={comm.id}
              className="py-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs"
            >
              <div className="flex items-center gap-3.5">
                <div
                  className={`p-2.5 rounded-xl ${
                    comm.status === "paid"
                      ? "bg-emerald-50 text-emerald-600"
                      : comm.status === "cancelled"
                      ? "bg-zinc-100 text-zinc-400"
                      : "bg-amber-50 text-amber-600"
                  }`}
                >
                  <Calendar className="w-4 h-4" />
                </div>

                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-zinc-900 text-sm">{comm.name}</span>
                    {comm.recurring && (
                      <span className="px-1.5 py-0.5 rounded text-[10px] bg-zinc-100 text-zinc-600 flex items-center gap-1 font-mono font-medium">
                        <Repeat className="w-2.5 h-2.5" /> Recurring
                      </span>
                    )}
                  </div>
                  <div className="text-[11px] text-zinc-500 mt-0.5 font-medium">
                    Due on Day {comm.dueDay} of 30 · {comm.category}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-end">
                <span className="font-mono font-bold text-base text-zinc-950">
                  {formatINR(comm.amount)}
                </span>

                <div className="flex items-center gap-2">
                  {comm.status === "upcoming" ? (
                    <>
                      <button
                        onClick={() => onMarkPaid(comm.id)}
                        className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 transition-colors cursor-pointer"
                      >
                        Mark as Paid
                      </button>
                      <button
                        onClick={() => onCancelCommitment(comm.id)}
                        title="Simulate Cancelling Subscription"
                        className="px-2.5 py-1.5 rounded-lg text-xs font-medium text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 cursor-pointer transition-colors"
                      >
                        Cancel Sub
                      </button>
                    </>
                  ) : comm.status === "paid" ? (
                    <span className="px-2.5 py-1 rounded-md text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      Paid & Cleared
                    </span>
                  ) : (
                    <span className="px-2.5 py-1 rounded-md text-[11px] font-semibold bg-zinc-100 text-zinc-400 line-through">
                      Cancelled
                    </span>
                  )}

                  <button
                    onClick={() => onDeleteCommitment(comm.id)}
                    title="Delete"
                    className="p-1.5 text-zinc-400 hover:text-rose-600 rounded-lg hover:bg-zinc-100 transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
