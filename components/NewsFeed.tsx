"use client";

import { useState } from "react";
import type { ConflictEvent } from "@/lib/types";
import { filterBySeverity, type SeverityFilterValue } from "@/lib/filterEvents";
import { EventCard } from "./EventCard";

const FILTERS: SeverityFilterValue[] = ["all", "critical", "high", "medium", "low"];

const FILTER_LABEL: Record<SeverityFilterValue, string> = {
  all: "TODOS",
  critical: "CRÍTICO",
  high: "ALTO",
  medium: "MÉDIO",
  low: "BAIXO",
};

export function NewsFeed({
  events,
  selectedId,
  onSelect,
}: {
  events: ConflictEvent[];
  selectedId: string | null;
  onSelect: (event: ConflictEvent) => void;
}) {
  const [filter, setFilter] = useState<SeverityFilterValue>("all");
  const filtered = filterBySeverity(events, filter);

  return (
    <aside className="flex h-full w-96 flex-col border-l border-panel-border bg-panel">
      <div className="flex gap-1 border-b border-panel-border p-2 text-xs">
        {FILTERS.map((value) => (
          <button
            key={value}
            type="button"
            onClick={() => setFilter(value)}
            className={`rounded px-2 py-1 uppercase ${
              filter === value ? "bg-panel-border" : "opacity-60"
            }`}
          >
            {FILTER_LABEL[value]}
          </button>
        ))}
      </div>
      <div className="flex-1 overflow-y-auto">
        {filtered.map((event) => (
          <EventCard
            key={event.id}
            event={event}
            selected={event.id === selectedId}
            onSelect={onSelect}
          />
        ))}
        {filtered.length === 0 && (
          <p className="p-4 text-center text-sm opacity-50">Nenhum evento corresponde a este filtro.</p>
        )}
      </div>
    </aside>
  );
}
