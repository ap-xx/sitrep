"use client";

import { useEffect, useState } from "react";

const POLL_INTERVAL_MS = 5 * 60 * 1000;

type CommodityQuote = {
  symbol: string;
  label: string;
  price: number | null;
  changePercent: number | null;
};

export function CommoditiesTicker() {
  const [quotes, setQuotes] = useState<CommodityQuote[]>([]);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const response = await fetch("/api/commodities");
        if (!response.ok) return;
        const body = (await response.json()) as { quotes: CommodityQuote[] };
        if (!cancelled) setQuotes(body.quotes);
      } catch {
        // Best-effort ticker; leave the previous quotes (if any) visible on failure.
      }
    }

    load();
    const interval = setInterval(load, POLL_INTERVAL_MS);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  if (quotes.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-x-6 gap-y-1 border-b border-panel-border bg-panel px-4 py-1 text-xs">
      {quotes.map((quote) => (
        <span key={quote.symbol} className="flex items-center gap-1">
          <span className="opacity-70">{quote.label}</span>
          {quote.price !== null ? (
            <>
              <span>${quote.price.toFixed(2)}</span>
              {quote.changePercent !== null && (
                <span
                  className={quote.changePercent >= 0 ? "text-severity-low" : "text-severity-critical"}
                >
                  {quote.changePercent >= 0 ? "▲" : "▼"}
                  {Math.abs(quote.changePercent).toFixed(2)}%
                </span>
              )}
            </>
          ) : (
            <span className="opacity-50">—</span>
          )}
        </span>
      ))}
    </div>
  );
}
