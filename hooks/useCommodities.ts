"use client";

import { useEffect, useState } from "react";

const POLL_INTERVAL_MS = 5 * 60 * 1000;

export type CommodityQuote = {
  symbol: string;
  label: string;
  price: number | null;
  changePercent: number | null;
};

export function useCommodities(): CommodityQuote[] {
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
        // Best-effort; leave the previous quotes (if any) visible on failure.
      }
    }

    load();
    const interval = setInterval(load, POLL_INTERVAL_MS);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  return quotes;
}
