import type { ConflictEvent, Severity } from "./types";

const SEVERITY_RANK: Record<Severity, number> = {
  low: 0,
  medium: 1,
  high: 2,
  critical: 3,
};

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

  const dominantSeverity = matches.reduce<Severity>(
    (worst, event) =>
      SEVERITY_RANK[event.severity] > SEVERITY_RANK[worst] ? event.severity : worst,
    matches[0].severity,
  );

  return { eventCount: matches.length, dominantSeverity };
}
