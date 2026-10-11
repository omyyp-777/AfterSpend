/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { DayForecast } from "../types/finance";
import { formatINR } from "../services/financeCalculations";

interface ForecastChartProps {
  data: DayForecast[];
  selectedDay?: number;
  onSelectDay?: (day: number) => void;
  height?: number;
  showScenario?: boolean;
}

export default function ForecastChart({
  data,
  selectedDay,
  onSelectDay,
  height = 240,
  showScenario = true
}: ForecastChartProps) {
  const [hoveredDay, setHoveredDay] = useState<number | null>(null);

  if (!data || data.length === 0) return null;

  const paddingLeft = 50;
  const paddingRight = 20;
  const paddingTop = 25;
  const paddingBottom = 35;
  const svgWidth = 800;
  const svgHeight = height;

  const innerWidth = svgWidth - paddingLeft - paddingRight;
  const innerHeight = svgHeight - paddingTop - paddingBottom;

  // Max and min value for Y axis
  const maxVal = Math.max(
    10000,
    ...data.map((d) => Math.max(d.projectedBalance, d.scenarioBalance ?? 0))
  );
  const minVal = 0;
  const valRange = maxVal - minVal || 1;

  const getX = (day: number) => {
    return paddingLeft + ((day - 1) / (data.length - 1)) * innerWidth;
  };

  const getY = (val: number) => {
    const clamped = Math.max(minVal, Math.min(maxVal, val));
    return paddingTop + innerHeight - ((clamped - minVal) / valRange) * innerHeight;
  };

  // Build path for base projected balance
  const basePoints = data.map((d) => `${getX(d.day)},${getY(d.projectedBalance)}`);
  const basePathD = `M ${basePoints.join(" L ")}`;
  const baseAreaD = `${basePathD} L ${getX(data[data.length - 1].day)},${getY(0)} L ${getX(data[0].day)},${getY(0)} Z`;

  // Build path for scenario if available
  const hasScenario = showScenario && data.some((d) => d.scenarioBalance !== undefined);
  let scenarioPathD = "";
  if (hasScenario) {
    const scenarioPoints = data.map(
      (d) => `${getX(d.day)},${getY(d.scenarioBalance ?? d.projectedBalance)}`
    );
    scenarioPathD = `M ${scenarioPoints.join(" L ")}`;
  }

  // Active day to display tooltip for
  const activeDayNum = hoveredDay ?? selectedDay ?? data[0]?.day;
  const activePoint = data.find((d) => d.day === activeDayNum);

  // Y-axis grid markers
  const yTicks = [10000, 7500, 5000, 2500, 0];

  return (
    <div className="relative w-full overflow-hidden select-none">
      <svg
        viewBox={`0 0 ${svgWidth} ${svgHeight}`}
        className="w-full h-auto overflow-visible"
        style={{ minHeight: `${height}px` }}
      >
        <defs>
          <linearGradient id="lightBaseGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#3B82F6" stopOpacity="0.18" />
            <stop offset="100%" stopColor="#3B82F6" stopOpacity="0.01" />
          </linearGradient>
          <linearGradient id="lightScenarioGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#EF4444" stopOpacity="0.15" />
            <stop offset="100%" stopColor="#EF4444" stopOpacity="0.0" />
          </linearGradient>
        </defs>

        {/* Horizontal grid lines & Y labels */}
        {yTicks.map((val) => {
          const y = getY(val);
          return (
            <g key={val}>
              <line
                x1={paddingLeft}
                y1={y}
                x2={svgWidth - paddingRight}
                y2={y}
                stroke="#E4E4E7"
                strokeDasharray={val === 0 ? "none" : "3 3"}
                strokeWidth={val === 0 ? "1.5" : "1"}
              />
              <text
                x={paddingLeft - 10}
                y={y + 4}
                textAnchor="end"
                className="text-[10px] fill-zinc-500 font-mono"
              >
                ₹{val >= 1000 ? `${val / 1000}k` : val}
              </text>
            </g>
          );
        })}

        {/* X-axis day labels (every 5 days) */}
        {data
          .filter((d) => d.day === 1 || d.day % 5 === 0 || d.day === data.length)
          .map((d) => {
            const x = getX(d.day);
            return (
              <text
                key={d.day}
                x={x}
                y={svgHeight - 10}
                textAnchor="middle"
                className={`text-[10px] font-mono ${
                  d.day === activeDayNum ? "fill-blue-600 font-bold" : "fill-zinc-500"
                }`}
              >
                Day {d.day}
              </text>
            );
          })}

        {/* Base Area & Line */}
        <path d={baseAreaD} fill="url(#lightBaseGradient)" />
        <path
          d={basePathD}
          fill="none"
          stroke="#2563EB"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Scenario Line (if active) */}
        {hasScenario && (
          <path
            d={scenarioPathD}
            fill="none"
            stroke="#DC2626"
            strokeWidth="2"
            strokeDasharray="4 4"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        )}

        {/* Commitment Due Marker indicators along timeline */}
        {data.map((d) => {
          if (d.commitmentsDue.length === 0) return null;
          const x = getX(d.day);
          const y = getY(d.projectedBalance);
          return (
            <g key={`comm-${d.day}`}>
              <circle
                cx={x}
                cy={y}
                r="4.5"
                fill="#D97706"
                stroke="#FFFFFF"
                strokeWidth="2"
                className="cursor-pointer"
                onClick={() => onSelectDay?.(d.day)}
              />
            </g>
          );
        })}

        {/* Active cursor line & point */}
        {activePoint && (
          <g>
            <line
              x1={getX(activePoint.day)}
              y1={paddingTop}
              x2={getX(activePoint.day)}
              y2={paddingTop + innerHeight}
              stroke="#A1A1AA"
              strokeDasharray="2 2"
              strokeWidth="1.5"
            />
            <circle
              cx={getX(activePoint.day)}
              cy={getY(activePoint.projectedBalance)}
              r="6"
              fill="#2563EB"
              stroke="#FFFFFF"
              strokeWidth="2.5"
            />
            {hasScenario && activePoint.scenarioBalance !== undefined && (
              <circle
                cx={getX(activePoint.day)}
                cy={getY(activePoint.scenarioBalance)}
                r="5"
                fill="#DC2626"
                stroke="#FFFFFF"
                strokeWidth="2"
              />
            )}
          </g>
        )}

        {/* Transparent hover capture rects for every day */}
        {data.map((d) => {
          const colWidth = innerWidth / data.length;
          const left = getX(d.day) - colWidth / 2;
          return (
            <rect
              key={`hit-${d.day}`}
              x={left}
              y={paddingTop}
              width={colWidth}
              height={innerHeight}
              fill="transparent"
              className="cursor-pointer"
              onMouseEnter={() => setHoveredDay(d.day)}
              onMouseLeave={() => setHoveredDay(null)}
              onClick={() => onSelectDay?.(d.day)}
            />
          );
        })}
      </svg>

      {/* Floating active point tooltip */}
      {activePoint && (
        <div
          className="absolute top-2 right-4 flex items-center gap-3 px-3.5 py-1.5 rounded-xl bg-white/95 border border-zinc-200 shadow-md backdrop-blur text-xs"
        >
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-600" />
            <span className="text-zinc-500 font-medium">Day {activePoint.day}:</span>
            <span className="font-mono font-bold text-zinc-900">
              {formatINR(activePoint.projectedBalance)}
            </span>
          </div>

          {hasScenario && activePoint.scenarioBalance !== undefined && (
            <div className="flex items-center gap-1.5 pl-2 border-l border-zinc-200">
              <span className="w-2.5 h-2.5 rounded-full bg-red-600" />
              <span className="text-zinc-500">Scenario:</span>
              <span className="font-mono font-bold text-red-600">
                {formatINR(activePoint.scenarioBalance)}
              </span>
            </div>
          )}

          {activePoint.commitmentsDue.length > 0 && (
            <div className="flex items-center gap-1 text-amber-600 font-medium text-[11px] pl-2 border-l border-zinc-200">
              <span>{activePoint.commitmentsDue.map((c) => c.name).join(", ")} Due</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
