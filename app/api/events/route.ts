import { NextResponse } from "next/server";
import { fetchAcledEvents } from "@/lib/acled";
import { fetchGdeltEvents } from "@/lib/gdelt";
import { refineWithClaude } from "@/lib/refineWithClaude";
import type { ConflictEvent } from "@/lib/types";

const CACHE_TTL_MS = 10 * 60 * 1000;

let cache: { events: ConflictEvent[]; updatedAt: number } | null = null;

export async function GET() {
  const now = Date.now();

  if (cache && now - cache.updatedAt < CACHE_TTL_MS) {
    return NextResponse.json({
      events: cache.events,
      stale: false,
      updatedAt: new Date(cache.updatedAt).toISOString(),
    });
  }

  const [acledResult, gdeltResult] = await Promise.allSettled([
    fetchAcledEvents(),
    fetchGdeltEvents(),
  ]);

  const fetched: ConflictEvent[] = [
    ...(acledResult.status === "fulfilled" ? acledResult.value : []),
    ...(gdeltResult.status === "fulfilled" ? gdeltResult.value : []),
  ];

  if (acledResult.status === "rejected") {
    console.error("ACLED fetch failed:", acledResult.reason);
  }
  if (gdeltResult.status === "rejected") {
    console.error("GDELT fetch failed:", gdeltResult.reason);
  }

  const bothFailed =
    acledResult.status === "rejected" && gdeltResult.status === "rejected";

  if (bothFailed) {
    if (cache) {
      return NextResponse.json({
        events: cache.events,
        stale: true,
        updatedAt: new Date(cache.updatedAt).toISOString(),
      });
    }
    return NextResponse.json(
      { events: [], stale: true, updatedAt: new Date(now).toISOString() },
      { status: 503 },
    );
  }

  const refined = await refineWithClaude(fetched);

  cache = { events: refined, updatedAt: now };

  return NextResponse.json({
    events: refined,
    stale: false,
    updatedAt: new Date(now).toISOString(),
  });
}

export function __resetCacheForTests() {
  cache = null;
}
