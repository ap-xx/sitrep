import type { ConflictEvent, Severity } from "./types";

export const SEVERITY_RANK: Record<Severity, number> = {
  low: 0,
  medium: 1,
  high: 2,
  critical: 3,
};

export function dominantSeverityOf(events: ConflictEvent[]): Severity {
  return events.reduce<Severity>(
    (worst, event) =>
      SEVERITY_RANK[event.severity] > SEVERITY_RANK[worst] ? event.severity : worst,
    events[0].severity,
  );
}

export type CountryStats = {
  eventCount: number;
  dominantSeverity: Severity | null;
};

export function computeCountryStats(
  events: ConflictEvent[],
  countryName: string,
): CountryStats {
  const matches = events.filter(
    (event) => event.country.toLowerCase() === countryName.toLowerCase(),
  );

  if (matches.length === 0) {
    return { eventCount: 0, dominantSeverity: null };
  }

  return { eventCount: matches.length, dominantSeverity: dominantSeverityOf(matches) };
}
