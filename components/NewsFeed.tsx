"use client";

import { useState } from "react";
import type { ConflictEvent } from "@/lib/types";
import { filterBySeverity, type SeverityFilterValue } from "@/lib/filterEvents";
import { countRecentEvents } from "@/lib/recentEvents";
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
  soundEnabled,
  onToggleSound,
}: {
  events: ConflictEvent[];
  selectedId: string | null;
  onSelect: (event: ConflictEvent) => void;
  soundEnabled: boolean;
  onToggleSound: () => void;
}) {
  const [filter, setFilter] = useState<SeverityFilterValue>("all");
  const [collapsed, setCollapsed] = useState(false);
  const filtered = filterBySeverity(events, filter);
  const recentCount = countRecentEvents(events, 48);

  return (
    <aside className="absolute bottom-4 left-4 z-40 flex max-h-[60vh] w-80 flex-col border border-panel-border bg-panel/95">
      <div className="flex items-center justify-between border-b border-panel-border px-3 py-2">
        <span className="flex items-center gap-2 text-xs">
          <span className="h-2 w-2 rounded-full bg-severity-critical" />
          <span className="text-glow font-bold uppercase tracking-wide">Últimas Notícias</span>
        </span>
        <div className="flex items-center gap-2 text-xs opacity-80">
          <span className="rounded bg-panel-border px-1.5 py-0.5">
            48H · {recentCount}
          </span>
          <button
            type="button"
            onClick={onToggleSound}
            aria-label={soundEnabled ? "Silenciar alertas" : "Ativar som dos alertas"}
            className="opacity-70 hover:opacity-100"
          >
            {soundEnabled ? "🔔" : "🔕"}
          </button>
          <button
            type="button"
            onClick={() => setCollapsed((c) => !c)}
            aria-label={collapsed ? "Expandir painel" : "Recolher painel"}
            className="opacity-70 hover:opacity-100"
          >
            {collapsed ? "▼" : "▲"}
          </button>
        </div>
      </div>

      {!collapsed && (
        <>
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
              <p className="p-4 text-center text-sm opacity-50">
                Nenhum evento corresponde a este filtro.
              </p>
            )}
          </div>
        </>
      )}
    </aside>
  );
}
