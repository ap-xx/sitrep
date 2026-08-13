import type { PredictionMarket } from "@/lib/predictions";

export const CACHE_TTL_MS = 10 * 60 * 1000;

let cache: { markets: PredictionMarket[]; updatedAt: number } | null = null;

export function getCache() {
  return cache;
}

export function setCache(newCache: { markets: PredictionMarket[]; updatedAt: number }) {
  cache = newCache;
}

export function resetCacheForTests() {
  cache = null;
}
