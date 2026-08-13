"use client";

import { useCommodities } from "@/hooks/useCommodities";

export function CommoditiesTicker() {
  const quotes = useCommodities();

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
