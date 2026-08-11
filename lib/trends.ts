import type { ConflictEvent, Severity } from "./types";
import { SEVERITY_RANK, dominantSeverityOf } from "./countryStats";

export type CountryTrend = {
  country: string;
  eventCount: number;
  dominantSeverity: Severity;
  lat: number;
  lng: number;
};

export function computeCountryTrends(
  events: ConflictEvent[],
  limit = 10,
): CountryTrend[] {
  const byCountry = new Map<string, ConflictEvent[]>();

  for (const event of events) {
    const list = byCountry.get(event.country) ?? [];
    list.push(event);
    byCountry.set(event.country, list);
  }

  const trends: CountryTrend[] = Array.from(byCountry.entries()).map(([country, list]) => ({
    country,
    eventCount: list.length,
    dominantSeverity: dominantSeverityOf(list),
    lat: list.reduce((sum, e) => sum + e.lat, 0) / list.length,
    lng: list.reduce((sum, e) => sum + e.lng, 0) / list.length,
  }));

  return trends
    .sort((a, b) => {
      if (b.eventCount !== a.eventCount) return b.eventCount - a.eventCount;
      return SEVERITY_RANK[b.dominantSeverity] - SEVERITY_RANK[a.dominantSeverity];
    })
    .slice(0, limit);
}
