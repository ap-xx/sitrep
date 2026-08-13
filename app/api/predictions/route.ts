import { NextResponse } from "next/server";
import { fetchPredictionMarkets } from "@/lib/predictions";
import { CACHE_TTL_MS, getCache, setCache } from "./cache";

export const dynamic = "force-dynamic";

export async function GET() {
  const now = Date.now();
  const cache = getCache();

  if (cache && now - cache.updatedAt < CACHE_TTL_MS) {
    return NextResponse.json({
      markets: cache.markets,
      updatedAt: new Date(cache.updatedAt).toISOString(),
    });
  }

  try {
    const markets = await fetchPredictionMarkets();
    setCache({ markets, updatedAt: now });

    return NextResponse.json({ markets, updatedAt: new Date(now).toISOString() });
  } catch (error) {
    console.warn("Polymarket fetch failed:", error);

    if (cache) {
      return NextResponse.json({
        markets: cache.markets,
        updatedAt: new Date(cache.updatedAt).toISOString(),
      });
    }

    return NextResponse.json(
      { markets: [], updatedAt: new Date(now).toISOString() },
      { status: 503 },
    );
  }
}
