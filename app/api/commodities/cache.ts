export const CACHE_TTL_MS = 5 * 60 * 1000;

export type CommodityQuote = {
  symbol: string;
  label: string;
  price: number | null;
  changePercent: number | null;
};

let cache: { quotes: CommodityQuote[]; updatedAt: number } | null = null;

export function getCache() {
  return cache;
}

export function setCache(newCache: { quotes: CommodityQuote[]; updatedAt: number }) {
  cache = newCache;
}

export function resetCacheForTests() {
  cache = null;
}
