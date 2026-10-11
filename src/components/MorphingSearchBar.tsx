/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from "react";

interface SearchResult {
  title: string;
  category: string;
  action: () => void;
}

interface MorphingSearchBarProps {
  onNavigateTab: (tab: string) => void;
  onSelectSimulatorPreset?: (name: string, amount: number) => void;
}

export default function MorphingSearchBar({
  onNavigateTab,
  onSelectSimulatorPreset
}: MorphingSearchBarProps) {
  const [query, setQuery] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const searchableItems: SearchResult[] = [
    {
      title: "Before You Spend Decision Simulator",
      category: "Feature",
      action: () => onNavigateTab("simulator")
    },
    {
      title: "30-Day Financial Runway Forecast",
      category: "Feature",
      action: () => onNavigateTab("forecast")
    },
    {
      title: "Protected Savings Goals",
      category: "Feature",
      action: () => onNavigateTab("savings")
    },
    {
      title: "Upcoming Bills & Commitments",
      category: "Feature",
      action: () => onNavigateTab("commitments")
    },
    {
      title: "Explainable Financial Health",
      category: "Feature",
      action: () => onNavigateTab("health")
    },
    {
      title: "Unexpected Expense Stress Test",
      category: "Feature",
      action: () => onNavigateTab("health")
    },
    {
      title: "Simulate Headphones (₹2,000)",
      category: "Purchase Simulator",
      action: () => {
        onSelectSimulatorPreset?.("Wireless Headphones", 2000);
        onNavigateTab("simulator");
      }
    },
    {
      title: "Simulate Café Dining (₹500)",
      category: "Purchase Simulator",
      action: () => {
        onSelectSimulatorPreset?.("Café Outing & Dinner", 500);
        onNavigateTab("simulator");
      }
    },
    {
      title: "Simulate Concert Ticket (₹1,500)",
      category: "Purchase Simulator",
      action: () => {
        onSelectSimulatorPreset?.("Live Concert Ticket", 1500);
        onNavigateTab("simulator");
      }
    },
    {
      title: "Mobile Recharge (₹299, Day 8)",
      category: "Commitment",
      action: () => onNavigateTab("commitments")
    },
    {
      title: "Streaming Subscription (₹199, Day 14)",
      category: "Commitment",
      action: () => onNavigateTab("commitments")
    },
    {
      title: "Transport Pass (₹500, Day 21)",
      category: "Commitment",
      action: () => onNavigateTab("commitments")
    }
  ];

  const filteredResults = query.trim()
    ? searchableItems.filter(
        (item) =>
          item.title.toLowerCase().includes(query.toLowerCase()) ||
          item.category.toLowerCase().includes(query.toLowerCase())
      )
    : [];

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setIsFocused(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div ref={containerRef} className="relative flex items-center justify-center">
      {/* Morphing Search Bar DOM complying with user specifications */}
      <div className="relative w-[50px] h-[50px] flex items-center justify-center">
        <input
          ref={inputRef}
          type="text"
          className="searchfield"
          placeholder="Search simulator, bills..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setIsFocused(true)}
          aria-label="Search AFTERSPEND features and commitments"
        />
        <div
          className="search"
          onClick={() => {
            if (isFocused) {
              setQuery("");
              inputRef.current?.blur();
              setIsFocused(false);
            } else {
              inputRef.current?.focus();
            }
          }}
        />
      </div>

      {/* Floating Suggestions Dropdown when typing */}
      {isFocused && query.trim().length > 0 && (
        <div className="absolute top-[60px] right-0 sm:left-1/2 sm:-translate-x-1/2 w-[320px] bg-white/95 backdrop-blur-xl rounded-xl shadow-2xl border border-zinc-200/90 overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-200">
          <div className="px-3.5 py-2 text-[11px] font-semibold text-zinc-500 uppercase tracking-wider border-b border-zinc-100 bg-zinc-50/50">
            Search Matches ({filteredResults.length})
          </div>
          <div className="max-h-60 overflow-y-auto divide-y divide-zinc-100">
            {filteredResults.length > 0 ? (
              filteredResults.map((result, idx) => (
                <button
                  key={idx}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    result.action();
                    setQuery("");
                    inputRef.current?.blur();
                    setIsFocused(false);
                  }}
                  className="w-full px-3.5 py-2.5 text-left hover:bg-blue-50/80 transition-colors flex items-center justify-between group"
                >
                  <span className="text-xs font-semibold text-zinc-800 group-hover:text-blue-600">
                    {result.title}
                  </span>
                  <span className="text-[10px] font-mono text-zinc-400 group-hover:text-blue-500">
                    {result.category}
                  </span>
                </button>
              ))
            ) : (
              <div className="px-3 py-4 text-center text-xs text-zinc-400">
                No matching results found
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
