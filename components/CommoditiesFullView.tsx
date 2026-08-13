"use client";

import { useCommodities } from "@/hooks/useCommodities";

export function CommoditiesFullView() {
  const quotes = useCommodities();

  return (
    <div className="flex-1 overflow-y-auto p-6">
      <h2 className="text-glow mb-1 text-lg font-bold uppercase tracking-wide">Commodities</h2>
      <p className="mb-4 text-xs opacity-60">
        Preços de mercado ligados a conflitos e crises — atualizado a cada poucos minutos.
      </p>

      {quotes.length === 0 && <p className="text-sm opacity-50">Carregando…</p>}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {quotes.map((quote) => (
          <div key={quote.symbol} className="border border-panel-border bg-panel p-4">
            <p className="text-xs opacity-60">{quote.label}</p>
            {quote.price !== null ? (
              <>
                <p className="text-glow text-2xl font-bold">${quote.price.toFixed(2)}</p>
                {quote.changePercent !== null && (
                  <p
                    className={
                      quote.changePercent >= 0 ? "text-severity-low" : "text-severity-critical"
                    }
                  >
                    {quote.changePercent >= 0 ? "▲" : "▼"} {Math.abs(quote.changePercent).toFixed(2)}%
                  </p>
                )}
              </>
            ) : (
              <p className="opacity-50">—</p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
