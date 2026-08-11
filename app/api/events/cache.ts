import type { ConflictEvent } from "@/lib/types";

export const CACHE_TTL_MS = 10 * 60 * 1000;

let cache: { events: ConflictEvent[]; updatedAt: number } | null = null;

export function getCache() {
  return cache;
}

export function setCache(newCache: { events: ConflictEvent[]; updatedAt: number }) {
  cache = newCache;
}

export function resetCacheForTests() {
  cache = null;
}
