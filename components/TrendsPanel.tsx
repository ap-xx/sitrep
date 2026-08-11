"use client";

import type { ConflictEvent, Severity } from "@/lib/types";
import { computeCountryTrends, type CountryTrend } from "@/lib/trends";

const SEVERITY_TEXT_CLASS: Record<Severity, string> = {
  low: "text-severity-low",
  medium: "text-severity-medium",
  high: "text-severity-high",
  critical: "text-severity-critical",
};

export function TrendsPanel({
  events,
  onSelect,
}: {
  events: ConflictEvent[];
  onSelect: (trend: CountryTrend) => void;
}) {
  const trends = computeCountryTrends(events, 10);

  if (trends.length === 0) return null;

  return (
    <div className="absolute left-4 top-4 z-40 w-64 border border-panel-border bg-panel/95 p-3 text-sm">
      <div className="border-b border-panel-border pb-2 text-glow font-bold uppercase tracking-wide">
        Top 10 — Tendências
      </div>
      <ol className="mt-2 space-y-1">
        {trends.map((trend, index) => (
          <li key={trend.country}>
            <button
              type="button"
              onClick={() => onSelect(trend)}
              className="flex w-full items-center justify-between gap-2 rounded px-1 py-0.5 text-left hover:bg-panel-border/40"
            >
              <span className="truncate opacity-90">
                {index + 1}. {trend.country}
              </span>
              <span className={`shrink-0 text-xs ${SEVERITY_TEXT_CLASS[trend.dominantSeverity]}`}>
                {trend.eventCount}
              </span>
            </button>
          </li>
        ))}
      </ol>
    </div>
  );
}
