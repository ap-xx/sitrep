"use client";

import { useEffect, useState } from "react";
import type { ConflictEvent, Severity } from "@/lib/types";
import { computeCountryStats } from "@/lib/countryStats";

const SEVERITY_LABEL: Record<Severity, string> = {
  low: "BAIXO",
  medium: "MÉDIO",
  high: "ALTO",
  critical: "CRÍTICO",
};

const SEVERITY_TEXT_CLASS: Record<Severity, string> = {
  low: "text-severity-low",
  medium: "text-severity-medium",
  high: "text-severity-high",
  critical: "text-severity-critical",
};

type CountrySummary = {
  name: string | null;
  extract: string | null;
};

export function CountryPanel({
  countryName,
  events,
  onClose,
}: {
  countryName: string;
  events: ConflictEvent[];
  onClose: () => void;
}) {
  const [summary, setSummary] = useState<CountrySummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setSummary(null);

    fetch(`/api/country?name=${encodeURIComponent(countryName)}`)
      .then((res) => res.json())
      .then((body: CountrySummary) => {
        if (!cancelled) setSummary(body);
      })
      .catch(() => {
        if (!cancelled) setSummary(null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [countryName]);

  const stats = computeCountryStats(events, countryName);
  const displayName = summary?.name ?? countryName;

  return (
    <div className="absolute right-4 top-4 z-40 w-80 border border-panel-border bg-panel/95 p-4 text-sm">
      <div className="flex items-center justify-between border-b border-panel-border pb-2">
        <span className="text-glow font-bold uppercase tracking-wide">{displayName}</span>
        <button
          type="button"
          onClick={onClose}
          aria-label="Fechar painel do país"
          className="opacity-70 hover:opacity-100"
        >
          ✕
        </button>
      </div>
      <p className="mt-2 opacity-80">
        {loading ? "Carregando…" : (summary?.extract ?? "Nenhum resumo disponível.")}
      </p>
      <div className="mt-2 flex items-center justify-between border-t border-panel-border pt-2 text-xs opacity-80">
        <span>EVENTOS RASTREADOS: {stats.eventCount}</span>
        {stats.dominantSeverity && (
          <span className={SEVERITY_TEXT_CLASS[stats.dominantSeverity]}>
            {SEVERITY_LABEL[stats.dominantSeverity]}
          </span>
        )}
      </div>
    </div>
  );
}
