import { NextResponse } from "next/server";
import { CACHE_TTL_MS, getCache, setCache, type CommodityQuote } from "./cache";

export const dynamic = "force-dynamic";

const CHART_ENDPOINT = "https://query1.finance.yahoo.com/v8/finance/chart/";

const SYMBOLS: Array<{ symbol: string; label: string }> = [
  { symbol: "CL=F", label: "PETRÓLEO (WTI)" },
  { symbol: "BZ=F", label: "PETRÓLEO (BRENT)" },
  { symbol: "GC=F", label: "OURO" },
  { symbol: "SI=F", label: "PRATA" },
  { symbol: "NG=F", label: "GÁS NATURAL" },
  { symbol: "ZW=F", label: "TRIGO" },
  { symbol: "ZC=F", label: "MILHO" },
  { symbol: "HG=F", label: "COBRE" },
];

type ChartResponse = {
  chart?: {
    result?: Array<{
      meta?: {
        regularMarketPrice?: number;
        previousClose?: number;
        chartPreviousClose?: number;
      };
    }>;
  };
};

async function fetchQuote(symbol: string, label: string): Promise<CommodityQuote> {
  try {
    const response = await fetch(
      `${CHART_ENDPOINT}${encodeURIComponent(symbol)}?interval=1d&range=1d&_=${Date.now()}`,
      { headers: { "User-Agent": "Mozilla/5.0" }, cache: "no-store" },
    );

    if (!response.ok) {
      return { symbol, label, price: null, changePercent: null };
    }

    const payload = (await response.json()) as ChartResponse;
    const meta = payload.chart?.result?.[0]?.meta;

    const price = typeof meta?.regularMarketPrice === "number" ? meta.regularMarketPrice : null;
    const prevClose =
      typeof meta?.previousClose === "number"
        ? meta.previousClose
        : typeof meta?.chartPreviousClose === "number"
          ? meta.chartPreviousClose
          : null;

    const changePercent =
      price !== null && prevClose ? ((price - prevClose) / prevClose) * 100 : null;

    return { symbol, label, price, changePercent };
  } catch (error) {
    console.warn(`Commodity quote fetch failed for ${symbol}:`, error);
    return { symbol, label, price: null, changePercent: null };
  }
}

export async function GET() {
  const now = Date.now();
  const cache = getCache();

  if (cache && now - cache.updatedAt < CACHE_TTL_MS) {
    return NextResponse.json({
      quotes: cache.quotes,
      updatedAt: new Date(cache.updatedAt).toISOString(),
    });
  }

  const quotes = await Promise.all(SYMBOLS.map((s) => fetchQuote(s.symbol, s.label)));
  setCache({ quotes, updatedAt: now });

  return NextResponse.json({ quotes, updatedAt: new Date(now).toISOString() });
}
