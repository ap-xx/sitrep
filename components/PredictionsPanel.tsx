"use client";

import { useEffect, useState } from "react";

type PredictionMarket = {
  id: string;
  question: string;
  probability: number;
  volume24hr: number;
  endDate: string | null;
  url: string;
};

function formatVolume(volume: number): string {
  if (volume >= 1_000_000) return `$${(volume / 1_000_000).toFixed(1)}M`;
  if (volume >= 1_000) return `$${(volume / 1_000).toFixed(0)}K`;
  return `$${volume.toFixed(0)}`;
}

export function PredictionsPanel() {
  const [markets, setMarkets] = useState<PredictionMarket[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const response = await fetch("/api/predictions");
        const body = (await response.json()) as { markets: PredictionMarket[] };
        if (!cancelled) setMarkets(body.markets);
      } catch {
        // Best-effort panel; leave previous markets (if any) visible on failure.
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="flex-1 overflow-y-auto p-6">
      <h2 className="text-glow mb-1 text-lg font-bold uppercase tracking-wide">
        Previsões — Polymarket
      </h2>
      <p className="mb-4 text-xs opacity-60">
        Mercados de previsão pública ligados a conflitos e geopolítica, ordenados por volume nas
        últimas 24h.
      </p>

      {loading && <p className="text-sm opacity-50">Carregando…</p>}
      {!loading && markets.length === 0 && (
        <p className="text-sm opacity-50">Nenhum mercado relevante disponível no momento.</p>
      )}

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        {markets.map((market) => (
          <a
            key={market.id}
            href={market.url}
            target="_blank"
            rel="noreferrer"
            className="block border border-panel-border bg-panel p-3 hover:bg-panel-border/30"
          >
            <p className="text-sm">{market.question}</p>
            <div className="mt-2 h-2 w-full overflow-hidden rounded bg-panel-border">
              <div
                className="h-full bg-phosphor"
                style={{ width: `${market.probability}%` }}
              />
            </div>
            <div className="mt-1 flex items-center justify-between text-xs opacity-70">
              <span className="text-glow font-bold">{market.probability}% SIM</span>
              <span>VOL 24H: {formatVolume(market.volume24hr)}</span>
            </div>
          </a>
        ))}
      </div>
    </div>
  );
}
