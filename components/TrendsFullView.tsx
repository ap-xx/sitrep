"use client";

import type { ConflictEvent, Severity } from "@/lib/types";
import { computeCountryTrends } from "@/lib/trends";

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

export function TrendsFullView({
  events,
  onViewOnMap,
}: {
  events: ConflictEvent[];
  onViewOnMap: (country: string, lat: number, lng: number) => void;
}) {
  const trends = computeCountryTrends(events, 20);

  return (
    <div className="flex-1 overflow-y-auto p-6">
      <h2 className="text-glow mb-1 text-lg font-bold uppercase tracking-wide">
        Tendências de Conflito
      </h2>
      <p className="mb-4 text-xs opacity-60">
        Países com mais eventos rastreados nas últimas 24h.
      </p>

      {trends.length === 0 && <p className="text-sm opacity-50">Nenhum dado disponível no momento.</p>}

      {trends.length > 0 && (
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-panel-border text-xs opacity-60">
              <th className="py-2 font-normal">#</th>
              <th className="font-normal">PAÍS</th>
              <th className="font-normal">EVENTOS</th>
              <th className="font-normal">SEVERIDADE</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {trends.map((trend, index) => (
              <tr key={trend.country} className="border-b border-panel-border/50">
                <td className="py-2 opacity-60">{index + 1}</td>
                <td>{trend.country}</td>
                <td>{trend.eventCount}</td>
                <td className={SEVERITY_TEXT_CLASS[trend.dominantSeverity]}>
                  {SEVERITY_LABEL[trend.dominantSeverity]}
                </td>
                <td>
                  <button
                    type="button"
                    onClick={() => onViewOnMap(trend.country, trend.lat, trend.lng)}
                    className="text-xs underline opacity-70 hover:opacity-100"
                  >
                    VER NO MAPA
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
