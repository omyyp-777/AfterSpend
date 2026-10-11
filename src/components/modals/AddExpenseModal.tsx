/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useRef, useState } from "react";
import { Transaction } from "../../types/finance";
import { CATEGORIES } from "../screens/SimulatorScreen";
import { X } from "lucide-react";
import { useDialogAccessibility } from "../../hooks/useDialogAccessibility";

interface AddExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddExpense: (expense: Omit<Transaction, "id">) => void;
  currentDay: number;
}

export default function AddExpenseModal({
  isOpen,
  onClose,
  onAddExpense,
  currentDay
}: AddExpenseModalProps) {
  const [name, setName] = useState("");
  const [amount, setAmount] = useState<number>(250);
  const [category, setCategory] = useState("Food");
  const [day, setDay] = useState<number>(currentDay);

  const dialogRef = useRef<HTMLDivElement>(null);
  useDialogAccessibility(isOpen, dialogRef, onClose);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || name.trim().length > 120 || !Number.isFinite(amount) || amount <= 0 || amount > 10_000_000 ||
        !Number.isInteger(day) || day < 1 || day > currentDay) return;
    onAddExpense({
      name,
      amount,
      category,
      day: Math.min(30, Math.max(1, day)),
      status: "confirmed"
    });
    setName("");
    setAmount(250);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/40 backdrop-blur-sm animate-in fade-in">
      <div ref={dialogRef} tabIndex={-1} role="dialog" aria-modal="true" aria-labelledby="expense-dialog-title" className="w-full max-w-md p-6 rounded-2xl bg-white border border-zinc-200 shadow-2xl space-y-4">
        <div className="flex items-center justify-between">
          <h3 id="expense-dialog-title" className="text-base font-bold text-zinc-950">Record Confirmed Expense</h3>
          <button
            type="button"
            aria-label="Close dialog"
            onClick={onClose}
            className="p-1 rounded-lg text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <p className="text-xs text-zinc-600">
          This records a confirmed expense for today or an earlier day. Future expenses belong in the simulator or commitments.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="expense-name" className="block text-xs font-semibold text-zinc-700 mb-1">Expense Name</label>
            <input
              id="expense-name"
              type="text"
              maxLength={120}
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. College Cafeteria Lunch"
              className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-50 border border-zinc-200 text-xs text-zinc-900 font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="expense-amount" className="block text-xs font-semibold text-zinc-700 mb-1">Amount (INR)</label>
              <input
                id="expense-amount"
                type="number"
                min="1"
                max="10000000"
                step="10"
                required
                value={amount}
                onChange={(e) => {
                  const next = e.target.value === "" ? 0 : Number(e.target.value);
                  setAmount(Number.isFinite(next) ? Math.min(10_000_000, Math.max(0, next)) : 0);
                }}
                className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-50 border border-zinc-200 text-xs font-mono font-bold text-blue-600 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>

            <div>
              <label htmlFor="expense-day" className="block text-xs font-semibold text-zinc-700 mb-1">Day of Period</label>
              <input
                id="expense-day"
                type="number"
                min="1"
                max={currentDay}
                required
                value={day}
                onChange={(e) => setDay(Math.min(currentDay, Math.max(1, Number.parseInt(e.target.value, 10) || 1)))}
                className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-50 border border-zinc-200 text-xs font-mono text-zinc-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>
          </div>

          <div>
            <label htmlFor="expense-category" className="block text-xs font-semibold text-zinc-700 mb-1">Category</label>
            <select
              id="expense-category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-50 border border-zinc-200 text-xs text-zinc-900 font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 cursor-pointer"
            >
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-2 text-xs font-semibold text-zinc-600 hover:text-zinc-900 bg-zinc-100 hover:bg-zinc-200 rounded-xl cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs cursor-pointer"
            >
              Add Expense
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
