/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from "react";
import { FinanceState, PurchaseScenario, CalculatedMetrics } from "../../types/finance";
import { generate30DayForecast, formatINR } from "../../services/financeCalculations";
import ForecastChart from "../ForecastChart";


interface ForecastScreenProps {
  state: FinanceState;
  metrics: CalculatedMetrics;
  scenario?: PurchaseScenario;
}

export default function ForecastScreen({
  state,
  metrics: _metrics,
  scenario
}: ForecastScreenProps) {
  const [selectedDay, setSelectedDay] = useState<number>(1);
  const [showScenarioOverlay, setShowScenarioOverlay] = useState<boolean>(true);

  const forecastData = generate30DayForecast(state, scenario);
  const activeDayData = forecastData.find((d) => d.day === selectedDay) || forecastData[0];

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-zinc-500 mb-1">
            <span>Dynamic Cash Flow Model</span>
            <span aria-hidden="true">·</span>
            <span>30-Day Trajectory</span>
            <span aria-hidden="true">·</span>
            <span>Zero Data Fabrication</span>
          </div>
          <h2 className="text-2xl md:text-3xl font-extrabold text-zinc-950 tracking-tight">
            30-Day Financial Runway Forecast
          </h2>
          <p className="mt-1 text-xs text-zinc-600 max-w-2xl leading-relaxed">
            Inspect your projected liquidity evolution day-by-day. Select any day to audit scheduled bills,
            active deductions, and safe discretionary leeway.
          </p>
        </div>

        {/* Scenario Toggle */}
        {scenario && scenario.amount > 0 && (
          <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-white border border-zinc-200 shadow-xs text-xs">
            <span className="text-zinc-600 font-medium">Scenario Overlay:</span>
            <button
              onClick={() => setShowScenarioOverlay(!showScenarioOverlay)}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                showScenarioOverlay
                  ? "bg-rose-600 text-white shadow-xs"
                  : "bg-zinc-100 text-zinc-600 hover:text-zinc-900"
              }`}
            >
              {showScenarioOverlay ? "Active" : "Hidden"}
            </button>
          </div>
        )}
      </div>

      {/* Main Chart Container */}
      <div className="p-6 rounded-2xl bg-white border border-zinc-200/80 space-y-4 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-600" />
              <span className="text-zinc-700 font-medium">Base Financial Runway</span>
            </div>
            {showScenarioOverlay && scenario && scenario.amount > 0 && (
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                <span className="text-zinc-700 font-medium">Hypothetical Simulation Path</span>
              </div>
            )}
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
              <span className="text-zinc-700 font-medium">Commitments Due</span>
            </div>
          </div>

          <div className="text-[11px] font-mono text-zinc-400">
            Click any column or day node below to inspect
          </div>
        </div>

        <ForecastChart
          data={forecastData}
          selectedDay={selectedDay}
          onSelectDay={(day) => setSelectedDay(day)}
          height={260}
          showScenario={showScenarioOverlay}
        />
      </div>

      {/* Day Details Card & Schedule Audit */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Selected Day Audit Card */}
        <div className="lg:col-span-5 p-6 rounded-2xl bg-white border border-blue-200/80 shadow-sm space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-[10px] font-mono font-bold text-blue-600 uppercase tracking-wider">
                Auditing Day {activeDayData.day} of {state.planningDays}
              </span>
              <h3 className="text-xl font-bold text-zinc-950">
                Day {activeDayData.day} Position
              </h3>
            </div>
            <span
              className={`px-2.5 py-1 rounded-md text-xs font-semibold ${
                activeDayData.isToday
                  ? "bg-blue-50 text-blue-700 border border-blue-200"
                  : activeDayData.isPast
                  ? "bg-zinc-100 text-zinc-500"
                  : "bg-zinc-100 text-zinc-700"
              }`}
            >
              {activeDayData.isToday
                ? "Today"
                : activeDayData.isPast
                ? "Past Activity"
                : "Projected Future"}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-2">
            <div className="p-3.5 rounded-xl bg-zinc-50 border border-zinc-200">
              <span className="text-[11px] text-zinc-500 block mb-1 font-medium">Projected Balance</span>
              <span className="text-lg font-bold font-mono text-zinc-950">
                {formatINR(activeDayData.projectedBalance)}
              </span>
            </div>

            {showScenarioOverlay && activeDayData.scenarioBalance !== undefined && (
              <div className="p-3.5 rounded-xl bg-rose-50/70 border border-rose-200">
                <span className="text-[11px] text-rose-700 block mb-1 font-medium">Scenario Balance</span>
                <span className="text-lg font-bold font-mono text-rose-700">
                  {formatINR(activeDayData.scenarioBalance)}
                </span>
              </div>
            )}
          </div>

          {/* Commitments due on this exact day */}
          <div>
            <span className="block text-xs font-bold text-zinc-500 uppercase tracking-wider mb-2">
              Scheduled Obligations on Day {activeDayData.day}:
            </span>
            {activeDayData.commitmentsDue.length > 0 ? (
              <div className="space-y-2">
                {activeDayData.commitmentsDue.map((comm) => (
                  <div
                    key={comm.id}
                    className="p-3 rounded-xl bg-amber-50/60 border border-amber-200 flex items-center justify-between"
                  >
                    <div>
                      <div className="text-xs font-bold text-zinc-900">{comm.name}</div>
                      <div className="text-[11px] text-zinc-500">
                        {comm.category} · Due Day {comm.dueDay}
                      </div>
                    </div>
                    <span className="font-mono font-bold text-xs text-amber-700">
                      -{formatINR(comm.amount)}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-3.5 rounded-xl bg-zinc-50 border border-zinc-200 text-xs text-zinc-500 font-medium">
                No essential commitments due on Day {activeDayData.day}.
              </div>
            )}
          </div>
        </div>

        {/* 30-Day Day Picker Matrix */}
        <div className="lg:col-span-7 p-6 rounded-2xl bg-white border border-zinc-200/80 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-wider">
              30-Day Timeline Matrix
            </h3>
            <span className="text-xs text-zinc-400 font-mono">
              Click any day to jump
            </span>
          </div>

          <div className="grid grid-cols-6 sm:grid-cols-10 gap-1.5">
            {forecastData.map((d) => {
              const hasComm = d.commitmentsDue.length > 0;
              const isSelected = d.day === selectedDay;

              return (
                <button
                  key={d.day}
                  onClick={() => setSelectedDay(d.day)}
                  className={`p-2 rounded-xl text-center text-xs transition-all relative flex flex-col items-center justify-center cursor-pointer ${
                    isSelected
                      ? "bg-blue-600 text-white font-bold shadow-sm scale-105"
                      : "bg-zinc-50 text-zinc-700 hover:text-zinc-950 border border-zinc-200/70 hover:border-zinc-300 hover:bg-zinc-100"
                  }`}
                >
                  <span className="font-mono text-[11px]">D{d.day}</span>
                  {hasComm && (
                    <span
                      className={`w-1.5 h-1.5 rounded-full mt-1 ${
                        isSelected ? "bg-white" : "bg-amber-500"
                      }`}
                    />
                  )}
                </button>
              );
            })}
          </div>

          <div className="pt-3 border-t border-zinc-100 text-xs text-zinc-500 flex items-center justify-between font-medium">
            <span>Dot indicator denotes an upcoming scheduled bill due on that day.</span>
            <span className="font-mono text-blue-600 font-semibold">100% Client-Side Engine</span>
          </div>
        </div>
      </div>
    </div>
  );
}
